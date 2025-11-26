const express = require('express');
const { body, validationResult } = require('express-validator');
const Comment = require('../models/Comment');
const Project = require('../models/Project');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const { logActivity } = require('../services/activityLogger');
const { hasProjectAccess } = require('../utils/accessControl');

const router = express.Router();

/**
 * @swagger
 * /api/comments:
 *   post:
 *     summary: Создать комментарий
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', authenticate, [
  body('content').trim().isLength({ min: 1, max: 2000 }),
  body('projectId').isUUID(),
  body('parentId').optional().isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { projectId, parentId } = req.body;

    // Verify project exists
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Проект не найден' });
    }

    // Проверяем доступ к проекту
    const hasAccess = await hasProjectAccess(project, req.user);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Доступ запрещен. У вас нет прав для комментирования этого проекта.' });
    }

    // If parentId provided, verify parent comment exists
    if (parentId) {
      const parentComment = await Comment.findByPk(parentId);
      if (!parentComment) {
        return res.status(404).json({ message: 'Родительский комментарий не найден' });
      }
    }

    const comment = await Comment.create({
      ...req.body,
      userId: req.user.id,
      projectId
    });

    // Логируем создание комментария
    await logActivity({
      type: 'comment_created',
      description: parentId 
        ? `Ответ на комментарий в проекте "${project.title}"`
        : `Комментарий к проекту "${project.title}"`,
      userId: req.user.id,
      projectId: project.id,
      metadata: { 
        commentId: comment.id, 
        parentId: parentId || null,
        projectTitle: project.title
      }
    });

    const commentWithAuthor = await Comment.findByPk(comment.id, {
      include: [{ model: User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'avatar'] }]
    });

    res.status(201).json(commentWithAuthor);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при создании комментария', error: error.message });
  }
});

/**
 * @swagger
 * /api/comments/{id}:
 *   delete:
 *     summary: Удалить комментарий
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const comment = await Comment.findByPk(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Комментарий не найден' });
    }

    if (comment.userId !== req.user.id && req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    const project = await Project.findByPk(comment.projectId);
    
    await comment.destroy();

    // Логируем удаление комментария
    await logActivity({
      type: 'comment_deleted',
      description: `Комментарий удален из проекта "${project?.title || 'неизвестный проект'}"`,
      userId: req.user.id,
      projectId: comment.projectId,
      metadata: { commentId: comment.id }
    });

    res.json({ message: 'Комментарий успешно удален' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при удалении комментария', error: error.message });
  }
});

module.exports = router;

