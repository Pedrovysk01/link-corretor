# Villa Montemerano — executar e continuar o projeto

Este pacote contém o código editável do mapa interativo da Villa Montemerano, com imagens, vídeos, plantas, catálogo e bibliotecas locais. Foi preparado em 05/11/2026 a partir da pasta `montemerano-mapa`.

## Abrir no Windows

Você precisa de um navegador atualizado (Chrome ou Edge) e do **Node.js LTS**, disponível em <https://nodejs.org/>. Se o Node.js já estiver instalado, não precisa reinstalar. Nenhum pacote npm precisa ser baixado.

1. Extraia **todo o ZIP** para uma pasta do seu computador. Não execute de dentro do ZIP.
2. Abra a pasta `Villa-Montemerano` e dê dois cliques em **INICIAR.cmd**.
3. Aguarde o navegador abrir em **http://127.0.0.1:5190/index.html**. Se não abrir automaticamente, copie esse endereço para o navegador.
4. Mantenha a janela do servidor aberta enquanto usa o projeto. Para encerrar, pressione **Ctrl+C** nessa janela.

Confirme que aparece o mapa da Villa Montemerano e que o menu **Andares (20)** abre a lista. Clique em um andar para abrir sua ficha e em **Plantas** para abrir uma planta.

O projeto abre em qualquer pasta: não depende do nome do usuário, do disco D: nem das outras pastas do computador original. Depois de instalar o Node.js, a apresentação local não exige internet. Links externos, como WhatsApp, exigem conexão.

## Abrir pelo terminal ou em outro sistema

Na pasta que contém `servidor.cjs`, execute:

```sh
node servidor.cjs
```

Abra `http://127.0.0.1:5190/index.html` no navegador. O servidor usa somente recursos nativos do Node.js, entrega os arquivos da pasta `site` e suporta avanço e retorno nos vídeos. Use Node.js 18 ou superior.

Se a porta estiver ocupada, execute:

```sh
node servidor.cjs --port=5191
```

Nesse caso, abra `http://127.0.0.1:5191/index.html`. Não é necessário reinstalar nada.

## Continuar o desenvolvimento

Abra a pasta `Villa-Montemerano` no seu editor ou assistente de programação. Edite os arquivos em `site`, salve e atualize o navegador. Não há compilação ou etapa de build.

| Arquivo ou pasta | Responsabilidade |
| --- | --- |
| `site/index.html` | Estrutura da página, menus, telas e importação do Three.js |
| `site/data/empreendimento.json` | Textos, apartamentos, andares, polígonos clicáveis, galerias e materiais |
| `site/js/main.js` | Inicialização e ações dos menus |
| `site/js/mapa.js` | Mapa aéreo, pontos clicáveis, voo regional, abertura e troca de resolução |
| `site/js/panzoom.js` | Arrasto, zoom e movimento da câmera no mapa |
| `site/js/ficha.js` | Fichas de andares, apartamentos e áreas comuns |
| `site/js/relevo3d.js` | Maquete Three.js, câmera e seleção no 3D |
| `site/js/plantas.js` | Plantas com zoom e ambientes interativos |
| `site/js/exp.js`, `film.js`, `viewer.js`, `materiais.js` | Experiências, apresentação, galeria e catálogo |
| `site/css/` | Estilos; `montemerano.css` concentra ajustes específicos do empreendimento |
| `site/media/` | Imagens, vídeos, PDF, máscaras e texturas usados pelo projeto |
| `site/vendor/` | Three.js, OrbitControls e fontes locais |
| `CONTINUIDADE.md` | Estado recebido, decisões, limitações e roteiro de conferência |

Para mudar uma informação comercial, comece pelo JSON. Para ajustar a aparência, comece pelo CSS. Preserve os nomes das mídias ou atualize as referências correspondentes. Use **Ctrl+F5** se o navegador mostrar uma versão antiga.

## Resolver problemas

- **A janela informa que falta Node.js:** instale o Node.js LTS e abra novamente o iniciador. Se acabou de instalar, feche e reabra o terminal.
- **A página não conecta:** confirme que a janela do servidor continua aberta e use a porta impressa nela.
- **A página abriu sem funcionar depois de clicar no HTML:** use o iniciador. Abrir `index.html` diretamente como `file://` impede o carregamento normal dos módulos e do JSON.
- **O 3D não aparece:** confira a mensagem na tela, habilite aceleração gráfica no navegador e atualize o driver de vídeo. Essa visualização exige WebGL.
- **Um link enviado pelo WhatsApp não abre no computador de outra pessoa:** endereços `127.0.0.1` só funcionam no computador onde o servidor está rodando. Para apresentar remotamente, publique o conteúdo de `site` em uma hospedagem estática ou envie este ZIP.

## Conteúdo e dependências

O pacote não tem banco de dados, API própria, senhas ou instalação de dependências npm. O servidor se limita ao próprio computador (`127.0.0.1`). Para hospedagem estática, publique o conteúdo de `site`; o iniciador e o servidor são ferramentas de uso local.

Foram mantidos os arquivos que sustentam a aplicação e suas mídias. Backups, projetos alternativos (Bossa, estudos React/3D e viewer de teste), capturas de testes, scripts temporários, sequência de giro desconectada e imagens experimentais fora de uso ficaram fora. Os arquivos do computador original foram preservados.

O pacote permite continuar a aplicação entregue. Não inclui toda a biblioteca de materiais brutos da Justus nem o pipeline experimental que gerou as imagens tratadas. As imagens finais, plantas e catálogo usados pela aplicação estão incluídos. Para refazer o tratamento das imagens a partir dos originais ou retomar os estudos de giro, solicite esses materiais separadamente.

Preserve os avisos de licença das bibliotecas em `vendor`. O material imobiliário mantém os direitos dos respectivos titulares.
