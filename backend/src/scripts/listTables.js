const { sequelize } = require('../config/database');

async function listTables() {
  try {
    await sequelize.authenticate();
    const [results] = await sequelize.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"
    );
    console.log('Таблицы в базе данных:');
    results.forEach(r => console.log(' -', r.tablename));
    process.exit(0);
  } catch (error) {
    console.error('Ошибка:', error);
    process.exit(1);
  }
}

listTables();


