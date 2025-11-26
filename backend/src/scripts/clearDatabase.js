const { sequelize } = require('../config/database');

async function clearDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Отключаем проверку внешних ключей временно
    await sequelize.query('SET session_replication_role = replica;');
    
    // Очищаем все таблицы в правильном порядке (сначала зависимые, потом основные)
    const tables = [
      'TeamProjects',
      'TeamMembers',
      'team_invitations',
      'activities',
      'milestones',
      'project_files',
      'ratings',
      'comments',
      'projects',
      'teams',
      'users'
    ];

    for (const table of tables) {
      try {
        await sequelize.query(`TRUNCATE TABLE "${table}" CASCADE;`);
        console.log(`✅ Очищена таблица: ${table}`);
      } catch (error) {
        // Пропускаем таблицы, которых нет
        if (error.original && error.original.code === '42P01') {
          console.log(`⚠️  Таблица ${table} не существует, пропускаем`);
        } else {
          throw error;
        }
      }
    }

    // Включаем обратно проверку внешних ключей
    await sequelize.query('SET session_replication_role = DEFAULT;');

    console.log('\n✅ База данных полностью очищена!');
    process.exit(0);
  } catch (error) {
    console.error('Ошибка при очистке базы данных:', error);
    process.exit(1);
  }
}

clearDatabase();

