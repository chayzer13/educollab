# Быстрый старт: Деплой на GitHub

## Если Git уже установлен

Выполните следующие команды в терминале:

```bash
# 1. Инициализация репозитория
git init

# 2. Добавление всех файлов
git add .

# 3. Создание первого коммита
git commit -m "Initial commit: EduCollab platform"

# 4. Создайте репозиторий на GitHub (через веб-интерфейс)
#    https://github.com/new
#    Название: educollab (или другое)
#    НЕ добавляйте README, .gitignore или лицензию

# 5. Подключите локальный репозиторий к GitHub
git remote add origin https://github.com/chayzer13/educollab.git

# 6. Переименуйте ветку в main
git branch -M main

# 7. Отправьте код на GitHub
git push -u origin main
```

## Если Git не установлен

**См. подробную инструкцию:** [INSTALL_GIT_AND_DEPLOY.md](./INSTALL_GIT_AND_DEPLOY.md)

Кратко:
1. Скачайте Git: https://git-scm.com/download/win
2. Установите Git (выберите "Git from the command line")
3. Перезапустите терминал
4. Выполните команды выше

## Авторизация на GitHub

При `git push` GitHub может запросить авторизацию:
- Используйте **Personal Access Token** вместо пароля
- Создайте токен: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token
- Выберите права: `repo` (полный доступ к репозиториям)

## Автоматический деплой

Используйте готовый скрипт:
```powershell
.\deploy-to-github.ps1
```

## Подробные инструкции

- [INSTALL_GIT_AND_DEPLOY.md](./INSTALL_GIT_AND_DEPLOY.md) - установка Git и деплой
- [GITHUB_DEPLOY.md](./GITHUB_DEPLOY.md) - подробная инструкция по деплою

