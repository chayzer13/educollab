#!/bin/bash
# Скрипт для деплоя на GitHub (Linux/Mac)
# Запустите: bash deploy-to-github.sh

echo "🚀 Начинаем деплой на GitHub..."

# Проверка установки Git
if ! command -v git &> /dev/null; then
    echo "❌ Git не установлен!"
    echo "Установите Git: https://git-scm.com/downloads"
    exit 1
fi

echo "✅ Git установлен: $(git --version)"

# URL репозитория
REPO_URL="https://github.com/chayzer13/educollab.git"

echo ""
echo "📦 Инициализация репозитория..."

# Инициализация Git (если еще не инициализирован)
if [ ! -d .git ]; then
    git init
    echo "✅ Git репозиторий инициализирован"
else
    echo "✅ Git репозиторий уже инициализирован"
fi

# Проверка remote
echo ""
echo "🔗 Проверка подключения к GitHub..."
if git remote | grep -q "origin"; then
    echo "⚠️  Remote 'origin' уже существует"
    CURRENT_REMOTE=$(git remote get-url origin)
    echo "Текущий URL: $CURRENT_REMOTE"
    read -p "Заменить на $REPO_URL? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git remote set-url origin "$REPO_URL"
        echo "✅ Remote обновлен"
    fi
else
    git remote add origin "$REPO_URL"
    echo "✅ Remote добавлен"
fi

# Добавление файлов
echo ""
echo "📝 Добавление файлов..."
git add .
echo "✅ Файлы добавлены"

# Проверка изменений
if [ -z "$(git status --short)" ]; then
    echo "⚠️  Нет изменений для коммита"
else
    echo ""
    echo "📋 Изменения:"
    git status --short
    
    # Создание коммита
    echo ""
    echo "💾 Создание коммита..."
    COMMIT_MESSAGE="Initial commit: EduCollab platform"
    
    # Проверка, есть ли уже коммиты
    COMMIT_COUNT=$(git rev-list --count HEAD 2>/dev/null || echo "0")
    if [ "$COMMIT_COUNT" -eq 0 ]; then
        git commit -m "$COMMIT_MESSAGE"
        echo "✅ Первый коммит создан"
    else
        read -p "Уже есть коммиты. Создать новый? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            read -p "Введите сообщение коммита (или Enter для '$COMMIT_MESSAGE'): " CUSTOM_MESSAGE
            if [ -z "$CUSTOM_MESSAGE" ]; then
                CUSTOM_MESSAGE="$COMMIT_MESSAGE"
            fi
            git commit -m "$CUSTOM_MESSAGE"
            echo "✅ Коммит создан"
        fi
    fi
fi

# Переименование ветки в main (если нужно)
echo ""
echo "🌿 Проверка ветки..."
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    git branch -M main
    echo "✅ Ветка переименована в 'main'"
else
    echo "✅ Ветка уже называется 'main'"
fi

# Отправка на GitHub
echo ""
echo "🚀 Отправка на GitHub..."
echo "⚠️  Внимание: GitHub может запросить авторизацию!"
echo "Используйте Personal Access Token вместо пароля."
echo "Создайте токен: https://github.com/settings/tokens"
echo ""

read -p "Продолжить отправку? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if git push -u origin main; then
        echo ""
        echo "✅ Код успешно отправлен на GitHub!"
        echo "🌐 Репозиторий: $REPO_URL"
    else
        echo ""
        echo "❌ Ошибка при отправке на GitHub"
        echo "Проверьте:"
        echo "1. Правильность URL репозитория"
        echo "2. Наличие прав доступа к репозиторию"
        echo "3. Правильность Personal Access Token"
    fi
else
    echo ""
    echo "⏸️  Отправка отменена"
    echo "Выполните вручную: git push -u origin main"
fi

echo ""
echo "✨ Готово!"

