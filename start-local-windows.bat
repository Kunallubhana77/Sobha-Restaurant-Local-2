@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 22 LTS install karke dobara koshish karein: https://nodejs.org/
  pause
  exit /b 1
)
where pnpm >nul 2>nul
if errorlevel 1 (
  echo pnpm nahin mila. Command Prompt mein chalayein: npm install --global pnpm@10.18.0
  pause
  exit /b 1
)
if not exist node_modules (
  echo Pehli baar dependencies install ho rahi hain...
  call pnpm install --frozen-lockfile
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
echo Website chal rahi hai: http://localhost:3000
call pnpm dev:static
pause
