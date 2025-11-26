const express = require('express');
const { body, param } = require('express-validator');
const Milestone = require('../models/Milestone');
const Project = require('../models/Project');
const { authenticate } = require('../middleware/auth');
const { hasProjectAccess } = require('../utils/accessControl');

const router = express.Router();

/**
 * @swagger
 * /api/milestones:
 *   post:
 *     summary: Создать майлстоун для проекта
 *     tags: [Milestones]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  authenticate,
  [
    body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Название майлстоуна должно быть от 1 до 200 символов'),
    body('description').optional().trim(),
    body('dueDate').optional().isISO8601().withMessage('Некорректная дата'),
    body('projectId').isUUID().withMessage('Некорректный ID проекта')
  ],
  async (req, res) => {
    try {
      const { projectId, title, description, dueDate } = req.body;

      const project = await Project.findByPk(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Проект не найден' });
      }

      // Проверяем права доступа: владелец, участник проекта, преподаватель или администратор
      const isOwner = project.ownerId === req.user.id;
      const isTeacherOrAdmin = req.user.role === 'teacher' || req.user.role === 'admin';
      
      // Проверяем, является ли пользователь участником проекта
      let isMember = false;
      if (!isOwner && !isTeacherOrAdmin) {
        const User = require('../models/User');
        const projectWithMembers = await Project.findByPk(project.id, {
          include: [{
            model: User,
            as: 'members',
            attributes: ['id'],
            through: { attributes: [] }
          }]
        });
        if (projectWithMembers && projectWithMembers.members) {
          isMember = projectWithMembers.members.some(member => member.id === req.user.id);
        }
      }
      
      if (!isOwner && !isTeacherOrAdmin && !isMember) {
        return res.status(403).json({ message: 'Доступ запрещен. Только владелец проекта, участник проекта или преподаватель могут создавать майлстоуны.' });
      }

      const milestone = await Milestone.create({
        title,
        description: description || null,
        dueDate: dueDate || null,
        projectId
      });

      res.status(201).json(milestone);
    } catch (error) {
      console.error('Error creating milestone:', error);
      res.status(500).json({ message: 'Ошибка при создании майлстоуна', error: error.message });
    }
  }
);

/**
 * @swagger
 * /api/milestones/project/:projectId:
 *   get:
 *     summary: Получить все майлстоуны проекта
 *     tags: [Milestones]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/project/:projectId',
  authenticate,
  [param('projectId').isUUID().withMessage('Некорректный ID проекта')],
  async (req, res) => {
    try {
      const { projectId } = req.params;

      const project = await Project.findByPk(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Проект не найден' });
      }

      // Проверяем права доступа
      const hasAccess = await hasProjectAccess(project, req.user);
      if (!hasAccess) {
        return res.status(403).json({ message: 'Доступ запрещен. У вас нет прав для просмотра майлстоунов этого проекта.' });
      }

      const milestones = await Milestone.findAll({
        where: { projectId },
        order: [['createdAt', 'ASC']]
      });

      res.json(milestones);
    } catch (error) {
      console.error('Error fetching milestones:', error);
      res.status(500).json({ message: 'Ошибка при получении майлстоунов', error: error.message });
    }
  }
);

/**
 * @swagger
 * /api/milestones/:id:
 *   put:
 *     summary: Обновить майлстоун
 *     tags: [Milestones]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/:id',
  authenticate,
  [
    param('id').isUUID().withMessage('Некорректный ID майлстоуна'),
    body('title').optional().trim().isLength({ min: 1, max: 200 }),
    body('description').optional().trim(),
    body('dueDate').optional().isISO8601(),
    body('completed').optional().isBoolean()
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, dueDate, completed } = req.body;

      const milestone = await Milestone.findByPk(id, {
        include: [{ model: Project, as: 'project' }]
      });

      if (!milestone) {
        return res.status(404).json({ message: 'Майлстоун не найден' });
      }

      // Проверяем права доступа: владелец, участник проекта, преподаватель или администратор
      const isOwner = milestone.project.ownerId === req.user.id;
      const isTeacherOrAdmin = req.user.role === 'teacher' || req.user.role === 'admin';
      
      // Проверяем, является ли пользователь участником проекта
      let isMember = false;
      if (!isOwner && !isTeacherOrAdmin) {
        const User = require('../models/User');
        const projectWithMembers = await Project.findByPk(milestone.project.id, {
          include: [{
            model: User,
            as: 'members',
            attributes: ['id'],
            through: { attributes: [] }
          }]
        });
        if (projectWithMembers && projectWithMembers.members) {
          isMember = projectWithMembers.members.some(member => member.id === req.user.id);
        }
      }
      
      if (!isOwner && !isTeacherOrAdmin && !isMember) {
        return res.status(403).json({ message: 'Доступ запрещен. Только владелец проекта, участник проекта или преподаватель могут редактировать майлстоуны.' });
      }

      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (dueDate !== undefined) updateData.dueDate = dueDate;
      if (completed !== undefined) {
        updateData.completed = completed;
        updateData.completedAt = completed ? new Date() : null;
      }

      await milestone.update(updateData);

      res.json(milestone);
    } catch (error) {
      console.error('Error updating milestone:', error);
      res.status(500).json({ message: 'Ошибка при обновлении майлстоуна', error: error.message });
    }
  }
);

/**
 * @swagger
 * /api/milestones/:id:
 *   delete:
 *     summary: Удалить майлстоун
 *     tags: [Milestones]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:id',
  authenticate,
  [param('id').isUUID().withMessage('Некорректный ID майлстоуна')],
  async (req, res) => {
    try {
      const { id } = req.params;

      const milestone = await Milestone.findByPk(id, {
        include: [{ model: Project, as: 'project' }]
      });

      if (!milestone) {
        return res.status(404).json({ message: 'Майлстоун не найден' });
      }

      // Проверяем права доступа: владелец, участник проекта, преподаватель или администратор
      const isOwner = milestone.project.ownerId === req.user.id;
      const isTeacherOrAdmin = req.user.role === 'teacher' || req.user.role === 'admin';
      
      // Проверяем, является ли пользователь участником проекта
      let isMember = false;
      if (!isOwner && !isTeacherOrAdmin) {
        const User = require('../models/User');
        const projectWithMembers = await Project.findByPk(milestone.project.id, {
          include: [{
            model: User,
            as: 'members',
            attributes: ['id'],
            through: { attributes: [] }
          }]
        });
        if (projectWithMembers && projectWithMembers.members) {
          isMember = projectWithMembers.members.some(member => member.id === req.user.id);
        }
      }
      
      if (!isOwner && !isTeacherOrAdmin && !isMember) {
        return res.status(403).json({ message: 'Доступ запрещен. Только владелец проекта, участник проекта или преподаватель могут удалять майлстоуны.' });
      }

      await milestone.destroy();

      res.json({ message: 'Майлстоун удален' });
    } catch (error) {
      console.error('Error deleting milestone:', error);
      res.status(500).json({ message: 'Ошибка при удалении майлстоуна', error: error.message });
    }
  }
);

module.exports = router;

