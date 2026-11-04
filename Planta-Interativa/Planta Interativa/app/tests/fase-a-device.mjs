// A5 (aparelho): sem WebGL. Não tenta 3D sozinho; ao pedir, o aviso culpa o aparelho (não a rede) e volta ao 2D limpo.
const { open, state, waitUntil, verdict } = await import("file:///D:/Projetos/Planta%20Interativa/app/tests/ego-lib.mjs");
const fails = [];
const t = await open("fase-a device", { noWebGL: true });
try {
  const { page } = t;
  await page.waitForTimeout(5000);
  let s = await state(page);
  if (s.is3d || s.pressed !== "false" || s.msg) fails.push("boot sem WebGL não ficou quieto no 2D: " + JSON.stringify(s));
  await page.click('.view-seg [data-v="3d"]', { label: "pedir relevo 3D" });
  s = await waitUntil(page, x => /aparelho/i.test(x.msg), 15000);
  if (!/aparelho/i.test(s.msg)) fails.push(`aviso não fala do aparelho: "${s.msg}"`);
  if (/conex/i.test(s.msg)) fails.push("aviso culpa a conexão");
  s = await waitUntil(page, x => !x.msg && !x.is3d, 6000);
  if (s.is3d || s.pressed !== "false" || s.canvases !== 0) fails.push("não voltou ao 2D limpo: " + JSON.stringify(s));
  if (s.errs.length) fails.push("erros na página: " + s.errs.join(" | "));
} finally { await t.cleanup(); }
verdict(fails, "FASE-A-DEVICE OK");
