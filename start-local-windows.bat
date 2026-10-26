@echo off
setlocal
cd /d "%~dp0"

echo ========================================================
echo       Sobha Restaurant Demo - Local Server Launcher
echo ========================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js nahi mila!
  echo Kripya pehle Node.js (LTS version) download aur install karein:
  echo https://nodejs.org/
  echo.
  pause
  exit /b 1
)

where pnpm >nul 2>nul
if errorlevel 1 (
  echo [INFO] pnpm package manager install kiya ja raha hai...
  call npm install --global pnpm
  if errorlevel 1 (
    echo [ERROR] pnpm install nahi ho saka. Kripya terminal mein chalayein: npm install -g pnpm
    pause
    exit /b 1
  )
)

if not exist node_modules (
  echo [INFO] Pehli baar dependencies install ho rahi hain (1-2 minute lag sakte hain)...
  call pnpm install
  if errorlevel 1 (
    echo [ERROR] Dependencies install nahi ho sakein.
    pause
    exit /b 1
  )
)

echo.
echo ========================================================
echo Website ready hai!
echo [1] Consumer / Customer Website : http://localhost:3000/
echo [2] Admin / Staff Dashboard    : http://localhost:3000/staff
echo.
echo Staff Admin Password : AdminSobha2026!
echo Food Order Demo Code : SobhaDemo2026!
echo ========================================================
echo.

call pnpm dev
pause
