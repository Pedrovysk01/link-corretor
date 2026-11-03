/* Seu Cliente Fiel — primeiro acesso.
   1) CF.setupWizard(): passo a passo logo após o cadastro — nome e cidade → dados do Google Maps (ou preencher à mão)
      → logotipo (foto do Google, ícone do site, iniciais ou arquivo) → cartão (carimbos + recompensa) → pronto.
   2) CF.tour: tutorial rápido entre as telas, destacando onde tocar e o que preencher.
   Abre sozinho só numa conta nova conectada ao servidor (sem clientes nem carimbos). No modo de demonstração, pelo menu do
   usuário ("Configuração inicial" e "Tutorial do painel") ou pelos endereços ?setup=1 e ?tour=1. */
(function () {
  "use strict";
  const CF = window.CF, I = CF.icon, esc = CF.esc;
  const T = (x) => (window.CF_T ? window.CF_T(x) : x);
  const digits = (v) => String(v || "").replace(/\D/g, "");
  const igUrl = (v) => { const s = String(v || "").trim(); if (!s) return ""; if (/^https?:\/\//i.test(s)) return s; const u = s.replace(/^@/, "").replace(/^(www\.)?instagram\.com\//i, "").replace(/[/?#].*$/, ""); return /^[\w.]{1,30}$/.test(u) ? "https://instagram.com/" + u : ""; };
  const isPlaceholder = (n) => !n || /^\[.*\]$/.test(String(n).trim());

  /* ================================================================ assistente de configuração */
  const STEPS = [["biz", "Seu negócio"], ["google", "Google Maps"], ["logo", "Logotipo"], ["card", "Cartão"], ["done", "Pronto"]];
  const TYPES = ["Cafeteria", "Restaurante", "Lanchonete", "Padaria", "Pizzaria", "Sorveteria", "Bar", "Salão de beleza", "Barbearia", "Estética", "Pet shop", "Loja de roupas", "Mercado", "Farmácia", "Academia", "Clínica", "Lava-rápido", "Outro"];
  const REWARDS = { Cafeteria: "1 café grátis", Padaria: "1 café com pão de queijo", Barbearia: "1 corte grátis", "Salão de beleza": "1 escova grátis", Pizzaria: "1 pizza broto grátis", Sorveteria: "1 sorvete grátis", "Lava-rápido": "1 lavagem grátis", "Pet shop": "1 banho grátis" };

  CF.setupWizard = (opts = {}) => {
    if (document.getElementById("wz")) return;
    const s = CF.state, b = s.biz, card = CF.card ? CF.card() : (s.cards || [])[0];
    let city = ""; try { city = localStorage.getItem("clientefiel.city") || ""; } catch (e) {}
    const W = { i: 0, name: isPlaceholder(b.name) ? CF.pendingBizName || "" : b.name, city, type: b.type && !/^\[/.test(b.type) ? b.type : "", gm: null, results: null, ficha: null, addr: isPlaceholder(b.address) ? "" : b.address || "",
      wa: "", ig: "", logo: null, logoKey: "", stamps: card ? card.stamps : 8, reward: card && !isPlaceholder(card.rewardLabel) ? card.rewardLabel : "", seq: 0 };
    const cur = s.pageItems.find((x) => x.type === "contact"); if (cur && cur.url && !/@/.test(cur.url)) W.wa = cur.url;
    const ig = s.pageItems.find((x) => x.type === "social" && /instagram/i.test(x.url || "")); if (ig) W.ig = ig.url;

    const el = document.createElement("div"); el.id = "wz"; el.className = "wz-back"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-labelledby", "wz-title");
    document.body.appendChild(el);
    const $ = (q) => el.querySelector(q), val = (q) => { const x = $(q); return x ? x.value.trim() : ""; };
    const close = () => { el.remove(); document.removeEventListener("keydown", onKey); };
    const onKey = (e) => { if (e.key === "Escape" && !document.querySelector("#overlay-root .overlay")) skipAll(); }; // Esc com o editor de imagem aberto fecha só o editor
    document.addEventListener("keydown", onKey);
    const skipAll = () => { CF.update((st) => (st.onboarding.setup = true)); close(); CF.toast("Tudo bem! Você pode refazer pelo menu do seu perfil › Configuração inicial."); };

    /* ---------- conteúdo de cada passo ---------- */
    const fichaBox = (f) => `<div class="wz-ficha">${f.miniatura ? `<img src="${esc(f.miniatura)}" alt="" referrerpolicy="no-referrer">` : `<span class="wz-ph">${I("brand:googlemaps")}</span>`}
      <div><b>${esc(f.nome || "")}</b>${f.nota != null ? `<small>★ ${String(f.nota).replace(".", ",")} · ${(f.total_avaliacoes || 0).toLocaleString(CF.locale())} ${T("avaliações")}</small>` : ""}
      ${f.endereco ? `<small>${I("pin", "xs")} ${esc(f.endereco)}</small>` : ""}${f.telefone ? `<small>${I("phone", "xs")} ${esc(f.telefone)}</small>` : ""}${f.site ? `<small>${I("link", "xs")} ${esc(String(f.site).replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""))}</small>` : ""}
      <small class="wz-got">${I("check", "xs")} ${T("Fotos")}: ${(f.fotos || []).length} · ${T("Depoimentos")}: ${(f.depoimentos_bons || []).length} · ${T("Horários")}: ${f.horarios ? T("sim") : T("não")}</small></div></div>`;
    const contactFields = () => `<div class="wz-g2"><div class="field"><label for="wz-wa">WhatsApp do negócio</label><input class="input" id="wz-wa" type="tel" inputmode="tel" placeholder="(48) 99999-0000" value="${esc(W.wa)}"></div>
      <div class="field"><label for="wz-ig">Instagram</label><input class="input" id="wz-ig" placeholder="@seunegocio" value="${esc(W.ig)}"></div></div>`;
    const body = {
      biz: () => `<p class="wz-lead">Vamos deixar sua página pronta em 1 minuto. Comece pelo básico:</p>
        <div class="field"><label for="wz-name">Nome do seu negócio</label><input class="input" id="wz-name" placeholder="Ex.: Café da Praça" value="${esc(W.name)}" autocomplete="organization"></div>
        <div class="wz-g2"><div class="field"><label for="wz-city">Cidade</label><input class="input" id="wz-city" placeholder="Ex.: Florianópolis, SC" value="${esc(W.city)}" autocomplete="address-level2"></div>
        <div class="field"><label for="wz-type">Tipo de negócio</label><input class="input" id="wz-type" list="wz-types" placeholder="Ex.: Cafeteria" value="${esc(W.type)}"><datalist id="wz-types">${TYPES.map((t) => `<option value="${esc(t)}">`).join("")}</datalist></div></div>
        <p class="wz-hint">${I("info", "xs")} Com o nome e a cidade, buscamos seu negócio no Google Maps no próximo passo.</p>`,
      google: () => {
        if (W.gm === null) return `<p class="wz-lead">Seu negócio aparece no Google Maps?</p>
          <div class="wz-choice"><button type="button" class="wz-opt" data-gm="yes">${I("brand:googlemaps")}<b>Sim, buscar meus dados</b><small>Endereço, telefone, horários, fotos e as melhores avaliações — automático.</small></button>
          <button type="button" class="wz-opt" data-gm="no">${I("pencil")}<b>Não, vou preencher</b><small>Só endereço, WhatsApp e Instagram. Leva 30 segundos.</small></button></div>`;
        if (W.gm === "no") return `<p class="wz-lead">Preencha o básico. Dá para mudar tudo depois.</p>
          <div class="field"><label for="wz-addr">Endereço</label><input class="input" id="wz-addr" placeholder="Rua, número — bairro" value="${esc(W.addr)}" autocomplete="street-address"></div>${contactFields()}
          <button type="button" class="link-btn wz-sw" data-gm="yes">${I("brand:googlemaps", "xs")} Prefiro buscar no Google Maps</button>`;
        if (W.ficha) return `<p class="wz-lead">Encontramos! Confira se é o seu negócio:</p>${fichaBox(W.ficha)}${contactFields()}
          <button type="button" class="link-btn wz-sw" data-pick="back">${I("chevron-left", "xs")} Não é este — voltar à lista</button>`;
        return `<p class="wz-lead">Escolha o seu negócio na lista:</p>
          <div class="wz-search"><input class="input" id="wz-q" value="${esc(W.name)}" aria-label="Nome do negócio"><button type="button" class="btn" id="wz-go">${I("search", "sm")}Buscar</button></div>
          <div id="wz-res" class="wz-res" aria-live="polite">${resHtml()}</div>
          <details class="wz-link"><summary>Não achou? Cole o link do Google Maps</summary><div class="wz-search"><input class="input" id="wz-url" placeholder="https://maps.app.goo.gl/…" inputmode="url"><button type="button" class="btn" id="wz-url-go">Buscar pelo link</button></div>
            <small class="muted">No Google Maps, abra seu negócio › Compartilhar › Copiar link.</small></details>
          <button type="button" class="link-btn wz-sw" data-gm="no">${I("pencil", "xs")} Não está na lista — vou preencher à mão</button>`;
      },
      logo: () => { const c = logoCands();
        return `<p class="wz-lead">Escolha o logotipo. Ele aparece no cartão e no topo da sua página.</p>
          <div class="wz-logo-now">${W.logo ? `<img src="${esc(W.logo)}" alt="Logotipo escolhido">` : `<span>${esc(CF.initial(W.name || "S"))}</span>`}</div>
          <div class="wz-logos">${c.map((x) => `<button type="button" class="wz-lg ${W.logoKey === x.k ? "on" : ""}" data-lg="${esc(x.k)}" title="${esc(x.t)}">${x.html}<small>${esc(x.t)}</small></button>`).join("")}
            <label class="wz-lg wz-up">${I("upload")}<small>Enviar arquivo</small><input type="file" accept="image/*" id="wz-file" hidden></label></div>
          <p class="wz-hint">${I("info", "xs")} Depois de escolher, você pode ajustar o enquadramento. Prefira imagens quadradas.</p>`; },
      card: () => { const sug = [REWARDS[W.type] || "1 brinde surpresa", "10% de desconto", "1 item grátis"].filter((x, i, a) => a.indexOf(x) === i);
        return `<p class="wz-lead">Agora o seu cartão fidelidade:</p>
          <div class="field"><label>Quantos carimbos para ganhar a recompensa?</label><div class="wz-chips" role="radiogroup">${[5, 6, 8, 10, 12].map((n) => `<button type="button" class="wz-chip ${W.stamps === n ? "on" : ""}" data-st="${n}" role="radio" aria-checked="${W.stamps === n}">${n}</button>`).join("")}</div></div>
          <div class="field"><label for="wz-rw">Qual é a recompensa?</label><input class="input" id="wz-rw" placeholder="Ex.: 1 café grátis" value="${esc(W.reward)}" maxlength="60">
            <div class="wz-chips sm">${sug.map((x) => `<button type="button" class="wz-chip" data-rw="${esc(x)}">${esc(x)}</button>`).join("")}</div></div>
          <div class="wz-stamps" aria-hidden="true">${Array.from({ length: W.stamps }, (_, i) => `<i class="${i === W.stamps - 1 ? "gift" : ""}">${i === W.stamps - 1 ? "🎁" : ""}</i>`).join("")}</div>
          <p class="wz-hint">A cada <b>${W.stamps}</b> carimbos, o cliente ganha: <b>${esc(W.reward || "…")}</b></p>`; },
      done: () => `<div class="wz-done"><div class="wz-logo-now">${W.logo ? `<img src="${esc(W.logo)}" alt="">` : `<span>${esc(CF.initial(W.name || "S"))}</span>`}</div>
          <h3>${esc(W.name || "Seu negócio")} está pronto!</h3>
          <ul>${[[!!W.name, "Nome do negócio"], [!!(W.ficha || W.addr), W.ficha ? "Dados do Google Maps" : "Endereço"], [!!digits(W.wa), "WhatsApp"], [!!igUrl(W.ig), "Instagram"], [!!W.logo, "Logotipo"], [true, `${W.stamps} carimbos = ${W.reward || "recompensa"}`]]
            .map(([ok, t]) => `<li class="${ok ? "ok" : ""}">${I(ok ? "check" : "minus", "sm")}${esc(t)}</li>`).join("")}</ul>
          <p class="wz-hint">Agora um tour rápido mostra onde tocar para dar carimbos, mudar a página e imprimir o QR.</p></div>`,
    };
    const resHtml = () => { if (W.results === "busy") return `<p class="wz-busy">${I("search", "sm")} Procurando no Google Maps…</p>`;
      if (W.results && W.results.err) return `<div class="wz-err">${esc(W.results.err)}${W.results.offline ? `<br><button type="button" class="btn sm" data-gm="no" style="margin-top:8px">Preencher à mão</button>` : ""}</div>`;
      if (!W.results) return ""; if (!W.results.length) return `<p class="muted">Nenhum resultado. Confira o nome e a cidade, ou cole o link abaixo.</p>`;
      return W.results.slice(0, 6).map((r, i) => `<button type="button" class="wz-r" data-pick="${i}">${r.miniatura ? `<img src="${esc(r.miniatura)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : `<span class="wz-ph">${I("pin")}</span>`}<span><b>${esc(r.nome || "")}</b><small>${r.nota != null ? `★ ${String(r.nota).replace(".", ",")} · ` : ""}${esc(r.categoria || "")}</small><small class="muted">${esc(r.endereco || "")}</small></span>${I("chevron-right", "sm")}</button>`).join(""); };
    // candidatos a logotipo: fotos do Google, ícone do site, iniciais
    const monogram = () => { const cv = document.createElement("canvas"); cv.width = cv.height = 512; const g = cv.getContext("2d"), gr = g.createLinearGradient(0, 512, 512, 0);
      [["0", "#D93D1A"], [".36", "#F26716"], [".68", "#F28C0F"], ["1", "#F2BB16"]].forEach(([o, c]) => gr.addColorStop(+o, c)); g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
      const words = String(W.name || "S").replace(/[^\p{L}\p{N} ]/gu, "").trim().split(/\s+/).filter((w) => w.length > 2 || /^\p{N}+$/u.test(w)); const ini = ((words[0] || W.name || "S")[0] + ((words[1] || "")[0] || "")).toUpperCase();
      g.fillStyle = "#0D0D0D"; g.font = `700 ${ini.length > 1 ? 210 : 260}px Montserrat, Arial, sans-serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(ini, 256, 272); return cv.toDataURL("image/png"); };
    let mono = null;
    const logoCands = () => { const out = [], f = W.ficha; mono = mono || monogram();
      out.push({ k: "mono", t: "Iniciais", src: mono, html: `<img src="${mono}" alt="">` });
      if (f) { const photos = [f.miniatura].concat((f.fotos || []).slice(0, 4).map((p) => p.miniatura || p.url)).filter(Boolean);
        photos.forEach((u, i) => out.push({ k: "g" + i, t: i ? "Foto do Google" : "Google Maps", src: u, html: `<img src="${esc(u)}" alt="" loading="lazy" referrerpolicy="no-referrer">` }));
        if (f.site && window.CFBrands) { const u = window.CFBrands.favUrl(f.site, 256); if (u) out.push({ k: "fav", t: "Ícone do site", src: u, html: `<img src="${esc(u)}" alt="" class="wz-fav" referrerpolicy="no-referrer">` }); } }
      return out; };

    /* ---------- desenho ---------- */
    const paint = () => { const k = STEPS[W.i][0], last = W.i === STEPS.length - 1;
      const canNext = k !== "google" || W.gm === "no" || !!W.ficha;
      el.innerHTML = `<div class="wz">
        <div class="wz-top"><img src="assets/img/seucliente-logo.svg" alt="Seu Cliente Fiel" class="wz-brand"><button type="button" class="link-btn" data-wz="skip">Pular configuração</button></div>
        <ol class="wz-steps">${STEPS.map(([kk, t], i) => `<li class="${i < W.i ? "done" : i === W.i ? "on" : ""}"><i>${i < W.i ? I("check", "xs") : i + 1}</i><span>${esc(t)}</span></li>`).join("")}</ol>
        <h2 id="wz-title">${esc(STEPS[W.i][1])}</h2>
        <div class="wz-body">${body[k]()}</div>
        <div class="wz-foot">${W.i ? `<button type="button" class="btn ghost" data-wz="back">${I("chevron-left", "sm")}Voltar</button>` : "<span></span>"}
          ${last ? `<button type="button" class="btn primary lg" data-wz="finish">Abrir meu painel${I("arrow-right", "sm")}</button>`
            : `<button type="button" class="btn primary lg" data-wz="next" ${canNext ? "" : "disabled"}>${k === "google" && W.gm === null ? "Escolha uma opção" : "Continuar"}${canNext ? I("arrow-right", "sm") : ""}</button>`}</div></div>`;
      el.querySelectorAll(".wz-fav").forEach((im) => { im.addEventListener("load", () => { if (im.naturalWidth < 96) im.closest(".wz-lg").remove(); }); im.addEventListener("error", () => im.closest(".wz-lg").remove()); });
      const f = el.querySelector(".wz-body input:not([type=file]):not([readonly])"); if (f && k !== "google") setTimeout(() => f.focus(), 30); };
    const keep = () => { // guarda o que foi digitado antes de redesenhar
      if ($("#wz-name")) W.name = val("#wz-name"); if ($("#wz-city")) W.city = val("#wz-city"); if ($("#wz-type")) W.type = val("#wz-type");
      if ($("#wz-addr")) W.addr = val("#wz-addr"); if ($("#wz-wa")) W.wa = val("#wz-wa"); if ($("#wz-ig")) W.ig = val("#wz-ig"); if ($("#wz-rw")) W.reward = val("#wz-rw"); };
    const search = async (q) => { const my = ++W.seq; W.results = "busy"; paint();
      try { const r = await CF.maps.search([q || W.name, W.city].filter(Boolean).join(" ")); if (my === W.seq) { W.results = r; paint(); } }
      catch (e) { if (my === W.seq) { W.results = { err: e.offline ? "A busca no Google Maps não está disponível agora. Sem problema: preencha à mão (leva 30 segundos)." : e.message || "Falha na busca.", offline: true }; paint(); } } };
    const loadFicha = async (p, viaLink) => { const my = ++W.seq; W.results = "busy"; paint(); const box = $("#wz-res"); if (box) box.innerHTML = `<p class="wz-busy">${I("search", "sm")} Buscando dados, fotos e avaliações…</p>`;
      try { const f = viaLink ? await CF.maps.link(p) : await CF.maps.ficha(p); if (my !== W.seq) return; if (!f) throw new Error("Não encontramos dados nesse link.");
        W.ficha = f; if (!W.wa && f.telefone) W.wa = f.telefone; if (!W.name || isPlaceholder(W.name)) W.name = f.nome || W.name; paint(); }
      catch (e) { if (my === W.seq) { W.results = { err: e.message || "Falha ao buscar a ficha." }; paint(); } } };
    const validate = () => { const k = STEPS[W.i][0];
      if (k === "biz" && W.name.length < 2) { CF.toast("Digite o nome do seu negócio.", "err"); $("#wz-name").focus(); return false; }
      if (k === "google" && W.wa && digits(W.wa).length < 10) { CF.toast("Confira o WhatsApp: DDD + número.", "err"); $("#wz-wa").focus(); return false; }
      if (k === "google" && W.ig && !igUrl(W.ig)) { CF.toast("Instagram: use @seunegocio ou o link do perfil.", "err"); $("#wz-ig").focus(); return false; }
      if (k === "card" && W.reward.length < 2) { CF.toast("Escreva a recompensa (ex.: 1 café grátis).", "err"); $("#wz-rw").focus(); return false; }
      return true; };
    const go = (d) => { keep(); if (d > 0 && !validate()) return; const was = STEPS[W.i][0]; W.i = Math.max(0, Math.min(STEPS.length - 1, W.i + d));
      if (was === "biz" && d > 0) { try { if (W.city) localStorage.setItem("clientefiel.city", W.city); } catch (e) {} }
      if (STEPS[W.i][0] === "logo" && !W.logo) { const c = logoCands(); const g = c.find((x) => x.k === "g0"); W.logoKey = "mono"; W.logo = c[0].src; if (g && W.ficha && W.ficha.miniatura) { W.logoKey = "g0"; W.logo = g.src; } }
      paint(); };
    const pickLogo = async (k) => { const c = logoCands().find((x) => x.k === k); if (!c) return; W.logoKey = k;
      if (/^https?:/i.test(c.src) && CF.adjustImage && CF.IMG) { // foto da internet: recorta no editor (se o site não permitir, usa o endereço)
        try { const d = await CF.adjustImage(c.src, CF.imgPreset(CF.IMG.logo)); if (d) W.logo = d; } catch (e) { W.logo = c.src; } }
      else W.logo = c.src; paint(); };

    /* ---------- eventos ---------- */
    el.addEventListener("click", (e) => { const t = e.target.closest("button, [data-lg]"); if (!t) return;
      const a = t.dataset.wz; if (a === "next") return go(1); if (a === "back") { if (STEPS[W.i][0] === "google" && W.gm !== null) { keep(); W.gm = null; W.ficha = null; W.results = null; return paint(); } return go(-1); }
      if (a === "skip") return skipAll(); if (a === "finish") { keep(); return finish(); }
      if (t.dataset.gm) { keep(); W.gm = t.dataset.gm; W.ficha = null; if (W.gm === "yes") { W.results = null; paint(); return search(); } return paint(); }
      if (t.dataset.pick === "back") { keep(); W.ficha = null; return paint(); }
      if (t.dataset.pick != null && Array.isArray(W.results)) { keep(); return loadFicha(W.results[+t.dataset.pick]); }
      if (t.id === "wz-go") { keep(); return search(val("#wz-q")); }
      if (t.id === "wz-url-go") { const u = val("#wz-url"); if (!/^https?:\/\//i.test(u)) return CF.toast("Cole o link completo do Google Maps.", "err"); keep(); return loadFicha(u, true); }
      if (t.dataset.lg) return pickLogo(t.dataset.lg);
      if (t.dataset.st) { keep(); W.stamps = +t.dataset.st; return paint(); }
      if (t.dataset.rw) { W.reward = t.dataset.rw; keep(); W.reward = t.dataset.rw; return paint(); } });
    el.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.matches("#wz-q")) { e.preventDefault(); keep(); search(val("#wz-q")); }
      else if (e.key === "Enter" && e.target.matches("#wz-url")) { e.preventDefault(); el.querySelector("#wz-url-go").click(); }
      else if (e.key === "Enter" && e.target.matches(".wz-body input")) { e.preventDefault(); go(1); } });
    el.addEventListener("input", (e) => { if (e.target.id === "wz-rw") { W.reward = e.target.value.trim(); const h = el.querySelector(".wz-body .wz-hint:last-child b:last-child"); if (h) h.textContent = W.reward || "…"; } });
    el.addEventListener("change", async (e) => { if (e.target.id !== "wz-file" || !e.target.files[0]) return;
      try { W.logo = await CF.readImageAdjusted(e.target.files[0], 512, 0.85, CF.imgPreset(CF.IMG.logo)); W.logoKey = "file"; paint(); } catch (err) { CF.toast(err.message || "Não foi possível ler a imagem.", "err"); } });

    /* ---------- aplicar ---------- */
    const finish = () => {
      const f = W.ficha, wa = digits(W.wa), ig = igUrl(W.ig);
      CF.update((st) => { const bz = st.biz;
        if (W.name) bz.name = W.name; if (W.type) bz.type = W.type;
        const addr = f ? f.endereco : W.addr; if (addr) bz.address = addr;
        if (W.logo) bz.logo = W.logo;
        if (!bz.cover && f && (f.fotos || [])[0]) bz.cover = f.fotos[0].url || f.fotos[0].miniatura;
        if (wa) { let it = st.pageItems.find((x) => x.type === "contact"); if (!it) { it = { id: CF.uid(), type: "contact", title: "WhatsApp", iconOnly: true, date: new Date().toISOString() }; st.pageItems.unshift(it); } it.url = wa.length <= 11 ? "55" + wa : wa; it.href = ""; }
        if (ig) { let it = st.pageItems.find((x) => x.type === "social" && (!x.url || /instagram/i.test(x.url))); if (!it) { it = { id: CF.uid(), type: "social", title: "Instagram", iconOnly: true, date: new Date().toISOString() }; st.pageItems.push(it); } it.url = ig; }
        const c = CF.card ? CF.card() : st.cards[0]; const cc = c && st.cards.find((x) => x.id === c.id);
        if (cc) { cc.stamps = W.stamps; if (W.reward) cc.rewardLabel = W.reward; if (isPlaceholder(cc.name) && W.name) cc.name = W.name; }
        st.onboarding.setup = true; });
      if (f && CF.saveFicha) CF.saveFicha("main", f);
      close(); CF.go ? CF.go("/") : (location.hash = "#/"); CF.refresh();
      CF.toast("Sua página está pronta!"); setTimeout(() => CF.tour.start(), 700); };
    paint();
  };

  /* ================================================================ tutorial entre as telas */
  // cada passo: tela, o que destacar (o 1º seletor que existir) e o texto
  const TOUR = [
    { r: "/", q: [".dv2-card-panel", ".hero .hero-phone", ".hero"], t: "Este é o seu cartão", d: "É o que o cliente guarda no celular ao ler o seu QR Code. Tudo o que você muda no painel aparece aqui na hora." },
    { r: "/", q: ['#view [data-act="give-stamp"]', "#ql-car"], t: "Dar carimbo", d: "Quando o cliente comprar, toque em “Dar carimbo”, procure pelo nome ou telefone e confirme. Com o cartão cheio, ele ganha a recompensa." },
    { r: "/", q: [".dv2-attention", "#ql-car"], t: "O que pede um olhar hoje", d: "Pedidos de carimbo, recompensas no balcão e clientes sumidos aparecem aqui. Toque em um item para resolver." },
    { r: "/page", q: ['#view [data-act="cover-modal"]'], up: ".card", t: "Foto de capa", d: "Toque aqui para escolher uma foto do seu espaço ou dos seus produtos. Antes de salvar, você ajusta o enquadramento." },
    { r: "/page", q: ["#pg-tag"], up: ".card", t: "Informações do negócio", d: "Preencha a frase de apresentação e o endereço. Logo abaixo, escolha a cor, o degradê ou uma imagem de fundo." },
    { r: "/page", q: ["#pg-list"], up: ".card", t: "Conteúdo da página", d: "WhatsApp, Wi-Fi, Instagram, cardápio… Arraste pela alça ⋮⋮ para mudar a ordem. Para incluir mais, use “Adicionar à página” no menu." },
    { r: "/cards", q: ["#view .card", "#view"], t: "Seu cartão fidelidade", d: "Aqui você muda quantos carimbos valem a recompensa, o texto do prêmio e o visual do cartão." },
    { r: "/customers", q: ["#cu-body"], up: ".card", t: "Seus clientes", d: "Quem lê o QR e entra no cartão aparece aqui sozinho. Use a busca para achar alguém e dar carimbos." },
    { r: "/app", q: ["#pr-info", "#sh-print"], up: ".card", t: "Imprima o seu QR", d: "Baixe o material, imprima e deixe no caixa. Pronto: seus clientes já podem pegar o cartão." },
    { r: "/", q: ["#user-btn", ".user-btn"], t: "Ajuda quando quiser", d: "No seu menu você revê este tutorial, refaz a configuração inicial, troca o idioma e liga o modo escuro." },
  ];
  let tourI = -1, tourEl = null, tourT = null;
  const zoomOf = () => { const p = document.createElement("div"); p.style.cssText = "position:fixed;left:100px;top:0;width:1px;height:1px;visibility:hidden"; document.body.appendChild(p); const z = p.getBoundingClientRect().left / 100 || 1; p.remove(); return z; };
  const findTarget = (st) => { for (const q of st.q) { let n = document.querySelector(q); if (n && st.up && n.closest(st.up)) n = n.closest(st.up); if (n && n.getBoundingClientRect().width) return n; } return null; };
  const waitTarget = (st, ms = 2500) => new Promise((res) => { const t0 = Date.now(); const tick = () => { const n = findTarget(st); if (n || Date.now() - t0 > ms) return res(n); setTimeout(tick, 80); }; tick(); });
  const place = () => { if (!tourEl || tourI < 0) return; const st = TOUR[tourI], n = findTarget(st), z = zoomOf(), hole = tourEl.querySelector(".tour-hole"), pop = tourEl.querySelector(".tour-pop");
    const vw = window.innerWidth / z, vh = window.innerHeight / z;
    const mask = tourEl.querySelector(".tour-mask");
    if (!n) { mask.style.clipPath = "none"; hole.style.cssText = "display:none"; pop.style.cssText = `left:${Math.max(12, vw / 2 - 180)}px;top:${Math.max(12, vh / 2 - 120)}px`; return; }
    const r = n.getBoundingClientRect(), pad = 8, x = r.left / z - pad, y = r.top / z - pad, w = r.width / z + pad * 2, h = Math.min(r.height / z + pad * 2, vh - 24);
    hole.style.cssText = `display:block;left:${x}px;top:${y}px;width:${w}px;height:${h}px`;
    mask.style.clipPath = `polygon(evenodd,0 0,100% 0,100% 100%,0 100%,0 0,${x}px ${y}px,${x}px ${y + h}px,${x + w}px ${y + h}px,${x + w}px ${y}px,${x}px ${y}px)`;
    const pw = Math.min(360, vw - 24), ph = pop.offsetHeight || 190; let px = Math.min(Math.max(12, x), vw - pw - 12), py = y + h + 12;
    if (py + ph > vh - 12) py = y - ph - 12; if (py < 12) { py = Math.min(vh - ph - 12, Math.max(12, y + 12)); px = x + w + 12 + pw < vw ? x + w + 12 : Math.max(12, x - pw - 12); }
    pop.style.cssText = `left:${px}px;top:${py}px;width:${pw}px`; };
  const showStep = async (i) => {
    tourI = i; const st = TOUR[i]; if (!st) return CF.tour.stop(true);
    const want = "#" + st.r; if (location.hash.replace(/\/$/, "") !== want.replace(/\/$/, "") && !(st.r === "/" && (location.hash === "" || location.hash === "#/"))) location.hash = want;
    const n = await waitTarget(st); if (tourI !== i || !tourEl) return;
    if (n) { n.scrollIntoView({ block: "center", behavior: "instant" }); }
    const pop = tourEl.querySelector(".tour-pop"), last = i === TOUR.length - 1;
    pop.innerHTML = `<small class="tour-n">${T("Passo")} ${i + 1} ${T("de")} ${TOUR.length}</small><b id="tour-t">${esc(st.t)}</b><p>${esc(st.d)}</p>
      <div class="tour-dots" aria-hidden="true">${TOUR.map((_, k) => `<i class="${k === i ? "on" : ""}"></i>`).join("")}</div>
      <div class="tour-btns"><button type="button" class="link-btn" data-tour="skip">Pular tutorial</button><span>${i ? `<button type="button" class="btn sm ghost" data-tour="prev">Voltar</button>` : ""}<button type="button" class="btn sm primary" data-tour="next">${last ? "Concluir" : "Próximo"}</button></span></div>`;
    requestAnimationFrame(place); setTimeout(place, 120); pop.querySelector('[data-tour="next"]').focus({ preventScroll: true }); };
  const onTourKey = (e) => { if (!tourEl) return; if (e.key === "Escape") CF.tour.stop(); else if (e.key === "ArrowRight") showStep(tourI + 1); else if (e.key === "ArrowLeft" && tourI > 0) showStep(tourI - 1); };
  CF.tour = {
    start(i = 0) { if (tourEl) CF.tour.stop(); const m = document.getElementById("user-menu"); if (m) m.classList.add("hide");
      tourEl = document.createElement("div"); tourEl.className = "tour"; tourEl.setAttribute("role", "dialog"); tourEl.setAttribute("aria-labelledby", "tour-t");
      tourEl.innerHTML = `<div class="tour-mask"></div><div class="tour-hole"></div><div class="tour-pop" aria-live="polite"></div>`; document.body.appendChild(tourEl);
      tourEl.addEventListener("click", (e) => { const b = e.target.closest("[data-tour]"); if (!b) return; const a = b.dataset.tour; if (a === "skip") CF.tour.stop(); else if (a === "prev") showStep(tourI - 1); else if (tourI === TOUR.length - 1) CF.tour.stop(true); else showStep(tourI + 1); });
      window.addEventListener("resize", place); window.addEventListener("scroll", place, true); document.addEventListener("keydown", onTourKey);
      tourT = setInterval(place, 400); showStep(i); },
    stop(done) { if (!tourEl) return; tourEl.remove(); tourEl = null; tourI = -1; clearInterval(tourT); window.removeEventListener("resize", place); window.removeEventListener("scroll", place, true); document.removeEventListener("keydown", onTourKey);
      CF.update((st) => (st.onboarding.tour = true)); if (done) CF.toast("Tutorial concluído. Bom trabalho!"); },
    active: () => !!tourEl,
  };

  /* ================================================================ quando abrir sozinho */
  CF.actions = CF.actions || {};
  CF.actions["setup-wizard"] = () => { const m = document.getElementById("user-menu"); if (m) m.classList.add("hide"); CF.setupWizard(); };
  CF.actions["tour"] = () => CF.tour.start();
  CF.onboardCheck = () => {
    const s = CF.state, ob = s.onboarding || {}; let q; try { q = new URLSearchParams(location.search); } catch (e) { q = new Map(); }
    if (q.get("setup") === "1") return CF.setupWizard(); if (q.get("tour") === "1") return CF.tour.start();
    if (!CF.online) return; // demonstração local: só pelo menu (não atrapalha os testes)
    const fresh = !(s.totals && s.totals.stamps) && !(s.customers || []).length;
    if (!fresh) return;
    // página preparada pela plataforma (prospecção): já vem com nome, endereço, logo e cartão. O assistente "vamos montar sua página" pediria tudo de novo
    // (e poderia sobrescrever o que foi montado), então ele é pulado; o dono vê a faixa "Sua página está em prévia" com o botão de ativar.
    if (CF.isPreview && CF.isPreview()) { if (ob.tour !== true) CF.tour.start(); return; }
    if (ob.setup !== true) return CF.setupWizard({ auto: true });
    if (ob.tour !== true) CF.tour.start();
  };
  const boot0 = CF.boot; // data.js guarda esta versão e a chama depois de carregar os dados do servidor
  CF.boot = function () { const r = boot0.apply(this, arguments); setTimeout(() => { try { CF.onboardCheck(); } catch (e) { console.error(e); } }, 700); return r; };
})();
