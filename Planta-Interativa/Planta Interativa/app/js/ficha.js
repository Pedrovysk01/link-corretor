import {IC} from "./icons.js";
// Ficha da casa ou da área comum, galeria, plantas e assinatura do projeto.
import {AREAS,BOOK,FLOW,IMG,IMGM,TFILM,TH,TYPES,UNITS,areaDist,avail,brl,isMobile,mi,num,reduceM} from "./data.js";
import {focusUnit,frameRot,homeView,minS,rot} from "./map2d.js";
import {carousel,pins} from "./pins.js";
import {fly3DUnit} from "./relevo3d.js";
import {R3,state} from "./state.js";
import {ctaHTML,syncHash} from "./vendas.js";
import {openViewer} from "./viewer.js";
/* ---------- ficha ---------- */
const card=document.getElementById("card");
function select(u,focus=true){
  if(state.selected)state.selected.el.classList.remove("sel");state.selected=u;syncHash(u);u.el.classList.add("sel");
  pins.forEach(p=>p.el.dataset.active=p.u===u);carousel.querySelectorAll(".uc").forEach((b,i)=>b.dataset.active=b.dataset.area!==undefined?u===AREAS[+b.dataset.area]:avail[i]===u);
  if(u.area){areaCard(u,focus);return}
  const T=TYPES[u.type],film=TFILM[u.type];
  const st=u.status==="d"?'<span class="st av">Disponível</span>':u.status==="r"?'<span class="st re">Reservada</span>':'<span class="st so">Vendida</span>';
  const body=u.status==="d"?`<div class="price"><div class="lbl">Valor de tabela</div><div class="val">${brl(u.price)}</div>
      <div class="m2">R$ ${num(u.price/u.priv)}/m² privativo · R$ ${num(u.price/u.constr)}/m² construído</div></div>
      <div class="flow">${FLOW.map(([l,p,n])=>`<div><span>${l}</span><span>${n>1?n+"× ":""}${brl(u.price*p/n)}</span></div>`).join("")}</div>
      <p class="note"><b>Preços e condições sujeitos a alteração sem aviso prévio.</b> Corrigido pelo INCC durante a obra e IPCA + 1% após a entrega das chaves. Entrega prevista: agosto de 2028.</p><p class="legal">Imagens meramente ilustrativas. Incorporação registrada sob o R-4 da Matrícula nº 5.401 do Registro de Imóveis de Porto de Pedras/AL, em 18/07/2025. Incorporadora: Taipa Incorporações Bossa SPE Ltda., CNPJ 58.131.029/0001-92.</p>`
    :`<p class="soldmsg">Esta residência já tem proprietário. ${avail.length} casas seguem disponíveis no condomínio.</p>`;
  const navH=u.status==="d"?`<div class="nav"><button data-step="-1">‹ Disponível anterior</button><button data-step="1">Próxima disponível ›</button></div>`
    :`<div class="nav"><button data-step="1" style="grid-column:1/-1">Ver casas disponíveis ›</button></div>`;
  card.innerHTML=`<div class="grab"></div><button class="close" aria-label="Fechar ficha">×</button>
    ${galleryHTML(u)}
    <div class="in"><div class="eyebrow">${T.name}</div><h2>${u.label}</h2>${st}
    <dl class="specs"><div><dt>Privativa</dt><dd>${num(u.priv)} m²</dd></div><div><dt>Construída</dt><dd>${num(u.constr)} m²</dd></div><div><dt>Suítes</dt><dd>${T.suites}</dd></div></dl>
    ${body}<p class="feat">${T.feat}</p><div class="ksec"><span>Perto desta casa</span><div class="kdist">${[...AREAS].sort((a,b)=>areaDist(a,u)-areaDist(b,u)).map(a=>`<button data-area="${a.key}"><span>${a.label}</span><b>~${areaDist(a,u)} m ›</b></button>`).join("")}</div><p class="fine">Distâncias aproximadas, em linha reta, estimadas pela implantação.</p></div>${plansHTML(u)}${signHTML()}${ctaHTML(u)}${navH}</div>`;
  const fresh=card.hidden;card.hidden=false;cardTop();card.scrollTop=0;
  if(fresh&&isMobile()){card.classList.add("enter");requestAnimationFrame(()=>requestAnimationFrame(()=>card.classList.remove("enter")))}
  card.querySelector(".close").onclick=closeCard;
  bindGallery(u);bindPlans(u);bindSign();card.querySelectorAll("[data-area]").forEach(b=>b.onclick=()=>select(AREAS.find(a=>a.key===b.dataset.area)));
  card.querySelectorAll("[data-step]").forEach(b=>b.onclick=()=>{const d=+b.dataset.step,i=avail.indexOf(u);select(avail[i<0?(d>0?0:avail.length-1):(i+d+avail.length)%avail.length])});
  if(focus)focusUnit(u);
}
function areaCard(u,focus){
  const near=[...avail].sort((a,b)=>areaDist(u,a)-areaDist(u,b));
  card.innerHTML=`<div class="grab"></div><button class="close" aria-label="Fechar ficha">×</button>
    ${galleryHTML(u)}
    <div class="in"><div class="eyebrow">${u.eyebrow}</div><h2>${u.label}</h2><span class="st area">${u.badge}</span>
    <p class="kquote">${u.quote}</p><small>Book Bossa · Taipa Inc</small>${u.note?`<p class="feat" style="margin-top:12px">${u.note}</p>`:""}
    <ul class="klist">${u.items.map(x=>`<li>${x}</li>`).join("")}</ul>${u.flora?`<div class="ksec"><span>Paisagismo · Luiz Carlos Orsini</span><div class="flora">${u.flora.map(x=>`<i>${x}</i>`).join("")}</div><p class="fine">Espécies previstas no estudo preliminar de paisagismo (mai/2025), sujeitas a alteração.</p></div>`:""}
    <div class="ksec"><span>Das casas disponíveis até aqui</span><div class="kdist">${near.map(h=>`<button data-u="${h.key}"><span>${h.label} · ${mi(h.price)}</span><b>~${areaDist(u,h)} m</b></button>`).join("")}</div>
      <p class="fine">Distância em linha reta até o limite da área, estimada pela implantação. O percurso a pé pelas alamedas é um pouco maior.</p></div>
    <div class="ksec"><span>Outras áreas comuns</span><div class="achips">${AREAS.filter(a=>a!==u).map(a=>`<button data-area="${a.key}"><img loading="lazy" decoding="async" src="media/hi/t-${a.thumb}.jpg" alt=""><span>${a.label}</span></button>`).join("")}</div></div>
    ${signHTML(u.orsini)}
    <div class="nav"><button data-step="1" style="grid-column:1/-1">Ver casas disponíveis ›</button></div></div>`;
  const fresh=card.hidden;card.hidden=false;cardTop();card.scrollTop=0;
  if(fresh&&isMobile()){card.classList.add("enter");requestAnimationFrame(()=>requestAnimationFrame(()=>card.classList.remove("enter")))}
  card.querySelector(".close").onclick=closeCard;bindGallery(u);bindSign();
  card.querySelectorAll("[data-u]").forEach(b=>b.onclick=()=>select(UNITS.find(x=>x.key===b.dataset.u)));
  card.querySelectorAll("[data-area]").forEach(b=>b.onclick=()=>select(AREAS.find(a=>a.key===b.dataset.area)));
  card.querySelector("[data-step]").onclick=()=>select(avail[0]);
  if(focus)focusArea(u)}
function focusArea(u){if(R3.on&&R3.ready){fly3DUnit(u);return}const[a,b]=rot(u.x,u.y);const big=Math.max(u.w,u.h);
  if(isMobile()){const s=Math.max(minS(),Math.min(2.4,innerHeight*.5/(big*1.25)));frameRot(a,b+((innerHeight-innerHeight*.42)/2+30-innerHeight/2)/s*-1,s,800);return}
  const[cu,cv]=rot((u.bx[0]+u.bx[2])/2,(u.bx[1]+u.bx[3])/2);const s=Math.max(minS(),Math.min(3.2,(innerWidth-460)/(big*1.9),(innerHeight-200)/(Math.min(u.w,u.h)*2.4)));frameRot(cu+180/s,cv,s,800)}
/* ---------- assinatura do projeto ---------- */
function signHTML(ors){return `<button class="sign" data-sign><span>${ors?"Paisagismo <b>Luiz Carlos Orsini</b> · Arquitetura Padovani e Agra Lemos":"Arquitetura <b>Padovani</b> e <b>Agra Lemos</b> · Paisagismo <b>Luiz Carlos Orsini</b>"}</span><i>›</i></button>`}
function bindSign(){card.querySelectorAll("[data-sign]").forEach(b=>b.onclick=openAuth)}
// janelas: assinatura do projeto e informações (uso, sol e texto legal); o foco entra no fechar e volta para quem abriu
const DLG=[document.getElementById("auth"),document.getElementById("info")];let dlgFrom=null;
function openDlg(d){dlgFrom=document.activeElement;d.hidden=false;d.querySelector(".box").scrollTop=0;requestAnimationFrame(()=>d.classList.add("on"));d.querySelector(".x").focus({preventScroll:true})}
function closeDlg(d){d.classList.remove("on");setTimeout(()=>d.hidden=true,250);dlgFrom?.focus?.({preventScroll:true});dlgFrom=null}
const openAuth=()=>openDlg(DLG[0]),openInfo=()=>openDlg(DLG[1]),dlgOpen=()=>DLG.some(d=>!d.hidden);
for(const d of DLG)d.addEventListener("click",e=>{if(e.target===d||e.target.closest(".x"))closeDlg(d)});
addEventListener("keydown",e=>{if(e.key==="Escape")DLG.forEach(d=>{if(!d.hidden)closeDlg(d)})});
function cardTop(){document.body.classList.add("cardopen");if(isMobile()){card.style.top="";card.style.maxHeight="";return}
  const b=document.querySelector(".controls").getBoundingClientRect();const top=Math.max(112,b.bottom+12);card.style.top=top+"px";card.style.maxHeight=`calc(100% - ${top+16}px)`}
addEventListener("resize",()=>{if(!card.hidden)cardTop()});
function closeCard(home){if(card.hidden)return;syncHash(null);card.querySelector("video")?.pause();
  const done=()=>{card.hidden=true;card.classList.remove("enter");document.body.classList.remove("cardopen")};
  if(isMobile()&&!matchMedia("(prefers-reduced-motion: reduce)").matches){card.classList.add("enter");setTimeout(done,330)}else done();
  if(state.selected)state.selected.el.classList.remove("sel");state.selected=null;pins.forEach(p=>p.el.dataset.active=false);carousel.querySelectorAll(".uc").forEach(b=>b.dataset.active=false);
  if(home!==false)homeView()}
// arrastar a ficha para baixo fecha (celular)
let sy=null;card.addEventListener("touchstart",e=>{if(card.scrollTop<=0)sy=e.touches[0].clientY},{passive:true});
card.addEventListener("touchmove",e=>{if(sy==null)return;const d=e.touches[0].clientY-sy;if(d>0)card.style.transform=`translateY(${d}px)`},{passive:true});
card.addEventListener("touchend",e=>{if(sy==null)return;const d=e.changedTouches[0].clientY-sy;sy=null;card.style.transform="";if(d>110)closeCard()});
function galleryHTML(u){const T=TYPES[u.type],film=TFILM[u.type],G=u.area?u.g:BOOK[u.type].g,o=film?1:0;
  return `<div class="film" data-gal><div class="slides">${film?`<video src="media/${film}.mp4" poster="media/${film}.jpg" muted loop playsinline autoplay></video>`:""}
    ${G.map(([p,l],i)=>`<button data-zoom="${i}" aria-label="Ampliar: ${l}"><img loading="lazy" src="${IMGM(p)}" alt="${T.name}: ${l}"></button>`).join("")}</div>
    <span class="ilus">Imagens ilustrativas</span><button class="cnav p" aria-label="Imagem anterior">‹</button><button class="cnav n" aria-label="Próxima imagem">›</button><span class="ccount">1 / ${G.length+o}</span></div>
    <div class="cstrip">${film?`<button class="v" data-go="0" aria-current="true" aria-label="Filme">${IC.play}</button>`:""}${G.map(([p,l],i)=>`<button data-go="${i+o}" aria-label="${l}"${!film&&!i?' aria-current="true"':""}><img src="${TH(p)}" alt=""></button>`).join("")}</div>`}
function bindGallery(u){const box=card.querySelector("[data-gal]");if(!box)return;const sl=box.querySelector(".slides"),n=sl.children.length,cnt=box.querySelector(".ccount"),strip=card.querySelector(".cstrip");
  const vid=sl.querySelector("video");const idx=()=>Math.round(sl.scrollLeft/sl.clientWidth);
  const go=i=>{i=(i+n)%n;sl.scrollTo({left:i*sl.clientWidth,behavior:reduceM()?"auto":"smooth"})};
  box.querySelector(".p").onclick=()=>go(idx()-1);box.querySelector(".n").onclick=()=>go(idx()+1);
  let tm=null;sl.addEventListener("scroll",()=>{clearTimeout(tm);tm=setTimeout(()=>{const i=idx();cnt.textContent=`${i+1} / ${n}`;
    strip.querySelectorAll("[data-go]").forEach(b=>b.setAttribute("aria-current",+b.dataset.go===i));
    const cur=strip.querySelector(`[data-go="${i}"]`);if(cur)strip.scrollTo({left:cur.offsetLeft-strip.clientWidth/2+cur.clientWidth/2,behavior:"smooth"});
    if(vid){if(i===0)vid.play().catch(()=>{});else vid.pause()}},80)},{passive:true});
  strip.addEventListener("click",e=>{const b=e.target.closest("[data-go]");if(b)go(+b.dataset.go)});
  sl.addEventListener("click",e=>{const b=e.target.closest("[data-zoom]");if(!b)return;const G=u.area?u.g:BOOK[u.type].g;
    openViewer(G.map(([p,l])=>({src:IMG(p),label:l})),+b.dataset.zoom,u.label,TYPES[u.type].name)})}
const areaTxt=a=>a.map(([l,v])=>`${l} <b>${num(v)} m²</b>`).join(" · ");
function plansHTML(u){const B=BOOK[u.type];
  return `<div class="plans"><div class="ph"><span>Plantas</span><span>${B.x}</span></div>
  ${B.p.length>1?`<div class="ptabs">${B.p.map((f,i)=>`<button data-pf="${i}" aria-pressed="${i===0}">${f[1]}</button>`).join("")}</div>`:`<div style="height:10px"></div>`}
  <button class="pthumb" data-popen aria-label="Ampliar planta"><img loading="lazy" src="${IMGM(B.p[0][0])}" alt="Planta ${B.p[0][1]}, ${TYPES[u.type].name}"><i>Ampliar ⤢</i></button>
  <div class="parea" data-parea>${areaTxt(B.p[0][2])}</div></div>`}
function bindPlans(u){const B=BOOK[u.type];const box=card.querySelector(".plans");if(!box)return;let k=0;
  box.querySelectorAll("[data-pf]").forEach(b=>b.onclick=()=>{k=+b.dataset.pf;box.querySelectorAll("[data-pf]").forEach(x=>x.setAttribute("aria-pressed",x===b));
    const im=box.querySelector(".pthumb img");im.src=IMGM(B.p[k][0]);im.alt=`Planta ${B.p[k][1]}`;box.querySelector("[data-parea]").innerHTML=areaTxt(B.p[k][2])});
  box.querySelector("[data-popen]").onclick=()=>openViewer(B.p.map(([p,l])=>({src:IMG(p),label:l})),k,u.label,`Plantas · ${TYPES[u.type].name}`)}
export {card,closeCard,dlgOpen,openAuth,openInfo,select};
