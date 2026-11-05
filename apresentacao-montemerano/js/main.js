// Entrada do app: inicializa dados, mapa 2D, maquete 3D Three.js, painéis de andares/chamarizes, menu e teclado.
import { D, VIEWS, $, esc } from "./data.js";
import { goView, focusArea, homeView, pz } from "./mapa.js";
import { bindHooks, card, closeCard, closeInfo, infoOpen, openInfo, select } from "./ficha.js";
import { expEl, lbKey, openExp, openExpKey } from "./exp.js";
import { cine, endFilm, playFilm } from "./film.js";
import { closePlanta, openPlanta, plOpen } from "./plantas.js";
import { set3D, focusFloor, R3 } from "./relevo3d.js";
import { pvKey } from "./viewer.js";
import { fecharTour, preCarregarTour, tourOpen } from "./tour.js";
import "./materiais.js";
import { openSun, sunOpen } from "./sol.js";
import { state } from "./state.js";

$("infobtn").onclick = openInfo;

// 1. Painel de Andares (20 pavimentos residenciais com status)
const andaresContainer = $("p-andares");
if (andaresContainer && D.andares) {
  andaresContainer.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
      <b class="mt-title">Andares</b>
      <small style="color:var(--ink-soft);font-size:var(--fs-xs);">20 pavimentos tipo</small>
    </div>
    <div class="mt-scroll" style="max-height:360px;overflow-y:auto;display:grid;gap:6px;padding-right:4px;">
      ${D.andares.map(a => {
        const ap1 = a.aptos[0], ap2 = a.aptos[1];
        return `
          <button class="ap-btn" data-andar="${a.id}" style="padding:10px 12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <b>${a.label}</b>
              ${D.mostrarStatus ? `<div style="display:flex;gap:4px;">
                <span class="st ${ap1.status === 'd' ? 'av' : (ap1.status === 'r' ? 're' : 'so')}" style="font-size:9px;padding:2px 5px;">${ap1.label}</span>
                <span class="st ${ap2.status === 'd' ? 'av' : (ap2.status === 'r' ? 're' : 'so')}" style="font-size:9px;padding:2px 5px;">${ap2.label}</span>
              </div>` : ""}
            </div>
            <small style="font-size:var(--fs-xs);color:var(--ink-soft);margin-top:2px;">
              Final 01 (${ap1.area} m²) · Final 02 (${ap2.area} m²)
            </small>
          </button>
        `;
      }).join("")}
    </div>
    <small class="fine" style="margin-top:6px;">Toque em qualquer andar para ver a vista, plantas e detalhes.</small>
  `;
}

// 2. Painel de Chamarizes (Lazer, Hall, Garagens)
const chamarizesContainer = $("p-chamarizes");
if (chamarizesContainer && D.chamarizes) {
  chamarizesContainer.innerHTML = `
    <b class="mt-title">Chamarizes</b>
    <div style="display:grid;gap:8px;margin-top:6px;">
      ${D.chamarizes.map(c => `
        <button class="ap-btn" data-chamariz="${c.id}">
          <b>${esc(c.titulo)}</b>
          <small>${esc(c.eyebrow)} · ${esc(c.badge)}</small>
        </button>
      `).join("")}
      <button class="ap-btn" data-chamariz="predio">
        <b>Villa Montemerano</b>
        <small>Torre de 20 pavimentos residenciais</small>
      </button>
    </div>
  `;
}

// 3. Painel de Plantas
const plantasContainer = $("p-plantas");
if (plantasContainer && D.plantas) {
  plantasContainer.innerHTML = `
    <b class="mt-title">Plantas Oficiais</b>
    <div style="display:grid;gap:8px;margin-top:6px;">
      ${Object.entries(D.plantas).map(([k, v]) => `
        <button class="ap-btn" data-planta="${k}">
          <b>${esc(v.titulo)}</b>
          <small>Planta técnica oficial com zoom e cômodos</small>
        </button>
      `).join("")}
    </div>
  `;
}

// Gerenciamento dos painéis flutuantes (abre um por vez, fechar no X ou clicar fora)
const panels = [...document.querySelectorAll(".panel")];
function closePanels(except) {
  let any = false;
  panels.forEach(p => {
    if (p !== except && !p.hidden) { p.hidden = true; any = true; }
  });
  document.querySelectorAll("[data-panel]").forEach(b => {
    b.setAttribute("aria-expanded", !!except && b.dataset.panel === except.id.slice(2) && !except.hidden);
  });
  return any;
}

document.addEventListener("click", e => {
  const t = e.target.closest("[data-panel]");
  if (t) {
    const p = $("p-" + t.dataset.panel), open = p.hidden;
    closePanels(open ? p : null);
    p.hidden = !open;
    if (open && !p.querySelector(":scope>.panel-x")) {
      const x = document.createElement("button");
      x.type = "button"; x.className = "panel-x"; x.setAttribute("aria-label", "Fechar"); x.textContent = "×";
      p.prepend(x);
    }
    document.querySelectorAll("[data-panel]").forEach(b => {
      b.setAttribute("aria-expanded", open && b.dataset.panel === t.dataset.panel);
    });
    return;
  }
  if (!e.target.closest(".panel") || e.target.closest("[data-andar],[data-chamariz],[data-planta],.panel-x,[data-mt]")) {
    closePanels(null);
  }
}, true);

// Ações globais de botões
document.addEventListener("click", e => {
  // Clique em andar
  const aBtn = e.target.closest("[data-andar]");
  if (aBtn) {
    select(aBtn.dataset.andar);
    return;
  }

  // Clique em chamariz
  const cBtn = e.target.closest("[data-chamariz]");
  if (cBtn) {
    select(cBtn.dataset.chamariz);
    return;
  }

  // Clique em planta
  const pBtn = e.target.closest("[data-planta]");
  if (pBtn) {
    openPlanta(pBtn.dataset.planta);
    return;
  }

  // Toggle de visão 2D (Cima) vs 3D Real (Three.js)
  const vBtn = e.target.closest("[data-v]");
  if (vBtn) {
    const is3d = vBtn.dataset.v === "3d";
    set3D(is3d);
    return;
  }

  // Ações da barra
  const actBtn = e.target.closest("[data-act]");
  if (!actBtn) return;
  const act = actBtn.dataset.act;
  if (act === "geral") {
    closeCard(false);
    if (state.mode === "3d") {
      set3D(true);
    } else {
      goView("geral");
    }
    document.querySelectorAll('[data-act="geral"]').forEach(x => x.setAttribute("aria-pressed", "true"));
  }
  if (act === "exp") openExp(true);
  if (act === "film") playFilm(D.filmGeral, () => homeView());
});

// Sincronizar foco e câmera entre 2D e 3D
bindHooks({
  focus: id => {
    if (state.mode === "3d" && R3.ready) {
      if (id.startsWith("andar-")) {
        focusFloor(+id.slice(6), state.aptoIdx || 0);
      } else {
        const mesh = R3.scene?.getObjectByProperty("userData", { id });
        if (mesh) R3.controls?.target.copy(mesh.position);
      }
    } else {
      focusArea(id);
    }
  },
  home: () => {
    if (state.mode === "3d" && R3.ready) {
      set3D(true);
    } else {
      homeView();
    }
  },
  plantas: k => openPlanta(k)
});

// Suporte a teclado
addEventListener("keydown", e => {
  if (tourOpen()) { if (e.key === "Escape") fecharTour(); return; }
  if (sunOpen() && e.key === "Escape") { openSun(false); return; }
  if (pvKey(e) || lbKey(e)) return;
  if (infoOpen()) {
    if (e.key === "Escape") closeInfo();
    return;
  }
  if (e.key !== "Escape") return;
  if (closePanels(null)) return;
  if (plOpen()) closePlanta();
  else if (!cine.hidden) endFilm();
  else if (!expEl.hidden) openExp(false);
  else closeCard();
});

preCarregarTour();

// Navegação direta por hash (#andar-15, #lazer, #hall, etc.)
const fromHash = () => {
  const hash = location.hash.slice(1);
  if (hash) select(hash);
};
fromHash();
addEventListener("hashchange", fromHash);
