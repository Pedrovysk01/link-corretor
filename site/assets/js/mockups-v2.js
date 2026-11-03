/* "Veja na prática": carrossel de mockups por segmento. Só mostra (nada de imprimir).
   Os dados (cenas e cantos de cada foto) e o QR vêm prontos do build (#mk-data e #mk-qr). */
(function () {
  'use strict';
  var root = document.getElementById('veja-na-pratica'); if (!root) return;
  var raw = document.getElementById('mk-data'), qrTpl = document.getElementById('mk-qr'); if (!raw) return;
  var D; try { D = JSON.parse(raw.textContent); } catch (e) { return; }
  var chips = [].slice.call(root.querySelectorAll('[data-mk-seg]')), track = root.querySelector('.mk-track'), nav = [].slice.call(root.querySelectorAll('[data-mk-nav]'));
  var qr = qrTpl ? qrTpl.innerHTML : '';
  var SIZE = { a6: [480, 676], a4: [480, 680], label: [540, 300] };
  var seg = 0, timer = null, userTouched = false, visible = false;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function art(f) {
    var z = SIZE[f] || SIZE.a6, label = f === 'label';
    return '<div class="mk-art mk-' + f + '" data-w="' + z[0] + '" data-h="' + z[1] + '" style="width:' + z[0] + 'px;height:' + z[1] + 'px" aria-hidden="true">' +
      (label ? '<div class="mk-qr">' + qr + '</div><div class="mk-copy"><i class="mk-logo">S</i><b class="mk-brand">SEU NEGÓCIO</b><h4>Seu cartão fidelidade</h4><span class="mk-cta">Escaneie para pegar</span></div>'
        : '<i class="mk-logo">S</i><b class="mk-brand">SEU NEGÓCIO</b><h4>Seu negócio.<br>Seu cartão.</h4><span class="mk-p">Mostre seu cartão no balcão a cada visita.</span><div class="mk-qr">' + qr + '</div><b class="mk-cta">Escaneie para pegar nosso cartão</b>') + '</div>';
  }
  // projeta a arte nos quatro cantos da foto (transformação projetiva, igual à do painel)
  function project(photo) {
    var a = photo.querySelector('.mk-art'); if (!a || !photo.clientWidth) return;
    var w = +a.dataset.w, h = +a.dataset.h, q = JSON.parse(photo.dataset.quad), W = photo.clientWidth, H = photo.clientHeight;
    var pts = q.map(function (p) { return [p[0] * W / 100, p[1] * H / 100]; }), src = [[0, 0], [w, 0], [w, h], [0, h]], m = [], i, j, k;
    for (i = 0; i < 4; i++) { var x = src[i][0], y = src[i][1], u = pts[i][0], v = pts[i][1]; m.push([x, y, 1, 0, 0, 0, -u * x, -u * y, u], [0, 0, 0, x, y, 1, -v * x, -v * y, v]); }
    for (i = 0; i < 8; i++) {
      var piv = i; for (j = i + 1; j < 8; j++) if (Math.abs(m[j][i]) > Math.abs(m[piv][i])) piv = j;
      var t = m[i]; m[i] = m[piv]; m[piv] = t; var n = m[i][i]; if (Math.abs(n) < 1e-10) return;
      for (k = i; k < 9; k++) m[i][k] /= n;
      for (j = 0; j < 8; j++) if (j !== i) { var f = m[j][i]; for (k = i; k < 9; k++) m[j][k] -= f * m[i][k]; }
    }
    var c = m.map(function (r) { return r[8]; });
    a.style.transform = 'matrix3d(' + [c[0], c[3], 0, c[6], c[1], c[4], 0, c[7], 0, 0, 1, 0, c[2], c[5], 0, 1].join(',') + ')';
  }
  var ro = window.ResizeObserver ? new ResizeObserver(function (es) { es.forEach(function (e) { project(e.target); }); }) : null;

  function render() {
    var s = D.segs[seg], scenes = D.sets[s.set];
    if (ro) ro.disconnect();
    track.innerHTML = scenes.map(function (sc, i) {
      return '<figure class="mk-slide" data-i="' + i + '"><div class="mk-photo" data-quad="' + esc(JSON.stringify(sc.q)) + '"><img src="' + esc(sc.p) + '" alt="' + esc(sc.t + ' · ' + s.name) + '" width="1536" height="1024" loading="lazy" decoding="async">' + art(sc.f) + '</div><figcaption><b>' + esc(sc.t) + '</b><span>' + esc(sc.n) + ' · ' + esc(s.name) + '</span></figcaption></figure>';
    }).join('');
    track.scrollLeft = 0;
    [].forEach.call(track.querySelectorAll('.mk-photo'), function (p) { project(p); if (ro) ro.observe(p); });
    chips.forEach(function (c, i) { c.setAttribute('aria-pressed', i === seg); });
    var on = chips[seg]; if (on && on.parentNode.scrollTo) on.parentNode.scrollTo({ left: on.offsetLeft - 16, behavior: reduce ? 'auto' : 'smooth' });
    updNav();
  }
  function slideW() { var f = track.querySelector('.mk-slide'); return f ? f.getBoundingClientRect().width + (parseFloat(getComputedStyle(track).columnGap) || 16) : track.clientWidth; }
  function updNav() { nav[0].disabled = track.scrollLeft < 4; nav[1].disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4; }
  function go(d) { track.scrollBy({ left: d * slideW(), behavior: reduce ? 'auto' : 'smooth' }); }
  function pick(i) { seg = (i + D.segs.length) % D.segs.length; render(); }
  function stop() { userTouched = true; clearInterval(timer); timer = null; }
  function tick() {
    if (userTouched || !visible || document.hidden) return;
    if (track.scrollLeft + track.clientWidth >= track.scrollWidth - 8) pick(seg + 1); else go(1);   // fim das cenas: passa para o próximo segmento
  }
  function play() { if (reduce || userTouched || timer) return; timer = setInterval(tick, 4200); }

  chips.forEach(function (c, i) { c.addEventListener('click', function () { stop(); pick(i); }); });
  nav.forEach(function (b) { b.addEventListener('click', function () { stop(); go(+b.dataset.mkNav); }); });
  track.addEventListener('scroll', updNav, { passive: true });
  ['pointerdown', 'wheel', 'touchstart'].forEach(function (ev) { track.addEventListener(ev, stop, { passive: true }); });
  track.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { stop(); e.preventDefault(); go(1); } if (e.key === 'ArrowLeft') { stop(); e.preventDefault(); go(-1); } });
  root.addEventListener('mouseenter', function () { clearInterval(timer); timer = null; });
  root.addEventListener('mouseleave', function () { play(); });
  if (window.IntersectionObserver) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) play(); }, { threshold: 0.25 }).observe(root); else { visible = true; play(); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { track.querySelectorAll('.mk-photo').forEach(project); });
  render();
})();
