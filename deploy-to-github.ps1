# Скрипт для деплоя на GitHub
# Запустите этот скрипт после установки Git

Write-Host "🚀 Начинаем деплой на GitHub..." -ForegroundColor Green

# Добавление Git в PATH (если установлен в стандартном месте)
$gitPath = "C:\Program Files\Git\bin"
if (Test-Path "$gitPath\git.exe") {
    $env:PATH += ";$gitPath"
}

# Проверка установки Git
try {
    $gitVersion = git --version 2>$null
    if ($gitVersion) {
        Write-Host "✅ Git установлен: $gitVersion" -ForegroundColor Green
    } else {
        throw "Git not found"
    }
} catch {
    Write-Host "❌ Git не установлен или не найден в PATH!" -ForegroundColor Red
    Write-Host "Скачайте и установите Git: https://git-scm.com/download/win" -ForegroundColor Yellow
    Write-Host "После установки перезапустите этот скрипт." -ForegroundColor Yellow
    exit 1
}

# URL репозитория
$repoUrl = "https://github.com/chayzer13/educollab.git"

# Получение директории скрипта
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir
Write-Host "Рабочая директория: $scriptDir" -ForegroundColor Gray

Write-Host "`n📦 Инициализация репозитория..." -ForegroundColor Cyan

# Настройка Git (если еще не настроено)
Write-Host "Настройка Git..." -ForegroundColor Cyan
git config --global user.name "chayzer13" 2>$null
git config --global user.email "chayzer13@users.noreply.github.com" 2>$null

# Инициализация Git (если еще не инициализирован)
if (-not (Test-Path .git)) {
    git init
    Write-Host "✅ Git репозиторий инициализирован" -ForegroundColor Green
} else {
    Write-Host "✅ Git репозиторий уже инициализирован" -ForegroundColor Green
}

# Проверка remote
Write-Host "`n🔗 Проверка подключения к GitHub..." -ForegroundColor Cyan
$remoteExists = git remote | Select-String -Pattern "origin"

if ($remoteExists) {
    Write-Host "⚠️  Remote 'origin' уже существует" -ForegroundColor Yellow
    $currentRemote = git remote get-url origin
    Write-Host "Текущий URL: $currentRemote" -ForegroundColor Yellow
    $response = Read-Host "Заменить на $repoUrl? (y/n)"
    if ($response -eq "y" -or $response -eq "Y") {
        git remote set-url origin $repoUrl
        Write-Host "✅ Remote обновлен" -ForegroundColor Green
    }
} else {
    git remote add origin $repoUrl
    Write-Host "✅ Remote добавлен" -ForegroundColor Green
}

# Добавление файлов
Write-Host "`n📝 Добавление файлов..." -ForegroundColor Cyan
git add .
Write-Host "✅ Файлы добавлены" -ForegroundColor Green

# Проверка изменений
$status = git status --short
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "⚠️  Нет изменений для коммита" -ForegroundColor Yellow
} else {
    Write-Host "`n📋 Изменения:" -ForegroundColor Cyan
    git status --short
    
    # Создание коммита
    Write-Host "`n💾 Создание коммита..." -ForegroundColor Cyan
    $commitMessage = "Initial commit: EduCollab platform"
    
    # Проверка, есть ли уже коммиты
    $commitCount = (git rev-list --count HEAD 2>$null)
    if ($commitCount -eq 0) {
        git commit -m $commitMessage
        Write-Host "✅ Первый коммит создан" -ForegroundColor Green
    } else {
        $response = Read-Host "Уже есть коммиты. Создать новый? (y/n)"
        if ($response -eq "y" -or $response -eq "Y") {
            $customMessage = Read-Host "Введите сообщение коммита (или Enter для '$commitMessage')"
            if ([string]::IsNullOrWhiteSpace($customMessage)) {
                $customMessage = $commitMessage
            }
            git commit -m $customMessage
            Write-Host "✅ Коммит создан" -ForegroundColor Green
        }
    }
}

# Переименование ветки в main (если нужно)
Write-Host "`n🌿 Проверка ветки..." -ForegroundColor Cyan
$currentBranch = git branch --show-current
if ($currentBranch -ne "main") {
    git branch -M main
    Write-Host "✅ Ветка переименована в 'main'" -ForegroundColor Green
} else {
    Write-Host "✅ Ветка уже называется 'main'" -ForegroundColor Green
}

# Отправка на GitHub
Write-Host "`n🚀 Отправка на GitHub..." -ForegroundColor Cyan
Write-Host "⚠️  Внимание: GitHub может запросить авторизацию!" -ForegroundColor Yellow
Write-Host "Используйте Personal Access Token вместо пароля." -ForegroundColor Yellow
Write-Host "Создайте токен: https://github.com/settings/tokens" -ForegroundColor Yellow
Write-Host ""

$response = Read-Host "Продолжить отправку? (y/n)"
if ($response -eq "y" -or $response -eq "Y") {
    try {
        git push -u origin main
        Write-Host "`n✅ Код успешно отправлен на GitHub!" -ForegroundColor Green
        Write-Host "🌐 Репозиторий: $repoUrl" -ForegroundColor Cyan
    } catch {
        Write-Host "`n❌ Ошибка при отправке на GitHub" -ForegroundColor Red
        Write-Host "Проверьте:" -ForegroundColor Yellow
        Write-Host "1. Правильность URL репозитория" -ForegroundColor Yellow
        Write-Host "2. Наличие прав доступа к репозиторию" -ForegroundColor Yellow
        Write-Host "3. Правильность Personal Access Token" -ForegroundColor Yellow
    }
} else {
    Write-Host "`n⏸️  Отправка отменена" -ForegroundColor Yellow
    Write-Host "Выполните вручную: git push -u origin main" -ForegroundColor Cyan
}

Write-Host "`n✨ Готово!" -ForegroundColor Green

