# REA · navegador · apartment3d

URL observada: `http://127.0.0.1:8113/`

## Recursos carregados pela página
- 2 recursos (75 KB declarados) · hosts: 127.0.0.1:8113 ×2
- Tipos: Stylesheet ×1, Script ×1
- Pedidos de rede durante a observação (depois do carregamento): 0

## Scripts carregados
- 1 scripts (1 módulos ES, 0 com source map)
- http://127.0.0.1:8113/app.js?v=16

## DOM e acessibilidade
- Nós DOM: 263 · nós de acessibilidade: 108

## Storage da origem
- localStorage/sessionStorage: apartment3d-lock · IndexedDB: [] · caches: []

## Cobertura do inspect
- status: policy_filtered · seções filtradas por política: 6 · limitadas por attach: 6

## Bundle (parse inerte dos scripts capturados)
- Scripts observados/analisados: 1/1 · parse ok 1 · nós AST 16694
- Chunks: 1 (arestas 1) · rotas candidatas: 0 · endpoints candidatos: 0
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
