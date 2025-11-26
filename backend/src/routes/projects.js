const express = require('express');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const Project = require('../models/Project');
const User = require('../models/User');
const Comment = require('../models/Comment');
const Rating = require('../models/Rating');
const Team = require('../models/Team');
const ProjectFile = require('../models/ProjectFile');
const Milestone = require('../models/Milestone');
const Activity = require('../models/Activity');
const ProjectInvitation = require('../models/ProjectInvitation');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');
const { logActivity } = require('../services/activityLogger');
const { hasProjectAccess } = require('../utils/accessControl');

const router = express.Router();

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Получить список проектов
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: ownerId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Список проектов
 */
// Allow fetching public projects without authentication for home page
router.get('/', optionalAuthenticate, async (req, res) => {
  try {
    const { status, search, ownerId, visibility } = req.query;
    const where = {};

    if (status) {
      where.status = status;
    }

    if (ownerId) {
      where.ownerId = ownerId;
    }

    // Фильтрация по видимости: показываем публичные или приватные проекты пользователя
    // Если пользователь не авторизован, показываем только публичные проекты
    if (req.user) {
      if (visibility === 'private') {
        // Для приватных проектов нужно получить все проекты и отфильтровать по доступу
        where[Op.or] = [
          { visibility: 'public' }
        ];
      } else {
        // По умолчанию показываем публичные проекты
        where[Op.or] = [
          { visibility: 'public' }
        ];
      }
    } else {
      // Для неавторизованных пользователей показываем только публичные проекты
      where.visibility = 'public';
    }

    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const projects = await Project.findAll({
      where,
      include: [
        { model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
        { model: Rating, as: 'ratings', attributes: ['value'] },
        {
          model: Team,
          as: 'teams',
          attributes: ['id', 'name'],
          through: { attributes: [] }
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 100, // Увеличиваем лимит для фильтрации
      attributes: { include: ['createdAt', 'updatedAt'] }
    });

    // Фильтруем проекты по доступу для авторизованных пользователей
    let accessibleProjects = projects;
    if (req.user) {
      accessibleProjects = [];
      for (const project of projects) {
        const hasAccess = await hasProjectAccess(project, req.user);
        if (hasAccess) {
          accessibleProjects.push(project);
        }
      }
      // Применяем фильтр по видимости если указан
      if (visibility === 'private') {
        accessibleProjects = accessibleProjects.filter(p => p.visibility === 'private');
      }
      // Ограничиваем количество результатов
      accessibleProjects = accessibleProjects.slice(0, 50);
    }

    // Calculate average rating
    const projectsWithRating = accessibleProjects.map(project => {
      const ratings = project.ratings || [];
      const avgRating = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.value, 0) / ratings.length
        : 0;

      const projectData = project.toJSON();
      projectData.averageRating = avgRating;
      projectData.ratingCount = ratings.length;
      delete projectData.ratings;

      return projectData;
    });

    res.json(projectsWithRating);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при получении списка проектов', error: error.message });
  }
});

/**
 * @swagger
 * /api/projects/invitations:
 *   get:
 *     summary: Получить список приглашений в проекты
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 */
router.get('/invitations', authenticate, async (req, res) => {
  try {
    const invitations = await ProjectInvitation.findAll({
      where: {
        userId: req.user.id,
        status: 'pending'
      },
      include: [
        { model: Project, as: 'project', attributes: ['id', 'title', 'description'] },
        { model: User, as: 'invitedBy', attributes: ['id', 'firstName', 'lastName', 'avatar'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(invitations);
  } catch (error) {
    console.error('Error fetching project invitations:', error);
    res.status(500).json({ message: 'Ошибка при получении приглашений', error: error.message });
  }
});

/**
 * @swagger
 * /api/projects/invitations/all:
 *   get:
 *     summary: Получить всю историю приглашений в проекты
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 */
router.get('/invitations/all', authenticate, async (req, res) => {
  try {
    const invitations = await ProjectInvitation.findAll({
      where: {
        userId: req.user.id
      },
      include: [
        { model: Project, as: 'project', attributes: ['id', 'title', 'description'] },
        { model: User, as: 'invitedBy', attributes: ['id', 'firstName', 'lastName', 'avatar'] }
      ],
      order: [['updatedAt', 'DESC']]
    });

    res.json(invitations);
  } catch (error) {
    console.error('Error fetching project invitations history:', error);
    res.status(500).json({ message: 'Ошибка при получении истории приглашений', error: error.message });
  }
});

/**
 * @swagger
 * /api/projects/invitations/{id}/accept:
 *   post:
 *     summary: Принять приглашение в проект
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 */
router.post('/invitations/:id/accept', authenticate, async (req, res) => {
  try {
    const invitation = await ProjectInvitation.findByPk(req.params.id, {
      include: [
        { model: Project, as: 'project' },
        { model: User, as: 'user' }
      ]
    });

    if (!invitation) {
      return res.status(404).json({ message: 'Приглашение не найдено' });
    }

    if (invitation.userId !== req.user.id) {
      return res.status(403).json({ message: 'Вы не можете принять это приглашение' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: 'Приглашение уже обработано' });
    }

    // Добавляем пользователя в проект
    const project = invitation.project;
    const members = await project.getMembers();
    if (!members.some(m => m.id === req.user.id)) {
      await project.addMember(req.user);
    }

    // Обновляем статус приглашения
    await invitation.update({ status: 'accepted' });

    // Логируем принятие приглашения
    await logActivity({
      type: 'project_invitation_accepted',
      description: `Пользователь ${req.user.firstName} ${req.user.lastName} принял приглашение в проект "${project.title}"`,
      userId: req.user.id,
      projectId: project.id,
      metadata: {
        projectTitle: project.title,
        invitedById: invitation.invitedById
      }
    });

    res.json({ message: 'Приглашение принято', invitation });
  } catch (error) {
    console.error('Error accepting project invitation:', error);
    res.status(500).json({ message: 'Ошибка при принятии приглашения', error: error.message });
  }
});

/**
 * @swagger
 * /api/projects/invitations/{id}/reject:
 *   post:
 *     summary: Отклонить приглашение в проект
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 */
router.post('/invitations/:id/reject', authenticate, async (req, res) => {
  try {
    const invitation = await ProjectInvitation.findByPk(req.params.id, {
      include: [
        { model: Project, as: 'project' }
      ]
    });

    if (!invitation) {
      return res.status(404).json({ message: 'Приглашение не найдено' });
    }

    if (invitation.userId !== req.user.id) {
      return res.status(403).json({ message: 'Вы не можете отклонить это приглашение' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: 'Приглашение уже обработано' });
    }

    // Обновляем статус приглашения
    await invitation.update({ status: 'rejected' });

    res.json({ message: 'Приглашение отклонено' });
  } catch (error) {
    console.error('Error rejecting project invitation:', error);
    res.status(500).json({ message: 'Ошибка при отклонении приглашения', error: error.message });
  }
});

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Получить проект по ID
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const Team = require('../models/Team');
    const ProjectFile = require('../models/ProjectFile');
    const project = await Project.findByPk(req.params.id, {
      include: [
        { model: User, as: 'owner', attributes: { exclude: ['password'] } },
        {
          model: User,
          as: 'members',
          attributes: { exclude: ['password'] },
          through: { attributes: [] }
        },
        {
          model: Comment,
          as: 'comments',
          include: [
            { model: User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'avatar'] }
          ],
          required: false,
          order: [['createdAt', 'DESC']]
        },
        {
          model: Rating,
          as: 'ratings',
          include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName'] }]
        },
        {
          model: Team,
          as: 'teams',
          attributes: ['id', 'name', 'description'],
          through: { attributes: [] }
        },
        {
          model: ProjectFile,
          as: 'files',
          attributes: ['id', 'originalName', 'filename', 'mimeType', 'size', 'path', 'createdAt'],
          include: [{ model: User, as: 'uploader', attributes: ['id', 'firstName', 'lastName'] }],
          required: false
        }
      ]
    });

    if (!project) {
      return res.status(404).json({ message: 'Проект не найден' });
    }

    // Проверяем доступ к проекту
    const hasAccess = await hasProjectAccess(project, req.user);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Доступ запрещен. У вас нет прав для просмотра этого проекта.' });
    }

    const projectData = project.toJSON();
    const ratings = projectData.ratings || [];
    projectData.averageRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.value, 0) / ratings.length
      : 0;
    projectData.ratingCount = ratings.length;

    res.json(projectData);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при получении информации о проекте', error: error.message });
  }
});

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Создать новый проект
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', authenticate, [
  body('title').notEmpty().trim().isLength({ min: 3, max: 200 }).withMessage('Название должно быть от 3 до 200 символов'),
  body('description').notEmpty().trim().isLength({ min: 10 }).withMessage('Описание должно быть минимум 10 символов'),
  body('repositoryUrl').optional({ nullable: true, checkFalsy: true }).custom((value) => {
    if (!value || value.trim() === '') return true;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }).withMessage('Некорректный URL репозитория'),
  body('deployUrl').optional({ nullable: true, checkFalsy: true }).custom((value) => {
    if (!value || value.trim() === '') return true;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }).withMessage('Некорректный URL деплоя'),
  body('status').optional().isIn(['draft', 'active', 'completed', 'archived']).withMessage('Некорректный статус'),
  body('visibility').optional().isIn(['public', 'private']).withMessage('Некорректная видимость'),
  body('tags').optional().custom((value) => {
    if (value === undefined || value === null) return true;
    return Array.isArray(value) || typeof value === 'string';
  }).withMessage('Теги должны быть массивом или строкой')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Ошибка валидации',
        errors: errors.array() 
      });
    }

    // Обработка repositoryUrl - если пустой, то null
    let repositoryUrl = req.body.repositoryUrl?.trim();
    if (!repositoryUrl || repositoryUrl === '') {
      repositoryUrl = null;
    }

    // Обработка deployUrl - если пустой, то null
    let deployUrl = req.body.deployUrl?.trim();
    if (!deployUrl || deployUrl === '') {
      deployUrl = null;
    }

    // Обработка tags - если строка, преобразуем в массив
    let tags = req.body.tags || [];
    if (typeof tags === 'string') {
      tags = tags.split(',').map(tag => tag.trim()).filter(Boolean);
    }

    const projectData = {
      title: req.body.title.trim(),
      description: req.body.description.trim(),
      status: req.body.status || 'draft',
      visibility: req.body.visibility || 'public',
      repositoryUrl: repositoryUrl,
      deployUrl: deployUrl,
      tags: tags,
      ownerId: req.user.id
    };

    const project = await Project.create(projectData);

    // Логируем создание проекта
    await logActivity({
      type: 'project_created',
      description: `Проект "${project.title}" создан`,
      userId: req.user.id,
      projectId: project.id,
      metadata: { 
        projectTitle: project.title,
        status: project.status,
        visibility: project.visibility
      }
    });

    // If teamId provided, assign project to team and set visibility based on team visibility
    if (req.body.teamId) {
      const Team = require('../models/Team');
      const team = await Team.findByPk(req.body.teamId, {
        include: [{ model: User, as: 'members' }]
      });
      
      if (team) {
        const isMember = team.members?.some(m => m.id === req.user.id);
        if (isMember || team.leaderId === req.user.id) {
          // Устанавливаем видимость проекта на основе видимости команды
          if (team.visibility && project.visibility !== team.visibility) {
            await project.update({ visibility: team.visibility });
          }
          await team.addProject(project);
          
          // Логируем добавление проекта в команду
          await logActivity({
            type: 'team_project_added',
            description: `Проект "${project.title}" добавлен в команду "${team.name}"`,
            userId: req.user.id,
            teamId: team.id,
            projectId: project.id,
            metadata: { 
              projectTitle: project.title,
              teamName: team.name
            }
          });
        }
      }
    }

    const projectWithOwner = await Project.findByPk(project.id, {
      include: [{ model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'avatar'] }]
    });

    res.status(201).json(projectWithOwner);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при создании проекта', error: error.message });
  }
});

/**
 * @swagger
 * /api/projects/{id}:
 *   put:
 *     summary: Обновить проект
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', authenticate, [
  body('title').optional().trim().isLength({ min: 3, max: 200 }).withMessage('Название должно быть от 3 до 200 символов'),
  body('description').optional().trim().isLength({ min: 10 }).withMessage('Описание должно быть минимум 10 символов'),
  body('repositoryUrl').optional({ nullable: true, checkFalsy: true }).custom((value) => {
    if (!value || value.trim() === '') return true;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }).withMessage('Некорректный URL репозитория'),
  body('deployUrl').optional({ nullable: true, checkFalsy: true }).custom((value) => {
    if (!value || value.trim() === '') return true;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }).withMessage('Некорректный URL деплоя'),
  body('status').optional().isIn(['draft', 'active', 'completed', 'archived']).withMessage('Некорректный статус'),
  body('visibility').optional().isIn(['public', 'private']).withMessage('Некорректная видимость'),
  body('progress').optional().isInt({ min: 0, max: 100 }).withMessage('Прогресс должен быть от 0 до 100'),
  body('tags').optional().custom((value) => {
    if (value === undefined || value === null) return true;
    return Array.isArray(value) || typeof value === 'string';
  }).withMessage('Теги должны быть массивом или строкой')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Проект не найден' });
    }

    if (project.ownerId !== req.user.id && req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Доступ запрещен. Только владелец проекта или преподаватель могут редактировать проект.' });
    }

    // Обработка repositoryUrl и deployUrl
    let updateData = { ...req.body };
    if (updateData.repositoryUrl !== undefined) {
      updateData.repositoryUrl = updateData.repositoryUrl?.trim() || null;
    }
    if (updateData.deployUrl !== undefined) {
      updateData.deployUrl = updateData.deployUrl?.trim() || null;
    }

    // Обработка tags
    if (updateData.tags !== undefined) {
      if (typeof updateData.tags === 'string') {
        updateData.tags = updateData.tags.split(',').map(tag => tag.trim()).filter(Boolean);
      }
    }

    await project.update(updateData);

    const updatedProject = await Project.findByPk(project.id, {
      include: [{ model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'avatar'] }]
    });

    res.json(updatedProject);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при обновлении проекта', error: error.message });
  }
});

/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     summary: Удалить проект
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Проект не найден' });
    }

    // Проверяем права доступа: только владелец или преподаватель могут удалить проект
    if (project.ownerId !== req.user.id && req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Доступ запрещен. Только владелец проекта или преподаватель могут удалить проект.' });
    }

    // Получаем все файлы проекта для удаления с диска
    const projectFiles = await ProjectFile.findAll({ where: { projectId: project.id } });
    
    // Удаляем файлы с диска
    for (const file of projectFiles) {
      if (file.path) {
        const filePath = path.join(__dirname, '..', '..', file.path);
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (fileError) {
          console.error(`Error deleting file ${filePath}:`, fileError);
        }
      }
    }

    // Удаляем связи с командами (many-to-many)
    await project.setTeams([]);

    // Удаляем все связанные записи
    await Comment.destroy({ where: { projectId: project.id } });
    await Rating.destroy({ where: { projectId: project.id } });
    await ProjectFile.destroy({ where: { projectId: project.id } });
    await Milestone.destroy({ where: { projectId: project.id } });
    await Activity.destroy({ where: { projectId: project.id } });
    
    // Удаляем приглашения в проект
    const ProjectInvitation = require('../models/ProjectInvitation');
    await ProjectInvitation.destroy({ where: { projectId: project.id } });
    
    // Удаляем участников проекта (many-to-many)
    await project.setMembers([]);

    // Удаляем сам проект
    await project.destroy();

    res.json({ message: 'Проект успешно удален' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ message: 'Ошибка при удалении проекта', error: error.message });
  }
});

/**
 * @swagger
 * /api/projects/{id}/archive:
 *   post:
 *     summary: Архивировать проект
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/archive', authenticate, async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Проект не найден' });
    }

    // Проверяем права доступа: только владелец, преподаватель или администратор могут архивировать проект
    if (project.ownerId !== req.user.id && req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Доступ запрещен. Только владелец проекта, преподаватель или администратор могут архивировать проект.' });
    }

    if (project.status === 'archived') {
      return res.status(400).json({ message: 'Проект уже находится в архиве' });
    }

    await project.update({ status: 'archived' });

    await logActivity({
      type: 'project_archived',
      description: `Проект "${project.title}" был архивирован`,
      userId: req.user.id,
      projectId: project.id
    });

    const updatedProject = await Project.findByPk(project.id, {
      include: [{ model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'avatar'] }]
    });

    res.json({ message: 'Проект успешно архивирован', project: updatedProject });
  } catch (error) {
    console.error('Error archiving project:', error);
    res.status(500).json({ message: 'Ошибка при архивировании проекта', error: error.message });
  }
});

/**
 * @swagger
 * /api/projects/{id}/unarchive:
 *   post:
 *     summary: Разархивировать проект
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/unarchive', authenticate, async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Проект не найден' });
    }

    // Проверяем права доступа: только владелец, преподаватель или администратор могут разархивировать проект
    if (project.ownerId !== req.user.id && req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Доступ запрещен. Только владелец проекта, преподаватель или администратор могут разархивировать проект.' });
    }

    if (project.status !== 'archived') {
      return res.status(400).json({ message: 'Проект не находится в архиве' });
    }

    // При разархивировании возвращаем статус 'active'
    await project.update({ status: 'active' });

    await logActivity({
      type: 'project_unarchived',
      description: `Проект "${project.title}" был разархивирован`,
      userId: req.user.id,
      projectId: project.id
    });

    const updatedProject = await Project.findByPk(project.id, {
      include: [{ model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'avatar'] }]
    });

    res.json({ message: 'Проект успешно разархивирован', project: updatedProject });
  } catch (error) {
    console.error('Error unarchiving project:', error);
    res.status(500).json({ message: 'Ошибка при разархивировании проекта', error: error.message });
  }
});

/**
 * @swagger
 * /api/projects/{id}/members:
 *   get:
 *     summary: Получить список участников проекта
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id/members', authenticate, async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'members',
          attributes: { exclude: ['password'] },
          through: { attributes: [] }
        }
      ]
    });

    if (!project) {
      return res.status(404).json({ message: 'Проект не найден' });
    }

    // Проверяем доступ к проекту
    const hasAccess = await hasProjectAccess(project, req.user);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    res.json(project.members || []);
  } catch (error) {
    console.error('Error fetching project members:', error);
    res.status(500).json({ message: 'Ошибка при получении участников проекта', error: error.message });
  }
});

/**
 * @swagger
 * /api/projects/{id}/invite:
 *   post:
 *     summary: Пригласить пользователя в проект
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/invite', authenticate, [
  body('userId').isUUID().withMessage('Некорректный ID пользователя')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Проект не найден' });
    }

    // Проверяем права: только владелец, учитель или админ могут приглашать участников
    if (project.ownerId !== req.user.id && req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Только владелец проекта, учитель или администратор могут приглашать участников' });
    }

    const userToInvite = await User.findByPk(req.body.userId);
    if (!userToInvite) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Проверяем, не является ли пользователь уже участником
    const members = await project.getMembers();
    if (members.some(m => m.id === req.body.userId)) {
      return res.status(400).json({ message: 'Пользователь уже является участником проекта' });
    }

    // Нельзя пригласить владельца
    if (project.ownerId === req.body.userId) {
      return res.status(400).json({ message: 'Владелец проекта уже является участником' });
    }

    // Проверяем, есть ли уже pending приглашение
    const existingInvitation = await ProjectInvitation.findOne({
      where: {
        projectId: project.id,
        userId: req.body.userId,
        status: 'pending'
      }
    });

    if (existingInvitation) {
      return res.status(400).json({ 
        message: 'Приглашение уже отправлено этому пользователю. Ожидайте ответа или отмените предыдущее приглашение.',
        invitationId: existingInvitation.id,
        status: existingInvitation.status
      });
    }

    // Создаем приглашение
    const invitation = await ProjectInvitation.create({
      projectId: project.id,
      userId: req.body.userId,
      invitedById: req.user.id,
      status: 'pending'
    });

    // Логируем отправку приглашения
    await logActivity({
      type: 'project_invitation_sent',
      description: `Приглашение в проект "${project.title}" отправлено пользователю ${userToInvite.firstName} ${userToInvite.lastName}`,
      userId: req.user.id,
      projectId: project.id,
      metadata: { 
        projectTitle: project.title,
        invitedUserId: req.body.userId,
        invitedUserName: `${userToInvite.firstName} ${userToInvite.lastName}`
      }
    });

    const invitationWithDetails = await ProjectInvitation.findByPk(invitation.id, {
      include: [
        { model: Project, as: 'project', attributes: ['id', 'title'] },
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'avatar'] },
        { model: User, as: 'invitedBy', attributes: ['id', 'firstName', 'lastName'] }
      ]
    });

    res.status(201).json(invitationWithDetails);
  } catch (error) {
    console.error('Error sending project invitation:', error);
    res.status(500).json({ message: 'Ошибка при отправке приглашения', error: error.message });
  }
});

/**
 * @swagger
 * /api/projects/{id}/members/{userId}:
 *   delete:
 *     summary: Удалить участника из проекта
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id/members/:userId', authenticate, async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Проект не найден' });
    }

    // Проверяем права: владелец, учитель, админ или сам пользователь может удалить себя
    const canRemove = project.ownerId === req.user.id || 
                      req.user.role === 'teacher' || 
                      req.user.role === 'admin' ||
                      req.params.userId === req.user.id;

    if (!canRemove) {
      return res.status(403).json({ message: 'У вас нет прав для удаления участников' });
    }

    const userToRemove = await User.findByPk(req.params.userId);
    if (!userToRemove) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Проверяем, является ли пользователь участником
    const members = await project.getMembers();
    if (!members.some(m => m.id === req.params.userId)) {
      return res.status(400).json({ message: 'Пользователь не является участником проекта' });
    }

    // Нельзя удалить владельца
    if (project.ownerId === req.params.userId) {
      return res.status(400).json({ message: 'Нельзя удалить владельца проекта' });
    }

    await project.removeMember(userToRemove);

    // Логируем удаление участника
    await logActivity({
      type: 'project_member_removed',
      description: `Пользователь ${userToRemove.firstName} ${userToRemove.lastName} удален из проекта "${project.title}"`,
      userId: req.user.id,
      projectId: project.id,
      metadata: {
        removedUserId: userToRemove.id,
        removedUserName: `${userToRemove.firstName} ${userToRemove.lastName}`,
        projectTitle: project.title
      }
    });

    res.json({ message: 'Участник успешно удален из проекта' });
  } catch (error) {
    console.error('Error removing project member:', error);
    res.status(500).json({ message: 'Ошибка при удалении участника', error: error.message });
  }
});

module.exports = router;

