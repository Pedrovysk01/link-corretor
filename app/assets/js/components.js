/* Cliente Fiel — componentes visuais compartilhados */
(function () {
  "use strict";
  const CF = window.CF, I = CF.icon, esc = CF.esc;

  /* ---- carimbo (selo recortado + coração), desenhado em SVG próprio ---- */
  let badgePath = "";
  (function () {
    const pts = [];
    for (let d = 0; d < 360; d += 3) {
      const a = (d * Math.PI) / 180, r = 41 + 3.4 * Math.cos(14 * a);
      pts.push((50 + r * Math.cos(a)).toFixed(1) + " " + (50 + r * Math.sin(a)).toFixed(1));
    }
    badgePath = "M" + pts.join("L") + "Z";
  })();
  CF.stampSvg = (c1 = "#fde68a", c2 = "#fdba74") =>
    `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="${badgePath}" fill="${c1}" stroke="#1f2937" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="50" cy="50" r="27" fill="${c2}" stroke="#1f2937" stroke-width="3"/>
      <path d="M50 62c-9-6-14-10-14-16a7 7 0 0 1 14-2 7 7 0 0 1 14 2c0 6-5 10-14 16z" fill="#fde68a" stroke="#1f2937" stroke-width="3" stroke-linejoin="round"/></svg>`;

  /* ---- banners decorativos (gradientes) ---- */
  CF.banners = [
    "radial-gradient(circle at 20% 30%,#f9a8d4 0 18%,transparent 19%),radial-gradient(circle at 75% 25%,#fbbf24 0 14%,transparent 15%),linear-gradient(135deg,#fb7185,#f472b6)",
    "repeating-linear-gradient(45deg,#fef3c7 0 12px,#fde68a 12px 24px),linear-gradient(#fff,#fff)",
    "radial-gradient(circle at 25% 35%,#60a5fa 0 16%,transparent 17%),radial-gradient(circle at 60% 60%,#f9a8d4 0 16%,transparent 17%),radial-gradient(circle at 85% 30%,#fcd34d 0 14%,transparent 15%),linear-gradient(135deg,#a5b4fc,#93c5fd)",
  ];
  CF.bgs = [
    "linear-gradient(135deg,#3b2417,#7a4a2a)", "linear-gradient(135deg,#1f2937,#4b5563)", "linear-gradient(135deg,#0f766e,#14b8a6)",
    "linear-gradient(135deg,#b45309,#f59e0b)", "linear-gradient(135deg,#fbcfe8,#c7f9cc)", "radial-gradient(circle at 30% 30%,#fcd34d,#92400e)",
    "linear-gradient(135deg,#fda4af,#fdba74)", "linear-gradient(135deg,#7dd3fc,#2dd4bf)", "linear-gradient(135deg,#c4b5fd,#f9a8d4)",
  ];

  /* ---- fundos temáticos (card-themes.js) ---- */
  CF.themes = window.CFThemes;
  // banner = índice dos banners prontos | "theme:<id>" (fundo temático) | valor CSS (imagem enviada)
  CF.bannerHtml = (banner, extra = "") => {
    if (typeof banner === "string" && banner.indexOf("theme:") === 0) return `<div class="wc-banner ${CF.themes.cls(banner.slice(6))}" ${extra}></div>`;
    const bg = typeof banner === "string" ? banner : CF.banners[banner] || CF.banners[0];
    return `<div class="wc-banner" style="background:${bg.replace(/"/g, "&quot;")};background-size:cover;background-position:center" ${extra}></div>`;
  };
  CF.bannerLabel = (banner) => (typeof banner === "string" && banner.indexOf("theme:") === 0 ? "Fundo " + CF.themes.get(banner.slice(6)).name : "Banner personalizado");

  /* ---- cartão da carteira ---------------------------------------------
     opts: { card, filled, header, text, banner(index|"theme:id"|css|null), theme(id: força um fundo), size(px), fluid } */
  CF.walletCard = (o = {}) => {
    const s = CF.state, biz = s.biz, card = o.card || CF.card();
    const total = card.stamps, filled = Math.min(o.filled != null ? o.filled : 0, total);
    const header = o.header != null ? o.header : card.header;
    const text = o.text != null ? o.text : card.rewardText;
    // banner da campanha ocupa o lugar dos carimbos: índice | "ban:n" | "theme:id" | css de imagem enviada
    let bannerCss = "", bannerGlass = null;
    if (o.banner != null && o.banner !== false) {
      const b = o.banner;
      const src = CF.bannerSrc(b);
      if (src) bannerGlass = { src, vars: CF.glassVars(o.bannerFx) };
      else if (typeof b === "string" && b.indexOf("theme:") === 0) bannerCss = CF.themes.stageStyle(b.slice(6), "6em");
      else { const css = CF.bannerCss(b) || CF.banners[0]; bannerCss = `background-image:${css};background-size:cover;background-position:center`; }
    }
    // modelo único (personalizável): formato Compacto (padrão), Painel lateral, Foto de fundo ou Vertical, desenhado por card-premium.js
    if (window.CFPremium) {
      return CFPremium.render({ card, filled, logo: biz.logo, bizName: biz.name, bizType: biz.type, header, text, theme: o.theme, fluid: o.fluid, size: o.size, bannerCss, bannerGlass, banner: o.banner != null && o.banner !== false ? CF.bannerHtml(o.banner, "", o.bannerFx) : "" });
    }
    const theme = o.theme ? CF.themes.get(o.theme) : CF.themes.forCard(card);
    return CFWallet.render({ name: card.name || biz.name, logo: biz.logo, bizType: biz.type, filled, total, header, text, rewardLabel: card.rewardLabel, theme, stampIcon: card.stampIcon, banner: bannerCss, fluid: o.fluid, size: o.size });
  };

  /* ---- controles do efeito "glass" do banner (desfoque, tom, intensidade). d.bannerFx = { blur, tint, amount } ---- */
  CF.glassControls = (fx) => { fx = Object.assign(CF.glassDefault(), fx || {});
    return `<div class="glass-ctl" role="group" aria-label="Efeito glass do banner">
      <div class="field"><label>Desfoque <span class="muted" data-gout="blur">${fx.blur}px</span></label><input type="range" data-g="blur" min="0" max="12" step="1" value="${fx.blur}"></div>
      <div class="field"><label>Intensidade do véu <span class="muted" data-gout="amount">${fx.amount}%</span></label><input type="range" data-g="amount" min="0" max="80" step="5" value="${fx.amount}"></div>
      <div class="field" style="grid-column:1/-1"><label>Tom do véu</label><div class="seg"><button type="button" class="${fx.tint === "dark" ? "on" : ""}" data-gtint="dark">Escuro</button><button type="button" class="${fx.tint === "light" ? "on" : ""}" data-gtint="light">Claro (vidro)</button></div>
        <span class="hint">O véu deixa o texto da campanha legível sobre a foto. Zero = foto pura.</span></div></div>`; };
  // galeria de fotos reais para banner: grupos (gerais + datas comemorativas), miniaturas leves
  CF.bannerGallery = (cur) => { const G = CF.bannerPhotoGroups();
    return Object.keys(G).map((g) => `<div class="theme-group">${esc(g)}</div><div class="ban-grid">${G[g].map((p) => `<button type="button" class="banner ${cur === p.key ? "on" : ""}" data-bkey="${esc(p.key)}" style="background-image:url(&quot;${esc(p.thumb)}&quot;)" aria-label="${esc(p.name)}" aria-pressed="${cur === p.key}"><span class="bn">${esc(p.name)}</span></button>`).join("")}</div>`).join(""); };
  // liga os controles num container: lê/escreve d.bannerFx e chama onChange()
  CF.bindGlass = (root, d, onChange) => {
    root.addEventListener("input", (e) => { const k = e.target.dataset && e.target.dataset.g; if (!k) return; d.bannerFx = Object.assign(CF.glassDefault(), d.bannerFx || {}); d.bannerFx[k] = +e.target.value; const o = root.querySelector(`[data-gout="${k}"]`); if (o) o.textContent = e.target.value + (k === "blur" ? "px" : "%"); onChange(); });
    root.addEventListener("click", (e) => { const t = e.target.closest("[data-gtint]"); if (!t) return; d.bannerFx = Object.assign(CF.glassDefault(), d.bannerFx || {}); d.bannerFx.tint = t.dataset.gtint; t.parentElement.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b === t)); onChange(); });
  };

  /* ---- notificação de tela de bloqueio ---- */
  CF.notification = (text, id = "") =>
    `<div class="notif-wrap"><div class="clock" ${id ? `id="${id}-clock"` : ""}>${CF.nowTime()}</div>
      <div class="notif"><img src="${esc(CF.state.biz.logo)}" alt="">
        <div style="min-width:0"><div class="n-top"><b>${esc(CF.state.biz.name)}</b><small>agora</small></div>
        <p ${id ? `id="${id}"` : ""}>${esc(text)}</p></div></div></div>`;

  /* ---- mockup de aparelho (frente, fundo transparente) ----
     CF.device(innerHtml, { model: "iphone"|"android"|"iphone-notch", color: "black"|"titanium"|"white"|"blue"|"pink"|"green", width: 300, status: true, darkStatus: false, time: "9:41" }) */
  // PNGs transparentes da WebMobileFirst (uso comercial livre). l/t/w/h/r = área vazada da tela, medida em px no PNG.
  CF.deviceSpecs = {
    "iphone-15-pro": { label: "iPhone 15 Pro", src: "assets/img/devices/apple-iphone-15-pro-2023.png", W: 391, H: 800, l: 19, t: 15, w: 354, h: 770, r: 46 },
    "iphone-17-pro": { label: "iPhone 17 Pro", src: "assets/img/devices/apple-iphone-17-pro-2025.png", W: 389, H: 800, l: 17, t: 14, w: 356, h: 772, r: 52 },
    "pixel-8": { label: "Google Pixel 8", src: "assets/img/devices/google-pixel-8-2024.png", W: 380, H: 800, l: 17, t: 17, w: 342, h: 762, r: 28 },
    "galaxy-s24": { label: "Samsung Galaxy S24", src: "assets/img/devices/samsung-galaxy-s24-2024.png", W: 386, H: 800, l: 14, t: 15, w: 356, h: 771, r: 27 },
  };
  CF.deviceModels = Object.fromEntries(Object.entries(CF.deviceSpecs).map(([k, v]) => [k, v.label]));
  CF.device = (inner, o = {}) => {
    const key = CF.deviceSpecs[o.model] ? o.model : "iphone-15-pro", d = CF.deviceSpecs[key], width = o.width || 300;
    const pct = (a, b) => ((a / b) * 100).toFixed(3) + "%";
    const status = o.status === false ? "" : `<div class="dev-status"><span>${esc(o.time || "9:41")}</span><span class="sig"><i></i><i></i><i class="bat"></i></span></div>`;
    return `<div class="device-png ${o.darkStatus ? "dark-status" : ""} ${o.cls || ""}" style="--dw:${width}px;--dz:${(d.w / d.W * width / 390).toFixed(4)};width:${width}px;aspect-ratio:${d.W}/${d.H}" role="img" aria-label="${esc(d.label)}">
      <div class="dp-screen" style="left:${pct(d.l, d.W)};top:${pct(d.t, d.H)};width:${pct(d.w, d.W)};height:${pct(d.h, d.H)};border-radius:${pct(d.r, d.w)} / ${pct(d.r, d.h)}">${inner}${status}</div>
      <img class="dp-frame" src="${d.src}" alt="" draggable="false"></div>`;
  };

  /* ---- celular com a página pública ---- */
  CF.phonePage = (o = {}) => {
    const b = o.biz || CF.state.biz; // o.biz permite pré-visualizar um rascunho sem tocar no estado
    const items = o.items || (CF.pageBlocks ? CF.pageBlocks() : null) || [
      `<div class="blk"><span class="mini">Cliente<br>Fiel</span><div><b>Peça nosso cartão fidelidade</b><small>Junte carimbos e ganhe recompensas grátis</small></div></div>`,
      `<div class="blk"><span class="ico-tile gray" style="width:30px;height:30px">${I("wifi", "sm")}</span><div><small>Wi-Fi</small><b>rede de wifi</b></div></div>`,
    ];
    const screen = `<div class="phone-page ${b.cover ? "has-cover" : ""}" style="--page-bg:${esc(CF.pageBgCss(b))}"><div class="screen pubk" data-icon-style="${esc((b.pageBg||{}).iconStyle||'classic')}" data-box-style="${esc(window.CFPub ? CFPub.boxStyleOf((b.pageBg||{}).boxStyle) : 'classic')}">
      ${b.cover ? `<div class="cover" style="background-image:${CF.cssUrl(b.cover)}"></div>` : ""}
      <img class="logo" src="${esc(b.logo)}" alt="">
      <h4>${esc(b.name)}</h4><p class="sub">${esc(b.tagline)}</p>
      <p class="addr">${I("pin")}${esc(b.address)}</p>
      ${items.join("")}${o.watermark === false ? "" : CF.watermark()}</div></div>`;
    if (o.bare) return screen;
    return CF.device(screen, { model: o.model || (CF.state.preview && CF.state.preview.model), width: o.width || (o.tall ? 260 : 240) });
  };

  /* ---- QR (qrcode-generator, MIT) ---- */
  CF.qrMatrix = (text) => {
    const qr = window.qrcode(0, "M"); qr.addData(text); qr.make();
    const n = qr.getModuleCount(), m = [];
    for (let r = 0; r < n; r++) { m.push([]); for (let c = 0; c < n; c++) m[r].push(qr.isDark(r, c)); }
    return m;
  };
  CF.qrSvg = (text, size = 160, fg = "#101828") => {
    const m = CF.qrMatrix(text), n = m.length, q = 2;
    let d = "";
    m.forEach((row, r) => row.forEach((on, c) => { if (on) d += `M${c + q} ${r + q}h1v1h-1z`; }));
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${n + q * 2} ${n + q * 2}" shape-rendering="crispEdges" role="img" aria-label="QR code"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="${fg}"/></svg>`;
  };

  /* ---- pequenos blocos de UI reutilizados ---- */
  CF.proPill = (label = "PRO", kind = "") => `<span class="pill ${kind}">${I("crown")}${label}</span>`;
  CF.copyField = (value) =>
    `<div class="share-link">${I("link", "sm")}<span class="u">${esc(value)}</span>
      <button class="link-btn" data-act="copy-link" style="display:flex;gap:6px;align-items:center">${I("copy", "sm")}Copiar link</button></div>`;
  CF.stars = (n, max = 5) => `<span class="stars">${Array.from({ length: max }, (_, i) => I("star", "sm" + (i < n ? "" : " off"))).join("")}</span>`;

  CF.actions["copy-link"] = async () => {
    const ok = await CF.copy(CF.publicUrl("link")); // marcado: em Visitantes conta como "Link"
    CF.toast(ok ? "Link copiado!" : "Não foi possível copiar.", ok ? "ok" : "err");
    if (ok) CF.update((s) => (s.onboarding.shared = true));
  };
})();

/* ---- CF.sortable: reordenar filhos por arrastar (HTML5 DnD, horizontal ou vertical) ----
   CF.sortable(container, itemSel, onDone(idsOrdenados)); cada item precisa de draggable="true" e data-key. */
(function () {
  const CF = window.CF;
  CF.sortable = (root, sel, onDone, o = {}) => {
    let drag = null;
    root.addEventListener("dragstart", (e) => { const it = e.target.closest(sel); if (!it || !root.contains(it)) return; if (o.handle && !e.target.closest(o.handle) && !it.matches(o.handle)) { if (!e.target.closest(o.handle)) { /* alça obrigatória */ } }
      if (e.target.matches("input,textarea,select")) return; drag = it; it.classList.add("dragging"); e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("text/plain", it.dataset.key || ""); } catch (_) {} e.stopPropagation(); });
    root.addEventListener("dragover", (e) => { if (!drag) return; const over = e.target.closest(sel); if (!over || over === drag || over.parentElement !== drag.parentElement) return; e.preventDefault(); e.stopPropagation();
      const r = over.getBoundingClientRect(), horiz = r.width < r.height * 3 && over.parentElement.getBoundingClientRect().width > r.width * 1.5;
      const after = horiz ? (e.clientX > r.left + r.width / 2) : (e.clientY > r.top + r.height / 2); over.parentElement.insertBefore(drag, after ? over.nextSibling : over); });
    root.addEventListener("dragend", () => { if (!drag) return; const parent = drag.parentElement; drag.classList.remove("dragging"); drag = null; onDone([...parent.querySelectorAll(":scope > " + sel)].map((x) => x.dataset.key), parent); });
  };
})();
