# Traduções do painel (PT → ES · EN · IT)

O código das telas fica em português. `app/assets/js/i18n.js` traduz o que aparece na tela usando os dicionários gerados aqui.

- `keys.json` + `<lang>.tsv` — 1ª extração (1623 frases), índice → tradução.
- `extra_keys.json` + `<lang>_extra.tsv`, `extra2_keys.json` + `<lang>_extra2.tsv` — frases achadas depois (geradas por `extras_tr.py` / `extras2_tr.py`).
- `python build.py ../../app` — gera `app/assets/js/i18n/keys.js`, `es.js`, `en.js`, `it.js`.
- `python crawl.py ../../app es --save` — abre o painel no idioma e lista textos que continuam em PT (`leftovers_es.json`).
- `node extract.js ../../app` — reextrai as frases do código (precisa de `npm i` nesta pasta). **Não sobrescreva `keys.json`**: os .tsv dependem da ordem dele; frases novas vão para um `extraN_keys.json` + `<lang>_extraN.tsv`.

Frase nova no painel → adicione PT/ES/EN/IT num `extrasN_tr.py`, rode o script e `build.py`, depois `crawl.py` para conferir.
