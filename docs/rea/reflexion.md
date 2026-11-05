# REA · reflexion

Pasta analisada: `C:\Users\pacc1\AppData\Local\Temp\rea-src\reflexion`

## Números
- Arquivos JS/TS lidos: 6 (pulados: 0, falhas de parse: 0)
- Módulos no grafo: 69 · arestas de import: 72 (relativos não resolvidos: 0)
- Grafo semântico: 1445 nós (expression 948, binding 130, property-slot 120, call-site 97, return-site 40, literal 37) · incógnitas declaradas: 499
- Rotas detectadas: 0

## Dependências externas (por nº de imports)
- react × 12
- @react-three/drei × 8
- @react-three/fiber × 5
- three × 4
- react-dom × 2
- @google/genai × 2

## Arquivos mais importados (o 'núcleo' do projeto)
- types.ts ← 4
- constants.ts ← 2
- services/geminiService.ts ← 1
- App.tsx ← 1
- components/Unit.tsx ← 1

## Arquivos que mais importam (os 'orquestradores')
- App.tsx → 8
- components/Unit.tsx → 6
- index.tsx → 3
- services/geminiService.ts → 2
- constants.ts → 1

## Arquivos com mais funções (onde está a lógica)
- App.tsx: 20 funções
- components/Unit.tsx: 10 funções
- services/geminiService.ts: 2 funções

## Limitações declaradas pelo REA
- CommonJS and ESM binding relationships were recovered from inert syntax and resolved only within the inventoried artifact container.
- Graph coverage is incomplete; unavailable facts remain explicit and must not be read as absence.
- JavaScript and HTML were parsed as inert text; bundle bootstrap code was never executed.
- Static imports, entrypoints, workers, endpoints, and storage relationships do not prove runtime execution.
- Static paths and relationships may remain unresolved when expressions are dynamic or obfuscated.
- Webpack/Rspack factories were recovered from AST literals; REA did not invoke push handlers or bundle bootstrap code.
