@echo off
rem Atualiza a PRODUCAO do Supabase: migracoes do banco, segredos das funcoes (do .env.local) e funcoes.
rem Usa o SEU login do Supabase (abre o navegador). Nenhuma senha ou chave fica gravada neste projeto.
rem Detalhes: docs\DEPLOY.md
cd /d "%~dp0"
echo.
echo  ==== 1/5  Login no Supabase (abre o navegador) ====
call npx -y supabase login
if errorlevel 1 goto erro
echo.
echo  ==== 2/5  Migracoes do banco: Local x Remote (producao) ====
call npx -y supabase migration list --linked
if errorlevel 1 goto erro
echo.
echo  As linhas com a coluna "Remote" vazia ainda NAO estao na producao e serao aplicadas agora.
echo  Se aparecer como pendente uma migracao antiga que JA esta no banco, responda N e veja docs\DEPLOY.md.
choice /C SN /M "Aplicar as migracoes no banco de producao? (S = sim, N = pular)"
if errorlevel 2 goto chaves
echo.
call npx -y supabase db push --linked
if errorlevel 1 goto erro
:chaves
echo.
echo  ==== 3/5  Segredos das funcoes: Google Maps, Stripe e formularios (do .env.local - nao aparecem na tela) ====
python tools\enviar-segredos.py
if errorlevel 1 goto erro
echo.
echo  ==== 4/5  Publicando as funcoes (busca do Google Maps, carteiras, formularios e pagamento) ====
call npx -y supabase functions deploy maps-lookup
if errorlevel 1 goto erro
call npx -y supabase functions deploy wallet-pass
if errorlevel 1 goto erro
call npx -y supabase functions deploy forms-intake
if errorlevel 1 goto erro
call npx -y supabase functions deploy forja-proxy
if errorlevel 1 goto erro
call npx -y supabase functions deploy admin-api
if errorlevel 1 goto erro
call npx -y supabase functions deploy billing
if errorlevel 1 goto erro
echo.
echo  ==== 5/5  Pronto! ====
echo  Abra o painel publicado, va em Configuracao inicial e busque o seu negocio no Google Maps.
echo  Pagamento do plano Pro pela Stripe: siga docs\STRIPE.md (chaves no .env.local e rode este arquivo de novo).
goto fim
:erro
echo.
echo  Algo deu errado acima (o passo que falhou nao foi concluido). Copie a mensagem e peca ajuda.
:fim
echo.
pause
