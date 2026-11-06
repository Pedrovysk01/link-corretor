// Materiais: o que cada perfil vê, folha do espelho/tabela, sem emoji e sem rolagem lateral no celular (390 px).
const { open, verdict } = await import("file:///D:/Projetos/Planta%20Interativa/app/tests/ego-lib.mjs");
const fails = [];
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2B50}\u{2B06}\u{2194}-\u{21AA}]/u;
const APP = "http://127.0.0.1:8766/index.html";
const t = await open("materiais", { noWebGL: true });
const { page } = t;
const go = async q => { await page.goto(`${APP}?${q}`, { timeout: 120000 }); await page.waitForTimeout(1200); };
const texto = () => page.evaluate(() => document.getElementById("p-materiais").innerText);
try {
  await page.cdp("Emulation.setDeviceMetricsOverride", { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
  // corretor: Espelho e Tabela, com Encaminhar no book
  await go("perfil=corretor&nome=Ana&g=f");
  await page.click('.controls [data-panel="materiais"]', { label: "abrir Materiais" }); await page.waitForTimeout(300);
  let tx = await texto();
  for (const k of ["Book do empreendimento", "Espelho de Vendas", "Tabela de Preços", "WhatsApp"]) if (!tx.includes(k)) fails.push(`corretor não vê "${k}"`);
  if (tx.includes("Preços das unidades")) fails.push("corretor vê o cartão do cliente");
  await page.click('#p-materiais [data-id="espelho"][data-mt="open"]', { label: "abrir espelho" }); await page.waitForTimeout(500);
  const esp = await page.evaluate(() => ({ cells: document.querySelectorAll("#matbody .mt-cell").length, avail: document.querySelectorAll('#matbody .mt-cell[data-s="d"]').length }));
  if (esp.cells !== 43) fails.push(`espelho com ${esp.cells} células (esperado 43)`);
  if (esp.avail !== 3) fails.push(`espelho com ${esp.avail} disponíveis (esperado 3)`);
  await page.keyboard.press("Escape"); await page.waitForTimeout(400);
  if (!await page.evaluate(() => document.getElementById("matsheet").hidden)) fails.push("Esc não fechou a folha");
  await page.click('.controls [data-panel="materiais"]', { label: "abrir Materiais" }); await page.waitForTimeout(300);
  await page.click('#p-materiais [data-id="tabela"][data-mt="open"]', { label: "abrir tabela" }); await page.waitForTimeout(500);
  const tab = await page.evaluate(() => ({ rows: document.querySelectorAll("#matbody tbody tr").length, cols: document.querySelectorAll("#matbody thead th").length }));
  if (tab.rows !== 43 || tab.cols !== 11) fails.push(`tabela ${tab.rows}x${tab.cols} (esperado 43x11)`);
  if (EMOJI.test(await page.evaluate(() => document.body.innerText + document.body.innerHTML))) fails.push("emoji na página (corretor)");
  // cliente: sem Espelho/Tabela, com preços só das disponíveis; toque abre a ficha
  await go("perfil=cliente&nome=Paulo&g=m");
  await page.click('.controls [data-panel="materiais"]', { label: "abrir Materiais" }); await page.waitForTimeout(300);
  tx = await texto();
  if (tx.includes("Espelho") || tx.includes("Tabela de Preços")) fails.push("cliente vê Espelho/Tabela");
  if (tx.includes("WhatsApp") || tx.includes("Encaminhar")) fails.push("cliente vê Encaminhar");
  if (!tx.includes("Preços das unidades") || !tx.includes("Book")) fails.push("cliente sem Book ou Preços");
  await page.click('#p-materiais [data-id="precos"][data-mt="open"]', { label: "abrir preços" }); await page.waitForTimeout(500);
  const pr = await page.evaluate(() => [...document.querySelectorAll("#matbody .mt-price")].map(b => b.innerText.replace(/\s+/g, " ")));
  if (pr.length !== 3 || pr.some(x => !/R\$\s?[\d.]+,\d\d/.test(x))) fails.push("preços do cliente: " + JSON.stringify(pr));
  if (await page.evaluate(() => /Entrada|Mensais|Chaves/.test(document.getElementById("matbody").innerText))) fails.push("cliente vê o fluxo de pagamento");
  await page.click("#matbody .mt-price", { label: "abrir ficha" }); await page.waitForTimeout(800);
  if (!await page.evaluate(() => document.body.classList.contains("cardopen") && document.getElementById("matsheet").hidden)) fails.push("tocar no preço não abriu a ficha");
  // celular 390 px: sem rolagem lateral e a lista de materiais aparece em "Mais"
  await page.cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await go("perfil=corretor&nome=Ana&g=f");
  await page.click('.dock [data-panel="ajustes"]', { label: "abrir Mais" }); await page.waitForTimeout(300);
  if (!(await page.evaluate(() => document.getElementById("mt-mob").innerText)).includes("Book do empreendimento")) fails.push("celular: Materiais não está em Mais");
  const ov = async n => { const o = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (o > 0) fails.push(`celular: ${n} com ${o}px de rolagem lateral`); };
  await ov("painel Mais");
  const lab = await page.evaluate(() => [...document.querySelectorAll(".dock .chip span")].map(s => s.scrollWidth > s.parentElement.clientWidth));
  if (lab.some(Boolean)) fails.push("celular: rótulo cortado na tab bar");
  await page.click('#mt-mob [data-id="espelho"][data-mt="open"]', { label: "abrir espelho" }); await page.waitForTimeout(500); await ov("espelho");
  await page.keyboard.press("Escape"); await page.waitForTimeout(400);
  await page.click('.dock [data-panel="ajustes"]', { label: "abrir Mais" }); await page.waitForTimeout(300);
  await page.click('#mt-mob [data-id="tabela"][data-mt="open"]', { label: "abrir tabela" }); await page.waitForTimeout(500); await ov("tabela");
  await page.screenshot({ path: "D:/Projetos/Planta Interativa/app/tests/out/materiais-390.png" });
} finally { await page.cdp("Emulation.clearDeviceMetricsOverride").catch(() => {}); await t.cleanup(); }
verdict(fails, "MATERIAIS OK");
