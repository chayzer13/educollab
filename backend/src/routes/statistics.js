const express = require('express');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');
const Project = require('../models/Project');
const Team = require('../models/Team');
const User = require('../models/User');
const Comment = require('../models/Comment');
const Rating = require('../models/Rating');
const { Op } = require('sequelize');

const router = express.Router();

/**
 * @swagger
 * /api/statistics:
 *   get:
 *     summary: Получить общую статистику платформы
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Статистика платформы
 */
router.get('/', optionalAuthenticate, async (req, res) => {
  try {
    // Для администраторов и преподавателей показываем всю статистику
    // Для остальных - только доступные данные
    const isAdminOrTeacher = req.user && (req.user.role === 'admin' || req.user.role === 'teacher');
    
    let projectWhere = {};
    let commentWhere = {};
    let ratingWhere = {};
    let teamWhere = {};

    // Для комментариев и оценок: получаем ID публичных проектов заранее
    if (!isAdminOrTeacher) {
      // Для обычных пользователей показываем только публичные проекты
      projectWhere.visibility = 'public';
      
      // Команды - только публичные
      teamWhere.visibility = 'public';
      
      // Получаем ID публичных проектов для фильтрации комментариев и оценок
      const publicProjectIds = await Project.findAll({
        where: { visibility: 'public' },
        attributes: ['id']
      });
      const publicProjectIdsArray = publicProjectIds.map(p => p.id);
      
      if (publicProjectIdsArray.length > 0) {
        commentWhere.projectId = { [Op.in]: publicProjectIdsArray };
        ratingWhere.projectId = { [Op.in]: publicProjectIdsArray };
      } else {
        // Если нет публичных проектов, используем условие, которое никогда не выполнится
        commentWhere.id = { [Op.eq]: null };
        ratingWhere.id = { [Op.eq]: null };
      }
    }

    const [
      totalProjects,
      totalTeams,
      totalUsers,
      totalComments,
      totalRatings,
      activeProjects,
      completedProjects,
      publicProjects,
      privateProjects,
      publicTeams,
      privateTeams
    ] = await Promise.all([
      Project.count({ where: projectWhere }),
      Team.count({ where: teamWhere }),
      User.count(),
      Comment.count({ where: commentWhere }),
      Rating.count({ where: ratingWhere }),
      Project.count({ where: { ...projectWhere, status: 'active' } }),
      Project.count({ where: { ...projectWhere, status: 'completed' } }),
      Project.count({ where: { ...projectWhere, visibility: 'public' } }),
      isAdminOrTeacher ? Project.count({ where: { visibility: 'private' } }) : 0,
      Team.count({ where: { ...teamWhere, visibility: 'public' } }),
      isAdminOrTeacher ? Team.count({ where: { visibility: 'private' } }) : 0
    ]);

    // Статистика по ролям пользователей
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

    // Средний рейтинг проектов (только для доступных проектов)
    const avgRating = await Rating.findOne({
      where: ratingWhere,
      attributes: [
        [require('sequelize').fn('AVG', require('sequelize').col('value')), 'avg']
      ],
      raw: true
    });

    // Проекты за последние 30 дней
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentProjects = await Project.count({
      where: {
        ...projectWhere,
        createdAt: {
          [Op.gte]: thirtyDaysAgo
        }
      }
    });

    // Команды за последние 30 дней
    const recentTeams = await Team.count({
      where: {
        ...teamWhere,
        createdAt: {
          [Op.gte]: thirtyDaysAgo
        }
      }
    });

    res.json({
      overview: {
        totalProjects,
        totalTeams,
        totalUsers,
        totalComments,
        totalRatings
      },
      projects: {
        active: activeProjects,
        completed: completedProjects,
        public: publicProjects,
        private: privateProjects,
        recent: recentProjects
      },
      teams: {
        public: publicTeams,
        private: privateTeams,
        recent: recentTeams
      },
      users: {
        byRole: roleStats
      },
      ratings: {
        average: avgRating ? parseFloat(avgRating.avg || 0).toFixed(2) : '0.00',
        total: totalRatings
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при получении статистики', error: error.message });
  }
});

/**
 * @swagger
 * /api/statistics/user:
 *   get:
 *     summary: Получить статистику текущего пользователя
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Статистика пользователя
 */
router.get('/user', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const [
      userProjects,
      userTeams,
      userComments,
      userRatings,
      activeUserProjects,
      completedUserProjects,
      draftUserProjects,
      archivedUserProjects,
      userProjectsAsMember
    ] = await Promise.all([
      Project.count({ where: { ownerId: userId } }),
      Team.count({ where: { leaderId: userId } }),
      Comment.count({ where: { userId } }),
      Rating.count({ where: { userId } }),
      Project.count({ where: { ownerId: userId, status: 'active' } }),
      Project.count({ where: { ownerId: userId, status: 'completed' } }),
      Project.count({ where: { ownerId: userId, status: 'draft' } }),
      Project.count({ where: { ownerId: userId, status: 'archived' } }),
      // Проекты, где пользователь является участником команды
      Project.count({
        include: [{
          model: require('../models/Team'),
          as: 'teams',
          include: [{
            model: User,
            as: 'members',
            where: { id: userId }
          }]
        }]
      })
    ]);

    // Команды, где пользователь является участником (не лидером)
    const userTeamsAsMember = await Team.count({
      include: [{
        model: User,
        as: 'members',
        where: { id: userId }
      }],
      where: {
        leaderId: { [Op.ne]: userId }
      }
    });

    // Средний рейтинг проектов пользователя
    const userProjectsIds = await Project.findAll({
      where: { ownerId: userId },
      attributes: ['id']
    });
    const projectIds = userProjectsIds.map(p => p.id);

    const avgUserRating = projectIds.length > 0 ? await Rating.findOne({
      attributes: [
        [require('sequelize').fn('AVG', require('sequelize').col('value')), 'avg']
      ],
      where: {
        projectId: { [Op.in]: projectIds }
      },
      raw: true
    }) : null;

    res.json({
      projects: {
        total: userProjects,
        active: activeUserProjects,
        completed: completedUserProjects,
        draft: draftUserProjects,
        archived: archivedUserProjects,
        asMember: userProjectsAsMember
      },
      teams: {
        asLeader: userTeams,
        asMember: userTeamsAsMember,
        total: userTeams + userTeamsAsMember
      },
      activity: {
        comments: userComments,
        ratings: userRatings
      },
      ratings: {
        average: avgUserRating ? parseFloat(avgUserRating.avg || 0).toFixed(2) : '0.00'
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при получении статистики пользователя', error: error.message });
  }
});

/**
 * @swagger
 * /api/statistics/projects:
 *   get:
 *     summary: Получить статистику по проектам
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Статистика проектов
 */
router.get('/projects', optionalAuthenticate, async (req, res) => {
  try {
    // Для администраторов и преподавателей показываем всю статистику
    // Для остальных - только публичные проекты
    const isAdminOrTeacher = req.user && (req.user.role === 'admin' || req.user.role === 'teacher');
    
    const projectWhere = isAdminOrTeacher ? {} : { visibility: 'public' };

    const projectsByStatus = await Project.findAll({
      where: projectWhere,
      attributes: [
        'status',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    const projectsByVisibility = await Project.findAll({
      where: projectWhere,
      attributes: [
        'visibility',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['visibility'],
      raw: true
    });

    const statusStats = {};
    projectsByStatus.forEach(item => {
      statusStats[item.status] = parseInt(item.count);
    });

    const visibilityStats = {};
    projectsByVisibility.forEach(item => {
      visibilityStats[item.visibility] = parseInt(item.count);
    });

    // Топ проектов по рейтингу
    const Sequelize = require('sequelize');
    const { sequelize } = require('../config/database');
    
    // Используем raw query для более надежной работы с агрегацией
    // Фильтруем по видимости для обычных пользователей
    let visibilityFilter = '';
    if (!isAdminOrTeacher) {
      visibilityFilter = "AND p.visibility = 'public'";
    }
    
    const topProjectsRaw = await sequelize.query(`
      SELECT 
        p.id,
        p.title,
        AVG(r.value)::numeric(10,2) as "avgRating",
        COUNT(r.id)::integer as "ratingCount"
      FROM projects p
      INNER JOIN ratings r ON p.id = r."projectId"
      WHERE 1=1 ${visibilityFilter}
      GROUP BY p.id, p.title
      HAVING COUNT(r.id) > 0
      ORDER BY AVG(r.value) DESC
      LIMIT 10
    `, {
      type: Sequelize.QueryTypes.SELECT
    });
    
    const topProjects = topProjectsRaw.map(p => ({
      id: p.id,
      title: p.title,
      avgRating: parseFloat(p.avgRating || 0),
      ratingCount: parseInt(p.ratingCount || 0)
    }));

    res.json({
      byStatus: statusStats,
      byVisibility: visibilityStats,
      topRated: topProjects.map(p => ({
        id: p.id,
        title: p.title,
        averageRating: parseFloat(p.avgRating || 0).toFixed(2),
        ratingCount: parseInt(p.ratingCount || 0)
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при получении статистики проектов', error: error.message });
  }
});

/**
 * @swagger
 * /api/statistics/teams:
 *   get:
 *     summary: Получить статистику по командам
 *     tags: [Statistics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Статистика команд
 */
router.get('/teams', authenticate, async (req, res) => {
  try {
    const teamsByVisibility = await Team.findAll({
      attributes: [
        'visibility',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['visibility'],
      raw: true
    });

    const visibilityStats = {};
    teamsByVisibility.forEach(item => {
      visibilityStats[item.visibility] = parseInt(item.count);
    });

    // Среднее количество участников в командах
    const Sequelize = require('sequelize');
    const { sequelize } = require('../config/database');
    
    const avgMembersRaw = await sequelize.query(`
      SELECT AVG(member_count)::numeric(10,2) as avg
      FROM (
        SELECT COUNT(tm."UserId")::integer as member_count
        FROM teams t
        LEFT JOIN "TeamMembers" tm ON t.id = tm."TeamId"
        GROUP BY t.id
      ) as team_counts
    `, {
      type: Sequelize.QueryTypes.SELECT
    });

    // Топ команд по количеству проектов
    const topTeamsRaw = await sequelize.query(`
      SELECT 
        t.id,
        t.name,
        COUNT(tp."ProjectId")::integer as "projectCount"
      FROM teams t
      LEFT JOIN "TeamProjects" tp ON t.id = tp."TeamId"
      GROUP BY t.id, t.name
      HAVING COUNT(tp."ProjectId") > 0
      ORDER BY COUNT(tp."ProjectId") DESC
      LIMIT 10
    `, {
      type: Sequelize.QueryTypes.SELECT
    });
    
    const topTeams = topTeamsRaw.map(t => ({
      id: t.id,
      name: t.name,
      projectCount: parseInt(t.projectCount || 0)
    }));

    res.json({
      byVisibility: visibilityStats,
      averageMembers: avgMembersRaw.length > 0 && avgMembersRaw[0].avg ? parseFloat(avgMembersRaw[0].avg).toFixed(2) : '0.00',
      topByProjects: topTeams
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка при получении статистики команд', error: error.message });
  }
});

module.exports = router;

