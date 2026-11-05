# REA · navegador · bossa

URL observada: `http://127.0.0.1:8117/`

## Recursos carregados pela página
- 37 recursos (2143 KB declarados) · hosts: 127.0.0.1:8117 ×37
- Tipos: Script ×16, Stylesheet ×8, Image ×7, Font ×6
- Pedidos de rede durante a observação (depois do carregamento): 0

### Assets 3D/mídia/dados
- http://127.0.0.1:8117/media/render-2x.webp
- http://127.0.0.1:8117/media/x-clube.jpg
- http://127.0.0.1:8117/media/x-deck.jpg
- http://127.0.0.1:8117/media/x-kids.jpg
- http://127.0.0.1:8117/media/x-lago.jpg
- http://127.0.0.1:8117/media/x-praia.jpg
- http://127.0.0.1:8117/media/x-quadras.jpg

## Scripts carregados
- 16 scripts (16 módulos ES, 0 com source map)
- http://127.0.0.1:8117/js/chatmedia.js
- http://127.0.0.1:8117/js/data.js
- http://127.0.0.1:8117/js/exp.js
- http://127.0.0.1:8117/js/ficha.js
- http://127.0.0.1:8117/js/film.js
- http://127.0.0.1:8117/js/icons.js
- http://127.0.0.1:8117/js/main.js
- http://127.0.0.1:8117/js/map2d.js
- http://127.0.0.1:8117/js/materiais.js
- http://127.0.0.1:8117/js/perfil.js
- http://127.0.0.1:8117/js/pins.js
- http://127.0.0.1:8117/js/relevo3d.js
- http://127.0.0.1:8117/js/state.js
- http://127.0.0.1:8117/js/sun.js
- http://127.0.0.1:8117/js/vendas.js
- http://127.0.0.1:8117/js/viewer.js

## DOM e acessibilidade
- Nós DOM: 1142 · nós de acessibilidade: 427

## Cobertura do inspect
- status: policy_filtered · seções filtradas por política: 6 · limitadas por attach: 6

## Bundle (parse inerte dos scripts capturados)
- Scripts observados/analisados: 16/16 · parse ok 16 · nós AST 29997
- Chunks: 16 (arestas 59) · rotas candidatas: 0 · endpoints candidatos: 1
### Inferências do REA (bibliotecas, bundler, padrões)
- (+3 endpoint_candidate de confiança baixa omitidos: nomes de uniforms/atributos, não endpoints)

### Endpoints candidatos
- {"value": "data/materiais.json", "mechanism": "call:fetch", "location": {"script_key": "scr_eddd83149105f887d8fced99bb4eab9892bae4548fe84cc9615c2f1535b377ee", "

## Limitações declaradas
- Bare string arguments of unbound HTTP-method-named calls are low-confidence endpoint candidates; form, translation, storage and other APIs can use the same syntax. URL-shaped findings still do not prove network execution.
- CDP discovery omitted the target attachment state; attached is reported as unknown.
- Endpoint candidates are deduplicated by script, value and detector; basis retains only the first matching source coordinate. They are not a complete call-site inventory or a runtime occurrence count. completeness.status="complete" describes examination of captured source, not a call-site census.
- Observation starts when REA attaches; prior network and console activity is unavailable.
- Page-declared WebMCP metadata is untrusted and is never registered or invoked as an REA tool.
- Pattern IDs are exact path identities within this inventory. Occurrence and source IDs retain source/content identity and precise syntax ranges; metadata-only discoveries have no AST range.
- Raw network headers, bodies, cookies, storage values, console objects, and WebSocket payloads are never retained; explicitly requested primitive console text is retained verbatim, while payload captures retain value-free shapes.
- Routes are static candidates from the provided code sources. Reachability, permissions, server-only routes and the complete application route set are unverified.
