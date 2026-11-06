// Acabamento visível e celular: contador da galeria sem sobrepor, "Visão 3D" desligado em tom neutro,
// botão cede ao ser pressionado, rótulos de casa nunca cortados na borda, barra do celular com Apresentação e
// Experiências à vista, cabeçalho sai da frente da ficha no celular.
const { open, verdict } = await import("file:///D:/Projetos/Planta%20Interativa/app/tests/ego-lib.mjs");
const fails = [];
const t = await open("acabamento", { noWebGL: true });
const { page } = t;
const overlap = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
try {
  await page.cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await page.reload(); await page.waitForTimeout(3000);
  // Visão 3D desligado com a mesma cor dos outros botões
  const c = await page.evaluate(() => { const b = document.querySelector('.view-seg .c3d'), o = document.querySelector('.controls [data-act="film"]'); return [b.getAttribute("aria-pressed"), getComputedStyle(b).color, getComputedStyle(o).color] });
  if (c[0] !== "false" || c[1] !== c[2]) fails.push(`Visão 3D desligado com cor própria: ${JSON.stringify(c)}`);
  // botão cede na hora do toque
  const r = await page.evaluate(() => { const b = document.querySelector('.controls [data-act="film"]').getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2] });
  await page.mouse.move(r[0], r[1], { label: "sobre Apresentação" }); await page.mouse.down();
  const sc = await page.evaluate(() => getComputedStyle(document.querySelector('.controls [data-act="film"]')).scale);
  await page.mouse.move(r[0], r[1] + 300, { label: "sai do botão" }); await page.mouse.up(); await page.waitForTimeout(300); // solta fora: não abre a apresentação
  if (sc !== "0.96") fails.push("botão não cede ao pressionar (scale=" + sc + ")");
  // galeria: contador e "Imagens ilustrativas" separados
  await page.click('#pins .pin:text-is("Brisa 06")', { label: "ficha" }); await page.waitForTimeout(1500);
  const g = await page.evaluate(() => { const f = document.querySelector("#card .film").getBoundingClientRect(), a = document.querySelector("#card .film .ilus").getBoundingClientRect(), b = document.querySelector("#card .ccount").getBoundingClientRect(); return { f: [f.left, f.right], a: [a.left, a.right, a.top, a.bottom], b: [b.left, b.right, b.top, b.bottom] } });
  const A = { left: g.a[0], right: g.a[1], top: g.a[2], bottom: g.a[3] }, B = { left: g.b[0], right: g.b[1], top: g.b[2], bottom: g.b[3] };
  if (overlap(A, B)) fails.push("contador 1/N sobre 'Imagens ilustrativas'");
  if (g.f[1] - B.right > 20) fails.push("contador não está no canto direito da foto");
  await page.keyboard.press("Escape"); await page.waitForTimeout(1200);
  // rótulos na borda: arrasta o mapa até a Brisa encostar na borda esquerda e na direita
  for (const dx of [-650, 1300]) {
    await page.mouse.move(720, 500, { label: "mapa" }); await page.mouse.down();
    for (let k = 1; k <= 10; k++) await page.mouse.move(720 + dx * k / 10, 500, { label: "arrastar mapa" });
    await page.mouse.up(); await page.waitForTimeout(400);
    const cut = await page.evaluate(() => [...document.querySelectorAll("#pins .pin")].filter(p => !p.hidden).map(p => { const r = p.getBoundingClientRect(); return [p.textContent, Math.round(r.left), Math.round(r.right)] }).filter(([, l, r]) => l < 0 || r > innerWidth));
    if (cut.length) fails.push("rótulo cortado na borda: " + JSON.stringify(cut));
  }
  // celular
  await page.cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await page.cdp("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  await page.reload(); await page.waitForTimeout(3000);
  const d = await page.evaluate(() => [...document.querySelectorAll(".dock button")].slice(0, 5).filter(b => /Apresentação|Experiências/.test(b.textContent)).map(b => { const r = b.getBoundingClientRect(); return [b.textContent.trim(), r.right <= innerWidth && r.left >= 0] }));
  if (!/Experiências/.test(d[0]?.[0]) || !/Apresentação/.test(d[1]?.[0]) || !d.every(x => x[1])) fails.push("barra do celular sem Experiências e Apresentação à vista: " + JSON.stringify(d));
  await page.click('#carousel .uc[data-i="0"]', { label: "cartão Brisa 06" }); await page.waitForTimeout(1200);
  const h = await page.evaluate(() => [getComputedStyle(document.querySelector(".bar")).opacity, getComputedStyle(document.getElementById("sunchip")).opacity]);
  if (h[0] !== "0" || h[1] !== "0") fails.push("cabeçalho continua sobre a ficha no celular: " + h);
  await page.screenshot({ path: "D:/Projetos/Planta Interativa/app/tests/out/m-ficha-limpa.png" });
  await page.keyboard.press("Escape"); await page.waitForTimeout(800);
  const back = await page.evaluate(() => getComputedStyle(document.querySelector(".bar")).opacity);
  if (back !== "1") fails.push("cabeçalho não voltou ao fechar a ficha: " + back);
  const errs = await page.evaluate(() => window.__errs || []);
  if (errs.length) fails.push("erros: " + errs.join(" | "));
} finally {
  await page.cdp("Emulation.clearDeviceMetricsOverride").catch(() => {});
  await page.cdp("Emulation.setTouchEmulationEnabled", { enabled: false }).catch(() => {});
  await t.cleanup();
}
verdict(fails, "ACABAMENTO OK");
