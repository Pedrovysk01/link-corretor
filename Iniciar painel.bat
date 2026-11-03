@echo off
rem Abre o painel Seu Cliente Fiel (porta 8080, so neste computador) com a busca do Google Maps ligada.
rem Antes, gera o site de marketing em dist\ (http://localhost:8080/).
cd /d "%~dp0"
node tools\build-site.mjs
start "" http://localhost:8080/app/
python tools\dev-server.py 8080
pause
