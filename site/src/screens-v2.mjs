import { esc } from './md.mjs';

const nav=[['/como-funciona/','Como funciona'],['/recursos/','Recursos'],['/precos/','Planos'],['/blog/','Guias']];
const links=()=>nav.map(([href,label])=>`<a href="${href}">${label}</a>`).join('');
const header=`<header class="m2-header"><div class="wrap"><a class="m2-brand" href="/"><img src="/app/assets/img/seucliente-logo.svg" alt="Seu Cliente Fiel" width="170" height="52"></a><nav aria-label="Principal">${links()}</nav><div class="m2-account"><a href="/app/">Entrar</a><a class="btn primary" href="/app/?criar=1">Começar grátis →</a></div><details class="m2-menu"><summary aria-label="Abrir menu">☰</summary><nav aria-label="Menu no celular">${links()}<a href="/contato/">Contato</a><a href="/app/">Entrar</a></nav></details></div></header>`;
const footer=`<footer class="m2-footer"><div class="wrap"><div class="m2-footer-intro"><img src="/app/assets/img/seucliente-logo.svg" alt="Seu Cliente Fiel" width="180" height="52"><h2>O melhor cliente<br>é aquele que volta.</h2><a class="btn primary" href="/app/?criar=1">Criar meu cartão grátis →</a></div><div class="m2-footer-links"><nav aria-label="Produto">${links()}<a href="/cartao-fidelidade/">Para o seu negócio</a></nav><nav aria-label="Empresa"><a href="/sobre/">Sobre</a><a href="/contato/">Contato</a><a href="/faq/">Perguntas frequentes</a></nav><nav aria-label="Privacidade"><a href="/privacidade/">Privacidade</a><a href="/termos/">Termos</a><a href="/cookies/">Cookies</a><a href="/lgpd/">Seus direitos</a><button type="button" class="linklike" data-consent-open>Preferências de cookies</button></nav></div></div><div class="wrap m2-footer-bottom">© 2026 Seu Cliente Fiel · Feito para negócios locais.</div></footer>`;
const designs={'cafeteria':'espresso','padaria':'market','barbearia':'noir','salao-de-beleza':'atelier','pet-shop':'botanical','restaurante':'club','hamburgueria':'ticket','academia':'studio','loja-de-roupas':'editorial','lava-rapido':'passport','sorveteria-e-acaiteria':'candy'};
const journal={
 'cartao-fidelidade-digital':['01','A próxima visita.'],
 'cartao-fidelidade-papel-ou-digital':['02','Do papel ao bolso.'],
 'como-criar-programa-de-fidelidade':['03','Um programa. Muitas voltas.'],
 'fidelizar-clientes-estrategias':['04','A arte de ser lembrado.'],
 'lgpd-cartao-fidelidade':['05','Confiança também fideliza.'],
 'pedir-avaliacoes-no-google':['06','Seu atendimento, à vista.'],
 'qr-code-no-balcao':['07','Uma ponte no balcão.'],
 'quantos-carimbos-cartao-fidelidade':['08','Cada visita conta.'],
 'roi-programa-de-fidelidade':['09','Fidelidade que fecha a conta.']
};
const mock=(kind,label)=>`<div class="m2-phone" aria-label="Exemplo de cartão no iPhone"><div class="m2-phone-screen"><span class="m2-phone-top">9:41</span><div class="m2-phone-title">Seu cartão fidelidade</div><div data-marketing-card="${kind}" data-card-brand="${esc(label)}"></div><div class="m2-phone-note">EXEMPLO DE PERSONALIZAÇÃO<br>Mostre seu cartão no balcão.</div></div><img class="m2-phone-frame" src="/app/assets/img/devices/apple-iphone-15-pro-2023.png" alt="Mockup de iPhone 15 Pro" width="391" height="800"></div>`;
export function screensV2(pages){
 const known=new Set(pages.map(p=>p.path));
 const rewrite=html=>html;   // os endereços são os de sempre: o visual v2 é o site
 return pages.filter(p=>p.path!=='/'&&!p.path.startsWith('/v2/')).map(p=>{
  const path=p.path,segment=p.path.startsWith('/cartao-fidelidade/')&&p.path.split('/').filter(Boolean).length>1,article=p.type==='article',legal=['/privacidade/','/termos/','/cookies/','/lgpd/'].includes(p.path),family=segment?'segment':article?'article':legal?'legal':p.path.split('/')[1].replace('.html','');
  let body=rewrite(p.body);
  body=body.replace(/<img[^>]*src="\/assets\/og\/post-([a-z0-9-]+)\.webp"[^>]*>/g,(all,slug)=>{const j=journal[slug];return j?`<div class="m2-journal-art m2-journal-${Number(j[0])%3}" aria-hidden="true"><span>CADERNO DE NEGÓCIOS / ${j[0]}</span><strong>${esc(j[1])}</strong><b>${j[0]}</b><i>SEU CLIENTE FIEL ↗</i></div>`:all;});
  if(segment||p.path==='/como-funciona/'){const slug=p.path.split('/')[2],kind=designs[slug]||'editorial',label=segment?p.crumbs.at(-1).name:'Café da Esquina';body=body.replace(/<img[^>]*src="\/assets\/img\/hero-cartao.webp"[^>]*>/,mock(kind,label));}
  body=body.replace('<h1',`<span class="m2-eyebrow">${article?'CADERNO DE NEGÓCIOS':legal?'TRANSPARÊNCIA E CONFIANÇA':segment?'FEITO PARA O SEU NEGÓCIO':'MENOS DISTÂNCIA. MAIS ENCONTROS.'}</span><h1`);
  return {...p,path,themeColor:"#ffd204",bodyClass:'marketing-v2 m2-'+family,headerHtml:header,footerHtml:footer,body,stickyCta:false,crumbs:p.crumbs,head:(p.head||'')+`<link rel="stylesheet" href="/assets/css/screens-v2.css?v=20261014-collection-2"><link rel="stylesheet" href="/app/assets/css/card-v2.css?v=20261014-collection-2"><script src="/app/assets/js/card-themes.js?v=20261014-collection-2" defer></script><script src="/app/assets/js/card-premium.js?v=20261014-collection-2" defer></script><script src="/app/assets/js/card-v2.js?v=20261014-collection-2" defer></script><script src="/assets/js/screens-v2.js?v=20261014-collection-2" defer></script>`};
 });
}

