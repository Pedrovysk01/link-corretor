# REA · navegador · roam-3d

URL observada: `http://127.0.0.1:8106/index.html`

## Recursos carregados pela página
- 30 recursos (6111 KB declarados) · hosts: 127.0.0.1:8106 ×30
- Tipos: Image ×21, Script ×8, Stylesheet ×1
- Pedidos de rede durante a observação (depois do carregamento): 0

### Assets 3D/mídia/dados
- http://127.0.0.1:8106/assets/rooms/zphoto-01.jpg
- http://127.0.0.1:8106/assets/rooms/zphoto-03.jpg
- http://127.0.0.1:8106/assets/rooms/zphoto-05.jpg
- http://127.0.0.1:8106/assets/rooms/zphoto-06.jpg
- http://127.0.0.1:8106/assets/rooms/zphoto-09.jpg
- http://127.0.0.1:8106/assets/rooms/zphoto-10.jpg
- http://127.0.0.1:8106/assets/rooms/zphoto-11.jpg
- http://127.0.0.1:8106/assets/rooms/zphoto-13.jpg
- http://127.0.0.1:8106/assets/rooms/zphoto-14.jpg
- http://127.0.0.1:8106/assets/rooms/zphoto-15.jpg
- http://127.0.0.1:8106/assets/rooms/zphoto-16.jpg
- http://127.0.0.1:8106/assets/rooms/zphoto-17.jpg
- http://127.0.0.1:8106/assets/rooms/zphoto-19.jpg
- http://127.0.0.1:8106/assets/rooms/zphoto-23.jpg
- http://127.0.0.1:8106/assets/rooms/zphoto-24.jpg
- http://127.0.0.1:8106/assets/rooms/zphoto-25.jpg
- http://127.0.0.1:8106/assets/rooms/zphoto-26.jpg
- http://127.0.0.1:8106/assets/rooms/zphoto-27.jpg
- http://127.0.0.1:8106/assets/rooms/zphoto-28.jpg
- http://127.0.0.1:8106/assets/rooms/zphoto-29.jpg
- http://127.0.0.1:8106/assets/rooms/zphoto-30.jpg

## Scripts carregados
- 8 scripts (8 módulos ES, 0 com source map)
- http://127.0.0.1:8106/js/buildWorld.js
- http://127.0.0.1:8106/js/controls.js
- http://127.0.0.1:8106/js/hud.js
- http://127.0.0.1:8106/js/loadListing.js
- http://127.0.0.1:8106/js/photoPanels.js
- http://127.0.0.1:8106/js/player.js
- http://127.0.0.1:8106/js/ui.js
- http://127.0.0.1:8106/main.js

## DOM e acessibilidade
- Nós DOM: 419 · nós de acessibilidade: 87

## Console
- [log]  (loadListing.js:48)

## Cobertura do inspect
- status: policy_filtered · seções filtradas por política: 7 · limitadas por attach: 6

## Bundle (parse inerte dos scripts capturados)
- Scripts observados/analisados: 8/8 · parse ok 8 · nós AST 8011
- Chunks: 8 (arestas 14) · rotas candidatas: 0 · endpoints candidatos: 0
### Inferências do REA (bibliotecas, bundler, padrões)
- endpoint_candidate: foyer (low)

## Limitações declaradas
- Bare string arguments of unbound HTTP-method-named calls are low-confidence endpoint candidates; form, translation, storage and other APIs can use the same syntax. URL-shaped findings still do not prove network execution.
- CDP discovery omitted the target attachment state; attached is reported as unknown.
- Endpoint candidates are deduplicated by script, value and detector; basis retains only the first matching source coordinate. They are not a complete call-site inventory or a runtime occurrence count. completeness.status="complete" describes examination of captured source, not a call-site census.
- Observation starts when REA attaches; prior network and console activity is unavailable.
- Page-declared WebMCP metadata is untrusted and is never registered or invoked as an REA tool.
- Pattern IDs are exact path identities within this inventory. Occurrence and source IDs retain source/content identity and precise syntax ranges; metadata-only discoveries have no AST range.
- Raw network headers, bodies, cookies, storage values, console objects, and WebSocket payloads are never retained; explicitly requested primitive console text is retained verbatim, while payload captures retain value-free shapes.
- Routes are static candidates from the provided code sources. Reachability, permissions, server-only routes and the complete application route set are unverified.
