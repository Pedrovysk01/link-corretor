/* orquestra: capítulos, dock com indicador em mola, introdução e empresa */
const ORDER = ["intro", "cidade", "futuro", "vida", "empresa", "projeto"];
const LAYER = { intro: "intro", cidade: "mapwrap", futuro: "mapwrap", vida: "mapwrap", empresa: "empresa", projeto: "torrewrap" };
let cur = null, pillX = 0, pillW = 0, pillCancel = null, pillV = [0, 0];

function movePill(btn, instant) {
  const x = btn.offsetLeft, w = btn.offsetWidth, pill = $("#pill");
  pillCancel && pillCancel();
  const apply = () => { pill.style.width = pillW + "px"; pill.style.transform = `translateX(${pillX}px)`; };
  if (instant || REDUCED || !pillW) { pillX = x; pillW = w; apply(); return; }
  const fx = pillX, fw = pillW, c1 = spring(fx, x, { response: .42, damping: .86, velocity: pillV[0] }, (v, vel) => { pillX = v; pillV[0] = vel; apply(); });
  const c2 = spring(fw, w, { response: .42, damping: .9 }, v => { pillW = v; apply(); });
  pillCancel = () => { c1(); c2(); };
}

async function go(name) {
  if (name === cur) return;
  const prev = cur; cur = name; history.replaceState(null, "", "#" + name);
  $$("#dock button").forEach(b => b.setAttribute("aria-current", b.dataset.go === name)); movePill($(`#dock [data-go="${name}"]`), !prev);
  if (prev && SCENES[prev] && SCENES[prev].leave) SCENES[prev].leave();
  $$(".layer").forEach(l => l.classList.toggle("on", l.id === LAYER[name]));
  $$(".ui").forEach(u => u.classList.toggle("on", u.id === "ui-" + name));
  $("#brand").style.opacity = name === "intro" ? 0 : 1; $("#brand").style.transition = "opacity .5s";
  $("#msg").style.opacity = 0;
  if (SCENES[name] && SCENES[name].enter) { if (LAYER[name] !== "intro") { $("#msg").style.opacity = 1; } try { await SCENES[name].enter(); } catch (e) { console.error(e); } if (cur === name) $("#msg").style.opacity = 0; }
}
$$("#dock button").forEach(b => b.onclick = () => go(b.dataset.go));
$("#start").onclick = () => go("cidade");
addEventListener("keydown", e => { if ($(".full.on") || $("#lb.on")) return; const i = ORDER.indexOf(cur);
  if (e.key === "ArrowRight" && i < ORDER.length - 1) go(ORDER[i + 1]); if (e.key === "ArrowLeft" && i > 0) go(ORDER[i - 1]); });

/* introdução: parallax suave com o ponteiro (apenas transform) */
SCENES.intro = {
  enter() { const img = $("#introimg"); let tx = 0, ty = 0, cx = 0, cy = 0, raf;
    this.mv = e => { tx = (e.clientX / innerWidth - .5) * -22; ty = (e.clientY / innerHeight - .5) * -14; };
    const loop = () => { cx += (tx - cx) * .06; cy += (ty - cy) * .06; img.style.transform = `translate(${cx}px,${cy}px) scale(1.02)`; raf = requestAnimationFrame(loop); };
    if (!REDUCED) { addEventListener("pointermove", this.mv); loop(); } this.stop = () => { cancelAnimationFrame(raf); removeEventListener("pointermove", this.mv); };
  },
  leave() { this.stop && this.stop(); }
};

/* empresa */
SCENES.empresa = {
  enter() {
    $("#empnome").textContent = EMPRESA.nome.toUpperCase(); $("#empsl").textContent = EMPRESA.slogan; $("#empnota").textContent = EMPRESA.nota;
    $("#nums").innerHTML = EMPRESA.numeros.map((n, i) => `<div class="glass"><b data-i="${i}">0</b><span>${n.rot}</span></div>`).join("");
    EMPRESA.numeros.forEach((n, i) => setTimeout(() => countUp($(`#nums [data-i="${i}"]`), n.n, "int", 1500, "", n.suf || ""), 500 + i * 250));
  }
};

const start = (location.hash || "#intro").slice(1); go(ORDER.includes(start) ? start : "intro");
