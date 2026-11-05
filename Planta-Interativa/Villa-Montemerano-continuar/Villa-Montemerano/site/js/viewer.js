// Visualizador de imagem e planta em tela cheia (zoom, arrastar, trocar).
import {resumeLB} from "./exp.js";
const pv=document.getElementById("pv"),pvc=document.getElementById("pvc"),pvi=document.getElementById("pvi"),pvtabs=document.getElementById("pvtabs");
let PS=1,PX=0,PY=0,PV=null;
function pvApply(){const cw=pvc.clientWidth,ch=pvc.clientHeight,w=pvi.naturalWidth*PS,h=pvi.naturalHeight*PS;
  PX=w<=cw?(cw-w)/2:Math.min(0,Math.max(cw-w,PX));PY=h<=ch?(ch-h)/2:Math.min(0,Math.max(ch-h,PY));pvi.style.transform=`translate(${PX}px,${PY}px) scale(${PS})`}
const pvMin=()=>Math.min(pvc.clientWidth/pvi.naturalWidth,pvc.clientHeight/pvi.naturalHeight)*.98;
function pvFit(){PS=pvMin();PX=0;PY=0;pvApply()}
function pvZoom(f,cx=pvc.clientWidth/2,cy=pvc.clientHeight/2){const ns=Math.min(pvMin()*6,Math.max(pvMin(),PS*f));const k=ns/PS;PX=cx-(cx-PX)*k;PY=cy-(cy-PY)*k;PS=ns;pvApply()}
function pvSet(i){PV.i=(i+PV.list.length)%PV.list.length;const it=PV.list[PV.i];
  document.getElementById("pvk").textContent=`${PV.kicker} · ${it.label}`;document.getElementById("pvt").textContent=PV.title;
  pvtabs.innerHTML=PV.list.length>1?PV.list.map((x,k)=>`<button data-vf="${k}" aria-pressed="${k===PV.i}">${x.label}</button>`).join(""):"";
  const many=PV.list.length>1;document.getElementById("pvl").hidden=!many;document.getElementById("pvr").hidden=!many;
  document.getElementById("pvnum").textContent=many?`${PV.i+1} / ${PV.list.length}`:"";document.getElementById("pvnum").hidden=!many;
  pvi.onload=pvFit;pvi.src=it.src;pvi.alt=it.label;if(pvi.complete&&pvi.naturalWidth)pvFit()}
function openViewer(list,i,title,kicker){PV={list,i,title,kicker};pv.hidden=false;pvSet(i);document.getElementById("pvx").focus({preventScroll:true})}
function closeViewer(){pv.hidden=true;resumeLB()}
document.getElementById("pvx").onclick=closeViewer;
document.getElementById("pvl").onclick=e=>{e.stopPropagation();pvSet(PV.i-1)};document.getElementById("pvr").onclick=e=>{e.stopPropagation();pvSet(PV.i+1)};
["pvl","pvr"].forEach(id=>document.getElementById(id).addEventListener("pointerdown",e=>e.stopPropagation()));
pvtabs.addEventListener("click",e=>{const b=e.target.closest("[data-vf]");if(b)pvSet(+b.dataset.vf)});
document.getElementById("pvn").onclick=()=>pvZoom(1.5);document.getElementById("pvo").onclick=()=>pvZoom(1/1.5);document.getElementById("pvf").onclick=pvFit;
pvc.addEventListener("wheel",e=>{e.preventDefault();const r=pvc.getBoundingClientRect();pvZoom(Math.exp(-e.deltaY*.0015),e.clientX-r.left,e.clientY-r.top)},{passive:false});
{const pp=new Map();let pl=null,pd=null,sx=null,st=0;
 pvc.addEventListener("pointerdown",e=>{pp.set(e.pointerId,[e.clientX,e.clientY]);pl=[e.clientX,e.clientY];if(pp.size===1){sx=e.clientX;st=performance.now()}if(pp.size===2){const[a,b]=[...pp.values()];pd=Math.hypot(a[0]-b[0],a[1]-b[1]);sx=null}});
 pvc.addEventListener("pointermove",e=>{if(!pp.has(e.pointerId))return;pp.set(e.pointerId,[e.clientX,e.clientY]);
   if(pp.size===2&&pd){const[a,b]=[...pp.values()];const d=Math.hypot(a[0]-b[0],a[1]-b[1]);const r=pvc.getBoundingClientRect();pvZoom(d/pd,(a[0]+b[0])/2-r.left,(a[1]+b[1])/2-r.top);pd=d;return}
   PX+=e.clientX-pl[0];PY+=e.clientY-pl[1];pl=[e.clientX,e.clientY];pvApply()});
 const end=e=>{if(pp.size===1&&sx!=null&&PS<=pvMin()*1.01&&performance.now()-st<700){const d=e.clientX-sx;if(Math.abs(d)>60&&PV.list.length>1)pvSet(PV.i+(d<0?1:-1))}
   pp.delete(e.pointerId);if(pp.size<2)pd=null;if(pp.size===1)pl=[...pp.values()][0]};pvc.addEventListener("pointerup",end);pvc.addEventListener("pointercancel",end);
 pvc.addEventListener("dblclick",e=>{const r=pvc.getBoundingClientRect();pvZoom(2,e.clientX-r.left,e.clientY-r.top)})}
addEventListener("resize",()=>{if(!pv.hidden)pvFit()});
function pvKey(e){if(pv.hidden)return false;if(e.key==="Escape")closeViewer();if(e.key==="ArrowRight")pvSet(PV.i+1);if(e.key==="ArrowLeft")pvSet(PV.i-1);return true}
export {openViewer,pvKey};
