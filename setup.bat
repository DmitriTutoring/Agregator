@echo off
setlocal EnableExtensions
cd /d "%~dp0"

echo.
echo ==========================================
echo   News Aggregator - Windows setup
echo ==========================================
echo.

where node >nul 2>&1
if errorlevel 1 goto install_node

where npm >nul 2>&1
if errorlevel 1 goto install_node

goto node_ready

:install_node
echo Node.js is not available on this computer.
where winget >nul 2>&1
if errorlevel 1 (
  echo.
  echo winget is not available.
  echo Install Node.js LTS manually from https://nodejs.org/
  echo Then run this file again.
  pause
  exit /b 1
)

echo Installing Node.js LTS with winget...
winget install --id OpenJS.NodeJS.LTS --exact --source winget
if errorlevel 1 (
  echo.
  echo Node.js installation failed or was cancelled.
  pause
  exit /b 1
)

if exist "%ProgramFiles%\nodejs" set "PATH=%ProgramFiles%\nodejs;%PATH%"
if exist "%ProgramFiles(x86)%\nodejs" set "PATH=%ProgramFiles(x86)%\nodejs;%PATH%"

where node >nul 2>&1
if errorlevel 1 (
  echo.
  echo Node.js was installed, but Windows has not refreshed PATH yet.
  echo Close this window, open a new one, and run setup.bat again.
  pause
  exit /b 1
)

:node_ready
echo Node.js:
node --version
echo npm:
npm --version
echo.

if not exist package.json (
  echo package.json was not found. Run this file from the project folder.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installing project dependencies...
  if exist package-lock.json (
    call npm ci
  ) else (
    call npm install
  )
  if errorlevel 1 (
    echo.
    echo Dependency installation failed.
    pause
    exit /b 1
  )
) else (
  echo Project dependencies are already installed.
)

if not exist .env (
  echo.
  echo WARNING: .env was not found.
  echo News and the NBP currency module can work without API keys,
  echo but weather, cryptocurrency, and metals need the private .env file.
  echo.
)

echo.
echo Starting News Aggregator...
start "News Aggregator Server" cmd /k "cd /d ""%~dp0"" && npm start"
timeout /t 3 /nobreak >nul
start "" http://localhost:3000
exit /b 0