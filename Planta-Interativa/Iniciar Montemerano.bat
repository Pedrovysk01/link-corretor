@echo off
chcp 65001 >nul
cd /d "%~dp0Planta Interativa\tour"
if not exist node_modules (
  echo Instalando dependencias na primeira vez ^(precisa do Node.js 20+ de nodejs.org^)...
  call npm ci --ignore-scripts
)
echo.
echo Abrindo o tour em http://localhost:5173/
start "" http://localhost:5173/
call npm run dev
