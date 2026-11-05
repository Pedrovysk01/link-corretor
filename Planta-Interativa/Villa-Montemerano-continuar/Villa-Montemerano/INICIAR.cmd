@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Instale o Node.js LTS em https://nodejs.org/ e abra este arquivo novamente.
  echo Consulte o arquivo LEIA-ME.md para as instrucoes completas.
  pause
  exit /b 1
)
node servidor.cjs --open
pause
