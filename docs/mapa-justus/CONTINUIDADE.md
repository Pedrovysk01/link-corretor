# Estado para continuidade — 05/11/2026

## Versão deste pacote

Esta é a aplicação estática `montemerano-mapa`, com HTML, CSS e JavaScript nativo. Não é o projeto Bossa da pasta `app`, nem o estudo React/Vite da pasta `montemerano-3d`. Não misture as instruções desses projetos.

A documentação original apontava o mapa na porta 5192. A porta 5190 não tinha servidor ativo na inspeção. Este pacote passa a usar 5190 por padrão; o número da porta não identifica uma versão do código.

## Comportamentos presentes no código

- Mapa aéreo com arrasto, zoom, seleção de andares e chamarizes.
- 20 pavimentos residenciais, do 4º ao 23º, com dois apartamentos por pavimento.
- Fichas de andares, alternância entre apartamentos e navegação entre andares.
- Hall, garagens, lazer, plantas interativas, experiências, vídeos e catálogo em PDF.
- Maquete Three.js com OrbitControls, seleção e destaque de pavimentos.
- Voo regional em vídeo antes da abertura fotográfica, com opção de pular e fallback em caso de falha. Movimento reduzido ou um hash direto pula a introdução.
- Foto aérea tratada com versões 1800/2600/4200, máscara da torre, spotlight, flare e partículas. O zoom carrega uma versão maior da foto.
- Faixas dos andares invisíveis em repouso; o destaque aparece no hover.

## Decisões e limites que precisam ser preservados

1. **Final 01 = 116,60 m²; Final 02 = 128,60 m²**, conforme decisão registrada no histórico. O catálogo e a planta avulsa divergem na numeração; confirme a informação comercial com a incorporadora antes de divulgar.
2. **Disponibilidade não confirmada:** o JSON contém valores `d`, `r` e `v` e a interface mostra disponível, reservado e vendido. Esses valores não são uma tabela comercial oficial verificada. Não assuma que representam estoque real. Não há preços oficiais implementados.
3. Os comentários `_sobre` e `_aviso` no início do JSON são anteriores à adição de andares e status e não descrevem todo o estado atual. Os campos efetivos e o código são a referência de funcionamento; os comentários precisam ser revisados quando os dados oficiais chegarem.
4. A maquete é uma aproximação por volumes e fachadas texturizadas. Sua existência e operação não significam aprovação visual ou fidelidade arquitetônica validada. Há histórico de rejeição das maquetes anteriores; compare com os renders oficiais antes de mudar a arquitetura.
5. Os polígonos dos andares são ajustados à foto aérea. A documentação registra pequenos desvios de alinhamento. Confira pavimento por pavimento se alterar recorte ou proporção da foto.
6. O lazer fica no terraço sobre o embasamento, abaixo da torre residencial, e não na cobertura.
7. A conexão entre tomadas horizontal e vertical do antigo teste de giro continua sendo uma pendência daquele estudo. Ela não foi implementada nem aprovada como órbita contínua neste mapa.
8. Compartilhar links de materiais usa o endereço do servidor atual. Um link local não é público; é necessário hospedar o site para compartilhar links acessíveis remotamente.

## Conferir depois de uma alteração

1. Abra sem hash: observe o voo, pule a abertura e confirme que o mapa fica utilizável.
2. Abra **Andares (20)**, selecione o 15º, alterne os apartamentos e avance para outro andar.
3. Abra **Chamarizes** e confira Hall, Garagens e Lazer.
4. Abra as plantas e teste zoom e seleção de ambientes.
5. Abra **Experiências**, reproduza um vídeo e feche o player.
6. Abra **Materiais** e confira o PDF do catálogo.
7. Abra **Visão 3D**, espere carregar, gire a câmera, selecione um andar e volte à visão de cima.
8. Confira a tela em tamanho de celular. Testar em um aparelho real ainda é necessário para validar gestos e desempenho.

O relatório `VERIFICACAO.md` descreve os testes efetivamente realizados na preparação do pacote. Não trate esta lista de conferência como prova de que todos os dispositivos foram testados.
