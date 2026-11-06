import { IC } from "./icons.js";
// Ficha lateral (no celular, folha que sobe): andares, apartamentos e chamarizes, com galeria, vídeo e plantas.
import { D, IMG, IMGM, TH, PANO, $, esc, isMobile, reduceM } from "./data.js";
import { state } from "./state.js";
import { openViewer } from "./viewer.js";
import { abrirTour, temTour } from "./tour.js";

const card = $("card");
let hooks = { focus: () => {}, home: () => {}, plantas: () => {} };
export const bindHooks = h => Object.assign(hooks, h);

// Construir dicionário de fichas dinâmicas a partir do empreendimento.json
const FICHAS = {};

// 1. Chamarizes
if (D.chamarizes) {
  for (const c of D.chamarizes) {
    FICHAS[c.id] = {
      tipo: "chamariz",
      id: c.id,
      eyebrow: c.eyebrow,
      titulo: c.titulo,
      badge: c.badge,
      quote: c.quote,
      video: c.video,
      g: c.g,
      specs: c.specs,
      itens: c.itens,
      cta: c.id === "lazer" ? "plantaLazer" : null
    };
  }
}

// 2. Prédio geral
FICHAS["predio"] = {
  tipo: "predio",
  id: "predio",
  eyebrow: "O empreendimento",
  titulo: "Villa Montemerano",
  badge: "20 andares tipo · 40 apartamentos",
  quote: "Um empreendimento contemporâneo com localização privilegiada no Balneário Perequê.",
  video: "v-externa-giro",
  g: [["externa-01", "Fachada frontal"], ["externa-noturna", "Fachada à noite"], ["externa-aerea", "Vista aérea"]],
  specs: [["Andares tipo", "20 pavimentos"], ["Aptos por andar", "2 unidades"], ["Lazer", "659 m²"]],
  itens: D.fatos,
  end: true,
  cta: "andares"
};

// 3. Andares residenciais (4º ao 23º)
if (D.andares) {
  for (const a of D.andares) {
    FICHAS[a.id] = {
      tipo: "andar",
      id: a.id,
      num: a.num,
      andarData: a,
      eyebrow: `${a.num}º Pavimento Residencial`,
      titulo: a.label,
      badge: "2 apartamentos por andar · 3 suítes · 2 vagas",
      quote: "Todos os apartamentos voltados para a rua, com excelente iluminação e ventilação natural.",
      activeAptoIdx: 0,
      video: "v-living-estar",
      g: [["living-estar", "Living estar"], ["living-jantar", "Living jantar"], ["sacada", "Sacada com churrasqueira"], ["suite", "Suíte master"]],
      specs: [["Suítes", "3 suítes"], ["Vagas", "2 vagas privativas"], ["Lazer", "659 m² completo"]],
      itens: [
        "Sacada com churrasqueira a carvão",
        "Amplo living integrado à cozinha e sacada",
        "Piso em porcelanato em todas as áreas sociais",
        "Teto com rebaixo em gesso em todos os cômodos",
        "Tubulação para água quente e fria",
        "Espera para ar-condicionado tipo split nas suítes e living",
        "Medidores individuais de água, luz e gás"
      ],
      cta: "plantaTipo"
    };
  }
}

// 4. Tipologias avulsas (Apto 116 e 128)
for (const ap of D.aptos) {
  FICHAS[ap.id] = {
    tipo: "tipologia",
    id: ap.id,
    eyebrow: "Planta Tipo",
    titulo: ap.titulo,
    badge: `${ap.suites} suítes · ${ap.vagas} vagas`,
    quote: "Planta inteligente otimizando cada metro quadrado com acabamentos de alto padrão.",
    video: ap.video,
    g: ap.galeria,
    specs: [["Área privativa", ap.area + " m²"], ["Suítes", String(ap.suites)], ["Vagas", String(ap.vagas)]],
    itens: ap.itens,
    ambientes: ap.ambientes,
    cta: "plantaTipo"
  };
}

const tourCta = (chave, titulo, sub) => temTour(chave) ? `<button class="tour-cta" type="button" data-tour="${chave}"><span class="tour-ic" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span><b>${esc(titulo)}</b><small>${esc(sub)}</small></button>` : "";

function galeriaHTML(f) {
  const G = f.g || [], o = f.video ? 1 : 0, nome = f.titulo;
  return `<div class="film" data-gal><div class="slides">${f.video ? `<video src="media/${f.video}.mp4" poster="media/${f.video}.jpg" muted loop playsinline autoplay></video>` : ""}
    ${G.map(([p, l], i) => `<button data-zoom="${i}" aria-label="${PANO(p) ? "Ver em 360°" : "Ampliar"}: ${esc(l)}"${PANO(p) ? ' class="g360"' : ""}><img loading="lazy" src="${IMGM(p)}" alt="${esc(nome)}: ${esc(l)}">${PANO(p) ? `<span class="b360" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 5c-5 0-9 2.2-9 5s4 5 9 5c.5 0 1-.03 1.5-.07M16 14.5c3-.7 5-2.4 5-4.5 0-2.8-4-5-9-5"/><path d="m11 12.5 2.5 2.4L11 17.4"/></svg>360°</span>` : ""}</button>`).join("")}</div>
    <span class="ilus">Imagens ilustrativas</span><button class="cnav p" aria-label="Imagem anterior">‹</button><button class="cnav n" aria-label="Próxima imagem">›</button><span class="ccount">1 / ${G.length + o}</span></div>
    <div class="cstrip">${f.video ? `<button class="v" data-go="0" aria-current="true" aria-label="Filme">${IC.play}</button>` : ""}${G.map(([p, l], i) => `<button data-go="${i + o}" aria-label="${esc(l)}"${!f.video && !i ? ' aria-current="true"' : ""}><img src="${TH(p)}" alt=""></button>`).join("")}</div>`;
}

function bindGaleria(f) {
  const box = card.querySelector("[data-gal]"); if (!box) return;
  const sl = box.querySelector(".slides"), n = sl.children.length, cnt = box.querySelector(".ccount"), strip = card.querySelector(".cstrip"), vid = sl.querySelector("video");
  const idx = () => Math.round(sl.scrollLeft / sl.clientWidth), go = i => { i = (i + n) % n; sl.scrollTo({ left: i * sl.clientWidth, behavior: reduceM() ? "auto" : "smooth" }) };
  box.querySelector(".p").onclick = () => go(idx() - 1); box.querySelector(".n").onclick = () => go(idx() + 1);
  let tm = null; sl.addEventListener("scroll", () => { clearTimeout(tm); tm = setTimeout(() => { const i = idx(); cnt.textContent = `${i + 1} / ${n}`;
    strip.querySelectorAll("[data-go]").forEach(b => b.setAttribute("aria-current", +b.dataset.go === i));
    const cur = strip.querySelector(`[data-go="${i}"]`); if (cur) strip.scrollTo({ left: cur.offsetLeft - strip.clientWidth / 2 + cur.clientWidth / 2, behavior: "smooth" });
    if (vid) { if (i === 0) vid.play().catch(() => {}); else vid.pause() } }, 80) }, { passive: true });
  strip.addEventListener("click", e => { const b = e.target.closest("[data-go]"); if (b) go(+b.dataset.go) });
  sl.addEventListener("click", e => { const b = e.target.closest("[data-zoom]"); if (!b) return;
    openViewer(f.g.map(([p, l]) => ({ src: IMG(p), label: l, pano: PANO(p) })), +b.dataset.zoom, f.titulo, "Villa Montemerano") });
}

function andarAptosHTML(f) {
  if (f.tipo !== "andar" || !f.andarData) return "";
  const a = f.andarData;
  const activeIdx = f.activeAptoIdx || 0;
  const curApto = a.aptos[activeIdx];
  const stCls = { d: "av", r: "re", v: "so" }[curApto.status];
  const stTxt = { d: "Disponível", r: "Reservado", v: "Vendido" }[curApto.status];

  return `
    <div class="ksec" style="margin-top:16px;">
      <span>Apartamentos deste pavimento</span>
      <div class="seg" role="group" aria-label="Escolher apartamento" style="margin:8px 0 12px;width:100%;display:flex;gap:4px;">
        ${a.aptos.map((ap, idx) => `
          <button class="chip" data-apto-idx="${idx}" aria-pressed="${idx === activeIdx}" style="flex:1;padding:8px 6px;text-align:center;">
            <b>${ap.label}</b> · ${ap.area} m²
          </button>
        `).join("")}
      </div>
      <div class="apto-active-box" style="padding:12px;border-radius:var(--r-md);background:var(--track);display:grid;gap:8px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <strong style="font-size:var(--fs-lg);">${curApto.label}</strong>
          ${D.mostrarStatus ? `<span class="st ${stCls}">${stTxt}</span>` : ""}
        </div>
        <div style="font-size:var(--fs-sm);color:var(--ink-soft);">${curApto.lado}</div>
        <dl class="specs" style="margin:6px 0 0;">
          <div><dt>Privativa</dt><dd>${curApto.area} m²</dd></div>
          <div><dt>Suítes</dt><dd>${curApto.suites}</dd></div>
          <div><dt>Vagas</dt><dd>${curApto.vagas}</dd></div>
        </dl>
        ${tourCta(curApto.tipo, "Ver por dentro", "Entre no apartamento e ande por todos os ambientes")}
      </div>
    </div>
  `;
}

function navAndaresHTML(f) {
  if (f.tipo !== "andar") return "";
  const curNum = f.num;
  const prevNum = curNum > 4 ? curNum - 1 : null;
  const nextNum = curNum < 23 ? curNum + 1 : null;
  return `
    <div class="nav" style="margin-top:16px;">
      ${prevNum ? `<button data-f="andar-${prevNum}">‹ ${prevNum}º Pavimento</button>` : `<div></div>`}
      ${nextNum ? `<button data-f="andar-${nextNum}">${nextNum}º Pavimento ›</button>` : `<div></div>`}
    </div>
  `;
}

const specs = f => `<dl class="specs">${f.specs.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>`;
const ambientes = f => f.ambientes ? `<div class="ksec"><span>Ambientes do apartamento</span><div class="kdist">${f.ambientes.map(r => `<div class="amb"><span>${esc(r.n)}</span><b>${esc(r.m2)} m²</b></div>`).join("")}</div><p class="fine">Áreas conforme a planta oficial do pavimento tipo.</p></div>` : "";
const outros = id => `<div class="ksec"><span>Ver também</span><div class="achips">
  <button data-f="lazer"><span>Pavimento de Lazer</span></button>
  <button data-f="hall"><span>Hall de Entrada</span></button>
  <button data-f="garagens"><span>Garagens</span></button>
  <button data-f="predio"><span>O Prédio</span></button>
</div></div>`;

const cta = f => {
  if (f.id === "lazer") return tourCta("lazer", "Ver por dentro", "Caminhe pela piscina, salão, academia e playground") + `<div class="nav"><button data-pl="lazer" style="grid-column:1/-1">Ampliar planta do lazer ⤢</button></div>`;
  if (f.tipo === "tipologia") return tourCta(f.id, "Ver por dentro", "Entre no apartamento e ande por todos os ambientes") + `<div class="nav"><button data-pl="tipo" style="grid-column:1/-1">Ampliar planta do pavimento tipo ⤢</button></div>`;
  if (f.cta === "plantaTipo") return `<div class="nav"><button data-pl="tipo" style="grid-column:1/-1">Ampliar planta do pavimento tipo ⤢</button></div>`;
  if (f.cta === "plantaLazer") return `<div class="nav"><button data-pl="lazer" style="grid-column:1/-1">Ampliar planta do lazer ⤢</button></div>`;
  if (f.cta === "andares") return `<div class="nav"><button data-f="andar-4">Ver 4º Andar (primeiro tipo) ›</button><button data-f="andar-23">Ver 23º Andar (cobertura) ›</button></div>`;
  return "";
};

export function select(id, focus = true, aptoIdx = null) {
  const f = FICHAS[id]; if (!f) return;
  if (aptoIdx != null && f.tipo === "andar") f.activeAptoIdx = aptoIdx;
  state.aptoIdx = f.tipo === "andar" ? (f.activeAptoIdx || 0) : 0;
  state.selected = id; state.cardOpen = true; document.body.classList.add("cardopen");

  card.innerHTML = `
    <div class="grab"></div>
    <button class="close" aria-label="Fechar ficha">×</button>
    ${galeriaHTML(f)}
    <div class="in">
      <div class="eyebrow">${esc(f.eyebrow)}</div>
      <h2>${esc(f.titulo)}</h2>
      <span class="st area">${esc(f.badge)}</span>
      ${specs(f)}
      <p class="kquote">${esc(f.quote)}</p>
      ${andarAptosHTML(f)}
      <ul class="klist" style="margin-top:14px;">${(f.itens || []).map(x => `<li>${esc(x)}</li>`).join("")}</ul>
      ${ambientes(f)}
      ${f.end ? `<div class="ksec"><span>Endereço</span><p class="feat" style="margin-top:6px">${esc(D.endereco)}</p></div>` : ""}
      ${cta(f)}
      ${navAndaresHTML(f)}
      ${outros(id)}
      <p class="legal">${esc(D.legal)}</p>
    </div>
  `;

  const fresh = card.hidden; card.hidden = false; card.scrollTop = 0; posCard();
  if (fresh && isMobile()) { card.classList.add("enter"); requestAnimationFrame(() => requestAnimationFrame(() => card.classList.remove("enter"))) }
  card.querySelector(".close").onclick = () => closeCard();

  bindGaleria(f);

  // Toggle de apto dentro do andar
  card.querySelectorAll("[data-apto-idx]").forEach(b => {
    b.onclick = () => {
      f.activeAptoIdx = +b.dataset.aptoIdx;
      select(id, false);
    };
  });

  card.querySelectorAll("[data-f]").forEach(b => b.onclick = () => select(b.dataset.f));
  card.querySelectorAll("[data-pl]").forEach(b => b.onclick = () => hooks.plantas(b.dataset.pl));
  card.querySelectorAll("[data-tour]").forEach(b => b.onclick = () => abrirTour(b.dataset.tour));

  // Destacar polígonos no SVG 2D
  document.querySelectorAll("#msvg .h").forEach(g => {
    const isThis = g.dataset.id === id && (g.dataset.apto == null || f.tipo !== "andar" || +g.dataset.apto === (f.activeAptoIdx || 0));
    g.classList.toggle("sel", isThis);
  });

  if (focus) hooks.focus(id);
}

function posCard() {
  if (isMobile()) { card.style.top = ""; card.style.maxHeight = ""; return }
  const b = document.querySelector(".controls")?.getBoundingClientRect();
  const top = b ? Math.max(112, b.bottom + 12) : 112;
  card.style.top = top + "px"; card.style.maxHeight = `calc(100% - ${top + 16}px)`;
}
addEventListener("resize", () => { if (!card.hidden) posCard() });

export function closeCard(home = true) {
  if (card.hidden) return;
  card.querySelector("video")?.pause();
  const done = () => { card.hidden = true; card.classList.remove("enter"); document.body.classList.remove("cardopen"); state.cardOpen = false };
  if (isMobile() && !reduceM()) { card.classList.add("enter"); setTimeout(done, 330) } else done();
  state.selected = null;
  document.querySelectorAll("#msvg .h.sel").forEach(g => g.classList.remove("sel"));
  if (home) hooks.home();
}

let sy = null;
card.addEventListener("touchstart", e => { if (card.scrollTop <= 0) sy = e.touches[0].clientY }, { passive: true });
card.addEventListener("touchmove", e => { if (sy == null) return; const d = e.touches[0].clientY - sy; if (d > 0) card.style.transform = `translateY(${d}px)` }, { passive: true });
card.addEventListener("touchend", e => { if (sy == null) return; const d = e.changedTouches[0].clientY - sy; sy = null; card.style.transform = ""; if (d > 110) closeCard() });

// Janela de informações
const INFO = $("info"); let from = null;
export const openInfo = () => {
  from = document.activeElement;
  $("info-end").textContent = D.endereco + " · Incorporadora: " + D.incorporadora + " · Projeto: " + D.projeto;
  $("info-legal").textContent = D.legal;
  INFO.hidden = false; INFO.querySelector(".box").scrollTop = 0;
  requestAnimationFrame(() => INFO.classList.add("on"));
  INFO.querySelector(".x").focus({ preventScroll: true });
};
const closeInfo = () => { INFO.classList.remove("on"); setTimeout(() => INFO.hidden = true, 250); from?.focus?.({ preventScroll: true }); from = null };
INFO.addEventListener("click", e => { if (e.target === INFO || e.target.closest(".x")) closeInfo() });
export const infoOpen = () => !INFO.hidden; export { closeInfo };
export { card };
