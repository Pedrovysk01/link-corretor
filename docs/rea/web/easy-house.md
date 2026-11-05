# REA · navegador · easy-house

URL observada: `http://127.0.0.1:8102/`

## Recursos carregados pela página
- 26 recursos (152 KB declarados) · hosts: 127.0.0.1:8102 ×26
- Tipos: Script ×25, Stylesheet ×1
- Pedidos de rede durante a observação (depois do carregamento): 0

## Scripts carregados
- 26 scripts (22 módulos ES, 0 com source map)
- http://127.0.0.1:8102/docs/
- http://127.0.0.1:8102/docs/configurator.js
- http://127.0.0.1:8102/docs/importmap.js
- http://127.0.0.1:8102/docs/live.js
- http://127.0.0.1:8102/index.js
- http://127.0.0.1:8102/node_modules/svg-easy-tree/tree.js
- http://127.0.0.1:8102/src/colors.js
- http://127.0.0.1:8102/src/house.js
- http://127.0.0.1:8102/src/layout.js
- http://127.0.0.1:8102/src/plugins.js
- http://127.0.0.1:8102/src/plugins/cells.js
- http://127.0.0.1:8102/src/plugins/dividers.js
- http://127.0.0.1:8102/src/plugins/floor-labels.js
- http://127.0.0.1:8102/src/plugins/hole.js
- http://127.0.0.1:8102/src/plugins/hover.js
- http://127.0.0.1:8102/src/plugins/icon.js
- http://127.0.0.1:8102/src/plugins/reactions.js
- http://127.0.0.1:8102/src/plugins/roof.js
- http://127.0.0.1:8102/src/plugins/stacks.js
- http://127.0.0.1:8102/src/plugins/text.js
- http://127.0.0.1:8102/src/plugins/walls.js
- http://127.0.0.1:8102/src/resolve.js
- http://127.0.0.1:8102/src/scene.js
- http://127.0.0.1:8102/src/sizes.js
- http://127.0.0.1:8102/src/themes.js
- http://127.0.0.1:8102/src/utils.js

## DOM e acessibilidade
- Nós DOM: 1134 · nós de acessibilidade: 1212

## Storage da origem
- localStorage/sessionStorage: docsify.search.expires, docsify.search.index · IndexedDB: [] · caches: []

## Cobertura do inspect
- status: policy_filtered · seções filtradas por política: 7 · limitadas por attach: 6

## Bundle (parse inerte dos scripts capturados)
- Scripts observados/analisados: 26/26 · parse ok 26 · nós AST 18159
- Chunks: 26 (arestas 54) · rotas candidatas: 0 · endpoints candidatos: 0
### Inferências do REA (bibliotecas, bundler, padrões)

## Limitações declaradas
- Bare string arguments of unbound HTTP-method-named calls are low-confidence endpoint candidates; form, translation, storage and other APIs can use the same syntax. URL-shaped findings still do not prove network execution.
- CDP discovery omitted the target attachment state; attached is reported as unknown.
- Endpoint candidates are deduplicated by script, value and detector; basis retains only the first matching source coordinate. They are not a complete call-site inventory or a runtime occurrence count. completeness.status="complete" describes examination of captured source, not a call-site census.
- Observation starts when REA attaches; prior network and console activity is unavailable.
- Page-declared WebMCP metadata is untrusted and is never registered or invoked as an REA tool.
- Pattern IDs are exact path identities within this inventory. Occurrence and source IDs retain source/content identity and precise syntax ranges; metadata-only discoveries have no AST range.
- Raw network headers, bodies, cookies, storage values, console objects, and WebSocket payloads are never retained; explicitly requested primitive console text is retained verbatim, while payload captures retain value-free shapes.
- Routes are static candidates from the provided code sources. Reachability, permissions, server-only routes and the complete application route set are unverified.
