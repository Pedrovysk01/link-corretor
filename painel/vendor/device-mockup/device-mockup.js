/* ==========================================================================
   device-mockup.js — mockups de celular com moldura PNG real, sem dependências.
   Extraído do projeto Cliente Fiel (CF.deviceSpecs / CF.device em components.js),
   desacoplado do namespace CF para ser colado em qualquer projeto.

   Uso básico (HTML puro):
     <link rel="stylesheet" href="device-mockup/device-mockup.css">
     <script src="device-mockup/device-mockup.js"></script>
     <div id="mock"></div>
     <script>
       DeviceMockup.mount(document.getElementById("mock"),
         '<div style="background:#fff;padding:1.5em">Olá</div>',
         { model: "iphone-17-pro", width: 320 });
     </script>

   Ou só a string de HTML:
     el.innerHTML = DeviceMockup.render(innerHtml, opts);

   Opções (todas opcionais):
     model       "iphone-17-pro" (padrão) | "iphone-15-pro" | "pixel-8" | "galaxy-s24"
     width       largura total do aparelho em px (padrão 300)
     status      false para esconder a barra de status falsa (padrão true)
     time        hora exibida na barra de status (padrão "9:41")
     darkStatus  true para barra de status branca (telas escuras)
     cls         classes extras no elemento raiz
     basePath    pasta das molduras (padrão: a pasta img/ ao lado deste script)

   A pasta img/ é localizada automaticamente a partir do <script src="…">.
   Se carregar como módulo/bundler, chame DeviceMockup.setBasePath("/caminho/para/img/").
   ========================================================================== */
(function (root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api; // CommonJS/bundlers
  root.DeviceMockup = api; // global
})(typeof window !== "undefined" ? window : this, function (root) {
  "use strict";

  // W/H = tamanho do PNG em px; l/t/w/h = área vazada da tela (px no PNG); r = raio dos cantos da tela (px).
  // PNGs transparentes da WebMobileFirst (uso comercial livre, sem atribuição — conforme nota do projeto original).
  const specs = {
    "iphone-17-pro": { label: "iPhone 17 Pro",       file: "apple-iphone-17-pro-2025.png", W: 389, H: 800, l: 17, t: 14, w: 356, h: 772, r: 52 },
    "iphone-17-pro-verde": { label: "iPhone 17 Pro Verde", file: "apple-iphone-17-pro-verde.png", W: 389, H: 800, l: 17, t: 14, w: 356, h: 772, r: 52 },  // mesma moldura, aro em verde-esmeralda
    "iphone-15-pro": { label: "iPhone 15 Pro",       file: "apple-iphone-15-pro-2023.png", W: 391, H: 800, l: 19, t: 15, w: 354, h: 770, r: 46 },
    "pixel-8":       { label: "Google Pixel 8",      file: "google-pixel-8-2024.png",      W: 380, H: 800, l: 17, t: 17, w: 342, h: 762, r: 28 },
    "galaxy-s24":    { label: "Samsung Galaxy S24",  file: "samsung-galaxy-s24-2024.png",  W: 386, H: 800, l: 14, t: 15, w: 356, h: 771, r: 27 },
  };
  const DEFAULT_MODEL = "iphone-17-pro";

  // pasta das molduras: <pasta deste script>/img/ — ou "device-mockup/img/" se não der para detectar
  let basePath = "device-mockup/img/";
  try {
    const cur = typeof document !== "undefined" && document.currentScript;
    if (cur && cur.src) basePath = cur.src.replace(/[?#].*$/, "").replace(/[^/]*$/, "") + "img/";
  } catch (e) { /* ambiente sem DOM */ }

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pct = (a, b) => ((a / b) * 100).toFixed(3) + "%";
  const spec = (model) => specs[model] || specs[DEFAULT_MODEL];

  const setBasePath = (p) => { basePath = /\/$/.test(p) ? p : p + "/"; };
  const frameSrc = (model, o = {}) => (o.basePath ? (/\/$/.test(o.basePath) ? o.basePath : o.basePath + "/") : basePath) + spec(model).file;

  // área da tela em px para um aparelho renderizado com `width` px (útil para desenhar em canvas)
  const screenRect = (model, width = 300) => {
    const d = spec(model), k = width / d.W;
    return { left: d.l * k, top: d.t * k, width: d.w * k, height: d.h * k, radius: d.r * k, deviceWidth: width, deviceHeight: d.H * k };
  };

  const render = (inner, o = {}) => {
    const key = specs[o.model] ? o.model : DEFAULT_MODEL, d = specs[key], width = o.width || 300;
    const status = o.status === false ? "" :
      `<div class="dev-status"><span>${esc(o.time || "9:41")}</span><span class="sig"><i></i><i></i><i class="bat"></i></span></div>`;
    return `<div class="device-png ${o.darkStatus ? "dark-status" : ""} ${o.cls || ""}" data-model="${key}" style="--dw:${width}px;--dz:${(d.w / d.W * width / 390).toFixed(4)};width:${width}px;aspect-ratio:${d.W}/${d.H}" role="img" aria-label="${esc(d.label)}">
      <div class="dp-screen" style="left:${pct(d.l, d.W)};top:${pct(d.t, d.H)};width:${pct(d.w, d.W)};height:${pct(d.h, d.H)};border-radius:${pct(d.r, d.w)} / ${pct(d.r, d.h)}">${inner || ""}${status}</div>
      <img class="dp-frame" src="${esc(frameSrc(key, o))}" alt="" draggable="false"></div>`;
  };

  const mount = (el, inner, o) => { if (typeof el === "string") el = document.querySelector(el); el.innerHTML = render(inner, o); return el.firstElementChild; };

  const models = Object.fromEntries(Object.entries(specs).map(([k, v]) => [k, v.label]));

  return { specs, models, defaultModel: DEFAULT_MODEL, render, mount, frameSrc, screenRect, setBasePath, esc };
});
