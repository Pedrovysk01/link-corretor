# REA · navegador · montemerano-fachada

URL observada: `http://127.0.0.1:8116/fachada/index.html?andar=13`

## Recursos carregados pela página
- 3 recursos (391 KB declarados) · hosts: 127.0.0.1:8116 ×3
- Tipos: Image ×3
- Pedidos de rede durante a observação (depois do carregamento): 0

### Assets 3D/mídia/dados
- http://127.0.0.1:8116/img/externa-01.webp
- http://127.0.0.1:8116/img/planta-tipo-a.webp
- http://127.0.0.1:8116/logo-branca.svg

## Scripts carregados
- 1 scripts (0 módulos ES, 0 com source map)
- http://127.0.0.1:8116/fachada/index.html?andar=13

## DOM e acessibilidade
- Nós DOM: 201 · nós de acessibilidade: 185

## Cobertura do inspect
- status: policy_filtered · seções filtradas por política: 6 · limitadas por attach: 6

## Bundle (parse inerte dos scripts capturados)
- Scripts observados/analisados: 1/1 · parse ok 1 · nós AST 2853
- Chunks: 1 (arestas 0) · rotas candidatas: 0 · endpoints candidatos: 0
### Inferências do REA (bibliotecas, bundler, padrões)
- endpoint_candidate: apto (low)
- endpoint_candidate: andar (low)
- endpoint_candidate: vista (low)

## Limitações declaradas
- Bare string arguments of unbound HTTP-method-named calls are low-confidence endpoint candidates; form, translation, storage and other APIs can use the same syntax. URL-shaped findings still do not prove network execution.
- CDP discovery omitted the target attachment state; attached is reported as unknown.
- Endpoint candidates are deduplicated by script, value and detector; basis retains only the first matching source coordinate. They are not a complete call-site inventory or a runtime occurrence count. completeness.status="complete" describes examination of captured source, not a call-site census.
- Observation starts when REA attaches; prior network and console activity is unavailable.
- Page-declared WebMCP metadata is untrusted and is never registered or invoked as an REA tool.
- Pattern IDs are exact path identities within this inventory. Occurrence and source IDs retain source/content identity and precise syntax ranges; metadata-only discoveries have no AST range.
- Raw network headers, bodies, cookies, storage values, console objects, and WebSocket payloads are never retained; explicitly requested primitive console text is retained verbatim, while payload captures retain value-free shapes.
- Routes are static candidates from the provided code sources. Reachability, permissions, server-only routes and the complete application route set are unverified.
