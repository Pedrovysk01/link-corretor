import {AREAS,UNITS,areaAt,avail,isMobile,mi,reduceM} from "./data.js";
import {card,closeCard,select} from "./ficha.js";
import {IH,IW,hiRes,safe,view} from "./map2d.js";
import {declutter,pins,placePins,tip} from "./pins.js";
import {R3,state} from "./state.js";
import {GRADES,LIGHTS,scr,sunAt} from "./sun.js";
/* ---------- relevo 3D (render + mapa de alturas) ---------- */
const MPX=0.2463, WM=1685*MPX, HM=948*MPX; // metros
const u2w=(x,y)=>[(x/1685-.5)*WM,(y/948-.5)*HM];
const v3d=document.getElementById("v3d"),v3msg=document.getElementById("v3msg");
async function build3D(){
  R3.loading=true; // o aviso de montagem é do set3D: só aparece quando o usuário pediu o 3D
  const THREE=await import("three");const {OrbitControls}=await import("three/addons/controls/OrbitControls.js");
  R3.T=THREE;
  const renderer=R3.gl=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:"high-performance"});
  renderer.setPixelRatio(Math.min(devicePixelRatio,isMobile()?1.5:2));renderer.setSize(innerWidth,innerHeight);
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.NoToneMapping;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false; // cena estática: o mapa só refaz quando o sol muda (light3D)
  
  v3d.prepend(renderer.domElement);
  const scene=new THREE.Scene();renderer.setClearColor(0x000000,0);
  const camera=new THREE.PerspectiveCamera(34,innerWidth/innerHeight,1,4000);
  const controls=new OrbitControls(camera,renderer.domElement);
  controls.enableDamping=true;controls.dampingFactor=.08;controls.minDistance=55;controls.maxDistance=520;
  controls.maxPolarAngle=1.0;controls.minPolarAngle=0;controls.screenSpacePanning=false;
  // alturas
  const himg=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src="media/relief/height.png"});
  const cv=document.createElement("canvas");cv.width=himg.width;cv.height=himg.height;const cx=cv.getContext("2d");cx.drawImage(himg,0,0);
  const hd=cx.getImageData(0,0,cv.width,cv.height).data;const GW=cv.width,GH=cv.height;
  const geo=new THREE.PlaneGeometry(WM,HM,GW-1,GH-1);geo.rotateX(-Math.PI/2);
  const pos=geo.attributes.position;for(let i=0;i<pos.count;i++){pos.setY(i,hd[i*4]/255*12-1)}
  geo.computeVertexNormals();R3.hd=hd;R3.GW=GW;R3.GH=GH;
  const tex=await new THREE.TextureLoader().loadAsync(renderer.capabilities.maxTextureSize>=8192&&!isMobile()?"media/render-full.webp":"media/render-tex.webp");tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=renderer.capabilities.getMaxAnisotropy();
  // terreno: cores exatas do render (sem iluminação) + leve sombreamento nas encostas
  const nrm=geo.attributes.normal,colA=new Float32Array(nrm.count*3);
  for(let i=0;i<nrm.count;i++){const ny=nrm.getY(i);const k=.78+.22*Math.pow(Math.max(0,ny),3);colA[i*3]=colA[i*3+1]=colA[i*3+2]=k}
  geo.setAttribute("color",new THREE.BufferAttribute(colA,3));
  const mat=new THREE.MeshBasicMaterial({map:tex,vertexColors:true});
  const mesh=new THREE.Mesh(geo,mat);mesh.castShadow=true;scene.add(mesh);
  const shadowMat=new THREE.ShadowMaterial({opacity:.32});
  const shade=new THREE.Mesh(geo,shadowMat);shade.receiveShadow=true;shade.position.y=.05;scene.add(shade);
  // volumes das casas: telhado = recorte do render; fachadas = material da tipologia
  const slat=(base,line,dark)=>{const c=document.createElement("canvas");c.width=128;c.height=128;const g=c.getContext("2d");g.fillStyle=base;g.fillRect(0,0,128,128);
    if(line){g.fillStyle=line;for(let x=0;x<128;x+=6)g.fillRect(x,0,3,128)}
    g.fillStyle=dark;g.fillRect(0,0,128,10);g.fillStyle="rgba(30,40,45,.55)";g.fillRect(14,70,100,36);g.fillStyle="rgba(255,255,255,.08)";g.fillRect(14,70,100,4);
    const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;tx.wrapS=tx.wrapT=THREE.RepeatWrapping;return tx};
  const FAC={"Brisa":slat("#cbb08a","#a98a63","#e9e3d7"),"Lago A":slat("#b9805a","#9a6646","#ece7dd"),"Lago B":slat("#b9805a","#9a6646","#ece7dd"),
    "Lago C":slat("#ebe6dc","#cfc8bb","#f3efe8"),"Vista":slat("#d9cfbf","#b7a586","#efeae0"),"Mar":slat("#6f5038","#563b28","#e7ddc8"),"Clube":slat("#c9b28e","#8f6b48","#efe9dd")};
  // fachadas reais, recortadas dos renders de cada tipologia
  const TL=new THREE.TextureLoader(),FIMG={"Brisa":"Brisa","Lago A":"LagoA","Lago B":"LagoB","Lago C":"LagoC","Vista":"Vista","Mar":"Mar"};
  await Promise.all(Object.entries(FIMG).map(async([k,f])=>{try{const tx=await TL.loadAsync(`media/fac/${f}.jpg`);tx.colorSpace=THREE.SRGBColorSpace;tx.wrapS=THREE.RepeatWrapping;tx.wrapT=THREE.ClampToEdgeWrapping;tx.anisotropy=8;FAC[k]=tx;FAC[k].real=true}catch(e){}}));
  const facMat={};for(const k in FAC)facMat[k]=new THREE.MeshLambertMaterial({map:FAC[k],emissive:0xffffff,emissiveMap:FAC[k],emissiveIntensity:FAC[k].real?.42:.25});
  const roofMat=new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide});
  const houseGroup=new THREE.Group();scene.add(houseGroup);
  function volume(cx,cy,w,h,rotDeg,y0,y1,type){ // cx,cy,w,h em px da imagem
    const a=rotDeg*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
    const P=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([i,j])=>[cx+(i*w/2)*c-(j*h/2)*s,cy+(i*w/2)*s+(j*h/2)*c]);
    const Wp=P.map(([x,y])=>u2w(x,y));const pos=[],uv=[],idx=[];let v=0;const g=new THREE.BufferGeometry();
    // topo
    for(const k of [0,1,2,3]){pos.push(Wp[k][0],y1,Wp[k][1]);uv.push(P[k][0]/1685,1-P[k][1]/948)}
    idx.push(0,3,1,1,3,2);g.addGroup(0,6,0);v=4;
    // laterais
    const start=idx.length;
    const real=FAC[type]&&FAC[type].real;const lens=[0,1,2,3].map(e=>Math.hypot(Wp[(e+1)%4][0]-Wp[e][0],Wp[(e+1)%4][1]-Wp[e][1]));const sh=Math.min(...lens);
    for(let e=0;e<4;e++){const A=Wp[e],B=Wp[(e+1)%4];const len=lens[e];
      let rep,va,vb;if(real){rep=Math.max(1,Math.round(len/sh));va=y0>0?.62:0;vb=1}else{rep=Math.max(1,Math.round(len/4));va=0;vb=(y1-y0)/7}
      pos.push(A[0],y0,A[1], B[0],y0,B[1], B[0],y1,B[1], A[0],y1,A[1]);uv.push(0,va, rep,va, rep,vb, 0,vb);
      idx.push(v,v+1,v+2, v,v+2,v+3);v+=4}
    g.addGroup(start,idx.length-start,1);
    g.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));g.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
    const m=new THREE.Mesh(g,[roofMat,facMat[type]]);m.material[1].side=THREE.DoubleSide;m.castShadow=true;m.receiveShadow=true;houseGroup.add(m);return m}
  const HT2={"Brisa":0,"Lago A":1,"Lago B":1,"Lago C":1,"Vista":1,"Mar":0};
  for(const u of UNITS){const ms=[volume(u.x,u.y,u.w*.94,u.h*.94,u.r,0,7,u.type)];if(HT2[u.type])ms.push(volume(u.x,u.y,u.w*.5,u.h*.42,u.r,7,9.3,u.type));
    if(u.status==="d"){const own=[roofMat.clone(),facMat[u.type].clone()];own[1].side=THREE.DoubleSide;ms.forEach(m=>m.material=own)}u.m3=ms}
  R3.dimMats=[mat,roofMat,...Object.values(facMat)];
  volume(1310,457,62,26,0,0,7,"Clube");
  // entorno: mata, praia e mar além do render
  // ---- maquete: corte de terreno nas bordas + base + sombra de contato ----
  const BASE_TOP=-1.6,BASE_H=7,M=3;
  {const sp=[],sc=[],si=[];let n=0;const earth=[[.36,.29,.21],[.27,.21,.15]];
   const edge=(i,j)=>{const k=j*GW+i;return[pos.getX(k),pos.getY(k),pos.getZ(k)]};
   const runs=[[...Array(GW).keys()].map(i=>[i,0]),[...Array(GH).keys()].map(j=>[GW-1,j]),[...Array(GW).keys()].reverse().map(i=>[i,GH-1]),[...Array(GH).keys()].reverse().map(j=>[0,j])];
   for(const r of runs){for(let q=0;q<r.length-1;q++){const a=edge(...r[q]),b=edge(...r[q+1]);
     sp.push(a[0],a[1],a[2], b[0],b[1],b[2], b[0],BASE_TOP,b[2], a[0],BASE_TOP,a[2]);
     sc.push(...earth[0],...earth[0],...earth[1],...earth[1]);si.push(n,n+2,n+1, n,n+3,n+2);n+=4}}
   const sg=new THREE.BufferGeometry();sg.setAttribute("position",new THREE.Float32BufferAttribute(sp,3));sg.setAttribute("color",new THREE.Float32BufferAttribute(sc,3));sg.setIndex(si);
   scene.add(new THREE.Mesh(sg,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide})))}
  const baseMat=[0,1,2,3,4,5].map(i=>new THREE.MeshLambertMaterial({color:i===2?0xefe9dd:0xe4dccb}));
  const base=new THREE.Mesh(new THREE.BoxGeometry(WM+2*M,BASE_H,HM+2*M),baseMat);base.position.set(0,BASE_TOP-BASE_H/2-.01,0);base.receiveShadow=true;scene.add(base);
  const lip=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(WM+2*M,BASE_H,HM+2*M)),new THREE.LineBasicMaterial({color:0xb9ae98,transparent:true,opacity:.6}));lip.position.copy(base.position);scene.add(lip);
  const shTex=(()=>{const c=document.createElement("canvas");c.width=c.height=256;const g=c.getContext("2d");const r=g.createRadialGradient(128,128,40,128,128,128);
    r.addColorStop(0,"rgba(40,30,20,.55)");r.addColorStop(1,"rgba(40,30,20,0)");g.fillStyle=r;g.fillRect(0,0,256,256);return new THREE.CanvasTexture(c)})();
  const ring=new THREE.Mesh(new THREE.PlaneGeometry(WM*1.5,HM*1.9),new THREE.MeshBasicMaterial({map:shTex,transparent:true,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.set(6,BASE_TOP-BASE_H-.2,8);scene.add(ring);
  // brilho do mar: reflexo suave e animado sobre a faixa de mar do render
  const seaTex=(()=>{const c=document.createElement("canvas");c.width=256;c.height=512;const g=c.getContext("2d");g.clearRect(0,0,256,512);
    for(let i=0;i<220;i++){const y=Math.random()*512,x=Math.random()*256,w=10+Math.random()*50;g.strokeStyle=`rgba(255,255,255,${.08+Math.random()*.22})`;g.lineWidth=1+Math.random()*1.5;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+w/2,y-2,x+w,y);g.stroke()}
    const tx=new THREE.CanvasTexture(c);tx.wrapS=tx.wrapT=THREE.RepeatWrapping;tx.repeat.set(1,4);return tx})();
  const SEA_U0=1645,sw=(IW-SEA_U0)*MPX;
  const sea=new THREE.Mesh(new THREE.PlaneGeometry(sw,HM),new THREE.MeshBasicMaterial({map:seaTex,transparent:true,opacity:.55,depthWrite:false,blending:THREE.AdditiveBlending}));
  sea.rotation.x=-Math.PI/2;sea.position.set(WM/2-sw/2,.05,0);scene.add(sea);const sand=null;
  // luz
  const amb=new THREE.HemisphereLight(0xffffff,0x8a8070,.75);scene.add(amb);
  const sun=new THREE.DirectionalLight(0xffffff,.75);sun.castShadow=true;sun.shadow.mapSize.set(isMobile()?2048:4096,isMobile()?2048:4096);
  Object.assign(sun.shadow.camera,{left:-240,right:240,top:150,bottom:-150,near:1,far:1100});sun.shadow.bias=-.0004;sun.shadow.normalBias=.4;
  scene.add(sun,sun.target);
  // contornos das disponíveis + luzes noturnas
  const outlines=[],glows=[];for(const a of AREAS)a.w3=u2w(a.x,a.y);
  const gtex=(()=>{const c=document.createElement("canvas");c.width=c.height=128;const g=c.getContext("2d");const r=g.createRadialGradient(64,64,0,64,64,64);
    r.addColorStop(0,"rgba(255,230,180,1)");r.addColorStop(.35,"rgba(255,180,90,.55)");r.addColorStop(1,"rgba(255,150,60,0)");g.fillStyle=r;g.fillRect(0,0,128,128);return new THREE.CanvasTexture(c)})();
  for(const u of UNITS){const[x,z]=u2w(u.x,u.y);u.w3=[x,z];
    const w=u.w*MPX*.98,h=u.h*MPX*.98,a=-u.r*Math.PI/180;
    if(u.status==="d"){const g=new THREE.EdgesGeometry(new THREE.BoxGeometry(w,7.4,h));const l=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:0xf0c27f,transparent:true,opacity:.9}));
      l.position.set(x,3.55,z);l.rotation.y=a;scene.add(l);outlines.push({u,l});
      const cap=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:0xe2ad62,transparent:true,opacity:.25,depthWrite:false}));cap.rotation.x=-Math.PI/2;cap.rotation.z=a;cap.position.set(x,(["Brisa","Mar"].includes(u.type)?7.08:9.38),z);scene.add(cap);outlines.push({u,l:cap,cap:true})}
    const s=new THREE.Sprite(new THREE.SpriteMaterial({map:gtex,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:0}));
    const k=u.status==="d"?1.3:.85;s.scale.set(Math.max(w,h)*1.6*k,Math.max(w,h)*1.6*k,1);s.position.set(x,6,z);scene.add(s);glows.push({u,s})}
  for(const a of AREAS){const[x,z]=u2w((a.bx[0]+a.bx[2])/2,(a.bx[1]+a.bx[3])/2);const sz=Math.max(a.w,a.h)*MPX*(a.key==="Lago"?.9:a.key==="Koko"?.45:1.15);
    const s=new THREE.Sprite(new THREE.SpriteMaterial({map:gtex,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:0}));s.scale.set(sz,sz,1);s.position.set(x,5,z);scene.add(s);glows.push({u:a,s})}
  // ---- noite: postes nas alamedas, balizadores na passarela do lago, piscina do clube ----
  const ROADS=[[[62,150],[62,300],[40,380],[30,440],[60,490],[110,520],[200,532],[300,536],[400,534],[480,528],[560,515],[620,490],[632,430],[628,360],[650,305],[720,292],[820,290],[920,292],[1020,294],[1120,296],[1215,300],[1218,380],[1216,460],[1214,540],[1214,620]],
    [[652,330],[660,420],[668,520],[676,620],[690,720],[705,815],[790,790],[880,762],[970,725],[1040,690],[1062,640]],[[1225,497],[1300,497],[1380,497]]];
  const PATH=[[830,470],[845,515],[880,525],[930,512],[985,497],[1040,490]];
  const along=(pl,step)=>{const out=[];let acc=step;for(let i=0;i<pl.length-1;i++){const[a,b]=[pl[i],pl[i+1]];const L=Math.hypot(b[0]-a[0],b[1]-a[1]);for(let s=0;s<L;s+=1){acc+=1;if(acc>=step){acc=0;out.push([a[0]+(b[0]-a[0])*s/L,a[1]+(b[1]-a[1])*s/L])}}}return out};
  const lampTex=(()=>{const c=document.createElement("canvas");c.width=c.height=64;const g=c.getContext("2d");const r=g.createRadialGradient(32,32,0,32,32,32);
    r.addColorStop(0,"rgba(255,244,214,1)");r.addColorStop(.18,"rgba(255,206,130,.9)");r.addColorStop(.5,"rgba(255,170,80,.25)");r.addColorStop(1,"rgba(255,150,60,0)");g.fillStyle=r;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c)})();
  const nightFx=[];const addGlow=(x,y,sz,col,h,tex)=>{const[wx,wz]=u2w(x,y);const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex||lampTex,color:col||0xffffff,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:0}));s.scale.set(sz,sz,1);s.position.set(wx,h??3.2,wz);scene.add(s);nightFx.push(s)};
  for(const pl of ROADS)for(const[x,y]of along(pl,54))addGlow(x,y,4.2,0xffd59a);
  for(const[x,y]of along(PATH,22))addGlow(x,y,2.4,0xffe2b0,1.2);
  {const[wx,wz]=u2w(1437,507);const pm=new THREE.Mesh(new THREE.PlaneGeometry(84*MPX,26*MPX),new THREE.MeshBasicMaterial({color:0x2a9fc0,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));
    pm.rotation.x=-Math.PI/2;pm.position.set(wx,.15,wz);scene.add(pm);pm.userData.max=.38;nightFx.push(pm);addGlow(1437,507,14,0x2a8fb0,1.4,gtex);nightFx[nightFx.length-1].userData.max=.35}
  R3.nightFx=nightFx;R3.baseMat=baseMat;
  Object.assign(R3,{THREE,renderer,scene,camera,controls,mesh,sun,amb,outlines,glows,mat,ring,sea,sand,shadowMat,houseGroup});
  // câmera inicial: celular em pé com o mar no topo
  setCam3D(startCam3D(),1);
  // seleção por toque
  const ray=new THREE.Raycaster(),ndc=new THREE.Vector2();let down=null;
  renderer.domElement.addEventListener("pointerdown",e=>{down=[e.clientX,e.clientY,performance.now()]});
  renderer.domElement.addEventListener("pointerup",e=>{if(!down)return;const moved=Math.hypot(e.clientX-down[0],e.clientY-down[1]);const dt=performance.now()-down[2];down=null;
    if(moved>6||dt>500)return;const hit=pick3D(e.clientX,e.clientY);if(hit)select(hit);else if(!card.hidden&&isMobile())closeCard()});
  renderer.domElement.addEventListener("pointermove",e=>{if(e.pointerType!=="mouse"||e.buttons)return;const u=pick3D(e.clientX,e.clientY);
    renderer.domElement.style.cursor=u?"pointer":"grab";if(u){tip.hidden=false;tip.style.left=e.clientX+"px";tip.style.top=e.clientY+"px";
      tip.innerHTML=u.area?`<b>${u.label}</b> · toque para conhecer`:`<b>${u.label}</b> · ${u.status==="d"?"Disponível · "+mi(u.price):u.status==="r"?"Reservada":"Vendida"}`}else tip.hidden=true});
  function pick3D(x,y){ndc.set(x/innerWidth*2-1,-(y/innerHeight)*2+1);ray.setFromCamera(ndc,camera);const h=ray.intersectObjects([...houseGroup.children,mesh],false)[0];if(!h)return null;
    {const ar=areaAt((h.point.x/WM+.5)*IW,(h.point.z/HM+.5)*IH,6);if(ar){let bd2=1e9;for(const u of UNITS)bd2=Math.min(bd2,Math.hypot(u.w3[0]-h.point.x,u.w3[1]-h.point.z)-Math.max(u.w,u.h)*MPX*.5);if(bd2>0)return ar}}
    let best=null,bd=1e9;for(const u of UNITS){const d=Math.hypot(u.w3[0]-h.point.x,u.w3[1]-h.point.z);if(d<bd){bd=d;best=u}}
    return bd<Math.max(best.w,best.h)*MPX*.6?best:null}
  addEventListener("resize",()=>{if(!R3.renderer)return;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);R3.dirty=true});
  R3.ready=true;R3.dirty=true;R3.loading=false;v3msg.hidden=true;light3D(state.light);only3D();loop3D();
}
// celular em pé: abre enquadrando as casas disponíveis (o condomínio inteiro não cabe na largura do aparelho)
function startCam3D(){const port=innerHeight>innerWidth;if(!port||!avail.length)return defaultCam3D();
  const xs=avail.map(u=>u.w3[0]),zs=avail.map(u=>u.w3[1]);const cx=(Math.min(...xs)+Math.max(...xs))/2,cz=(Math.min(...zs)+Math.max(...zs))/2;
  const hf=Math.atan(Math.tan(17*Math.PI/180)*innerWidth/innerHeight); // meio campo de visão horizontal
  const d=Math.max(240,(Math.max(...zs)-Math.min(...zs)+60)/2/Math.tan(hf));
  return{t:[cx-12,0,cz],d,pol:.78,az:-Math.PI/2}} // -12 m: desce o conjunto para o vão entre o topo e o carrossel
function defaultCam3D(){const port=innerHeight>innerWidth;if(port)return{t:[8,0,0],d:330,pol:.78,az:-Math.PI/2};
  const tf=2*Math.tan(17*Math.PI/180),asp=innerWidth/innerHeight;const d=Math.min(515,Math.max(WM/.876/(tf*asp),HM*1.03/tf));
  return{t:[0,0,4],d,pol:.09,az:0}}
function camFrom(o){const{t,d,pol,az}=o;return[t[0]+d*Math.sin(pol)*Math.sin(az),t[1]+d*Math.cos(pol),t[2]+d*Math.sin(pol)*Math.cos(az)]}
let tw3=null;
function setCam3D(o,ms=1300){const{camera,controls,THREE}=R3;const p1=camFrom(o);
  if(ms<=1||reduceM()){camera.position.set(...p1);controls.target.set(...o.t);controls.update();return}
  tw3={p0:camera.position.clone(),t0:controls.target.clone(),p1:new THREE.Vector3(...p1),t1:new THREE.Vector3(...o.t),s:performance.now(),ms}}
function curAz(){const{camera,controls}=R3;return Math.atan2(camera.position.x-controls.target.x,camera.position.z-controls.target.z)}
function fly3DBox([x0,y0,x1,y1]){const[a,b]=u2w((x0+x1)/2,(y0+y1)/2);const span=Math.max((x1-x0)*MPX,(y1-y0)*MPX);
  setCam3D({t:[a,2,b],d:Math.max(110,span*1.45),pol:.6,az:curAz()})}
function fly3DUnit(u){const[a,b]=u.w3||u2w(u.x,u.y);const m=isMobile();
  const o={t:[a,3,b],d:m?185:200,pol:.58,az:curAz()};
  if(!m){const off=36;o.t=[a+Math.cos(o.az)*off,3,b-Math.sin(o.az)*off]}else{o.t=[a+Math.sin(o.az)*26,3,b+Math.cos(o.az)*26]}
  setCam3D(o,1000)}
function light3D(k,s=state.sun.pos||sunAt(LIGHTS.find(x=>x[0]===k)[2]())){if(!R3.ready)return;const{THREE,sun,amb,scene,glows,renderer}=R3;const night=k==="noite";
  renderer.domElement.style.filter=k==="noite"?"saturate(.9) contrast(1.05)":GRADES[k];
  const[dx,dy]=scr(s.az);const el=Math.max(s.el,3)*Math.PI/180;
  sun.position.set(dx*Math.cos(el)*500,Math.sin(el)*500,dy*Math.cos(el)*500);sun.target.position.set(0,0,0);renderer.shadowMap.needsUpdate=true;
  sun.intensity=night?0:.45+.4*Math.min(1,s.el/40);amb.intensity=night?.9:.7;R3.shadowMat&&(R3.shadowMat.opacity=night?0:.18+.18*Math.min(1,s.el/30));
  sun.color.setHSL(.09,night?0:Math.max(0,.6-s.el/80),.5+.5*Math.min(1,s.el/30));
  document.getElementById("v3d").dataset.l=k;only3D();if(R3.sea&&!night)R3.sea.material.opacity=(k==="por"?.75:.55)*(state.only?.38:1);
  for(const g of glows)g.s.material.opacity=night?(g.u.status==="d"?1:g.u.key==="Koko"?.5:.75):0}
let raf3=null;
function loop3D(){if(!R3.on){raf3=null;return}const{renderer,scene,camera,controls,outlines,THREE}=R3;const t=performance.now();
  const tween=!!tw3;
  if(tw3){const k=Math.min(1,(t-tw3.s)/tw3.ms),e=k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;camera.position.lerpVectors(tw3.p0,tw3.p1,e);controls.target.lerpVectors(tw3.t0,tw3.t1,e);if(k>=1)tw3=null}
  const moved=controls.update()||tween||R3.dirty||state.selected!==R3._sel;R3._sel=state.selected;
  if(!moved&&t-(R3.last||0)<33){raf3=requestAnimationFrame(loop3D);return} // câmera parada: 30 fps bastam para o pulso e o mar
  R3.last=t;
  if(R3.sea)R3.sea.material.map.offset.y=(t/24000)%1;
  const pulse=.55+.4*Math.sin(t/380);for(const o of outlines){const sel=o.u===state.selected;o.l.material.opacity=o.cap?(sel?.45:.18+.1*Math.sin(t/380)):(sel?1:pulse)}
  renderer.render(scene,camera);if(moved){place3DPins();R3.dirty=false}raf3=requestAnimationFrame(loop3D)}
function place3DPins(){const{camera,THREE}=R3;if(!R3._v)R3._v=new THREE.Vector3();const v=R3._v;
  for(const p of pins){const[x,z]=p.u.w3;v.set(x,12,z).project(camera);const vis=v.z<1&&Math.abs(v.x)<1.05&&Math.abs(v.y)<1.05;
    const sx=(v.x*.5+.5)*innerWidth,sy=(-v.y*.5+.5)*innerHeight;p.el.hidden=!vis||sy>innerHeight-(isMobile()?safe().b:0);
    if(vis)p._a=[sx,sy,false]}
  declutter(6)}
function only3D(){if(!R3.ready)return;const k=state.only?.38:1,night=state.light==="noite";const T=night?[.10,.13,.21]:[1,1,1];
  for(const m of R3.dimMats){m.color.setRGB(T[0]*k,T[1]*k,T[2]*k);if(m.emissiveMap){m.userData.e0??=m.emissiveIntensity;
    if(night){m.emissive.setHex(0xffb468);m.emissiveIntensity=.30*k}else{m.emissive.setHex(0xffffff);m.emissiveIntensity=m.userData.e0*k}}}
  for(const m of R3.baseMat||[])m.color.setHex(night?0x2a3442:(m===R3.baseMat[2]?0xefe9dd:0xe4dccb));
  for(const s of R3.nightFx||[])s.material.opacity=night?(s.userData.max??.85)*(state.only?.4:1):0;
  if(R3.sea)R3.sea.material.opacity=(night?.12:.55)*k}
// montagem que falhou: descarta o renderer para a próxima tentativa não abrir um segundo contexto WebGL
function drop3D(){const r=R3.gl;if(r){r.dispose();r.forceContextLoss();r.domElement.remove()}R3.gl=R3.renderer=R3.p=null;R3.loading=false}
// botão marcado = 3D na tela, ou pedido pelo usuário e ainda montando
const mark3D=()=>{const on=!!(R3.on||R3.goal&&R3.asked);document.querySelectorAll('[data-act="3d"]').forEach(b=>b.setAttribute("aria-pressed",b.dataset.v?(b.dataset.v==="3d")===on:on))};
// auto=true: subida em segundo plano no boot (sem aviso, falha calada)
async function set3D(on,auto){R3.goal=on;if(!auto)R3.asked=on;mark3D();
  if(on&&!R3.ready){ // monta o 3D com o 2D à vista; só troca quando estiver pronto
    v3d.hidden=false;v3d.classList.add("warm");
    if(R3.asked){v3msg.hidden=false;v3msg.textContent="Montando o relevo…"}
    try{await(R3.p||(R3.p=build3D()))}catch(err){drop3D();R3.want=false;const asked=R3.asked;R3.goal=R3.asked=false;mark3D();
      if(!asked){v3d.hidden=true;v3d.classList.remove("warm");return}
      const net=!navigator.onLine||!(err instanceof Error)||/fetch|import|load|network/i.test(err.message); // textura e módulo rejeitam com evento ou TypeError; WebGL com Error próprio
      v3msg.hidden=false;v3msg.textContent=net?"A conexão falhou ao carregar o 3D. Toque em Relevo 3D para tentar de novo.":"Não foi possível abrir o 3D neste aparelho. Seguimos na vista de cima.";
      setTimeout(()=>{if(!R3.goal){v3msg.hidden=true;set3D(false,true)}},2200);return}
    if(R3.goal!==on)return;v3d.classList.remove("warm")}
  R3.on=on;R3.dirty=true;mark3D();view.hidden=on;v3d.hidden=!on;document.body.classList.toggle("is3d",on);tip.hidden=true;
  if(on){if(R3.ready&&!raf3)loop3D()}
  else{v3d.classList.remove("warm");placePins();hiRes()}}
document.addEventListener("click",e=>{const a=e.target.closest('[data-act="3d"]');if(a)set3D(a.dataset.v?a.dataset.v==="3d":!(R3.on||R3.goal&&R3.asked))});
// capacidade do aparelho para o 3D; sem ela, fica no 2D e o botão 3D continua disponível
const can3D=()=>{const c=navigator.connection||{};if(c.saveData||/^(slow-2g|2g|3g)$/.test(c.effectiveType||""))return false;
  if((navigator.deviceMemory||8)<4||(navigator.hardwareConcurrency||8)<4)return false;
  try{const g=document.createElement("canvas").getContext("webgl2");g?.getExtension("WEBGL_lose_context")?.loseContext();return !!g}catch(e){return false}};
export {can3D,fly3DBox,fly3DUnit,light3D,only3D,set3D,setCam3D,startCam3D};
