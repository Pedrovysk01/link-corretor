/* Link Corretor — widget do cliente dentro da apresentação (injetado em /p/<código>/).
   Faixa permanente "Você está sendo atendido por <corretor>" (prova de origem para a comissão), IA e contato.
   Shadow DOM: não herda nem vaza estilo. O cadastro já aconteceu antes (gate), então aqui só há cliente identificado. */
(() => {
  "use strict";
  const sc = document.currentScript, code = sc && sc.dataset.code;
  if (!code || window.__lcEmbed) return;
  window.__lcEmbed = true;

  const T = {
    "pt-BR": { served: "Atendimento por", open: "Dúvidas ou contato", ask: "Pergunte à IA", contact: "Falar com", close: "Fechar", lang: "Idioma",
      hello: (c, n) => `Oi${n ? ", " + n.split(" ")[0] : ""}! Sou o assistente do empreendimento. Pergunte o que quiser; se eu não souber, ${c} responde você.`,
      ph: "Escreva sua pergunta…", send: "Enviar", thinking: "Pensando…", note: "Respostas geradas por IA a partir das informações do empreendimento. Confirme valores e disponibilidade com o corretor.",
      fail: "Não consegui responder agora. Fale direto com o corretor.", limit: "A IA atingiu o limite de respostas por enquanto. Fale direto com o corretor.",
      sug: ["Quais opções estão disponíveis?", "Quais as formas de pagamento?", "O que tem de lazer?"],
      msg: "Deixe um recado", msg_ph: "Ex.: quero visitar no sábado de manhã", msg_ok: "Recado enviado. {c} vai falar com você.", wa: "Chamar no WhatsApp",
      reg_t: "Antes de continuar", reg_s: (c) => `${c} preparou esta apresentação para você. Diga quem é você para seguir navegando; na próxima vez, abre direto.`,
      reg_nome: "Seu nome", reg_fone: "WhatsApp", reg_mail: "E-mail (se preferir ao WhatsApp)", reg_ok: (c, e) => `Aceito que ${c} e ${e} entrem em contato comigo sobre este empreendimento e guardem meus dados para isso.`,
      reg_go: "Continuar na apresentação", reg_need: "Informe seu nome e um WhatsApp ou e-mail.", reg_agree: "Marque o aceite para continuar.", reg_fine: (c) => `Atendimento por ${c}. Seus dados ficam só com a construtora e o corretor.`,
      wa_text: (e) => `Olá! Estou vendo a apresentação do ${e} e gostaria de mais informações.`, other: (o) => `Você já é atendido por outro corretor. Este link é de ${o}; seu atendimento continua com quem começou.`, net: "Sem conexão. Tente de novo." },
    en: { served: "Served by", open: "Questions or contact", ask: "Ask the AI", contact: "Talk to", close: "Close", lang: "Language",
      hello: (c, n) => `Hi${n ? ", " + n.split(" ")[0] : ""}! I'm this development's assistant. Ask anything; if I don't know, ${c} will answer you.`,
      ph: "Type your question…", send: "Send", thinking: "Thinking…", note: "AI-generated answers based on the development's information. Please confirm prices and availability with the broker.",
      fail: "I couldn't answer right now. Please talk to the broker.", limit: "The AI reached its answer limit for now. Please talk to the broker.",
      sug: ["What is available?", "What are the payment terms?", "What amenities are there?"],
      msg: "Leave a message", msg_ph: "e.g. I'd like to visit on Saturday morning", msg_ok: "Message sent. {c} will be in touch.", wa: "Chat on WhatsApp",
      reg_t: "Before you continue", reg_s: (c) => `${c} prepared this presentation for you. Tell us who you are to keep browsing; next time it opens directly.`,
      reg_nome: "Your name", reg_fone: "WhatsApp", reg_mail: "Email (if you prefer)", reg_ok: (c, e) => `I agree that ${c} and ${e} may contact me about this development and keep my data for that.`,
      reg_go: "Continue", reg_need: "Enter your name and a WhatsApp or email.", reg_agree: "Please accept to continue.", reg_fine: (c) => `Served by ${c}. Your data stays with the developer and the broker only.`,
      wa_text: (e) => `Hi! I'm viewing the ${e} presentation and would like more information.`, other: (o) => `You are already served by another broker. This link belongs to ${o}; your service continues with the first one.`, net: "No connection. Try again." },
    es: { served: "Atendido por", open: "Dudas o contacto", ask: "Pregunta a la IA", contact: "Hablar con", close: "Cerrar", lang: "Idioma",
      hello: (c, n) => `¡Hola${n ? ", " + n.split(" ")[0] : ""}! Soy el asistente del proyecto. Pregunta lo que quieras; si no lo sé, ${c} te responde.`,
      ph: "Escribe tu pregunta…", send: "Enviar", thinking: "Pensando…", note: "Respuestas generadas por IA con la información del proyecto. Confirma valores y disponibilidad con el corredor.",
      fail: "No pude responder ahora. Habla directo con el corredor.", limit: "La IA alcanzó su límite por ahora. Habla directo con el corredor.",
      sug: ["¿Qué opciones hay disponibles?", "¿Cuáles son las formas de pago?", "¿Qué áreas de ocio tiene?"],
      msg: "Deja un mensaje", msg_ph: "Ej.: quiero visitar el sábado por la mañana", msg_ok: "Mensaje enviado. {c} te hablará.", wa: "Escribir por WhatsApp",
      reg_t: "Antes de continuar", reg_s: (c) => `${c} preparó esta presentación para ti. Dinos quién eres para seguir navegando; la próxima vez abre directo.`,
      reg_nome: "Tu nombre", reg_fone: "WhatsApp", reg_mail: "Correo (si lo prefieres)", reg_ok: (c, e) => `Acepto que ${c} y ${e} me contacten sobre este proyecto y guarden mis datos para ello.`,
      reg_go: "Continuar", reg_need: "Indica tu nombre y un WhatsApp o correo.", reg_agree: "Marca la aceptación para continuar.", reg_fine: (c) => `Atendido por ${c}. Tus datos quedan solo con la constructora y el corredor.`,
      wa_text: (e) => `¡Hola! Estoy viendo la presentación de ${e} y quisiera más información.`, other: (o) => `Ya te atiende otro corredor. Este enlace es de ${o}; tu atención sigue con quien empezó.`, net: "Sin conexión. Inténtalo de nuevo." },
  };

  const CSS = `
  :host{all:initial}
  *{box-sizing:border-box;font-family:"Figtree","Helvetica Neue",Arial,sans-serif}
  .badge{position:fixed;left:50%;top:calc(10px + env(safe-area-inset-top));translate:-50% 0;z-index:2147483000;display:inline-flex;align-items:center;gap:10px;max-width:calc(100vw - 24px);
    padding:6px 14px 6px 6px;border-radius:999px;background:rgba(22,48,46,.92);color:#f3efe6;border:1px solid rgba(243,239,230,.25);box-shadow:0 4px 14px rgba(0,0,0,.25);
    -webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);font-size:13px;line-height:1.2;white-space:nowrap;cursor:pointer;animation:down .64s cubic-bezier(.2,.8,.2,1) both}
  @keyframes down{from{opacity:0;translate:-50% -10px}}
  .badge .av{display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:#c9944a;color:#16302e;font-weight:700;font-size:12px;flex:none}
  .badge .t{overflow:hidden;text-overflow:ellipsis}.badge .t small{display:block;font-size:10px;letter-spacing:.12em;text-transform:uppercase;opacity:.7}
  .badge .t b{font-weight:600}
  .fab{position:fixed;right:14px;bottom:calc(92px + env(safe-area-inset-bottom));z-index:2147483000;display:inline-flex;align-items:center;gap:8px;min-height:48px;padding:0 18px 0 14px;border:1px solid rgba(243,239,230,.35);border-radius:999px;
    background:#16302e;color:#f3efe6;font:600 15px/1 "Figtree",sans-serif;cursor:pointer;box-shadow:0 6px 24px rgba(0,0,0,.45);transition:scale .2s cubic-bezier(.2,.8,.2,1)}
  .fab:active{scale:.96;transition-duration:0s}
  .fab:focus-visible,.badge:focus-visible,button:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible{outline:2px solid #c9944a;outline-offset:2px}
  .ic{display:block;width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;flex:none}
  .panel{position:fixed;right:14px;bottom:calc(92px + env(safe-area-inset-bottom));z-index:2147483001;width:min(390px,calc(100vw - 28px));height:min(620px,calc(100dvh - 120px));display:flex;flex-direction:column;
    background:#f3efe6;color:#16302e;border-radius:14px;box-shadow:0 30px 80px rgba(0,0,0,.4);overflow:hidden;animation:pop .36s cubic-bezier(.2,.8,.2,1) both}
  @keyframes pop{from{opacity:0;transform:scale(.96) translateY(8px)}}
  .panel[hidden],.fab[hidden]{display:none}
  .hd{display:flex;align-items:center;gap:10px;padding:14px 12px 12px 16px;border-bottom:1px solid rgba(22,48,46,.14);background:#16302e;color:#f3efe6}
  .hd .av{display:grid;place-items:center;width:40px;height:40px;border-radius:50%;background:#c9944a;color:#16302e;font-weight:700;font-size:15px;flex:none}
  .hd .who{flex:1;min-width:0}.hd b{display:block;font-family:"Instrument Serif",Georgia,serif;font-weight:400;font-size:20px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;line-height:1.1}
  .hd span{display:block;font-size:12px;opacity:.75;margin-top:2px}
  .x{display:grid;place-items:center;width:40px;height:40px;border:0;border-radius:50%;background:transparent;color:#f3efe6;cursor:pointer}.x:hover{background:rgba(243,239,230,.12)}
  select{min-height:36px;border-radius:6px;border:1px solid rgba(243,239,230,.35);background:transparent;color:#f3efe6;font-size:13px;padding:0 4px}
  select option{color:#16302e}
  .tabs{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:8px 12px 0}
  .tabs button{min-height:40px;border:1px solid rgba(22,48,46,.14);border-radius:999px;background:transparent;color:#16302e;font:600 13px/1.1 "Figtree",sans-serif;cursor:pointer;padding:0 8px}
  .tabs button[aria-selected=true]{background:#16302e;color:#f3efe6;border-color:#16302e}
  .body{flex:1;min-height:0;display:flex;flex-direction:column}
  .msgs{flex:1;min-height:0;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;scrollbar-width:thin}
  .m{max-width:88%;padding:10px 12px;border-radius:14px;font-size:15px;line-height:1.45;overflow-wrap:anywhere;white-space:pre-wrap}
  .m.bot{align-self:flex-start;background:#fffdf9;border:1px solid rgba(22,48,46,.14);border-bottom-left-radius:4px}
  .m.me{align-self:flex-end;background:#16302e;color:#f3efe6;border-bottom-right-radius:4px}
  .m.err{align-self:flex-start;background:rgba(140,58,43,.12);color:#8c3a2b}
  .sug{display:flex;flex-wrap:wrap;gap:6px;padding:0 14px 8px}
  .sug button{min-height:36px;border-radius:999px;border:1px solid rgba(22,48,46,.14);background:transparent;color:#16302e;font:500 13px/1.2 "Figtree",sans-serif;padding:0 12px;cursor:pointer}
  .note{font-size:11px;color:#4d6460;padding:0 14px 8px;line-height:1.4}
  .in{display:flex;gap:8px;padding:10px 12px 12px;border-top:1px solid rgba(22,48,46,.14)}
  .in input{flex:1;min-width:0;min-height:44px;border-radius:9px;border:1px solid rgba(22,48,46,.28);background:#fffdf9;color:#16302e;font-size:16px;padding:0 12px}
  .go{display:grid;place-items:center;width:44px;height:44px;border:0;border-radius:9px;background:#16302e;color:#f3efe6;cursor:pointer;flex:none}.go[disabled]{opacity:.5}
  .ct{padding:14px;display:grid;gap:12px;overflow-y:auto}
  .ct .card{display:flex;gap:12px;align-items:center;padding:12px;border-radius:9px;background:#fffdf9;border:1px solid rgba(22,48,46,.14)}
  .ct .card .av{display:grid;place-items:center;width:44px;height:44px;border-radius:50%;background:#16302e;color:#f3efe6;font-weight:700;flex:none}
  .ct .card b{display:block;font-family:"Instrument Serif",Georgia,serif;font-weight:400;font-size:19px;line-height:1.1}.ct .card small{color:#4d6460;font-size:12px}
  .ct label{display:grid;gap:6px;font-size:13px;font-weight:600}
  textarea{width:100%;min-height:84px;border-radius:9px;border:1px solid rgba(22,48,46,.28);background:#fffdf9;color:#16302e;font:400 15px/1.45 "Figtree",sans-serif;padding:10px 12px;resize:vertical}
  .btn{display:flex;align-items:center;justify-content:center;gap:8px;min-height:46px;border:0;border-radius:9px;background:#16302e;color:#f3efe6;font:600 15px/1 "Figtree",sans-serif;cursor:pointer;text-decoration:none;padding:0 16px;transition:scale .2s cubic-bezier(.2,.8,.2,1)}
  .btn:active{scale:.96;transition-duration:0s}.btn.alt{background:#c9944a;color:#16302e}.btn[disabled]{opacity:.6}
  .er{color:#8c3a2b;font-size:14px}.er:empty{display:none}.ok{color:#3f5a33;font-size:14px}.ok:empty{display:none}
  .warn{margin:0 14px;padding:10px 12px;border-radius:9px;background:rgba(201,148,74,.18);color:#80592a;font-size:13px;line-height:1.4}
  .gate{position:fixed;inset:0;z-index:2147483002;display:grid;place-items:center;padding:16px;background:rgba(10,18,15,.55);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);animation:fade .36s ease-out both}
  @keyframes fade{from{opacity:0}}
  .gate[hidden]{display:none}
  .gate form{width:min(440px,100%);background:#f3efe6;color:#16302e;border-radius:14px;padding:26px 24px 20px;box-shadow:0 30px 80px rgba(0,0,0,.4);display:grid;gap:12px;animation:pop .36s cubic-bezier(.2,.8,.2,1) both;max-height:calc(100dvh - 32px);overflow-y:auto}
  .gate .eyebrow{margin:0;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#80592a;font-weight:600}
  .gate h2{margin:-4px 0 0;font:400 1.9rem/1.05 "Instrument Serif",Georgia,serif}
  .gate .lead{margin:0;color:#4d6460;font-size:14px;line-height:1.45}
  .gate label{display:grid;gap:5px;font-size:13px;font-weight:600}
  .gate input.t{width:100%;min-height:44px;padding:10px 12px;border-radius:9px;border:1px solid rgba(22,48,46,.28);background:#fffdf9;color:#16302e;font:400 16px "Figtree",sans-serif}
  .gate .ck{display:flex;gap:10px;align-items:flex-start;font-weight:400;font-size:13px;line-height:1.4;color:#4d6460}.gate .ck input{width:20px;height:20px;margin:1px 0 0;accent-color:#c9944a;flex:none}
  .gate .fine{margin:0;font-size:12px;color:#4d6460;line-height:1.4}
  @media (max-width:520px){.gate{align-items:end;padding:0}.gate form{border-radius:14px 14px 0 0;max-height:92dvh}.panel{right:8px;left:8px;width:auto;bottom:calc(8px + env(safe-area-inset-bottom));height:min(80dvh,660px)}.badge{font-size:12px}}
    .portal{position:fixed;inset:0;z-index:2147483003;display:grid;place-items:center;padding:16px;background:rgba(10,18,15,.62);-webkit-backdrop-filter:blur(10px) saturate(1.4);backdrop-filter:blur(10px) saturate(1.4);font-family:"Figtree",system-ui,sans-serif}
  .portal .box{width:min(760px,100%);background:#f3efe6;color:#16302e;border-radius:14px;padding:28px 26px 22px;box-shadow:0 30px 80px rgba(0,0,0,.4);display:grid;gap:16px;animation:pop .35s cubic-bezier(.2,.8,.2,1)}
  .portal .eyebrow{margin:0;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#80592a;font-weight:600}
  .portal h2{margin:6px 0 4px;font:400 2rem/1.05 "Instrument Serif",Georgia,serif;letter-spacing:-.01em}
  .portal .lead{margin:0;color:#4d6460;font-size:14px;line-height:1.45}
  .portal .opts{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
  .portal .opt{display:grid;gap:6px;justify-items:start;text-align:left;padding:16px 14px;min-height:132px;border-radius:9px;border:1px solid rgba(22,48,46,.18);background:#fffdf9;color:#16302e;cursor:pointer;font:inherit;transition:translate .2s cubic-bezier(.2,.8,.2,1),box-shadow .2s,border-color .2s,scale .2s}
  .portal .opt:hover{translate:0 -2px;box-shadow:0 10px 24px rgba(0,0,0,.14);border-color:#c9944a}
  .portal .opt:active{scale:.97}.portal .opt:focus-visible{outline:2px solid #c9944a;outline-offset:2px}
  .portal .opt .ic{width:26px;height:26px;stroke:#80592a;fill:none;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
  .portal .opt b{font:400 1.45rem/1 "Instrument Serif",Georgia,serif}
  .portal .opt small{color:#4d6460;font-size:12px;line-height:1.35}
  .portal .opt.main{background:#16302e;color:#f3efe6;border-color:#16302e}.portal .opt.main small{color:rgba(243,239,230,.8)}.portal .opt.main .ic{stroke:#f0c27f}
  .modo{position:fixed;left:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:2147483001;display:flex;gap:8px;align-items:center;padding:7px 12px;border-radius:999px;background:rgba(22,48,46,.9);color:#f3efe6;font:500 12px "Figtree",system-ui,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.25)}
  .modo button{all:unset;cursor:pointer;color:#f0c27f;text-decoration:underline;text-underline-offset:2px}.modo button:focus-visible{outline:2px solid #f0c27f;outline-offset:2px;border-radius:4px}
  @media (max-width:640px){.portal{align-items:end;padding:0}.portal .box{border-radius:14px 14px 0 0;padding:22px 16px calc(18px + env(safe-area-inset-bottom,0px));max-height:94dvh;overflow:auto}.portal .opts{grid-template-columns:1fr}.portal .opt{min-height:0;grid-template-columns:auto 1fr;column-gap:12px;align-items:center}.portal .opt .ic{grid-row:span 2}}
  @media (prefers-reduced-motion:reduce){.portal .box{animation:none}.portal .opt{transition:none}.portal .opt:active{scale:1}}
  @media (prefers-reduced-motion:reduce){.badge,.panel{animation:none}.fab:active,.btn:active{scale:1}}`;
  const ICON = { chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>', send: '<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/>',
    wa: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A15 15 0 0 1 4 5a1 1 0 0 1 1-1z"/>' };
  Object.assign(ICON, { obra: '<path d="M4 21V5l9-2v18"/><path d="M13 9h7v12"/><path d="M8 8h1M8 12h1M8 16h1M16 13h1M16 17h1"/>', corretor: '<circle cx="12" cy="7" r="3.2"/><path d="M5 21v-1.5A5.5 5.5 0 0 1 10.5 14h3A5.5 5.5 0 0 1 19 19.5V21"/><path d="M12 14v4"/>', cliente: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>' });
  const P = {
    "pt-BR": { h: "Escolha seu perfil", lead: (e) => `Apresentação de ${e}. Cada perfil abre de um jeito.`,
      c1: "Construtora", d1: "Abrir o painel de gestão: clientes, corretores e avisos.", c2: "Corretor", d2: "Apresentar o empreendimento. Nenhum dado é coletado.", c3: "Cliente", d3: "Conhecer o empreendimento e falar com o corretor.",
      modo: "Modo corretor · sem coleta de dados", trocar: "Trocar perfil" },
    en: { h: "Choose your profile", lead: (e) => `${e} presentation. Each profile opens differently.`,
      c1: "Developer", d1: "Open the management panel: clients, brokers and alerts.", c2: "Broker", d2: "Present the development. No data is collected.", c3: "Client", d3: "Explore the development and talk to the broker.",
      modo: "Broker mode · no data collection", trocar: "Switch profile" },
    es: { h: "Elige tu perfil", lead: (e) => `Presentación de ${e}. Cada perfil abre distinto.`,
      c1: "Constructora", d1: "Abrir el panel de gestión: clientes, corredores y avisos.", c2: "Corredor", d2: "Presentar el proyecto. No se recopilan datos.", c3: "Cliente", d3: "Conocer el proyecto y hablar con el corredor.",
      modo: "Modo corredor · sin recopilación de datos", trocar: "Cambiar perfil" } };
  const svg = (n) => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ICON[n]}</svg>`;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const ini = (n) => String(n || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("");
  const post = async (p, body) => { const r = await fetch(`/api/p/${code}/${p}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.erro || "erro"); return j; };

  fetch(`/api/p/${code}/info`).then((r) => (r.ok ? r.json() : null)).then((info) => { if (info) montar(info); }).catch(() => {});

  function montar(info) {
    const idiomas = info.idiomas && info.idiomas.length ? info.idiomas : ["pt-BR"];
    const nav = (navigator.language || "pt-BR").toLowerCase();
    let lang = idiomas.find((l) => nav.startsWith(l.toLowerCase().split("-")[0])) || idiomas[0];
    let t = T[lang] || T["pt-BR"], aba = info.ia ? "ia" : "contato", ocupado = false, aberto = false, msgs = null, gate = false, toques = 0, ultimo = 0;
    const LIMITE = 3;
    // Perfil escolhido na tela inicial: construtora abre o painel; corretor ve a apresentacao sem coleta; cliente segue o fluxo (cadastro na 3a interacao).
    const KEY = "lc_perfil_" + code;
    let papel = null; try { papel = sessionStorage.getItem(KEY); } catch { /* sem storage */ }
    if (papel !== "cliente" && papel !== "corretor") papel = null;
    if (info.cliente) papel = "cliente"; // ja cadastrado neste aparelho: abre direto
    const escolher = (p) => { if (p === "construtora") { location.href = "/painel/"; return; } papel = p; try { sessionStorage.setItem(KEY, p); } catch { /* sem storage */ } toques = 0; render(); };
    const trocar = () => { papel = null; try { sessionStorage.removeItem(KEY); } catch { /* sem storage */ } render(); };
    const fone = String(info.whatsapp || "").replace(/\D/g, "");
    const host = document.createElement("div"); host.setAttribute("data-lc", ""); const sh = host.attachShadow({ mode: "open" });
    ["keydown", "keyup", "keypress", "wheel"].forEach((ev) => host.addEventListener(ev, (e) => e.stopPropagation()));
    document.body.append(host);
    // conta interações na apresentação (não no widget); na terceira, pede o cadastro
    const interagiu = (e) => { if (papel !== "cliente" || info.cliente || gate || e.composedPath().includes(host)) return; const agora = Date.now(); if (agora - ultimo < 400) return; ultimo = agora; if (++toques >= LIMITE) { gate = true; render(); } };
    document.addEventListener("pointerdown", interagiu, true); document.addEventListener("keydown", interagiu, true);
    setInterval(() => { if (papel !== "corretor" && !document.hidden) fetch(`/api/p/${code}/heartbeat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }).catch(() => {}); }, 30000);

    const cadastro = () => `<div class="gate" ${gate ? "" : "hidden"} role="dialog" aria-modal="true" aria-labelledby="lc-reg-t"><form class="reg" novalidate>
      <p class="eyebrow">${esc(info.empresa || info.empreendimento)}</p><h2 id="lc-reg-t">${esc(t.reg_t)}</h2><p class="lead">${esc(t.reg_s(info.corretor))}</p>
      <label>${esc(t.reg_nome)}<input class="t" name="nome" type="text" autocomplete="name" maxlength="120"></label>
      <label>${esc(t.reg_fone)}<input class="t" name="telefone" type="tel" inputmode="tel" autocomplete="tel" placeholder="(47) 99999-9999"></label>
      <label>${esc(t.reg_mail)}<input class="t" name="email" type="email" autocomplete="email"></label>
      <label class="ck"><input name="ok" type="checkbox"><span>${esc(t.reg_ok(info.corretor, info.empresa || "a construtora"))}</span></label>
      <p class="er" role="alert"></p><button class="btn" type="submit">${esc(t.reg_go)}</button><p class="fine">${esc(t.reg_fine(info.corretor))}</p></form></div>`;
    const ia = () => `<div class="msgs" role="log" aria-live="polite"><div class="m bot">${esc(t.hello(info.corretor, info.cliente && info.cliente.nome))}</div></div>
      <div class="sug">${t.sug.map((s) => `<button type="button" data-s="${esc(s)}">${esc(s)}</button>`).join("")}</div><p class="note">${esc(t.note)}</p>
      <form class="in"><input type="text" maxlength="500" placeholder="${esc(t.ph)}" aria-label="${esc(t.ph)}" autocomplete="off"><button class="go" aria-label="${esc(t.send)}">${svg("send")}</button></form>`;
    const contato = () => `<div class="ct">
      <div class="card"><span class="av">${esc(ini(info.corretor))}</span><div><b>${esc(info.corretor)}</b><small>${esc(info.empresa || "")}</small></div></div>
      ${fone ? `<a class="btn alt" target="_blank" rel="noopener" href="https://wa.me/${fone}?text=${encodeURIComponent(t.wa_text(info.empreendimento))}">${svg("wa")}${esc(t.wa)}</a>` : ""}
      <form class="rec" novalidate><label>${esc(t.msg)}<textarea name="m" maxlength="800" placeholder="${esc(t.msg_ph)}"></textarea></label><p class="er" role="alert"></p><p class="ok" role="status"></p><button class="btn" type="submit">${esc(t.send)}</button></form></div>`;

    function render() {
      t = T[lang] || T["pt-BR"];
      const pp = P[lang] || P["pt-BR"];
      if (papel === null) { // tela inicial: tres perfis
        sh.innerHTML = `<style>${CSS}</style><div class="portal" role="dialog" aria-modal="true" aria-labelledby="lc-pf-t"><div class="box">
          <div><p class="eyebrow">${esc(info.empresa || info.empreendimento)}</p><h2 id="lc-pf-t">${esc(pp.h)}</h2><p class="lead">${esc(pp.lead(info.empreendimento))}</p></div>
          <div class="opts">
            <button class="opt" type="button" data-p="construtora">${svg("obra")}<b>${esc(pp.c1)}</b><small>${esc(pp.d1)}</small></button>
            <button class="opt" type="button" data-p="corretor">${svg("corretor")}<b>${esc(pp.c2)}</b><small>${esc(pp.d2)}</small></button>
            <button class="opt main" type="button" data-p="cliente">${svg("cliente")}<b>${esc(pp.c3)}</b><small>${esc(pp.d3)}</small></button>
          </div></div></div>`;
        sh.querySelectorAll(".opt").forEach((b) => (b.onclick = () => escolher(b.dataset.p)));
        (sh.querySelector(".opt.main") || sh.querySelector(".opt")).focus();
        return;
      }
      if (papel === "corretor") { // apresentacao normal: sem faixa, sem IA, sem cadastro, sem batimento
        sh.innerHTML = `<style>${CSS}</style><div class="modo" role="status"><span>${esc(pp.modo)}</span><button type="button">${esc(pp.trocar)}</button></div>`;
        sh.querySelector(".modo button").onclick = trocar; return;
      }
      sh.innerHTML = `<style>${CSS}</style>${cadastro()}
        <button class="badge" type="button" title="${esc(t.open)}"><span class="av">${esc(ini(info.corretor))}</span><span class="t"><small>${esc(t.served)}</small><b>${esc(info.corretor)}</b></span></button>
        <button class="fab" ${aberto ? "hidden" : ""} aria-label="${esc(t.open)}">${svg("chat")}${esc(info.ia ? t.ask : t.contact + " " + info.corretor.split(" ")[0])}</button>
        <section class="panel" role="dialog" aria-label="${esc(t.open)}" ${aberto ? "" : "hidden"}>
          <div class="hd"><span class="av">${esc(ini(info.corretor))}</span><div class="who"><b>${esc(info.corretor)}</b><span>${esc(info.empreendimento)}</span></div>
            ${idiomas.length > 1 ? `<select aria-label="${esc(t.lang)}">${idiomas.map((l) => `<option value="${l}" ${l === lang ? "selected" : ""}>${l.split("-")[0].toUpperCase()}</option>`).join("")}</select>` : ""}
            <button class="x" aria-label="${esc(t.close)}">${svg("x")}</button></div>
          ${info.outro_corretor ? `<p class="warn" style="margin-top:10px">${esc(t.other(info.outro_corretor))}</p>` : ""}
          ${info.ia ? `<div class="tabs" role="tablist"><button role="tab" data-a="ia" aria-selected="${aba === "ia"}">${esc(t.ask)}</button><button role="tab" data-a="contato" aria-selected="${aba === "contato"}">${esc(t.contact)} ${esc(info.corretor.split(" ")[0])}</button></div>` : ""}
          <div class="body">${aba === "ia" ? ia() : contato()}</div></section>`;
      if (msgs && aba === "ia") { sh.querySelector(".msgs").innerHTML = msgs; sh.querySelector(".sug")?.remove(); }
      ligar();
    }
    function ligar() {
      const q = (s) => sh.querySelector(s), painel = q(".panel"), fab = q(".fab");
      const abrir = () => { if (pedirCadastro()) return; aberto = true; painel.hidden = false; fab.hidden = true; (q(".in input") || q("textarea"))?.focus(); };
      fab.onclick = abrir; q(".badge").onclick = () => { if (pedirCadastro()) return; aba = "contato"; aberto = true; render(); (sh.querySelector("textarea") || sh.querySelector(".x"))?.focus(); };
      q(".x").onclick = () => { aberto = false; painel.hidden = true; fab.hidden = false; fab.focus(); };
      painel.addEventListener("keydown", (e) => { if (e.key === "Escape") q(".x").click(); });
      const sel = q("select"); if (sel) sel.onchange = () => { lang = sel.value; render(); };
      sh.querySelectorAll(".tabs button").forEach((b) => (b.onclick = () => { aba = b.dataset.a; render(); (sh.querySelector(".in input") || sh.querySelector("textarea"))?.focus(); }));
      sh.querySelectorAll(".sug button").forEach((b) => (b.onclick = () => perguntar(b.dataset.s)));
      const fi = q("form.in"); if (fi) fi.onsubmit = (e) => { e.preventDefault(); const i = fi.querySelector("input"), v = i.value.trim(); if (v) { i.value = ""; perguntar(v); } };
      const fg = q("form.reg"); if (fg) { fg.onsubmit = registrar; if (gate) setTimeout(() => fg.elements.nome.focus(), 50); }
      const fr = q("form.rec"); if (fr) fr.onsubmit = async (e) => { e.preventDefault(); const er = fr.querySelector(".er"), ok = fr.querySelector(".ok"), v = fr.elements.m.value.trim(); er.textContent = ok.textContent = "";
        if (!v) return; const b = fr.querySelector("button"); b.disabled = true;
        try { await post("message", { mensagem: v }); ok.textContent = t.msg_ok.replace("{c}", info.corretor); fr.elements.m.value = ""; } catch (x) { er.textContent = x.message === "erro" ? t.net : x.message; } b.disabled = false; };
    }
    async function registrar(e) {
      e.preventDefault(); const f = e.target, er = f.querySelector(".er"), g = (n) => f.elements[n].value.trim(); er.textContent = "";
      if (g("nome").length < 2 || !(g("telefone") || g("email"))) return (er.textContent = t.reg_need);
      if (!f.elements.ok.checked) return (er.textContent = t.reg_agree);
      const b = f.querySelector("button[type=submit]"); b.disabled = true;
      try { const r = await post("register", { nome: g("nome"), telefone: g("telefone"), email: g("email"), consentimento: true });
        info.cliente = r.cliente; info.corretor = r.corretor; info.whatsapp = r.whatsapp || info.whatsapp; gate = false; render(); }
      catch (x) { er.textContent = x.message === "erro" ? t.net : x.message; b.disabled = false; }
    }
    function pedirCadastro() { if (!info.cliente) { gate = true; render(); return true; } return false; }
    function bolha(cls, texto) { const d = document.createElement("div"); d.className = "m " + cls; d.textContent = texto; const l = sh.querySelector(".msgs"); l.append(d); l.scrollTop = l.scrollHeight; return d; }
    async function perguntar(txt) {
      if (pedirCadastro() || ocupado) return; ocupado = true;
      const go = sh.querySelector(".go"); go && (go.disabled = true); sh.querySelector(".sug")?.remove();
      bolha("me", txt); const esp = bolha("bot", t.thinking);
      try { const r = await post("ask", { pergunta: txt, lang });
        if (r.resposta) esp.textContent = r.resposta.replace(/\*\*(.+?)\*\*/g, "$1").replace(/^#+\s*/gm, "");
        else { esp.className = "m err"; esp.textContent = r.motivo === "limite" ? t.limit : t.fail; }
      } catch (e) { esp.className = "m err"; esp.textContent = e.message === "erro" ? t.net : e.message; }
      ocupado = false; go && (go.disabled = false); msgs = sh.querySelector(".msgs").innerHTML; sh.querySelector(".msgs").scrollTop = 1e6;
    }
    render();
  }
})();
