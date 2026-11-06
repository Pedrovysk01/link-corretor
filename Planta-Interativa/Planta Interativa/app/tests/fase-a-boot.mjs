// A3 + A4: boot em rede lenta. Enquanto o 3D sobe sozinho, nada de aviso e botão desmarcado.
// Pedido do usuário durante a montagem mostra o aviso e não cancela. Depois: ficha e volta ao 2D sem erros.
const { open, state, waitUntil, verdict } = await import("file:///D:/Projetos/Planta%20Interativa/app/tests/ego-lib.mjs");
const fails = [];
const BTN = '.view-seg [data-v="3d"]';
const t = await open("fase-a boot", { slow: 500000 });
try {
  const { page } = t;
  // 4 s olhando o boot automático
  for (let i = 0; i < 16; i++) {
    const s = await state(page);
    if (s.is3d) break;
    if (s.pressed !== "false") { fails.push("botão 3D marcado ainda no 2D"); break; }
    if (s.msg) { fails.push("aviso visível no boot automático: " + s.msg); break; }
    await page.waitForTimeout(250);
  }
  let s = await state(page);
  if (!s.is3d) {
    await page.click(BTN, { label: "pedir relevo 3D" });
    await page.waitForTimeout(400);
    s = await state(page);
    if (!s.is3d && !/montando/i.test(s.msg)) fails.push("pedido do usuário sem aviso de montagem: " + JSON.stringify(s));
    if (!s.is3d && s.pressed !== "true") fails.push("pedido do usuário não marcou o botão");
  } else fails.push("3D ficou pronto rápido demais para testar a montagem (rede lenta não aplicada?)");
  s = await waitUntil(page, x => x.is3d, 90000, 500);
  if (!s.is3d) fails.push("3D não abriu em 90 s após o pedido");
  if (s.pressed !== "true") fails.push("3D na tela com botão desmarcado");
  if (s.msg) fails.push("aviso continuou depois do 3D pronto: " + s.msg);
  if (s.canvases !== 1) fails.push("canvas no 3D: " + s.canvases);
  // regressão rápida: ficha e volta ao 2D
  await page.click('button.pin:text-is("Brisa 06")', { label: "abrir ficha Brisa 06" });
  await page.waitForSelector('button[aria-label="Fechar ficha"]', { state: "visible", timeout: 8000 }).catch(() => fails.push("ficha não abriu"));
  await page.keyboard.press("Escape");
  await page.click('.view-seg [data-v="2d"]', { label: "voltar ao 2D" });
  s = await waitUntil(page, x => !x.is3d, 5000);
  if (s.is3d || s.pressed !== "false") fails.push("não voltou ao 2D com botão desmarcado");
  if (s.errs.length) fails.push("erros na página: " + s.errs.join(" | "));
} finally { await t.cleanup(); }
verdict(fails, "FASE-A-BOOT OK");
