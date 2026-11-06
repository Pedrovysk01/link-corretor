import {IC} from "./icons.js";
// Experiências: grade de ambientes e player em tela cheia (vídeos e fotos).
import {EXP,IMG,IMGM,TH,reduceM} from "./data.js";
import {closeCard} from "./ficha.js";
import {openViewer} from "./viewer.js";
const grid=document.getElementById("grid"),expEl=document.getElementById("exp");
grid.innerHTML=EXP.map(([s,t,d,items,prev,still],i)=>`<button class="tile" data-i="${i}" aria-label="Ver: ${t}">${prev?`<video muted loop playsinline preload="none" poster="media/${prev}.jpg" data-src="media/${prev}.mp4"></video>`:`<img class="still" loading="lazy" decoding="async" src="${IMGM(still)}" alt="">`}
  <div class="ov"><span class="n">0${i+1} · ${items.length} ${items.length>1?"cenas":"cena"}</span><b>${t}</b><span>${d}</span></div><i class="play" aria-hidden="true">${prev?IC.play:IC.expand}</i></button>`).join("");
const tileIO=new IntersectionObserver(es=>es.forEach(en=>{const v=en.target;if(en.isIntersecting&&!expEl.hidden){if(!v.src)v.src=v.dataset.src;v.play().catch(()=>{})}else v.pause()}),{threshold:.35});
grid.querySelectorAll("video").forEach(v=>tileIO.observe(v));
function openExp(v){expEl.hidden=!v;document.querySelectorAll('[data-act="exp"]').forEach(x=>x.setAttribute("aria-pressed",v));
  if(v){closeCard(false);expEl.scrollTop=0;grid.querySelectorAll("video").forEach(el=>{tileIO.unobserve(el);tileIO.observe(el)})}else grid.querySelectorAll("video").forEach(el=>el.pause())}
document.getElementById("expClose").onclick=()=>openExp(false);document.getElementById("expX").onclick=()=>openExp(false);
grid.addEventListener("click",e=>{const t=e.target.closest(".tile");if(t)openLB(+t.dataset.i,t)});

const lb=document.getElementById("lb"),lbv=document.getElementById("lbv"),lbimg=document.getElementById("lbimg"),lbf=document.getElementById("lbf"),lbp=document.getElementById("lbp"),dots=document.getElementById("lbdots"),thumbs=document.getElementById("lbthumbs");
dots.innerHTML=EXP.map((x,i)=>`<button data-i="${i}" aria-label="${x[1]}"></button>`).join("");
let lbi=0,lbj=0,imgTimer=null,imgT0=0,rafP=null;const IMG_MS=6500;
const thumbOf=it=>typeof it==="string"?`media/${it.slice(2)}.jpg`:TH(it[0]);
function setLB(i,j=0){clearTimeout(imgTimer);cancelAnimationFrame(rafP);lbi=(i+EXP.length)%EXP.length;const[s,t,d,items]=EXP[lbi];
  document.getElementById("lbk").textContent=`Experiência ${lbi+1} de ${EXP.length}`;document.getElementById("lbt").textContent=t;document.getElementById("lbd").textContent=d;
  dots.querySelectorAll("button").forEach((b,k)=>b.setAttribute("aria-current",k===lbi));
  thumbs.innerHTML=items.length>1?items.map((it,k)=>`<button data-j="${k}" aria-label="Cena ${k+1}"><img src="${thumbOf(it)}" alt=""></button>`).join(""):"";
  setItem(j)}
function setItem(j){clearTimeout(imgTimer);cancelAnimationFrame(rafP);const items=EXP[lbi][3];
  if(j>=items.length){setLB(lbi+1);return}if(j<0){const p=(lbi-1+EXP.length)%EXP.length;setLB(p,EXP[p][3].length-1);return}
  lbj=j;const it=items[j];thumbs.querySelectorAll("button").forEach((b,k)=>b.setAttribute("aria-current",k===j));
  const cur=thumbs.querySelector(`[data-j="${j}"]`);if(cur)thumbs.scrollTo({left:cur.offsetLeft-thumbs.clientWidth/2+cur.clientWidth/2,behavior:"smooth"});lbp.style.width="0%";
  if(typeof it==="string"){lbimg.hidden=true;lbv.hidden=false;const s=it.slice(2);lbv.poster=`media/${s}.jpg`;lbv.src=`media/${s}.mp4`;lbv.play().catch(()=>{})}
  else{lbv.pause();lbv.hidden=true;lbimg.hidden=false;lbimg.classList.remove("kb");void lbimg.offsetWidth;lbimg.src=IMG(it[0]);lbimg.classList.toggle("board",String(it[0]).startsWith("or-"));lbimg.alt=it[1];if(!reduceM())lbimg.classList.add("kb");
    imgT0=performance.now();const tick=()=>{const k=Math.min(1,(performance.now()-imgT0)/IMG_MS);lbp.style.width=(k*100)+"%";if(k<1)rafP=requestAnimationFrame(tick)};tick();
    imgTimer=setTimeout(()=>setItem(lbj+1),IMG_MS)}}
thumbs.addEventListener("click",e=>{const b=e.target.closest("[data-j]");if(b)setItem(+b.dataset.j)});
lbimg.style.cursor="zoom-in";
lbimg.addEventListener("click",()=>{const[s,t,d,items]=EXP[lbi];const photos=items.filter(x=>typeof x!=="string");const cur=items[lbj];
  clearTimeout(imgTimer);cancelAnimationFrame(rafP);
  openViewer(photos.map(([p,l])=>({src:IMG(p),label:l})),Math.max(0,photos.indexOf(cur)),t,"Experiências")});
lbv.addEventListener("ended",()=>setItem(lbj+1));
function openLB(i,from){grid.querySelectorAll("video").forEach(v=>v.pause());lb.hidden=false;setLB(i);
  if(from&&!reduceM()){const a=from.getBoundingClientRect(),b=lbf.getBoundingClientRect();
    lbf.style.transition="none";lbf.style.transform=`translate(${a.left+a.width/2-(b.left+b.width/2)}px,${a.top+a.height/2-(b.top+b.height/2)}px) scale(${a.width/b.width})`;
    requestAnimationFrame(()=>requestAnimationFrame(()=>{lbf.style.transition="transform .55s cubic-bezier(.2,.8,.2,1)";lbf.style.transform="";lb.classList.add("on")}))}
  else lb.classList.add("on");
  document.getElementById("lbx").focus({preventScroll:true})}
function closeLB(){clearTimeout(imgTimer);cancelAnimationFrame(rafP);lb.classList.remove("on");lbv.pause();setTimeout(()=>{lb.hidden=true;lbv.removeAttribute("src");lbv.load();
  grid.querySelectorAll("video").forEach(el=>{tileIO.unobserve(el);tileIO.observe(el)})},350)}
document.getElementById("lbx").onclick=closeLB;
document.getElementById("lbl").onclick=()=>setItem(lbj-1);document.getElementById("lbr").onclick=()=>setItem(lbj+1);
dots.addEventListener("click",e=>{const b=e.target.closest("button");if(b)setLB(+b.dataset.i)});
lbv.addEventListener("timeupdate",()=>{if(lbv.duration)lbp.style.width=(lbv.currentTime/lbv.duration*100)+"%"});
let lx=null;lb.addEventListener("touchstart",e=>{lx=e.touches[0].clientX},{passive:true});
lb.addEventListener("touchend",e=>{if(lx==null)return;const d=e.changedTouches[0].clientX-lx;lx=null;if(Math.abs(d)>50)setItem(lbj+(d<0?1:-1))});
lb.addEventListener("click",e=>{if(e.target.classList.contains("stage"))closeLB()});
// visualizador fechado por cima de uma foto: retoma o avanço automático
function resumeLB(){if(!lb.hidden&&!lbimg.hidden){imgT0=performance.now();imgTimer=setTimeout(()=>setItem(lbj+1),IMG_MS)}}
function lbKey(e){if(lb.hidden)return false;if(e.key==="Escape")closeLB();if(e.key==="ArrowRight")setItem(lbj+1);if(e.key==="ArrowLeft")setItem(lbj-1);return true}
export {expEl,lbKey,openExp,resumeLB};
