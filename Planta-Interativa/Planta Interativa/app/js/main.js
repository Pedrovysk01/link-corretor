// Entrada do app: liga os módulos, ações dos botões, teclado e início.
import {FILM_GERAL,UNITS,VIEWS,avail} from "./data.js";
import {expEl,lbKey,openExp} from "./exp.js";
import {closeCard,dlgOpen,openAuth,openInfo,select} from "./ficha.js";
import {unitFromHash} from "./vendas.js";
import {carousel} from "./pins.js";
import {paintSaudacao} from "./perfil.js";
import "./materiais.js";
import {cine,endFilm,playFilm} from "./film.js";
import {fitBox,homeView,layout} from "./map2d.js";
import {can3D,only3D,set3D} from "./relevo3d.js";
import {R3,state} from "./state.js";
import {closeSun,setLight} from "./sun.js";
import {pvKey} from "./viewer.js";
document.querySelectorAll("[data-res]").forEach(e=>e.hidden=!UNITS.some(u=>u.status==="r"));

document.getElementById("authlink").onclick=()=>openAuth();
for(const id of ["infobtn","sunchip"])document.getElementById(id).onclick=openInfo;
{const n=k=>UNITS.filter(u=>u.status===k).length;
  document.getElementById("nAvail").textContent=avail.length;document.getElementById("nRes").textContent=n("r");document.getElementById("nSold").textContent=n("v")}
/* ---------- painéis do menu (Unidades e Ajustes): abre um por vez; clicar fora ou Esc fecha ---------- */
const panels=[...document.querySelectorAll(".panel")];
function closePanels(except){let any=false;panels.forEach(p=>{if(p!==except&&!p.hidden){p.hidden=true;any=true}});
  document.querySelectorAll("[data-panel]").forEach(b=>b.setAttribute("aria-expanded",!!except&&b.dataset.panel===except.id.slice(2)&&!except.hidden));return any}
document.addEventListener("click",e=>{const t=e.target.closest("[data-panel]");
  if(t){const p=document.getElementById("p-"+t.dataset.panel);const open=p.hidden;closePanels(open?p:null);p.hidden=!open;if(open&&!p.querySelector(":scope>.panel-x")){const x=document.createElement("button");x.type="button";x.className="panel-x";x.setAttribute("aria-label","Fechar");x.textContent="×";p.prepend(x)}
    document.querySelectorAll("[data-panel]").forEach(b=>b.setAttribute("aria-expanded",open&&b.dataset.panel===t.dataset.panel));return}
  if(!e.target.closest(".panel")||e.target.closest("[data-view],[data-act=sun],#authlink,.panel-x"))closePanels(null)},true);
document.addEventListener("click",e=>{
  const b=e.target.closest("[data-view]");if(b){const v=VIEWS.find(x=>x[0]===b.dataset.view);
    document.querySelectorAll("[data-view]").forEach(x=>x.setAttribute("aria-pressed",x.dataset.view===v[0]));closeCard(false);
    if(v===VIEWS[0]){closeSun();setLight("dia");homeView();return} // Geral: volta à vista inicial e à luz do meio-dia
    const go=()=>fitBox(v[2]);if(v[3])playFilm(v[3],go);else go();return}
  const a=e.target.closest("[data-act]");if(!a)return;const act=a.dataset.act;
  if(act==="film")playFilm(FILM_GERAL,()=>homeView());
  if(act==="exp")openExp(true);
  if(act==="only"){const v=a.getAttribute("aria-pressed")!=="true";document.querySelectorAll('[data-act="only"]').forEach(x=>x.setAttribute("aria-pressed",v));veil.setAttribute("opacity",v?.62:0);state.only=v;only3D();document.body.classList.toggle("only",v);
    if(v&&matchMedia("(max-width:720px)").matches){closePanels(null);carousel.scrollTo({left:0})}} // celular: o filtro fecha o painel e mostra só as unidades disponíveis embaixo, para tocar sem errar a casinha
});
const veil=document.getElementById("veil");

addEventListener("keydown",e=>{if(pvKey(e)||lbKey(e)||dlgOpen())return;
  if(e.key!=="Escape")return;if(closePanels(null))return;if(!cine.hidden)endFilm();else if(!expEl.hidden)openExp(false);else closeCard()});

/* ---------- início e orientação ---------- */
R3.want=can3D();
layout(true);setLight("dia");paintSaudacao();
{const u=unitFromHash();if(u)select(u)} // link direto para uma casa (#brisa-06)
addEventListener("hashchange",()=>{const u=unitFromHash();if(u&&u!==state.selected)select(u)});
// abre no 2D (rápido) e, em aparelho capaz, sobe para o 3D em segundo plano depois do primeiro carregamento
if(R3.want){const idle=window.requestIdleCallback?f=>requestIdleCallback(f,{timeout:3000}):f=>setTimeout(f,800);
  const go=()=>idle(()=>set3D(true,true));document.readyState==="complete"?go():addEventListener("load",go,{once:true})}
