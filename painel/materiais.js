/* Link Corretor — "Materiais" padrão das apresentações: galeria, planta interativa com pontos e antes/depois.
   Usa os plugins abertos (MIT) da Scaleflex, servidos de /painel/vendor/cloudimage/ e carregados só quando o painel abre:
     @cloudimage/carousel (CloudImageCarousel) · @cloudimage/hotspot (CIHotspot) · @cloudimage/before-after (CIBeforeAfter)
   A apresentação declara, antes de casca.js:

     window.LC_MATERIAIS = {
       galeria: [{ src: "img/a.webp", alt: "Living" }, …],
       plantas: [{ id: "apto", titulo: "Apto 01", src: "img/planta.webp", alt: "…",
                   pontos: [{ id: "living", x: "79%", y: "66%", label: "Living", data: { title: "Living · 50 m²", description: "…", image: "img/living.webp" }, acao: () => … }] }],
       antesDepois: [{ titulo: "Dia e noite", antes: "img/dia.jpg", depois: "img/noite.jpg", rotulos: ["Dia", "Noite"], orientacao: "horizontal" }]
     }

   API: window.LC_MATERIAIS_API.abrir("galeria" | "plantas" | "antes") · fechar(). A casca chama abrir() em Materiais / Visão de Cima. */
(() => {
  "use strict";
  if (window.__lcMateriais) return;
  const cfg = window.LC_MATERIAIS; if (!cfg) return;
  window.__lcMateriais = true;
  const BASE = "/painel/vendor/cloudimage/";
  // os bundles UMD expõem um namespace (window.CIHotspot.CIHotspot / .default); o carousel expõe a classe direto
  const classe = (g) => (typeof g === "function" ? g : g && (g.CIHotspot || g.CIBeforeAfter || g.CloudImageCarousel || g.default)) || null;
  const libs = { galeria: ["carousel.min.js", () => classe(window.CloudImageCarousel)], plantas: ["hotspot.min.js", () => classe(window.CIHotspot)], antes: ["before-after.min.js", () => classe(window.CIBeforeAfter)] };
  const carregados = {};
  const carregar = (k) => carregados[k] || (carregados[k] = new Promise((res, rej) => { if (libs[k][1]()) return res(libs[k][1]()); const s = document.createElement("script"); s.src = BASE + libs[k][0] + "?v=1"; s.onload = () => res(libs[k][1]()); s.onerror = () => rej(new Error(libs[k][0])); document.head.append(s); }));
  const css = document.createElement("link"); css.rel = "stylesheet"; css.href = "/painel/materiais.css?v=1"; document.head.append(css);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const abas = [["galeria", "Galeria", (cfg.galeria || []).length], ["plantas", "Planta", (cfg.plantas || []).length], ["antes", "Antes e depois", (cfg.antesDepois || []).length]].filter((a) => a[2]);
  if (!abas.length) return;

  const raiz = document.createElement("section"); raiz.className = "lc-mat"; raiz.hidden = true; raiz.setAttribute("role", "dialog"); raiz.setAttribute("aria-modal", "true"); raiz.setAttribute("aria-label", "Materiais do empreendimento");
  raiz.innerHTML = `<div class="lc-mat-topo"><div class="lc-mat-abas" role="tablist">${abas.map((a) => `<button type="button" role="tab" class="lc-mat-aba" data-aba="${a[0]}" aria-selected="false">${a[1]}</button>`).join("")}</div>
    <div class="lc-mat-sub" id="lc-mat-sub"></div><button type="button" class="lc-mat-x" aria-label="Fechar materiais">×</button></div>
    <div class="lc-mat-corpo"><div class="lc-mat-pane" data-pane="galeria"><div class="lc-mat-galeria"></div></div>
    <div class="lc-mat-pane" data-pane="plantas"><div class="lc-mat-planta"></div><p class="lc-mat-nota">Planta ilustrativa. Toque nos pontos para ver cada ambiente.</p></div>
    <div class="lc-mat-pane" data-pane="antes"><div class="lc-mat-antes"></div></div></div>`;
  document.body.append(raiz);
  const q = (s) => raiz.querySelector(s);
  const inst = {}; let abaAtual = null, idxPlanta = 0, idxAntes = 0;
  const destruir = (k) => { try { inst[k] && inst[k].destroy && inst[k].destroy(); } catch (e) {} inst[k] = null; };

  const montarGaleria = async () => { const C = await carregar("galeria"); destruir("galeria"); const el = q(".lc-mat-galeria"); el.innerHTML = "";
    inst.galeria = new C(el, { images: cfg.galeria.map((g) => ({ src: g.src, alt: g.alt || "" })), showThumbnails: true, showControls: true, theme: "light", zoomMax: 4 }); inst.galeria.init && inst.galeria.init(); };
  // a planta ocupa o máximo da área mantendo a proporção da imagem (o plugin posiciona os pontos em % do seu próprio elemento)
  const ajustarPlanta = (el, w, h) => { const caixa = el.parentElement.getBoundingClientRect(); const W = caixa.width - 2, Hh = caixa.height - 2; const esc = Math.min(W / w, Hh / h); el.style.width = Math.max(200, Math.floor(w * esc)) + "px"; el.style.height = "auto"; };
  const montarPlanta = async () => { const H = await carregar("plantas"); destruir("plantas"); const p = cfg.plantas[idxPlanta]; const wrap = q(".lc-mat-planta"); wrap.innerHTML = ""; const el = document.createElement("div"); el.className = "lc-mat-planta-in"; wrap.append(el);
    const dims = await new Promise((res) => { const i = new Image(); i.onload = () => res([i.naturalWidth, i.naturalHeight]); i.onerror = () => res([4, 3]); i.src = p.src; });
    ajustarPlanta(el, dims[0], dims[1]); el.dataset.w = dims[0]; el.dataset.h = dims[1];
    inst.plantas = new H(el, { src: p.src, alt: p.alt || p.titulo || "Planta", zoom: true, trigger: "click",
      hotspots: (p.pontos || []).map((h) => ({ id: h.id, x: h.x, y: h.y, label: h.label, pulse: true,
        data: Object.assign({ title: h.label }, h.data || {}, typeof h.acao === "function" ? { url: "#lc-acao:" + h.id, ctaText: "Ver no 3D" } : {}) })) }); };
  // "Ver no 3D" dentro do balão: o plugin só aceita link, então o link #lc-acao:<id> vira a ação declarada na planta
  document.addEventListener("click", (e) => { const a = e.target.closest && e.target.closest('a[href^="#lc-acao:"]'); if (!a) return; e.preventDefault(); e.stopPropagation();
    const id = a.getAttribute("href").slice(9); const pt = ((cfg.plantas[idxPlanta] || {}).pontos || []).find((x) => x.id === id); if (pt && typeof pt.acao === "function") pt.acao(); }, true);
  window.addEventListener("resize", () => { const el = q(".lc-mat-planta-in"); if (el && !raiz.hidden) ajustarPlanta(el, +el.dataset.w, +el.dataset.h); });
  const montarAntes = async () => { const B = await carregar("antes"); destruir("antes"); const a = cfg.antesDepois[idxAntes]; const el = q(".lc-mat-antes"); el.innerHTML = "";
    inst.antes = new B(el, { beforeSrc: a.antes, afterSrc: a.depois, labels: { before: (a.rotulos || ["Antes", "Depois"])[0], after: (a.rotulos || ["Antes", "Depois"])[1] }, orientation: a.orientacao || "horizontal", mode: "drag", zoom: true }); };
  const sub = (lista, idx, setIdx, montar) => { const el = q("#lc-mat-sub"); el.innerHTML = lista.length > 1 ? lista.map((x, i) => `<button type="button" class="lc-mat-chip" aria-pressed="${i === idx}">${esc(x.titulo || "Opção " + (i + 1))}</button>`).join("") : "";
    [...el.children].forEach((b, i) => b.onclick = () => { setIdx(i); sub(lista, i, setIdx, montar); montar(); }); };
  const mostrar = async (k) => { abaAtual = k; raiz.querySelectorAll(".lc-mat-aba").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.aba === k))); raiz.querySelectorAll(".lc-mat-pane").forEach((p) => p.classList.toggle("on", p.dataset.pane === k));
    try { if (k === "galeria") { sub([], 0); await montarGaleria(); } else if (k === "plantas") { sub(cfg.plantas, idxPlanta, (i) => idxPlanta = i, montarPlanta); await montarPlanta(); } else { sub(cfg.antesDepois, idxAntes, (i) => idxAntes = i, montarAntes); await montarAntes(); } }
    catch (e) { console.warn("materiais:", e); const alvo = q(`.lc-mat-pane[data-pane="${k}"] > div`); if (alvo) alvo.innerHTML = "<p class='lc-mat-nota'>Não foi possível carregar este material agora.</p>"; } };
  const abrir = (k) => { raiz.hidden = false; document.documentElement.classList.add("lc-mat-on"); const alvo = abas.some((a) => a[0] === k) ? k : abas[0][0]; mostrar(alvo); setTimeout(() => { const b = q(`.lc-mat-aba[data-aba="${alvo}"]`); b && b.focus(); }, 50); };
  const fechar = () => { raiz.hidden = true; document.documentElement.classList.remove("lc-mat-on"); Object.keys(inst).forEach(destruir); if (window.LC_CASCA_API) window.LC_CASCA_API.fecharPainel(); };
  raiz.querySelectorAll(".lc-mat-aba").forEach((b) => b.onclick = () => mostrar(b.dataset.aba));
  q(".lc-mat-x").onclick = fechar;
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !raiz.hidden) { e.stopPropagation(); fechar(); } }, true);
  window.LC_MATERIAIS_API = { abrir, fechar, abas: abas.map((a) => a[0]) };
})();
