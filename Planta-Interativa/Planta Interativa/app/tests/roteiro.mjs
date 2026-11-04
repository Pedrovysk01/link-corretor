// Roteiro do comprador: percorre o mapa e grava uma "impressão digital" do que aparece na tela.
// Serve de regressão: o resultado de agora é comparado com tests/baseline/roteiro.json (compara-roteiro.mjs).
// Grava em tests/out/roteiro.json e screenshots tests/out/*.png.
const { open, verdict, openPanel } = await import("file:///D:/Projetos/Planta%20Interativa/app/tests/ego-lib.mjs");
const fs = await import("node:fs/promises");
const OUT = "D:/Projetos/Planta Interativa/app/tests/out/";
await fs.mkdir(OUT, { recursive: true });
const R = {};
const fails = [];
const norm = s => (s || "").replace(/\s+/g, " ").trim();

const snap = (page) => page.evaluate(() => {
  const n = s => (s || "").replace(/\s+/g, " ").trim();
  const vis = e => !!e && !e.hidden && e.getBoundingClientRect().width > 0;
  const tf = e => (e?.style.transform || "").replace(/-?\d+\.\d+/g, m => String(Math.round(+m)));
  return {
    pins: [...document.querySelectorAll("#pins .pin")].map(p => [p.textContent, p.hidden, tf(p)]),
    world: tf(document.getElementById("world")),
    card: vis(document.getElementById("card")) ? n(document.getElementById("card").innerText).slice(0, 900) : null,
    sun: n([...(document.getElementById("suninfo") || document.getElementById("sunbox")).querySelectorAll("text,b,span")].map(e => e.textContent).join(" ")), // detalhe do sol (desde a legenda compacta, fica na janela de informações)
    filter: document.getElementById("img").style.filter,
    shadows: document.querySelectorAll("#shadows polygon").length,
    night: document.getElementById("nightLights").getAttribute("opacity"),
    veil: document.getElementById("veil").getAttribute("opacity"),
    chips: [...document.querySelectorAll(".controls button, .dock button, .panel button, .view-seg button")].map(b => n(b.textContent) + ":" + (b.getAttribute("aria-pressed") ?? "-")),
    is3d: document.body.classList.contains("is3d"),
    errs: window.__errs || [],
  };
});
const tick = ms => new Promise(r => setTimeout(r, ms));

// ---------- desktop, só 2D (sem WebGL: resultado determinístico) ----------
{
  const t = await open("roteiro 2d", { noWebGL: true, date: "2026-11-03T10:00:00-03:00" });
  const { page } = t;
  try {
    await page.cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await page.reload(); await page.waitForTimeout(3500);
    R.boot = await page.evaluate(() => ({ title: document.title, lang: document.documentElement.lang, stats: document.querySelector(".legend").innerText.replace(/\s+/g, " ") }));
    R.inicio = await snap(page);
    await page.screenshot({ path: OUT + "d-inicio.png" });
    R.luzes = {};
    await openPanel(page, "ajustes");
    for (const l of ["Manhã", "Meio-dia", "Tarde", "Pôr do sol", "Noite"]) {
      await page.click(`#p-ajustes [data-lights] button:text-is("${l}")`, { label: "luz " + l });
      await page.waitForTimeout(300);
      const s = await snap(page); R.luzes[l] = { sun: s.sun, filter: s.filter, shadows: s.shadows, night: s.night };
    }
    await page.click(`#p-ajustes [data-lights] button:text-is("Meio-dia")`, { label: "meio-dia" });
    await page.click(`.legend [data-act="only"]`, { label: "só disponíveis" });
    await page.waitForTimeout(300); R.so = (await snap(page)).veil;
    await page.click(`.legend [data-act="only"]`, { label: "todas" });
    // enquadramentos (pula o filme com Esc)
    R.views = {};
    for (const v of ["Lago", "Brisa", "Geral"]) {
      if (v === "Geral") await page.click('.controls [data-view="geral"]', { label: "vista Geral" });
      else { await openPanel(page, "unidades"); await page.click(`#p-unidades [data-zones] button:text-is("${v}")`, { label: "vista " + v }); }
      await page.waitForTimeout(900);
      const film = await page.evaluate(() => !document.getElementById("cine").hidden ? document.getElementById("ct").textContent : null);
      await page.keyboard.press("Escape"); await page.waitForTimeout(1400);
      R.views[v] = { film, world: (await snap(page)).world };
    }
    // ficha disponível
    await page.click('#pins .pin:text-is("Brisa 06")', { label: "ficha Brisa 06" });
    await page.waitForTimeout(1500);
    R.fichaBrisa = (await snap(page)).card;
    await page.screenshot({ path: OUT + "d-ficha.png" });
    await page.click('[data-step="1"]', { label: "próxima disponível" }); await page.waitForTimeout(800);
    R.proxima = await page.evaluate(() => document.querySelector("#card h2")?.textContent);
    // planta ampliada
    await page.click("[data-popen]", { label: "ampliar planta" }); await page.waitForTimeout(600);
    R.planta = await page.evaluate(() => ({ open: !document.getElementById("pv").hidden, t: document.getElementById("pvt").textContent, k: document.getElementById("pvk").textContent, tabs: document.getElementById("pvtabs").children.length }));
    await page.keyboard.press("Escape"); await page.waitForTimeout(300);
    await page.click('button[aria-label="Fechar ficha"]', { label: "fechar ficha" }); await page.waitForTimeout(1200);
    // casa vendida e área comum pelo teclado
    for (const [k, name] of [["vendida", "Lago A 05, vendida"], ["area", "Lago Bossa: ver detalhes"]]) {
      await page.focus(`g[aria-label="${name}"]`); await page.keyboard.press("Enter"); await page.waitForTimeout(1300);
      R[k] = (await snap(page)).card;
      await page.keyboard.press("Escape"); await page.waitForTimeout(1200);
    }
    // assinatura
    await openPanel(page, "ajustes"); await page.click("#authlink", { label: "assinatura" }); await page.waitForTimeout(500);
    R.auth = await page.evaluate(() => ({ open: !document.getElementById("auth").hidden, h: document.querySelector("#auth h2").textContent }));
    await page.keyboard.press("Escape"); await page.waitForTimeout(400);
    // experiências
    await page.click(`.controls [data-act="exp"]`, { label: "experiências" }); await page.waitForTimeout(800);
    R.exp = await page.evaluate(() => [...document.querySelectorAll("#grid .tile")].map(t => t.getAttribute("aria-label")));
    await page.click('#grid .tile[data-i="0"]', { label: "abrir experiência" }); await page.waitForTimeout(1200);
    R.lb = await page.evaluate(() => ({ k: document.getElementById("lbk").textContent, t: document.getElementById("lbt").textContent, thumbs: document.getElementById("lbthumbs").children.length, dots: document.getElementById("lbdots").children.length }));
    await page.keyboard.press("Escape"); await page.waitForTimeout(600);
    await page.keyboard.press("Escape"); await page.waitForTimeout(400);
    R.fim2d = await snap(page);
    if (R.fim2d.errs.length) fails.push("erros 2D: " + R.fim2d.errs.join(" | "));
  } finally { await page.cdp("Emulation.clearDeviceMetricsOverride").catch(() => {}); await t.cleanup(); }
}

// ---------- celular em pé, só 2D ----------
{
  const t = await open("roteiro mob", { noWebGL: true, date: "2026-11-03T10:00:00-03:00" });
  const { page } = t;
  try {
    await page.cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await page.cdp("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
    await page.reload(); await page.waitForTimeout(3500);
    const s = await snap(page);
    R.mob = { world: s.world, pins: s.pins, carrossel: await page.evaluate(() => [...document.querySelectorAll("#carousel .uc")].map(b => b.innerText.replace(/\s+/g, " ").trim())), chip: await page.evaluate(() => document.getElementById("sunchip").innerText.replace(/\s+/g, " ")) };
    await page.screenshot({ path: OUT + "m-inicio.png" });
    await page.click('#carousel .uc[data-i="0"]', { label: "cartão Brisa 06" }); await page.waitForTimeout(1500);
    R.mobFicha = await page.evaluate(() => document.querySelector("#card h2")?.textContent);
    await page.screenshot({ path: OUT + "m-ficha.png" });
    const e = (await snap(page)).errs; if (e.length) fails.push("erros celular: " + e.join(" | "));
  } finally {
    await page.cdp("Emulation.clearDeviceMetricsOverride").catch(() => {});
    await page.cdp("Emulation.setTouchEmulationEnabled", { enabled: false }).catch(() => {});
    await t.cleanup();
  }
}

// ---------- desktop com 3D ----------
{
  const t = await open("roteiro 3d", { date: "2026-11-03T10:00:00-03:00" });
  const { page } = t;
  try {
    await page.cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await page.reload();
    for (let i = 0; i < 60 && !(await snap(page)).is3d; i++) await tick(500);
    await page.waitForTimeout(2500);
    const s = await snap(page);
    R.d3 = { is3d: s.is3d, pinsVisiveis: s.pins.filter(p => !p[1]).map(p => p[0]).sort() };
    await page.screenshot({ path: OUT + "d-3d.png" });
    await page.click('#pins .pin:text-is("Lago B 02")', { label: "ficha Lago B 02" }); await page.waitForTimeout(1800);
    R.d3.ficha = await page.evaluate(() => document.querySelector("#card h2")?.textContent);
    await page.keyboard.press("Escape"); await page.waitForTimeout(800);
    await openPanel(page, "ajustes"); await page.click(`#p-ajustes [data-lights] button:text-is("Noite")`, { label: "noite" }); await page.waitForTimeout(600);
    R.d3.luz = await page.evaluate(() => document.getElementById("v3d").dataset.l);
    await page.click('.view-seg [data-v="2d"]', { label: "voltar ao 2D" }); await page.waitForTimeout(1200);
    const f = await snap(page);
    R.d3.volta = { is3d: f.is3d, pressed: f.chips.filter(c => c.startsWith("Visão 3D")) };
    if (f.errs.length) fails.push("erros 3D: " + f.errs.join(" | "));
  } finally { await page.cdp("Emulation.clearDeviceMetricsOverride").catch(() => {}); await t.cleanup(); }
}

await fs.writeFile(OUT + "roteiro.json", JSON.stringify(R, null, 1));
verdict(fails, "ROTEIRO GRAVADO");
