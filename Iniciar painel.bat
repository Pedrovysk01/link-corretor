@echo off
rem Abre o painel Link Corretor (porta 8090, so neste computador).
rem Painel: http://localhost:8090/painel/   (a IA usa o Claude Code ja instalado, sem chave de API)
cd /d "%~dp0"
start "" http://localhost:8090/painel/
python tools\link-server.py 8090
pause
