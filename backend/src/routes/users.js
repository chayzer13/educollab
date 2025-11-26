const express = require('express');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Project = require('../models/Project');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Получить список пользователей
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [student, teacher, mentor]
 *     responses:
 *       200:
 *         description: Список пользователей
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { search, role } = req.query;
    const where = {};

    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (role) {
      where.role = role;
    }

    const users = await User.findAll({
      where,
      attributes: { exclude: ['password'] },
      limit: 100,
      order: [['lastActivity', 'DESC NULLS LAST'], ['createdAt', 'DESC']]
    });

    // Определяем статус онлайн/офлайн (онлайн если активность была менее 5 минут назад)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const usersWithStatus = users.map(user => {
      const userData = user.toJSON();
      userData.isOnline = userData.lastActivity ? new Date(userData.lastActivity) > fiveMinutesAgo : false;
      return userData;
    });

    res.json(usersWithStatus);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при получении списка пользователей', error: error.message });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Получить пользователя по ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Информация о пользователе
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const Team = require('../models/Team');
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Project,
          as: 'projects',
          attributes: ['id', 'title', 'status', 'progress', 'createdAt', 'updatedAt'],
          order: [['createdAt', 'DESC']]
        },
        {
          model: Team,
          as: 'teams',
          attributes: ['id', 'name', 'description', 'createdAt', 'updatedAt'],
          through: { attributes: ['createdAt'] }, // Дата присоединения к команде
          include: [
            { model: User, as: 'leader', attributes: ['id', 'firstName', 'lastName'] }
          ],
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Определяем статус онлайн/офлайн
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const userData = user.toJSON();
    userData.isOnline = userData.lastActivity ? new Date(userData.lastActivity) > fiveMinutesAgo : false;

    res.json(userData);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при получении информации о пользователе', error: error.message });
  }
});

/**
 * @swagger
 * /api/users/me/teams:
 *   get:
 *     summary: Получить команды текущего пользователя
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.get('/me/teams', authenticate, async (req, res) => {
  try {
    const Team = require('../models/Team');
    const user = await User.findByPk(req.user.id, {
      include: [{
        model: Team,
        as: 'teams',
        attributes: ['id', 'name', 'description', 'maxMembers', 'createdAt', 'updatedAt'],
        through: { attributes: ['createdAt'] },
        include: [
          { model: User, as: 'leader', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
          { model: User, as: 'members', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
          { model: Project, as: 'projects', attributes: ['id', 'title', 'status'] }
        ],
        order: [['createdAt', 'DESC']]
      }]
    });

    res.json(user.teams || []);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при получении команд пользователя', error: error.message });
  }
});

/**
 * @swagger
 * /api/users/me:
 *   put:
 *     summary: Обновить профиль текущего пользователя
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               bio:
 *                 type: string
 *     responses:
 *       200:
 *         description: Профиль обновлен
 *       400:
 *         description: Ошибка валидации
 */
router.put(
  '/me',
  authenticate,
  [
    body('firstName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Имя должно быть от 2 до 50 символов'),
    body('lastName').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Фамилия должна быть от 2 до 50 символов'),
    body('bio').optional().trim().isLength({ max: 500 }).withMessage('Биография не должна превышать 500 символов')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { firstName, lastName, bio } = req.body;
      const user = await User.findByPk(req.user.id);

      if (!user) {
        return res.status(404).json({ message: 'Пользователь не найден' });
      }

      const updateData = {};
      if (firstName !== undefined) updateData.firstName = firstName.trim();
      if (lastName !== undefined) updateData.lastName = lastName.trim();
      if (bio !== undefined) updateData.bio = bio.trim();

      await user.update(updateData);

      const updatedUser = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password'] }
      });

      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ message: 'Ошибка при обновлении профиля', error: error.message });
    }
  }
);

/**
 * @swagger
 * /api/users/me/avatar:
 *   post:
 *     summary: Загрузить аватар для текущего пользователя
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Аватар успешно загружен
 *       400:
 *         description: Ошибка валидации
 */
router.post(
  '/me/avatar',
  authenticate,
  upload.single('avatar'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Файл не был загружен' });
      }

      // Проверяем, что это изображение
      if (!req.file.mimetype.startsWith('image/')) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: 'Файл должен быть изображением' });
      }

      const user = await User.findByPk(req.user.id);

      if (!user) {
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ message: 'Пользователь не найден' });
      }

      // Удаляем старый аватар, если он есть
      if (user.avatar) {
        const oldAvatarPath = path.join(__dirname, '../../uploads', path.basename(user.avatar));
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }

      // Сохраняем путь к новому аватару
      const avatarUrl = `/uploads/${req.file.filename}`;
      await user.update({ avatar: avatarUrl });

      const updatedUser = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password'] }
      });

      res.json(updatedUser);
    } catch (error) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      console.error('Error uploading avatar:', error);
      res.status(500).json({ message: 'Ошибка при загрузке аватара', error: error.message });
    }
  }
);

/**
 * @swagger
 * /api/users/me:
 *   delete:
 *     summary: Удалить аккаунт текущего пользователя
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Аккаунт успешно удален
 *       403:
 *         description: Доступ запрещен
 *       500:
 *         description: Ошибка сервера
 */
router.delete('/me', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId, {
      include: [
        { model: Project, as: 'projects' },
        { model: require('../models/Team'), as: 'teams' }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Импортируем необходимые модели
    const Comment = require('../models/Comment');
    const Rating = require('../models/Rating');
    const Team = require('../models/Team');
    const TeamInvitation = require('../models/TeamInvitation');
    const Activity = require('../models/Activity');
    const ProjectFile = require('../models/ProjectFile');
    const Milestone = require('../models/Milestone');

    // Удаляем аватар пользователя
    if (user.avatar) {
      const avatarPath = path.join(__dirname, '../../uploads', path.basename(user.avatar));
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
    }

    // Удаляем все проекты пользователя (со всеми связанными данными)
    const userProjects = await Project.findAll({ where: { ownerId: userId } });
    for (const project of userProjects) {
      // Удаляем файлы проектов
      const projectFiles = await ProjectFile.findAll({ where: { projectId: project.id } });
      for (const file of projectFiles) {
        if (file.path) {
          const filePath = path.join(__dirname, '../../uploads', path.basename(file.path));
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      }
      
      // Удаляем связанные данные проекта
      await Comment.destroy({ where: { projectId: project.id } });
      await Rating.destroy({ where: { projectId: project.id } });
      await ProjectFile.destroy({ where: { projectId: project.id } });
      await Milestone.destroy({ where: { projectId: project.id } });
      await Activity.destroy({ where: { projectId: project.id } });
      await project.setTeams([]);
    }

    // Удаляем проекты пользователя
    await Project.destroy({ where: { ownerId: userId } });

    // Удаляем команды, где пользователь является лидером
    const teamsAsLeader = await Team.findAll({ where: { leaderId: userId } });
    for (const team of teamsAsLeader) {
      await team.setMembers([]);
      await team.setProjects([]);
      await TeamInvitation.destroy({ where: { teamId: team.id } });
      await Activity.destroy({ where: { teamId: team.id } });
      await team.destroy();
    }

    // Удаляем пользователя из всех команд, где он участник
    const teamsAsMember = await Team.findAll({
      include: [{
        model: User,
        as: 'members',
        where: { id: userId },
        attributes: []
      }]
    });
    for (const team of teamsAsMember) {
      await team.removeMember(user);
    }

    // Удаляем комментарии пользователя
    await Comment.destroy({ where: { userId } });

    // Удаляем оценки пользователя
    await Rating.destroy({ where: { userId } });

    // Удаляем приглашения пользователя
    await TeamInvitation.destroy({ where: { userId } });
    await TeamInvitation.destroy({ where: { invitedById: userId } });

    // Удаляем активности пользователя
    await Activity.destroy({ where: { userId } });

    // Удаляем самого пользователя
    await user.destroy();

    res.json({ message: 'Аккаунт успешно удален' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ message: 'Ошибка при удалении аккаунта', error: error.message });
  }
});

module.exports = router;

