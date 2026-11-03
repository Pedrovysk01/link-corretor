"""Ajuda dos testes das funções (Edge Functions) no Supabase LOCAL: sobe `npx supabase functions serve` com variáveis de
teste e derruba tudo no fim (no Windows, terminate() não mata o supabase.exe nem o container — por isso kill_tree e docker rm).
"""
import json, os, pathlib, re, shutil, subprocess, sys, tempfile, threading, time, urllib.request, urllib.error

ROOT = pathlib.Path(__file__).resolve().parent.parent


def supa_env():
    out = subprocess.run([shutil.which("npx") or "npx", "-y", "supabase", "status", "-o", "env"], cwd=ROOT, capture_output=True, text=True, shell=(os.name == "nt")).stdout
    k = {}
    for line in out.splitlines():
        if "=" in line: a, b = line.split("=", 1); k[a] = b.strip().strip('"')
    if not k.get("API_URL"): sys.exit("Supabase local desligado (npx supabase start).")
    return k


def project_id():
    """project_id do supabase/config.toml: os containers deste projeto se chamam supabase_<serviço>_<project_id>
    (no computador há outros projetos Supabase, ex.: EvenNet e Hori, que os testes NÃO podem tocar)."""
    try: return re.search(r'^project_id\s*=\s*"([^"]+)"', (ROOT / "supabase" / "config.toml").read_text(encoding="utf-8"), re.M).group(1)
    except Exception: return "cliente-fiel"


def host_ip():
    """IPv4 com que os containers enxergam este computador (o nome host.docker.internal também tem um IPv6 sem rota)."""
    try:
        db = "supabase_db_" + project_id()
        ip = subprocess.run(["docker", "exec", db, "getent", "ahostsv4", "host.docker.internal"], capture_output=True, text=True, timeout=20).stdout.split()
        if db and ip and re.match(r"^\d+\.\d+\.\d+\.\d+$", ip[0]): return ip[0]
    except Exception: pass
    return "host.docker.internal"


def stop_serves():
    """Derruba só os "functions serve" que os testes subiram (arquivo de variáveis em cf-fn-*/cf-wallet-*) e o container de
    funções DESTE projeto. Servidores de outros projetos (EvenNet, Hori…) ficam como estão."""
    if os.name == "nt":
        ps = "Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine -match 'functions serve' -and $_.CommandLine -match 'npx-cli' -and $_.CommandLine -match 'cf-(fn|wallet)-' } | ForEach-Object { taskkill /PID $_.ProcessId /T /F | Out-Null }"
        subprocess.run(["powershell", "-NoProfile", "-Command", ps], capture_output=True, timeout=60)
    else:
        subprocess.run(["pkill", "-f", "functions serve --env-file .*cf-(fn|wallet)-"], capture_output=True)
    time.sleep(2)
    try:
        for n in subprocess.run(["docker", "ps", "-a", "--format", "{{.Names}}"], capture_output=True, text=True, timeout=20).stdout.split():
            if n == "supabase_edge_runtime_" + project_id(): subprocess.run(["docker", "rm", "-f", n], capture_output=True, timeout=60)
    except Exception: pass


def kill_tree(p):
    if os.name == "nt": subprocess.run(["taskkill", "/PID", str(p.pid), "/T", "/F"], capture_output=True)
    else: p.terminate()
    try: p.wait(timeout=20)
    except Exception: p.kill()


def start_serve(env: dict, ready_url: str, ready=lambda st, body: st in (200, 405), secs=180):
    """Sobe as funções com as variáveis `env` (valores numa linha; aspas simples = literal) e espera ready_url responder."""
    stop_serves()
    tmp = pathlib.Path(tempfile.mkdtemp(prefix="cf-fn-"))
    (tmp / "fn.env").write_text("".join(f"{a}='{b}'\n" for a, b in env.items()), encoding="utf-8")
    proc = subprocess.Popen([shutil.which("npx") or "npx", "-y", "supabase", "functions", "serve", "--env-file", str(tmp / "fn.env")], cwd=ROOT,
                            stdout=subprocess.PIPE, stderr=subprocess.STDOUT, shell=(os.name == "nt"))
    log = []
    threading.Thread(target=lambda: [log.append(l.decode("utf-8", "replace").rstrip()) for l in iter(proc.stdout.readline, b"")], daemon=True).start()
    t0 = time.time()
    while time.time() - t0 < secs:
        time.sleep(2)
        try:
            with urllib.request.urlopen(urllib.request.Request(ready_url, method="GET"), timeout=10) as r: st, body = r.status, r.read()
        except urllib.error.HTTPError as e: st, body = e.code, e.read()
        except Exception: continue
        if ready(st, body): return proc, log, tmp
    return proc, log, tmp
