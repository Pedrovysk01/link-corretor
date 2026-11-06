// Enquadramentos (botões) e filme em tela cheia.
import {VIEWS} from "./data.js";
document.querySelectorAll("[data-zones]").forEach(c=>c.innerHTML=VIEWS.slice(1).map(([k,l])=>`<button class="chip" data-view="${k}" aria-pressed="false">${l}</button>`).join(""));
const cine=document.getElementById("cine"),cv=document.getElementById("cv"),cbar=document.getElementById("cbar");let afterCine=null;
function playFilm(f,then){
  const[src,k,t,p]=f;document.getElementById("ck").textContent=k;document.getElementById("ct").textContent=t;document.getElementById("cp").textContent=p;
  cine.classList.toggle("port",innerHeight>innerWidth);cv.poster=src+".jpg";cv.src=src+".mp4";afterCine=then;cine.hidden=false;requestAnimationFrame(()=>cine.classList.add("on"));
  cv.currentTime=0;cv.play().catch(()=>{});
}
function endFilm(){if(cine.hidden)return;cine.classList.remove("on");cv.pause();setTimeout(()=>{cine.hidden=true;cv.removeAttribute("src");cv.load()},450);const f=afterCine;afterCine=null;if(f)f()}
cv.addEventListener("timeupdate",()=>{if(cv.duration)cbar.style.width=(cv.currentTime/cv.duration*100)+"%"});
cv.addEventListener("ended",endFilm);document.getElementById("cskip").onclick=endFilm;document.getElementById("cx").onclick=endFilm;
export {cine,endFilm,playFilm};
