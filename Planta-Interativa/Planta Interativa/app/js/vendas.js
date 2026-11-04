import {IC} from "./icons.js";
// Ferramentas de venda (protótipo, "em breve"): enviar proposta com a assinatura do corretor, lead do cliente,
// assistente de dúvidas com IA em PT/EN/ES e link direto para cada casa. Nada aqui envia ou guarda dados.
import {AREAS,BOOK,FLOW,TYPES,UNITS,areaDist,avail,brl,num,reduceM} from "./data.js";
import {state} from "./state.js";
import {mediaReply,mediaHTML,choicesHTML,downloadAll,shareText} from "./chatmedia.js";

const BROKER={name:"Corretor(a) Bossa",creci:"CRECI-AL 00000 (exemplo)",initials:"CB"}; // shortcut: corretor fixo de exemplo; vem do login do corretor quando existir
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

/* ---------- link direto para a casa (#brisa-06) ---------- */
const slug=u=>u.label.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/\s+/g,"-");
function syncHash(u){const h=u&&!u.area?"#"+slug(u):"";if(location.hash!==h)history.replaceState(null,"",location.pathname+location.search+h)}
const unitFromHash=()=>UNITS.find(u=>"#"+slug(u)===location.hash.toLowerCase());
function toast(msg){const t=$("toast");t.textContent=msg;t.hidden=false;clearTimeout(toast.tm);toast.tm=setTimeout(()=>t.hidden=true,2600)}
const casaURL=u=>location.origin+location.pathname+"#"+slug(u);
async function copy(text,ok){try{await navigator.clipboard.writeText(text);toast(ok)}catch(e){toast(text)}}
// mensagens prontas: WhatsApp (com o número do cliente quando houver) e e-mail
const waURL=(text,tel="")=>{let d=tel.replace(/\D/g,"");if(d.length===10||d.length===11)d="55"+d;return`https://wa.me/${d}?text=${encodeURIComponent(text)}`};
const mailURL=(subject,body,to="")=>`mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
const casaTxt=u=>`${u.label} · Bossa Eco Luxury Villas
${TYPES[u.type].name} · ${num(u.priv)} m² privativos · ${TYPES[u.type].suites} suítes${u.price?` · ${brl(u.price)}`:""}
Praia do Toque, Rota Ecológica dos Milagres
${casaURL(u)}`;
function shareMenu(u,btn){const cta=btn.closest(".cta");let pop=cta.querySelector(".share-pop");if(pop){pop.remove();btn.setAttribute("aria-expanded","false");return}
  const t=casaTxt(u);pop=document.createElement("div");pop.className="share-pop";pop.setAttribute("role","menu");pop.setAttribute("aria-label",`Compartilhar ${u.label}`);
  pop.innerHTML=`<a role="menuitem" href="${esc(waURL(t))}" target="_blank" rel="noopener">WhatsApp</a><a role="menuitem" href="${esc(mailURL(`${u.label} · Bossa Eco Luxury Villas`,t))}">E-mail</a><button role="menuitem" type="button" data-cta="copy">Copiar link</button>${navigator.share&&matchMedia("(pointer:coarse)").matches?`<button role="menuitem" type="button" data-cta="native">Mais opções…</button>`:""}`;
  cta.append(pop);btn.setAttribute("aria-expanded","true");pop.querySelector("a,button").focus({preventScroll:true})}
const closeShare=()=>{document.querySelectorAll(".share-pop").forEach(p=>{p.closest(".cta")?.querySelector('[data-cta="sharemenu"]')?.setAttribute("aria-expanded","false");p.remove()})};

/* ---------- botões na ficha ---------- */
function ctaHTML(u){
  const main=u.status!=="d"?"":`<button class="cta-main" data-cta="proposta">Enviar proposta</button>`;
  return `<div class="cta">${main}<button class="cta-sec" data-cta="sharemenu" aria-haspopup="menu" aria-expanded="false">${IC.out} Compartilhar</button><button class="ai-pill cta-ai" data-cta="ai" aria-label="Tirar dúvidas" title="Tirar dúvidas"><i aria-hidden="true">${IC.spark}</i><span>Tirar dúvidas</span></button></div>`}

/* ---------- proposta (corretor) e interesse (cliente) ---------- */
const dlg=$("proposta");let dlgFrom=null;
function openProposta(u,kind){dlgFrom=document.activeElement;const box=dlg.querySelector(".box");
  const flow=FLOW.map(([l,p,n])=>`<li><span>${l}</span><b>${n>1?n+"× ":""}${brl(u.price*p/n)}</b></li>`).join("");
  box.innerHTML=kind==="proposta"?`<button class="x" aria-label="Fechar">×</button>
    <div class="eyebrow">Proposta · demonstração <span class="soon">em breve</span></div><h2 id="propt">${u.label}</h2>
    <p class="lead">${TYPES[u.type].name} · ${num(u.priv)} m² privativos · ${TYPES[u.type].suites} suítes</p>
    <div class="pp-val"><small>Valor de tabela</small><b>${brl(u.price)}</b></div><ul class="pp-flow">${flow}</ul>
    <form class="pp-form" onsubmit="return false"><label>Cliente<input name="nome" autocomplete="off" placeholder="Nome completo"></label>
      <label>E-mail<input name="email" type="email" autocomplete="off" placeholder="cliente@email.com"></label><label>WhatsApp<input name="tel" type="tel" autocomplete="off" placeholder="(00) 00000-0000"></label></form>
    <div class="pp-sign"><span class="pp-av">${BROKER.initials}</span><div><small>Assinada digitalmente por</small><b>${BROKER.name}</b><span>${BROKER.creci}</span><i class="pp-ink">${BROKER.name}</i></div><span class="soon">ICP-Brasil · em breve</span></div>
    <p class="fine">Validade de 7 dias. Preços da tabela vigente, sujeitos a alteração e à aprovação da incorporadora.</p>
    <div class="pp-actions"><button class="cta-main" data-pp="gerar">Gerar proposta assinada</button></div>`
  :`<button class="x" aria-label="Fechar">×</button>
    <div class="eyebrow">Tenho interesse <span class="soon">em breve</span></div><h2 id="propt">${u.label}</h2>
    <p class="lead">Um corretor do Bossa fala com você para tirar dúvidas, agendar uma visita e montar a proposta.</p>
    <form class="pp-form" onsubmit="return false"><label>Nome<input name="nome" autocomplete="off" placeholder="Seu nome"></label><label>WhatsApp<input name="tel" type="tel" autocomplete="off" placeholder="(00) 00000-0000"></label>
      <label>Melhor horário<select name="hora"><option>Manhã</option><option>Tarde</option><option>Noite</option></select></label></form>
    <div class="pp-actions"><button class="cta-main" data-pp="lead">Quero falar com um corretor</button></div>`;
  dlg.hidden=false;requestAnimationFrame(()=>dlg.classList.add("on"));box.scrollTop=0;box.querySelector(".x").focus({preventScroll:true})}
function closeProposta(){dlg.classList.remove("on");setTimeout(()=>dlg.hidden=true,250);dlgFrom?.focus?.({preventScroll:true});dlgFrom=null}
dlg.addEventListener("click",e=>{if(e.target===dlg||e.target.closest(".x"))return closeProposta();const b=e.target.closest("[data-pp]");if(!b)return;
  if(b.dataset.pp==="copy")return copy(casaURL(state.selected),"Link da casa copiado");
  const val=k=>dlg.querySelector(`[name="${k}"]`)?.value.trim()||"",nome=val("nome"),u=state.selected;
  // proposta pronta para enviar: mesmo texto no WhatsApp e no e-mail, com a assinatura do corretor
  const prop=b.dataset.pp==="gerar"&&`Olá${nome?" "+nome:""}! Segue a proposta da ${u.label} no Bossa Eco Luxury Villas.

Valor de tabela: ${brl(u.price)}
${FLOW.map(([l,p,n])=>`${l}: ${n>1?n+"× ":""}${brl(u.price*p/n)}`).join("\n")}

Validade: 7 dias. Preços sujeitos a alteração e à aprovação da incorporadora.
Assinada digitalmente por ${BROKER.name} · ${BROKER.creci}

Veja a casa: ${casaURL(u)}`;
  dlg.querySelector(".pp-actions").innerHTML=b.dataset.pp==="gerar"
    ?`<div class="pp-done" role="status"><b>Proposta gerada · demonstração</b><span>Assinada por ${BROKER.name}${nome?` para ${esc(nome)}`:""}, validade de 7 dias. Envie agora:</span>
      <div class="pp-share"><a class="cta-main" href="${esc(waURL(prop,val("tel")))}" target="_blank" rel="noopener">Enviar por WhatsApp</a><a class="cta-sec" href="${esc(mailURL(`Proposta ${u.label} · Bossa Eco Luxury Villas`,prop,val("email")))}">Enviar por e-mail</a>
      <button class="cta-sec" type="button" data-pp="copy">Copiar link</button><button class="cta-sec" type="button" disabled>PDF assinado · em breve</button></div></div>`
    :`<div class="pp-done" role="status"><b>Pedido registrado · demonstração</b><span>Na versão final um corretor recebe seu contato${nome?`, ${esc(nome)},`:""} na hora e responde pelo WhatsApp.</span></div>`});

/* ---------- assistente de dúvidas (IA, protótipo com respostas do material do empreendimento) ---------- */
const ai=$("ai"),log=$("ailog"),form=$("aiform"),input=$("aiq"),send=form.querySelector("button"),jump=$("aijump"),quick=$("aiquick");let lang="pt";
const sug=Object.assign(document.createElement("div"),{id:"aisug",className:"ai-sug"});
const L={
  pt:{title:"Pergunte ao Bossa",hello:"Olá! Sou o assistente do Bossa. Pergunte sobre as casas, o condomínio ou as condições.",ph:"Escreva sua dúvida…",
    sug:["Qual a metragem da piscina?","Quantas suítes?","Tem heliporto?","Qual o potencial de valorização?","Quando é a entrega?"],soon:"IA · em breve",
    note:"Protótipo: respostas do book do empreendimento. A versão final usa IA com o memorial completo."},
  en:{title:"Ask Bossa",hello:"Hi! I'm the Bossa assistant. Ask about the homes, the community or the payment terms.",ph:"Type your question…",
    sug:["How big is the pool?","How many suites?","Is there a helipad?","What about appreciation?","When is delivery?"],soon:"AI · coming soon",
    note:"Prototype: answers from the project brochure. The final version uses AI with the full specifications."},
  es:{title:"Pregunte a Bossa",hello:"¡Hola! Soy el asistente de Bossa. Pregunte por las casas, el condominio o las condiciones.",ph:"Escriba su pregunta…",
    sug:["¿Qué tamaño tiene la piscina?","¿Cuántas suites?","¿Hay helipuerto?","¿Potencial de valorización?","¿Cuándo es la entrega?"],soon:"IA · próximamente",
    note:"Prototipo: respuestas del folleto del proyecto. La versión final usa IA con la memoria descriptiva completa."}};
L.pt.quick=[["Fotos","Quero ver fotos","image"],["Vídeo","Quero ver um vídeo","camera"],["Book PDF","Me envie o book em PDF","pdf"]];
L.en.quick=[["Photos","I want to see photos","image"],["Video","I want to see a video","camera"],["Brochure PDF","Send me the brochure PDF","pdf"]];
L.es.quick=[["Fotos","Quiero ver fotos","image"],["Video","Quiero ver un video","camera"],["Folleto PDF","Envíame el folleto en PDF","pdf"]];
const norm=s=>s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
const ctxUnit=()=>state.selected&&!state.selected.area?state.selected:null;
function answer(q){const t=norm(q),u=ctxUnit(),T=u&&TYPES[u.type],B=u&&BOOK[u.type],has=(...w)=>w.some(x=>t.includes(x));
  const A={pt:{},en:{},es:{}};
  if(has("piscina","pool","alberca")){const pool=B&&B.x;
    A.pt=u?`${u.label}: piscina privativa${pool?` (${pool})`:""}. ${T.feat}`:"Cada casa tem piscina privativa; o Beach Club Koko tem piscina de borda de frente para o mar. Abra a ficha de uma casa para ver a metragem.";
    A.en=u?`${u.label}: private pool${pool?` (${pool})`:""}.`:"Every home has a private pool; the Koko Beach Club has an edge pool facing the sea. Open a home to see its size.";
    A.es=u?`${u.label}: piscina privada${pool?` (${pool})`:""}.`:"Cada casa tiene piscina privada; el Beach Club Koko tiene piscina de borde frente al mar. Abra una casa para ver el tamaño."}
  else if(has("suite","quarto","dormit","bedroom","habitac")){A.pt=u?`${u.label} tem ${T.suites} suítes.`:"Brisa e Lago: 4 suítes · Vista Mar: 5 · Mar: 6.";A.en=u?`${u.label} has ${T.suites} suites.`:"Brisa and Lago: 4 suites · Vista Mar: 5 · Mar: 6.";A.es=u?`${u.label} tiene ${T.suites} suites.`:"Brisa y Lago: 4 suites · Vista Mar: 5 · Mar: 6."}
  else if(has("metragem","area","m2","m²","tamanho","size","tamano","grande")){A.pt=u?`${u.label}: ${num(u.priv)} m² privativos e ${num(u.constr)} m² construídos.`:"As casas vão de cerca de 420 a 1.144 m² privativos. Abra uma casa para ver a área exata.";
    A.en=u?`${u.label}: ${num(u.priv)} m² private area, ${num(u.constr)} m² built.`:"Homes range from about 420 to 1,144 m² of private area.";A.es=u?`${u.label}: ${num(u.priv)} m² privativos y ${num(u.constr)} m² construidos.`:"Las casas van de unos 420 a 1.144 m² privativos."}
  else if(has("heliport","helipad","helipuerto","helicop")){A.pt="Heliporto não consta no material do Bossa. Anotei a pergunta para o corretor confirmar.";A.en="A helipad is not listed in the Bossa materials. I've noted it for the broker to confirm.";A.es="El helipuerto no figura en el material de Bossa. Lo anoté para que el corredor lo confirme."}
  else if(has("valoriz","apprecia","invest","retorno","return","rentab")){const ref=u?` Hoje ${u.label} está em R$ ${num(u.price/u.priv)}/m² privativo.`:"";
    A.pt=`Não faço promessa de valorização. O que pesa: ${UNITS.length-avail.length} das ${UNITS.length} casas já vendidas antes da entrega, frente para a Praia do Toque e paisagismo de Luiz Carlos Orsini.${ref} Para números, fale com o corretor.`;
    A.en=`I can't promise appreciation. Facts: ${UNITS.length-avail.length} of ${UNITS.length} homes already sold before delivery, beachfront on Praia do Toque, landscaping by Luiz Carlos Orsini. Ask the broker for figures.`;
    A.es=`No puedo prometer valorización. Hechos: ${UNITS.length-avail.length} de ${UNITS.length} casas ya vendidas antes de la entrega, frente a la Praia do Toque, paisajismo de Luiz Carlos Orsini. Consulte al corredor por cifras.`}
  else if(has("entrega","pronta","delivery","ready","obra")){A.pt="Entrega prevista para agosto de 2028. Durante a obra o saldo é corrigido pelo INCC; depois das chaves, IPCA + 1%.";A.en="Delivery expected in August 2028. Balance adjusted by INCC during construction and IPCA + 1% after handover.";A.es="Entrega prevista para agosto de 2028. Saldo ajustado por INCC durante la obra e IPCA + 1% después de la entrega."}
  else if(has("preco","valor","price","precio","quanto","cost","pagamento","payment","pago","parcela")){
    A.pt=u&&u.price?`${u.label}: ${brl(u.price)}. Entrada de 17%, mensais, semestrais, chaves e pós-obra; veja o fluxo na ficha.`:`Disponíveis: ${avail.map(x=>`${x.label} (${brl(x.price)})`).join(", ")}.`;
    A.en=u&&u.price?`${u.label}: ${brl(u.price)}, 17% down payment plus installments.`:`Available: ${avail.map(x=>`${x.label} (${brl(x.price)})`).join(", ")}.`;
    A.es=u&&u.price?`${u.label}: ${brl(u.price)}, 17% de entrada y cuotas.`:`Disponibles: ${avail.map(x=>`${x.label} (${brl(x.price)})`).join(", ")}.`}
  else if(has("praia","beach","playa","mar","sea","lazer","clube","club","amenit")){const near=u?[...AREAS].sort((a,b)=>areaDist(a,u)-areaDist(b,u)).map(a=>`${a.label} ~${areaDist(a,u)} m`).join(" · "):"";
    A.pt=`Beach Club Koko pé na areia, spa, academia, lago de 1.846 m², quadras e Bosque Kids.${near?" Perto desta casa: "+near+".":""}`;A.en=`Beach club on the sand, spa, gym, a 1,846 m² lake, sports courts and a kids' woods.${near?" Near this home: "+near+".":""}`;A.es=`Beach club en la arena, spa, gimnasio, lago de 1.846 m², canchas y Bosque Kids.${near?" Cerca de esta casa: "+near+".":""}`}
  else{A.pt="Ainda não tenho essa resposta no material. Anotei para o corretor responder.";A.en="I don't have that in the materials yet. I've noted it for the broker.";A.es="Aún no tengo esa respuesta en el material. La anoté para el corredor."}
  return A[lang]}
/* ---------- conversa: rolagem interna, mensagens com mídia, atalhos ---------- */
const MAX=100,atBottom=()=>log.scrollHeight-log.scrollTop-log.clientHeight<48;let stuck=true;
const toBottom=smooth=>log.scrollTo({top:log.scrollHeight,behavior:smooth&&!reduceM()?"smooth":"auto"});
log.addEventListener("scroll",()=>{stuck=atBottom();jump.hidden=stuck},{passive:true});
jump.onclick=()=>toBottom(true);
function fill(el,text,items,choices){el.replaceChildren();const p=document.createElement("p");p.textContent=text;el.append(p);el.classList.toggle("has-media",!!items?.length);
  if(items?.length){const m=document.createElement("div");m.className="m-wrap";m.innerHTML=mediaHTML(items,lang);el.append(m);el._items=items;
    m.querySelectorAll("img").forEach(x=>x.addEventListener("load",()=>{if(stuck)toBottom()},{once:true}));
    m.querySelectorAll("video").forEach(x=>x.addEventListener("loadedmetadata",()=>{if(stuck)toBottom()},{once:true}))}
  if(choices?.length){const c=document.createElement("div");c.innerHTML=choicesHTML(choices);el.append(c.firstChild);el._choices=choices;el.classList.add("has-choices")}}
function say(text,who,items){const el=document.createElement("div");el.className="msg "+who;fill(el,text,items);const follow=stuck||who==="me";
  log.append(el);while(log.children.length>MAX)log.firstElementChild.remove(); // limite: a conversa não cresce para sempre
  if(follow){stuck=true;toBottom(true)}else jump.hidden=false;return el}
function ask(q,pick){q=q.trim();if(!q)return;say(q,"me");input.value="";send.disabled=true;
  const w=say("","bot typing");w.firstChild.innerHTML="<i></i><i></i><i></i>";
  setTimeout(()=>{w.classList.remove("typing");const m=mediaReply(q,ctxUnit(),lang,pick)||{text:answer(q)};fill(w,m.text,m.items,m.choices);if(stuck)toBottom(true);else jump.hidden=false},650)}
function seed(){log.replaceChildren();stuck=true;jump.hidden=true;say(L[lang].hello,"bot");log.append(sug)}
function paintAI(){const T=L[lang];$("aititle").textContent=T.title;input.placeholder=T.ph;$("ainote").textContent=T.note;
  sug.innerHTML=T.sug.map(s=>`<button type="button">${esc(s)}</button>`).join("");
  quick.innerHTML=T.quick.map(([l,q,ic])=>`<button type="button" data-q="${esc(q)}">${IC[ic]}<span>${l}</span></button>`).join("");
  ai.querySelectorAll("[data-lang]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.lang===lang))}
let aiFrom=null;
function openAI(on=true){if(on){aiFrom=document.activeElement;ai.hidden=false;if(!log.querySelector(".msg"))seed();const u=ctxUnit();$("aictx").textContent=u?u.label:"";input.focus({preventScroll:true});toBottom()}
  else{ai.hidden=true;aiFrom?.focus?.({preventScroll:true});aiFrom=null}document.body.classList.toggle("aiopen",on)}
ai.addEventListener("click",e=>{const l=e.target.closest("[data-lang]");if(l){lang=l.dataset.lang;paintAI();seed();return}
  const sb=e.target.closest("#aisug button");if(sb)return ask(sb.textContent);
  const qk=e.target.closest("#aiquick button");if(qk)return ask(qk.dataset.q);
  const ch=e.target.closest(".m-choices button");
  if(ch){const msg=ch.closest(".msg"),c=msg._choices[+ch.dataset.c];msg.querySelectorAll(".m-choices button").forEach(b=>{b.disabled=true;b.setAttribute("aria-pressed",b===ch)});return ask(c.label,c.pick)}
  const msg=e.target.closest(".msg"),imgs=msg?._items?.filter(x=>x.k==="img"),op=e.target.closest("[data-open]");
  if(op&&imgs)return import("./viewer.js").then(v=>v.openViewer(imgs.map(x=>({src:x.src,label:x.label})),+op.dataset.open,"Bossa Eco Luxury Villas","Fotos")); // import tardio: evita ciclo com ficha.js
  const ac=e.target.closest("[data-m]");
  if(ac&&msg?._items){if(ac.dataset.m==="view")return import("./viewer.js").then(v=>v.openViewer(imgs.map(x=>({src:x.src,label:x.label})),0,"Bossa Eco Luxury Villas","Fotos"));
    if(ac.dataset.m==="wa")return open(waURL(shareText(msg._items,lang)),"_blank","noopener");
    if(ac.dataset.m==="zip"){const sp=ac.querySelector("span"),t=sp.textContent;ac.disabled=true;sp.textContent="…";downloadAll(imgs).catch(()=>toast("Não consegui preparar o ZIP")).finally(()=>{ac.disabled=false;sp.textContent=t})}return}
  if(e.target.closest(".x"))openAI(false)});
form.addEventListener("submit",e=>{e.preventDefault();ask(input.value)});
input.addEventListener("input",()=>{send.disabled=!input.value.trim()});send.disabled=true;
paintAI();


document.addEventListener("click",e=>{const b=e.target.closest("[data-cta]");if(!b)return;const u=state.selected,k=b.dataset.cta;
  if(k!=="sharemenu"&&!b.closest(".share-pop"))closeShare();
  if(k==="ai")openAI(ai.hidden);else if(u&&!u.area&&k==="proposta")openProposta(u,k);else if(u&&!u.area&&k==="sharemenu")shareMenu(u,b);
  else if(u&&k==="copy"){closeShare();copy(casaURL(u),"Link da casa copiado")}else if(u&&k==="native"){closeShare();navigator.share({title:`${u.label} · Bossa Eco Luxury Villas`,url:casaURL(u)}).catch(()=>{})}});
document.addEventListener("click",e=>{if(!e.target.closest(".share-pop,[data-cta]"))closeShare()}); // clique fora fecha o menu
// Esc fecha só o que está por cima (proposta, depois assistente), sem fechar a ficha junto
addEventListener("keydown",e=>{if(e.key!=="Escape")return;if(document.querySelector(".share-pop")){e.stopImmediatePropagation();closeShare()}else if(!dlg.hidden){e.stopImmediatePropagation();closeProposta()}else if(!ai.hidden){e.stopImmediatePropagation();openAI(false)}});
export {ctaHTML,syncHash,unitFromHash};
