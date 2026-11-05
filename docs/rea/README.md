# REA nos projetos-base — o que cada um é por dentro

Análise feita com **[REA — Reverse Engineer Anything](https://github.com/morluto/rea)** (`rea-agents` 6.8.0, MIT), comando
`analyze-javascript-application`, nos 4 projetos nossos e nos 13 projetos do GitHub que usamos como referência.
O REA lê o código como **texto inerte** (nunca executa nada dos repositórios de terceiros) e devolve, com evidência:
inventário de arquivos, grafo de módulos e imports, grafo semântico (funções, chamadas, bindings) e as próprias limitações.

Como rodar de novo: `python .ds-audit/rea/run-rea.py [id…]` (precisa de Node 22+/24+; o REA é baixado pelo `npx`).
Resumos por projeto: `docs/rea/<id>.md`. Bruto (até 100 MB por projeto): `.ds-audit/rea/<id>.json` (fora do git).

## O que o REA entrega e o que não entrega aqui

- **Entrega bem:** dependências externas por nº de imports, os arquivos mais importados (o *núcleo*), os que mais importam
  (os *orquestradores*), e onde está a lógica (funções por arquivo). É isso que diz "por onde começar a ler" e "o que é
  reaproveitável como módulo".
- **Não entrega:** nomes de funções chamadas (os *call-sites* vêm só com posição, não com `fetch`/`THREE.x`), rotas
  (0 em todos: são apps de uma página), e nada em tempo de execução. Para "como a textura é feita" continua valendo a
  leitura dirigida que já fizemos (`.ds-audit/comparativo-agno.md`).
- **Projetos sem `import`** (scripts clássicos com `<script>`: Felicità, painel, sunlight-simulator, apartment3d, serica)
  saem sem grafo de dependências; sobra o mapa de funções, que é o que importa neles.
- O REA marcou como *not-found* os imports relativos sem extensão (`./x` → `x.tsx`); o `run-rea.py` resolve isso contra o
  inventário. Ficaram 0–4 não resolvidos por projeto.

## Índice comparativo

| Projeto | Arquivos JS/TS | Stack (imports) | Núcleo (mais importado) | Onde está a lógica |
| --- | ---: | --- | --- | --- |
| **bossa** (nosso) | 37 | three (vendor), módulos ES próprios | `js/data.js` ←11, `js/state.js` ←7, `js/ficha.js` ←6 | `ficha.js` 78 fn, `vendas.js` 71, `materiais.js` 69, `sun.js` 55, `relevo3d.js` 49 |
| **felicita** (nosso) | 6 | MapLibre (vendor), scripts globais | (sem imports) | `torre.js` 93 fn (andares, folha, vista), `core.js` 80 (sol, spring, utilitários), `maps.js` 68 (cena Cidade), `main.js` 22 |
| **montemerano-tour** (nosso, base virtual-tour) | 84 | react 65, three 52, drei 19, fiber 10, zustand 6, zod 4 | `state/store.ts` ←17, `scene/materials.ts` ←15, `lib/geometry.ts` ←13 | `lib/geometry.ts` 31 fn, `ui/FloorPlan.tsx` 28, `scene/CameraRig.tsx` 18 |
| **painel** (nosso) | 11 | nenhum (vanilla) | (sem imports) | `painel.js` 385 fn, `embed.js` 97, `tabelas.js` 51, `materiais.js` 50, `casca.js` 31 |
| real-estate-virtual-tour | 76 | react 58, three 45, drei 17, fiber 10, zustand 6 | `state/store.ts` ←17, `scene/materials.ts` ←13, `lib/geometry.ts` ←12 | `lib/geometry.ts` 31, `ui/FloorPlan.tsx` 28, `scene/Surroundings.tsx` 18 |
| wilsouza | 24 | react 33, three 22, motion 12, fiber 8, drei 8, zustand 4 | `three/materials.ts` ←5, `ui/bits.tsx` ←4, `three/buildingGeometry.ts` ←2 | `three/materials.ts` (interior-mapping), `three/City.tsx`, `three/CameraRig.tsx` |
| sunlight-simulator | 8 | nenhum (scripts globais + worker) | (sem imports) | `editor.js` 209 fn, `viewer.js` 200, `utils.js` 65, `sunlight-worker.js` 18 |
| easy-house | 20 | svg-easy-tree 2 | `utils.js` ←6, `plugins.js` ←6, `colors.js` ←4, `scene.js` ←3 | `resolve.js` 66 fn, `layout.js` 49, `plugins/text.js` 37; orquestra `house.js` →16 |
| roam-3d | 7 | three 10 | (plano) | `ui.js` 46, `buildWorld.js` 28, `player.js` 12 (octree+cápsula), `controls.js` 11 |
| apartment3d | 1 | three | (arquivo único) | `app.js` |
| 3d-real-estate-viewer | 41 | @mui/material 90, react 20, react-router 13, drei 11, zustand 2 | arquitetura *feature-sliced* (`@/shared`, `@/entities`, `@/widgets`) | `pages/property-viewer/ui/PropertyViewerPage.tsx` →11 |
| scrollspire | 30 | react 106, gsap 34, fiber 14, three 12, lenis 2 | `lib/scroll.js` ←12, `data/property.js` ←11, `lib/splitChars.jsx` ←6 | `App.jsx` →24, `components/HeroCanvas.jsx` →11 |
| arven | 16 | gsap 6, lenis 2, three 2 | `lib/env.js` ←7, `lib/i18n.js` ←6 | `modules/v3-experience.js` 42 fn; `main.js` →12 |
| serica | 1 | three | (arquivo único) | `main.js` |
| reflexion | 7 | react, @google/genai | `constants.ts`, `types.ts` | `App.tsx` 20 fn, `components/Unit.tsx` 10, `services/geminiService.ts` 2 |
| 3destate | 8 | react, lucide-react, `@/components`, `@/lib` | (esqueleto) | — |
| cloudimage-360 | 70 | react 16 (só o wrapper), popperjs 2, lodash.throttle 2 | `utils/constants.js` ←11, `utils/index.js` ←5 | `ci360.service.js` 129 fn; `utils/index.js` →23, `utils/container-elements/index.js` →14 |

## O que isso muda na base de construção

1. **Três famílias de arquitetura**, e o nosso projeto já está na melhor delas para o tour:
   - *React + three (R3F) com store central* — virtual-tour / montemerano-tour, wilsouza, scrollspire, 3d-viewer. O núcleo é
     sempre o mesmo trio: **store** (estado), **materials** (aparência), **geometry/layout** (dados → malha). Quando formos
     trocar textura, luz ou planta, é nesses três arquivos que se mexe; o resto é UI.
   - *Vanilla modular (ES modules, sem framework)* — Bossa, easy-house, roam-3d, arven, cloudimage. Fácil de embutir em
     qualquer página (é por isso que o painel injeta `casca.js`, `embed.js` etc. sem build).
   - *Script único global* — Felicità, painel, sunlight-simulator, apartment3d, serica. Rápido de alterar, difícil de testar.
2. **O que é módulo isolado e dá para portar sem arrastar o projeto inteiro** (fan-in alto, fan-out baixo):
   - `wilsouza/three/materials.ts` (vidro com interior mapping) — importado por 5, importa só three.
   - `easy-house/resolve.js` + `layout.js` (gramática da torre: 66 + 49 funções, dependência externa única).
   - `sunlight-simulator/sunlight-worker.js` (sombra por raio em worker, 18 funções, sem imports).
   - `roam-3d/player.js` + `controls.js` (andar com colisão: 23 funções, só three).
   - `cloudimage-360/ci360.service.js` (o visualizador 360 inteiro em 1 arquivo de 129 funções; já vendorizado no painel).
3. **O que está acoplado e não vale copiar, só aprender:** `3d-real-estate-viewer` (90 imports de MUI + feature-sliced:
   tudo depende de tudo), `scrollspire` (`App.jsx` com 24 imports, gsap em 34 pontos), `3destate` (esqueleto).
4. **Os pontos quentes dos nossos próprios projetos**, por nº de funções: `painel.js` (385 — candidato a ser dividido em
   telas, como já começou com `tabelas.js`/`materiais.js`), `bossa/ficha.js` (78), `montemerano-tour/lib/geometry.ts` (31).
5. **O montemerano-tour divergiu do virtual-tour em +8 arquivos e +64 arestas** (84 vs 76 arquivos; store ←17 em ambos):
   a base foi mantida, o que acrescentamos (Cidade, andar duplo, intro, 360, fachada) ficou nas bordas. Dá para puxar
   correções do upstream sem conflito grande.

## Limitações declaradas pelo REA (iguais em todos)

Bindings recuperados de sintaxe inerte e só dentro do artefato inventariado; cobertura incompleta — o que o REA não viu
não deve ser lido como ausência; nada foi executado; caminhos dinâmicos ficam sem resolver. O **reflexion** foi analisado
a partir de uma cópia só dos fontes (a raiz do clone tem `node_modules`, e o REA tentava percorrê-la).
