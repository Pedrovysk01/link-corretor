// Celular em pé com 3D: ao abrir, as casas disponíveis aparecem na tela, entre o cabeçalho e o carrossel.
const { open, verdict } = await import("file:///D:/Projetos/Planta%20Interativa/app/tests/ego-lib.mjs");
const fails = [];
const t = await open("celular 3d", {});
const { page } = t;
try {
  await page.cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await page.cdp("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  await page.reload();
  let on = false;
  for (let i = 0; i < 80 && !on; i++) { on = await page.evaluate(() => document.body.classList.contains("is3d")); if (!on) await page.waitForTimeout(500) }
  if (!on) fails.push("3D não abriu no celular emulado");
  await page.waitForTimeout(2500);
  const s = await page.evaluate(() => {
    const top = document.querySelector(".bar").getBoundingClientRect().bottom, bot = document.getElementById("carousel").getBoundingClientRect().top;
    return { top, bot, errs: window.__errs || [], pins: [...document.querySelectorAll("#pins .pin")].map(p => { const r = p.getBoundingClientRect(); return { n: p.textContent, hidden: p.hidden, l: r.left, r: r.right, t: r.top, b: r.bottom } }) };
  });
  for (const p of s.pins) {
    if (p.hidden) fails.push(`${p.n} fora da tela`);
    else if (p.l < 0 || p.r > 390 || p.t < s.top || p.b > s.bot) fails.push(`${p.n} cortado ou atrás do cabeçalho/carrossel: ${JSON.stringify(p)}`);
  }
  if (s.errs.length) fails.push("erros: " + s.errs.join(" | "));
} finally {
  await page.cdp("Emulation.clearDeviceMetricsOverride").catch(() => {});
  await page.cdp("Emulation.setTouchEmulationEnabled", { enabled: false }).catch(() => {});
  await t.cleanup();
}
verdict(fails, "CELULAR-3D OK");
