// Sol: horários NOAA por data, sombras trocando de lado entre verão e inverno, barra "Ver o dia" (play, hora,
// estações, Esc), reduzir movimento sem deslocamento, 3D acompanhando e layout no celular.
const { open, verdict, openPanel } = await import("file:///D:/Projetos/Planta%20Interativa/app/tests/ego-lib.mjs");
const fails = [];
const DATE = "2026-11-03T10:00:00-03:00";
const S = page => page.evaluate(async () => { const { state } = await import("/js/state.js"); const bar = document.getElementById("sunbar");
  return { h: state.sun.h, light: state.light, bar: !bar.hidden, txt: document.getElementById("sbtxt").textContent, rise: document.querySelector("#sbsky .rise").textContent,
    play: document.getElementById("sbplay").getAttribute("aria-label"), shadows: document.getElementById("shadows").innerHTML.length, sh0: document.querySelector("#shadows polygon")?.getAttribute("points"),
    night: document.getElementById("nightLights").getAttribute("opacity"), legend: getComputedStyle(document.querySelector(".legend")).opacity, errs: window.__errs || [] } });
// 1) desktop 2D
{
  const t = await open("sol 2d", { noWebGL: true, date: DATE });
  const { page } = t;
  try {
    await page.cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await page.reload(); await page.waitForTimeout(2500);
    // horários por data (tabela NOAA medida na auditoria) e lado da sombra
    const acc = await page.evaluate(async () => { const { sunDay, sunPos } = await import("/js/sun.js");
      const hm = h => h * 60, d = (y, m, dd) => new Date(y, m - 1, dd);
      return { jun: sunDay(d(2026, 6, 21)), out: sunDay(d(2026, 10, 7)), dez: sunDay(d(2026, 12, 21)), azJun: sunPos(d(2026, 6, 21), 11.33).az, azDez: sunPos(d(2026, 12, 21), 11.33).az } });
    const ref = { jun: [5 + 36 / 60, 11 + 23 / 60, 17 + 11 / 60], out: [5 + 2 / 60, 11 + 9 / 60, 17 + 16 / 60], dez: [5, 11 + 20 / 60, 17 + 40 / 60] };
    for (const k of ["jun", "out", "dez"]) { const v = [acc[k].rise, acc[k].noon, acc[k].set]; v.forEach((x, i) => { if (Math.abs(x - ref[k][i]) * 60 > 2) fails.push(`${k}: ${["nascer", "meio-dia", "pôr"][i]} difere ${Math.round((x - ref[k][i]) * 60)} min`) }) }
    if (!(acc.azJun > 330 || acc.azJun < 30)) fails.push(`junho 11h20: sol devia vir do norte, az=${acc.azJun.toFixed(0)}`);
    if (!(acc.azDez > 150 && acc.azDez < 210)) fails.push(`dezembro 11h20: sol devia vir do sul, az=${acc.azDez.toFixed(0)}`);
    // abre a barra: toca sozinho e a sombra se move
    await openPanel(page, "ajustes"); await page.click('#p-ajustes [data-act="sun"]', { label: "ver o dia" }); await page.waitForTimeout(600);
    const a = await S(page); await page.waitForTimeout(2500); const b = await S(page);
    if (!a.bar) fails.push("barra do sol não abriu");
    if (a.play !== "Pausar") fails.push("barra abriu sem tocar");
    if (!(b.h > a.h + .5)) fails.push(`hora não avançou no play: ${a.h} → ${b.h}`);
    if (a.sh0 && b.sh0 && a.sh0 === b.sh0) fails.push("sombra não mudou durante o play");
    if (a.legend !== "0") fails.push("legenda continua visível sob a barra");
    await page.waitForTimeout(10000);
    const c = await S(page);
    if (c.light !== "noite" || c.night !== "1") fails.push(`fim do play devia ser noite com casas acesas: ${c.light}/${c.night}`);
    if (c.play !== "Ver o dia passar") fails.push("play não terminou");
    // arrastar a hora
    await page.evaluate(() => { const r = document.getElementById("sbtime"); r.value = 7.5; r.dispatchEvent(new Event("input", { bubbles: true })) });
    await page.waitForTimeout(300); const d = await S(page);
    if (!/7h30/.test(d.txt) || !d.shadows) fails.push("barra de hora não aplicou 7h30: " + d.txt);
    // inverno
    await page.click('#sunbar [data-season="inverno"]', { label: "inverno" }); await page.waitForTimeout(300);
    const e = await S(page);
    if (!/5h3[5-7]/.test(e.rise)) fails.push("inverno sem o nascer de 5h36: " + e.rise);
    if (e.sh0 === d.sh0) fails.push("sombra igual no inverno e na data de hoje às 7h30");
    await page.screenshot({ path: "D:/Projetos/Planta Interativa/app/tests/out/d-sol.png" });
    await page.keyboard.press("Escape"); await page.waitForTimeout(400);
    const f = await S(page);
    if (f.bar) fails.push("Esc não fechou a barra");
    if (f.legend !== "1") fails.push("legenda não voltou");
    // reduzir movimento: play troca direto entre as luzes prontas
    await page.cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
    await openPanel(page, "ajustes"); await page.click('#p-ajustes [data-act="sun"]', { label: "ver o dia" }); await page.waitForTimeout(300);
    const g = await S(page); await page.waitForTimeout(1800); const g2 = await S(page);
    if (g.light !== "manha" || g2.light !== "dia") fails.push(`reduzir movimento: esperado manhã → meio-dia, veio ${g.light} → ${g2.light}`);
    await page.cdp("Emulation.setEmulatedMedia", { features: [] });
    await page.keyboard.press("Escape");
    if (f.errs.length || g2.errs.length) fails.push("erros: " + [...f.errs, ...g2.errs].join(" | "));
  } finally { await page.cdp("Emulation.clearDeviceMetricsOverride").catch(() => {}); await t.cleanup(); }
}
// 2) 3D acompanha o sol; 3) celular
{
  const t = await open("sol 3d", { date: DATE });
  const { page } = t;
  try {
    await page.cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await page.reload();
    for (let i = 0; i < 80 && !(await page.evaluate(() => document.body.classList.contains("is3d"))); i++) await page.waitForTimeout(500);
    await openPanel(page, "ajustes"); await page.click('#p-ajustes [data-act="sun"]', { label: "ver o dia" }); await page.waitForTimeout(600);
    const p0 = await page.evaluate(async () => { const { R3 } = await import("/js/state.js"); return R3.sun ? R3.sun.position.toArray() : null });
    await page.waitForTimeout(2000);
    const p1 = await page.evaluate(async () => { const { R3 } = await import("/js/state.js"); return R3.sun ? R3.sun.position.toArray() : null });
    if (!p0 || JSON.stringify(p0) === JSON.stringify(p1)) fails.push("sol do 3D não se moveu no play");
    await page.screenshot({ path: "D:/Projetos/Planta Interativa/app/tests/out/d-sol-3d.png" });
    await page.keyboard.press("Escape");
    await page.cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await page.cdp("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
    await page.reload(); await page.waitForTimeout(3000);
    await openPanel(page, "ajustes", true).then(() => page.click('#p-ajustes [data-act="sun"]', { label: "ver o dia" })).catch(e => fails.push("celular: sem botão Ver o dia nos ajustes: " + e.message.slice(0, 80)));
    await page.waitForTimeout(800);
    const m = await page.evaluate(() => { const r = document.getElementById("sunbar").getBoundingClientRect(), d = document.querySelector(".dock").getBoundingClientRect();
      return { l: r.left, r: r.right, t: r.top, b: r.bottom, dockTop: d.top, carousel: getComputedStyle(document.getElementById("carousel")).opacity, errs: window.__errs || [] } });
    if (m.l < 0 || m.r > 390 || m.t < 0 || m.b > m.dockTop + 1) fails.push("celular: barra do sol fora da tela ou sobre a barra de botões: " + JSON.stringify(m));
    if (m.carousel !== "0") fails.push("celular: carrossel continua por baixo da barra do sol");
    await page.screenshot({ path: "D:/Projetos/Planta Interativa/app/tests/out/m-sol.png" });
    if (m.errs.length) fails.push("erros: " + m.errs.join(" | "));
  } finally {
    await page.cdp("Emulation.clearDeviceMetricsOverride").catch(() => {});
    await page.cdp("Emulation.setTouchEmulationEnabled", { enabled: false }).catch(() => {});
    await t.cleanup();
  }
}
verdict(fails, "SOL OK");
