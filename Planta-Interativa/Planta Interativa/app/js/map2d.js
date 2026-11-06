// Mapa 2D: casas e áreas em SVG, câmera (arrastar, zoom, voos) e gestos.
import {AREAS,UNITS,VIEWS,areaAt,avail,isMobile,mi} from "./data.js";
import {card,closeCard,select} from "./ficha.js";
import {pinText,placePins,tip} from "./pins.js";
import {fly3DBox,fly3DUnit,setCam3D,startCam3D} from "./relevo3d.js";
import {R3,cam,state} from "./state.js";
/* ---------- casas em SVG ---------- */
const NS="http://www.w3.org/2000/svg",hs=document.getElementById("hs"),holes=document.getElementById("holes");
const cls={d:"av",r:"re",v:"so"};
for(const u of UNITS){
  const g=document.createElementNS(NS,"g");g.setAttribute("class",`h ${cls[u.status]}`);g.setAttribute("transform",`translate(${u.x} ${u.y}) rotate(${u.r})`);
  g.setAttribute("tabindex","0");g.setAttribute("role","button");g.setAttribute("aria-label",`${u.label}, ${u.status==="d"?"disponível":"vendida"}`);
  const mk=(c,pad)=>{const r=document.createElementNS(NS,"rect");r.setAttribute("class",c);r.setAttribute("x",-u.w/2-pad);r.setAttribute("y",-u.h/2-pad);r.setAttribute("width",u.w+2*pad);r.setAttribute("height",u.h+2*pad);r.setAttribute("rx",2);return r};
  g.append(mk("hit",4),mk("shape",0));hs.append(g);u.el=g;
  if(u.status==="d"){const c=mk("",6);c.removeAttribute("class");c.setAttribute("fill","#000");c.setAttribute("transform",g.getAttribute("transform"));holes.append(c)}
  g.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();select(u)}});
  g.addEventListener("pointerenter",()=>{state.tipU=u});g.addEventListener("pointerleave",()=>{state.tipU=null;tip.hidden=true});
}
for(const a of AREAS){
  const g=document.createElementNS(NS,"g");g.setAttribute("class","h club");g.setAttribute("tabindex","0");g.setAttribute("role","button");g.setAttribute("aria-label",`${a.label}: ver detalhes`);
  const d=a.polys.map(p=>"M"+p.map(q=>q.join(",")).join("L")+"Z").join("");
  const mk=c=>{const p=document.createElementNS(NS,"path");p.setAttribute("class",c);p.setAttribute("d",d);return p};
  const hit=mk("hit");hit.setAttribute("stroke","transparent");hit.setAttribute("stroke-width","10");g.append(hit,mk("shape"));hs.prepend(g);a.el=g;
  const hole=mk("");hole.removeAttribute("class");hole.setAttribute("fill","#000");hole.setAttribute("stroke","#000");hole.setAttribute("stroke-width","12");holes.append(hole);
  g.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();select(a)}});
  g.addEventListener("pointerenter",()=>{state.tipU=a});g.addEventListener("pointerleave",()=>{state.tipU=null;tip.hidden=true})}
/* ---------- câmera: imagem → tela (no celular em pé, girada: mar no topo) ---------- */
const view=document.getElementById("view"),world=document.getElementById("world");
const IW=1685,IH=948;
const CW=()=>cam.ROT?IH:IW, CH=()=>cam.ROT?IW:IH;
const rot=(u,v)=>cam.ROT?[v,IW-u]:[u,v];                // imagem → espaço girado
const toScreen=(u,v)=>{const[a,b]=rot(u,v);return[cam.TX+a*cam.S,cam.TY+b*cam.S]};
const safe=()=>{const m=isMobile();return{t:m?84:110,b:m?(avail.length?190:70):20,l:12,r:m?12:20}};
const minS=()=>{const s=safe();return Math.min((innerWidth)/CW(),(innerHeight-s.t*.4-s.b*.5)/CH())*.98};
function clamp(){const w=CW()*cam.S,h=CH()*cam.S;
  cam.TX=w<=innerWidth?(innerWidth-w)/2:Math.min(0,Math.max(innerWidth-w,cam.TX));
  const s=safe();cam.TY=h<=innerHeight?(innerHeight-h)/2+(s.t-s.b)*.25:Math.min(s.t*.5,Math.max(innerHeight-h-s.b*.6,cam.TY))}
/* imagem base em camadas: 1x → 2x → 4x (blocos) conforme o zoom */
const HI={lvl:1,busy:false};
function hiRes(){if(R3.on||R3.want&&R3.goal!==false)return;const need=cam.S*(devicePixelRatio||1);
  if(HI.lvl<2&&!HI.busy){HI.busy=true;const im=new Image();im.onload=()=>{document.getElementById("img").src=im.src;HI.lvl=2;HI.busy=false;hiRes()};im.onerror=()=>{HI.busy=false};im.src="media/render-2x.webp";return}
  if(HI.lvl===2&&need>2.1&&!HI.busy){HI.lvl=4;const box=document.getElementById("hi");
    [["00",0,0,844,476],["10",842,0,843,476],["01",0,474,844,474],["11",842,474,843,474]].forEach(([k,x,y,w,h])=>{const im=new Image();im.style.cssText=`left:${x}px;top:${y}px;width:${w}px;height:${h}px`;im.decoding="async";im.onload=()=>im.classList.add("on");im.src=`media/render-4x-${k}.webp`;box.append(im)})}}
function apply(){clamp();world.style.transform=`translate(${cam.TX}px,${cam.TY}px) scale(${cam.S})`+(cam.ROT?` translate(0px,${IW}px) rotate(-90deg)`:"");placePins();hiRes()}
function zoomAt(f,cx,cy){const ns=Math.min(7,Math.max(minS(),cam.S*f));const k=ns/cam.S;cam.TX=cx-(cx-cam.TX)*k;cam.TY=cy-(cy-cam.TY)*k;cam.S=ns;apply()}
function frameRot(ax,ay,s,ms=900){ // centro no espaço girado
  if(matchMedia("(prefers-reduced-motion: reduce)").matches)ms=1;
  const sf=safe();s=Math.max(minS(),s);const cx=sf.l+(innerWidth-sf.l-sf.r)/2,cy=sf.t+(innerHeight-sf.t-sf.b)/2;
  const a={s0:cam.S,x0:cam.TX,y0:cam.TY,s1:s,x1:cx-ax*s,y1:cy-ay*s,t0:performance.now(),ms};cam.anim=a;
  (function step(now){if(cam.anim!==a)return;const k=Math.min(1,(now-a.t0)/a.ms),e=k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;
    cam.S=a.s0+(a.s1-a.s0)*e;cam.TX=a.x0+(a.x1-a.x0)*e;cam.TY=a.y0+(a.y1-a.y0)*e;apply();if(k<1)requestAnimationFrame(step)})(performance.now());
}
function homeView(ms){if(R3.on&&R3.ready){setCam3D(startCam3D());return}if(cam.ROT){_homeBox(ms);return} // vista inicial: no 3D, a mesma câmera da abertura
  const s=Math.max(minS(),Math.min(innerWidth/1880,innerHeight/970));
  const x1=innerWidth/2-IW/2*s,y1=innerHeight/2+12*s-IH/2*s;
  if(ms===1||matchMedia("(prefers-reduced-motion: reduce)").matches){cam.anim=null;cam.S=s;cam.TX=x1;cam.TY=y1;apply();return}
  const A={s0:cam.S,x0:cam.TX,y0:cam.TY,s1:s,x1,y1,t0:performance.now(),ms:ms||900};cam.anim=A;
  (function step(now){if(cam.anim!==A)return;const k=Math.min(1,(now-A.t0)/A.ms),e=k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;
    cam.S=A.s0+(A.s1-A.s0)*e;cam.TX=A.x0+(A.x1-A.x0)*e;cam.TY=A.y0+(A.y1-A.y0)*e;apply();if(k<1)requestAnimationFrame(step)})(performance.now())}
function _homeBox(ms){fitBox(VIEWS[0][2],ms)}
function fitBox(box,ms){if(R3.on&&R3.ready){fly3DBox(box);return}const[u0,v0,u1,v1]=box;const p=[rot(u0,v0),rot(u1,v1)];const ax=Math.min(p[0][0],p[1][0]),bx=Math.max(p[0][0],p[1][0]),ay=Math.min(p[0][1],p[1][1]),by=Math.max(p[0][1],p[1][1]);
  const sf=safe();const s=Math.min((innerWidth-sf.l-sf.r)/(bx-ax),(innerHeight-sf.t-sf.b)/(by-ay));frameRot((ax+bx)/2,(ay+by)/2,s,ms)}
function focusUnit(u){if(R3.on&&R3.ready){fly3DUnit(u);return}const[a,b]=rot(u.x,u.y);const m=isMobile();const s=Math.max(minS(),m?1.7:Math.min(2.1,innerHeight/330));
  if(m){const sh=innerHeight*.42;const cx=innerWidth/2,cy=(innerHeight-sh)/2+30;if(matchMedia("(prefers-reduced-motion: reduce)").matches){cam.S=s;cam.TX=cx-a*s;cam.TY=cy-b*s;apply();return}
    const A={s0:cam.S,x0:cam.TX,y0:cam.TY,s1:s,x1:cx-a*s,y1:cy-b*s,t0:performance.now(),ms:800};cam.anim=A;
    (function step(now){if(cam.anim!==A)return;const k=Math.min(1,(now-A.t0)/A.ms),e=k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;cam.S=A.s0+(A.s1-A.s0)*e;cam.TX=A.x0+(A.x1-A.x0)*e;
      cam.TY=A.y0+(A.y1-A.y0)*e;world.style.transform=`translate(${cam.TX}px,${cam.TY}px) scale(${cam.S})`+(cam.ROT?` translate(0px,${IW}px) rotate(-90deg)`:"");placePins();hiRes();if(k<1)requestAnimationFrame(step)})(performance.now());return}
  frameRot(a+180/s,b,s,800)}
/* ---------- gestos ---------- */
document.getElementById("zin").onclick=()=>zoomAt(1.5,innerWidth/2,innerHeight/2);
document.getElementById("zout").onclick=()=>zoomAt(1/1.5,innerWidth/2,innerHeight/2);
view.addEventListener("wheel",e=>{e.preventDefault();cam.anim=null;zoomAt(Math.exp(-e.deltaY*.0015),e.clientX,e.clientY)},{passive:false});
const pts=new Map();let moved=false,last=null,pinch=null,downT=0;
view.addEventListener("pointerdown",e=>{pts.set(e.pointerId,[e.clientX,e.clientY]);if(pts.size===1){moved=false;downT=performance.now()}cam.anim=null;view.classList.add("drag");
  if(pts.size===2){const[a,b]=[...pts.values()];pinch={d:Math.hypot(a[0]-b[0],a[1]-b[1])};moved=true}last=[e.clientX,e.clientY]});
view.addEventListener("pointermove",e=>{
  if(state.tipU&&e.pointerType==="mouse"&&!pts.size){tip.hidden=false;tip.style.left=e.clientX+"px";tip.style.top=e.clientY+"px";
    tip.innerHTML=state.tipU.area?`<b>${state.tipU.label}</b> · toque para conhecer`:`<b>${state.tipU.label}</b> · ${state.tipU.status==="d"?"Disponível · "+mi(state.tipU.price):state.tipU.status==="r"?"Reservada":"Vendida"}`}
  if(!pts.has(e.pointerId))return;pts.set(e.pointerId,[e.clientX,e.clientY]);
  if(pts.size===2&&pinch){const[a,b]=[...pts.values()];const d=Math.hypot(a[0]-b[0],a[1]-b[1]);zoomAt(d/pinch.d,(a[0]+b[0])/2,(a[1]+b[1])/2);pinch.d=d;return}
  const dx=e.clientX-last[0],dy=e.clientY-last[1];if(Math.abs(dx)+Math.abs(dy)>4)moved=true;cam.TX+=dx;cam.TY+=dy;last=[e.clientX,e.clientY];apply()});
const up=e=>{const wasTap=pts.size===1&&!moved&&performance.now()-downT<500;pts.delete(e.pointerId);if(pts.size<2)pinch=null;if(!pts.size)view.classList.remove("drag");if(pts.size===1)last=[...pts.values()][0];
  if(wasTap&&e.type==="pointerup")tapAt(e.clientX,e.clientY,e.pointerType)};
view.addEventListener("pointerup",up);view.addEventListener("pointercancel",up);
function tapAt(x,y,type){ // casa mais próxima do toque (alvo generoso no celular)
  let best=null,bd=1e9;for(const u of UNITS){const[sx,sy]=toScreen(u.x,u.y);const d=Math.hypot(sx-x,sy-y);if(d<bd){bd=d;best=u}}
  {const[a,b]=[(x-cam.TX)/cam.S,(y-cam.TY)/cam.S];const[iu,iv]=cam.ROT?[IW-b,a]:[a,b];
   const inRect=u=>{const c=Math.cos(-u.r*Math.PI/180),s=Math.sin(-u.r*Math.PI/180),dx=iu-u.x,dy=iv-u.y;return Math.abs(dx*c-dy*s)<u.w/2+4/cam.S&&Math.abs(dx*s+dy*c)<u.h/2+4/cam.S};
   const hit=UNITS.find(inRect);if(hit){select(hit);return}const ar=areaAt(iu,iv,(type==="mouse"?6:16)/cam.S);if(ar){select(ar);return}}
  const radius=Math.max(type==="mouse"?14:30,Math.max(best.w,best.h)*cam.S*.55);
  if(best&&bd<radius)select(best);else if(!card.hidden&&isMobile())closeCard();
}
function layout(first){world.classList.add("ready");const r=innerWidth<=720&&innerHeight>innerWidth;const changed=r!==cam.ROT;cam.ROT=r;pinText();
  if(first||changed){cam.S=minS();cam.TX=0;cam.TY=0;apply();homeView(1)}else{cam.S=Math.max(cam.S,minS());apply()}}
addEventListener("resize",()=>layout(false));
export {IH,IW,fitBox,focusUnit,frameRot,hiRes,homeView,layout,minS,rot,safe,toScreen,view};
