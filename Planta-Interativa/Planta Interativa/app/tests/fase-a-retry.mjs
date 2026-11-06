// A1 + A5 (rede): textura do 3D bloqueada. O boot falha calado; cada clique falha com aviso de conexão e não deixa canvas para trás.
const { open, state, waitUntil, verdict } = await import("file:///D:/Projetos/Planta%20Interativa/app/tests/ego-lib.mjs");
const fails = [];
const t = await open("fase-a retry", { block: ["*render-tex.webp*", "*render-full.webp*"] });
try {
  const { page } = t;
  await page.waitForTimeout(9000); // boot + tentativa automática em segundo plano
  let s = await state(page);
  if (s.msg) fails.push("boot automático mostrou aviso: " + s.msg);
  if (s.is3d || s.pressed !== "false") fails.push("boot ficou em 3D ou com botão marcado");
  if (s.canvases !== 0) fails.push("boot deixou " + s.canvases + " canvas após falhar");
  for (const n of [1, 2]) {
    await page.click('.view-seg [data-v="3d"]', { label: "pedir relevo 3D" });
    s = await waitUntil(page, x => /conex/i.test(x.msg), 15000);
    if (!/conex/i.test(s.msg)) fails.push(`tentativa ${n}: aviso não fala de conexão: "${s.msg}"`);
    if (/aparelho/i.test(s.msg)) fails.push(`tentativa ${n}: aviso culpa o aparelho`);
    if (s.canvases !== 0) fails.push(`tentativa ${n}: ${s.canvases} canvas sobrando`);
    s = await waitUntil(page, x => !x.msg && !x.is3d, 6000);
    if (s.is3d || s.pressed !== "false") fails.push(`tentativa ${n}: não voltou ao 2D com botão desmarcado`);
  }
  s = await state(page);
  if (s.errs.length) fails.push("erros na página: " + s.errs.join(" | "));
} finally { await t.cleanup(); }
verdict(fails, "FASE-A-RETRY OK");
