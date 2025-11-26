const express = require('express');
const { body, validationResult } = require('express-validator');
const Rating = require('../models/Rating');
const Project = require('../models/Project');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const { hasProjectAccess } = require('../utils/accessControl');

const router = express.Router();

/**
 * @swagger
 * /api/ratings:
 *   post:
 *     summary: Оценить проект
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', authenticate, [
  body('projectId').isUUID(),
  body('value').isInt({ min: 1, max: 5 }),
  body('comment').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { projectId, value, comment } = req.body;

    // Verify project exists
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Проект не найден' });
    }

    // Проверяем доступ к проекту
    const hasAccess = await hasProjectAccess(project, req.user);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Доступ запрещен. У вас нет прав для оценки этого проекта.' });
    }

    // Check if user already rated this project
    const existingRating = await Rating.findOne({
      where: { projectId, userId: req.user.id }
    });

    if (existingRating) {
      // Update existing rating
      await existingRating.update({ value, comment });
      const updatedRating = await Rating.findByPk(existingRating.id, {
        include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName'] }]
      });
      return res.json(updatedRating);
    }

    // Create new rating
    const rating = await Rating.create({
      projectId,
      userId: req.user.id,
      value,
      comment
    });

    const ratingWithUser = await Rating.findByPk(rating.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName'] }]
    });

    res.status(201).json(ratingWithUser);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при создании оценки', error: error.message });
  }
});

/**
 * @swagger
 * /api/ratings/{id}:
 *   delete:
 *     summary: Удалить оценку
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const rating = await Rating.findByPk(req.params.id);

    if (!rating) {
      return res.status(404).json({ message: 'Оценка не найдена' });
    }

    if (rating.userId !== req.user.id && req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    await rating.destroy();

    res.json({ message: 'Оценка успешно удалена' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при удалении оценки', error: error.message });
  }
});

module.exports = router;

