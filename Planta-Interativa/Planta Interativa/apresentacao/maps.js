/* cenas de mapa: cidade, futuro e vida (MapLibre GL) */
window.SCENES = window.SCENES || {};
const BUILD = [PROJ.lon, PROJ.lat];
let map, mapReady, youMk, tourTimer = null;
const mobile = () => innerWidth < 900;

function ensureMap() {
  if (mapReady) return mapReady;
  mapReady = new Promise(res => {
    map = new maplibregl.Map({ container: "map", style: "https://tiles.openfreemap.org/styles/liberty", center: [-48.58, -27.07], zoom: 9.6, pitch: 35, bearing: 0,
      attributionControl: { compact: true }, maxPitch: 75, antialias: true });
    map.on("load", () => {
      realismo();
      map.addSource("area", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({ id: "area-glow", type: "line", source: "area", paint: { "line-color": "#caa86b", "line-width": 16, "line-opacity": .28, "line-blur": 8 } });
      map.addLayer({ id: "area", type: "line", source: "area", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#caa86b", "line-width": 5 } });
      map.addSource("rota", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({ id: "rota-casing", type: "line", source: "rota", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#fff", "line-width": 9, "line-opacity": .95 } });
      map.addLayer({ id: "rota", type: "line", source: "rota", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#caa86b", "line-width": 5 } });
      map.addSource("dot", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({ id: "dot", type: "circle", source: "dot", paint: { "circle-radius": 8, "circle-color": "#fff", "circle-stroke-color": "#caa86b", "circle-stroke-width": 4 } });
      const h = document.createElement("div"); h.className = "halo"; youMk = new maplibregl.Marker({ element: h }).setLngLat(BUILD).addTo(map);
      const lab = document.createElement("div"); lab.className = "mk you"; lab.textContent = "Felicità 402"; lab.style.marginTop = "-38px";
      const youLab = new maplibregl.Marker({ element: lab, offset: [0, -30] }).setLngLat(BUILD).addTo(map);
      // o rótulo sobe junto com a altura aparente da torre: colado ao pino de longe, acima do topo de perto
      let ultimo = null;
      const subeRotulo = () => { const mpp = 156543.03 * Math.cos(PROJ.lat * rad) / Math.pow(2, map.getZoom());
        const y = Math.round(clamp(TORRE.h / mpp * Math.cos((90 - map.getPitch()) * rad) * 1.1, 0, 90) + 26);
        if (y === ultimo) return; ultimo = y; youLab.setOffset([0, -y]); };
      map.on("move", subeRotulo); subeRotulo();
      res(map);
    });
    map.on("error", e => console.warn("mapa:", e.error && e.error.message));
    map.on("movestart", e => { if (e.originalEvent) stopTour(); });
  });
  return mapReady;
}
/* ---------- realismo: satélite + relevo + torre ----------
   O estilo "liberty" (OpenFreeMap) vira só camada de nomes: o chão é foto de satélite (Esri World Imagery),
   o relevo vem de tiles de elevação (Terrarium/AWS) e a torre do Felicità é desenhada em 3D no lote.
   Prédios: só os que o OpenStreetMap tem com altura (Itapema está pouco mapeada lá). */
const TORRE = { h: (PROJ.pavFim) * 3.0, base: 6 * 3.0, a: 12, b: 15 }; // 21 pavimentos x 3 m; 6 de pódio (garagens + lazer)
function torreGeo() {
  const th = PROJ.topoPlantaBearing * rad, la = PROJ.lat * rad, mLat = 111320, mLon = 111320 * Math.cos(la);
  const u = [Math.sin(th), Math.cos(th)], v = [Math.cos(th), -Math.sin(th)];
  const ring = (a, b) => [[-1, -1], [1, -1], [1, 1], [-1, 1], [-1, -1]].map(([s, t]) =>
    [PROJ.lon + (s * a * u[0] + t * b * v[0]) / mLon, PROJ.lat + (s * a * u[1] + t * b * v[1]) / mLat]);
  const f = (a, b, min, max, c) => ({ type: "Feature", properties: { min, max, c }, geometry: { type: "Polygon", coordinates: [ring(a, b)] } });
  const T = TORRE;
  return { type: "FeatureCollection", features: [
    f(T.a + 3, T.b + 3, 0, T.base, "#8c7a58"),            // pódio
    f(T.a, T.b, T.base, T.h, "#f3eee3"),                   // corpo
    f(T.a * .55, T.b * .55, T.base, T.h + 5, "#e6dcc6"),   // núcleo de circulação
    f(T.a + .6, T.b + .6, T.h - 1.2, T.h, "#caa86b")       // coroamento dourado
  ] };
}
function realismo() {
  const keep = new Set(["area-glow", "area", "rota-casing", "rota", "dot"]); // vizinhos (building-3d) ficam ocultos: o foco é só o Felicità
  const hideSym = /^(poi_|road_one_way|road_shield|highway-shield|waterway_line_label|water_name_line)/;
  map.getStyle().layers.forEach(l => {
    if (keep.has(l.id)) return;
    if (l.type === "symbol" ? hideSym.test(l.id) : true) map.setLayoutProperty(l.id, "visibility", "none");
  });
  map.addSource("sat", { type: "raster", tileSize: 256, maxzoom: 19,
    tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
    attribution: "Imagem © Esri, Maxar, Earthstar Geographics" });
  map.addLayer({ id: "sat", type: "raster", source: "sat", paint: { "raster-saturation": .08, "raster-contrast": .08, "raster-brightness-min": .1, "raster-fade-duration": 250 } }, "area-glow");
  map.addSource("dem", { type: "raster-dem", tiles: ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"],
    tileSize: 256, maxzoom: 14, encoding: "terrarium", attribution: "Relevo: Mapzen/AWS" });
  map.setTerrain({ source: "dem", exaggeration: mobile() ? 1.3 : 1.6 });
  map.addSource("torre", { type: "geojson", data: torreGeo() });
  map.addLayer({ id: "torre", type: "fill-extrusion", source: "torre", paint: {
    "fill-extrusion-color": ["get", "c"], "fill-extrusion-base": ["get", "min"], "fill-extrusion-height": ["get", "max"],
    "fill-extrusion-opacity": 1, "fill-extrusion-vertical-gradient": true } });
  map.setLight({ anchor: "viewport", color: "#fff1d6", intensity: .5, position: [1.4, 215, 50] });
  try { map.setSky({ "sky-color": "#7fa6d6", "horizon-color": "#dfe9f2", "fog-color": "#e8eef4", "sky-horizon-blend": .6, "horizon-fog-blend": .7, "fog-ground-blend": .3 }); } catch (e) {}
}
const fly = (o, ms = 3200) => map.flyTo(Object.assign({ duration: REDUCED ? 0 : ms, essential: true, curve: 1.5 }, o));
const mkLabel = (txt, ll, cls = "") => { const d = document.createElement("div"); d.className = "mk " + cls; d.textContent = txt; return new maplibregl.Marker({ element: d }).setLngLat(ll).addTo(map); };
const setSrc = (id, geo) => map.getSource(id) && map.getSource(id).setData(geo);
const line = c => ({ type: "FeatureCollection", features: c ? [{ type: "Feature", geometry: { type: "LineString", coordinates: c } }] : [] });
function stopTour() { if (tourTimer) { clearTimeout(tourTimer); tourTimer = null; $$(".tour").forEach(b => b.textContent = "Fazer o tour"); } }

/* ---------- cidade ---------- */
let regMk = [];
SCENES.cidade = {
  async enter() {
    await ensureMap(); setSrc("rota", line(null)); setSrc("dot", line(null)); setSrc("area", line(null));
    $("#stats").innerHTML = CIDADE.stats.map((s, i) => `<div class="stat glass"><b data-i="${i}">0</b><span>${s.rot}</span><small>${s.nota}</small></div>`).join("");
    regMk = CIDADE.regiao.map(r => mkLabel(r.nome, [r.lon, r.lat]));
    // começa na região (serra + mar + vizinhas) e desce até a torre; o painel de números ocupa a base da tela
    map.jumpTo({ center: [-48.6, -27.05], zoom: 10.4, pitch: 58, bearing: -12, padding: { top: 0, bottom: 0, left: 0, right: 0 } });
    fly({ center: BUILD, zoom: mobile() ? 15.6 : 16.2, pitch: 63, bearing: 28, padding: { top: 60, bottom: mobile() ? 230 : 170, left: 0, right: 0 } }, 7500);
    CIDADE.stats.forEach((s, i) => setTimeout(() => { const b = $(`#stats [data-i="${i}"]`); b && countUp(b, s.n, s.fmt, 1600, s.pre || "", s.suf || ""); }, 900 + i * 320));
  },
  leave() { regMk.forEach(m => m.remove()); regMk = []; map.stop(); map.setPadding({ top: 0, bottom: 0, left: 0, right: 0 }); }
};

/* ---------- futuro ---------- */
let futMk = [], futI = -1;
SCENES.futuro = {
  async enter() {
    await ensureMap(); setSrc("rota", line(null)); setSrc("dot", line(null));
    $("#futrail").innerHTML = FUTURO.map((f, i) => `<button class="item glass" data-i="${i}"><span class="tag ${f.tag === "Aberto" ? "ok" : ""}">${f.tag}</span><h3>${f.titulo}</h3><p>${f.texto}</p><div class="kpis">${f.kpi.map(k => `<span>${k}</span>`).join("")}</div></button>`).join("");
    $$("#futrail .item").forEach(b => b.onclick = () => { stopTour(); selFut(+b.dataset.i); });
    futMk = FUTURO.map((f, i) => { const m = mkLabel(f.titulo, [f.lon, f.lat]); m.getElement().style.cursor = "pointer"; m.getElement().onclick = () => selFut(i); return m; });
    selFut(0);
  },
  leave() { futMk.forEach(m => m.remove()); futMk = []; setSrc("area", line(null)); }
};
function selFut(i) {
  futI = i; const f = FUTURO[i];
  $$("#futrail .item").forEach((b, k) => b.classList.toggle("on", k === i));
  const el = $(`#futrail .item[data-i="${i}"]`); el && el.scrollIntoView({ inline: "center", block: "nearest", behavior: REDUCED ? "auto" : "smooth" });
  setSrc("area", line(f.linha || null));
  fly({ center: [f.lon, f.lat], zoom: f.zoom, pitch: f.pitch, bearing: (i * 37 + 20) % 90 - 30 }, 3600);
}

/* ---------- vida ---------- */
const CATS = [["praia", "Praia"], ["dia", "Dia a dia"], ["passeio", "Passeios"], ["regiao", "Região"], ["aero", "Aeroportos"]];
let vCat = "praia", vPoi = null, vMk = null, vAnim = null;
SCENES.vida = {
  async enter() {
    await ensureMap(); setSrc("area", line(null));
    $("#vcats").innerHTML = CATS.map(([k, n]) => `<button class="chip ${k === vCat ? "on" : ""}" data-c="${k}">${n}</button>`).join("");
    $$("#vcats .chip").forEach(b => b.onclick = () => { stopTour(); vCat = b.dataset.c; $$("#vcats .chip").forEach(x => x.classList.toggle("on", x === b)); listPois(); selPoi(POIS.find(p => p.cat === vCat)); });
    listPois(); selPoi(POIS.find(p => p.cat === vCat));
  },
  leave() { stopTour(); vAnim && cancelAnimationFrame(vAnim); vMk && vMk.remove(); vMk = null; setSrc("rota", line(null)); setSrc("dot", line(null)); }
};
function listPois() {
  $("#vrail").innerHTML = POIS.filter(p => p.cat === vCat).map(p => `<button class="item glass" data-id="${p.id}"><h3>${p.nome}</h3><p>${p.desc}</p><div class="kpis"><span>${p.carro.min} min de carro</span>${p.pe && p.pe.min <= 30 ? `<span>${p.pe.min} min a pé</span>` : ""}</div></button>`).join("");
  $$("#vrail .item").forEach(b => b.onclick = () => { stopTour(); selPoi(POIS.find(p => p.id === b.dataset.id)); });
}
function modeCell(n, m, ok) { return `<div class="mode ${ok ? "" : "off"}"><b>${ok ? m : "—"}</b><span>${n}${ok ? " · min" : ""}</span></div>`; }
function selPoi(p) {
  if (!p) return; vPoi = p;
  $$("#vrail .item").forEach(b => b.classList.toggle("on", b.dataset.id === p.id));
  const el = $(`#vrail .item[data-id="${p.id}"]`); el && el.scrollIntoView({ inline: "center", block: "nearest", behavior: REDUCED ? "auto" : "smooth" });
  const pe = p.pe && p.pe.min <= 30, bi = p.bike && p.bike.min <= 30;
  $("#rota").innerHTML = `<div class="eyebrow">${CATS.find(c => c[0] === p.cat)[1]}</div><h3>${p.nome}</h3><p>${p.desc}</p>
    <div class="modes">${modeCell("A pé", p.pe && p.pe.min, pe)}${modeCell("Bicicleta", p.bike && p.bike.min, bi)}${modeCell("Carro", p.carro.min, true)}</div>
    <p class="dim" style="margin:12px 0 0">${num(p.carro.km, 1)} km de carro · ${num(p.retaKm, 1)} km em linha reta</p>
    <button class="tour" id="tourbtn">${tourTimer ? "Parar o tour" : "Fazer o tour"}</button>`;
  $("#tourbtn").onclick = toggleTour;
  vMk && vMk.remove(); vMk = mkLabel(p.nome, [p.lon, p.lat]);
  const c = p.carro.geo, b = new maplibregl.LngLatBounds(BUILD, BUILD); c.forEach(x => b.extend(x));
  map.fitBounds(b, { padding: { top: mobile() ? 190 : 130, bottom: mobile() ? 360 : 260, left: 60, right: mobile() ? 40 : 400 }, pitch: p.carro.km > 25 ? 20 : 48, bearing: 0, maxZoom: 16.2, duration: REDUCED ? 0 : 2200, essential: true });
  drawRoute(c, 1900);
}
function drawRoute(c, ms) {
  vAnim && cancelAnimationFrame(vAnim); const t0 = performance.now(); setSrc("rota", line(null));
  const step = now => { const k = clamp((now - t0 - 500) / ms, 0, 1), e = 1 - Math.pow(1 - k, 3), n = Math.max(2, Math.floor(e * (c.length - 1)) + 1);
    const part = c.slice(0, n); setSrc("rota", line(part)); setSrc("dot", { type: "FeatureCollection", features: [{ type: "Feature", geometry: { type: "Point", coordinates: part[part.length - 1] } }] });
    if (k < 1) vAnim = requestAnimationFrame(step); else setSrc("dot", line(null)); };
  vAnim = requestAnimationFrame(step);
}
function toggleTour() {
  if (tourTimer) { stopTour(); $("#tourbtn") && ($("#tourbtn").textContent = "Fazer o tour"); return; }
  const order = POIS.slice(); let k = Math.max(0, order.indexOf(vPoi));
  const tick = () => { const p = order[k % order.length]; if (p.cat !== vCat) { vCat = p.cat; $$("#vcats .chip").forEach(x => x.classList.toggle("on", x.dataset.c === vCat)); listPois(); }
    selPoi(p); const tb = $("#tourbtn"); tb && (tb.textContent = "Parar o tour"); k++; tourTimer = setTimeout(tick, 6500); };
  tourTimer = 1; tick();
}
