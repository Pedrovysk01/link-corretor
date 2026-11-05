# REA · easy-house

Pasta analisada: `C:\Users\pacc1\Documents\Antigravity\Link Corretor\.ds-audit\refs\easy-house\src`

## Números
- Arquivos JS/TS lidos: 20 (pulados: 0, falhas de parse: 0)
- Módulos no grafo: 64 · arestas de import: 79 (relativos não resolvidos: 0)
- Grafo semântico: 10116 nós (expression 6471, call-site 824, property-slot 822, binding 576, parameter 567, return-site 401) · incógnitas declaradas: 3377
- Rotas detectadas: 0

## Dependências externas (por nº de imports)
- svg-easy-tree × 2

## Arquivos mais importados (o 'núcleo' do projeto)
- plugins.js ← 6
- utils.js ← 6
- colors.js ← 4
- scene.js ← 3
- plugins/text.js ← 2
- layout.js ← 1
- plugins/reactions.js ← 1
- plugins/floor-labels.js ← 1
- plugins/cells.js ← 1
- plugins/hover.js ← 1
- themes.js ← 1
- plugins/walls.js ← 1

## Arquivos que mais importam (os 'orquestradores')
- house.js → 16
- plugins/reactions.js → 5
- scene.js → 2
- plugins/roof.js → 2
- plugins.js → 2
- plugins/floor-labels.js → 1
- resolve.js → 1
- layout.js → 1

## Arquivos com mais funções (onde está a lógica)
- resolve.js: 66 funções
- layout.js: 49 funções
- plugins/text.js: 37 funções
- scene.js: 37 funções
- plugins/floor-labels.js: 33 funções
- plugins/reactions.js: 31 funções
- house.js: 21 funções
- plugins/hover.js: 17 funções
- plugins/walls.js: 13 funções
- plugins/roof.js: 13 funções

## Limitações declaradas pelo REA
- CommonJS and ESM binding relationships were recovered from inert syntax and resolved only within the inventoried artifact container.
- Graph coverage is incomplete; unavailable facts remain explicit and must not be read as absence.
- JavaScript and HTML were parsed as inert text; bundle bootstrap code was never executed.
- Static imports, entrypoints, workers, endpoints, and storage relationships do not prove runtime execution.
- Static paths and relationships may remain unresolved when expressions are dynamic or obfuscated.
- Webpack/Rspack factories were recovered from AST literals; REA did not invoke push handlers or bundle bootstrap code.
