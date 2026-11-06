// Saudação do acesso. Protótipo: o perfil vem do link (?perfil=corretor&nome=Ana&g=f) e fica guardado na aba;
// na versão final vem do login. Gênero é informado no cadastro (g=f|m), nunca adivinhado pelo nome.
const P=new URLSearchParams(location.search),KEY="bossa-perfil";
const ROLES={ // [rótulo m, rótulo f, tratamento]
  corretor:["Corretor","Corretora",""],construtor:["Construtor","Construtora",""],
  cliente:["","","caro"],admin:["Super Admin","Super Admin",""]};
let me={perfil:"cliente",nome:"",g:""};
try{const s=JSON.parse(sessionStorage.getItem(KEY)||"null");if(s)me={...me,...s}}catch{}
if(P.get("perfil")||P.get("nome")){me={perfil:ROLES[P.get("perfil")]?P.get("perfil"):"cliente",nome:(P.get("nome")||"").trim().slice(0,40),g:P.get("g")==="f"?"f":P.get("g")==="m"?"m":""};
  try{sessionStorage.setItem(KEY,JSON.stringify(me))}catch{}}
export function saudacao(){const [m,f]=ROLES[me.perfil],fem=me.g==="f";
  const hello=me.g?(fem?"Bem-vinda":"Bem-vindo"):"Boas-vindas";
  const rol=fem?f:m,trat=me.perfil==="cliente"&&me.g?(fem?"cara":"caro"):"";
  const nome=[trat,rol,me.nome].filter(Boolean).join(" ");
  return {eyebrow:"Acesso · "+(me.perfil==="cliente"?"cliente":rol.toLowerCase()),hello,nome}}
export function paintSaudacao(){const el=document.getElementById("greet");if(!el)return;const s=saudacao();
  el.innerHTML='<h2><span></span> <i></i></h2>';
  el.querySelector("h2 span").textContent=s.hello+(s.nome?",":"");el.querySelector("h2 i").textContent=s.nome;
  document.body.classList.add("hasgreet")}
export const perfilAtual=()=>({perfil:me.perfil,nome:me.nome,g:me.g}); // quem está usando: filtra materiais e telas
