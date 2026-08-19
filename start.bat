@echo off
setlocal
cd /d "%~dp0"

echo ============================================
echo         Starting Nabd Gym Management
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js was not found on this machine.
    echo Please install Node.js from https://nodejs.org first.
    echo.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo [First run] Installing base packages... this may take a few minutes.
    call npm install
    if errorlevel 1 (
        echo.
        echo [ERROR] Failed to install packages. See the message above.
        pause
        exit /b 1
    )
    echo.
)

if not exist "server\node_modules" (
    echo [Setup] Installing server packages...
    pushd server
    call npm install
    popd
    echo.
)

echo [Starting the application...]
echo First launch may take longer than usual (setting up the local database).
echo.

call npm run dev:electron

echo.
echo ============================================
echo Application closed.
echo ============================================
pause