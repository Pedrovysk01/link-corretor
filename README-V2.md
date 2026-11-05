# Link Corretor v2 — Villa Montemerano

Sistema de apresentação do Villa Montemerano com links rastreados por corretor. Três acessos:

| Quem | Como entra | O que vê |
|---|---|---|
| **Cliente** | Link do corretor (`/r/<código>`) | Voo de abertura, mapa aéreo, ficha de cada andar, **Ver por dentro** (tour 3D), IA e contato com o corretor. Cadastro depois de 30 s ou na 3ª interação. |
| **Corretor** | Painel (`/painel/`) com o acesso criado pela construtora | Painel com os seus clientes, links e perguntas à IA. Ao abrir o próprio link: apresentação sem coleta de dados, cartão com assinatura (uma única vez) e **Enviar ao cliente**. |
| **Construtora (dono)** | Painel, conta criada no primeiro acesso | Tudo: corretores, clientes, links, empreendimento, IA, configurações. Ao abrir um link: só olha (aba "← Painel"). |

Não há tela de escolha de perfil: quem não está logado é cliente; quem está logado vê o seu papel.

## Rodar

Requisitos: Python 3.11+ (só biblioteca padrão) e Node 20+ (uma vez, para compilar o tour).

```
Iniciar painel.bat     → compila o tour na primeira vez e abre http://localhost:8090/painel/
```

Manual: `python tools/link-server.py 8090`. Para recompilar o tour depois de mudar o código dele:
`cd "Planta-Interativa/Planta Interativa/tour" && npm ci && npm run build:painel` (gera `apresentacao-montemerano/tour/`).

Primeiro acesso ao painel: nome da empresa, seu nome, e-mail e senha. Depois: **Corretores → Novo**, **Links → Novo link** (corretor + canal), copiar o link e enviar.

## Estrutura

```
apresentacao-montemerano/   mapa aéreo (entrada do cliente): index.html, js/, css/, data/empreendimento.json, media/
  tour/                     tour 3D compilado (gerado; não edite à mão)
Planta-Interativa/Planta Interativa/tour/   fonte do tour 3D (React + three.js)
painel/                     painel da construtora/corretor + scripts injetados (embed.js, voltar.js, recursos.js)
tools/link-server.py        servidor único: API, links, apresentação, injeção, SQLite em dados/
tools/seed/montemerano-fatos.txt   o que a IA sabe (edite pelo painel em Empreendimentos → Editar)
docs/                       ARQUITETURA, PAINEL-LOCAL, mapa-justus/ (docs do mapa original)
```

## Como o mapa e o tour conversam

- `apresentacao-montemerano/js/tour.js` abre `tour/index.html?property=…&room=…&embed=1&intro=0` num iframe de tela cheia (`#tourov`). Tabela `DESTINOS`: planta de 128,60 m² → `montemerano-01`, 116,60 m² → `montemerano-02`, lazer → `montemerano-lazer`.
- Com `embed=1` o tour não mostra a cidade 3D nem a abertura; ganha o botão **Mapa** (e Esc) que manda `postMessage({lc:"tour-fechar"})`; **Fale conosco** chama `window.parent.LC_EMBED.abrirIA()` (o widget do cliente, que pede o cadastro se preciso).
- O widget (`painel/embed.js`) fica por cima do tour; o batimento de tempo continua enquanto o cliente está dentro do apartamento.
- O mapa pré-carrega o código do tour em segundo plano (`tour/prefetch.json`, gerado no build).

## Dados do empreendimento

`apresentacao-montemerano/data/empreendimento.json`: textos, andares (`poly2d` = faixa clicável na foto, `alt3d` = altura na maquete), apartamentos, galerias, vídeos. `mostrarStatus: false` esconde disponível/reservado/vendido; mude para `true` quando a tabela de vendas for oficial e preencha `status` (`d`/`r`/`v`) em cada apartamento.

Numeração: Final 01 = 116,60 m² (lado esquerdo), Final 02 = 128,60 m² (lado direito), como no catálogo.

## Regras que o servidor garante

- Só o corretor dono do link grava o cartão com assinatura (`POST /api/p/<código>/corretor` exige login dele).
- O e-mail do corretor nunca vai ao cliente; só ao próprio corretor e ao dono.
- Cliques e aberturas de quem está logado (equipe) não entram nas métricas.
- Rotas públicas passam por limite de taxa; o servidor escuta só em `127.0.0.1`. Para expor na internet, coloque atrás de um proxy HTTPS.

## Testes

`python tests/check-*.py` (painel) · no tour: `npm run typecheck`, `npm test`.
