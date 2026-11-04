// Utilitários dos testes de navegador (rodam dentro de `ego-browser nodejs`, que fornece taskSpace).
export const URL_APP = "http://127.0.0.1:8766/index.html";

// Abre uma página limpa com captura de erros e as condições pedidas.
// opts: { block: [padrões de URL], slow: bytes por segundo, noWebGL2: bool, noWebGL: bool }
export async function open(name, opts = {}) {
  const ping = await fetch(URL_APP).catch(() => null);
  if (!ping || !ping.ok) throw new Error("servidor de teste fora do ar em " + URL_APP);
  const task = await taskSpace(name);
  const page = task.page("p1");
  // janela minimizada não tira screenshot nem roda animação
  const { windowId } = await page.cdp("Browser.getWindowForTarget");
  await task.cdp("Browser.setWindowBounds", { windowId, bounds: { windowState: "normal" } });
  await page.goto("about:blank");
  await page.cdp("Network.enable");
  await page.cdp("Network.setCacheDisabled", { cacheDisabled: true });
  await page.cdp("Network.setBlockedURLs", { urls: opts.block || [] });
  await page.cdp("Network.emulateNetworkConditions", opts.slow
    ? { offline: false, latency: 150, downloadThroughput: opts.slow, uploadThroughput: 90000 }
    : { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  const pre = [
    "window.__errs=[];addEventListener('error',e=>{if(e.message)__errs.push(e.message)});addEventListener('unhandledrejection',e=>__errs.push(String(e.reason&&e.reason.message||e.reason)));",
  ];
  if (opts.date) { // relógio fixo (o sol "Hoje" depende da data)
    pre.push(`{const F=new Date(${JSON.stringify(opts.date)}).getTime(),O=Date;class D extends O{constructor(...a){super(...(a.length?a:[F]))}static now(){return F}}window.Date=D}`);
  }
  if (opts.noWebGL || opts.noWebGL2) {
    const kinds = opts.noWebGL ? "/^(webgl|webgl2|experimental-webgl)$/" : "/^webgl2$/";
    pre.push(`{const g=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...a){return ${kinds}.test(t)?null:g.call(this,t,...a)}}`);
  }
  const { identifier } = await page.cdp("Page.addScriptToEvaluateOnNewDocument", { source: pre.join("\n") });
  await page.goto(URL_APP, { timeout: 120000 });
  return { task, page, async cleanup() {
    await page.cdp("Page.removeScriptToEvaluateOnNewDocument", { identifier }).catch(() => {});
    await page.cdp("Network.setBlockedURLs", { urls: [] }).catch(() => {});
    await page.cdp("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 }).catch(() => {});
    await page.cdp("Network.setCacheDisabled", { cacheDisabled: false }).catch(() => {});
    await task.finish({ keep: [] });
  } };
}

// Estado do 3D visto de fora (sem depender de variáveis internas).
export const state = page => page.evaluate(() => {
  const b = document.querySelector('.view-seg [data-v="3d"]'), m = document.getElementById("v3msg"), v = document.getElementById("v3d");
  return {
    is3d: document.body.classList.contains("is3d"),
    pressed: b.getAttribute("aria-pressed"),
    msg: m && !m.hidden && v && !v.hidden ? m.textContent : "",
    canvases: v ? v.querySelectorAll("canvas").length : 0,
    errs: window.__errs || [],
  };
});

export async function waitUntil(page, fn, ms, step = 250) {
  const t0 = Date.now();
  for (;;) { const s = await state(page); if (fn(s)) return s; if (Date.now() - t0 > ms) return s; await page.waitForTimeout(step); }
}

export function verdict(fails, marker) {
  if (fails.length) { console.log("FALHOU:\n- " + fails.join("\n- ")); throw new Error("teste falhou"); }
  console.log(marker);
}

// Abre o painel do menu ("unidades" | "ajustes") se ainda estiver fechado. mob = botão do dock no celular.
export async function openPanel(page, name, mob = false) {
  if (await page.evaluate(n => !document.getElementById("p-" + n).hidden, name)) return;
  await page.click(`${mob ? ".dock" : ".controls"} [data-panel="${name}"]`, { label: "abrir " + name });
  await page.waitForTimeout(250);
}
