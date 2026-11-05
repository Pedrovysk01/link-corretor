"""Roda o REA (morluto/rea, análise estática de JavaScript) em cada projeto-base e condensa o resultado.

    python .ds-audit/rea/run-rea.py            # todos
    python .ds-audit/rea/run-rea.py bossa      # um só (id)

Saída: .ds-audit/rea/<id>.json (bruto, grande) e .ds-audit/rea/<id>.md (resumo: módulos, dependências,
arquivos mais conectados, chamadas de rede, APIs do navegador, limitações declaradas pelo REA).
O REA só lê sintaxe; nunca executa o código dos repositórios de terceiros.
"""
import json, os, subprocess, sys, collections, re, pathlib, time

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / ".ds-audit" / "rea"
REFS = ROOT / ".ds-audit" / "refs"
PI = ROOT / "Planta-Interativa" / "Planta Interativa"
TMP = pathlib.Path(os.environ.get("TEMP", "/tmp")) / "rea-run"
TMP.mkdir(parents=True, exist_ok=True)

PROJETOS = {
    # nossos
    "bossa": PI / "app",
    "felicita": pathlib.Path(os.environ.get("TEMP", "/tmp")) / "rea-src" / "felicita",  # cópia só dos fontes (a pasta real tem vendor/maplibre e media/ que travam o REA)
    "montemerano-tour": PI / "tour" / "src",
    "painel": ROOT / "painel",
    # referências externas (GitHub)
    "real-estate-virtual-tour": REFS / "real-estate-virtual-tour" / "src",
    "wilsouza": REFS / "wilsouza-imobiliaria-3d-starter" / "src",
    "sunlight-simulator": REFS / "building-sunlight-simulator" / "js",
    "easy-house": REFS / "easy-house" / "src",
    "roam-3d": REFS / "roam-3d" / "js",
    "apartment3d": REFS / "apartment3d",
    "3d-real-estate-viewer": REFS / "3D-Real-Estate-Viewer" / "src",
    "scrollspire": REFS / "ScrollSpire-Cinematic-3D-Scrollytelling-for-Luxury-Real-Estate" / "src",
    "arven": REFS / "arven" / "src",
    "serica": REFS / "serica-estates-threejs" / "src",
    "reflexion": pathlib.Path(os.environ.get("TEMP", "/tmp")) / "rea-src" / "reflexion",  # cópia só dos fontes (a raiz tem node_modules)
    "3destate": REFS / "3dEstate" / "src",
    "cloudimage-360": pathlib.Path(os.environ.get("TEMP", "/tmp")) / "rea-src" / "cloudimage" / "src",
}

NPX = "npx.cmd" if os.name == "nt" else "npx"


def rodar(pid, pasta):
    raw = OUT / f"{pid}.json"
    if not pasta.is_dir():
        print(f"-- {pid}: pasta não existe ({pasta})"); return None
    if not raw.exists() or raw.stat().st_size < 1000:
        t0 = time.time()
        with open(raw, "w", encoding="utf-8") as f:
            r = subprocess.run([NPX, "-y", "rea-agents@latest", "analyze-javascript-application", str(pasta), "--json"], stdout=f, stderr=subprocess.PIPE, cwd=TMP, text=True, encoding="utf-8", errors="replace")
        if r.returncode != 0 or raw.stat().st_size < 1000:
            print(f"ERRO {pid}: REA falhou ({r.returncode}) · {r.stderr[-400:]}"); raw.unlink(missing_ok=True); return None
        print(f"OK {pid}: {raw.stat().st_size // 1024} KB em {time.time() - t0:.0f} s")
    t = raw.read_text(encoding="utf-8")
    i = t.find('{"evidence_id"')
    if i < 0:
        print(f"ERRO {pid}: sem evidência no JSON"); return None
    return json.loads(t[i:].split("\n")[0])


def resumir(pid, d):
    n = d["normalized_result"]; g = n["graph"]; st = n.get("statistics", {})
    nodes = {x["node_id"]: x for x in g["nodes"]}
    mods = [x for x in g["nodes"] if x["kind"] == "javascript-module"]
    assets = [x for x in g["nodes"] if x["kind"] == "javascript-asset"]

    def rotulo(x):
        o = x.get("observations") or []
        lab = (o[0].get("label") if o else None) or x.get("identity", {}).get("key", "")
        return str(lab).replace("static-import:", "")

    arquivos = {x["node_id"]: rotulo(x) for x in assets}
    arquivos.update({x["node_id"]: rotulo(x) for x in mods if x.get("identity", {}).get("namespace") == "source-module"})
    import posixpath
    caminhos = set(arquivos.values())
    EXT = ("", ".ts", ".tsx", ".js", ".jsx", ".mjs", "/index.ts", "/index.tsx", "/index.js")
    def resolver(origem, spec):
        if not spec or not spec.startswith("."): return None
        base = posixpath.normpath(posixpath.join(posixpath.dirname(origem), spec)).replace("\\", "/")
        for ext in EXT:
            if base + ext in caminhos: return base + ext
        return None
    externos = collections.Counter(); saidas = collections.Counter(); entradas = collections.Counter(); pares = set(); nao_resolvidos = 0
    for e in g["edges"]:
        if e.get("relation") != "imports": continue
        pr = e.get("properties") or {}; spec = pr.get("specifier") or ""; src = arquivos.get(e["source_node_id"])
        if not src: continue
        alvo = pr.get("resolved_path") or resolver(src, spec)
        if alvo: pares.add((src, alvo))
        elif spec.startswith("."): nao_resolvidos += 1
        elif spec: externos[spec.split("/")[0] if not spec.startswith("@") else "/".join(spec.split("/")[:2])] += 1; pares.add((src, "npm:" + spec))
    for s, d_ in pares:
        saidas[s] += 1
        if not d_.startswith("npm:"): entradas[d_] += 1
    sg = n.get("semantic_graph") or {}
    kinds = collections.Counter(x.get("kind") for x in sg.get("nodes", []))
    por_modulo = collections.Counter(x.get("identity", {}).get("module_path") for x in sg.get("nodes", []) if x.get("kind") == "function")
    rotas = (n.get("route_inventory") or {}).get("routes", [])
    unk = len(sg.get("unknowns", []))
    interesse = {}
    L = [f"# REA · {pid}", "", f"Pasta analisada: `{n['input_path']}`", "",
         "## Números", f"- Arquivos JS/TS lidos: {st.get('parsed_javascript_files', '?')} (pulados: {st.get('skipped_javascript_files', 0)}, falhas de parse: {st.get('parse_failures', 0)})",
         f"- Módulos no grafo: {len(mods)} · arestas de import: {sum(1 for e in g['edges'] if e.get('relation') == 'imports')} (relativos não resolvidos: {nao_resolvidos})",
         f"- Grafo semântico: {len(sg.get('nodes', []))} nós ({', '.join(f'{k} {v}' for k, v in kinds.most_common(6))}) · incógnitas declaradas: {unk}",
         f"- Rotas detectadas: {len(rotas)}", "",
         "## Dependências externas (por nº de imports)", *[f"- {k} × {v}" for k, v in externos.most_common(18)], "",
         "## Arquivos mais importados (o 'núcleo' do projeto)", *[f"- {k} ← {v}" for k, v in entradas.most_common(12)], "",
         "## Arquivos que mais importam (os 'orquestradores')", *[f"- {k} → {v}" for k, v in saidas.most_common(8)], "",
         "## Arquivos com mais funções (onde está a lógica)", *[f"- {k}: {v} funções" for k, v in por_modulo.most_common(10)], "",
         "## Limitações declaradas pelo REA", *[f"- {x}" for x in (g.get("limitations") or [])[:6]], ""]
    (OUT / f"{pid}.md").write_text("\n".join(L), encoding="utf-8")
    return {"id": pid, "arquivos": st.get("parsed_javascript_files"), "modulos": len(mods), "deps": externos.most_common(6), "nucleo": entradas.most_common(4), "funcoes": por_modulo.most_common(4)}


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    alvo = sys.argv[1:] or list(PROJETOS)
    res = []
    for pid in alvo:
        d = rodar(pid, PROJETOS[pid])
        if d: res.append(resumir(pid, d))
    (OUT / "_indice.json").write_text(json.dumps(res, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"\n{len(res)} projetos resumidos em {OUT}")
