# Mapa de Vendas Bossa

Mapa interativo de vendas do Bossa Eco Luxury Villas (Taipa Inc, Praia do Toque).

## Rodar localmente

```bash
python -m http.server 8766 --bind 127.0.0.1
```

Abra `http://127.0.0.1:8766/index.html`. O servidor fica preso a este computador de propósito: em `0.0.0.0` ele serviria a pasta inteira (inclusive `.git`) para qualquer um na mesma rede.

Para testar no celular, use um túnel ou suba na rede só durante o teste e feche em seguida.

## Testes

Precisam do servidor acima e do ego-browser (ego lite) aberto.

```bash
node tests/fase-a-static.mjs
ego-browser nodejs -e "await import('file:///D:/Projetos/Planta%20Interativa/app/tests/fase-a-retry.mjs')"
node tests/fase-b-static.mjs
ego-browser nodejs -e "await import('file:///D:/Projetos/Planta%20Interativa/app/tests/legenda.mjs')"
ego-browser nodejs -e "await import('file:///D:/Projetos/Planta%20Interativa/app/tests/sol.mjs')"
ego-browser nodejs -e "await import('file:///D:/Projetos/Planta%20Interativa/app/tests/vendas.mjs')"
ego-browser nodejs -e "await import('file:///D:/Projetos/Planta%20Interativa/app/tests/roteiro.mjs')" && node tests/compara-roteiro.mjs
```

`roteiro.mjs` percorre o mapa como um comprador e grava `tests/out/roteiro.json`; `compara-roteiro.mjs` compara com `tests/baseline/` (a referência de antes da Fase B).

## Estrutura

- `data/units.json`: casas, preços, disponíveis (`available`) e reservadas. Para vender ou liberar uma casa, edite só este arquivo.
- `data/materiais.json`: lista do painel Materiais. Para publicar um PDF novo (memorial de engenharia, código do consumidor, bons usos), copie o arquivo para `media/` e acrescente em `itens` um objeto `{id, titulo, descricao, categoria, tipo:"pdf", arquivo:"media/arquivo.pdf", tamanho:"2,1 MB", paginas:12, acesso:["corretor","construtor"]}`; `tipo:"link"` aponta para um endereço externo e `tipo:"gerado"` usa `espelho`, `tabela` ou `precos` (montados de `units.json`). `acesso` lista os perfis (corretor, construtor, cliente, admin) que veem o item. Atenção: isso só esconde o cartão no navegador, não é segurança, pois o arquivo continua acessível a quem souber o endereço; na versão final, material de acesso restrito deve ser servido por servidor autenticado.
- `data/content.json`: áreas comuns, galerias, plantas, experiências e enquadramentos.
- `css/`: estilos na ordem em que o `index.html` liga.
- `js/materiais.js` (painel e folhas de Materiais), `js/perfil.js` (`perfilAtual()`), `js/main.js` (entrada), `state.js` (estado compartilhado), `data.js`, `map2d.js`, `pins.js`, `ficha.js`, `viewer.js`, `exp.js`, `film.js`, `sun.js`, `relevo3d.js`.

Os gates de cada fase ficam em `.unlazy/<fase>/GATES.md` (não versionado). O plano está em `PLANO.md`.
