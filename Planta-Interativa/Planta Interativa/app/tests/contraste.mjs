// Contraste de texto (WCAG AA: 4,5 para texto pequeno, 3 para grande) nas telas principais.
// Fundo = primeiro ancestral com fundo ≥ 50% opaco; texto direto sobre foto/render não entra (precisa de olho).
const { open, verdict, openPanel } = await import("file:///D:/Projetos/Planta%20Interativa/app/tests/ego-lib.mjs");
const fails = [];
const scan = page => page.evaluate(() => {
  const parse = c => (c.match(/[\d.]+/g) || [0, 0, 0, 0]).map(Number);
  const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4) }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b) };
  const bgOf = e => { for (let p = e; p; p = p.parentElement) { const c = parse(getComputedStyle(p).backgroundColor); if ((c.length > 3 ? c[3] : 1) >= .5) return c } return null };
  const out = [], seen = new Set();
  for (const e of document.querySelectorAll("body *")) {
    if (e.children.length || !e.textContent.trim() || e.closest("svg")) continue;
    const r = e.getBoundingClientRect(); if (!r.width || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;
    const s = getComputedStyle(e); if (s.visibility === "hidden" || +s.opacity < .1) continue;
    let o = 1; for (let p = e; p; p = p.parentElement) o *= +getComputedStyle(p).opacity; if (o < .5) continue; // atrás de transição de saída
    const bg = bgOf(e); if (!bg) continue;
    const fg = parse(s.color), a = fg.length > 3 ? fg[3] : 1, mix = fg.slice(0, 3).map((v, i) => v * a + bg[i] * (1 - a));
    const L1 = lum(mix), L2 = lum(bg), cr = (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05);
    const size = parseFloat(s.fontSize), bold = +s.fontWeight >= 600, need = (size >= 24 || (size >= 18.66 && bold)) ? 3 : 4.5;
    const k = e.textContent.trim().slice(0, 28); if (cr < need && !seen.has(k)) { seen.add(k); out.push(`"${k}" ${cr.toFixed(2)} (${size}px)`) }
  }
  return out;
});
const t = await open("contraste", { noWebGL: true });
const { page } = t;
try {
  await page.cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await page.reload(); await page.waitForTimeout(3000);
  const check = async name => { const r = await scan(page); if (r.length) fails.push(`${name}: ${r.join(" · ")}`) };
  await check("início");
  await page.click('#pins .pin:text-is("Brisa 06")', { label: "ficha" }); await page.waitForTimeout(1500);
  await check("ficha disponível");
  await page.keyboard.press("Escape"); await page.waitForTimeout(800);
  await page.focus('g[aria-label="Lago A 05, vendida"]'); await page.keyboard.press("Enter"); await page.waitForTimeout(1300);
  await check("ficha vendida");
  await page.keyboard.press("Escape"); await page.waitForTimeout(800);
  await openPanel(page, "ajustes"); await check("painel ajustes");
  await page.click('#p-ajustes [data-light="noite"]', { label: "noite" }); await page.waitForTimeout(600);
  await check("noite (painel aberto)");
  await page.keyboard.press("Escape"); await page.waitForTimeout(300);
  await openPanel(page, "unidades"); await check("painel unidades");
  await page.keyboard.press("Escape"); await page.waitForTimeout(300);
  await page.click("#infobtn", { label: "informações" }); await page.waitForTimeout(500);
  await check("informações");
  await page.keyboard.press("Escape"); await page.waitForTimeout(400);
  await page.cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await page.reload(); await page.waitForTimeout(3000);
  await check("celular");
} finally { await page.cdp("Emulation.clearDeviceMetricsOverride").catch(() => {}); await t.cleanup(); }
verdict(fails, "CONTRASTE OK");
