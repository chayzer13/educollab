const { sequelize } = require('../config/database');

async function createTable() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Проверяем, существует ли таблица
    const [results] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ProjectMembers'
      );
    `);

    if (!results[0].exists) {
      await sequelize.query(`
        CREATE TABLE "ProjectMembers" (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "projectId" UUID NOT NULL REFERENCES projects(id) ON UPDATE CASCADE ON DELETE CASCADE,
          "userId" UUID NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✅ Table ProjectMembers created!');
    } else {
      console.log('ℹ️ Table ProjectMembers already exists.');
    }

    // Проверяем структуру таблицы
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'ProjectMembers';
    `);
    console.log('Table columns:', columns);

    // Создаем уникальный индекс (проверяем правильные имена колонок)
    const [indexResults] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM pg_indexes 
        WHERE indexname = 'ProjectMembers_projectId_userId_unique'
      );
    `);

    if (!indexResults[0].exists) {
      // Используем правильные имена колонок из структуры таблицы
      const projectIdCol = columns.find(c => c.column_name.toLowerCase() === 'projectid')?.column_name || 'ProjectId';
      const userIdCol = columns.find(c => c.column_name.toLowerCase() === 'userid')?.column_name || 'UserId';
      
      await sequelize.query(`
        CREATE UNIQUE INDEX "ProjectMembers_projectId_userId_unique" 
        ON "ProjectMembers"("${projectIdCol}", "${userIdCol}");
      `);
      console.log('✅ Unique index created!');
    } else {
      console.log('ℹ️ Unique index already exists.');
    }

    console.log('✅ Table ProjectMembers created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating table:', error);
    process.exit(1);
  }
}

createTable();

