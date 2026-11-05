# REA · navegador · sims-builder

URL observada: `http://127.0.0.1:8114/`

## Recursos carregados pela página
- 2 recursos (71 KB declarados) · hosts: 127.0.0.1:8114 ×3
- Tipos: Font ×2
- Pedidos de rede durante a observação (depois do carregamento): 1

## Scripts carregados
- 28 scripts (0 módulos ES, 0 com source map)
- http://127.0.0.1:8114/
- http://127.0.0.1:8114/_next/static/chunks/_app-pages-browser_components_room-organizer_index_ts.js
- http://127.0.0.1:8114/_next/static/chunks/_app-pages-browser_components_room-organizer_three_three-runtime_ts.js
- http://127.0.0.1:8114/_next/static/chunks/_app-pages-browser_node_modules_next_dist_client_dev_noop-turbopack-hmr_js.js
- http://127.0.0.1:8114/_next/static/chunks/_app-pages-browser_node_modules_three_examples_jsm_controls_OrbitControls_js.js
- http://127.0.0.1:8114/_next/static/chunks/_app-pages-browser_node_modules_three_examples_jsm_environments_RoomEnvironment_js.js
- http://127.0.0.1:8114/_next/static/chunks/app-pages-internals.js
- http://127.0.0.1:8114/_next/static/chunks/app/error.js
- http://127.0.0.1:8114/_next/static/chunks/app/global-error.js
- http://127.0.0.1:8114/_next/static/chunks/app/page.js
- http://127.0.0.1:8114/_next/static/chunks/main-app.js?v=1793849617331
- http://127.0.0.1:8114/_next/static/chunks/webpack.js?v=1793849617331

## DOM e acessibilidade
- Nós DOM: 824 · nós de acessibilidade: 407

## Storage da origem
- localStorage/sessionStorage: standalone-room-organizer-recent-colors, standalone-room-organizer-layout · IndexedDB: [] · caches: []

## Cobertura do inspect
- status: policy_filtered · seções filtradas por política: 7 · limitadas por attach: 6

## Bundle (parse inerte dos scripts capturados)
- Scripts observados/analisados: 13/12 · parse ok 12 · nós AST 11220
- Chunks: 12 (arestas 0) · rotas candidatas: 0 · endpoints candidatos: 0
### Inferências do REA (bibliotecas, bundler, padrões)
- bundle_runtime: webpack (high)
- vendor_fingerprint: Next.js (high)
- vendor_fingerprint: React (medium)

## Limitações declaradas
- Bare string arguments of unbound HTTP-method-named calls are low-confidence endpoint candidates; form, translation, storage and other APIs can use the same syntax. URL-shaped findings still do not prove network execution.
- CDP discovery omitted the target attachment state; attached is reported as unknown.
- Endpoint candidates are deduplicated by script, value and detector; basis retains only the first matching source coordinate. They are not a complete call-site inventory or a runtime occurrence count. completeness.status="complete" describes examination of captured source, not a call-site census.
- Observation starts when REA attaches; prior network and console activity is unavailable.
- Page-declared WebMCP metadata is untrusted and is never registered or invoked as an REA tool.
- Pattern IDs are exact path identities within this inventory. Occurrence and source IDs retain source/content identity and precise syntax ranges; metadata-only discoveries have no AST range.
- Raw network headers, bodies, cookies, storage values, console objects, and WebSocket payloads are never retained; explicitly requested primitive console text is retained verbatim, while payload captures retain value-free shapes.
- Routes are static candidates from the provided code sources. Reachability, permissions, server-only routes and the complete application route set are unverified.
