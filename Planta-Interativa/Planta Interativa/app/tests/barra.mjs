// Barra de controles em telas médias (tablet deitado, notebook pequeno): uma linha só com os 6 itens, sem
// quebra, sem cobrir o título; a partir de 960 px fica ao lado do título.
const { open, verdict } = await import("file:///D:/Projetos/Planta%20Interativa/app/tests/ego-lib.mjs");
const fails = [];
const t = await open("barra", { noWebGL: true });
const { page } = t;
try {
  for (const [w, h] of [[1440, 900], [1366, 768], [1280, 800], [1180, 820], [1024, 768], [960, 640], [900, 600], [800, 600]]) {
    await page.cdp("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: false });
    await page.waitForTimeout(400);
    const r = await page.evaluate(() => {
      const c = document.querySelector(".controls"), b = document.querySelector(".brand").getBoundingClientRect(), cr = c.getBoundingClientRect();
      const btns = [...c.querySelectorAll(":scope > button")].map(x => { const q = x.getBoundingClientRect(); return { t: q.top, b: q.bottom, l: q.left, r: q.right } });
      return { W: innerWidth, b: { l: b.left, r: b.right, t: b.top, bt: b.bottom }, c: { l: cr.left, r: cr.right, t: cr.top, bt: cr.bottom }, btns };
    });
    if (r.btns.length !== 6) fails.push(`${w}px: ${r.btns.length} itens na barra (esperado 6)`);
    if (new Set(r.btns.map(x => Math.round(x.t / 4))).size > 1 && Math.max(...r.btns.map(x => x.t)) - Math.min(...r.btns.map(x => x.t)) > 4) fails.push(`${w}px: barra quebrada em mais de uma linha`);
    if (r.btns.some(x => x.l < -1 || x.r > r.W + 1)) fails.push(`${w}px: item da barra sai da tela`);
    if (r.c.r > r.W + 1 || r.c.l < -1) fails.push(`${w}px: barra sai da tela`);
    const over = r.c.l < r.b.r && r.c.r > r.b.l && r.c.t < r.b.bt && r.c.bt > r.b.t;
    if (over) fails.push(`${w}px: barra cobre o título`);
    if (w >= 960 && r.c.t > r.b.t + 2) fails.push(`${w}px: barra caiu para baixo do título (top ${Math.round(r.c.t)})`);
    if (w === 1024 || w === 900) await page.screenshot({ path: `D:/Projetos/Planta Interativa/app/tests/out/barra-${w}.png` });
  }
} finally { await page.cdp("Emulation.clearDeviceMetricsOverride").catch(() => {}); await t.cleanup(); }
verdict(fails, "BARRA OK");
