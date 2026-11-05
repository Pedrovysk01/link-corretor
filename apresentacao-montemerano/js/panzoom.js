// Pan e zoom estilo mapa sobre qualquer "mundo" de w x h pixels (mapa aéreo e plantas).
// Arrastar com inércia, roda do mouse com zoom suave (amortecido), pinça, voos de câmera com curva própria.
export const EASE = {
  expoOut: k => (k >= 1 ? 1 : 1 - Math.pow(2, -10 * k)),
  quartOut: k => 1 - Math.pow(1 - k, 4),
  inOut: k => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
};

export function panzoom(view, world, { w, h, fit = "cover", max = 6, pad = () => ({ t: 0, b: 0, l: 0, r: 0 }), slack = () => ({ l: 0, r: 0 }), onChange = () => {}, onTap = () => {}, reduce = () => false }) {
  const cam = { S: 1, TX: 0, TY: 0 };
  let anim = null, zoomT = null, zoomRaf = 0, glide = null;
  const vw = () => view.clientWidth, vh = () => view.clientHeight;
  const minS = () => (fit === "cover" ? Math.max(vw() / w, vh() / h) : Math.min(vw() / w, vh() / h) * 0.96);
  function clamp() {
    const sw = w * cam.S, sh = h * cam.S, k = slack(); // folga lateral: com a ficha aberta, a torre pode sair de baixo dela
    cam.TX = sw <= vw() ? (vw() - sw) / 2 - k.r / 2 : Math.min(k.l, Math.max(vw() - sw - k.r, cam.TX));
    cam.TY = sh <= vh() ? (vh() - sh) / 2 : Math.min(0, Math.max(vh() - sh, cam.TY));
  }
  function apply() {
    clamp();
    world.style.transform = `translate3d(${cam.TX}px,${cam.TY}px,0) scale(${cam.S})`;
    onChange(cam);
  }
  const toScreen = (u, v) => [cam.TX + u * cam.S, cam.TY + v * cam.S];
  function zoomAt(f, cx, cy) {
    const ns = Math.min(max, Math.max(minS(), cam.S * f)), k = ns / cam.S;
    cam.TX = cx - (cx - cam.TX) * k; cam.TY = cy - (cy - cam.TY) * k; cam.S = ns; apply();
  }
  const stopAll = () => { anim = null; zoomT = null; glide = null; cancelAnimationFrame(zoomRaf); zoomRaf = 0; };

  // enquadra uma caixa [x0,y0,x1,y1] (coordenadas do mundo) dentro da área livre da tela
  function frame(box, ms = 900, cap = max, ease = EASE.inOut) {
    stopAll();
    const p = pad(), [x0, y0, x1, y1] = box;
    const s = Math.max(minS(), Math.min(cap, Math.min((vw() - p.l - p.r) / (x1 - x0), (vh() - p.t - p.b) / (y1 - y0))));
    const cx = p.l + (vw() - p.l - p.r) / 2, cy = p.t + (vh() - p.t - p.b) / 2;
    const A = { s0: cam.S, x0: cam.TX, y0: cam.TY, s1: s, x1: cx - ((x0 + x1) / 2) * s, y1: cy - ((y0 + y1) / 2) * s, t0: performance.now(), ms: reduce() ? 1 : ms };
    anim = A;
    return new Promise(done => {
      (function step(now) {
        if (anim !== A) return done(false);
        const k = Math.min(1, (now - A.t0) / A.ms), e = ease(k);
        // a escala interpola em log (zoom "constante" ao olho) e a posição acompanha
        const S = A.s0 * Math.pow(A.s1 / A.s0, e);
        const kk = A.s1 === A.s0 ? e : (S - A.s0) / (A.s1 - A.s0);
        cam.S = S; cam.TX = A.x0 + (A.x1 - A.x0) * kk; cam.TY = A.y0 + (A.y1 - A.y0) * kk; apply();
        if (k < 1) requestAnimationFrame(step); else { anim = null; done(true) }
      })(performance.now());
    });
  }

  // zoom da roda: acumula um alvo e se aproxima dele a cada quadro (sem "degraus")
  function wheelZoom(factor, cx, cy) {
    glide = null; anim = null;
    zoomT = { S: Math.min(max, Math.max(minS(), (zoomT ? zoomT.S : cam.S) * factor)), cx, cy };
    if (reduce()) { zoomAt(zoomT.S / cam.S, cx, cy); zoomT = null; return }
    if (zoomRaf) return;
    (function tick() {
      if (!zoomT) { zoomRaf = 0; return }
      const d = zoomT.S / cam.S;
      if (Math.abs(d - 1) < 0.0015) { zoomAt(d, zoomT.cx, zoomT.cy); zoomT = null; zoomRaf = 0; return }
      zoomAt(Math.pow(d, 0.22), zoomT.cx, zoomT.cy); // ~22% do caminho por quadro
      zoomRaf = requestAnimationFrame(tick);
    })();
  }
  view.addEventListener("wheel", e => { e.preventDefault(); const r = view.getBoundingClientRect(); wheelZoom(Math.exp(-e.deltaY * 0.0016), e.clientX - r.left, e.clientY - r.top) }, { passive: false });

  const pts = new Map(); let moved = false, last = null, pinch = null, downT = 0, vel = [0, 0], lastT = 0;
  view.addEventListener("pointerdown", e => {
    if (e.target.closest(".pin,button")) return;
    pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 1) { moved = false; downT = performance.now(); vel = [0, 0]; lastT = downT }
    stopAll(); view.classList.add("drag");
    if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]) }; moved = true }
    last = [e.clientX, e.clientY];
  });
  view.addEventListener("pointermove", e => {
    if (!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 2 && pinch) {
      const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]), r = view.getBoundingClientRect();
      zoomAt(d / pinch.d, (a[0] + b[0]) / 2 - r.left, (a[1] + b[1]) / 2 - r.top); pinch.d = d; return;
    }
    const dx = e.clientX - last[0], dy = e.clientY - last[1], now = performance.now(), dt = Math.max(1, now - lastT);
    if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
    vel = [vel[0] * 0.6 + (dx / dt) * 0.4, vel[1] * 0.6 + (dy / dt) * 0.4]; lastT = now;
    cam.TX += dx; cam.TY += dy; last = [e.clientX, e.clientY]; apply();
  });
  const up = e => {
    const tap = pts.size === 1 && !moved && performance.now() - downT < 500;
    const wasOne = pts.size === 1;
    pts.delete(e.pointerId); if (pts.size < 2) pinch = null;
    if (!pts.size) view.classList.remove("drag");
    if (pts.size === 1) last = [...pts.values()][0];
    if (tap && e.type === "pointerup") onTap(e.clientX, e.clientY, e);
    // inércia: solta o mapa e ele desliza e para
    else if (wasOne && moved && !reduce() && performance.now() - lastT < 80 && Math.hypot(vel[0], vel[1]) > 0.08) {
      const G = glide = { vx: vel[0], vy: vel[1], t: performance.now() };
      (function step(now) {
        if (glide !== G) return;
        const dt = Math.min(32, now - G.t); G.t = now;
        cam.TX += G.vx * dt; cam.TY += G.vy * dt; G.vx *= Math.pow(0.92, dt / 16); G.vy *= Math.pow(0.92, dt / 16); apply();
        if (Math.hypot(G.vx, G.vy) > 0.02) requestAnimationFrame(step); else glide = null;
      })(performance.now());
    }
  };
  view.addEventListener("pointerup", up); view.addEventListener("pointercancel", up);
  return { cam, apply, zoomAt, frame, toScreen, minS, stop: stopAll, size: () => [vw(), vh()] };
}
