# 🚀 Деплой на GitHub - Быстрый старт

## ✅ Git установлен!

Теперь выполните деплой одним из способов:

## Способ 1: Автоматический (самый простой)

**Двойной клик** на файл:
```
deploy-now.bat
```

Скрипт автоматически выполнит все необходимые действия.

## Способ 2: PowerShell скрипт

Откройте PowerShell в директории проекта и выполните:
```powershell
.\deploy-to-github.ps1
```

## Способ 3: Вручную

Откройте **Git Bash** или **новый терминал** и выполните:

```bash
# Перейдите в директорию проекта
cd "C:\Users\Сэм\Documents\edu"

# Инициализация
git init

# Настройка (если еще не настроено)
git config --global user.name "chayzer13"
git config --global user.email "chayzer13@users.noreply.github.com"

# Добавление файлов
git add .

# Коммит
git commit -m "Initial commit: EduCollab platform"

# Подключение к GitHub
git remote add origin https://github.com/chayzer13/educollab.git

# Ветка
git branch -M main

# Отправка (потребуется авторизация!)
git push -u origin main
```

## 🔐 Авторизация на GitHub

При `git push` GitHub запросит:
- **Username:** `chayzer13`
- **Password:** используйте **Personal Access Token** (не пароль!)

### Создание токена:
1. https://github.com/settings/tokens
2. Generate new token (classic)
3. Права: `repo`
4. Скопируйте токен и используйте как пароль

## 📚 Подробные инструкции

- [DEPLOY_INSTRUCTIONS.md](./DEPLOY_INSTRUCTIONS.md) - полная инструкция
- [GITHUB_DEPLOY.md](./GITHUB_DEPLOY.md) - подробное руководство

