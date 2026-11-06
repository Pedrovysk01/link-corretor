// Pins das casas disponíveis (2D e 3D), afastamento entre eles e carrossel do celular.
import {AREAS,TFILM,TYPES,avail,isMobile,mi} from "./data.js";
import {select} from "./ficha.js";
import {safe,toScreen} from "./map2d.js";
import {R3,cam} from "./state.js";
/* ---------- pins + carrossel ---------- */
const tip=document.getElementById("tip");
const pinsEl=document.getElementById("pins");
const pins=avail.map(u=>{const el=document.createElement("button");el.className="pin";el.type="button";el.onclick=()=>select(u);pinsEl.append(el);return{u,el}});
for(const a of []){const el=document.createElement("button");el.className="pin club";el.type="button";el.onclick=()=>select(a);pinsEl.append(el);pins.push({u:a,el})}
function pinText(){pins.forEach(p=>p.el.textContent=p.u.area?(isMobile()?p.u.mshort:p.u.short):p.u.label)}
function placePins(){if(R3.on)return;for(const p of pins){const u=p.u;const[x,y0]=toScreen(u.x,u.y);const below=cam.ROT&&u.area&&u.key!=="Lago";const y=below?y0+u.pw*.5*cam.S:u.area?y0-(cam.ROT?u.pw/2:u.py)*cam.S:y0-Math.max(u.w,u.h)*.5*cam.S;
  p.el.hidden=x<-40||x>innerWidth+40||y<0||y>innerHeight-(isMobile()?safe().b:0);p._a=[x,y,below]}
  declutter(8)}
const carousel=document.getElementById("carousel");
carousel.innerHTML=avail.map((u,i)=>`<button class="uc" data-i="${i}"><img loading="lazy" decoding="async" src="media/${TFILM[u.type]}.jpg" alt=""><div><b>${u.label}</b><span>${mi(u.price)} · ${TYPES[u.type].suites} suítes</span></div></button>`).join("");
carousel.insertAdjacentHTML("beforeend",AREAS.map((a,i)=>`<button class="uc" data-area="${i}"><img loading="lazy" decoding="async" src="media/hi/t-${a.thumb}.jpg" alt=""><div><b>${a.label}</b><span>${a.sub}</span></div></button>`).join(""));
carousel.addEventListener("click",e=>{const b=e.target.closest(".uc");if(!b)return;if(b.dataset.area!==undefined){select(AREAS[+b.dataset.area]);return}select(avail[+b.dataset.i])});
function declutter(gap){const vis=pins.filter(p=>!p.el.hidden&&p._a);const placed=[];
  vis.sort((a,b)=>a._a[1]-b._a[1]||a._a[0]-b._a[0]);
  const sz=vis.map(p=>[p.el.offsetWidth,p.el.offsetHeight]); // leituras juntas, escritas depois: sem reflow por pin
  for(const[i,p]of vis.entries()){const[x0,y,below]=p._a;const[w,h]=sz[i];let lift=0;
    const x=Math.min(Math.max(x0,w/2+8),innerWidth-w/2-8); // casa na borda: o rótulo entra inteiro na tela
    if(!below){for(let k=0;k<12;k++){const r={l:x-w/2-3,r:x+w/2+3,t:y-gap-lift-h-3,b:y-gap-lift+3};
      const hit=placed.find(q=>r.l<q.r&&r.r>q.l&&r.t<q.b&&r.b>q.t);if(!hit)break;lift=y-gap+4-hit.t;}}
    const top=below?y+gap:y-gap-lift-h;placed.push({l:x-w/2-3,r:x+w/2+3,t:top-3,b:top+h+3});
    p.el.style.setProperty("--lift",lift+"px");
    p.el.style.transform=below?`translate(${x}px,${y}px) translate(-50%,${gap}px)`:`translate(${x}px,${y}px) translate(-50%,calc(-100% - ${gap+lift}px))`}}
export {carousel,declutter,pinText,pins,placePins,tip};
