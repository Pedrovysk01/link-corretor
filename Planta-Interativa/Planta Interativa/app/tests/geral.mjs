// "Geral" volta à vista inicial (zoom e posição da abertura, no 2D e no 3D) e à luz do meio-dia, fechando a barra do sol.
const { open, verdict, openPanel } = await import("file:///D:/Projetos/Planta%20Interativa/app/tests/ego-lib.mjs");
const fails = [];
const DATE = "2026-11-03T10:00:00-03:00";
const GERAL = '[data-view="geral"]';
const near = (a, b, tol) => a.every((v, i) => Math.abs(v - b[i]) <= tol);
const st = page => page.evaluate(async () => { const { state, cam, R3 } = await import("/js/state.js");
  return { cam: [cam.S, cam.TX, cam.TY], light: state.light, meio: document.querySelector('[data-light="dia"]').getAttribute("aria-pressed"),
    bar: !document.getElementById("sunbar").hidden, cam3: R3.ready && R3.on ? R3.camera.position.toArray() : null, errs: window.__errs || [] } });
// 2D desktop e celular
for (const [w, h, mob, sel] of [[1440, 900, false, ".controls " + GERAL], [390, 844, true, ".dock " + GERAL]]) {
  const t = await open("geral 2d", { noWebGL: true, date: DATE });
  const { page } = t;
  try {
    await page.cdp("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: mob ? 2 : 1, mobile: mob });
    if (mob) await page.cdp("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
    await page.reload(); await page.waitForTimeout(2500);
    const a = await st(page);
    await page.evaluate(() => { document.getElementById("zin").click(); document.getElementById("zin").click() }); await page.waitForTimeout(400);
    await openPanel(page, "ajustes", mob);
    await page.click('#p-ajustes [data-light="tarde"]', { label: "tarde" });
    await page.click('#p-ajustes [data-act="sun"]', { label: "ver o dia" }); await page.waitForTimeout(800);
    const b = await st(page);
    if (near(b.cam, a.cam, .5)) fails.push(`${w}px: o zoom de teste não mudou a vista`);
    await page.click(sel, { label: "Geral" }); await page.waitForTimeout(1400);
    const c = await st(page);
    if (!near(c.cam, a.cam, 1)) fails.push(`${w}px: Geral não voltou à vista inicial: ${JSON.stringify(a.cam)} → ${JSON.stringify(c.cam)}`);
    if (c.light !== "dia" || c.meio !== "true") fails.push(`${w}px: Geral não voltou ao meio-dia (${c.light}, Meio-dia=${c.meio})`);
    if (c.bar) fails.push(`${w}px: barra do sol ficou aberta`);
    if (c.errs.length) fails.push("erros: " + c.errs.join(" | "));
  } finally {
    await page.cdp("Emulation.clearDeviceMetricsOverride").catch(() => {});
    await page.cdp("Emulation.setTouchEmulationEnabled", { enabled: false }).catch(() => {});
    await t.cleanup();
  }
}
// 3D desktop
{
  const t = await open("geral 3d", { date: DATE });
  const { page } = t;
  try {
    await page.cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await page.reload();
    for (let i = 0; i < 80 && !(await page.evaluate(() => document.body.classList.contains("is3d"))); i++) await page.waitForTimeout(500);
    await page.waitForTimeout(1500);
    const a = await st(page);
    await page.click('#pins .pin:text-is("Lago B 02")', { label: "voa até a casa" }); await page.waitForTimeout(1600);
    await page.keyboard.press("Escape"); await page.waitForTimeout(300);
    await page.click('#pins .pin:text-is("Brisa 06")', { label: "voa até a Brisa" }); await page.waitForTimeout(1600);
    await openPanel(page, "ajustes"); // a ficha (z 8) cobre o painel Ajustes (z 6): clica por script
    await page.evaluate(() => document.querySelector('#p-ajustes [data-light="noite"]').click()); await page.waitForTimeout(300);
    const b = await st(page);
    if (!a.cam3 || near(b.cam3, a.cam3, 2)) fails.push("3D: o voo de teste não mudou a câmera");
    await page.click(".controls " + GERAL, { label: "Geral" }); await page.waitForTimeout(2000);
    const c = await st(page);
    if (!c.cam3 || !near(c.cam3, a.cam3, 2)) fails.push(`3D: Geral não voltou à câmera inicial: ${JSON.stringify(a.cam3)} → ${JSON.stringify(c.cam3)}`);
    if (c.light !== "dia") fails.push("3D: Geral não voltou ao meio-dia");
    if (c.errs.length) fails.push("erros: " + c.errs.join(" | "));
  } finally { await page.cdp("Emulation.clearDeviceMetricsOverride").catch(() => {}); await t.cleanup(); }
}
verdict(fails, "GERAL OK");
