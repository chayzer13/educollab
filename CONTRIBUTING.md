# Руководство по разработке

## Структура проекта

```
educollab/
├── backend/              # Node.js/Express API
│   ├── src/
│   │   ├── config/      # Конфигурация (БД, etc)
│   │   ├── models/      # Sequelize модели
│   │   ├── routes/      # API маршруты
│   │   ├── middleware/  # Express middleware
│   │   └── tests/       # Тесты
├── frontend/            # React приложение
│   ├── src/
│   │   ├── components/  # React компоненты
│   │   ├── pages/       # Страницы
│   │   ├── context/     # React Context
│   │   └── services/    # API клиенты
├── background-service/  # Фоновые задачи
└── nginx/              # Nginx конфигурация
```

## Стандарты кода

- Использовать ESLint и Prettier
- Следовать соглашениям именования:
  - Компоненты: PascalCase
  - Функции/переменные: camelCase
  - Константы: UPPER_SNAKE_CASE
  - Файлы: camelCase для JS, kebab-case для остальных

## Git workflow

1. Создать ветку от `develop`: `git checkout -b feature/feature-name`
2. Внести изменения
3. Написать тесты
4. Убедиться, что все тесты проходят
5. Создать Pull Request

## Тестирование

```bash
# Backend тесты
cd backend && npm test

# Frontend тесты
cd frontend && npm test

# Все тесты
npm test
```

## API документация

После изменений в API обновить Swagger аннотации в файлах маршрутов.

## Коммиты

Использовать conventional commits:
- `feat:` новая функциональность
- `fix:` исправление бага
- `docs:` изменения в документации
- `style:` форматирование
- `refactor:` рефакторинг
- `test:` добавление тестов
- `chore:` обновление зависимостей и т.д.





