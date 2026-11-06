import {IC} from "./icons.js";
import {AREAS,CLUB,UNITS,reduceM} from "./data.js";
import {light3D} from "./relevo3d.js";
import {state} from "./state.js";
/* ---------- sol: posição real (fórmulas da NOAA, com equação do tempo) na Praia do Toque (−9,27°, −35,38°), UTC−3 ---------- */
const LAT=-9.27,LON=-35.38,TZ=-3,UP_AZ=23; // topo da imagem aponta para 23° (norte da prancha 01/38)
const RAD=Math.PI/180,PX_PER_M=1/0.2463;
// épocas: hoje, solstício de verão (21/dez) e de inverno (21/jun)
const SEASONS={hoje:["Hoje",()=>new Date()],verao:["Verão",()=>new Date(new Date().getFullYear(),11,21)],inverno:["Inverno",()=>new Date(new Date().getFullYear(),5,21)]};
function solar(date,h){ // declinação (°) e equação do tempo (min) para a data e hora local
  const jd=Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())/864e5+2440587.5+(h-TZ)/24,T=(jd-2451545)/36525;
  const L0=(280.46646+T*(36000.76983+T*.0003032))%360,M=357.52911+T*(35999.05029-.0001537*T),e=.016708634-T*(.000042037+.0000001267*T);
  const C=Math.sin(M*RAD)*(1.914602-T*(.004817+.000014*T))+Math.sin(2*M*RAD)*(.019993-.000101*T)+Math.sin(3*M*RAD)*.000289;
  const om=125.04-1934.136*T,lam=L0+C-.00569-.00478*Math.sin(om*RAD);
  const eps=23+(26+(21.448-T*(46.815+T*(.00059-T*.001813)))/60)/60+.00256*Math.cos(om*RAD);
  const dec=Math.asin(Math.sin(eps*RAD)*Math.sin(lam*RAD))/RAD,y=Math.tan(eps/2*RAD)**2;
  const eot=4/RAD*(y*Math.sin(2*L0*RAD)-2*e*Math.sin(M*RAD)+4*e*y*Math.sin(M*RAD)*Math.cos(2*L0*RAD)-.5*y*y*Math.sin(4*L0*RAD)-1.25*e*e*Math.sin(2*M*RAD));
  return{dec,eot}}
function sunPos(date,h){const{dec,eot}=solar(date,h);const ha=((h*60+eot+4*LON-60*TZ+1440)%1440)/4-180;
  const el=90-Math.acos(Math.sin(LAT*RAD)*Math.sin(dec*RAD)+Math.cos(LAT*RAD)*Math.cos(dec*RAD)*Math.cos(ha*RAD))/RAD;
  const az=Math.atan2(Math.sin(ha*RAD),Math.cos(ha*RAD)*Math.sin(LAT*RAD)-Math.tan(dec*RAD)*Math.cos(LAT*RAD))/RAD+180;
  return{el,az:(az+360)%360}}
function sunDay(date){const{dec,eot}=solar(date,12);const noon=(720-4*LON-eot+TZ*60)/60; // nascer/pôr com refração (90,833°)
  const ha=Math.acos(Math.cos(90.833*RAD)/(Math.cos(LAT*RAD)*Math.cos(dec*RAD))-Math.tan(LAT*RAD)*Math.tan(dec*RAD))/RAD/15;
  return{noon,rise:noon-ha,set:noon+ha}}
let DATE=SEASONS.hoje[1](),DAY=sunDay(DATE);
const sunAt=h=>sunPos(DATE,h);
const hm=h=>{const m=Math.round(h*60);return`${Math.floor(m/60)}h${String(m%60).padStart(2,"0")}`};
const dirName=a=>["norte","nordeste","leste","sudeste","sul","sudoeste","oeste","noroeste"][Math.round(((a%360)+360)%360/45)%8];
const scr=az=>{const t=(az-UP_AZ)*Math.PI/180;return[Math.sin(t),-Math.cos(t)]}; // direção na tela (imagem) para um azimute
// luzes prontas: hora de cada uma na data escolhida
const LIGHTS=[["manha","Manhã",()=>7.25],["dia","Meio-dia",()=>DAY.noon],["tarde","Tarde",()=>15.25],["por","Pôr do sol",()=>DAY.set-.33],["noite","Noite",()=>20]];
const lightH=k=>LIGHTS.find(x=>x[0]===k)[2]();
const keyAt=(h,s)=>h>DAY.set+.25||h<DAY.rise-.25?"noite":h>DAY.noon&&s.el<9?"por":h<9.5?"manha":h<14?"dia":"tarde"; // tom do render para a hora
const SUNCHIP=`<button class="chip sunplay" data-act="sun" aria-pressed="false" aria-controls="sunbar">${IC.sun} Ver o dia</button>`;
document.querySelectorAll("[data-lights]").forEach(c=>c.innerHTML=SUNCHIP+LIGHTS.map(([k,l])=>`<button class="chip" data-light="${k}" aria-pressed="false">${l}</button>`).join(""));
const img=document.getElementById("img"),shadowsG=document.getElementById("shadows"),nightG=document.getElementById("nightLights"),sunGrad=document.getElementById("sunGrad");
// luzes noturnas: cada casa acende; disponíveis mais fortes
nightG.innerHTML=AREAS.map(a=>{const r=Math.max(a.w,a.h)*(a===CLUB?.6:.42);return `<ellipse cx="${(a.bx[0]+a.bx[2])/2}" cy="${(a.bx[1]+a.bx[3])/2}" rx="${r}" ry="${Math.max(r*.55,Math.min(a.w,a.h)*.9)}" fill="url(#${a===CLUB?"glowA":"glowW"})" opacity="${a.key==="Lago"?.55:1}"/>`}).join("")+UNITS.map(u=>{const k=u.status==="d"?1.25:.85;return `<ellipse cx="${u.x}" cy="${u.y}" rx="${Math.max(u.w,u.h)*.55*k}" ry="${Math.max(u.w,u.h)*.55*k}" fill="url(#${u.status==="d"?"glowA":"glowW"})"/>`}).join("");
const HEIGHT={"Brisa":7.3,"Lago A":9.3,"Lago B":9.3,"Lago C":9.3,"Vista":9.3,"Mar":7.3};
function hull(P){P=P.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);const L=[],U=[];
  for(const p of P){while(L.length>=2&&cr(L[L.length-2],L[L.length-1],p)<=0)L.pop();L.push(p)}
  for(const p of P.reverse()){while(U.length>=2&&cr(U[U.length-2],U[U.length-1],p)<=0)U.pop();U.push(p)}return L.slice(0,-1).concat(U.slice(0,-1))}
function drawShadows(s){
  if(s.el<=2){shadowsG.innerHTML="";return}
  const[dx,dy]=scr(s.az);const tanE=Math.tan(s.el*Math.PI/180);
  shadowsG.innerHTML=UNITS.map(u=>{const L=Math.min(75,HEIGHT[u.type]/tanE*PX_PER_M);const sx=-dx*L,sy=-dy*L;
    const r=u.r*Math.PI/180,c=Math.cos(r),sn=Math.sin(r);
    const pts=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,b])=>[u.x+(a*u.w/2)*c-(b*u.h/2)*sn,u.y+(a*u.w/2)*sn+(b*u.h/2)*c]);
    const h=hull(pts.concat(pts.map(p=>[p[0]+sx,p[1]+sy])));
    return `<polygon points="${h.map(p=>p.map(v=>v.toFixed(1)).join(",")).join(" ")}" fill="#0d1a24" opacity=".27"/>`}).join("");
}
function compassSVG(s,size){const c=size/2,R=size/2-6;
  const nx=c+Math.sin(-UP_AZ*Math.PI/180)*(R-2),ny=c-Math.cos(-UP_AZ*Math.PI/180)*(R-2); // norte gira para a esquerda
  const up=s.el>0;const[dx,dy]=scr(s.az);const rr=R*(1-Math.max(0,s.el)/90)*.92;
  return `<svg viewBox="0 0 ${size} ${size}" aria-hidden="true"><circle cx="${c}" cy="${c}" r="${R}" fill="${up?"#f7efe0":"#1d2a3a"}" stroke="rgba(22,48,46,.25)"/>
   <line x1="${c}" y1="${c}" x2="${nx}" y2="${ny}" stroke="#16302e" stroke-width="1.4"/><text x="${c+(nx-c)*1.0}" y="${c+(ny-c)*1.0-3}" font-size="9" font-family="Figtree,sans-serif" font-weight="600" text-anchor="middle" fill="${up?"#16302e":"#e7e1d3"}">N</text>
   <path d="M${c+R*.98} ${c-R*.55} A ${R} ${R} 0 0 1 ${c+R*.98} ${c+R*.55}" stroke="#2f8f97" stroke-width="4" fill="none" opacity=".75"/>
   ${up?`<circle cx="${c+dx*rr}" cy="${c+dy*rr}" r="6" fill="#e7a23f" stroke="#fff" stroke-width="1.5"/>`:`<circle cx="${c+R*.35}" cy="${c-R*.35}" r="5" fill="#e7e1d3"/><circle cx="${c+R*.35+3}" cy="${c-R*.35-2}" r="4.4" fill="#1d2a3a"/>`}</svg>`}
const GRADES={manha:"brightness(1.02) saturate(1.06) sepia(.14) contrast(1.03)",dia:"none",tarde:"saturate(1.08) sepia(.1)",
  por:"brightness(.86) saturate(1.35) sepia(.4) contrast(1.06) hue-rotate(-10deg)",noite:"brightness(.34) saturate(.7) sepia(.5) hue-rotate(175deg) contrast(1.15)"};
const LABEL={manha:"Manhã",dia:"Meio-dia",tarde:"Tarde",por:"Pôr do sol",noite:"Noite"};
const NAMES=Object.fromEntries(LIGHTS.map(([k,l])=>[k,l]));
const dateTxt=()=>`${SEASONS[state.sun.season][0]} · ${DATE.toLocaleDateString("pt-BR",{day:"numeric",month:"short"}).replace(".","")}`;
// aplica a hora h (horas locais) no 2D, no 3D e nos textos; preset = luz pronta escolhida (ou null para hora livre)
function setSun(h,preset=null){const s=sunAt(h),k=keyAt(h,s),night=k==="noite",prev=state.light;
  state.light=k;state.sun.h=h;state.sun.pos=s;light3D(k,s);
  document.querySelectorAll("[data-light]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.light===preset));
  if(k!==prev||!img.style.filter&&k!=="dia"){img.style.filter=GRADES[k];document.getElementById("hi").style.filter=GRADES[k];nightG.setAttribute("opacity",night?1:0)}
  drawShadows(night?{el:0,az:0}:s);
  // luz quente vinda do lado do sol
  const[dx,dy]=scr(s.az);const warm=night?0:Math.max(0,.55-s.el/120);
  sunGrad.setAttribute("x1",842-dx*900);sunGrad.setAttribute("y1",474-dy*900);sunGrad.setAttribute("x2",842+dx*900);sunGrad.setAttribute("y2",474+dy*900);
  sunGrad.children[1].setAttribute("stop-opacity",warm.toFixed(2));
  const name=preset?NAMES[preset]:LABEL[k],when=night&&preset?"20h":hm(h);
  const txt=night?{b:`Noite · ${when}`,s:`Sol se pôs às ${hm(DAY.set)}, a oeste, atrás da mata. Casas acesas; disponíveis em destaque.`}
    :{b:`${name} · ${when}`,s:`Sol a ${Math.round(s.el)}° de altura, vindo de ${dirName(s.az)}. Nasce às ${hm(DAY.rise)} sobre o mar e se põe às ${hm(DAY.set)}.`};
  document.getElementById("sunbox").innerHTML=compassSVG(s,38)+`<span><b>${night?"Noite":hm(h)}</b>${night?"":" · sol vindo do "+dirName(s.az)}</span>`; // painel de ajustes: bússola, hora e de onde vem o sol
  document.getElementById("suninfo").innerHTML=compassSVG(s,76)+`<div><b>${txt.b}</b><span>${txt.s} (${dateTxt()})</span></div>`; // detalhe na janela de informações
  document.getElementById("sunchip").innerHTML=compassSVG(s,38)+`<span><b>${night?"Noite":hm(h)}</b> ${night?"":"· sol de "+dirName(s.az)}</span>`;
  sunbarPaint(h,s,txt);
}
function setLight(k){stopDay();setSun(lightH(k),k)}

/* ---------- barra "Ver o dia": play do nascer ao anoitecer, hora arrastável, verão/inverno ---------- */
const bar=document.getElementById("sunbar"),sky=document.getElementById("sbsky"),range=document.getElementById("sbtime"),play=document.getElementById("sbplay"),out=document.getElementById("sbtxt");
const H0=5,H1=20,SX=h=>(h-H0)/(H1-H0)*360,SY=el=>62-Math.max(0,el)*.6; // céu: hora → x, altura do sol → y
function skyPath(){let d="";for(let h=H0;h<=H1+1e-6;h+=.1){const s=sunAt(h);d+=(d?"L":"M")+SX(h).toFixed(1)+" "+SY(s.el).toFixed(1)}
  sky.querySelector(".arc").setAttribute("d",d);
  sky.querySelector(".rise").textContent=`nasce ${hm(DAY.rise)}`;sky.querySelector(".set").textContent=`põe ${hm(DAY.set)}`;
  sky.querySelector(".rise").setAttribute("x",SX(DAY.rise));sky.querySelector(".set").setAttribute("x",SX(DAY.set))}
function sunbarPaint(h,s,txt){if(bar.hidden)return;
  const dot=sky.querySelector(".dot"),up=s.el>0;dot.setAttribute("cx",SX(h).toFixed(1));dot.setAttribute("cy",SY(s.el).toFixed(1));dot.classList.toggle("moon",!up);
  if(document.activeElement!==range)range.value=h;out.textContent=txt.b+(up?` · sol de ${dirName(s.az)}`:"")}
let run=null;
function stopDay(){if(!run)return;cancelAnimationFrame(run.raf);clearTimeout(run.tm);run=null;play.innerHTML=IC.play;play.setAttribute("aria-label","Ver o dia passar")}
function playDay(){stopDay();const from=Math.max(H0,DAY.rise-.4);let h=state.sun.h>=H1-.05||state.sun.h<from?from:state.sun.h;
  play.innerHTML=IC.pause;play.setAttribute("aria-label","Pausar");
  if(reduceM()){const keys=["manha","dia","tarde","por","noite"];let i=0;run={};const step=()=>{setSun(lightH(keys[i]),keys[i]);if(++i<keys.length)run.tm=setTimeout(step,1600);else stopDay()};step();return} // sem deslocamento: troca direta
  const T=11000*(H1-h)/(H1-from),t0=performance.now(),h0=h;let last=0;run={};
  const tick=now=>{const k=Math.min(1,(now-t0)/T);if(now-last>=33||k===1){last=now;setSun(h0+(H1-h0)*k)}if(k<1)run.raf=requestAnimationFrame(tick);else stopDay()};run.raf=requestAnimationFrame(tick)}
function openBar(on){bar.hidden=!on;document.body.classList.toggle("sunopen",on);document.querySelectorAll('[data-act="sun"]').forEach(b=>b.setAttribute("aria-pressed",on));
  if(on){skyPath();setSun(state.sun.h);playDay()}else stopDay()}
range.addEventListener("input",()=>{stopDay();setSun(+range.value)});
play.addEventListener("click",()=>run?stopDay():playDay());
document.getElementById("sbx").addEventListener("click",()=>openBar(false));
bar.addEventListener("click",e=>{const b=e.target.closest("[data-season]");if(!b)return;state.sun.season=b.dataset.season;DATE=SEASONS[state.sun.season][1]();DAY=sunDay(DATE);
  bar.querySelectorAll("[data-season]").forEach(x=>x.setAttribute("aria-pressed",x===b));skyPath();const was=!!run;stopDay();setSun(state.sun.h);if(was)playDay()});
document.addEventListener("click",e=>{const b=e.target.closest("[data-light]");if(b)setLight(b.dataset.light);if(e.target.closest('[data-act="sun"]'))openBar(bar.hidden)});
addEventListener("keydown",e=>{if(e.key==="Escape"&&!bar.hidden){e.stopImmediatePropagation();openBar(false)}}); // Esc fecha só a barra
const closeSun=()=>{if(!bar.hidden)openBar(false)};
export {GRADES,LIGHTS,closeSun,scr,setLight,sunAt,sunDay,sunPos};
