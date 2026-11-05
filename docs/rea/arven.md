# REA · arven

Pasta analisada: `C:\Users\pacc1\Documents\Antigravity\Link Corretor\.ds-audit\refs\arven\src`

## Números
- Arquivos JS/TS lidos: 16 (pulados: 0, falhas de parse: 0)
- Módulos no grafo: 56 · arestas de import: 78 (relativos não resolvidos: 2)
- Grafo semântico: 4456 nós (expression 2331, property-slot 808, call-site 416, literal 341, binding 230, function 129) · incógnitas declaradas: 1369
- Rotas detectadas: 0

## Dependências externas (por nº de imports)
- gsap × 6
- lenis × 2
- three × 2

## Arquivos mais importados (o 'núcleo' do projeto)
- lib/env.js ← 7
- lib/i18n.js ← 6
- lib/text.js ← 2
- config/images.js ← 2
- modules/cursor.js ← 1
- data/v3.js ← 1
- modules/v3-experience.js ← 1
- modules/preloader.js ← 1
- modules/pointer.js ← 1
- modules/residences.js ← 1
- modules/gl.js ← 1
- modules/nav.js ← 1

## Arquivos que mais importam (os 'orquestradores')
- main.js → 12
- modules/scroll.js → 6
- modules/preloader.js → 3
- modules/v3-experience.js → 3
- modules/gl.js → 2
- modules/cursor.js → 1
- modules/form.js → 1
- modules/residences.js → 1

## Arquivos com mais funções (onde está a lógica)
- modules/v3-experience.js: 42 funções
- modules/scroll.js: 22 funções
- modules/nav.js: 14 funções
- modules/gl.js: 7 funções
- lib/i18n.js: 7 funções
- modules/cursor.js: 6 funções
- modules/residences.js: 6 funções
- modules/preloader.js: 5 funções
- modules/pointer.js: 4 funções
- main.js: 4 funções

## Limitações declaradas pelo REA
- CommonJS and ESM binding relationships were recovered from inert syntax and resolved only within the inventoried artifact container.
- JavaScript and HTML were parsed as inert text; bundle bootstrap code was never executed.
- Static imports, entrypoints, workers, endpoints, and storage relationships do not prove runtime execution.
- Static paths and relationships may remain unresolved when expressions are dynamic or obfuscated.
- Webpack/Rspack factories were recovered from AST literals; REA did not invoke push handlers or bundle bootstrap code.
