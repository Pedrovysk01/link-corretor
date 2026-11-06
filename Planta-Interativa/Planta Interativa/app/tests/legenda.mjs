// Legenda compacta: uma linha discreta (sem texto legal), não cobre pins; ⓘ (desktop) e chip do sol (celular) abrem a janela
// de informações com o sol e o texto legal; Esc fecha e devolve o foco a quem abriu.
const { open, verdict } = await import("file:///D:/Projetos/Planta%20Interativa/app/tests/ego-lib.mjs");
const fails = [];
const dlg = page => page.evaluate(() => { const d = document.getElementById("info"); return { open: !d.hidden, focusIn: d.contains(document.activeElement), active: document.activeElement?.id || document.activeElement?.className, text: d.innerText.replace(/\s+/g, " ") } });
const t = await open("legenda", { noWebGL: true });
const { page } = t;
try {
  // desktop
  await page.cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await page.reload(); await page.waitForTimeout(3000);
  const L = await page.evaluate(() => {
    const r = document.querySelector(".legend").getBoundingClientRect();
    const pins = [...document.querySelectorAll("#pins .pin")].filter(p => !p.hidden).map(p => p.getBoundingClientRect());
    return { h: r.height, w: r.width, text: document.querySelector(".legend").innerText,
      hits: pins.filter(p => p.left < r.right && p.right > r.left && p.top < r.bottom && p.bottom > r.top).length };
  });
  if (L.h > 44) fails.push(`legenda alta demais: ${L.h}px`);
  if (L.w > 560) fails.push(`legenda larga demais: ${L.w}px`);
  if (/CNPJ|Incorpora/.test(L.text)) fails.push("texto legal ainda na legenda");
  if (!/\d+\s*disponíveis/.test(L.text) || !/\d+\s*vendidas/.test(L.text)) fails.push("legenda sem disponíveis/vendidas: " + L.text);
  if (L.hits) fails.push(`legenda cobre ${L.hits} pin(s)`);
  await page.click("#infobtn", { label: "abrir informações" }); await page.waitForTimeout(500);
  let d = await dlg(page);
  if (!d.open || !d.focusIn) fails.push("ⓘ não abriu a janela com o foco dentro: " + JSON.stringify({ open: d.open, focusIn: d.focusIn }));
  if (!/CNPJ 58\.131\.029\/0001-92/.test(d.text) || !/Matrícula nº 5\.401/.test(d.text)) fails.push("janela sem o texto legal completo");
  if (!/Sol a \d+° de altura/.test(d.text) || !/Nasce às/.test(d.text)) fails.push("janela sem o detalhe do sol");
  await page.keyboard.press("Escape"); await page.waitForTimeout(500);
  d = await dlg(page);
  if (d.open) fails.push("Esc não fechou a janela");
  if (d.active !== "infobtn") fails.push("foco não voltou ao ⓘ: " + d.active);
  // celular
  await page.cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await page.cdp("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  await page.reload(); await page.waitForTimeout(3000);
  await page.click("#sunchip", { label: "chip do sol" }); await page.waitForTimeout(500);
  d = await dlg(page);
  if (!d.open || !/CNPJ/.test(d.text)) fails.push("chip do sol no celular não abriu as informações");
  await page.screenshot({ path: "D:/Projetos/Planta Interativa/app/tests/out/m-info.png" });
  await page.click("#info .x", { label: "fechar" }); await page.waitForTimeout(500);
  if ((await dlg(page)).open) fails.push("× não fechou no celular");
  const errs = await page.evaluate(() => window.__errs || []);
  if (errs.length) fails.push("erros: " + errs.join(" | "));
} finally {
  await page.cdp("Emulation.clearDeviceMetricsOverride").catch(() => {});
  await page.cdp("Emulation.setTouchEmulationEnabled", { enabled: false }).catch(() => {});
  await t.cleanup();
}
verdict(fails, "LEGENDA OK");
