# REA · navegador · painel

URL observada: `http://127.0.0.1:8091/painel/`

## Recursos carregados pela página
- 10 recursos (307 KB declarados) · hosts: 127.0.0.1:8091 ×10
- Tipos: Font ×4, Stylesheet ×3, Script ×3
- Pedidos de rede durante a observação (depois do carregamento): 0

## Scripts carregados
- 4 scripts (0 módulos ES, 0 com source map)
- http://127.0.0.1:8091/painel/
- http://127.0.0.1:8091/painel/painel.js?v=29
- http://127.0.0.1:8091/painel/tabelas.js?v=1
- http://127.0.0.1:8091/painel/vendor/qrcode.js?v=1

## DOM e acessibilidade
- Nós DOM: 71 · nós de acessibilidade: 32

## Cobertura do inspect
- status: policy_filtered · seções filtradas por política: 5 · limitadas por attach: 6

## Bundle (parse inerte dos scripts capturados)
- Scripts observados/analisados: 4/4 · parse ok 4 · nós AST 30530
- Chunks: 4 (arestas 0) · rotas candidatas: 0 · endpoints candidatos: 0
### Inferências do REA (bibliotecas, bundler, padrões)
- endpoint_candidate: email (low)
- endpoint_candidate: senha (low)
- endpoint_candidate: empresa (low)
- endpoint_candidate: nome (low)
- endpoint_candidate: exemplo (low)
- endpoint_candidate: status (low)
- endpoint_candidate: corretor (low)
- endpoint_candidate: empreendimento (low)
- endpoint_candidate: busca (low)
- endpoint_candidate: broker_id (low)
- endpoint_candidate: telefone (low)
- endpoint_candidate: foto (low)
- endpoint_candidate: name (low)
- endpoint_candidate: city (low)
- endpoint_candidate: whatsapp (low)
- endpoint_candidate: rec-ia (low)
- endpoint_candidate: rec-cadastro (low)
- endpoint_candidate: active (low)
- endpoint_candidate: facts (low)
- endpoint_candidate: source_dir (low)
- endpoint_candidate: external_url (low)
- endpoint_candidate: property_id (low)
- endpoint_candidate: channel (low)
- endpoint_candidate: label (low)
- endpoint_candidate: ai_limite (low)

## Limitações declaradas
- Bare string arguments of unbound HTTP-method-named calls are low-confidence endpoint candidates; form, translation, storage and other APIs can use the same syntax. URL-shaped findings still do not prove network execution.
- CDP discovery omitted the target attachment state; attached is reported as unknown.
- Endpoint candidates are deduplicated by script, value and detector; basis retains only the first matching source coordinate. They are not a complete call-site inventory or a runtime occurrence count. completeness.status="complete" describes examination of captured source, not a call-site census.
- Observation starts when REA attaches; prior network and console activity is unavailable.
- Page-declared WebMCP metadata is untrusted and is never registered or invoked as an REA tool.
- Pattern IDs are exact path identities within this inventory. Occurrence and source IDs retain source/content identity and precise syntax ranges; metadata-only discoveries have no AST range.
- Raw network headers, bodies, cookies, storage values, console objects, and WebSocket payloads are never retained; explicitly requested primitive console text is retained verbatim, while payload captures retain value-free shapes.
- Routes are static candidates from the provided code sources. Reachability, permissions, server-only routes and the complete application route set are unverified.
