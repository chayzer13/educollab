const express = require('express');
const { authenticate } = require('../middleware/auth');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');
const User = require('../models/User');
const Project = require('../models/Project');
const Team = require('../models/Team');
const Comment = require('../models/Comment');
const Rating = require('../models/Rating');
const ProjectFile = require('../models/ProjectFile');
const Milestone = require('../models/Milestone');
const Activity = require('../models/Activity');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Middleware для проверки прав администратора
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Доступ запрещен. Требуются права администратора.' });
  }
};

// Применяем аутентификацию и проверку прав администратора ко всем роутам
router.use(authenticate, requireAdmin);

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Получить статистику базы данных
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      totalProjects,
      totalTeams,
      totalComments,
      totalRatings,
      totalFiles,
      totalActivities
    ] = await Promise.all([
      User.count(),
      Project.count(),
      Team.count(),
      Comment.count(),
      Rating.count(),
      ProjectFile.count(),
      Activity.count()
    ]);

    // Статистика по ролям
    const usersByRole = await User.findAll({
      attributes: [
        'role',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['role'],
      raw: true
    });

    const roleStats = {};
    usersByRole.forEach(item => {
      roleStats[item.role] = parseInt(item.count);
    });

    // Статистика по статусам проектов
    const projectsByStatus = await Project.findAll({
      attributes: [
        'status',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    const statusStats = {};
    projectsByStatus.forEach(item => {
      statusStats[item.status] = parseInt(item.count);
    });

    res.json({
      users: {
        total: totalUsers,
        byRole: roleStats
      },
      projects: {
        total: totalProjects,
        byStatus: statusStats
      },
      teams: {
        total: totalTeams
      },
      comments: totalComments,
      ratings: totalRatings,
      files: totalFiles,
      activities: totalActivities
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при получении статистики', error: error.message });
  }
});

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Получить список всех пользователей
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 50, search, role } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where[Op.or] = [
        { email: { [Op.iLike]: `%${search}%` } },
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } }
      ];
    }
    if (role) {
      where.role = role;
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['password'] }
    });

    res.json({
      users: rows,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при получении списка пользователей', error: error.message });
  }
});

/**
 * @swagger
 * /api/admin/users/:id:
 *   delete:
 *     summary: Удалить пользователя
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    // Нельзя удалить самого себя
    if (userId === req.user.id) {
      return res.status(400).json({ message: 'Нельзя удалить свой собственный аккаунт' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Удаляем все связанные данные пользователя
    const userProjects = await Project.findAll({ where: { ownerId: userId } });
    const projectIds = userProjects.map(p => p.id);

    // Удаляем приглашения в проекты (где пользователь приглашен или пригласил)
    const ProjectInvitation = require('../models/ProjectInvitation');
    await ProjectInvitation.destroy({ 
      where: { 
        [Op.or]: [
          { userId },
          { invitedById: userId }
        ]
      } 
    });

    // Удаляем приглашения в команды (где пользователь приглашен или пригласил)
    const TeamInvitation = require('../models/TeamInvitation');
    // Сначала удаляем приглашения, где пользователь приглашен или пригласил
    await TeamInvitation.destroy({ 
      where: { 
        [Op.or]: [
          { userId },
          { invitedById: userId }
        ]
      } 
    });

    // Удаляем участников проектов (ProjectMembers)
    await sequelize.query('DELETE FROM "ProjectMembers" WHERE "UserId" = :userId', {
      replacements: { userId }
    });

    // Удаляем файлы проектов
    if (projectIds.length > 0) {
      const projectFiles = await ProjectFile.findAll({ where: { projectId: { [Op.in]: projectIds } } });
      for (const file of projectFiles) {
        const filePath = path.join(__dirname, '../../uploads', path.basename(file.path));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      await ProjectFile.destroy({ where: { projectId: { [Op.in]: projectIds } } });
      
      // Удаляем майлстоуны проектов
      await Milestone.destroy({ where: { projectId: { [Op.in]: projectIds } } });
      
      // Удаляем комментарии и оценки проектов
      await Comment.destroy({ where: { projectId: { [Op.in]: projectIds } } });
      await Rating.destroy({ where: { projectId: { [Op.in]: projectIds } } });
      
      // Удаляем активность проектов
      await Activity.destroy({ where: { projectId: { [Op.in]: projectIds } } });
      
      // Удаляем связи проектов с командами
      await sequelize.query('DELETE FROM "TeamProjects" WHERE "ProjectId" IN (:projectIds)', {
        replacements: { projectIds }
      });
    }

    // Удаляем проекты пользователя
    await Project.destroy({ where: { ownerId: userId } });

    // Удаляем комментарии и оценки пользователя
    await Comment.destroy({ where: { userId } });
    await Rating.destroy({ where: { userId } });

    // Удаляем активность пользователя
    await Activity.destroy({ where: { userId } });

    // Удаляем пользователя из команд
    await sequelize.query('DELETE FROM "TeamMembers" WHERE "UserId" = :userId', {
      replacements: { userId }
    });

    // Удаляем команды, где пользователь лидер
    const userTeams = await Team.findAll({ where: { leaderId: userId } });
    const teamIds = userTeams.map(t => t.id);
    if (teamIds.length > 0) {
      // Удаляем участников команд
      await sequelize.query('DELETE FROM "TeamMembers" WHERE "TeamId" IN (:teamIds)', {
        replacements: { teamIds }
      });
      // Удаляем связи команд с проектами
      await sequelize.query('DELETE FROM "TeamProjects" WHERE "TeamId" IN (:teamIds)', {
        replacements: { teamIds }
      });
      // Удаляем приглашения в команды
      await TeamInvitation.destroy({ where: { teamId: { [Op.in]: teamIds } } });
      // Удаляем команды
      await Team.destroy({ where: { id: { [Op.in]: teamIds } } });
    }

    // Удаляем аватар пользователя
    if (user.avatar) {
      const avatarPath = path.join(__dirname, '../../uploads', path.basename(user.avatar));
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
    }

    // Удаляем пользователя
    await user.destroy();

    res.json({ message: 'Пользователь успешно удален' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при удалении пользователя', error: error.message });
  }
});

/**
 * @swagger
 * /api/admin/users/:id/role:
 *   put:
 *     summary: Изменить роль пользователя
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.params.id;

    if (!role || !['student', 'teacher', 'mentor', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Некорректная роль' });
    }

    // Нельзя изменить роль самого себя
    if (userId === req.user.id) {
      return res.status(400).json({ message: 'Нельзя изменить свою собственную роль' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    await user.update({ role });
    
    // Обновляем объект user после изменения роли
    await user.reload();

    res.json({ message: 'Роль пользователя успешно изменена', user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при изменении роли', error: error.message });
  }
});

/**
 * @swagger
 * /api/admin/clear-db:
 *   post:
 *     summary: Очистить базу данных
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.post('/clear-db', async (req, res) => {
  try {
    const { confirm } = req.body;

    if (confirm !== 'CLEAR_ALL_DATA') {
      return res.status(400).json({ message: 'Требуется подтверждение для очистки базы данных' });
    }

    // Получаем всех администраторов перед очисткой (с аватарами)
    const adminUsers = await User.findAll({ 
      where: { role: 'admin' },
      attributes: ['id', 'avatar']
    });
    const adminIds = adminUsers.map(u => u.id);

    // Отключаем проверку внешних ключей временно
    await sequelize.query('SET session_replication_role = replica;');

    // Удаляем все данные, кроме администраторов
    const tables = [
      'TeamProjects',
      'TeamMembers',
      'team_invitations',
      'project_invitations',
      'activities',
      'milestones',
      'project_files',
      'ratings',
      'comments',
      'projects',
      'teams'
    ];

    for (const table of tables) {
      await sequelize.query(`TRUNCATE TABLE "${table}" CASCADE;`);
    }

    // Удаляем всех пользователей, кроме администраторов
    if (adminIds.length > 0) {
      await User.destroy({ 
        where: { 
          id: { [Op.notIn]: adminIds }
        } 
      });
    } else {
      // Если нет администраторов, удаляем всех пользователей
      await User.destroy({ where: {} });
    }

    // Включаем обратно проверку внешних ключей
    await sequelize.query('SET session_replication_role = DEFAULT;');

    // Очищаем папку uploads (кроме аватаров администраторов)
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (fs.existsSync(uploadsDir)) {
      // Собираем список файлов аватаров администраторов
      const adminAvatarFiles = new Set();
      for (const admin of adminUsers) {
        if (admin.avatar) {
          const avatarFileName = path.basename(admin.avatar);
          adminAvatarFiles.add(avatarFileName);
        }
      }
      
      const files = fs.readdirSync(uploadsDir);
      for (const file of files) {
        const filePath = path.join(uploadsDir, file);
        if (fs.lstatSync(filePath).isFile()) {
          // Проверяем, не является ли файл аватаром администратора
          if (!adminAvatarFiles.has(file)) {
            try {
              fs.unlinkSync(filePath);
            } catch (fileError) {
              console.error(`Ошибка при удалении файла ${filePath}:`, fileError);
            }
          }
        }
      }
    }

    res.json({ 
      message: 'База данных успешно очищена. Администраторы сохранены.',
      preservedAdmins: adminIds.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при очистке базы данных', error: error.message });
  }
});

/**
 * @swagger
 * /api/admin/projects/:id:
 *   delete:
 *     summary: Удалить проект (админ)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/projects/:id', async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Проект не найден' });
    }

    // Получаем все файлы проекта для удаления с диска
    const projectFiles = await ProjectFile.findAll({ where: { projectId: project.id } });
    
    // Удаляем файлы с диска
    for (const file of projectFiles) {
      const filePath = path.join(__dirname, '../../uploads', path.basename(file.path));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Удаляем все связанные данные
    await ProjectFile.destroy({ where: { projectId: project.id } });
    await Comment.destroy({ where: { projectId: project.id } });
    await Rating.destroy({ where: { projectId: project.id } });
    await Milestone.destroy({ where: { projectId: project.id } });
    await Activity.destroy({ where: { projectId: project.id } });
    
    // Удаляем связи с командами
    await sequelize.query('DELETE FROM "TeamProjects" WHERE "ProjectId" = :projectId', {
      replacements: { projectId: project.id }
    });

    // Удаляем проект
    await project.destroy();

    res.json({ message: 'Проект успешно удален' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при удалении проекта', error: error.message });
  }
});

/**
 * @swagger
 * /api/admin/teams/:id:
 *   delete:
 *     summary: Удалить команду (админ)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/teams/:id', async (req, res) => {
  try {
    const team = await Team.findByPk(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Команда не найдена' });
    }

    // Удаляем связи с проектами
    await sequelize.query('DELETE FROM "TeamProjects" WHERE "TeamId" = :teamId', {
      replacements: { teamId: team.id }
    });

    // Удаляем участников
    await sequelize.query('DELETE FROM "TeamMembers" WHERE "TeamId" = :teamId', {
      replacements: { teamId: team.id }
    });

    // Удаляем приглашения
    await sequelize.query('DELETE FROM "team_invitations" WHERE "teamId" = :teamId', {
      replacements: { teamId: team.id }
    });

    // Удаляем команду
    await team.destroy();

    res.json({ message: 'Команда успешно удалена' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при удалении команды', error: error.message });
  }
});

module.exports = router;

