require('dotenv').config();
const cron = require('node-cron');
const { sequelize } = require('./config/database');
const { sendNotifications } = require('./services/notifications');
const { analyzeActivity } = require('./services/analytics');
const { archiveOldProjects } = require('./services/archiver');

console.log('🚀 Background Service started');

// Connect to database
async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

// Run every hour - send notifications
cron.schedule('0 * * * *', async () => {
  console.log('📧 Running notification job...');
  try {
    await sendNotifications();
    console.log('✅ Notifications sent');
  } catch (error) {
    console.error('❌ Notification error:', error);
  }
});

// Run daily at midnight - analyze activity
cron.schedule('0 0 * * *', async () => {
  console.log('📊 Running analytics job...');
  try {
    await analyzeActivity();
    console.log('✅ Analytics updated');
  } catch (error) {
    console.error('❌ Analytics error:', error);
  }
});

// Run weekly on Sunday - archive old projects
cron.schedule('0 0 * * 0', async () => {
  console.log('📦 Running archiver job...');
  try {
    await archiveOldProjects();
    console.log('✅ Projects archived');
  } catch (error) {
    console.error('❌ Archiver error:', error);
  }
});

// Initialize
connectDB();

// Keep process alive
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing database connection...');
  await sequelize.close();
  process.exit(0);
});





