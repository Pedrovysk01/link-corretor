# Link Corretor — guia de entrega para o dev de design

Para quem recebe o projeto para **refazer a camada estética** (visual, tipografia, componentes, animações).
O que está aqui é a **base funcional**: o que funciona e deve ser mantido. A aparência atual é provisória.

## 1. O que o produto faz

A construtora/imobiliária gera **links rastreados por corretor** para a apresentação 3D de um empreendimento.
O cliente abre o link, vê a apresentação, se cadastra, e a construtora acompanha tudo num painel.
Há uma IA que responde às perguntas do cliente. Não existe cobrança (sem Stripe/plano/faturamento).

Vocabulário: construtora (dono) · corretor · cliente (visitante) · empreendimento · link · clique/abertura.
Idioma: português do Brasil, tratamento "você".

## 2. O que é para manter (funciona e foi aprovado)

| # | Parte | Onde está |
|---|---|---|
| 1 | **Vista 3D dentro das unidades**: câmera em primeira pessoa, caminhar e olhar ao redor, passar de ambiente em ambiente | `Planta-Interativa/Planta Interativa/tour/src/scene/` (`CameraRig.tsx`, `TourCanvas.tsx`), `src/lib/geometry.ts`, `src/state/store.ts` |
| 2 | **Planta baixa vista de cima com pontos de interação e informação** (rótulos dos ambientes, hotspots de porta, mini-planta) | `tour/src/ui/FloorPlan.tsx`, `ui/SceneLabels.tsx`, `scene/LabelProjector.tsx`, `ui/RoomPanel.tsx` |
| 3 | **Painel da construtora** | `painel/` (`index.html`, `painel.js`, `painel.css`) |
| 4 | **Cadastro de cliente e de corretor** e as regras em volta | `painel/embed.js` (lado do cliente), `tools/link-server.py` (regras e banco) |
| 5 | **Funcionalidades** (liga/desliga por empreendimento, notificações, links, busca global) | ver seção 5 |

## 3. O que NÃO deve pesar na sua decisão

Tudo o que é aparência: cores, fontes, raios, sombras, ícones, o estilo dos botões e cartões, o layout da
tela inicial, a fachada por andar, a animação de entrada, as apresentações do Felicità e do Bossa
(estão aqui só como **referência de recursos**: posição solar, mapa de distâncias, simulador de proposta).
Pode redesenhar tudo isso. Não mexa nas regras da seção 5 sem combinar.

Pontos onde a estética está concentrada (comece por aqui):

| Camada | Arquivos |
|---|---|
| Tour 3D, UI | `tour/src/index.css`, `ui/TopBar.tsx`, `ui/PropertyCard.tsx`, `ui/RoomPanel.tsx`, `ui/HintBar.tsx`, `ui/LoadingScreen.tsx` |
| Tour 3D, cena | `tour/src/scene/materials.ts` (materiais), `scene/SceneLighting.tsx` (luz, fundo `#0b1412`), `scene/Cidade.tsx` (entorno), `scene/CameraRig.tsx` (abertura em zoom) |
| Painel | `painel/painel.css`, `painel/tema-painel.css`, `painel/design-system.html` (referência de tokens), `painel/casca.css` |
| Janelas sobre a apresentação | `painel/embed.js` (tela de 3 perfis, popup de cadastro, cartão do corretor), `painel/casca.js` (rodapé: legenda, "i", IA) |

## 4. Como rodar

Requisitos: **Python 3.11+** (só biblioteca padrão) e **Node 20+** (só para o tour 3D).

```
Iniciar painel.bat          (duplo clique; abre http://localhost:8090/painel/)
```

Ou, na linha de comando:

```
python tools/link-server.py 8090                 # painel + API + apresentações
cd "Planta-Interativa/Planta Interativa/tour"
npm ci                                           # uma vez
npm run build:painel                             # compila o tour para o painel servir
npm run dev                                      # só o tour, em http://localhost:5173/?view=tour&property=montemerano-01
```

Primeiro acesso ao painel: ele pede o nome da empresa e cria a conta do dono. A caixa "dados de exemplo" cria
3 corretores fictícios (senha `corretor123`), clientes e aberturas. Detalhes em `docs/PAINEL-LOCAL.md`.

Depois de mudar o servidor, **reinicie** o processo (ele guarda tudo em memória). Depois de mudar CSS/JS,
troque o `?v=` nos `<script>`/`<link>` de `painel/index.html`.

Testes: `python tests/check-*.py` (ícones centralizados, mobile 390/360, contraste ≥ 4,5:1 nos dois modos,
barras de rolagem, tabelas, segurança) e, no tour, `npm test`, `npm run typecheck`.

## 5. Regras de negócio que precisam sobreviver ao redesign

**Três perfis na abertura** (`/r/<código>` → `/p/<código>/`): três botões antes da apresentação.

| Perfil | Comportamento |
|---|---|
| Construtora | abre o painel |
| Corretor | apresentação normal, **sem coleta de dados** (sem faixa, IA, cadastro ou batimento); selo "Modo corretor" para trocar |
| Cliente | apresentação com o corretor do link; **popup de cadastro 30 s depois** (nome + WhatsApp ou e-mail + aceite) |

**Cliente.** Pertence ao primeiro corretor por quem se identificou (chave: WhatsApp, senão e-mail). Abrir o link
de outro corretor registra a abertura como "outro link"; só a construtora transfere. Batimento a cada 30 s
mede o tempo de permanência; recarregar em 20 min não conta de novo.

**Corretor.** O cartão do corretor (nome, telefone, e-mail, **assinatura digital** em canvas) abre **uma única
vez**; a construtora que envia o link. Para alterar, o corretor fala com a construtora, que edita ou libera de
novo (`/api/brokers/<id>/cartao` e `/cartao/liberar`). A assinatura é visível só para a construtora, nunca para o cliente.

**Notificação.** Cerca de 5 min depois (`notify_min`), aparece no painel um aviso lateral: "cliente X abriu e
se cadastrou, veio do corretor Y" (`GET /api/notify`).

**Recursos por empreendimento** (liga/desliga no painel, **todos ligados de início**): posição solar, mapa com
distâncias, selo do corretor, simulador de proposta, tabela de unidades, WhatsApp. Chaves em `RECURSOS` em
`tools/link-server.py`; entregues à apresentação por `painel/recursos.js`.

**Painel.** Busca global com sugestão por tag (cliente, corretor, empreendimento); **toda tabela** ordena A–Z/Z–A
e permite reordenar colunas arrastando (`painel/tabelas.js`, classe `table.t`); gráficos em linhas ligadas, com
cor diferente nos dias baixos; o dono cadastra corretores e gera links por corretor + empreendimento + canal.

**Rodapé de toda apresentação**: legenda disponíveis/vendidas, botão "i" e botão ✦ da IA (`painel/casca.js`).

## 6. Arquitetura

```
tools/link-server.py     servidor único (Python stdlib + SQLite): API /api/*, /r/<código>, /p/<código>/,
                         /pre/<id>/ (exige login), injeta recursos.js, voltar.js, casca.js, materiais.js, embed.js
dados/                   banco SQLite (não incluído no zip de entrega; é criado no primeiro acesso)
painel/                  painel da construtora e scripts injetados nas apresentações (JS puro, sem build)
Planta-Interativa/
  Planta Interativa/
    tour/                tour 3D do Montemerano (React + react-three-fiber + three + zustand + zod, Vite)
    apresentacao/        Felicità (MapLibre + torre 3D)   — referência
    app/                 Bossa (mapa interativo, JS puro) — referência
  GUIA-DE-CONTEUDO.md    como adicionar imagens e ambientes mantendo o padrão
app/, site/, supabase/   infraestrutura herdada do Cliente Fiel (PWA, site, migrações Supabase); o modo local não usa
docs/                    ARQUITETURA, PAINEL-LOCAL, DESIGN (modelo de estrutura), rea/ (análise técnica dos projetos-base)
tests/                   verificações de interface e segurança
```

**Banco** (SQLite, `tools/link-server.py`): `settings`, `users` (dono e corretores), `sessions`, `properties`
(com `features`), `links`, `clicks`, `visitors` (clientes), `commission_shares`, `visitor_tokens`, `opens`,
`broker_cards`, `ai_questions`.

**API**: `/api/me`, `/api/login`, `/api/dashboard`, `/api/notify`, `/api/properties`, `/api/brokers`
(+ `/cartao`, `/cartao/liberar`), `/api/clientes`, `/api/links`, `/api/questions`, `/api/settings`;
públicas por link: `/api/p/<código>/info|register|corretor|heartbeat|ask|message`. Papéis: PUB, ANY, OWNER.

**Tour 3D**: a arquitetura (paredes, vidros, forros) é gerada de dados em `tour/src/data/properties/`.
Um novo empreendimento é um novo arquivo de dados + imagens (ver `GUIA-DE-CONTEUDO.md`). Os três arquivos
que mandam: `state/store.ts` (estado), `scene/materials.ts` (aparência) e `lib/geometry.ts` (dados → malha).

## 7. Pendências conhecidas

- **Licença do tour 3D**: a base veio de `Muhsin48ahmed/real-estate-virtual-tour`, que **não tem LICENSE**. Antes de
  qualquer uso comercial, pedir autorização ao autor ou reescrever essa base.
- **Entorno do Montemerano**: o chão usa um render aéreo inclinado (`tour/public/img/externa-aerea.webp`) sobre
  satélite de 0,5 m/px (borra de perto). Opções: aéreo a prumo gerado por IA, Google Photorealistic 3D Tiles
  (chave paga) ou ortofoto de drone. `?chao=satelite` volta ao satélite.
- **Posição solar e mapa de distâncias**: as chaves existem, mas os módulos para o Montemerano ainda não foram
  construídos (existem no Bossa/Felicità, em `app/js/sun.js`).
- **Dados que faltam do Montemerano**: coordenada exata do lote, preço, nº de andares (`PAV_INI` em
  `tour/public/fachada/index.html` é estimado), WhatsApp, planta cotada do Apto 02, memorial.
- **Peso do 3D**: ~30 MB no tour (móveis em GLB ~20 MB). Próximo passo: compressão Draco.
- **Imagens**: renders e fotos são do cliente; mantenha o aviso "imagem ilustrativa".

## 8. Segurança e cuidados

- Segredos só em `.env.local` (modelo em `.env.example`), nunca no git; `python tools/enviar-segredos.py` leva-os ao Supabase.
- Funções públicas passam por `abuse_ok` (trava anti-abuso).
- O servidor escuta só em `127.0.0.1`.
- Nada de dados reais de cliente em exemplos ou prints.

## 9. Material de apoio

`docs/ARQUITETURA.md` · `docs/PAINEL-LOCAL.md` · `docs/DESIGN.md` · `docs/rea/README.md` (análise técnica dos
projetos-base) · `Planta-Interativa/GUIA-DE-CONTEUDO.md` · `painel/design-system.html`.

Repositório: https://github.com/Pedrovysk01/link-corretor
