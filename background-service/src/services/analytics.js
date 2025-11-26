const { sequelize } = require('../config/database');

async function analyzeActivity() {
  try {
    // Analyze user activity
    const userActivityQuery = `
      SELECT 
        DATE("createdAt") as date,
        COUNT(*) as projects_created
      FROM projects
      WHERE "createdAt" > NOW() - INTERVAL '30 days'
      GROUP BY DATE("createdAt")
      ORDER BY date DESC
    `;

    const [userActivity] = await sequelize.query(userActivityQuery);
    console.log('📊 User activity:', userActivity);

    // Analyze project statistics
    const projectStatsQuery = `
      SELECT 
        status,
        COUNT(*) as count,
        AVG(progress) as avg_progress
      FROM projects
      GROUP BY status
    `;

    const [projectStats] = await sequelize.query(projectStatsQuery);
    console.log('📊 Project statistics:', projectStats);

    // Analyze rating statistics
    const ratingStatsQuery = `
      SELECT 
        AVG(value) as avg_rating,
        COUNT(*) as total_ratings
      FROM ratings
    `;

    const [ratingStats] = await sequelize.query(ratingStatsQuery);
    console.log('📊 Rating statistics:', ratingStats);

    // In production, save to analytics table or external service
  } catch (error) {
    console.error('Error analyzing activity:', error);
    throw error;
  }
}

module.exports = { analyzeActivity };





