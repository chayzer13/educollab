@echo off
REM Скрипт для деплоя на GitHub
REM Запустите этот файл двойным кликом или из терминала

echo ========================================
echo   Деплой EduCollab на GitHub
echo ========================================
echo.

REM Добавление Git в PATH
set "PATH=%PATH%;C:\Program Files\Git\bin"

REM Проверка Git
git --version >nul 2>&1
if errorlevel 1 (
    echo [ОШИБКА] Git не найден!
    echo Установите Git: https://git-scm.com/download/win
    pause
    exit /b 1
)

echo [OK] Git найден
echo.

REM Переход в директорию скрипта
cd /d "%~dp0"

REM Настройка Git (если еще не настроено)
echo Настройка Git...
git config --global user.name "chayzer13" 2>nul
git config --global user.email "chayzer13@users.noreply.github.com" 2>nul
echo [OK] Git настроен
echo.

REM Инициализация репозитория
if not exist ".git" (
    echo Инициализация Git репозитория...
    git init
    echo [OK] Репозиторий инициализирован
) else (
    echo [OK] Репозиторий уже инициализирован
)
echo.

REM Проверка remote
echo Проверка подключения к GitHub...
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo Добавление remote origin...
    git remote add origin https://github.com/chayzer13/educollab.git
    echo [OK] Remote добавлен
) else (
    echo [OK] Remote уже настроен
)
echo.

REM Добавление файлов
echo Добавление файлов...
git add .
echo [OK] Файлы добавлены
echo.

REM Создание коммита
echo Создание коммита...
git commit -m "Initial commit: EduCollab platform" >nul 2>&1
if errorlevel 1 (
    echo [ПРЕДУПРЕЖДЕНИЕ] Нет изменений для коммита или коммит уже существует
) else (
    echo [OK] Коммит создан
)
echo.

REM Переименование ветки
echo Настройка ветки...
git branch -M main >nul 2>&1
echo [OK] Ветка настроена
echo.

REM Отправка на GitHub
echo ========================================
echo   Отправка на GitHub...
echo ========================================
echo.
echo ВАЖНО: GitHub запросит авторизацию!
echo Используйте Personal Access Token вместо пароля.
echo Создайте токен: https://github.com/settings/tokens
echo.
pause

echo Отправка кода...
git push -u origin main

if errorlevel 1 (
    echo.
    echo [ОШИБКА] Не удалось отправить код на GitHub
    echo.
    echo Проверьте:
    echo 1. Правильность Personal Access Token
    echo 2. Наличие прав доступа к репозиторию
    echo 3. Правильность URL репозитория
    echo.
) else (
    echo.
    echo ========================================
    echo   [УСПЕХ] Код отправлен на GitHub!
    echo ========================================
    echo.
    echo Репозиторий: https://github.com/chayzer13/educollab
    echo.
)

pause

