/* Tinta automática — garante contraste de leitura do texto sobre QUALQUER fundo (modo escuro, fundo da página escolhido pelo dono, versão original e v2).
   Para cada texto visível: calcula o fundo real por trás dele (cor sólida, camadas translúcidas e cada parada de um degradê). Se o contraste (WCAG)
   ficar abaixo de 4,5:1 (3:1 em texto grande), troca a cor da fonte: clareia ou escurece a MESMA cor (o laranja da marca continua laranja) até passar
   e, se não bastar, usa quase-branco ou quase-preto. Não mexe em texto sobre foto (fundo com url()) nem em cartões, selos e artes que têm contraste
   próprio (.pc, .wk, ...). Refaz sozinho quando a tela muda, quando o modo claro/escuro troca e quando o fundo é editado.
   API: CF_AUTOINK.run() agenda uma passada; CF_AUTOINK.now() roda na hora (os testes usam). Desligar numa tela: <body data-autoink="off">. */
(function () {
  "use strict";
  if (window.CF_AUTOINK) return;
  const SKIP = ".pubk[data-box-style=\"smoke\"] :is(.box,.blk),.pubk[data-box-style=\"liquid\"] :is(.box,.blk),.pubk[data-box-style=\"amber\"] :is(.box,.blk),.pc,.wk,.vc-card,.wp-pass,.pm-tp,.hc-track,.adj-stage,.adj-dev,.banner,.ban-grid,.theme-row,.bg-grid,.cf-wm,.gdot,.qp-flag,[disabled],.sr-only,.reel-hit,.idea-hint,.dev-status,svg,canvas,[data-autoink='off']";
  const NEED_TEXT = 4.6, NEED_LARGE = 3.1;   // um pouco acima de 4,5 / 3 para sobrar margem nas arredondadas
  const rgb = (s) => { const m = String(s).match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[,/]\s*|\s+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const chan = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const lum = (c) => 0.2126 * chan(c.r) + 0.7152 * chan(c.g) + 0.0722 * chan(c.b);
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const over = (top, bot) => { const a = top.a + bot.a * (1 - top.a); return a ? { r: (top.r * top.a + bot.r * bot.a * (1 - top.a)) / a, g: (top.g * top.a + bot.g * bot.a * (1 - top.a)) / a, b: (top.b * top.a + bot.b * bot.a * (1 - top.a)) / a, a } : { r: 0, g: 0, b: 0, a: 0 }; };
  const hex = (m) => ({ r: parseInt(m.slice(1, 3), 16), g: parseInt(m.slice(3, 5), 16), b: parseInt(m.slice(5, 7), 16), a: 1 });

  // fundos possíveis atrás de um elemento (várias cores se houver degradê); null quando há foto (não dá para medir)
  const bgsOf = (el) => {
    const layers = [];
    for (let e = el; e; e = e.parentElement) {
      const cs = getComputedStyle(e), img = cs.backgroundImage, c = rgb(cs.backgroundColor);
      if (img && img.includes("url(")) return null;
      const stops = img && img.includes("gradient") ? [...img.matchAll(/rgba?\([^)]+\)|#[0-9a-f]{6}\b/gi)].map((m) => (m[0][0] === "#" ? hex(m[0]) : rgb(m[0]))).filter(Boolean) : null;
      if (stops && stops.length) { layers.push({ stops }); if (stops.every((x) => x.a > 0.97)) break; }
      if (c && c.a > 0) { layers.push({ c }); if (c.a > 0.97) break; }
    }
    let variants = [{ r: 255, g: 255, b: 255, a: 1 }];
    const solid = layers.some((l) => (l.c && l.c.a > 0.97) || (l.stops && l.stops.every((x) => x.a > 0.97)));
    if (!solid) {
      const rootBg = rgb(getComputedStyle(document.documentElement).backgroundColor), bodyBg = rgb(getComputedStyle(document.body).backgroundColor), white = { r: 255, g: 255, b: 255, a: 1 };
      variants = [over(bodyBg && bodyBg.a ? bodyBg : { r: 255, g: 255, b: 255, a: 0 }, rootBg && rootBg.a ? over(rootBg, white) : white)];
    }
    for (let i = layers.length - 1; i >= 0; i--) { const l = layers[i]; variants = l.stops ? variants.flatMap((v) => l.stops.map((st) => over(st, v))) : variants.map((v) => over(l.c, v)); }
    return variants;
  };

  const toHsl = (c) => { const r = c.r / 255, g = c.g / 255, b = c.b / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0;
    if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; } return { h, s, l }; };
  const fromHsl = (h, s, l) => { const f = (p, q, t) => { if (t < 0) t += 1; if (t > 1) t -= 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
    if (!s) return { r: l * 255, g: l * 255, b: l * 255, a: 1 }; const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q; return { r: f(p, q, h + 1 / 3) * 255, g: f(p, q, h) * 255, b: f(p, q, h - 1 / 3) * 255, a: 1 }; };
  const worst = (c, bgs) => Math.min(...bgs.map((b) => ratio(c, b)));
  const css = (c) => `rgb(${Math.round(c.r)},${Math.round(c.g)},${Math.round(c.b)})`;

  // nova cor: tinta neutra (cinza/preto/azul-ardósia do texto comum) vira cinza-claro/quase-preto neutro; cor de marca (laranja, vermelho…) mantém a MESMA matiz,
  // mais clara (fundo escuro) ou mais escura (fundo claro), até passar; se não bastar, quase-branco / quase-preto
  const better = (fg, bgs, need) => {
    const meanL = bgs.reduce((s, b) => s + lum(b), 0) / bgs.length, hsl = toHsl(fg), dir = meanL < 0.4 ? 1 : -1, neutral = hsl.s < 0.6;
    const light = { r: 248, g: 250, b: 252, a: 1 }, dark = { r: 16, g: 24, b: 40, a: 1 };
    if (neutral) { const base = dir > 0 ? light : dark; if (worst(base, bgs) >= need) { if (hsl.l > 0.2 && hsl.l < 0.8) { /* cinza médio: degrada do quase-extremo para o cinza original */ for (let k = 0; k <= 12; k++) { const l = dir > 0 ? 0.98 - k * 0.03 : 0.1 + k * 0.03, c = fromHsl(hsl.h, Math.min(hsl.s, 0.15), l); if (worst(c, bgs) < need) break; var keep = c; } return keep || base; } return base; } }
    for (let k = 1; k <= 32; k++) { const l = Math.min(0.98, Math.max(0.04, hsl.l + dir * k * 0.03)), c = fromHsl(hsl.h, neutral ? Math.min(hsl.s, 0.15) : hsl.s * (dir > 0 && l > 0.85 ? 0.6 : 1), l); if (worst(c, bgs) >= need) return c; if (l >= 0.98 || l <= 0.04) break; }
    return worst(light, bgs) >= worst(dark, bgs) ? light : dark;
  };

  const restore = () => document.querySelectorAll("[data-ink]").forEach((el) => { const o = el.getAttribute("data-ink-o"); if (o) el.style.color = o; else el.style.removeProperty("color"); el.removeAttribute("data-ink"); el.removeAttribute("data-ink-o"); });

  /* Superfície automática (só no modo escuro): caixas, faixas e fundos que o CSS pinta de branco/creme (comum no v2) viram a superfície escura
     equivalente — branco → caixa escura, creme/amarelo-claro → escuro com o mesmo tom, borda clara → borda clara translúcida. Não mexe no que mostra
     o resultado para o cliente (celulares de prévia, cartões, artes, QR, amostras de cor, fotos). */
  const NO_SURF = ".device-png,.pc,.wk,.vc-card,.wp-pass,.sv2-wallet-screen,.dv2-card-preview,.pm-tp,.paper,.pr-presentation,.pr-mockup-stack,.qrb,.qr,[class*='qr-'],.swatch,.bg-sw,.theme-sw,.gdot,.pm-color,.pm-pal,.chip.swatch,.banner,.ban-grid,.theme-row,.cf-wm,.sh-stock-img,.style-btn canvas,[data-autoink='off'],svg,img,video,canvas,input[type=color],.toggle,.reel";
  const dark = () => document.documentElement.getAttribute("data-mode") === "dark";
  const surfOf = (c) => { const h = toHsl(c); const l = 0.1 + (1 - h.l) * 0.38; return fromHsl(h.h, h.s < 0.2 ? Math.min(h.s, 0.06) : Math.min(h.s, 0.32), l); };
  const isLight = (c) => c && c.a > 0.5 && toHsl(c).l >= 0.88;
  const restoreSurf = () => document.querySelectorAll("[data-surf]").forEach((el) => { const o = JSON.parse(el.getAttribute("data-surf") || "{}"); ["background-color", "background-image", "border-color"].forEach((k) => { if (o[k]) el.style.setProperty(k, o[k][0], o[k][1]); else el.style.removeProperty(k); }); el.removeAttribute("data-surf"); el.removeAttribute("data-surf-before"); el.removeAttribute("data-surf-after"); });
  function surfaces(roots) {
    if (!dark()) return 0;
    const jobs = [], list = roots ? roots.flatMap((r) => [r, ...r.querySelectorAll("*")]) : [document.body, ...document.body.querySelectorAll("*")];
    for (const el of list) {
      if (el.hasAttribute("data-surf") || el.closest(NO_SURF)) continue;
      const cs = getComputedStyle(el);   // inclui elementos ainda escondidos: telas entram com display:none e aparecem depois, sem novo aviso do observador
      const bg = rgb(cs.backgroundColor), img = cs.backgroundImage, job = {};
      if (img && img.includes("gradient") && !img.includes("url(")) {
        const stops = [...img.matchAll(/rgba?\([^)]+\)|#[0-9a-f]{6}\b/gi)].map((m) => (m[0][0] === "#" ? hex(m[0]) : rgb(m[0]))).filter(Boolean).filter((x) => x.a > 0.05);
        if (stops.length && stops.every((x) => toHsl(x).l >= 0.85)) { job.img = true; job.bg = surfOf(stops[0]); }
      }
      if (!job.bg && isLight(bg)) job.bg = surfOf(bg);
      const bw = ["Top", "Right", "Bottom", "Left"].some((k) => parseFloat(cs["border" + k + "Width"]) > 0 && isLight(rgb(cs["border" + k + "Color"])));
      if (bw) job.border = true;
      // películas claras em ::before/::after (brilho, véu branco) não aceitam estilo inline: marca o elemento e o CSS as apaga no escuro
      for (const ps of ["before", "after"]) { const pc = getComputedStyle(el, "::" + ps); if (pc.content === "none" || pc.display === "none") continue;
        const pb = rgb(pc.backgroundColor), pi = pc.backgroundImage, ok = (pb && pb.a > 0.3 && toHsl(pb).l >= 0.85) || (pi && pi.includes("gradient") && !pi.includes("url(") && [...pi.matchAll(/rgba?\([^)]+\)|#[0-9a-f]{6}/gi)].map((m) => (m[0][0] === "#" ? hex(m[0]) : rgb(m[0]))).filter((x) => x && x.a > 0.3).some((x) => toHsl(x).l >= 0.85));
        if (ok) { el.setAttribute("data-surf-" + ps, "1"); job.pseudo = true; } }
      if (job.bg || job.border || job.pseudo) jobs.push([el, job]);
    }
    jobs.forEach(([el, j]) => {
      const keep = {}; ["background-color", "background-image", "border-color"].forEach((k) => { const v = el.style.getPropertyValue(k); if (v) keep[k] = [v, el.style.getPropertyPriority(k)]; });
      el.setAttribute("data-surf", JSON.stringify(keep));
      if (j.bg) el.style.setProperty("background-color", css(j.bg), "important");
      if (j.img) el.style.setProperty("background-image", "none", "important");
      if (j.border) el.style.setProperty("border-color", "rgba(255,255,255,.16)", "important");
      // aplica sem animar (algumas caixas têm transição de fundo: sem isso, piscariam em branco)
      const tr = el.style.getPropertyValue("transition"); el.style.setProperty("transition", "none", "important");
      requestAnimationFrame(() => requestAnimationFrame(() => { if (tr) el.style.setProperty("transition", tr); else el.style.removeProperty("transition"); }));
    });
    return jobs.length;
  }

  function now() {
    if (!document.body || document.body.getAttribute("data-autoink") === "off") return 0;
    restore(); if (!dark()) restoreSurf(); surfaces();   // superfícies ajustadas ficam (refazer reiniciaria transições de cor); só voltam ao original no modo claro
    const jobs = [], seen = new Set(), tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = tw.nextNode())) {
      const t = n.nodeValue.trim(); if (t.length < 1) continue;
      const el = n.parentElement; if (!el || seen.has(el)) continue; seen.add(el);
      if (el.closest(SKIP)) continue;
      const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
      const cs = getComputedStyle(el); if (cs.visibility === "hidden" || cs.display === "none" || +cs.opacity < 0.5) continue;
      const fg = rgb(cs.color); if (!fg || fg.a < 0.05) continue;          // texto transparente (degradê no texto) não é lido aqui
      const bgs = bgsOf(el); if (!bgs) continue;
      const px = parseFloat(cs.fontSize) || 16, large = px >= 24 || (px >= 18.66 && +cs.fontWeight >= 700), strong = dark() && !el.closest('.device-png'), need = strong ? (large ? 4.6 : 7) : large ? NEED_LARGE : NEED_TEXT;   // escuro: contraste forte (AAA)
      const eff = fg.a < 1 ? bgs.map((b) => over(fg, b)) : [fg];
      const w = Math.min(...bgs.map((b, i) => ratio(eff[Math.min(i, eff.length - 1)], b)));
      if (w >= need) continue;
      jobs.push({ el, color: css(better(eff[0].a === 1 ? eff[0] : fg, bgs, need)) });
    }
    jobs.forEach((j) => { j.el.setAttribute("data-ink-o", j.el.style.color || ""); j.el.setAttribute("data-ink", "1"); j.el.style.setProperty("color", j.color, "important"); });
    return jobs.length;
  }

  let timer = 0, last = 0;
  const schedule = () => { if (timer) return; timer = setTimeout(() => { timer = 0; last = Date.now(); requestAnimationFrame(now); }, Math.max(80, 260 - (Date.now() - last))); };
  const start = () => {
    new MutationObserver((m) => {
      // elementos novos no modo escuro: superfície já, antes de a tela pintar (o observador roda antes do próximo quadro)
      if (dark()) { const added = []; m.forEach((x) => x.addedNodes.forEach((nd) => { if (nd.nodeType === 1 && nd.isConnected) added.push(nd); })); if (added.length) surfaces(added); }
      if (m.some((x) => !(x.target.nodeType === 1 && x.target.closest && x.target.closest("#toasts")))) schedule();
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
    new MutationObserver(schedule).observe(document.documentElement, { attributes: true, attributeFilter: ["data-mode", "data-theme"] });
    window.addEventListener("hashchange", schedule); window.addEventListener("load", schedule); window.addEventListener("resize", schedule);
    schedule();
  };
  window.CF_AUTOINK = { run: schedule, now };
  // carregado no começo do <body>: começa a observar já, antes de o painel se desenhar (sem "piscar" claro no modo escuro)
  if (document.body) start(); else document.addEventListener("DOMContentLoaded", start);
})();
