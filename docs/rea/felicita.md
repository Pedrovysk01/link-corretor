# REA · felicita

Pasta analisada: `C:\Users\pacc1\AppData\Local\Temp\rea-src\felicita`

## Números
- Arquivos JS/TS lidos: 6 (pulados: 0, falhas de parse: 0)
- Módulos no grafo: 6 · arestas de import: 0 (relativos não resolvidos: 0)
- Grafo semântico: 7387 nós (expression 4942, call-site 806, property-slot 469, binding 387, function 265, parameter 257) · incógnitas declaradas: 2640
- Rotas detectadas: 0

## Dependências externas (por nº de imports)

## Arquivos mais importados (o 'núcleo' do projeto)

## Arquivos que mais importam (os 'orquestradores')

## Arquivos com mais funções (onde está a lógica)
- torre.js: 93 funções
- core.js: 80 funções
- maps.js: 68 funções
- main.js: 22 funções
- data/projeto.js: 2 funções

## Limitações declaradas pelo REA
- CommonJS and ESM binding relationships were recovered from inert syntax and resolved only within the inventoried artifact container.
- Graph coverage is incomplete; unavailable facts remain explicit and must not be read as absence.
- JavaScript and HTML were parsed as inert text; bundle bootstrap code was never executed.
- Static imports, entrypoints, workers, endpoints, and storage relationships do not prove runtime execution.
- Static paths and relationships may remain unresolved when expressions are dynamic or obfuscated.
- Webpack/Rspack factories were recovered from AST literals; REA did not invoke push handlers or bundle bootstrap code.
