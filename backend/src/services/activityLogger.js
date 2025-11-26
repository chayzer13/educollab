const Activity = require('../models/Activity');

/**
 * Создает запись активности
 * @param {Object} params - Параметры активности
 * @param {string} params.type - Тип активности
 * @param {string} params.description - Описание активности
 * @param {string} params.userId - ID пользователя, выполнившего действие
 * @param {string} [params.teamId] - ID команды (если применимо)
 * @param {string} [params.projectId] - ID проекта (если применимо)
 * @param {Object} [params.metadata] - Дополнительные данные
 */
async function logActivity({ type, description, userId, teamId = null, projectId = null, metadata = {} }) {
  try {
    await Activity.create({
      type,
      description,
      userId,
      teamId,
      projectId,
      metadata
    });
  } catch (error) {
    console.error('Error logging activity:', error);
    // Не прерываем выполнение, если не удалось записать активность
  }
}

module.exports = { logActivity };





