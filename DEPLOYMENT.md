# Руководство по деплою EduCollab

## Локальный запуск с Docker

```bash
# 1. Клонировать репозиторий
git clone <repository-url>
cd educollab

# 2. Создать .env файлы (опционально, есть значения по умолчанию)
cp backend/.env.example backend/.env

# 3. Запустить все сервисы
docker-compose up -d

# 4. Проверить статус
docker-compose ps

# 5. Просмотреть логи
docker-compose logs -f
```

Приложение будет доступно:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- Swagger: http://localhost:3001/api-docs
- Nginx: http://localhost

## Локальный запуск без Docker

### Требования
- Node.js 18+
- PostgreSQL 15+
- npm или yarn

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Настроить .env файл с параметрами БД
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm start
```

### Background Service

```bash
cd background-service
npm install
npm run dev
```

## Production деплой

### 1. Подготовка

```bash
# Создать production .env файлы
# Настроить переменные окружения:
# - JWT_SECRET (сильный случайный ключ)
# - DB_PASSWORD (надежный пароль)
# - SMTP настройки для уведомлений
```

### 2. Docker Production

```bash
# Собрать образы
docker-compose -f docker-compose.prod.yml build

# Запустить
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Heroku

```bash
# Установить Heroku CLI
# Создать приложения
heroku create educollab-backend
heroku create educollab-frontend

# Настроить переменные окружения
heroku config:set JWT_SECRET=your-secret --app educollab-backend
heroku config:set DB_HOST=... --app educollab-backend

# Деплой
git push heroku main
```

### 4. VPS (Ubuntu/Debian)

```bash
# Установить Docker и Docker Compose
sudo apt update
sudo apt install docker.io docker-compose

# Клонировать репозиторий
git clone <repository-url>
cd educollab

# Настроить .env файлы
# Запустить
sudo docker-compose up -d

# Настроить Nginx как reverse proxy (если нужно)
# Настроить SSL сертификаты (Let's Encrypt)
```

## Миграции базы данных

```bash
# Применить миграции
docker-compose exec backend npm run migrate

# Откатить последнюю миграцию
docker-compose exec backend npm run migrate:undo
```

## Мониторинг

- Проверить здоровье: `curl http://localhost:3001/health`
- Логи: `docker-compose logs -f [service-name]`
- Статистика: `docker stats`

## Резервное копирование БД

```bash
# Создать бэкап
docker-compose exec postgres pg_dump -U educollab educollab > backup.sql

# Восстановить
docker-compose exec -T postgres psql -U educollab educollab < backup.sql
```





