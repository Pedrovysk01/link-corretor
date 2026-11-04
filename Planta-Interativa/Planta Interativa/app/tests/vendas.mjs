// Protótipos de venda: proposta com assinatura do corretor, modo cliente (tenho interesse), assistente de dúvidas
// em PT/EN/ES com respostas do material, link direto da casa e compartilhar. Esc fecha só o que está por cima.
const { open, verdict } = await import("file:///D:/Projetos/Planta%20Interativa/app/tests/ego-lib.mjs");
const fails = [];
const URL0 = "http://127.0.0.1:8766/index.html";
const q = (page, fn) => page.evaluate(fn);
const lastBot = page => q(page, () => [...document.querySelectorAll("#ailog .msg.bot")].pop()?.textContent || "");
const t = await open("vendas", { noWebGL: true, date: "2026-11-03T10:00:00-03:00" });
const { page } = t;
try {
  await page.cdp("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await page.reload(); await page.waitForTimeout(2500);
  // ficha disponível: botões no pé e link da casa
  await page.click('#pins .pin:text-is("Brisa 06")', { label: "ficha Brisa 06" }); await page.waitForTimeout(1500);
  let s = await q(page, () => { const c = document.querySelector("#card .cta"), cr = c?.getBoundingClientRect(), kr = document.getElementById("card").getBoundingClientRect();
    return { txt: c?.innerText.replace(/\s+/g, " ") + (c?.querySelector('[data-cta="ai"]')?.getAttribute("aria-label") === "Tirar dúvidas" ? " Tirar dúvidas" : ""), vis: !!c && cr.bottom <= kr.bottom + 1 && cr.top >= kr.top, hash: location.hash } });
  if (!/Enviar proposta/.test(s.txt) || !/Tirar dúvidas/.test(s.txt)) fails.push("ficha sem Enviar proposta / Tirar dúvidas: " + s.txt);
  if (!s.vis) fails.push("botões da ficha não ficam visíveis no pé");
  if (s.hash !== "#brisa-06") fails.push("link da casa não foi para a barra de endereço: " + s.hash);
  // proposta
  await page.click('#card [data-cta="proposta"]', { label: "enviar proposta" }); await page.waitForTimeout(500);
  s = await q(page, () => { const d = document.getElementById("proposta"); return { open: !d.hidden, txt: d.textContent.replace(/\s+/g, " "), focus: d.contains(document.activeElement) } });
  if (!s.open || !s.focus) fails.push("proposta não abriu com o foco dentro");
  if (!/R\$\s?3\.861\.225,28/.test(s.txt) || !/Assinada digitalmente por/.test(s.txt) || !/em breve/i.test(s.txt)) fails.push("proposta sem valor, assinatura ou aviso de em breve");
  await page.fill('#proposta [name="nome"]', "Cliente <b>Teste</b>");
  await page.fill('#proposta [name="email"]', "cliente@exemplo.com"); await page.fill('#proposta [name="tel"]', "(82) 99999-1234");
  await page.click('#proposta [data-pp="gerar"]', { label: "gerar proposta" }); await page.waitForTimeout(300);
  s = await q(page, () => ({ done: document.querySelector("#proposta .pp-done")?.textContent || "", injected: !!document.querySelector("#proposta .pp-done b b"),
    wa: document.querySelector("#proposta .pp-share a[href*='wa.me']")?.getAttribute("href") || "", mail: document.querySelector("#proposta .pp-share a[href^='mailto:']")?.getAttribute("href") || "" }));
  if (!/demonstração/.test(s.done) || !/Cliente <b>Teste<\/b>/.test(s.done) || s.injected) fails.push("confirmação da proposta errada ou nome do cliente interpretado como HTML: " + s.done);
  const waTxt = decodeURIComponent(s.wa.split("text=")[1] || ""), mailBody = decodeURIComponent(s.mail.split("body=")[1] || "");
  if (!s.wa.startsWith("https://wa.me/5582999991234?") || !/Brisa 06/.test(waTxt) || !/3\.861\.225,28/.test(waTxt) || !/Assinada digitalmente/.test(waTxt) || !/#brisa-06/.test(waTxt)) fails.push("WhatsApp da proposta sem número, casa, valor, assinatura ou link: " + s.wa.slice(0, 120));
  if (!s.mail.startsWith("mailto:cliente%40exemplo.com?") || !/Brisa 06/.test(mailBody)) fails.push("e-mail da proposta errado: " + s.mail.slice(0, 120));
  await page.keyboard.press("Escape"); await page.waitForTimeout(400);
  s = await q(page, () => ({ prop: !document.getElementById("proposta").hidden, card: !document.getElementById("card").hidden }));
  if (s.prop || !s.card) fails.push("Esc devia fechar só a proposta e manter a ficha");
  // assistente de dúvidas
  await page.click('#card [data-cta="ai"]', { label: "tirar dúvidas" }); await page.waitForTimeout(400);
  s = await q(page, () => ({ open: !document.getElementById("ai").hidden, ctx: document.getElementById("aictx").textContent, r: document.getElementById("ai").getBoundingClientRect().right, card: document.getElementById("card").getBoundingClientRect().left }));
  if (!s.open || s.ctx !== "Brisa 06") fails.push("assistente não abriu no contexto da casa: " + JSON.stringify(s));
  if (s.r > s.card) fails.push("assistente cobre a ficha");
  await page.click('#aisug button:text-is("Qual a metragem da piscina?")', { label: "sugestão piscina" }); await page.waitForTimeout(900);
  let a = await lastBot(page);
  if (!/Brisa 06/.test(a) || !/piscina/i.test(a)) fails.push("resposta da piscina sem a casa: " + a);
  await page.fill("#aiq", "tem heliporto?"); await page.press("#aiq", "Enter"); await page.waitForTimeout(900);
  a = await lastBot(page); if (!/não consta/.test(a)) fails.push("heliporto devia ser 'não consta' (sem inventar): " + a);
  await page.fill("#aiq", "qual o potencial de valorização?"); await page.press("#aiq", "Enter"); await page.waitForTimeout(900);
  a = await lastBot(page); if (!/Não faço promessa/.test(a) || !/40 das 43/.test(a)) fails.push("valorização sem ressalva ou com contagem errada: " + a);
  await page.click('#ai [data-lang="en"]', { label: "inglês" }); await page.waitForTimeout(200);
  a = await lastBot(page); if (!/Hi! I'm the Bossa assistant/.test(a)) fails.push("troca para inglês não reiniciou a conversa: " + a);
  await page.fill("#aiq", "How many suites?"); await page.press("#aiq", "Enter"); await page.waitForTimeout(900);
  a = await lastBot(page); if (!/4 suites/.test(a)) fails.push("resposta em inglês errada: " + a);
  await page.click('#ai [data-lang="es"]', { label: "espanhol" }); await page.waitForTimeout(200);
  await page.fill("#aiq", "¿Hay helipuerto?"); await page.press("#aiq", "Enter"); await page.waitForTimeout(900);
  a = await lastBot(page); if (!/no figura/.test(a)) fails.push("resposta em espanhol errada: " + a);
  await page.screenshot({ path: "D:/Projetos/Planta Interativa/app/tests/out/d-ai.png" });
  await page.keyboard.press("Escape"); await page.waitForTimeout(300);
  s = await q(page, () => ({ ai: !document.getElementById("ai").hidden, card: !document.getElementById("card").hidden }));
  if (s.ai || !s.card) fails.push("Esc devia fechar só o assistente");
  // compartilhar: botão com nome, menu com WhatsApp, e-mail e copiar link
  await page.click('#card [data-cta="sharemenu"]', { label: "compartilhar" }); await page.waitForTimeout(300);
  s = await q(page, () => { const p = document.querySelector("#card .share-pop"); return { open: !!p, items: p ? [...p.children].map(x => x.textContent) : [], wa: p?.querySelector("a[href*='wa.me']")?.getAttribute("href") || "", exp: document.querySelector('#card [data-cta="sharemenu"]').getAttribute("aria-expanded"), vis: p ? p.getBoundingClientRect().top >= 0 : false } });
  if (!s.open || s.exp !== "true" || !s.vis) fails.push("menu de compartilhar não abriu visível: " + JSON.stringify(s));
  if (!s.items.includes("WhatsApp") || !s.items.includes("E-mail") || !s.items.includes("Copiar link")) fails.push("menu sem WhatsApp/E-mail/Copiar: " + s.items);
  if (!/Brisa%2006/.test(s.wa) || !/brisa-06/.test(decodeURIComponent(s.wa))) fails.push("WhatsApp da casa sem nome ou link");
  await page.click('#card .share-pop [data-cta="copy"]', { label: "copiar link" }); await page.waitForTimeout(400);
  s = await q(page, () => ({ hidden: document.getElementById("toast").hidden, txt: document.getElementById("toast").textContent, pop: !!document.querySelector(".share-pop") }));
  if (s.hidden || !/copiado|#brisa-06/.test(s.txt) || s.pop) fails.push("copiar link sem retorno ou menu não fechou: " + JSON.stringify(s));
  await page.click('#card [data-cta="sharemenu"]', { label: "abre de novo" }); await page.waitForTimeout(200);
  await page.keyboard.press("Escape"); await page.waitForTimeout(200);
  s = await q(page, () => ({ pop: !!document.querySelector(".share-pop"), card: !document.getElementById("card").hidden }));
  if (s.pop || !s.card) fails.push("Esc devia fechar só o menu de compartilhar");
  // botão flutuante de dúvidas: círculo discreto que se abre ao passar o mouse
  await page.keyboard.press("Escape"); await page.waitForTimeout(1200);
  s = await q(page, () => document.querySelector(".ai-fab").getBoundingClientRect().width);
  const fr = await q(page, () => { const r = document.querySelector(".ai-fab").getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2] });
  await page.mouse.move(fr[0], fr[1], { label: "passa o mouse no ✦" }); await page.waitForTimeout(500);
  const wOpen = await q(page, () => document.querySelector(".ai-fab").getBoundingClientRect().width);
  if (s > 50) fails.push("botão de dúvidas devia ser só o círculo em repouso: " + s + "px");
  if (wOpen < s + 60) fails.push("botão de dúvidas não se abriu no hover: " + s + " → " + wOpen);
  await page.mouse.move(700, 450, { label: "tira o mouse" });
  await page.click('#pins .pin:text-is("Brisa 06")', { label: "ficha de novo" }); await page.waitForTimeout(1300);
  // fechar a ficha limpa o link; casa vendida não oferece proposta
  await page.keyboard.press("Escape"); await page.waitForTimeout(1200);
  if ((await q(page, () => location.hash)) !== "") fails.push("link não foi limpo ao fechar a ficha");
  await page.focus('g[aria-label="Lago A 05, vendida"]'); await page.keyboard.press("Enter"); await page.waitForTimeout(1300);
  s = await q(page, () => (document.querySelector("#card .cta")?.innerText || "") + (document.querySelector('#card .cta [data-cta="ai"]') ? " dúvidas" : ""));
  if (/proposta|interesse/i.test(s) || !/dúvidas/.test(s)) fails.push("casa vendida com botões errados: " + s);
  await page.keyboard.press("Escape"); await page.waitForTimeout(800);
  // link direto
  await page.goto(URL0 + "#lago-b-02"); await page.waitForTimeout(2500);
  s = await q(page, () => ({ h: document.querySelector("#card h2")?.textContent, open: !document.getElementById("card").hidden }));
  if (!s.open || s.h !== "Lago B 02") fails.push("link #lago-b-02 não abriu a ficha: " + JSON.stringify(s));
  // celular: dúvidas na barra de baixo, folha dentro da tela
  await page.cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await page.cdp("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  await page.goto(URL0); await page.waitForTimeout(2500);
  s = await q(page, () => [...document.querySelectorAll(".dock button")].pop()?.textContent.trim());
  if (!/Dúvidas/.test(s)) fails.push("celular: último botão da barra não é Dúvidas: " + s);
  await page.click('.dock [data-cta="ai"]', { label: "dúvidas" }); await page.waitForTimeout(400);
  s = await q(page, () => { const r = document.getElementById("ai").getBoundingClientRect(); return [r.left, r.right, r.top, r.bottom] });
  if (s[0] < -1 || s[1] > 391 || s[3] > 845 || s[2] < 0) fails.push("celular: assistente fora da tela: " + s);
  await page.screenshot({ path: "D:/Projetos/Planta Interativa/app/tests/out/m-ai.png" });
  const errs = await q(page, () => window.__errs || []);
  if (errs.length) fails.push("erros: " + errs.join(" | "));
} finally {
  await page.cdp("Emulation.clearDeviceMetricsOverride").catch(() => {});
  await page.cdp("Emulation.setTouchEmulationEnabled", { enabled: false }).catch(() => {});
  await t.cleanup();
}
verdict(fails, "VENDAS OK");
