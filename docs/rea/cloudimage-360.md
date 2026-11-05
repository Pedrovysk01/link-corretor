# REA · cloudimage-360

Pasta analisada: `C:\Users\pacc1\AppData\Local\Temp\rea-src\cloudimage\src`

## Números
- Arquivos JS/TS lidos: 70 (pulados: 0, falhas de parse: 0)
- Módulos no grafo: 412 · arestas de import: 269 (relativos não resolvidos: 4)
- Grafo semântico: 14175 nós (expression 9494, call-site 1280, property-slot 978, binding 923, parameter 493, function 422) · incógnitas declaradas: 6016
- Rotas detectadas: 0

## Dependências externas (por nº de imports)
- react × 16
- @popperjs/core × 2
- lodash.throttle × 2

## Arquivos mais importados (o 'núcleo' do projeto)
- utils/constants.js ← 11
- utils/index.js ← 5
- utils/image-src/generate-cdn-path.js ← 3
- react/useCI360.ts ← 2
- utils/load-images/lazyload/prepare-first-image/get-first-cdn-image.js ← 2
- utils/container-elements/index.js ← 2
- ci360.js ← 2
- utils/image-src/add-or-update-param.js ← 2
- utils/container-elements/create-fullscreen-icon.js ← 2
- utils/load-images/pad.js ← 2
- utils/safe-json-parse.js ← 2
- utils/container-elements/create-initial-icon.js ← 2

## Arquivos que mais importam (os 'orquestradores')
- utils/index.js → 23
- utils/container-elements/index.js → 14
- ci360.service.js → 13
- utils/load-images/lazyload/init-lazyload.js → 6
- hotspots.js → 4
- utils/load-images/preload-images.js → 3
- react/CI360Viewer.tsx → 2
- ci360.js → 2

## Arquivos com mais funções (onde está a lógica)
- ci360.service.js: 129 funções
- hotspots.js: 43 funções
- utils/zoom/zoom-pan.js: 30 funções
- ci360.js: 22 funções
- utils/container-elements/create-hotspot-timeline.js: 16 funções
- react/CI360Viewer.tsx: 15 funções
- utils/hotspots.js: 13 funções
- utils/load-images/preload-images.js: 12 funções
- utils/load-images/load-images.js: 10 funções
- utils/zoom/gestures.js: 8 funções

## Limitações declaradas pelo REA
- CommonJS and ESM binding relationships were recovered from inert syntax and resolved only within the inventoried artifact container.
- Graph coverage is incomplete; unavailable facts remain explicit and must not be read as absence.
- JavaScript and HTML were parsed as inert text; bundle bootstrap code was never executed.
- Static imports, entrypoints, workers, endpoints, and storage relationships do not prove runtime execution.
- Static paths and relationships may remain unresolved when expressions are dynamic or obfuscated.
- Webpack/Rspack factories were recovered from AST literals; REA did not invoke push handlers or bundle bootstrap code.
