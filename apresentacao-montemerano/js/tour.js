// Tour 3D por dentro dos apartamentos e do lazer. O tour é outro app (pasta tour/, React + three.js); aqui ele abre em tela cheia
// por cima do mapa, num iframe da mesma origem. Fica ABAIXO do widget do Link Corretor (cadastro, IA, contato), que segue valendo
// por cima do tour, e o batimento de tempo (que roda nesta página) continua contando enquanto o cliente anda lá dentro.
// Volta ao mapa: o tour avisa com postMessage {lc:"tour-fechar"} (botão "Mapa") ou o cliente aperta Esc nesta página.

// Chave da planta no empreendimento.json (campo "tipo" do apartamento) -> empreendimento do tour + ambiente em que a pessoa começa.
// Planta de 128,60 m² = "Apto 01" do tour; planta de 116,60 m² = "Apto 02" (espelho, ambientes com prefixo b-). Ver README-V2.md.
const DESTINOS = {
  a128: { property: "montemerano-01", room: "living", rotulo: "Apartamento 128,60 m²" },
  a116: { property: "montemerano-02", room: "b-living", rotulo: "Apartamento 116,60 m²" },
  lazer: { property: "montemerano-lazer", room: "piscina", rotulo: "Área de lazer" }
};

let ov = null, frame = null, de = null;

export const temTour = chave => !!DESTINOS[chave];

// Pré-carga: com o mapa já utilizável, baixa em segundo plano o código do tour (~2,5 MB gz) e a iluminação, para o "Ver por dentro" abrir
// quase na hora. Só roda uma vez, com a aba visível e fora de conexão econômica (Save-Data / 2g).
let preCarregou = false;
export function preCarregarTour() {
  if (preCarregou) return; preCarregou = true;
  const c = navigator.connection;
  if (c && (c.saveData || /(^|-)2g$/.test(c.effectiveType || ""))) return;
  const rodar = () => fetch("tour/prefetch.json").then(r => r.ok ? r.json() : []).then(lista => {
    for (const f of lista) { const l = document.createElement("link"); l.rel = "prefetch"; l.href = "tour/" + f; document.head.append(l); }
  }).catch(() => {});
  (window.requestIdleCallback || (f => setTimeout(f, 1500)))(() => setTimeout(rodar, 3000));
}
export const tourOpen = () => !!ov && !ov.hidden;

function montar() {
  ov = document.createElement("section");
  ov.id = "tourov"; ov.hidden = true;
  ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true"); ov.setAttribute("aria-label", "Tour 3D");
  ov.innerHTML = '<iframe title="Tour 3D por dentro" allow="fullscreen" referrerpolicy="same-origin"></iframe>';
  frame = ov.querySelector("iframe");
  document.body.append(ov);
  addEventListener("message", e => {
    if (e.origin === location.origin && e.data && e.data.lc === "tour-fechar") fecharTour();
  });
}

export function abrirTour(chave) {
  const d = DESTINOS[chave]; if (!d) return;
  if (!ov) montar();
  de = document.activeElement;
  document.querySelectorAll("video").forEach(v => v.pause());
  frame.src = `tour/index.html?property=${encodeURIComponent(d.property)}&room=${encodeURIComponent(d.room)}&embed=1&intro=0`;
  frame.title = `Tour 3D · ${d.rotulo}`;
  ov.hidden = false;
  document.body.classList.add("tour-on");
  frame.focus({ preventScroll: true });
}

export function fecharTour() {
  if (!tourOpen()) return;
  ov.hidden = true;
  frame.src = "about:blank"; // libera o WebGL e a memória
  document.body.classList.remove("tour-on");
  de?.focus?.({ preventScroll: true }); de = null;
}
