const express = require('express');
const { Op } = require('sequelize');
const Activity = require('../models/Activity');
const User = require('../models/User');
const Team = require('../models/Team');
const Project = require('../models/Project');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/activities:
 *   get:
 *     summary: Получить историю активности
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: teamId
 *         schema:
 *           type: string
 *         description: Фильтр по ID команды
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *         description: Фильтр по ID проекта
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Фильтр по типу активности
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Количество записей
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Смещение для пагинации
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { teamId, projectId, type, limit = 50, offset = 0 } = req.query;
    
    const where = {};
    
    // Если пользователь не учитель, показываем только его активность или активность его команд/проектов
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      // Получаем команды пользователя (где он лидер или участник)
      const teamsAsLeader = await Team.findAll({
        where: { leaderId: req.user.id },
        attributes: ['id']
      });
      const teamsAsMember = await Team.findAll({
        include: [{
          model: User,
          as: 'members',
          where: { id: req.user.id },
          attributes: []
        }],
        attributes: ['id']
      });
      const allTeamIds = [...teamsAsLeader.map(t => t.id), ...teamsAsMember.map(t => t.id)];
      
      // Получаем проекты пользователя (где он владелец)
      const userProjects = await Project.findAll({
        where: { ownerId: req.user.id },
        attributes: ['id']
      });
      const projectIds = userProjects.map(p => p.id);
      
      // Также получаем проекты из команд пользователя
      const teamProjects = await Project.findAll({
        include: [{
          model: Team,
          as: 'teams',
          where: { id: { [Op.in]: allTeamIds } },
          attributes: []
        }],
        attributes: ['id']
      });
      const allProjectIds = [...projectIds, ...teamProjects.map(p => p.id)];
      
      // Строим условия для фильтрации
      const orConditions = [{ userId: req.user.id }];
      
      if (allTeamIds.length > 0) {
        orConditions.push({ teamId: { [Op.in]: allTeamIds } });
      }
      
      if (allProjectIds.length > 0) {
        orConditions.push({ projectId: { [Op.in]: allProjectIds } });
      }
      
      where[Op.or] = orConditions;
    }
    
    if (teamId) {
      where.teamId = teamId;
    }
    
    if (projectId) {
      where.projectId = projectId;
    }
    
    if (type) {
      where.type = type;
    }
    
    const activities = await Activity.findAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
        { model: Team, as: 'team', attributes: ['id', 'name'], required: false },
        { model: Project, as: 'project', attributes: ['id', 'title'], required: false }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    const total = await Activity.count({ where });
    
    // Отладочное логирование
    console.log('Activities query:', {
      userId: req.user.id,
      userRole: req.user.role,
      where,
      total,
      activitiesCount: activities.length
    });
    
    res.json({
      activities,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ message: 'Ошибка при получении истории активности', error: error.message });
  }
});

/**
 * @swagger
 * /api/activities/team/{teamId}:
 *   get:
 *     summary: Получить историю активности команды
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 */
router.get('/team/:teamId', authenticate, async (req, res) => {
  try {
    const team = await Team.findByPk(req.params.teamId, {
      include: [{ model: User, as: 'members' }]
    });
    
    if (!team) {
      return res.status(404).json({ message: 'Команда не найдена' });
    }
    
    // Проверяем доступ: только участники команды или учителя
    const isMember = team.members?.some(m => m.id === req.user.id);
      if (!isMember && team.leaderId !== req.user.id && req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }
    
    const activities = await Activity.findAll({
      where: { teamId: req.params.teamId },
      include: [
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
        { model: Project, as: 'project', attributes: ['id', 'title'], required: false }
      ],
      order: [['createdAt', 'DESC']],
      limit: 100
    });
    
    res.json(activities);
  } catch (error) {
    console.error('Error fetching team activities:', error);
    res.status(500).json({ message: 'Ошибка при получении истории команды', error: error.message });
  }
});

/**
 * @swagger
 * /api/activities/project/{projectId}:
 *   get:
 *     summary: Получить историю активности проекта
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 */
router.get('/project/:projectId', authenticate, async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.projectId);
    
    if (!project) {
      return res.status(404).json({ message: 'Проект не найден' });
    }
    
    // Проверяем доступ: только владелец проекта, участники команды проекта или учителя
    if (project.ownerId !== req.user.id && req.user.role !== 'teacher' && req.user.role !== 'admin') {
      // Проверяем, является ли пользователь участником команды проекта
      const teams = await project.getTeams({
        include: [{ model: User, as: 'members' }]
      });
      const isTeamMember = teams.some(team => 
        team.members?.some(m => m.id === req.user.id)
      );
      
      if (!isTeamMember) {
        return res.status(403).json({ message: 'Доступ запрещен' });
      }
    }
    
    const activities = await Activity.findAll({
      where: { projectId: req.params.projectId },
      include: [
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
        { model: Team, as: 'team', attributes: ['id', 'name'], required: false }
      ],
      order: [['createdAt', 'DESC']],
      limit: 100
    });
    
    res.json(activities);
  } catch (error) {
    console.error('Error fetching project activities:', error);
    res.status(500).json({ message: 'Ошибка при получении истории проекта', error: error.message });
  }
});

module.exports = router;

