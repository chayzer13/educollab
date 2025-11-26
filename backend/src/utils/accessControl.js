const Project = require('../models/Project');
const Team = require('../models/Team');

/**
 * Проверяет, имеет ли пользователь доступ к проекту
 * @param {Object} project - Проект
 * @param {Object} user - Пользователь
 * @returns {Promise<boolean>} - true если есть доступ, false если нет
 */
async function hasProjectAccess(project, user) {
  // Публичные проекты доступны всем
  if (project.visibility === 'public') {
    return true;
  }

  // Приватные проекты доступны только:
  // 1. Владельцу проекта
  // 2. Участникам команд, связанных с проектом
  // 3. Преподавателям

  if (project.ownerId === user.id) {
    return true;
  }

  if (user.role === 'teacher' || user.role === 'admin') {
    return true;
  }

  // Проверяем, является ли пользователь участником проекта
  const projectWithMembers = await Project.findByPk(project.id, {
    include: [{
      model: require('../models/User'),
      as: 'members',
      attributes: ['id']
    }]
  });

  if (projectWithMembers && projectWithMembers.members) {
    if (projectWithMembers.members.some(member => member.id === user.id)) {
      return true;
    }
  }

  // Проверяем, является ли пользователь участником команды, связанной с проектом
  const projectWithTeams = await Project.findByPk(project.id, {
    include: [{
      model: Team,
      as: 'teams',
      include: [{
        model: require('../models/User'),
        as: 'members',
        attributes: ['id']
      }],
      attributes: ['id', 'leaderId']
    }]
  });

  if (projectWithTeams && projectWithTeams.teams) {
    for (const team of projectWithTeams.teams) {
      // Проверяем, является ли пользователь лидером команды
      if (team.leaderId === user.id) {
        return true;
      }
      // Проверяем, является ли пользователь участником команды
      if (team.members && team.members.some(member => member.id === user.id)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Проверяет, имеет ли пользователь доступ к команде
 * @param {Object} team - Команда
 * @param {Object} user - Пользователь
 * @returns {boolean} - true если есть доступ, false если нет
 */
function hasTeamAccess(team, user) {
  // Публичные команды доступны всем авторизованным пользователям
  if (team.visibility === 'public') {
    return true;
  }

  // Приватные команды доступны только:
  // 1. Лидеру команды
  // 2. Участникам команды
  // 3. Преподавателям

  if (team.leaderId === user.id) {
    return true;
  }

  if (user.role === 'teacher' || user.role === 'admin') {
    return true;
  }

  // Проверяем, является ли пользователь участником команды
  if (team.members && team.members.some(member => member.id === user.id)) {
    return true;
  }

  return false;
}

module.exports = {
  hasProjectAccess,
  hasTeamAccess
};




