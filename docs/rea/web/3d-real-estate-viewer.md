# REA · navegador · 3d-real-estate-viewer

URL observada: `http://127.0.0.1:8110/`

## Recursos carregados pela página
- 20 recursos (9390 KB declarados) · hosts: 127.0.0.1:8110 ×20
- Tipos: Script ×16, Image ×4
- Pedidos de rede durante a observação (depois do carregamento): 0

### Assets 3D/mídia/dados
- http://127.0.0.1:8110/previews/apartment-12a.svg
- http://127.0.0.1:8110/previews/apartment-3d.svg
- http://127.0.0.1:8110/previews/apartment-7b.svg
- http://127.0.0.1:8110/previews/loft-5c.svg

## Scripts carregados
- 38 scripts (38 módulos ES, 12 com source map)
- http://127.0.0.1:8110/
- http://127.0.0.1:8110/@react-refresh
- http://127.0.0.1:8110/@vite/client
- http://127.0.0.1:8110/node_modules/.vite/deps/@mui_icons-material.js?v=dff2f79c
- http://127.0.0.1:8110/node_modules/.vite/deps/@mui_material.js?v=dff2f79c
- http://127.0.0.1:8110/node_modules/.vite/deps/@mui_material_styles.js?v=dff2f79c
- http://127.0.0.1:8110/node_modules/.vite/deps/chunk-7UPI7WLC.js?v=dff2f79c
- http://127.0.0.1:8110/node_modules/.vite/deps/chunk-ADIUWS5K.js?v=dff2f79c
- http://127.0.0.1:8110/node_modules/.vite/deps/chunk-DC5AMYBS.js?v=dff2f79c
- http://127.0.0.1:8110/node_modules/.vite/deps/chunk-DYKRQPZ6.js?v=dff2f79c
- http://127.0.0.1:8110/node_modules/.vite/deps/chunk-HSGOZE3I.js?v=dff2f79c
- http://127.0.0.1:8110/node_modules/.vite/deps/chunk-MHB3ESSQ.js?v=dff2f79c
- http://127.0.0.1:8110/node_modules/.vite/deps/chunk-Q3YFSOIY.js?v=dff2f79c
- http://127.0.0.1:8110/node_modules/.vite/deps/chunk-RLJ2RCJQ.js?v=dff2f79c
- http://127.0.0.1:8110/node_modules/.vite/deps/chunk-S725DACQ.js?v=dff2f79c
- http://127.0.0.1:8110/node_modules/.vite/deps/react-dom_client.js?v=dff2f79c
- http://127.0.0.1:8110/node_modules/.vite/deps/react-router-dom.js?v=dff2f79c
- http://127.0.0.1:8110/node_modules/.vite/deps/react.js?v=dff2f79c
- http://127.0.0.1:8110/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=dff2f79c
- http://127.0.0.1:8110/node_modules/vite/dist/client/env.mjs
- http://127.0.0.1:8110/src/app/App.tsx
- http://127.0.0.1:8110/src/app/providers/AppThemeProvider.tsx
- http://127.0.0.1:8110/src/app/router/AppRouter.tsx
- http://127.0.0.1:8110/src/app/styles/global.css
- http://127.0.0.1:8110/src/entities/property/api/propertyRepository.ts
- http://127.0.0.1:8110/src/entities/property/model/mockProperties.ts
- http://127.0.0.1:8110/src/entities/property/model/useProperties.ts
- http://127.0.0.1:8110/src/main.tsx
- http://127.0.0.1:8110/src/pages/properties/ui/PropertiesPage.tsx
- http://127.0.0.1:8110/src/shared/config/theme.ts

## DOM e acessibilidade
- Nós DOM: 713 · nós de acessibilidade: 212

## Console
- [debug]  (client:788)
- [debug]  (client:911)
- [info]  (chunk-DYKRQPZ6.js?v=dff2f79c:21608)
- [warning]  (react-router-dom.js?v=dff2f79c:4416)
- [warning]  (react-router-dom.js?v=dff2f79c:4416)

## Cobertura do inspect
- status: policy_filtered · seções filtradas por política: 5 · limitadas por attach: 6

## Bundle (parse inerte dos scripts capturados)
- Scripts observados/analisados: 38/38 · parse ok 37 · nós AST 623394
- Chunks: 38 (arestas 125) · rotas candidatas: 4 · endpoints candidatos: 0
### Inferências do REA (bibliotecas, bundler, padrões)
- bundle_runtime: Vite (medium)
- vendor_fingerprint: React (medium)
- endpoint_candidate: index (low)
- route_framework: React Router-compatible route API (medium)

## Limitações declaradas
- Bare string arguments of unbound HTTP-method-named calls are low-confidence endpoint candidates; form, translation, storage and other APIs can use the same syntax. URL-shaped findings still do not prove network execution.
- CDP discovery omitted the target attachment state; attached is reported as unknown.
- Endpoint candidates are deduplicated by script, value and detector; basis retains only the first matching source coordinate. They are not a complete call-site inventory or a runtime occurrence count. completeness.status="complete" describes examination of captured source, not a call-site census.
- Observation starts when REA attaches; prior network and console activity is unavailable.
- Page-declared WebMCP metadata is untrusted and is never registered or invoked as an REA tool.
- Pattern IDs are exact path identities within this inventory. Occurrence and source IDs retain source/content identity and precise syntax ranges; metadata-only discoveries have no AST range.
- Raw network headers, bodies, cookies, storage values, console objects, and WebSocket payloads are never retained; explicitly requested primitive console text is retained verbatim, while payload captures retain value-free shapes.
- Routes are static candidates from the provided code sources. Reachability, permissions, server-only routes and the complete application route set are unverified.
