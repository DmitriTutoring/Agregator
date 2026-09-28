@echo off
cd /d "%~dp0"
if not exist node_modules (
  echo Installing dependencies...
  call npm install
)
start "News Aggregator" cmd /k "npm start"
timeout /t 2 >nul
start "" http://localhost:3000
