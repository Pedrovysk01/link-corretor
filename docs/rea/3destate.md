# REA · 3destate

Pasta analisada: `C:\Users\pacc1\Documents\Antigravity\Link Corretor\.ds-audit\refs\3dEstate\src`

## Números
- Arquivos JS/TS lidos: 8 (pulados: 0, falhas de parse: 0)
- Módulos no grafo: 67 · arestas de import: 52 (relativos não resolvidos: 2)
- Grafo semântico: 618 nós (expression 372, binding 68, call-site 52, parameter 46, function 26, return-site 23) · incógnitas declaradas: 209
- Rotas detectadas: 0

## Dependências externas (por nº de imports)
- @/components × 16
- react × 6
- @/lib × 6
- lucide-react × 3
- clsx × 2
- tailwind-merge × 2
- next × 2
- @radix-ui/react-slot × 2
- class-variance-authority × 2
- embla-carousel-react × 2

## Arquivos mais importados (o 'núcleo' do projeto)

## Arquivos que mais importam (os 'orquestradores')
- components/ui/carousel.jsx → 5
- components/ui/button.jsx → 4
- app/page.js → 3
- components/ui/card.jsx → 2
- lib/utils.js → 2

## Arquivos com mais funções (onde está a lógica)
- components/ui/carousel.jsx: 13 funções
- components/ui/card.jsx: 7 funções
- app/page.js: 3 funções
- lib/utils.js: 1 funções
- app/layout.js: 1 funções
- components/ui/button.jsx: 1 funções

## Limitações declaradas pelo REA
- CommonJS and ESM binding relationships were recovered from inert syntax and resolved only within the inventoried artifact container.
- Graph coverage is incomplete; unavailable facts remain explicit and must not be read as absence.
- JavaScript and HTML were parsed as inert text; bundle bootstrap code was never executed.
- Static imports, entrypoints, workers, endpoints, and storage relationships do not prove runtime execution.
- Static paths and relationships may remain unresolved when expressions are dynamic or obfuscated.
- Webpack/Rspack factories were recovered from AST literals; REA did not invoke push handlers or bundle bootstrap code.
