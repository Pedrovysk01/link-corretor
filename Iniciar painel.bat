@echo off
chcp 65001 >nul
rem Abre o painel Link Corretor (porta 8090, so neste computador).
rem Painel: http://localhost:8090/painel/   (a IA usa o Claude Code ja instalado, sem chave de API)
cd /d "%~dp0"
rem O tour 3D do Villa Montemerano precisa estar compilado uma vez (precisa do Node.js 20+ de nodejs.org).
if not exist "Planta-Interativa\Planta Interativa\tour\dist\index.html" (
  echo Compilando o tour 3D do Villa Montemerano pela primeira vez ^(leva 1 a 2 minutos^)...
  pushd "Planta-Interativa\Planta Interativa\tour"
  if not exist node_modules call npm ci --ignore-scripts
  call npm run build:painel
  popd
)
start "" http://localhost:8090/painel/
python tools\link-server.py 8090
pause
