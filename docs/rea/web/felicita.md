# REA · navegador · felicita

URL observada: `http://127.0.0.1:8118/#projeto`

## Recursos carregados pela página
- 15 recursos (4016 KB declarados) · hosts: 127.0.0.1:8118 ×15
- Tipos: Image ×7, Script ×7, Stylesheet ×1
- Pedidos de rede durante a observação (depois do carregamento): 0

### Assets 3D/mídia/dados
- http://127.0.0.1:8118/media/ai/render-manha.jpg
- http://127.0.0.1:8118/media/ai/render-noite.jpg
- http://127.0.0.1:8118/media/ai/render-tarde.jpg
- http://127.0.0.1:8118/media/g25.jpg
- http://127.0.0.1:8118/media/hero-dia.jpg
- http://127.0.0.1:8118/media/hero-noite.jpg
- http://127.0.0.1:8118/media/planta-lazer.jpg

## Scripts carregados
- 8 scripts (0 módulos ES, 1 com source map)
- http://127.0.0.1:8118/
- http://127.0.0.1:8118/core.js
- http://127.0.0.1:8118/data/pois.js
- http://127.0.0.1:8118/data/projeto.js
- http://127.0.0.1:8118/main.js
- http://127.0.0.1:8118/maps.js?v=6
- http://127.0.0.1:8118/torre.js
- http://127.0.0.1:8118/vendor/maplibre-gl.js

## DOM e acessibilidade
- Nós DOM: 521 · nós de acessibilidade: 56

## Cobertura do inspect
- status: policy_filtered · seções filtradas por política: 6 · limitadas por attach: 6

## Bundle (parse inerte dos scripts capturados)
- Scripts observados/analisados: 8/8 · parse ok 8 · nós AST 256347
- Chunks: 8 (arestas 0) · rotas candidatas: 0 · endpoints candidatos: 0
### Inferências do REA (bibliotecas, bundler, padrões)
- (+180 endpoint_candidate de confiança baixa omitidos: nomes de uniforms/atributos, não endpoints)

## Limitações declaradas
- Bare string arguments of unbound HTTP-method-named calls are low-confidence endpoint candidates; form, translation, storage and other APIs can use the same syntax. URL-shaped findings still do not prove network execution.
- CDP discovery omitted the target attachment state; attached is reported as unknown.
- Endpoint candidates are deduplicated by script, value and detector; basis retains only the first matching source coordinate. They are not a complete call-site inventory or a runtime occurrence count. completeness.status="complete" describes examination of captured source, not a call-site census.
- Observation starts when REA attaches; prior network and console activity is unavailable.
- Page-declared WebMCP metadata is untrusted and is never registered or invoked as an REA tool.
- Pattern IDs are exact path identities within this inventory. Occurrence and source IDs retain source/content identity and precise syntax ranges; metadata-only discoveries have no AST range.
- Raw network headers, bodies, cookies, storage values, console objects, and WebSocket payloads are never retained; explicitly requested primitive console text is retained verbatim, while payload captures retain value-free shapes.
- Routes are static candidates from the provided code sources. Reachability, permissions, server-only routes and the complete application route set are unverified.
