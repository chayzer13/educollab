const User = require('../models/User');
const { sequelize } = require('../config/database');

async function createAdmin() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Добавляем 'admin' в enum, если его еще нет
    try {
      await sequelize.query(`ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS 'admin';`);
      console.log('✅ Role "admin" added to enum');
    } catch (error) {
      // Игнорируем ошибку, если значение уже существует
      if (!error.message.includes('already exists')) {
        console.warn('Warning: Could not add admin role to enum:', error.message);
      }
    }

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@educollab.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';
    const adminFirstName = process.env.ADMIN_FIRST_NAME || 'Администратор';
    const adminLastName = process.env.ADMIN_LAST_NAME || 'Системы';

    // Проверяем, существует ли уже администратор
    const existingAdmin = await User.findOne({ where: { email: adminEmail } });
    
    if (existingAdmin) {
      if (existingAdmin.role === 'admin') {
        console.log('Администратор уже существует с email:', adminEmail);
        console.log('Для изменения пароля используйте обновление профиля.');
        process.exit(0);
      } else {
        // Обновляем роль существующего пользователя на admin
        await existingAdmin.update({ role: 'admin' });
        console.log('Роль пользователя обновлена на администратора:', adminEmail);
        process.exit(0);
      }
    }

    // Создаем нового администратора
    const admin = await User.create({
      email: adminEmail,
      password: adminPassword,
      firstName: adminFirstName,
      lastName: adminLastName,
      role: 'admin',
      isEmailVerified: true
    });

    console.log('✅ Администратор успешно создан!');
    console.log('Email:', adminEmail);
    console.log('Пароль:', adminPassword);
    console.log('Имя:', adminFirstName, adminLastName);
    console.log('\n⚠️  ВАЖНО: Измените пароль после первого входа!');
    
    process.exit(0);
  } catch (error) {
    console.error('Ошибка при создании администратора:', error);
    process.exit(1);
  }
}

createAdmin();

