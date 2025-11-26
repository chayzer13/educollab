# Установка Git и деплой на GitHub

## ⚠️ Git не установлен в системе

Для деплоя на GitHub необходимо установить Git.

## Шаг 1: Установка Git

1. **Скачайте Git для Windows:**
   - Перейдите на: https://git-scm.com/download/win
   - Скачайте установщик (Git for Windows)
   - Запустите установщик и следуйте инструкциям
   - **Важно:** При установке выберите опцию "Git from the command line and also from 3rd-party software"

2. **Перезапустите терминал** после установки

3. **Проверьте установку:**
   ```powershell
   git --version
   ```
   Должна отобразиться версия Git (например, `git version 2.42.0`)

## Шаг 2: Настройка Git (первый раз)

```powershell
git config --global user.name "Ваше Имя"
git config --global user.email "ваш.email@example.com"
```

## Шаг 3: Деплой на GitHub

### Вариант А: Автоматический (рекомендуется)

Запустите скрипт:
```powershell
.\deploy-to-github.ps1
```

Скрипт автоматически выполнит все необходимые действия.

### Вариант Б: Ручной

Выполните команды вручную:

```powershell
# 1. Инициализация
git init

# 2. Добавление файлов
git add .

# 3. Первый коммит
git commit -m "Initial commit: EduCollab platform"

# 4. Подключение к GitHub
git remote add origin https://github.com/chayzer13/educollab.git

# 5. Переименование ветки
git branch -M main

# 6. Отправка на GitHub
git push -u origin main
```

## Шаг 4: Авторизация на GitHub

При выполнении `git push` GitHub запросит авторизацию:

1. **Используйте Personal Access Token** (не пароль!)
2. **Создайте токен:**
   - Перейдите: https://github.com/settings/tokens
   - Нажмите "Generate new token" → "Generate new token (classic)"
   - Название: `EduCollab Deploy`
   - Срок действия: выберите нужный (рекомендуется 90 дней)
   - Права: выберите `repo` (полный доступ к репозиториям)
   - Нажмите "Generate token"
   - **Скопируйте токен** (он показывается только один раз!)

3. **При запросе пароля:**
   - Username: ваш GitHub username (`chayzer13`)
   - Password: вставьте Personal Access Token

## Проверка

После успешного деплоя откройте:
https://github.com/chayzer13/educollab

Все файлы должны быть загружены.

## Дальнейшие обновления

После изменений в коде:

```powershell
git add .
git commit -m "Описание изменений"
git push
```

## Проблемы?

- **"git: command not found"** → Git не установлен или не добавлен в PATH. Переустановите Git.
- **"Permission denied"** → Проверьте Personal Access Token и права доступа к репозиторию.
- **"Repository not found"** → Проверьте URL репозитория и наличие прав доступа.

