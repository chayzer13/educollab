# Настройка переменных окружения

## Backend (.env)

Создайте файл `backend/.env` на основе следующего шаблона:

```env
NODE_ENV=development
PORT=3001

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=educollab
DB_PASSWORD=educollab_password
DB_NAME=educollab

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_EXPIRES_IN=7d

# Email (для уведомлений)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

## Frontend (.env)

Создайте файл `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:3001/api
```

## Background Service (.env)

Создайте файл `background-service/.env`:

```env
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USER=educollab
DB_PASSWORD=educollab_password
DB_NAME=educollab
API_URL=http://localhost:3001/api
```

## Production настройки

Для production обязательно измените:
- `JWT_SECRET` - используйте сильный случайный ключ (минимум 32 символа)
- `DB_PASSWORD` - надежный пароль для БД
- `NODE_ENV=production`
- Настройте реальные SMTP credentials для отправки email

## Генерация JWT_SECRET

```bash
# Linux/macOS
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```





