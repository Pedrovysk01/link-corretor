// B1: editar só o JSON muda o mapa. Serve um units.json alterado (Lago A 05 disponível por R$ 4.000.000) e confere contagem, pin e ficha.
const { open, verdict } = await import("file:///D:/Projetos/Planta%20Interativa/app/tests/ego-lib.mjs");
const fails = [];
const base = await (await fetch("http://127.0.0.1:8766/data/units.json")).json();
base.available["Lago A-5"] = 4000000;
const body = Buffer.from(JSON.stringify(base)).toString("base64");

const t = await open("fase-b dados", { noWebGL: true });
const { page } = t;
try {
  await page.goto("about:blank");
  await page.cdp("Fetch.enable", { patterns: [{ urlPattern: "*data/units.json*" }] });
  await page.events(); // limpa o buffer
  const nav = page.goto("http://127.0.0.1:8766/index.html", { timeout: 60000 }).catch(e => fails.push("navegação: " + e.message));
  let served = 0;
  for (let i = 0; i < 80 && !served; i++) {
    for (const ev of await page.events()) {
      if (ev.method === "Fetch.requestPaused") {
        await page.cdp("Fetch.fulfillRequest", { requestId: ev.params.requestId, responseCode: 200, responseHeaders: [{ name: "Content-Type", value: "application/json" }], body });
        served++;
      }
    }
    if (!served) await page.waitForTimeout(100);
  }
  await nav;
  // pode haver uma segunda requisição (preload + fetch); atende o que restar
  await page.waitForTimeout(500);
  for (const ev of await page.events()) if (ev.method === "Fetch.requestPaused") await page.cdp("Fetch.fulfillRequest", { requestId: ev.params.requestId, responseCode: 200, responseHeaders: [{ name: "Content-Type", value: "application/json" }], body });
  await page.cdp("Fetch.disable");
  if (!served) fails.push("units.json não passou pela interceptação");
  await page.waitForTimeout(2500);
  const s = await page.evaluate(() => ({ stats: document.querySelector(".legend").innerText.replace(/\s+/g, " "), pins: [...document.querySelectorAll("#pins .pin")].map(p => p.textContent), errs: window.__errs || [] }));
  if (!/4\s+disponíveis/.test(s.stats) || !/39\s+vendidas/.test(s.stats)) fails.push("contagem não mudou: " + s.stats);
  if (!s.pins.includes("Lago A 05")) fails.push("sem pin Lago A 05: " + s.pins.join(", "));
  if (s.pins.includes("Lago A 05")) {
    await page.click('#pins .pin:text-is("Lago A 05")', { label: "ficha Lago A 05" });
    await page.waitForTimeout(1500);
    const c = await page.evaluate(() => document.getElementById("card").innerText.replace(/\s+/g, " "));
    if (!/Lago A 05/.test(c) || !/Disponível/i.test(c) || !/R\$\s?4\.000\.000,00/.test(c)) fails.push("ficha não reflete o JSON: " + c.slice(0, 200));
  }
  if (s.errs.length) fails.push("erros: " + s.errs.join(" | "));
} finally { await page.cdp("Fetch.disable").catch(() => {}); await t.cleanup(); }
verdict(fails, "FASE-B-DADOS OK");
