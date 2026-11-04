// Mídia do assistente: entende o pedido ("me manda foto da praia", "vídeo do lago", "book em PDF") e monta fotos, vídeo e PDF com botões de baixar.
import {BOOK,EXP,IMG,IMGM} from "./data.js";
import {IC} from "./icons.js";
const norm=s=>s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
const TOP={clube:["clube","club","koko"],bem:["spa","sauna","academia","gym","massagem","massage"],praia:["praia","beach","playa","orla","mar","sea"],lago:["lago","lake","lagoa"],
  orsini:["jardim","paisag","garden","jardin","orsini"],deck:["deck","lounge","passeio"],kids:["kids","crianca","infantil","children","nino"],quadras:["quadra","tenis","tennis","court","esporte","deporte"]};
const NAME={clube:["do Beach Club","of the Beach Club","del Beach Club"],bem:["do spa e academia","of the spa and gym","del spa y gimnasio"],praia:["da Praia do Toque","of Praia do Toque","de la Praia do Toque"],
  lago:["do lago","of the lake","del lago"],orsini:["do jardim de Orsini","of the Orsini gardens","del jardín de Orsini"],deck:["do deck e passeios","of the deck and walkways","del deck y paseos"],
  kids:["do Bosque Kids","of the Kids woods","del Bosque Kids"],quadras:["das quadras","of the sports courts","de las canchas"],casa:["da casa","of the home","de la casa"],geral:["do Bossa","of Bossa","de Bossa"]};
const KIND={foto:["foto","imagem","imagen","picture","photo","image","pics"],video:["video","filme","film","clip"],pdf:["pdf","book","catalogo","brochure","folheto","memorial","material","folder","apresentacao","presentation","presentacion"]};
export const PDF={src:"media/bossa-book-resumo.pdf",name:"Bossa-Book-Resumo.pdf",pages:4,mb:"1,5"};
const slug=s=>norm(s).replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const abs=p=>new URL(p,location.href).href;
function match(words,list){return list.some(k=>words.some(w=>w===k||(k.length>=4&&w.startsWith(k))))}
// Entende o pedido. Retorna {img,vid,pdf,key,all} ou null se não for pedido de mídia. key = área citada (ou "casa" se citou a casa aberta).
export function intent(q,u){const words=norm(q).split(/[^a-z0-9]+/).filter(Boolean);
  const img=match(words,KIND.foto),vid=match(words,KIND.video),pdf=match(words,KIND.pdf);if(!(img||vid||pdf))return null;
  const named=Object.keys(TOP).find(k=>match(words,TOP[k])),house=u&&match(words,["casa","house","home","unidade"]);
  return {img,vid,pdf,key:named||(house?"casa":null),all:match(words,["todas","todos","tudo","all","todo"])}}
const SHORT={clube:["Beach Club","Beach Club","Beach Club"],bem:["Spa e academia","Spa & gym","Spa y gimnasio"],praia:["Praia","Beach","Playa"],lago:["Lago","Lake","Lago"],orsini:["Jardins","Gardens","Jardines"],
  deck:["Deck e passeios","Deck & walkways","Deck y paseos"],kids:["Bosque Kids","Kids woods","Bosque Kids"],quadras:["Quadras","Courts","Canchas"],casa:["Esta casa","This home","Esta casa"],geral:["Voo geral","Full flight","Vuelo general"]};
const ALL=["Todas","All","Todas"];
const isVid=x=>typeof x==="string"&&x.startsWith("v:"),photosOf=e=>e[3].filter(x=>!isVid(x)),videoOf=e=>e[3].find(isVid);
const imgItem=(x,label)=>{const k=Array.isArray(x)?x[0]:x;return {k:"img",src:IMG(k),thumb:IMGM(k),label:label||(Array.isArray(x)?x[1]:String(k))}}; // fotos do EXP vêm como [arquivo, legenda]
// resposta pronta: {text, items?, choices?}. forced = escolha feita num botão ({img,vid,key,all}).
export function mediaReply(q,u,lang,forced){const it=forced||intent(q,u);if(!it)return null;const L={pt:0,en:1,es:2}[lang];
  const out={text:"",items:[]},{img,vid,pdf}=it;let {key,all}=it;if(key==="casa"&&!u)key=null;
  const pick=(o)=>({...o});
  // pediu foto ou vídeo sem dizer de quê: pergunta, em vez de adivinhar
  if(img&&!key&&!all){const ch=[];if(u)ch.push({label:`${SHORT.casa[L]} (${u.label})`,pick:pick({img:1,key:"casa"})});
    EXP.filter(e=>photosOf(e).length).forEach(e=>ch.push({label:SHORT[e[0]][L],pick:pick({img:1,key:e[0]})}));ch.push({label:ALL[L],pick:pick({img:1,all:1})});
    return {text:["Posso te mandar sim! Quer fotos de alguma área específica ou prefere todas?","Happy to! Would you like photos of a specific area, or all of them?","¡Claro! ¿Quiere fotos de un área específica o todas?"][L],choices:ch}}
  if(vid&&!img&&!key){const ch=[];EXP.filter(videoOf).forEach(e=>ch.push({label:SHORT[e[0]][L],pick:pick({vid:1,key:e[0]})}));ch.push({label:SHORT.geral[L],pick:pick({vid:1,key:"geral"})});
    return {text:["Tenho vídeos de várias áreas. Qual você quer ver?","I have videos of several areas. Which one would you like?","Tengo videos de varias áreas. ¿Cuál quiere ver?"][L],choices:ch}}
  if(img){let imgs;
    if(all){imgs=[];EXP.forEach(e=>photosOf(e).forEach(x=>imgs.push({...imgItem(x),zip:IMGM(Array.isArray(x)?x[0]:x)})));
      out.text=[`Reuni ${imgs.length} fotos de todas as áreas. Imagens ilustrativas.`,`Here are ${imgs.length} photos from every area. Illustrative images.`,`Aquí hay ${imgs.length} fotos de todas las áreas. Imágenes ilustrativas.`][L]}
    else{imgs=key==="casa"?BOOK[u.type].g.slice(0,6).map(([k,l])=>imgItem(k,l)):photosOf(EXP.find(e=>e[0]===key)).slice(0,6).map(x=>imgItem(x));
      out.text=[`Separei ${imgs.length} fotos. Imagens ilustrativas.`,`Here are ${imgs.length} photos. Illustrative images.`,`Aquí hay ${imgs.length} fotos. Imágenes ilustrativas.`][L]}
    out.items.push(...imgs)}
  if(vid){const e=EXP.find(x=>x[0]===key),v=e&&videoOf(e),name=v?v.slice(2):"voo-geral";
    out.items.push({k:"video",src:`media/${name}.mp4`,poster:`media/${name}.jpg`,label:v?SHORT[key][L]:SHORT.geral[L]});
    out.text+=(out.text?" ":"")+[`Aqui está o vídeo: ${out.items.at(-1).label}.`,`Here is the video: ${out.items.at(-1).label}.`,`Aquí está el video: ${out.items.at(-1).label}.`][L]}
  if(pdf){out.items.push({k:"pdf",...PDF});out.text+=(out.text?" ":"")+["Aqui está o book do empreendimento (resumo).","Here is the project brochure (summary).","Aquí está el folleto del proyecto (resumen)."][L]}
  return out}
export function choicesHTML(choices){return `<div class="m-choices" role="group">${choices.map((c,i)=>`<button type="button" data-c="${i}">${esc(c.label)}</button>`).join("")}</div>`}
/* ---------- montagem das mensagens ---------- */
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const T={pt:{open:"Ampliar",save:"Baixar",all:n=>`Baixar ${n} fotos (ZIP)`,view:n=>`Ver as ${n} fotos`,pdf:"Baixar apresentação (PDF)",share:"Enviar pelo WhatsApp",pages:"páginas"},
  en:{open:"Enlarge",save:"Download",all:n=>`Download ${n} photos (ZIP)`,view:n=>`See all ${n} photos`,pdf:"Download presentation (PDF)",share:"Send on WhatsApp",pages:"pages"},
  es:{open:"Ampliar",save:"Descargar",all:n=>`Descargar ${n} fotos (ZIP)`,view:n=>`Ver las ${n} fotos`,pdf:"Descargar presentación (PDF)",share:"Enviar por WhatsApp",pages:"páginas"}};
export function mediaHTML(items,lang){const t=T[lang],imgs=items.filter(x=>x.k==="img"),vids=items.filter(x=>x.k==="video"),pdfs=items.filter(x=>x.k==="pdf");let h="";
  if(imgs.length)h+=`<div class="m-grid" data-n="${Math.min(imgs.length,4)}">${imgs.slice(0,4).map((x,i)=>`<figure class="m-img"><button type="button" data-open="${i}" aria-label="${t.open}: ${esc(x.label)}"><img src="${x.thumb}" alt="${esc(x.label)}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='${x.src}'"></button>
    <a class="m-dl" href="${x.src}" download="bossa-${slug(x.label)}.jpg" aria-label="${t.save}: ${esc(x.label)}" title="${t.save}">${IC.download}</a>${i===3&&imgs.length>4?`<span class="m-more" aria-hidden="true">+${imgs.length-4}</span>`:""}</figure>`).join("")}</div>`;
  vids.forEach(x=>h+=`<figure class="m-vid"><video controls playsinline preload="metadata" poster="${x.poster}" src="${x.src}"></video><a class="m-dl" href="${x.src}" download="bossa-${slug(x.label)}.mp4" aria-label="${t.save}: ${esc(x.label)}" title="${t.save}">${IC.download}</a></figure>`);
  pdfs.forEach(x=>h+=`<a class="m-pdf" href="${x.src}" target="_blank" rel="noopener"><span class="m-ico">${IC.pdf}</span><span><b>${x.name}</b><small>PDF · ${x.pages} ${t.pages} · ${x.mb} MB</small></span></a>`);
  const acts=[];if(imgs.length>4)acts.push(`<button type="button" data-m="view">${IC.image}<span>${t.view(imgs.length)}</span></button>`);if(imgs.length>1)acts.push(`<button type="button" data-m="zip">${IC.download}<span>${t.all(imgs.length)}</span></button>`);
  if(!pdfs.length)acts.push(`<a href="${PDF.src}" download="${PDF.name}">${IC.pdf}<span>${t.pdf}</span></a>`);
  acts.push(`<button type="button" data-m="wa">${IC.out}<span>${t.share}</span></button>`);
  return h+`<div class="m-acts">${acts.join("")}</div>`}
/* ---------- ZIP sem compressão (JPG já é comprimido), montado no navegador ---------- */
const CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
const crc32=b=>{let c=0xFFFFFFFF;for(let i=0;i<b.length;i++)c=CRC[(c^b[i])&255]^(c>>>8);return(c^0xFFFFFFFF)>>>0};
export async function zipBlob(files){const enc=new TextEncoder(),parts=[],cd=[];let off=0;
  for(const {name,data} of files){const nm=enc.encode(name),crc=crc32(data),h=new DataView(new ArrayBuffer(30));
    h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint32(14,crc,true);h.setUint32(18,data.length,true);h.setUint32(22,data.length,true);h.setUint16(26,nm.length,true);
    parts.push(h.buffer,nm,data);const c=new DataView(new ArrayBuffer(46));
    c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x0800,true);c.setUint32(16,crc,true);c.setUint32(20,data.length,true);c.setUint32(24,data.length,true);c.setUint16(28,nm.length,true);c.setUint32(42,off,true);
    cd.push(c.buffer,nm);off+=30+nm.length+data.length}
  const size=cd.reduce((a,b)=>a+b.byteLength,0),e=new DataView(new ArrayBuffer(22));
  e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,size,true);e.setUint32(16,off,true);
  return new Blob([...parts,...cd,e.buffer],{type:"application/zip"})}
export async function downloadAll(imgs){const files=await Promise.all(imgs.map(async(x,i)=>({name:`bossa-${String(i+1).padStart(2,"0")}-${slug(x.label)}.jpg`,data:new Uint8Array(await (await fetch(x.zip||x.src)).arrayBuffer())})));
  const a=document.createElement("a");a.href=URL.createObjectURL(await zipBlob(files));a.download="bossa-fotos.zip";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}
export const shareText=(items,lang)=>{const L={pt:0,en:1,es:2}[lang];return [["Fotos e material do Bossa Eco Luxury Villas:","Photos and material from Bossa Eco Luxury Villas:","Fotos y material de Bossa Eco Luxury Villas:"][L],
  ...items.filter(x=>x.k==="img").map(x=>abs(x.src)),...items.filter(x=>x.k!=="img").map(x=>abs(x.src)),abs(PDF.src)].join("\n")};
