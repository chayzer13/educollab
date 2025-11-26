'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Добавляем значение 'admin' в enum users_role
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS 'admin';
    `);
  },

  async down(queryInterface, Sequelize) {
    // В PostgreSQL нельзя удалить значение из enum напрямую
    // Нужно создать новый enum без 'admin' и пересоздать колонку
    // Это сложная операция, поэтому оставляем пустым или делаем предупреждение
    console.warn('Удаление значения из enum требует пересоздания типа. Операция отката не выполняется автоматически.');
  }
};
