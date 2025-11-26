# EduCollab

Платформа для совместной работы над учебными проектами, где студенты, преподаватели и менторы могут публиковать проекты, создавать команды, отслеживать прогресс, комментировать и оценивать работы.

## 🚀 Технологический стек

### Frontend
- **React** - UI библиотека
- **React Router** - маршрутизация
- **Axios** - HTTP клиент
- **Material-UI / Tailwind CSS** - стилизация

### Backend
- **Node.js** + **Express** - серверная часть
- **PostgreSQL** - реляционная база данных
- **Sequelize** - ORM
- **JWT** - аутентификация
- **bcrypt** - хеширование паролей

### DevOps
- **Docker** + **Docker Compose** - контейнеризация
- **Nginx** - reverse proxy
- **GitHub Actions** - CI/CD

### Дополнительно
- **Swagger** - API документация
- **Jest** - тестирование
- **Background Service** - фоновые задачи (уведомления, аналитика)

## 📁 Структура проекта

```
educollab/
├── backend/          # Node.js/Express API
├── frontend/         # React приложение
├── background-service/ # Фоновые сервисы
├── nginx/            # Nginx конфигурация
├── docker-compose.yml
└── README.md
```

## 🛠️ Установка и запуск

### С Docker (рекомендуется)

```bash
# Клонировать репозиторий
git clone <repository-url>
cd educollab

# Запустить все сервисы
docker-compose up -d

# Применить миграции БД
docker-compose exec backend npm run migrate

# Заполнить тестовыми данными (опционально)
docker-compose exec backend npm run seed
```

Приложение будет доступно:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- Swagger: http://localhost:3001/api-docs
- Nginx: http://localhost

### Без Docker

#### Backend

```bash
cd backend
npm install
cp .env.example .env
# Настроить .env файл
npm run migrate
npm run dev
```

#### Frontend

```bash
cd frontend
npm install
npm start
```

## 📚 API Документация

После запуска сервера, Swagger документация доступна по адресу:
- http://localhost:3001/api-docs

## 🧪 Тестирование

```bash
# Все тесты
npm test

# Только backend
npm run test:backend

# Только frontend
npm run test:frontend
```

## 🔐 Аутентификация

Приложение использует JWT токены для аутентификации. После успешного входа, токен сохраняется в localStorage и автоматически добавляется к каждому запросу.

## 📝 Основные функции

- ✅ Регистрация и авторизация пользователей
- ✅ Создание и управление проектами
- ✅ Создание и участие в командах
- ✅ Комментирование проектов
- ✅ Оценка проектов
- ✅ Отслеживание прогресса
- ✅ Профили пользователей
- ✅ Уведомления
- ✅ Статистика и аналитика

## 🚢 Деплой

### GitHub

Подробная инструкция по деплою на GitHub: [GITHUB_DEPLOY.md](./GITHUB_DEPLOY.md)

### Другие платформы

Проект готов к деплою на:
- Heroku
- AWS
- DigitalOcean
- VPS с Docker

## 📄 Лицензия

MIT
