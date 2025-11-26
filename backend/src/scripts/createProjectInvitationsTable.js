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
        AND table_name = 'project_invitations'
      );
    `);

    if (!results[0].exists) {
      await sequelize.query(`
        CREATE TABLE "project_invitations" (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
          "projectId" UUID NOT NULL REFERENCES projects(id) ON UPDATE CASCADE ON DELETE CASCADE,
          "userId" UUID NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
          "invitedById" UUID NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✅ Table project_invitations created!');
    } else {
      console.log('ℹ️ Table project_invitations already exists.');
    }

    // Создаем уникальный индекс для pending приглашений
    const [indexResults] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM pg_indexes 
        WHERE indexname = 'project_invitations_projectId_userId_pending'
      );
    `);

    if (!indexResults[0].exists) {
      await sequelize.query(`
        CREATE UNIQUE INDEX "project_invitations_projectId_userId_pending" 
        ON "project_invitations"("projectId", "userId") 
        WHERE status = 'pending';
      `);
      console.log('✅ Unique index created!');
    } else {
      console.log('ℹ️ Unique index already exists.');
    }

    console.log('✅ Table project_invitations setup completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating table:', error);
    process.exit(1);
  }
}

createTable();


