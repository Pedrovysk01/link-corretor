/* Link Corretor — widget da apresentação (injetado em /p/<código>/).
   Não há tela de perfil: quem abre o link é CLIENTE (faixa "atendido por <corretor>", IA, contato e cadastro depois de 30 s ou na 3ª interação).
   Quem está logado no painel é EQUIPE e vê só o seu papel: o corretor apresenta (sem coleta; cartão com assinatura uma única vez e "Enviar ao cliente"),
   a construtora só olha (aba "← Painel" do voltar.js). Shadow DOM: não herda nem vaza estilo. */
(() => {
  "use strict";
  const sc = document.currentScript, code = sc && sc.dataset.code, prePid = sc && sc.dataset.pid;
  if ((!code && !prePid) || window.__lcEmbed) return;
  const API = code ? `/api/p/${code}` : `/api/pre/${prePid}`;  // link do corretor ou pré-visualização da construtora (aberta do painel)
  const CHAVE = code || "pre" + prePid;
  window.__lcEmbed = true;

  const T = {
    "pt-BR": { served: "Atendimento por", open: "Dúvidas ou contato", ask: "Pergunte à IA", contact: "Falar com", close: "Fechar", lang: "Idioma",
      hello: (c, n) => `Oi${n ? ", " + n.split(" ")[0] : ""}! Sou o assistente do empreendimento. Pergunte o que quiser; se eu não souber, ${c} responde você.`,
      ph: "Escreva sua pergunta…", send: "Enviar", thinking: "Pensando…", note: "Respostas geradas por IA a partir das informações do empreendimento.",
      fail: "Não consegui responder agora. Fale direto com o corretor.", limit: "A IA atingiu o limite de respostas por enquanto. Fale direto com o corretor.",
      sug: ["Quais opções estão disponíveis?", "Quais as formas de pagamento?", "O que tem de lazer?"],
      msg: "Deixe um recado", msg_ph: "Ex.: quero visitar no sábado de manhã", msg_ok: "Recado enviado. {c} vai falar com você.", wa: "Chamar no WhatsApp",
      reg_t: "Antes de continuar", reg_s: (c) => `${c} preparou esta apresentação para você. Diga quem é você para seguir navegando; na próxima vez, abre direto.`,
      reg_nome: "Seu nome", reg_fone: "WhatsApp", reg_mail: "E-mail (se preferir ao WhatsApp)", reg_ok: (c, e) => `Aceito que ${c} e ${e} entrem em contato comigo sobre este empreendimento e guardem meus dados para isso.`,
      reg_go: "Continuar na apresentação", reg_need: "Informe seu nome e um WhatsApp ou e-mail.", reg_agree: "Marque o aceite para continuar.", reg_fine: (c) => `Atendimento por ${c}. Seus dados ficam só com a construtora e o corretor.`,
      pr_tab: "Proposta", pr_t: "Monte sua proposta", pr_unit: "Unidade", pr_direto: "Direto com a construtora", pr_banco: "Banco nas chaves", pr_entrada: "Entrada (sinal)", pr_n: "Mensais na obra", pr_bal: "Balões", pr_balper: "Periodicidade", pr_balpct: "Total dos balões",
      pr_chaves: "Nas chaves", pr_banco_pct: "Financiado pelo banco", pr_obs: "Observações", pr_send: "Enviar proposta", pr_price: "Preço", pr_total: "Total", pr_sem: "semestrais", pr_anu: "anuais", pr_nobal: "sem balões",
      pr_ok: (c) => `Proposta enviada. ${c} e a construtora já receberam e entram em contato para formalizar.`, pr_bad: "A soma de entrada, balões e chaves passa de 100%. Ajuste as porcentagens.",
      pr_ilus: "Valores ilustrativos: a tabela oficial da incorporadora ainda não foi divulgada. A proposta vale como intenção de compra.",
      pr_banco_t: "Em análise pela construtora", pr_banco_s: "Financiamento bancário e consórcio estão sendo negociados com os parceiros abaixo. Em breve você monta a proposta com as condições de cada um.", pr_banco_volta: "Montar proposta direto com a construtora", pr_fine: "Simulação sem compromisso. Condições sujeitas à aprovação da incorporadora.",
      wa_text: (e) => `Olá! Estou vendo a apresentação do ${e} e gostaria de mais informações.`, other: (o) => `Você já é atendido por outro corretor. Este link é de ${o}; seu atendimento continua com quem começou.`, net: "Sem conexão. Tente de novo." },
    en: { served: "Served by", open: "Questions or contact", ask: "Ask the AI", contact: "Talk to", close: "Close", lang: "Language",
      hello: (c, n) => `Hi${n ? ", " + n.split(" ")[0] : ""}! I'm this development's assistant. Ask anything; if I don't know, ${c} will answer you.`,
      ph: "Type your question…", send: "Send", thinking: "Thinking…", note: "AI-generated answers based on the development's information.",
      fail: "I couldn't answer right now. Please talk to the broker.", limit: "The AI reached its answer limit for now. Please talk to the broker.",
      sug: ["What is available?", "What are the payment terms?", "What amenities are there?"],
      msg: "Leave a message", msg_ph: "e.g. I'd like to visit on Saturday morning", msg_ok: "Message sent. {c} will be in touch.", wa: "Chat on WhatsApp",
      reg_t: "Before you continue", reg_s: (c) => `${c} prepared this presentation for you. Tell us who you are to keep browsing; next time it opens directly.`,
      reg_nome: "Your name", reg_fone: "WhatsApp", reg_mail: "Email (if you prefer)", reg_ok: (c, e) => `I agree that ${c} and ${e} may contact me about this development and keep my data for that.`,
      reg_go: "Continue", reg_need: "Enter your name and a WhatsApp or email.", reg_agree: "Please accept to continue.", reg_fine: (c) => `Served by ${c}. Your data stays with the developer and the broker only.`,
      pr_tab: "Offer", pr_t: "Build your offer", pr_unit: "Unit", pr_direto: "Direct with the developer", pr_banco: "Bank at delivery", pr_entrada: "Down payment", pr_n: "Monthly during works", pr_bal: "Balloons", pr_balper: "Frequency", pr_balpct: "Balloons total",
      pr_chaves: "At delivery", pr_banco_pct: "Bank financed", pr_obs: "Notes", pr_send: "Send offer", pr_price: "Price", pr_total: "Total", pr_sem: "semiannual", pr_anu: "annual", pr_nobal: "no balloons",
      pr_ok: (c) => `Offer sent. ${c} and the developer have it and will get in touch to formalize.`, pr_bad: "Down payment, balloons and delivery add up to more than 100%. Adjust the percentages.",
      pr_ilus: "Illustrative values: the developer's official price list has not been released yet. The offer counts as a purchase intent.",
      pr_banco_t: "Under review by the developer", pr_banco_s: "Bank financing and consortium plans are being negotiated with the partners below. Soon you will build your offer with each partner's terms.", pr_banco_volta: "Build an offer direct with the developer", pr_fine: "Non-binding simulation. Terms subject to the developer's approval.",
      wa_text: (e) => `Hi! I'm viewing the ${e} presentation and would like more information.`, other: (o) => `You are already served by another broker. This link belongs to ${o}; your service continues with the first one.`, net: "No connection. Try again." },
    es: { served: "Atendido por", open: "Dudas o contacto", ask: "Pregunta a la IA", contact: "Hablar con", close: "Cerrar", lang: "Idioma",
      hello: (c, n) => `¡Hola${n ? ", " + n.split(" ")[0] : ""}! Soy el asistente del proyecto. Pregunta lo que quieras; si no lo sé, ${c} te responde.`,
      ph: "Escribe tu pregunta…", send: "Enviar", thinking: "Pensando…", note: "Respuestas generadas por IA con la información del proyecto.",
      fail: "No pude responder ahora. Habla directo con el corredor.", limit: "La IA alcanzó su límite por ahora. Habla directo con el corredor.",
      sug: ["¿Qué opciones hay disponibles?", "¿Cuáles son las formas de pago?", "¿Qué áreas de ocio tiene?"],
      msg: "Deja un mensaje", msg_ph: "Ej.: quiero visitar el sábado por la mañana", msg_ok: "Mensaje enviado. {c} te hablará.", wa: "Escribir por WhatsApp",
      reg_t: "Antes de continuar", reg_s: (c) => `${c} preparó esta presentación para ti. Dinos quién eres para seguir navegando; la próxima vez abre directo.`,
      reg_nome: "Tu nombre", reg_fone: "WhatsApp", reg_mail: "Correo (si lo prefieres)", reg_ok: (c, e) => `Acepto que ${c} y ${e} me contacten sobre este proyecto y guarden mis datos para ello.`,
      reg_go: "Continuar", reg_need: "Indica tu nombre y un WhatsApp o correo.", reg_agree: "Marca la aceptación para continuar.", reg_fine: (c) => `Atendido por ${c}. Tus datos quedan solo con la constructora y el corredor.`,
      pr_tab: "Propuesta", pr_t: "Arma tu propuesta", pr_unit: "Unidad", pr_direto: "Directo con la constructora", pr_banco: "Banco en la entrega", pr_entrada: "Entrada (señal)", pr_n: "Mensuales en obra", pr_bal: "Refuerzos", pr_balper: "Periodicidad", pr_balpct: "Total de refuerzos",
      pr_chaves: "En la entrega", pr_banco_pct: "Financiado por el banco", pr_obs: "Observaciones", pr_send: "Enviar propuesta", pr_price: "Precio", pr_total: "Total", pr_sem: "semestrales", pr_anu: "anuales", pr_nobal: "sin refuerzos",
      pr_ok: (c) => `Propuesta enviada. ${c} y la constructora ya la recibieron y se pondrán en contacto para formalizar.`, pr_bad: "Entrada, refuerzos y entrega suman más del 100%. Ajusta los porcentajes.",
      pr_ilus: "Valores ilustrativos: la lista oficial de precios de la constructora aún no fue publicada. La propuesta vale como intención de compra.",
      pr_banco_t: "En análisis por la constructora", pr_banco_s: "Financiación bancaria y consorcio se están negociando con los socios de abajo. Pronto podrás armar la propuesta con las condiciones de cada uno.", pr_banco_volta: "Armar propuesta directo con la constructora", pr_fine: "Simulación sin compromiso. Condiciones sujetas a la aprobación de la constructora.",
      wa_text: (e) => `¡Hola! Estoy viendo la presentación de ${e} y quisiera más información.`, other: (o) => `Ya te atiende otro corredor. Este enlace es de ${o}; tu atención sigue con quien empezó.`, net: "Sin conexión. Inténtalo de nuevo." },
  };

  const CSS = `
  :host{all:initial}
  *{box-sizing:border-box;font-family:"Figtree","Helvetica Neue",Arial,sans-serif}
  .badge{position:fixed;left:16px;top:calc(92px + env(safe-area-inset-top));z-index:2147483000;display:inline-flex;align-items:center;gap:10px;max-width:calc(100vw - 24px);
    padding:6px 14px 6px 6px;border-radius:999px;background:rgba(22,48,46,.92);color:#f3efe6;border:1px solid rgba(243,239,230,.25);box-shadow:0 4px 14px rgba(0,0,0,.25);
    -webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);font-size:13px;line-height:1.2;white-space:nowrap;cursor:pointer;animation:down .64s cubic-bezier(.2,.8,.2,1) both}
  @keyframes down{from{opacity:0;translate:0 -10px}}
  .badge .av{display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:#c9944a;color:#16302e;font-weight:700;font-size:12px;flex:none}
  .badge .t{overflow:hidden;text-overflow:ellipsis}.badge .t small{display:block;font-size:10px;letter-spacing:.12em;text-transform:uppercase;opacity:.7}
  .badge .t b{font-weight:600}
  .fab{position:fixed;left:16px;bottom:calc(68px + env(safe-area-inset-bottom));z-index:2147483000;display:inline-flex;align-items:center;gap:8px;min-height:48px;padding:0 18px 0 14px;border:1px solid rgba(243,239,230,.35);border-radius:999px;
    background:#16302e;color:#f3efe6;font:600 15px/1 "Figtree",sans-serif;cursor:pointer;box-shadow:0 6px 24px rgba(0,0,0,.45);transition:scale .2s cubic-bezier(.2,.8,.2,1)}
  .fab:active{scale:.96;transition-duration:0s}
  .fab:focus-visible,.badge:focus-visible,button:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible{outline:2px solid #c9944a;outline-offset:2px}
  .ic{display:block;width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;flex:none}
  .panel{position:fixed;left:16px;bottom:calc(68px + env(safe-area-inset-bottom));z-index:2147483001;width:min(390px,calc(100vw - 28px));height:min(620px,calc(100dvh - 120px));display:flex;flex-direction:column;
    background:#f3efe6;color:#16302e;border-radius:14px;box-shadow:0 30px 80px rgba(0,0,0,.4);overflow:hidden;animation:pop .36s cubic-bezier(.2,.8,.2,1) both}
  @keyframes pop{from{opacity:0;transform:scale(.96) translateY(8px)}}
  .panel[hidden],.fab[hidden]{display:none}
  :host([data-tour]) .badge,:host([data-tour]) .fab{display:none}
  @media (max-width:900px){:host([data-card]) .fab{display:none}}
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
  .gate .etapa2{display:grid;gap:12px;animation:pop .3s cubic-bezier(.2,.8,.2,1)}.gate .etapa2[hidden]{display:none}
  .gate .fine{margin:0;font-size:12px;color:#4d6460;line-height:1.4}
  @media (max-width:900px){.fab{left:12px;bottom:calc(var(--dockh,76px) + 64px + env(safe-area-inset-bottom))}.badge{left:12px;top:calc(76px + env(safe-area-inset-top))}}
  @media (max-width:520px){.gate{align-items:end;padding:0}.gate form{border-radius:14px 14px 0 0;max-height:92dvh}.panel{right:8px;left:8px;width:auto;bottom:calc(8px + env(safe-area-inset-bottom));height:min(80dvh,660px)}.badge{font-size:12px}}
  .modo{position:fixed;left:50%;translate:-50% 0;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:2147483001;display:flex;gap:8px;align-items:center;padding:7px 12px;border-radius:999px;background:rgba(22,48,46,.9);color:#f3efe6;font:500 12px "Figtree",system-ui,sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.25)}
  .modo button{all:unset;cursor:pointer;color:#f0c27f;text-decoration:underline;text-underline-offset:2px}.modo button:focus-visible{outline:2px solid #f0c27f;outline-offset:2px;border-radius:4px}
    .sig-w{display:grid;gap:6px}.sig{width:100%;height:120px;border-radius:9px;border:1px dashed rgba(22,48,46,.4);background:#fffdf9;touch-action:none;cursor:crosshair;display:block}
  .sig-w .row{display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#4d6460;font-weight:400}.sig-w .row button{all:unset;cursor:pointer;color:#80592a;text-decoration:underline;font-weight:600}
  .gate form.ct{max-height:94dvh;overflow:auto}.gate .two{display:grid;grid-template-columns:1fr 1fr;gap:10px}.gate .btn.alt2{background:transparent;color:#16302e;border:1px solid rgba(22,48,46,.3)}
  .modo{flex-wrap:wrap;max-width:calc(100vw - 24px)}@media (max-width:900px){.modo{bottom:calc(env(safe-area-inset-bottom,0px) + var(--dockh,76px) + 84px)}}.modo button.sep{margin-left:4px;padding-left:10px;border-left:1px solid rgba(243,239,230,.3)}
  /* ── refinamento: uma borda só por elemento, controles segmentados, foco por sombra, bandeira de idioma, foto do corretor, proposta ── */
  img.av{object-fit:cover;background:#16302e}
  .hd{padding:14px 10px 14px 16px;border-bottom:0;gap:12px}
  .hd .av{width:42px;height:42px;box-shadow:0 0 0 2px rgba(243,239,230,.35)}
  .lang{display:grid;place-items:center;width:40px;height:40px;border:0;border-radius:50%;background:rgba(243,239,230,.1);color:#f3efe6;font-size:20px;line-height:1;cursor:pointer}
  .lang:hover,.lang[aria-expanded=true]{background:rgba(243,239,230,.2)}
  .langs{position:absolute;right:12px;top:64px;z-index:3;display:grid;gap:2px;min-width:170px;padding:6px;border-radius:12px;background:#fffdf9;color:#16302e;box-shadow:0 18px 40px rgba(0,0,0,.28)}
  .langs[hidden]{display:none}
  .langs button{display:flex;align-items:center;gap:10px;min-height:40px;padding:0 12px;border:0;border-radius:8px;background:transparent;color:#16302e;font:500 14px/1 "Figtree",sans-serif;cursor:pointer;text-align:left}
  .langs button:hover{background:rgba(22,48,46,.07)}.langs button[aria-pressed=true]{background:#16302e;color:#f3efe6}
  .tabs{display:flex;gap:0;margin:12px 14px 0;padding:4px;border-radius:999px;background:rgba(22,48,46,.08)}
  .tabs button{flex:1;min-height:38px;border:0;border-radius:999px;background:transparent;color:#16302e;font:600 13px/1.1 "Figtree",sans-serif;padding:0 10px}
  .tabs button[aria-selected=true]{background:#16302e;color:#f3efe6;box-shadow:0 2px 8px rgba(0,0,0,.18)}
  .m.bot{border:0;box-shadow:0 1px 2px rgba(22,48,46,.08),0 0 0 1px rgba(22,48,46,.06)}
  .sug button{border:1px solid rgba(22,48,46,.18)}
  .in{border-top:0;padding:10px 14px 14px;background:linear-gradient(to top,#f3efe6 70%,rgba(243,239,230,0))}
  .in input,textarea,.gate input.t{border:1px solid rgba(22,48,46,.18);box-shadow:0 1px 2px rgba(22,48,46,.06)}
  input:focus-visible,textarea:focus-visible,select:focus-visible{outline:none;border-color:#c9944a;box-shadow:0 0 0 3px rgba(201,148,74,.28)}
  .ct{padding:16px 14px 18px;gap:14px}
  .ct .card{border:0;box-shadow:0 1px 2px rgba(22,48,46,.08),0 0 0 1px rgba(22,48,46,.06);border-radius:12px;padding:12px 14px}
  .ct .card .av{width:48px;height:48px}
  .ct .rec{display:grid;gap:10px}.ct .rec .btn{width:100%}
  .btn.alt{box-shadow:0 6px 18px -8px rgba(201,148,74,.8)}
  .note{padding:0 16px 10px}
  /* proposta */
  .pr{padding:14px 14px 18px;display:grid;gap:12px;overflow-y:auto}
  .pr label{display:grid;gap:6px;font-size:12px;font-weight:600;color:#4d6460;min-width:0}
  .pr select,.sel{width:100%;min-height:42px;border-radius:9px;border:1px solid rgba(22,48,46,.18);background:#fffdf9;color:#16302e;font:500 14px "Figtree",sans-serif;padding:0 10px;box-shadow:0 1px 2px rgba(22,48,46,.06)}
  .pr .seg{display:flex;padding:4px;border-radius:999px;background:rgba(22,48,46,.08)}
  .pr .seg button{flex:1;min-height:36px;border:0;border-radius:999px;background:transparent;color:#16302e;font:600 12px/1.1 "Figtree",sans-serif;padding:0 8px;cursor:pointer}
  .pr .seg button[aria-pressed=true]{background:#16302e;color:#f3efe6}
  .pr-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .pr-sum{display:grid;gap:6px;padding:12px 14px;border-radius:12px;background:#fffdf9;box-shadow:0 1px 2px rgba(22,48,46,.08),0 0 0 1px rgba(22,48,46,.06);font-size:14px}
  .pr-sum div{display:flex;justify-content:space-between;gap:12px}.pr-sum div span:last-child{font-weight:600;white-space:nowrap}
  .pr-sum .tot{border-top:1px solid rgba(22,48,46,.12);padding-top:6px;margin-top:2px;font-family:"Instrument Serif",Georgia,serif;font-size:18px}
  .pr textarea{min-height:64px}
  .pr .btn{width:100%}
  .pr .warn{margin:0}
  /* tamanho: um pouco menor, alinhado à barra de baixo (--pl/--pw/--pb medidos na página) */
  .panel{left:var(--pl,16px);width:var(--pw,min(390px,calc(100vw - 28px)));min-width:min(300px,calc(100vw - 16px));max-width:calc(100vw - 16px);bottom:var(--pb,calc(68px + env(safe-area-inset-bottom)));height:min(560px,calc(100dvh - var(--pb,80px) - 56px))}
  .hd .av{width:38px;height:38px}.hd b{font-size:18px}
  .m{font-size:14px;padding:9px 11px}.sug button{min-height:34px;font-size:12.5px}.in input{min-height:42px;font-size:15px}.go{width:42px;height:42px}
  .fl{width:24px;height:17px;border-radius:3px;box-shadow:0 0 0 1px rgba(0,0,0,.15);display:inline-block;vertical-align:middle;flex:none}
  .lang .fl{width:26px;height:18px}
  /* modo banco congelado + faixa de parceiros */
  .seg button .ic{width:14px;height:14px;margin-right:4px;display:inline-block;vertical-align:-2px}
  .frz{display:grid;gap:8px;padding:14px;border-radius:12px;background:#fffdf9;box-shadow:0 1px 2px rgba(22,48,46,.08),0 0 0 1px rgba(22,48,46,.06)}
  .frz p{margin:0;font-size:13px;line-height:1.45;color:#4d6460}
  .frz-tag{display:inline-flex;align-items:center;gap:6px;justify-self:start;padding:6px 12px;border-radius:999px;background:rgba(201,148,74,.18);color:#80592a;font:600 12px/1 "Figtree",sans-serif;letter-spacing:.04em;text-transform:uppercase}
  .frz-tag .ic{width:14px;height:14px}
  .mq{overflow:hidden;margin:0 -14px;padding:6px 0;mask-image:linear-gradient(90deg,transparent,#000 10%,#000 90%,transparent)}
  .mq-in{display:flex;gap:18px;width:max-content;animation:mq 42s linear infinite}
  .mq:hover .mq-in{animation-play-state:paused}
  @keyframes mq{to{transform:translateX(-50%)}}
  .mq-it{display:grid;justify-items:center;gap:5px;width:84px;flex:none;opacity:.8}
  .mq-it img{width:36px;height:36px;border-radius:10px;background:#fff;padding:5px;object-fit:contain;box-shadow:0 1px 2px rgba(22,48,46,.12);filter:grayscale(1)}
  .mq-it small{font-size:10.5px;color:#4d6460;text-align:center;line-height:1.2}
  .btn.alt2{background:transparent;color:#16302e;border:1px solid rgba(22,48,46,.25)}
  @media (prefers-reduced-motion:reduce){.mq-in{animation:none;flex-wrap:wrap;width:auto}.mq{mask-image:none;overflow:auto}}
  img.av.logo{object-fit:contain;background:#fff;padding:4px}
  /* barra de baixo: botão da IA + selo "Atendimento por", lado a lado */
  .dockbar{position:fixed;left:16px;bottom:calc(68px + env(safe-area-inset-bottom));z-index:2147483000;display:flex;align-items:center;gap:8px;flex-wrap:wrap;max-width:calc(100vw - 24px)}
  .dockbar .fab,.dockbar .badge{position:static;left:auto;top:auto;bottom:auto;max-width:100%;animation:pop .5s cubic-bezier(.2,.8,.2,1) both}
  .dockbar .badge{min-height:48px;padding:6px 16px 6px 6px}
  .dockbar .badge .av{width:36px;height:36px}
  .badge[hidden]{display:none}
  :host([data-tour]) .dockbar{display:none}
  @media (max-width:900px){.dockbar{left:12px;bottom:calc(var(--dockh,76px) + 64px + env(safe-area-inset-bottom))}:host([data-card]) .dockbar{display:none}}
  /* tablet e celular */
  @media (min-width:521px) and (max-width:1024px){.panel{width:min(440px,calc(100vw - 24px));height:min(680px,calc(100dvh - 100px))}}
  @media (max-width:520px){.panel{inset:auto;left:var(--pl,10px);right:auto;width:var(--pw,calc(100vw - 20px));height:min(78dvh,620px);border-radius:16px}.pr-grid{grid-template-columns:1fr 1fr}.hd{padding-top:12px}.langs{right:10px}}
  @media (prefers-reduced-motion:reduce){.badge,.panel{animation:none}.fab:active,.btn:active{scale:1}}`;
  const ICON = { chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>', send: '<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/>',
    wa: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A15 15 0 0 1 4 5a1 1 0 0 1 1-1z"/>', lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>' };
  const fl = (inner) => `<svg class="fl" viewBox="0 0 24 17" aria-hidden="true">${inner}</svg>`;
  const BAND = {  // bandeiras desenhadas (o emoji de bandeira vira letras no Windows)
    "pt-BR": fl('<rect width="24" height="17" fill="#009b3a"/><path d="M12 2.2 21.5 8.5 12 14.8 2.5 8.5z" fill="#fedf00"/><circle cx="12" cy="8.5" r="3.6" fill="#002776"/>'),
    en: fl('<rect width="24" height="17" fill="#fff"/><path d="M0 1.3h24M0 3.7h24M0 6.1h24M0 8.5h24M0 10.9h24M0 13.3h24M0 15.7h24" stroke="#b22234" stroke-width="1.25"/><rect width="10.5" height="8.5" fill="#3c3b6e"/>'),
    es: fl('<rect width="24" height="17" fill="#c60b1e"/><rect y="4.25" width="24" height="8.5" fill="#ffc400"/>'),
    zh: fl('<rect width="24" height="17" fill="#de2910"/><path d="m5 2.5 1.2 3.2 3.4.1-2.7 2.1 1 3.3L5 9.3l-2.9 1.9 1-3.3L.4 5.8l3.4-.1z" fill="#ffde00"/>'),
    hi: fl('<rect width="24" height="17" fill="#ff9933"/><rect y="5.7" width="24" height="5.6" fill="#fff"/><rect y="11.3" width="24" height="5.7" fill="#138808"/><circle cx="12" cy="8.5" r="2.1" fill="none" stroke="#000080" stroke-width=".8"/>'),
    ar: fl('<rect width="24" height="17" fill="#006c35"/><rect x="4" y="6" width="16" height="2.2" rx="1" fill="#fff"/><rect x="6" y="10" width="12" height="1.6" rx=".8" fill="#fff"/>'),
    fr: fl('<rect width="8" height="17" fill="#0055a4"/><rect x="8" width="8" height="17" fill="#fff"/><rect x="16" width="8" height="17" fill="#ef4135"/>'),
    bn: fl('<rect width="24" height="17" fill="#006a4e"/><circle cx="10.5" cy="8.5" r="4.6" fill="#f42a41"/>'),
    ru: fl('<rect width="24" height="5.7" fill="#fff"/><rect y="5.7" width="24" height="5.6" fill="#0039a6"/><rect y="11.3" width="24" height="5.7" fill="#d52b1e"/>'),
  };
  // financiamento bancário e consórcio: parceiros em análise pela construtora (logos pelo favicon oficial de cada um)
  const PARCEIROS = [["Caixa", "caixa.gov.br"], ["Banco do Brasil", "bb.com.br"], ["Bradesco", "bradesco.com.br"], ["Itaú", "itau.com.br"], ["Santander", "santander.com.br"], ["Banco Inter", "bancointer.com.br"], ["Sicredi", "sicredi.com.br"], ["Sicoob", "sicoob.com.br"],
    ["Embracon", "embracon.com.br"], ["Porto Consórcio", "portoseguro.com.br"], ["Rodobens", "rodobens.com.br"], ["Ademicon", "ademicon.com.br"], ["Bradesco Consórcios", "bradescoconsorcios.com.br"], ["Itaú Consórcio", "consorcio.itau.com.br"], ["Santander Consórcio", "santanderconsorcio.com.br"], ["Consórcio Magalu", "consorciomagalu.com.br"]];
  const NOME = { "pt-BR": "Português", en: "English", es: "Español", zh: "中文", hi: "हिन्दी", ar: "العربية", fr: "Français", bn: "বাংলা", ru: "Русский" };
  const brl = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  const MODO = { "pt-BR": "Modo corretor · sem coleta de dados", en: "Broker mode · no data collection", es: "Modo corredor · sin recopilación de datos" };
  const svg = (n) => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ICON[n]}</svg>`;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const ini = (n) => String(n || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("");
  const post = async (p, body) => { const r = await fetch(`${API}/${p}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.erro || "erro"); return j; };

  const previaAsk = async (txt) => { const r = await fetch("/api/ia-teste", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ property_id: info0.pid, pergunta: txt }) });
    const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.erro || "erro"); return j; };
  let info0 = null;
  fetch(`${API}/info`).then((r) => (r.ok ? r.json() : null)).then((info) => { if (info) { info0 = info; montar(info); } }).catch(() => {});

  function montar(info) {
    const idiomas = info.idiomas && info.idiomas.length ? info.idiomas : ["pt-BR"];
    const nav = (navigator.language || "pt-BR").toLowerCase();
    const TZ_BR = /^America\/(Sao_Paulo|Fortaleza|Recife|Bahia|Belem|Manaus|Cuiaba|Campo_Grande|Porto_Velho|Boa_Vista|Rio_Branco|Noronha|Araguaina|Maceio|Santarem|Eirunepe)$/;
    let noBrasil = nav.startsWith("pt"); try { noBrasil = noBrasil || TZ_BR.test(Intl.DateTimeFormat().resolvedOptions().timeZone || ""); } catch { /* sem Intl */ }
    let lembrado = null; try { lembrado = localStorage.getItem("lc_lang_" + CHAVE); } catch { /* sem storage */ }
    let lang = idiomas.includes(lembrado) ? lembrado : noBrasil && idiomas.includes("pt-BR") ? "pt-BR" : idiomas.find((l) => nav.startsWith(l.toLowerCase().split("-")[0])) || idiomas[0];  // no Brasil, sempre português
    let t = T[lang] || T["pt-BR"], aba = info.ia ? "ia" : "contato", ocupado = false, aberto = false, msgs = null, gate = false, toques = 0, ultimo = 0;
    const LIMITE = 3;
    // Papel pelo login (resolvido no fim): "cliente" (ninguém logado), "corretor" (corretor logado) ou "equipe" (dono logado: só olha).
    let papel = null;
    let previa = false;  // o DONO logado vê o mesmo selo e o chat do cliente, mas nada é gravado (sem cadastro, sem batimento, IA pelo teste do painel)
    const rec = info.recursos || {};
    // Cliente sem cadastro: além da 3ª interação, o popup aparece sozinho 30 s depois de abrir a apresentação
    let relogio = null;
    const armar = () => { clearTimeout(relogio); relogio = null; if (papel !== "cliente" || rec.cadastro === false || info.cliente) return; relogio = setTimeout(() => { if (papel === "cliente" && !gate && !info.cliente) { gate = true; render(); } }, 30000); };
    window.LC_EMBED = { papel: () => papel, abrirIA: () => { if (papel !== "cliente" && !previa) return; aba = info.ia ? "ia" : "contato"; if (pedirCadastro()) return; aberto = true; render(); } };  // o tour 3D (iframe) chama abrirIA() no "Fale conosco"
    const fone = rec.whatsapp === false ? "" : String(info.whatsapp || "").replace(/\D/g, "");
    const avHtml = () => (info.foto ? `<img class="av${info.foto_logo ? " logo" : ""}" src="${esc(info.foto)}" alt="">` : `<span class="av">${esc(ini(info.corretor))}</span>`);
    const host = document.createElement("div"); host.setAttribute("data-lc", ""); const sh = host.attachShadow({ mode: "open" });
    ["keydown", "keyup", "keypress", "wheel"].forEach((ev) => host.addEventListener(ev, (e) => e.stopPropagation()));
    document.body.append(host);
    // o chat segue a barra de baixo da apresentação (legenda no computador, dock no celular): mesma borda esquerda e mesma largura
    const encaixar = () => { const barra = [...document.querySelectorAll(".legend, .dock")].find((b) => b.getClientRects().length && getComputedStyle(b).visibility !== "hidden");
      if (!barra) { host.style.removeProperty("--pl"); host.style.removeProperty("--pw"); host.style.removeProperty("--pb"); return; }
      const r = barra.getBoundingClientRect(); host.style.setProperty("--pl", Math.round(r.left) + "px"); host.style.setProperty("--pw", Math.round(r.width) + "px"); host.style.setProperty("--pb", Math.round(innerHeight - r.top + 10) + "px"); };
    addEventListener("resize", encaixar); setTimeout(encaixar, 600);
    const marcarTour = () => { host.toggleAttribute("data-tour", document.body.classList.contains("tour-on")); host.toggleAttribute("data-card", document.body.classList.contains("cardopen")); };
    new MutationObserver(marcarTour).observe(document.body, { attributes: true, attributeFilter: ["class"] }); marcarTour();
    // conta interações na apresentação (não no widget); na terceira, pede o cadastro
    const interagiu = (e) => { if (papel !== "cliente" || rec.cadastro === false || info.cliente || gate || e.composedPath().includes(host)) return; const agora = Date.now(); if (agora - ultimo < 400) return; ultimo = agora; if (++toques >= LIMITE) { gate = true; render(); } };
    // 3ª interação: no celular conta o toque (pointerdown de dedo/caneta); no computador conta o CLIQUE completo do mouse (não tecla, não arrasto)
    document.addEventListener("pointerdown", (e) => { if (e.pointerType === "touch" || e.pointerType === "pen") interagiu(e); }, true);
    document.addEventListener("click", (e) => { if (e.pointerType === "mouse" || (!e.pointerType && !("ontouchstart" in window))) interagiu(e); }, true);
    setInterval(() => { if (papel === "cliente" && !document.hidden) fetch(`${API}/heartbeat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }).catch(() => {}); }, 30000);

    const cadastro = () => `<div class="gate" ${gate ? "" : "hidden"} role="dialog" aria-modal="true" aria-labelledby="lc-reg-t"><form class="reg" novalidate>
      <p class="eyebrow">${esc(info.empresa || info.empreendimento)}</p><h2 id="lc-reg-t">${esc(t.reg_t)}</h2><p class="lead">${esc(t.reg_s(info.corretor))}</p>
      <label>${esc(t.reg_nome)}<input class="t" name="nome" type="text" autocomplete="name" maxlength="120"></label>
      <div class="etapa2" hidden>
      <label>${esc(t.reg_fone)}<input class="t" name="telefone" type="tel" inputmode="tel" autocomplete="tel" placeholder="(47) 99999-9999"></label>
      <label>${esc(t.reg_mail)}<input class="t" name="email" type="email" autocomplete="email"></label>
      <label class="ck"><input name="ok" type="checkbox"><span>${esc(t.reg_ok(info.corretor, info.empresa || "a construtora"))}</span></label></div>
      <p class="er" role="alert"></p><button class="btn" type="submit">${esc(t.reg_go)}</button><p class="fine">${esc(t.reg_fine(info.corretor))}</p></form></div>`;
    const ia = () => `<div class="msgs" role="log" aria-live="polite"><div class="m bot">${esc(t.hello(info.corretor, info.cliente && info.cliente.nome))}</div></div>
      <div class="sug">${t.sug.map((s) => `<button type="button" data-s="${esc(s)}">${esc(s)}</button>`).join("")}</div><p class="note">${esc(t.note)}</p>
      <form class="in"><input type="text" maxlength="500" placeholder="${esc(t.ph)}" aria-label="${esc(t.ph)}" autocomplete="off"><button class="go" aria-label="${esc(t.send)}">${svg("send")}</button></form>`;
    const contato = () => `<div class="ct">
      <div class="card">${avHtml()}<div><b>${esc(info.corretor)}</b><small>${esc(info.empresa || "")}</small></div></div>
      ${fone ? `<a class="btn alt" target="_blank" rel="noopener" href="https://wa.me/${fone}?text=${encodeURIComponent(t.wa_text(info.empreendimento))}">${svg("wa")}${esc(t.wa)}</a>` : ""}
      <form class="rec" novalidate><label>${esc(t.msg)}<textarea name="m" maxlength="800" placeholder="${esc(t.msg_ph)}"></textarea></label><p class="er" role="alert"></p><p class="ok" role="status"></p><button class="btn" type="submit">${esc(t.send)}</button></form></div>`;

    // ───── Proposta do cliente: unidades disponíveis com preço (tabela do painel) + condições que ele personaliza ─────
    let UN = null, P = { unit: "", modo: "direto", entradaPct: 15, n: 100, balN: 4, balPer: "anual", balPct: 10, chavesPct: 30, obs: "" };
    const carregarUnidades = async () => { if (UN) return UN; try { const r = await fetch(`${API}/unidades`); UN = r.ok ? await r.json() : { unidades: [] }; } catch { UN = { unidades: [] }; } if (!P.unit && UN.unidades[0]) P.unit = UN.unidades[0].id; return UN; };
    const calc = () => { const u = (UN && UN.unidades.find((x) => x.id === P.unit)) || (UN && UN.unidades[0]); if (!u) return null;
      const price = u.price, entrada = price * P.entradaPct / 100, chaves = price * P.chavesPct / 100, balTot = P.balN ? price * P.balPct / 100 : 0, balV = P.balN ? balTot / P.balN : 0, resto = price - entrada - chaves - balTot;
      return { u, price, entrada, chaves, balTot, balV, resto, mensal: resto / P.n, ok: resto > 0 }; };
    const proposta = () => {
      if (!UN) { carregarUnidades().then(() => { if (aba === "prop" && aberto) render(); }); return `<div class="pr"><p class="note">…</p></div>`; }
      if (!UN.unidades.length) return `<div class="pr"><p class="warn">${esc(t.fail)}</p></div>`;
      const c = calc(), opt = (vs, cur, suf) => vs.map((v) => `<option value="${v}" ${v === cur ? "selected" : ""}>${v}${suf || ""}</option>`).join("");
      const seg = `<div class="seg" role="group"><button type="button" data-modo="direto" aria-pressed="${P.modo === "direto"}">${esc(t.pr_direto)}</button><button type="button" data-modo="banco" aria-pressed="${P.modo === "banco"}">${svg("lock")}${esc(t.pr_banco)}</button></div>`;
      if (P.modo === "banco") return `<div class="pr">${seg}
        <div class="frz"><span class="frz-tag">${svg("lock")}${esc(t.pr_banco_t)}</span><p>${esc(t.pr_banco_s)}</p></div>
        <div class="mq" aria-label="${esc(t.pr_banco_t)}"><div class="mq-in">${PARCEIROS.concat(PARCEIROS).map(([n, d]) => `<span class="mq-it"><img src="https://www.google.com/s2/favicons?domain=${d}&sz=64" alt="" loading="lazy" referrerpolicy="no-referrer"><small>${esc(n)}</small></span>`).join("")}</div></div>
        <button class="btn alt2" type="button" data-modo="direto">${esc(t.pr_banco_volta)}</button></div>`;
      return `<div class="pr">
        ${UN.ilustrativo ? `<p class="warn">${esc(t.pr_ilus)}</p>` : ""}
        <label>${esc(t.pr_unit)}<select data-pr="unit">${UN.unidades.map((u) => `<option value="${u.id}" ${u.id === P.unit ? "selected" : ""}>Apto ${u.id} · ${u.andar}º${u.area ? " · " + esc(u.area) + " m²" : ""} · ${brl(u.price)}</option>`).join("")}</select></label>
        ${seg}
        <div class="pr-grid">
          <label>${esc(t.pr_entrada)}<select data-pr="entradaPct">${opt([5, 10, 15, 20, 25, 30, 40], P.entradaPct, "%")}</select></label>
          <label>${esc(t.pr_n)}<select data-pr="n">${opt([36, 48, 60, 72, 80, 100, 120], P.n, "x")}</select></label>
          <label>${esc(t.pr_bal)}<select data-pr="balN">${opt([0, 2, 4, 6, 8], P.balN, "")}</select></label>
          <label>${esc(t.pr_balper)}<select data-pr="balPer"><option value="semestral" ${P.balPer === "semestral" ? "selected" : ""}>${esc(t.pr_sem)}</option><option value="anual" ${P.balPer === "anual" ? "selected" : ""}>${esc(t.pr_anu)}</option></select></label>
          <label>${esc(t.pr_balpct)}<select data-pr="balPct">${opt([0, 5, 10, 15, 20], P.balPct, "%")}</select></label>
          <label>${esc(t.pr_chaves)}<select data-pr="chavesPct">${opt([0, 10, 20, 30, 40, 50], P.chavesPct, "%")}</select></label>
        </div>
        ${c ? `<div class="pr-sum">
          <div><span>${esc(t.pr_price)}</span><span>${brl(c.price)}</span></div>
          <div><span>${esc(t.pr_entrada)} · ${P.entradaPct}%</span><span>${brl(c.entrada)}</span></div>
          <div><span>${esc(t.pr_n)}</span><span>${c.ok ? `${P.n}x ${brl(c.mensal)}` : "—"}</span></div>
          <div><span>${esc(t.pr_bal)}</span><span>${P.balN ? `${P.balN}x ${brl(c.balV)} (${esc(P.balPer === "semestral" ? t.pr_sem : t.pr_anu)})` : esc(t.pr_nobal)}</span></div>
          <div><span>${esc(t.pr_chaves)} · ${P.chavesPct}%</span><span>${brl(c.chaves)}</span></div>
          <div class="tot"><span>${esc(t.pr_total)}</span><span>${brl(c.price)}</span></div></div>` : ""}
        <label>${esc(t.pr_obs)}<textarea data-pr="obs" maxlength="600">${esc(P.obs)}</textarea></label>
        <p class="er" role="alert">${c && !c.ok ? esc(t.pr_bad) : ""}</p><p class="ok" role="status"></p>
        <button class="btn" type="button" data-enviar-pr ${c && c.ok ? "" : "disabled"}>${esc(t.pr_send)}</button>
        <p class="note" style="padding:0">${esc(t.pr_fine)}</p></div>`;
    };
    function ligarProposta() {
      const q = (s) => sh.querySelector(s);
      sh.querySelectorAll("[data-pr]").forEach((el) => { if (el.tagName === "TEXTAREA") el.addEventListener("input", () => { P.obs = el.value; }); else el.addEventListener("change", () => { const k = el.dataset.pr; P[k] = k === "unit" || k === "balPer" ? el.value : Number(el.value); render(); }); });
      sh.querySelectorAll("[data-modo]").forEach((b) => (b.onclick = () => { P.modo = b.dataset.modo; render(); }));
      const env = q("[data-enviar-pr]"); if (!env) return;
      env.onclick = async () => { if (pedirCadastro()) return; const c = calc(); if (!c || !c.ok) return; const er = q(".pr .er"), ok = q(".pr .ok"); er.textContent = ok.textContent = ""; env.disabled = true;
        if (previa) { ok.textContent = "Visão da construtora: a proposta não é enviada."; env.disabled = false; return; }
        try { await post("proposta", { unit: P.unit, modo: "direto", entrada_pct: P.entradaPct, mensais: P.n, baloes: P.balN, balao_period: P.balPer, baloes_pct: P.balPct, chaves_pct: P.chavesPct, obs: P.obs }); ok.textContent = t.pr_ok(info.corretor); }
        catch (x) { er.textContent = x.message === "erro" || x instanceof TypeError ? t.net : x.message; env.disabled = false; } };
    }

    // ───── Corretor: dados para proposta (nome, telefone, e-mail, assinatura digital) → ficam no painel da construtora ─────
    const CK = "lc_corretor_card", SK = "lc_cartao_" + code;
    let cartaoAberto = false, enviarAberto = false, adiado = false;
    const lerCartao = () => { try { return JSON.parse(localStorage.getItem(CK) || "null"); } catch { return null; } };
    const cartaoOk = () => !!info.cartao;  // vem do servidor: uma vez cadastrado (pela construtora ou pelo corretor), o popup não abre mais
    const publicar = (c) => { window.LC_CORRETOR = c; document.dispatchEvent(new CustomEvent("lc:corretor", { detail: c })); };
    const dadosCorretor = () => { const l = lerCartao(); return { nome: info.corretor, telefone: info.whatsapp, email: info.corretor_email || "", ...(l && l.nome === info.corretor ? { assinatura: l.assinatura } : {}) }; };
    if (info.cartao) publicar(dadosCorretor());
    const formCorretor = () => { const c = {}; return `<div class="gate" role="dialog" aria-modal="true" aria-labelledby="lc-ct-t"><form class="reg ct" novalidate>
      <p class="eyebrow">${esc(info.empresa || info.empreendimento)} · Corretor</p><h2 id="lc-ct-t">Seus dados para a proposta</h2>
      <p class="lead">Nome, contato e assinatura vão na proposta que você enviar ao cliente e ficam à disposição da construtora no painel dela. <b>Este cadastro é feito uma única vez</b>: para alterar depois, fale com a construtora.</p>
      <label>Nome<input class="t" name="nome" type="text" autocomplete="name" maxlength="120" value="${esc(c.nome || "")}"></label>
      <div class="two"><label>Telefone / WhatsApp<input class="t" name="telefone" type="tel" inputmode="tel" autocomplete="tel" placeholder="(47) 99999-9999" value="${esc(c.telefone || "")}"></label>
      <label>E-mail<input class="t" name="email" type="email" autocomplete="email" value="${esc(c.email || "")}"></label></div>
      <div class="sig-w"><span style="font-weight:600;font-size:13px">Assinatura digital</span><canvas class="sig" width="720" height="240" aria-label="Quadro de assinatura: desenhe com o dedo ou o mouse"></canvas>
      <div class="row"><span>Desenhe com o dedo ou o mouse.</span><button type="button" data-limpar>Limpar</button></div></div>
      <label class="ck"><input name="ok" type="checkbox"><span>Confirmo que sou o corretor responsável por este atendimento e autorizo o uso dos meus dados e da assinatura nas propostas.</span></label>
      <p class="er" role="alert"></p><button class="btn" type="submit">Salvar e continuar</button><button class="btn alt2" type="button" data-nao>Agora não</button></form></div>`; };
    const enviarForm = () => { const c = window.LC_CORRETOR || dadosCorretor(); return `<div class="gate" role="dialog" aria-modal="true" aria-labelledby="lc-en-t"><form class="reg ct" novalidate>
      <p class="eyebrow">${esc(info.empreendimento)}</p><h2 id="lc-en-t">Enviar ao cliente</h2>
      <p class="lead">Mensagem com o link da apresentação e a sua assinatura (${esc(c.nome || "corretor")}).</p>
      <label>Nome do cliente<input class="t" name="cn" type="text" autocomplete="off" maxlength="120"></label>
      <div class="two"><label>WhatsApp do cliente<input class="t" name="ct" type="tel" inputmode="tel" placeholder="(47) 99999-9999"></label><label>E-mail do cliente<input class="t" name="ce" type="email"></label></div>
      <button class="btn" type="button" data-wa>Enviar pelo WhatsApp</button><button class="btn alt2" type="button" data-mail>Enviar por e-mail</button><button class="btn alt2" type="button" data-fechar>Fechar</button></form></div>`; };
    function renderCorretor() {
      if (!info.cartao && !adiado) { cartaoAberto = true; enviarAberto = false; }
      sh.innerHTML = `<style>${CSS}</style>${cartaoAberto ? formCorretor() : ""}${enviarAberto ? enviarForm() : ""}<div class="modo" role="status"><span>${esc(MODO[lang] || MODO["pt-BR"])}</span>
        ${info.cartao ? '<button class="sep" type="button" data-enviar>Enviar ao cliente</button>' : '<button class="sep" type="button" data-cartao>Meus dados</button>'}</div>`;
      const bc = sh.querySelector("[data-cartao]"); if (bc) bc.onclick = () => { adiado = false; cartaoAberto = true; render(); };
      const be = sh.querySelector("[data-enviar]"); if (be) be.onclick = () => { enviarAberto = true; cartaoAberto = false; render(); };
      const fe = sh.querySelector(".gate form"); if (!fe) return;
      if (fe.querySelector("[data-fechar]")) {
        fe.querySelector("[data-fechar]").onclick = () => { enviarAberto = false; render(); };
        const msg = () => { const k = window.LC_CORRETOR || dadosCorretor(), n = fe.elements.cn.value.trim(), url = `${location.origin}/r/${code}`;
          return { texto: `Olá${n ? " " + n : ""}! Preparei esta apresentação do ${info.empreendimento} para você: ${url}\n\n${k.nome || ""}${k.telefone ? " · " + k.telefone : ""}${k.email ? " · " + k.email : ""}`, k, n }; };
        fe.querySelector("[data-wa]").onclick = () => { const m = msg(), d = fe.elements.ct.value.replace(/\D/g, ""), num = d.length === 10 || d.length === 11 ? "55" + d : d; window.open(`https://wa.me/${num}?text=${encodeURIComponent(m.texto)}`, "_blank", "noopener"); };
        fe.querySelector("[data-mail]").onclick = () => { const m = msg(); location.href = `mailto:${fe.elements.ce.value.trim()}?subject=${encodeURIComponent("Apresentação · " + info.empreendimento)}&body=${encodeURIComponent(m.texto)}`; };
        return;
      }
      // formulário de dados + assinatura
      const cv = fe.querySelector("canvas.sig"), cx = cv.getContext("2d"); let desenhando = false, tracos = 0, ult = null;
      cx.lineWidth = 3.4; cx.lineCap = "round"; cx.lineJoin = "round"; cx.strokeStyle = "#16302e";
      const pt = (e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height]; };
      cv.onpointerdown = (e) => { desenhando = true; ult = pt(e); cv.setPointerCapture(e.pointerId); cx.beginPath(); cx.arc(ult[0], ult[1], 1.2, 0, 7); cx.fill(); tracos++; e.preventDefault(); };
      cv.onpointermove = (e) => { if (!desenhando) return; const p = pt(e); cx.beginPath(); cx.moveTo(ult[0], ult[1]); cx.lineTo(p[0], p[1]); cx.stroke(); ult = p; tracos++; };
      cv.onpointerup = cv.onpointercancel = () => { desenhando = false; };
      fe.querySelector("[data-limpar]").onclick = () => { cx.clearRect(0, 0, cv.width, cv.height); tracos = 0; };
      fe.querySelector("[data-nao]").onclick = () => { adiado = true; cartaoAberto = false; render(); };
      setTimeout(() => fe.elements.nome.focus(), 50);
      fe.onsubmit = async (e) => { e.preventDefault(); const er = fe.querySelector(".er"), g = (n) => fe.elements[n].value.trim(); er.textContent = "";
        if (g("nome").length < 2) return (er.textContent = "Informe seu nome.");
        if (g("telefone").replace(/\D/g, "").length < 10) return (er.textContent = "Informe um telefone com DDD.");
        if (!/^\S+@\S+\.\S+$/.test(g("email"))) return (er.textContent = "Informe um e-mail válido.");
        if (tracos < 8) return (er.textContent = "Faça a assinatura digital no quadro.");
        if (!fe.elements.ok.checked) return (er.textContent = "Marque a confirmação para continuar.");
        const b = fe.querySelector("button[type=submit]"); b.disabled = true; const assinatura = cv.toDataURL("image/png");
        try { await post("corretor", { nome: g("nome"), telefone: g("telefone"), email: g("email"), assinatura, consentimento: true });
          const cartao = { nome: g("nome"), telefone: g("telefone"), email: g("email"), assinatura };
          try { localStorage.setItem(CK, JSON.stringify(cartao)); sessionStorage.setItem(SK, "1"); } catch { /* sem storage */ }
          info.cartao = true; publicar({ ...cartao, email: cartao.email }); cartaoAberto = false; render();
        } catch (x) { er.textContent = x.message === "erro" || x instanceof TypeError ? t.net : x.message; b.disabled = false; if (/já foram cadastrados/.test(x.message)) { info.cartao = true; setTimeout(() => { cartaoAberto = false; render(); }, 1800); } } };
    }
    // nomes de quem atende: "A", "A e B" ou "A, B e C" (comissão dividida mostra todos)
    const nomes = () => { const l = info.corretores && info.corretores.length ? info.corretores : [info.corretor]; return l.length < 2 ? l[0] : l.slice(0, -1).join(", ") + " e " + l[l.length - 1]; };
    function render() {
      t = T[lang] || T["pt-BR"];
      if (papel === null || (papel === "equipe" && !previa)) { sh.innerHTML = ""; return; } // carregando, ou outra pessoa da equipe olhando: nada por cima do mapa
      if (papel === "corretor") { renderCorretor(); return; } // apresentação normal: sem faixa, sem IA, sem cadastro de cliente, sem batimento
      sh.innerHTML = `<style>${CSS}</style>${cadastro()}
        <div class="dockbar"><button class="fab" ${aberto ? "hidden" : ""} aria-label="${esc(t.open)}">${svg("chat")}${esc(info.ia ? t.ask : t.contact + " " + info.corretor.split(" ")[0])}</button>
        <button class="badge" type="button" ${rec.selo === false ? "hidden" : ""} title="${esc(t.open)}">${avHtml()}<span class="t"><small>${esc(t.served)}</small><b>${esc(nomes())}</b></span></button></div>
        <section class="panel" role="dialog" aria-label="${esc(t.open)}" ${aberto ? "" : "hidden"}>
          <div class="hd">${avHtml()}<div class="who"><b>${esc(info.corretor)}</b><span>${esc(info.empreendimento)}${info.construtora ? "" : previa ? " · visão da construtora" : ""}</span></div>
            ${idiomas.length > 1 ? `<button class="lang" type="button" aria-haspopup="listbox" aria-expanded="false" aria-label="${esc(t.lang)}: ${esc(NOME[lang] || lang)}">${BAND[lang] || fl('<rect width="24" height="17" fill="#4d6460"/>')}</button>` : ""}
            <button class="x" aria-label="${esc(t.close)}">${svg("x")}</button></div>
          ${info.outro_corretor ? `<p class="warn" style="margin-top:10px">${esc(t.other(info.outro_corretor))}</p>` : ""}
          ${info.ia || info.proposta ? `<div class="tabs" role="tablist">${info.ia ? `<button role="tab" data-a="ia" aria-selected="${aba === "ia"}">${esc(t.ask)}</button>` : ""}${info.proposta ? `<button role="tab" data-a="prop" aria-selected="${aba === "prop"}">${esc(t.pr_tab)}</button>` : ""}<button role="tab" data-a="contato" aria-selected="${aba === "contato"}">${esc(t.contact)} ${esc(info.corretor.split(" ")[0])}</button></div>` : ""}
          ${idiomas.length > 1 ? `<div class="langs" role="listbox" hidden>${idiomas.map((l) => `<button type="button" role="option" data-l="${l}" aria-pressed="${l === lang}">${BAND[l] || fl('<rect width="24" height="17" fill="#4d6460"/>')} ${esc(NOME[l] || l)}</button>`).join("")}</div>` : ""}
          <div class="body">${aba === "ia" ? ia() : aba === "prop" ? proposta() : contato()}</div></section>`;
      if (msgs && aba === "ia") { sh.querySelector(".msgs").innerHTML = msgs; sh.querySelector(".sug")?.remove(); }
      ligar();
    }
    function ligar() {
      const q = (s) => sh.querySelector(s), painel = q(".panel"), fab = q(".fab");
      const abrir = () => { if (pedirCadastro()) return; encaixar(); aberto = true; painel.hidden = false; fab.hidden = true; (q(".in input") || q("textarea"))?.focus(); };
      fab.onclick = abrir; q(".badge").onclick = () => { if (pedirCadastro()) return; aba = "contato"; aberto = true; render(); (sh.querySelector("textarea") || sh.querySelector(".x"))?.focus(); };
      q(".x").onclick = () => { aberto = false; painel.hidden = true; fab.hidden = false; fab.focus(); };
      painel.addEventListener("keydown", (e) => { if (e.key === "Escape") q(".x").click(); });
      const lb = q(".lang"), ll = q(".langs");
      if (lb && ll) { lb.onclick = (ev) => { ev.stopPropagation(); ll.hidden = !ll.hidden; lb.setAttribute("aria-expanded", String(!ll.hidden)); if (!ll.hidden) ll.querySelector("[aria-pressed=true]")?.focus(); };
        ll.querySelectorAll("[data-l]").forEach((b) => (b.onclick = () => { lang = b.dataset.l; try { localStorage.setItem("lc_lang_" + CHAVE, lang); } catch { /* sem storage */ } render(); }));
        painel.addEventListener("click", (ev) => { if (!ll.hidden && !ev.composedPath().includes(ll) && !ev.composedPath().includes(lb)) { ll.hidden = true; lb.setAttribute("aria-expanded", "false"); } }); }
      if (aba === "prop") ligarProposta();
      sh.querySelectorAll(".tabs button").forEach((b) => (b.onclick = () => { aba = b.dataset.a; render(); (sh.querySelector(".in input") || sh.querySelector("textarea"))?.focus(); }));
      sh.querySelectorAll(".sug button").forEach((b) => (b.onclick = () => perguntar(b.dataset.s)));
      const fi = q("form.in"); if (fi) fi.onsubmit = (e) => { e.preventDefault(); const i = fi.querySelector("input"), v = i.value.trim(); if (v) { i.value = ""; perguntar(v); } };
      const fg = q("form.reg"); if (fg) { fg.onsubmit = registrar; fg.elements.nome.addEventListener("input", () => { if (fg.elements.nome.value.trim().length >= 2) fg.querySelector(".etapa2").hidden = false; }); if (gate) setTimeout(() => fg.elements.nome.focus(), 50); }
      const fr = q("form.rec"); if (fr) fr.onsubmit = async (e) => { e.preventDefault(); const er = fr.querySelector(".er"), ok = fr.querySelector(".ok"), v = fr.elements.m.value.trim(); er.textContent = ok.textContent = "";
        if (!v) return; if (previa) { ok.textContent = "Visão da construtora: o recado não é enviado."; return; } const b = fr.querySelector("button"); b.disabled = true;
        try { await post("message", { mensagem: v }); ok.textContent = t.msg_ok.replace("{c}", info.corretor); fr.elements.m.value = ""; } catch (x) { er.textContent = x.message === "erro" || x instanceof TypeError ? t.net : x.message; } b.disabled = false; };
    }
    async function registrar(e) {
      e.preventDefault(); const f = e.target, er = f.querySelector(".er"), g = (n) => f.elements[n].value.trim(); er.textContent = "";
      const e2 = f.querySelector(".etapa2");
      if (g("nome").length < 2) { er.textContent = t.reg_need; f.elements.nome.focus(); return; }
      if (e2.hidden) { e2.hidden = false; f.elements.telefone.focus(); return; }  // 1ª etapa: só o nome; agora pede o contato
      if (!(g("telefone") || g("email"))) return (er.textContent = t.reg_need);
      if (!f.elements.ok.checked) return (er.textContent = t.reg_agree);
      const b = f.querySelector("button[type=submit]"); b.disabled = true;
      try { const r = await post("register", { nome: g("nome"), telefone: g("telefone"), email: g("email"), consentimento: true });
        info.cliente = r.cliente; info.corretor = r.corretor; info.whatsapp = r.whatsapp || info.whatsapp; gate = false;
        try { const i2 = await (await fetch(`${API}/info`)).json(); info.foto = i2.foto || ""; info.corretores = i2.corretores; } catch { /* segue sem foto */ } render(); }
      catch (x) { er.textContent = x.message === "erro" || x instanceof TypeError ? t.net : x.message; b.disabled = false; }
    }
    function pedirCadastro() { if (previa) return false; if (!info.cliente && rec.cadastro !== false) { gate = true; render(); return true; } return false; }
    function bolha(cls, texto) { const d = document.createElement("div"); d.className = "m " + cls; d.textContent = texto; const l = sh.querySelector(".msgs"); l.append(d); l.scrollTop = l.scrollHeight; return d; }
    async function perguntar(txt) {
      if (pedirCadastro() || ocupado) return; ocupado = true;
      const go = sh.querySelector(".go"); go && (go.disabled = true); sh.querySelector(".sug")?.remove();
      bolha("me", txt); const esp = bolha("bot", t.thinking);
      try { const r = previa ? await previaAsk(txt) : await post("ask", { pergunta: txt, lang });
        if (r.resposta) esp.textContent = r.resposta.replace(/\*\*(.+?)\*\*/g, "$1").replace(/^#+\s*/gm, "");
        else { esp.className = "m err"; esp.textContent = r.motivo === "limite" ? t.limit : t.fail; }
      } catch (e) { esp.className = "m err"; esp.textContent = e.message === "erro" ? t.net : e.message; }
      ocupado = false; go && (go.disabled = false); msgs = sh.querySelector(".msgs").innerHTML; sh.querySelector(".msgs").scrollTop = 1e6;
    }
    papel = info.meu_link ? "corretor" : info.equipe ? "equipe" : "cliente"; previa = papel === "equipe" && !!info.dono; // logado no link dele: corretor; logado em qualquer outro: só olha
    cartaoAberto = papel === "corretor" && !cartaoOk(); armar(); render();
  }
})();
