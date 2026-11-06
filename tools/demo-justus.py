"""Dados de demonstração do painel Justus: 20 corretores com foto e 3 a 6 clientes cada, no Villa Montemerano.

Uso:  python tools/demo-justus.py            -> cria (faz cópia do banco antes em dados/link-corretor.antes-demo.db)
      python tools/demo-justus.py --remover  -> apaga tudo que tiver demo=1 (corretores, links, clientes, cliques, aberturas, perguntas)

Tudo fica marcado com users.demo=1, então "Remover dados de exemplo" do servidor também limpa.
Senha de todos os corretores de demonstração: corretor123
Fotos: retratos de demonstração do randomuser.me (128 px), guardados no banco como data URL.
"""
import base64, importlib.util, pathlib, random, secrets, sqlite3, sys, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("ls", ROOT / "tools" / "link-server.py")
ls = importlib.util.module_from_spec(spec); spec.loader.exec_module(ls)

CORRETORES = [  # (nome, gênero da foto, índice do retrato)
    ("Marina Souza", "women", 12), ("Rafael Lima", "men", 32), ("Camila Duarte", "women", 44), ("Gustavo Bittencourt", "men", 11),
    ("Fernanda Kruger", "women", 65), ("Leonardo Schmitt", "men", 52), ("Juliana Castro", "women", 21), ("Ricardo Vieira", "men", 75),
    ("Patrícia Moura", "women", 79), ("Thiago Hoffmann", "men", 46), ("Aline Becker", "women", 33), ("Eduardo Ramos", "men", 64),
    ("Bruna Cardoso", "women", 57), ("Felipe Andrade", "men", 22), ("Larissa Zimmermann", "women", 90), ("Marcelo Teixeira", "men", 85),
    ("Renata Fontes", "women", 26), ("Diego Martins", "men", 40), ("Vanessa Lacerda", "women", 50), ("André Wolff", "men", 15),
]
PRENOMES = ["Helena", "Carlos", "Juliana", "Bruno", "Patrícia", "Fernando", "Letícia", "Gustavo", "Aline", "Rodrigo", "Beatriz", "Thiago", "Vanessa", "Eduardo",
            "Larissa", "Marcelo", "Renata", "Paulo", "Ana Clara", "Diego", "Mariana", "Lucas", "Isabela", "Henrique", "Carolina", "Otávio", "Natália", "Vinícius",
            "Luana", "Priscila", "Gabriel", "Tatiane", "Caio", "Sofia", "Murilo", "Daniela", "Pedro", "Yasmin", "Amanda", "Roberto"]
SOBRENOMES = ["Ribeiro", "Fonseca", "Castro", "Andrade", "Moraes", "Tavares", "Pinto", "Siqueira", "Brito", "Rocha", "Machado", "Sales", "Nogueira", "Amaral",
              "Cunha", "Xavier", "Prado", "Monteiro", "Figueiredo", "Bastos", "Campos", "Queiroz", "Lins", "Correia", "Barros", "Carvalho", "Weber", "Kuhn"]
MENSAGENS = ["", "", "", "Quero visitar o decorado no sábado.", "Tem unidade de frente para o mar?", "Pode me ligar depois das 18h?",
             "Qual o valor da entrada?", "Aceita imóvel como parte do pagamento?", "Gostaria da tabela atualizada."]
NOTAS = ["", "", "Prefere WhatsApp.", "Investidor, já tem 2 imóveis em Porto Belo.", "Casal com 2 filhos, quer andar alto.", "Visitou o decorado.", "Aguardando simulação do banco."]
STATUS_PESO = ["novo"] * 4 + ["contatado"] * 4 + ["visita"] * 3 + ["proposta"] * 2 + ["fechado"] * 2 + ["perdido"]


def sem_acento(s):
    import unicodedata
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn").lower()


def foto(genero, i):
    url = f"https://randomuser.me/api/portraits/{genero}/{i}.jpg"
    with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "link-corretor-demo"}), timeout=20) as r:
        return "data:image/jpeg;base64," + base64.b64encode(r.read()).decode()


def remover():
    n = ls.q("SELECT COUNT(*) n FROM users WHERE demo=1", one=True)["n"]
    for b in [r["id"] for r in ls.q("SELECT id FROM users WHERE demo=1")]:
        lids = [r["id"] for r in ls.q("SELECT id FROM links WHERE broker_id=?", (b,))]
        for lid in lids: ls.run("DELETE FROM ai_questions WHERE link_id=?", (lid,)); ls.run("DELETE FROM clicks WHERE link_id=?", (lid,))
        ls.run("DELETE FROM visitors WHERE broker_id=?", (b,)); ls.run("DELETE FROM opens WHERE broker_id=?", (b,))
        ls.run("DELETE FROM links WHERE broker_id=?", (b,)); ls.run("DELETE FROM sessions WHERE user_id=?", (b,)); ls.run("DELETE FROM users WHERE id=?", (b,))
    print(f"removidos {n} corretores de demonstração e tudo ligado a eles")


def criar():
    bk = ls.DB_PATH.with_name("link-corretor.antes-demo.db")
    src = sqlite3.connect(ls.DB_PATH); dst = sqlite3.connect(bk); src.backup(dst); dst.close(); src.close()
    print("cópia do banco:", bk)
    prop = ls.q("SELECT id FROM properties WHERE active=1 AND name LIKE '%Montemerano%'", one=True) or ls.q("SELECT id FROM properties WHERE active=1", one=True)
    if not prop: sys.exit("nenhum empreendimento ativo")
    pid = prop["id"]
    rnd = random.Random(2026)
    salt, h = ls.hash_pw("corretor123")
    usados = {r["name"] for r in ls.q("SELECT name FROM visitors")}
    tot_c = tot_b = 0
    for k, (nome, gen, idx) in enumerate(CORRETORES):
        email = sem_acento(nome).replace(" ", ".") + "@justus.imb.br"
        if ls.q("SELECT 1 FROM users WHERE email=?", (email,), one=True): print("já existe:", email); continue
        try: ph = foto(gen, idx)
        except Exception as e: print("sem foto para", nome, e); ph = ""
        fone = "5547" + str(rnd.randint(991000000, 999899999))
        b = ls.run("INSERT INTO users(role,name,email,phone,pw_salt,pw_hash,demo,photo,created) VALUES('broker',?,?,?,?,?,1,?,datetime('now',?))",
                   (nome, email, fone, salt, h, ph, f"-{rnd.randint(35, 120)} days"))
        tot_b += 1
        desempenho = rnd.uniform(.5, 2.2)  # uns corretores puxam mais que outros (ranking variado)
        links = []
        for canal in ["whatsapp"] + rnd.sample(["instagram", "qr", "email", "site"], rnd.choice([1, 2])):
            lid = ls.run("INSERT INTO links(code,broker_id,property_id,channel,created) VALUES(?,?,?,?,datetime('now',?))", (ls.novo_codigo(), b, pid, canal, f"-{rnd.randint(30, 60)} days"))
            links.append(lid)
            for _ in range(int(rnd.randint(6, 18) * desempenho)):
                ls.run("INSERT INTO clicks(link_id,ts,device,visitor) VALUES(?,datetime('now',?,?),?,?)",
                       (lid, f"-{rnd.randint(0, 29)} days", f"-{rnd.randint(0, 600)} minutes", rnd.choice(["celular", "celular", "celular", "computador"]), secrets.token_hex(6)))
        for _ in range(3 + int(rnd.random() * 2 * desempenho)):
            for _t in range(80):
                cn = f"{rnd.choice(PRENOMES)} {rnd.choice(SOBRENOMES)}"
                if cn not in usados: break
            usados.add(cn)
            cf = "5547" + str(rnd.randint(988000000, 999999999))
            lid = rnd.choice(links); dias = rnd.randint(0, 28)
            vid = ls.run("INSERT INTO visitors(broker_id,first_link_id,property_id,name,phone,email,identity,token_hash,status,notes,message,created) "
                         "VALUES(?,?,?,?,?,?,?,?,?,?,?,datetime('now',?,?))",
                         (b, lid, pid, cn, cf, sem_acento(cn).replace(" ", ".") + rnd.choice(["@gmail.com", "@hotmail.com", "@outlook.com"]), "tel:" + cf,
                          ls.tok_hash(secrets.token_urlsafe(16)), rnd.choice(STATUS_PESO), rnd.choice(NOTAS), rnd.choice(MENSAGENS), f"-{dias} days", f"-{rnd.randint(0, 900)} minutes"))
            tot_c += 1
            for _o in range(rnd.choice([1, 1, 2, 3, 4, 6])):
                d = rnd.randint(0, dias)
                ls.run("INSERT INTO opens(visitor_id,link_id,broker_id,property_id,ts,last_seen,device) VALUES(?,?,?,?,datetime('now',?,?),datetime('now',?,?,?),?)",
                       (vid, lid, b, pid, f"-{d} days", f"-{rnd.randint(0, 600)} minutes", f"-{d} days", f"-{rnd.randint(0, 600)} minutes", f"+{rnd.randint(3, 18)} minutes",
                        rnd.choice(["celular", "celular", "computador"])))
            if rnd.random() < .55:
                d = rnd.randint(0, dias)
                for i, (pq, rp) in enumerate(rnd.choice(ls.CONVERSAS_EXEMPLO)):
                    ls.run("INSERT INTO ai_questions(link_id,property_id,visitor_id,ts,question,answer) VALUES(?,?,?,datetime('now',?,?),?,?)", (lid, pid, vid, f"-{d} days", f"+{i * 2} minutes", pq, rp))
        print(f"{nome:22} {'com foto' if ph else 'SEM FOTO'}")
    print(f"\n{tot_b} corretores, {tot_c} clientes no empreendimento {pid}. Senha dos corretores: corretor123")


if __name__ == "__main__":
    remover() if "--remover" in sys.argv else criar()
