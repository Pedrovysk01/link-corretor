"""Monta app/assets/js/i18n/keys.js e <lang>.js a partir de keys.json + <lang>.tsv (INDEX\tTRADUÇÃO).
Uso: python build.py <app> [langs...]   — linhas faltando ou com {*} diferente ficam null (cai no PT)."""
import json, sys, os, html
here = os.path.dirname(os.path.abspath(__file__))
app = sys.argv[1]; langs = sys.argv[2:] or ["es", "en", "it"]
# o código usa entidades (ex.: "-&gt;"); na tela aparece o caractere — chaves e traduções ficam decodificadas
keys = [html.unescape(k) for k in json.load(open(os.path.join(here, "keys.json"), encoding="utf-8"))]
extra = os.path.join(here, "extra_keys.json")  # frases achadas depois (2ª passada), anexadas ao fim
EXTRA = [html.unescape(k) for k in json.load(open(extra, encoding="utf-8"))] if os.path.exists(extra) else []
# passadas seguintes: extra2_keys.json + <lang>_extra2.tsv, extra3_keys.json + <lang>_extra3.tsv, …
LISTS = {"_extra.tsv": EXTRA}
for n in range(2, 200):   # extra2 ... extra199 (antes parava no 26 e as passadas novas nao entravam)
    f = os.path.join(here, f"extra{n}_keys.json")
    if os.path.exists(f): LISTS[f"_extra{n}.tsv"] = [html.unescape(k) for k in json.load(open(f, encoding="utf-8"))]
for L in LISTS.values(): keys += [k for k in L if k not in keys]
KI = {k: i for i, k in enumerate(keys)}
out = os.path.join(app, "assets", "js", "i18n"); os.makedirs(out, exist_ok=True)
open(os.path.join(out, "keys.js"), "w", encoding="utf-8").write("/* gerado por scratchpad/i18n/build.py — frases PT do painel */\nwindow.CF_I18N_KEYS=" + json.dumps(keys, ensure_ascii=False, separators=(",", ":")) + ";\n")
for lang in langs:
    vals = [None] * len(keys); bad = miss = 0
    for fn in [lang + ".tsv"] + [lang + suf for suf in LISTS]:
        p = os.path.join(here, fn)
        if not os.path.exists(p): continue
        is_extra = fn != lang + ".tsv"; LIST = LISTS.get(fn[len(lang):], EXTRA)
        for line in open(p, encoding="utf-8"):
            line = line.rstrip("\n").rstrip("\r")
            if "\t" not in line: continue
            i, v = line.split("\t", 1)
            try: i = int(i)
            except ValueError: continue
            if is_extra:  # extras: índice na lista extra_keys.json → posição da frase em keys
                if not (0 <= i < len(LIST)): continue
                i = KI[LIST[i]]
            if not (0 <= i < len(keys)): continue
            if v.count("{*}") != keys[i].count("{*}"): bad += 1; continue
            vals[i] = html.unescape(v.strip())
    miss = sum(1 for v in vals if v is None)
    open(os.path.join(out, lang + ".js"), "w", encoding="utf-8").write(f"/* gerado por scratchpad/i18n/build.py — {lang} */\n(window.CF_I18N=window.CF_I18N||{{}}).{lang}=" + json.dumps(vals, ensure_ascii=False, separators=(",", ":")) + ";\n")
    print(lang, "keys", len(keys), "faltando", miss, "{*} divergente", bad)
