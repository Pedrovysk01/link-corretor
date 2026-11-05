# Verificação da entrega — 05/11/2026

Os testes foram feitos sobre uma cópia extraída do ZIP em uma pasta diferente da aplicação original. O servidor foi iniciado com o Node.js pelo caminho absoluto, a partir de outro diretório de trabalho.

## Resultados observados

- ZIP extraído sem falhas de CRC; hashes SHA-256 dos arquivos conferidos contra o conteúdo preparado.
- 149 arquivos do site acessíveis por HTTP, todos com resposta 200 e tamanho correspondente ao arquivo local.
- Referências estáticas de HTML, CSS e módulos locais conferidas; caminhos de vídeos e materiais presentes no JSON conferidos.
- Leitura parcial do vídeo de apresentação: resposta HTTP 206 com os 100 bytes solicitados. Arquivo inexistente: 404; faixa inválida: 416; tentativa de sair da pasta do site: 403.
- Navegador Ego/Chromium: página inicial carregada, voo de abertura exibido e transição concluída.
- Menu de 20 andares aberto; ficha do 23º pavimento aberta; alternância para o apartamento de 128,60 m² executada.
- Planta do pavimento tipo aberta em diálogo com imagem e controles.
- Visão 3D carregada com canvas WebGL e maquete visível. Nenhum recurso com HTTP 400 ou superior foi registrado na lista de recursos da sessão.
- Capturas da ficha e do 3D inspecionadas visualmente durante a preparação.

## Limites

Ambiente usado: Windows, Node.js 24.16.0 e navegador Chromium via Ego. A inicialização por terminal foi executada; o duplo clique no iniciador Windows não foi exercitado em um segundo computador físico. Node.js 18 ou superior é o requisito declarado pelo servidor; outras versões e sistemas não foram testados nesta preparação.

Os testes confirmam a transferência e o funcionamento básico da aplicação extraída. Não constituem validação completa de todos os botões, navegadores, aparelhos móveis ou da fidelidade arquitetônica. Disponibilidade comercial precisa ser confirmada com a incorporadora, conforme `CONTINUIDADE.md`.
