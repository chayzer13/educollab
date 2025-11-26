const { sequelize } = require('../config/database');

async function archiveOldProjects() {
  try {
    // Archive projects that are completed and older than 1 year
    const archiveQuery = `
      UPDATE projects
      SET status = 'archived'
      WHERE status = 'completed'
      AND "updatedAt" < NOW() - INTERVAL '1 year'
    `;

    const [result] = await sequelize.query(archiveQuery);
    console.log(`📦 Archived ${result.rowCount || 0} old projects`);

    // In production, you might want to move archived projects to separate table
    // or export to cold storage
  } catch (error) {
    console.error('Error archiving projects:', error);
    throw error;
  }
}

module.exports = { archiveOldProjects };





