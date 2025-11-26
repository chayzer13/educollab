const { sequelize } = require('../config/database');
const axios = require('axios');

async function sendNotifications() {
  // Example: Send notifications for new comments on projects
  const query = `
    SELECT DISTINCT p.id, p.title, p."ownerId", u.email, u."firstName"
    FROM projects p
    JOIN comments c ON c."projectId" = p.id
    JOIN users u ON u.id = p."ownerId"
    WHERE c."createdAt" > NOW() - INTERVAL '1 hour'
    AND p."ownerId" != c."userId"
  `;

  try {
    const [results] = await sequelize.query(query);
    
    for (const result of results) {
      // In production, use actual email service
      console.log(`📧 Would send notification to ${result.email} about comment on project "${result.title}"`);
      
      // Example API call to notification service
      // await axios.post(`${process.env.API_URL}/notifications`, {
      //   userId: result.ownerId,
      //   type: 'comment',
      //   message: `Новый комментарий к проекту "${result.title}"`
      // });
    }
  } catch (error) {
    console.error('Error sending notifications:', error);
    throw error;
  }
}

module.exports = { sendNotifications };





