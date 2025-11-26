const express = require('express');
const { body, validationResult } = require('express-validator');
const Team = require('../models/Team');
const User = require('../models/User');
const Project = require('../models/Project');
const TeamInvitation = require('../models/TeamInvitation');
const { authenticate } = require('../middleware/auth');
const { logActivity } = require('../services/activityLogger');
const { hasTeamAccess } = require('../utils/accessControl');

const router = express.Router();

/**
 * @swagger
 * /api/teams:
 *   get:
 *     summary: Получить список команд
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { visibility } = req.query;
    const { Op } = require('sequelize');
    
    // Получаем все команды (публичные и приватные)
    // Для приватных команд показываем только те, где пользователь является участником или лидером
    const teams = await Team.findAll({
      include: [
        { model: User, as: 'leader', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
        { model: User, as: 'members', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
        { model: Project, as: 'projects', attributes: ['id', 'title', 'status', 'progress'] }
      ],
      order: [['createdAt', 'DESC']],
      attributes: { include: ['createdAt', 'updatedAt', 'visibility'] }
    });

    // Для приватных команд нужно проверить членство через прямой запрос
    // Получаем все приватные команды, где пользователь является участником
    const userPrivateTeams = await Team.findAll({
      include: [{
        model: User,
        as: 'members',
        where: { id: req.user.id },
        attributes: []
      }],
      where: { visibility: 'private' },
      attributes: ['id']
    });
    const userPrivateTeamIds = new Set(userPrivateTeams.map(t => t.id.toString()));

    // Фильтруем команды:
    // - Публичные команды показываем всегда
    // - Приватные команды показываем только если пользователь участник или лидер
    // - Если указан параметр visibility, фильтруем соответственно
    const filteredTeams = teams.filter(team => {
      // Если указан фильтр по видимости
      if (visibility === 'private') {
        // Показываем только приватные команды, где пользователь участник или лидер
        if (team.visibility === 'private') {
          const isLeader = team.leaderId === req.user.id;
          const isMember = userPrivateTeamIds.has(team.id.toString()) || 
                          (team.members && Array.isArray(team.members) && 
                           team.members.some(m => m && (m.id === req.user.id || m.id?.toString() === req.user.id?.toString())));
          return isMember || isLeader;
        }
        return false;
      } else if (visibility === 'public') {
        // Показываем только публичные команды
        return team.visibility === 'public';
      } else {
        // По умолчанию: показываем публичные команды и приватные команды пользователя
        if (team.visibility === 'public') {
          return true;
        } else if (team.visibility === 'private') {
          const isLeader = team.leaderId === req.user.id;
          const isMember = userPrivateTeamIds.has(team.id.toString()) || 
                          (team.members && Array.isArray(team.members) && 
                           team.members.some(m => m && (m.id === req.user.id || m.id?.toString() === req.user.id?.toString())));
          return isMember || isLeader;
        }
        return true;
      }
    });

    res.json(filteredTeams);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при получении списка команд', error: error.message });
  }
});

/**
 * @swagger
 * /api/teams:
 *   post:
 *     summary: Создать команду
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', authenticate, [
  body('name').trim().isLength({ min: 2, max: 100 }),
  body('description').optional().trim(),
  body('maxMembers').optional().isInt({ min: 2, max: 50 }),
  body('visibility').optional().isIn(['public', 'private'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const team = await Team.create({
      ...req.body,
      leaderId: req.user.id
    });

    // Add creator as member
    await team.addMember(req.user);

    // Логируем создание команды
    await logActivity({
      type: 'team_created',
      description: `Команда "${team.name}" создана`,
      userId: req.user.id,
      teamId: team.id,
      metadata: { teamName: team.name, visibility: team.visibility }
    });

    const teamWithDetails = await Team.findByPk(team.id, {
      include: [
        { model: User, as: 'leader', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
        { model: User, as: 'members', attributes: ['id', 'firstName', 'lastName', 'avatar'] }
      ]
    });

    res.status(201).json(teamWithDetails);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при создании команды', error: error.message });
  }
});

/**
 * @swagger
 * /api/teams/invitations:
 *   get:
 *     summary: Получить приглашения пользователя
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 */
router.get('/invitations', authenticate, async (req, res) => {
  try {
    const invitations = await TeamInvitation.findAll({
      where: {
        userId: req.user.id,
        status: 'pending'
      },
      include: [
        { model: Team, as: 'team', attributes: ['id', 'name', 'description'] },
        { model: User, as: 'invitedBy', attributes: ['id', 'firstName', 'lastName', 'avatar'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(invitations);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при получении приглашений', error: error.message });
  }
});

/**
 * @swagger
 * /api/teams/invitations/all:
 *   get:
 *     summary: Получить всю историю приглашений в команды
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 */
router.get('/invitations/all', authenticate, async (req, res) => {
  try {
    const invitations = await TeamInvitation.findAll({
      where: {
        userId: req.user.id
      },
      include: [
        { model: Team, as: 'team', attributes: ['id', 'name', 'description'] },
        { model: User, as: 'invitedBy', attributes: ['id', 'firstName', 'lastName', 'avatar'] }
      ],
      order: [['updatedAt', 'DESC']]
    });

    res.json(invitations);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при получении истории приглашений', error: error.message });
  }
});

/**
 * @swagger
 * /api/teams/invitations/{id}/accept:
 *   post:
 *     summary: Принять приглашение в команду
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 */
router.post('/invitations/:id/accept', authenticate, async (req, res) => {
  try {
    const invitation = await TeamInvitation.findByPk(req.params.id, {
      include: [{ model: Team, as: 'team', include: [{ model: User, as: 'members' }] }]
    });

    if (!invitation) {
      return res.status(404).json({ message: 'Приглашение не найдено' });
    }

    if (invitation.userId !== req.user.id) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: 'Приглашение уже обработано' });
    }

    const team = invitation.team;
    const memberCount = team.members ? team.members.length : 0;
    if (memberCount >= team.maxMembers) {
      return res.status(400).json({ message: 'Team is full' });
    }

    await team.addMember(req.user);
    await invitation.update({ status: 'accepted' });

    // Логируем принятие приглашения
    await logActivity({
      type: 'team_invitation_accepted',
      description: `Приглашение в команду "${team.name}" принято`,
      userId: req.user.id,
      teamId: team.id,
      metadata: { 
        teamName: team.name,
        invitedBy: invitation.invitedById
      }
    });

    // Логируем присоединение к команде
    await logActivity({
      type: 'user_joined_team',
      description: `${req.user.firstName} ${req.user.lastName} присоединился к команде "${team.name}"`,
      userId: req.user.id,
      teamId: team.id,
      metadata: { teamName: team.name }
    });

    const updatedTeam = await Team.findByPk(team.id, {
      include: [
        { model: User, as: 'leader', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
        { model: User, as: 'members', attributes: ['id', 'firstName', 'lastName', 'avatar'] }
      ]
    });

    res.json(updatedTeam);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при принятии приглашения', error: error.message });
  }
});

/**
 * @swagger
 * /api/teams/invitations/{id}/reject:
 *   post:
 *     summary: Отклонить приглашение в команду
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 */
router.post('/invitations/:id/reject', authenticate, async (req, res) => {
  try {
    const invitation = await TeamInvitation.findByPk(req.params.id);

    if (!invitation) {
      return res.status(404).json({ message: 'Приглашение не найдено' });
    }

    if (invitation.userId !== req.user.id) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: 'Приглашение уже обработано' });
    }

    await invitation.update({ status: 'rejected' });

    res.json({ message: 'Invitation rejected' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при отклонении приглашения', error: error.message });
  }
});

/**
 * @swagger
 * /api/teams/invitations/{id}:
 *   delete:
 *     summary: Отменить приглашение (только для лидера команды)
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/invitations/:id', authenticate, async (req, res) => {
  try {
    const invitation = await TeamInvitation.findByPk(req.params.id, {
      include: [{ model: Team, as: 'team' }]
    });

    if (!invitation) {
      return res.status(404).json({ message: 'Приглашение не найдено' });
    }

    const team = invitation.team;
    if (team.leaderId !== req.user.id) {
      return res.status(403).json({ message: 'Только лидер команды может отменить приглашение' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: 'Можно отменить только ожидающие приглашения' });
    }

    await invitation.destroy();

    res.json({ message: 'Приглашение отменено' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при отмене приглашения', error: error.message });
  }
});

/**
 * @swagger
 * /api/teams/{id}/join:
 *   post:
 *     summary: Присоединиться к команде
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 */
/**
 * @swagger
 * /api/teams/{id}:
 *   get:
 *     summary: Получить команду по ID
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const team = await Team.findByPk(req.params.id, {
      include: [
        { model: User, as: 'leader', attributes: ['id', 'firstName', 'lastName', 'avatar', 'email'] },
        { model: User, as: 'members', attributes: ['id', 'firstName', 'lastName', 'avatar', 'email'] },
        { model: Project, as: 'projects', attributes: ['id', 'title', 'status', 'progress', 'description'] }
      ],
      attributes: { include: ['createdAt', 'updatedAt', 'visibility'] }
    });

    if (!team) {
      return res.status(404).json({ message: 'Команда не найдена' });
    }

    // Проверяем доступ к команде
    const hasAccess = hasTeamAccess(team, req.user);
    if (!hasAccess) {
      return res.status(403).json({ message: 'Доступ запрещен. У вас нет прав для просмотра этой команды.' });
    }

    // Если пользователь лидер команды, добавляем информацию о приглашениях
    if (team.leaderId === req.user.id) {
      const pendingInvitations = await TeamInvitation.findAll({
        where: {
          teamId: team.id,
          status: 'pending'
        },
        include: [
          { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'avatar'] }
        ],
        order: [['createdAt', 'DESC']]
      });
      
      team.dataValues.pendingInvitations = pendingInvitations;
    }

    res.json(team);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при получении информации о команде', error: error.message });
  }
});

router.post('/:id/join', authenticate, async (req, res) => {
  try {
    const team = await Team.findByPk(req.params.id, {
      include: [{ model: User, as: 'members' }]
    });

    if (!team) {
      return res.status(404).json({ message: 'Команда не найдена' });
    }

    const memberCount = team.members ? team.members.length : 0;
    if (memberCount >= team.maxMembers) {
      return res.status(400).json({ message: 'Team is full' });
    }

    const isMember = team.members?.some(m => m.id === req.user.id);
    if (isMember) {
      return res.status(400).json({ message: 'Вы уже являетесь участником этой команды' });
    }

    await team.addMember(req.user);

    const updatedTeam = await Team.findByPk(team.id, {
      include: [
        { model: User, as: 'leader', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
        { model: User, as: 'members', attributes: ['id', 'firstName', 'lastName', 'avatar'] }
      ]
    });

    res.json(updatedTeam);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при присоединении к команде', error: error.message });
  }
});

/**
 * @swagger
 * /api/teams/{id}/invite:
 *   post:
 *     summary: Пригласить пользователя в команду
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/invite', authenticate, [
  body('userId').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const team = await Team.findByPk(req.params.id, {
      include: [{ model: User, as: 'members' }]
    });

    if (!team) {
      return res.status(404).json({ message: 'Команда не найдена' });
    }

    if (team.leaderId !== req.user.id) {
      return res.status(403).json({ message: 'Только лидер команды может приглашать участников' });
    }

    const memberCount = team.members ? team.members.length : 0;
    if (memberCount >= team.maxMembers) {
      return res.status(400).json({ message: 'Team is full' });
    }

    const userToInvite = await User.findByPk(req.body.userId);
    if (!userToInvite) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const isMember = team.members?.some(m => m.id === req.body.userId);
    if (isMember) {
      return res.status(400).json({ message: 'Пользователь уже является участником команды' });
    }

    // Проверяем, есть ли уже pending приглашение
    const existingInvitation = await TeamInvitation.findOne({
      where: {
        teamId: team.id,
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

    // Создаем приглашение вместо прямого добавления
    const invitation = await TeamInvitation.create({
      teamId: team.id,
      userId: req.body.userId,
      invitedById: req.user.id,
      status: 'pending'
    });

    // Логируем отправку приглашения
    await logActivity({
      type: 'team_invitation_sent',
      description: `Приглашение в команду "${team.name}" отправлено пользователю ${userToInvite.firstName} ${userToInvite.lastName}`,
      userId: req.user.id,
      teamId: team.id,
      metadata: { 
        teamName: team.name,
        invitedUserId: req.body.userId,
        invitedUserName: `${userToInvite.firstName} ${userToInvite.lastName}`
      }
    });

    const invitationWithDetails = await TeamInvitation.findByPk(invitation.id, {
      include: [
        { model: Team, as: 'team', attributes: ['id', 'name'] },
        { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: User, as: 'invitedBy', attributes: ['id', 'firstName', 'lastName'] }
      ]
    });

    res.status(201).json(invitationWithDetails);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при отправке приглашения', error: error.message });
  }
});

/**
 * @swagger
 * /api/teams/{id}/members/{userId}:
 *   delete:
 *     summary: Удалить участника из команды
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id/members/:userId', authenticate, async (req, res) => {
  try {
    const team = await Team.findByPk(req.params.id, {
      include: [{ model: User, as: 'members' }]
    });

    if (!team) {
      return res.status(404).json({ message: 'Команда не найдена' });
    }

    if (team.leaderId !== req.user.id) {
      return res.status(403).json({ message: 'Только лидер команды может удалять участников' });
    }

    if (req.params.userId === team.leaderId) {
      return res.status(400).json({ message: 'Невозможно удалить лидера команды' });
    }

    const userToRemove = await User.findByPk(req.params.userId);
    if (!userToRemove) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    await team.removeMember(userToRemove);

    const updatedTeam = await Team.findByPk(team.id, {
      include: [
        { model: User, as: 'leader', attributes: ['id', 'firstName', 'lastName', 'avatar', 'email'] },
        { model: User, as: 'members', attributes: ['id', 'firstName', 'lastName', 'avatar', 'email'] }
      ]
    });

    res.json(updatedTeam);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при удалении участника', error: error.message });
  }
});

/**
 * @swagger
 * /api/teams/{id}/leave:
 *   post:
 *     summary: Выйти из команды
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/leave', authenticate, async (req, res) => {
  try {
    const team = await Team.findByPk(req.params.id, {
      include: [{ model: User, as: 'members' }]
    });

    if (!team) {
      return res.status(404).json({ message: 'Команда не найдена' });
    }

    if (team.leaderId === req.user.id) {
      return res.status(400).json({ message: 'Лидер команды не может покинуть команду. Удалите команду вместо этого.' });
    }

    const isMember = team.members?.some(m => m.id === req.user.id);
    if (!isMember) {
      return res.status(400).json({ message: 'Вы не являетесь участником этой команды' });
    }

    await team.removeMember(req.user);

    // Логируем выход из команды
    await logActivity({
      type: 'user_left_team',
      description: `${req.user.firstName} ${req.user.lastName} покинул команду "${team.name}"`,
      userId: req.user.id,
      teamId: team.id,
      metadata: { teamName: team.name }
    });

    res.json({ message: 'Вы успешно покинули команду' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при выходе из команды', error: error.message });
  }
});

/**
 * @swagger
 * /api/teams/{id}/projects:
 *   post:
 *     summary: Присвоить проект команде
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/projects', authenticate, [
  body('projectId').isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const team = await Team.findByPk(req.params.id, {
      include: [{ model: User, as: 'members' }]
    });

    if (!team) {
      return res.status(404).json({ message: 'Команда не найдена' });
    }

    const isMember = team.members?.some(m => m.id === req.user.id);
    if (!isMember && team.leaderId !== req.user.id) {
      return res.status(403).json({ message: 'Только участники команды могут присваивать проекты' });
    }

    const project = await Project.findByPk(req.body.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if project is already assigned to this team
    const existingProjects = await team.getProjects();
    if (existingProjects.some(p => p.id === req.body.projectId)) {
      return res.status(400).json({ message: 'Проект уже присвоен этой команде' });
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

    const updatedTeam = await Team.findByPk(team.id, {
      include: [
        { model: User, as: 'leader', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
        { model: User, as: 'members', attributes: ['id', 'firstName', 'lastName', 'avatar'] },
        { model: Project, as: 'projects', attributes: ['id', 'title', 'status', 'progress', 'description'] }
      ]
    });

    res.json(updatedTeam);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при присвоении проекта команде', error: error.message });
  }
});

/**
 * @swagger
 * /api/teams/{id}:
 *   delete:
 *     summary: Удалить команду
 *     tags: [Teams]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const team = await Team.findByPk(req.params.id, {
      include: [
        { model: require('../models/User'), as: 'members' },
        { model: require('../models/Project'), as: 'projects' }
      ]
    });

    if (!team) {
      return res.status(404).json({ message: 'Команда не найдена' });
    }

    if (team.leaderId !== req.user.id) {
      return res.status(403).json({ message: 'Только лидер команды может удалить команду' });
    }

    // Удаляем связи перед удалением команды
    if (team.members && team.members.length > 0) {
      await team.setMembers([]);
    }
    if (team.projects && team.projects.length > 0) {
      await team.setProjects([]);
    }

    // Удаляем приглашения команды
    const TeamInvitation = require('../models/TeamInvitation');
    await TeamInvitation.destroy({ where: { teamId: team.id } });

    await team.destroy();

    res.json({ message: 'Команда успешно удалена' });
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({ message: 'Ошибка при удалении команды', error: error.message });
  }
});

module.exports = router;

