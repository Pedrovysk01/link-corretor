"""REA no navegador (observação passiva via CDP) em cada app em execução.

    python .ds-audit/rea/run-rea-web.py            # todos
    python .ds-audit/rea/run-rea-web.py bossa      # um só

Pré-requisitos: Chrome aberto com --remote-debugging-port=9222 (perfil temporário, headless) e os apps no ar nas portas
abaixo. Para cada app: abre a URL numa aba nova via CDP, espera o 3D montar, roda `inspect-web-page` (DOM, scripts,
recursos, rede, console, storage) e `analyze-web-bundle` (parse inerte dos scripts carregados: chunks, rotas, vendors),
grava .ds-audit/rea/web/<id>-inspect.json e <id>-bundle.json e condensa em docs/rea/web/<id>.md. Nada é clicado; só
leitura. O REA usa a origem do próprio alvo por padrão (o flag --allowed-origins não aceita 127.0.0.1:porta pelo npx.cmd);
pedidos a CDNs externas aparecem só como observação de rede, nunca são seguidos.
"""
import json, os, subprocess, sys, time, pathlib, urllib.request, urllib.parse, collections, re

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / ".ds-audit" / "rea" / "web"; OUT.mkdir(parents=True, exist_ok=True)
DOCS = ROOT / "docs" / "rea" / "web"; DOCS.mkdir(parents=True, exist_ok=True)
TMP = pathlib.Path(os.environ.get("TEMP", "/tmp")) / "rea-run"; TMP.mkdir(exist_ok=True)
CDP = "http://127.0.0.1:9222"
NPX = "npx.cmd" if os.name == "nt" else "npx"

APPS = {
    "bossa": "http://127.0.0.1:8117/",  # pasta app/ servida direto (o /pre/ do painel exige login)
    "felicita": "http://127.0.0.1:8118/#projeto",
    "montemerano-tour": "http://127.0.0.1:8116/?property=montemerano-01&view=tour",
    "montemerano-fachada": "http://127.0.0.1:8116/fachada/index.html?andar=13",
    "montemerano-360": "http://127.0.0.1:8116/360/index.html",
    "painel": "http://127.0.0.1:8091/painel/",
    "wilsouza": "http://127.0.0.1:8100/",
    "sunlight-simulator": "http://127.0.0.1:8101/",
    "easy-house": "http://127.0.0.1:8102/",
    "serica": "http://127.0.0.1:8103/",
    "scrollspire": "http://127.0.0.1:8104/",
    "arven": "http://127.0.0.1:8105/",
    "roam-3d": "http://127.0.0.1:8106/index.html",
    "3d-real-estate-viewer": "http://127.0.0.1:8110/",
    "real-estate-virtual-tour": "http://127.0.0.1:8112/?property=villa-serena&view=tour",
    "apartment3d": "http://127.0.0.1:8113/",
    "sims-builder": "http://127.0.0.1:8114/",
    "reflexion": "http://127.0.0.1:8115/",
}
ESPERA = {"montemerano-tour": 22, "real-estate-virtual-tour": 22, "wilsouza": 14, "scrollspire": 12, "felicita": 14, "bossa": 12}


def cdp(path, method="GET"):
    req = urllib.request.Request(CDP + path, method=method)
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read() or b"null")


def rea(args, out_file):
    with open(out_file, "w", encoding="utf-8") as f:
        r = subprocess.run([NPX, "-y", "rea-agents@latest", *args, "--format", "json"], stdout=f, stderr=subprocess.PIPE, cwd=TMP, text=True, encoding="utf-8", errors="replace", timeout=900)
    ok = r.returncode == 0 and out_file.stat().st_size > 200
    return ok, r.stderr[-600:]


def carregar(f):
    t = f.read_text(encoding="utf-8")
    i = t.find("{")
    return json.loads(t[i:]) if i >= 0 else {}


def achar(o, chave, acc=None):
    """Coleta todos os valores de uma chave em qualquer profundidade."""
    acc = [] if acc is None else acc
    if isinstance(o, dict):
        for k, v in o.items():
            if k == chave: acc.append(v)
            achar(v, chave, acc)
    elif isinstance(o, list):
        for v in o: achar(v, chave, acc)
    return acc


def resumir(pid, url, insp, bund):
    L = [f"# REA · navegador · {pid}", "", f"URL observada: `{url}`", ""]
    n = insp.get("normalized_result") or insp
    # inspect (forma real): scripts.items / resources / network.requests / console.events / storage / dom / accessibility / metadata.dom_urls
    res = n.get("resources") or []
    reqs = (n.get("network") or {}).get("requests") or []
    urls = [x.get("url") for x in res if x.get("url")] + [x.get("url") for x in reqs if isinstance(x, dict) and x.get("url")]
    hosts = collections.Counter(urllib.parse.urlparse(u).netloc for u in urls)
    tipos = collections.Counter((x.get("type") or x.get("mime_type") or "?") for x in res)
    tam = sum(int(x.get("content_size") or 0) for x in res)
    L += ["## Recursos carregados pela página", f"- {len(res)} recursos ({tam // 1024} KB declarados) · hosts: " + ", ".join(f"{h} ×{c}" for h, c in hosts.most_common(6)),
          "- Tipos: " + ", ".join(f"{e} ×{c}" for e, c in tipos.most_common(10)),
          f"- Pedidos de rede durante a observação (depois do carregamento): {len(reqs)}", ""]
    grandes = sorted({u for u in urls if re.search(r"\.(glb|gltf|hdr|exr|ktx2|basis|mp4|webm|webp|jpg|jpeg|png|svg|json|bin|wasm)(\?|$)", u.lower())})[:40]
    if grandes: L += ["### Assets 3D/mídia/dados", *[f"- {u}" for u in grandes], ""]
    sc = (n.get("scripts") or {}).get("items") or []
    surls = sorted({x.get("url") for x in sc if x.get("url")})
    mods = sum(1 for x in sc if x.get("is_module")); smaps = sum(1 for x in sc if x.get("source_map_url"))
    L += ["## Scripts carregados", f"- {len(sc)} scripts ({mods} módulos ES, {smaps} com source map)", *[f"- {u}" for u in surls[:30]], ""]
    dom = n.get("dom") or {}; acc = n.get("accessibility") or {}
    L += ["## DOM e acessibilidade", f"- Nós DOM: {dom.get('total_nodes')} · nós de acessibilidade: {acc.get('total_nodes')}", ""]
    ev = (n.get("console") or {}).get("events") or []
    if ev:
        L += ["## Console", *[f"- [{x.get('type')}] {str((x.get('text_capture') or {}).get('text') or x.get('text') or '')[:140]} ({(x.get('url') or '').split('/')[-1]}:{x.get('line')})" for x in ev[:12]], ""]
    st = n.get("storage") or {}
    ks = (st.get("local_storage_keys") or []) + (st.get("session_storage_keys") or [])
    if ks or st.get("indexed_db_names") or st.get("cache_names"):
        L += ["## Storage da origem", f"- localStorage/sessionStorage: {', '.join(map(str, ks[:30])) or '—'} · IndexedDB: {st.get('indexed_db_names')} · caches: {st.get('cache_names')}", ""]
    comp = n.get("completeness") or {}
    L += ["## Cobertura do inspect", f"- status: {comp.get('status')} · seções filtradas por política: {len(comp.get('policy_filtered_sections') or [])} · limitadas por attach: {len(comp.get('attach_limited_sections') or [])}", ""]
    # bundle (forma real: capture / observations.chunks|routes|endpoints / inferences / completeness)
    b = bund.get("normalized_result") or bund
    obs = b.get("observations") or {}; cap = b.get("capture") or {}; comp = b.get("completeness") or {}
    chunks = (obs.get("chunks") or {}).get("nodes") or []; cedges = (obs.get("chunks") or {}).get("edges") or []
    rotas = obs.get("routes") or []; ends = obs.get("endpoints") or []
    infer = b.get("inferences") or []
    nomes = collections.Counter(); baixos = 0
    for x in infer:
        if not isinstance(x, dict): continue
        if x.get("kind") == "endpoint_candidate" and x.get("confidence") == "low": baixos += 1; continue  # quase sempre nomes de uniforms de shader
        nomes[f"{x.get('kind')}: {str(x.get('value'))[:60]} ({x.get('confidence')})"] += 1
    if baixos: nomes[f"(+{baixos} endpoint_candidate de confiança baixa omitidos: nomes de uniforms/atributos, não endpoints)"] = 0
    L += ["## Bundle (parse inerte dos scripts capturados)",
          f"- Scripts observados/analisados: {cap.get('scripts_observed')}/{cap.get('scripts_analyzed')} · parse ok {comp.get('parsed_scripts')} · nós AST {comp.get('visited_ast_nodes')}",
          f"- Chunks: {len(chunks)} (arestas {len(cedges)}) · rotas candidatas: {len(rotas)} · endpoints candidatos: {len(ends)}",
          "### Inferências do REA (bibliotecas, bundler, padrões)", *[f"- {k}" for k, _ in nomes.most_common(25)], ""]
    if ends:
        L += ["### Endpoints candidatos", *[f"- {json.dumps(e, ensure_ascii=False)[:160]}" for e in ends[:15]], ""]
    lim = sorted({l for lst in achar(n, "limitations") + achar(b, "limitations") if isinstance(lst, list) for l in lst if isinstance(l, str)})
    L += ["## Limitações declaradas", *[f"- {l}" for l in lim[:8]], ""]
    (DOCS / f"{pid}.md").write_text("\n".join(L), encoding="utf-8")
    return {"id": pid, "url": url, "recursos": len(res), "hosts": hosts.most_common(4), "scripts": len(sc), "assets": len(grandes), "libs": [k for k, _ in nomes.most_common(6)], "endpoints": len(ends), "chunks": len(chunks)}


def processar(pid, url):
    try:
        urllib.request.urlopen(url.split("#")[0], timeout=8).read(64)
    except Exception as e:
        print(f"-- {pid}: app fora do ar ({e})"); return None
    t = cdp("/json/new?" + url, "PUT"); tid = t["id"]
    time.sleep(ESPERA.get(pid, 10))
    fi, fb = OUT / f"{pid}-inspect.json", OUT / f"{pid}-bundle.json"
    if fi.exists() and fi.stat().st_size > 200 and fb.exists() and fb.stat().st_size > 200 and "--force" not in sys.argv:
        try: cdp(f"/json/close/{tid}")
        except Exception: pass
        r = resumir(pid, url, carregar(fi), carregar(fb)); print(f"OK {pid} (cache): {r['recursos']} recursos, {r['scripts']} scripts, chunks {r['chunks']}"); return r
    ok1, e1 = rea(["inspect-web-page", CDP, tid, "--observation-ms", "1500", "--include-console-text", "--include-storage-keys"], fi)  # sem --include-json-body-shapes: trava em páginas com canvas contínuo
    ok2, e2 = rea(["analyze-web-bundle", CDP, tid, "--observation-ms", "3000", "--total-analysis-timeout-ms", "240000"], fb)
    try: cdp(f"/json/close/{tid}")
    except Exception: pass
    if not ok1: print(f"ERRO {pid}: inspect · {e1}")
    if not ok2: print(f"ERRO {pid}: bundle · {e2}")
    insp = carregar(fi) if ok1 else {}; bund = carregar(fb) if ok2 else {}
    r = resumir(pid, url, insp, bund); print(f"OK {pid}: {r['recursos']} recursos, {r['scripts']} scripts, chunks {r['chunks']}"); return r


if __name__ == "__main__":
    alvo = [a for a in sys.argv[1:] if not a.startswith("--")] or list(APPS)
    res = [r for pid in alvo if (r := processar(pid, APPS[pid]))]
    (DOCS / "_indice.json").write_text(json.dumps(res, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"\n{len(res)} apps observados · docs/rea/web/")
