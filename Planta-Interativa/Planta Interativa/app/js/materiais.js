// Materiais: atalhos para abrir, baixar e encaminhar (book, espelho de vendas, tabela de preços e o que a construtora publicar em data/materiais.json).
// Protótipo: o filtro por perfil é só de tela; arquivo restrito de verdade exige servidor autenticado (ver README).
import {FLOW,TYPES,UNITS,avail,brl,isMobile,mi,num} from "./data.js";
import {select} from "./ficha.js";
import {IC} from "./icons.js";
import {perfilAtual} from "./perfil.js";

const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const abs=p=>new URL(p,location.href).href;
const ST={d:"Disponível",r:"Reservada",v:"Vendida"};
const pad=n=>String(n).padStart(2,"0");
function toast(msg){const t=$("toast");t.textContent=msg;t.hidden=false;clearTimeout(toast.tm);toast.tm=setTimeout(()=>t.hidden=true,2600)}
async function copy(text){try{await navigator.clipboard.writeText(text);toast("Link copiado")}catch{toast(text)}}
function saveCSV(name,rows){const q=v=>`"${String(v).replace(/"/g,'""')}"`; // ponto e vírgula + BOM: o Excel em português abre com acento certo
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["﻿"+rows.map(r=>r.map(q).join(";")).join("\r\n")],{type:"text/csv;charset=utf-8"}));
  a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}

/* ---------- materiais gerados dos dados (units.json) ---------- */
const flowCell=(u,[,p,n])=>u.price?`${n>1?n+"× ":""}${brl(u.price*p/n)}`:"—";
const count=k=>UNITS.filter(u=>u.status===k).length;
const GEN={
  espelho:{title:"Espelho de Vendas",file:"bossa-espelho-de-vendas.csv",
    lead:()=>`${UNITS.length} casas · ${count("d")} disponíveis · ${count("r")} reservadas · ${count("v")} vendidas`,
    html(){const groups=[...new Set(UNITS.map(u=>u.type))];
      return `<div class="mt-leg" aria-hidden="true">${Object.entries(ST).map(([k,l])=>`<span><i class="mt-dot" data-s="${k}"></i>${l}</span>`).join("")}</div>`
        +groups.map(t=>{const us=UNITS.filter(u=>u.type===t);
          return `<section class="mt-grp"><h3>${esc(TYPES[t].name)} <small>${us.length} casas · ${us.filter(u=>u.status==="d").length} disponíveis</small></h3><div class="mt-cells">${us.map(u=>
            `<button type="button" class="mt-cell" data-s="${u.status}" data-u="${u.key}" aria-label="${esc(u.label)}, ${ST[u.status].toLowerCase()}"><b>${pad(u.n)}</b><small>${u.status==="d"?mi(u.price):ST[u.status]}</small></button>`).join("")}</div></section>`}).join("")},
    csv:()=>[["Tipologia","Unidade","Situação","Privativa (m²)","Construída (m²)","Valor"],...UNITS.map(u=>[TYPES[u.type].name,u.label,ST[u.status],num(u.priv),num(u.constr),u.price?brl(u.price):""])]},
  tabela:{title:"Tabela de Preços",file:"bossa-tabela-de-precos.csv",
    lead:()=>"Preços da tabela vigente em 07/10/2026, sujeitos a alteração sem aviso prévio. Valores de cada parcela do fluxo.",
    head:()=>["Unidade","Tipologia","Privativa (m²)","Construída (m²)","Situação","Valor",...FLOW.map(f=>f[0])],
    rows:()=>UNITS.map(u=>[u.label,TYPES[u.type].name,num(u.priv),num(u.constr),ST[u.status],u.price?brl(u.price):"—",...FLOW.map(f=>flowCell(u,f))]),
    html(){const rows=this.rows();return `<div class="mt-scroll"><table class="mt-table"><thead><tr>${this.head().map(h=>`<th scope="col">${esc(h)}</th>`).join("")}</tr></thead><tbody>${UNITS.map((u,i)=>
      `<tr data-s="${u.status}">${rows[i].map((c,j)=>j?`<td>${esc(c)}</td>`:`<th scope="row">${esc(c)}</th>`).join("")}</tr>`).join("")}</tbody></table></div>`},
    csv(){return [this.head(),...this.rows()]}},
  precos:{title:"Preços das unidades",file:"bossa-precos-disponiveis.csv",
    lead:()=>`${avail.length} casas disponíveis. Toque em uma para ver a ficha.`,
    html:()=>`<div class="mt-list">${avail.map(u=>`<button type="button" class="mt-price" data-u="${u.key}"><span><b>${esc(u.label)}</b><small>${num(u.priv)} m² privativos · ${TYPES[u.type].suites} suítes</small></span><strong>${brl(u.price)}</strong></button>`).join("")}</div>`,
    csv:()=>[["Unidade","Tipologia","Privativa (m²)","Suítes","Valor"],...avail.map(u=>[u.label,TYPES[u.type].name,num(u.priv),TYPES[u.type].suites,brl(u.price)])]}
};

/* ---------- painel (desktop: chip na barra; celular: item do menu de baixo) ---------- */
const panel=$("p-materiais"),mob=$("mt-mob"),both=[panel,mob],sheet=$("matsheet"),body=$("matbody");
let itens=[],cur=null,from=null;
const mine=()=>{const p=perfilAtual().perfil;return itens.filter(m=>m.acesso.includes(p))};
const meta=m=>m.tipo==="gerado"?"Montado com o estoque de agora":m.tipo==="link"?"Endereço externo":`PDF · ${m.paginas} páginas · ${m.tamanho}`;
function cardHTML(m){const staff=perfilAtual().perfil!=="cliente",gen=m.tipo==="gerado",url=gen?"":abs(m.arquivo),a=[];
  a.push(gen?`<button type="button" data-mt="open" data-id="${m.arquivo}">${IC.expand}<span>Abrir</span></button>`:`<a href="${esc(m.arquivo)}" target="_blank" rel="noopener">${IC.expand}<span>Abrir</span></a>`);
  if(gen)a.push(`<button type="button" data-mt="csv" data-id="${m.arquivo}">${IC.download}<span>Baixar CSV</span></button>`);
  else if(m.tipo==="pdf")a.push(`<a href="${esc(m.arquivo)}" download>${IC.download}<span>Baixar</span></a>`);
  if(staff&&!gen){const d=`data-t="${esc(m.titulo)}" data-url="${esc(url)}"`;
    if(isMobile()&&navigator.share)a.push(`<button type="button" data-mt="share" ${d}>${IC.send}<span>Encaminhar</span></button>`);
    else a.push(`<button type="button" data-mt="wa" ${d}>${IC.send}<span>WhatsApp</span></button><button type="button" data-mt="copy" ${d}>${IC.copy}<span>Copiar link</span></button>`)}
  return `<article class="m-pdf mt-card" data-q="${esc((m.titulo+" "+m.descricao+" "+m.categoria).toLowerCase())}"><div class="mt-top"><span class="m-ico">${IC[gen?m.icone||"grid":m.tipo==="link"?"link":"pdf"]}</span><span><b>${esc(m.titulo)}</b><small>${esc(m.descricao)}</small><small>${meta(m)}</small></span></div><div class="m-acts">${a.join("")}</div></article>`}
function paint(){const list=mine(),cats=[...new Set(list.map(m=>m.categoria))];
  both.forEach(e=>e.innerHTML=`<b class="mt-title">Materiais</b>${list.length>6?`<input type="search" class="mt-q" placeholder="Buscar material" aria-label="Buscar material" autocomplete="off">`:""}`
    +cats.map(c=>`<section class="mt-cat"><small>${esc(c)}</small>${list.filter(m=>m.categoria===c).map(cardHTML).join("")}</section>`).join("")
    +(list.length?"":`<small>Nenhum material liberado para este acesso.</small>`))}
fetch("data/materiais.json").then(r=>{if(!r.ok)throw 0;return r.json()}).then(j=>{itens=j.itens||[];paint()}).catch(()=>{both.forEach(e=>e.innerHTML='<b class="mt-title">Materiais</b><small>Não consegui carregar a lista de materiais.</small>')});

/* ---------- folha (espelho, tabela, preços) ---------- */
function openSheet(id){const g=GEN[id];if(!g)return;cur=id;from=document.activeElement;
  document.querySelectorAll(".panel").forEach(p=>p.hidden=true);document.querySelectorAll("[data-panel]").forEach(b=>b.setAttribute("aria-expanded","false"));
  const staff=perfilAtual().perfil!=="cliente";
  body.innerHTML=`<div class="eyebrow">Bossa Eco Luxury Villas</div><h2 id="matsheett">${g.title}</h2><p class="lead">${g.lead()}</p>
    <div class="m-acts mt-noprint"><button type="button" data-mt="csv" data-id="${id}">${IC.download}<span>Baixar CSV</span></button>${staff?`<button type="button" data-mt="print">${IC.print}<span>Imprimir / Salvar PDF</span></button>`:""}</div>
    ${g.html()}<p class="src">Gerado em ${new Date().toLocaleDateString("pt-BR")}. Valores sujeitos a alteração sem aviso prévio.</p>`;
  sheet.hidden=false;sheet.querySelector(".box").scrollTop=0;requestAnimationFrame(()=>sheet.classList.add("on"));sheet.querySelector(".x").focus({preventScroll:true})}
function closeSheet(){sheet.classList.remove("on");setTimeout(()=>sheet.hidden=true,250);from?.focus?.({preventScroll:true});from=null}
sheet.addEventListener("click",e=>{if(e.target===sheet||e.target.closest(".x"))return closeSheet();
  const u=e.target.closest("[data-u]");if(u){const x=UNITS.find(v=>v.key===u.dataset.u);closeSheet();if(x)select(x);return}
  const b=e.target.closest("[data-mt]");if(!b)return;if(b.dataset.mt==="print")window.print();else if(b.dataset.mt==="csv")saveCSV(GEN[b.dataset.id].file,GEN[b.dataset.id].csv())});
addEventListener("keydown",e=>{if(e.key==="Escape"&&!sheet.hidden){e.stopImmediatePropagation();closeSheet()}});
both.forEach(el=>el.addEventListener("click",e=>{const b=e.target.closest("[data-mt]");if(!b)return;const k=b.dataset.mt,d=b.dataset;
  if(k==="open")openSheet(d.id);else if(k==="csv")saveCSV(GEN[d.id].file,GEN[d.id].csv());
  else if(k==="wa")open(`https://wa.me/?text=${encodeURIComponent(d.t+" · Bossa Eco Luxury Villas\n"+d.url)}`,"_blank","noopener");
  else if(k==="copy")copy(d.url);else if(k==="share")navigator.share({title:d.t,url:d.url}).catch(()=>{})}));
both.forEach(el=>el.addEventListener("input",e=>{if(!e.target.matches(".mt-q"))return;const q=e.target.value.trim().toLowerCase();el.querySelectorAll(".mt-card").forEach(c=>c.hidden=!c.dataset.q.includes(q))}));
