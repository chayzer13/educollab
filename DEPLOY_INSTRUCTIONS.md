# Инструкция по деплою на GitHub

## Быстрый способ (рекомендуется)

1. **Двойной клик** на файл `deploy-now.bat`
2. Следуйте инструкциям на экране
3. При запросе авторизации используйте **Personal Access Token**

## Ручной способ

Откройте **новый терминал** (Git Bash, PowerShell или CMD) и выполните:

```bash
# Перейдите в директорию проекта
cd "C:\Users\Сэм\Documents\edu"

# Инициализация
git init

# Настройка Git (если еще не настроено)
git config --global user.name "chayzer13"
git config --global user.email "chayzer13@users.noreply.github.com"

# Добавление файлов
git add .

# Создание коммита
git commit -m "Initial commit: EduCollab platform"

# Подключение к GitHub
git remote add origin https://github.com/chayzer13/educollab.git

# Переименование ветки
git branch -M main

# Отправка на GitHub
git push -u origin main
```

## Авторизация на GitHub

При выполнении `git push` GitHub запросит:

- **Username:** `chayzer13`
- **Password:** используйте **Personal Access Token** (не пароль!)

### Создание Personal Access Token:

1. Перейдите: https://github.com/settings/tokens
2. Нажмите **"Generate new token"** → **"Generate new token (classic)"**
3. Название: `EduCollab Deploy`
4. Срок действия: выберите нужный (рекомендуется 90 дней)
5. Права: выберите **`repo`** (полный доступ к репозиториям)
6. Нажмите **"Generate token"**
7. **Скопируйте токен** (он показывается только один раз!)
8. Используйте этот токен как пароль при `git push`

## Проверка

После успешного деплоя откройте:
**https://github.com/chayzer13/educollab**

Все файлы должны быть загружены.

## Дальнейшие обновления

После изменений в коде:

```bash
git add .
git commit -m "Описание изменений"
git push
```

