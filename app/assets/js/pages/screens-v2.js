/* Composição v2 sobre as rotas nativas: IDs, formulários e regras do produto preservados. */
(function(){
 'use strict';
 const CF=window.CF,E=CF.esc,I=CF.icon,register=CF.route;
 const copy={cards:['DESIGN DO CARTÃO','Uma marca|que dá vontade de guardar.','Crie uma experiência de fidelidade com a personalidade do seu negócio.'],campaigns:['MOVIMENTE SEU NEGÓCIO','O próximo encontro|começa aqui.','Ofertas com intenção, prazo e um motivo claro para voltar.'],birthdays:['RELACIONAMENTO','O dia é deles.|O carinho é seu.','Prepare uma surpresa que transforma uma data especial em uma nova visita.'],reviews:['REPUTAÇÃO','Sua boa experiência|merece ser vista.','Convide seus clientes a compartilhar uma avaliação sincera no Google.'],surveys:['ESCUTA','Boas decisões|começam ouvindo.','Transforme a experiência de cada visita em melhorias para o seu negócio.'],page:['SUA VITRINE','Seu negócio.|Em um único lugar.','Cartão, cardápio, catálogo e contato em uma página que cabe no bolso.'],staff:['SUA EQUIPE','Quem recebe bem,|fideliza.','Organize os acessos de quem cuida dos seus clientes todos os dias.'],locations:['SUAS FILIAIS','Uma marca.|Muitos encontros.','Acompanhe cada unidade sem perder a visão do negócio.'],app:['EXPERIÊNCIA MOBILE','Veja seu negócio|nas mãos do cliente.','Explore as telas no iPhone e ajuste cada detalhe da experiência.'],billing:['SEU PLANO','Espaço para|o seu negócio crescer.','Acompanhe seu plano, limites e opções de pagamento com clareza.'],settings:['SUA IDENTIDADE','Cada detalhe|fala da sua marca.','Personalize seu negócio, preferências e informações dos clientes.'],scan:['ATENDIMENTO','Uma visita.|Um carimbo.','Leia o QR Code do cliente para registrar a visita com agilidade.'],integrations:['CONEXÕES','Seu negócio,|trabalhando junto.','Conecte seus sistemas e acompanhe as entregas em um só lugar.'],admin:['PLATAFORMA','Uma operação|que você enxerga.','Negócios, acessos e ferramentas organizados para agir com segurança.'],ext:['FERRAMENTAS','Mais possibilidades|para sua operação.','Acesse as ferramentas conectadas ao seu negócio.']};
 // telas do menu que ficam dentro de "Sua vitrine": mesmo título em duas linhas das demais e sem o link "Voltar"
 const copyPattern={'/page/catalog':['SUA VITRINE','Seus produtos.|Sempre à vista.','Mostre seus produtos com foto, descrição e preço na página do cliente.'],'/page/add':['SUA VITRINE','Mais uma peça.|Na sua página.','Escolha o que entra na página do cliente: contatos, links, avaliações, cardápio e mais.']};
 // botões do título ficam dentro de uma caixa (como "Seus catálogos"): texto à esquerda, botões à direita
 const boxCopy={'/cards':['Seus cartões','Crie um cartão novo ou ajuste os que já estão no ar.'],'/locations':['Suas unidades','Cadastre outra filial para acompanhar os números de cada uma.'],'/locations/:id':['Esta unidade','Edite os dados, desative ou use esta filial neste aparelho.']};
 const actionBox=(pattern,buttons)=>{if(!String(buttons).trim())return '';const c=boxCopy[pattern]||['Ações',''];return `<div class="card act-box"><div class="act-copy"><b>${E(c[0])}</b>${c[1]?`<span>${E(c[1])}</span>`:''}</div><div class="sv2-actions">${buttons}</div></div>`};
 const stats=(items)=>`<div class="sv2-stats">${items.map(([name,value],i)=>`<div><span>${E(name)}</span><b data-dv2-number="${value}" data-number-key="${location.hash.split('?')[0]}-${i}" aria-label="${value}">${value}</b></div>`).join('')}</div>`;
 function overview(family){const s=CF.state;
  switch(family){case 'cards':return stats([['Cartões criados',s.cards.length],['Cartões ativos',s.cards.filter(c=>c.active).length],['Clientes no programa',s.customers.length]]);
   case 'campaigns':return stats([['Campanhas criadas',s.campaigns.length],['Clientes no programa',s.customers.length],['Modelos disponíveis',8]]);
   case 'staff':return stats([['Pessoas na equipe',(s.staff||[]).length],['Clientes no programa',s.customers.length]]);
   case 'locations':return '';
   case 'surveys':return stats([['Pesquisas criadas',(s.surveys||[]).length],['Respostas recebidas',(s.surveys||[]).reduce((n,x)=>n+(x.responses||[]).length,0)]]);
   default:return '';
  }
 }
 function collection(){const P=window.CFPremium,b=CF.state.biz,c=CF.card();return `<section class="sv2-collection"><div class="sv2-section-head"><div><span class="sv2-kicker">COLEÇÃO DE DESIGN</span><h2>Escolha uma personalidade.</h2><p>12 composições. Muito além de trocar a cor.</p></div><span class="sv2-label">Personalizáveis</span></div><div class="sv2-designs">${Object.entries(CF.cardV2Collection).map(([kind,name],i)=>{const p=CF.cardV2Palette[kind],design={tpl:kind,c1:p[0],c2:p[2],paper:'#ffffff',t1:name,t2:i%2?'CLUB':'FIDELIDADE',headline:'Junte {n} carimbos e celebre com a gente.',footer:'FEITO PARA QUEM SEMPRE VOLTA',infoOn:false};return `<a class="sv2-design" href="#/cards/${E(c.id)}?design=${kind}"><div class="sv2-design-card">${P.render({card:{...c,name:b.name,design},filled:3,logo:b.logo,fluid:true})}</div><div class="sv2-design-caption"><b>${E(name)}</b><span>Personalizar ${I('arrow-right','sm')}</span></div></a>`}).join('')}</div></section>`}
 // título em duas linhas (padrão): linha de cima em destaque, linha de baixo em cursiva amarela
 const two=t=>{const [a,b]=String(t).split('|');return b?`${E(a)}<br><em>${E(b)}</em>`:E(a)};
 function decorate(page,pattern){const family=pattern.split('/')[1],text=copyPattern[pattern]||copy[family]||copy.ext,root=pattern.replace(/[:/]/g,'-');const menu=!!copyPattern[pattern],listing=pattern==='/'+family||menu;
  let body=page.html||'';
  if(pattern==='/cards/:id')body=body.replace('Tamanho do cartão','Design do cartão').replace('Escolha o formato. O Compacto é o padrão; os outros são maiores e mais ilustrados.','Escolha uma composição e personalize os detalhes abaixo.');
  body=body.replace(/href="preview.html"/g,`href="preview.html${window.CF_DASHBOARD_V2_PREVIEW?'?preview=1':''}"`);
  if(pattern==='/cards'&&CF.card())body=body+collection();
  const hero=`<header class="sv2-heading">${page.back&&!menu?`<a class="sv2-back" href="#${E(page.back)}">${I('arrow-left','sm')} Voltar</a>`:''}<div class="sv2-heading-row"><div><span class="sv2-kicker">${text[0]}</span><h1>${listing?two(text[1]):page.title}</h1><p>${E(String(listing?text[2]:page.sub||text[2]).replace(/<[^>]*>/g,''))}</p></div>${actionBox(pattern,`${page.actions||''}${pattern==='/cards'?`<a class="btn primary" href="#/cards/new">${I('plus','sm')}Criar cartão</a>`:''}`)}</div></header>`;
  return {...page,noHead:true,html:`<div class="sv2-page sv2-${family}" data-v2-screen="${root}">${hero}${listing?overview(family):''}<div class="sv2-body">${body}</div></div>`,mount(view){const native=page.mount&&page.mount(view);
   const setPalette=kind=>{const pal=CF.cardV2Palette[kind];if(!pal)return;[['c1',pal[0]],['c2',pal[2]]].forEach(([k,v])=>{const el=view.querySelector(`[data-d="${k}"]`);if(el){el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}))}});const font=['ticket','noir'].includes(kind)?'condensed':['studio','sunrise','passport'].includes(kind)?'modern':'classic';const fb=view.querySelector(`[data-set="font:${font}"]`);if(fb)fb.click();};
   if(pattern==='/cards/:id')view.addEventListener('click',e=>{const b=e.target.closest('[data-set]');if(b&&b.dataset.set.startsWith('tpl:'))setPalette(b.dataset.set.slice(4));});
   const selected=new URLSearchParams(location.hash.split('?')[1]||'').get('design');
   if(pattern==='/cards/:id'&&selected&&Object.prototype.hasOwnProperty.call(CF.cardV2Collection,selected)){
    const b=view.querySelector(`[data-set="tpl:${selected}"]`);if(b)b.click();
    setPalette(selected);
   }
   const prettify=()=>{
    view.querySelectorAll('#cd-sizes .pm-thumb>b').forEach(b=>{if(b.textContent.endsWith(' · padrão'))b.textContent=b.textContent.slice(0,-9)});
    const host=view.querySelector('#cd-prev');if(host&&host.firstElementChild&&!host.querySelector('.device-png')){const content=host.innerHTML;host.innerHTML=CF.device(`<div class="sv2-wallet-screen"><div class="sv2-wallet-label">Seu cartão fidelidade</div>${content}<div class="sv2-wallet-note">Cada visita aproxima você de uma recompensa.</div></div>`,{width:280,model:'iphone-15-pro'});}
    view.querySelectorAll('.stats .stat b,.kpi b,.metrics .metric b').forEach((el,i)=>{if(el.dataset.dv2Number)return;const n=el.textContent.trim();if(/^\d+$/.test(n)){el.dataset.dv2Number=n;el.dataset.numberKey=root+'-native-'+i;el.setAttribute('aria-label',n);}});
   };
   prettify();const obs=new MutationObserver(prettify);obs.observe(view,{childList:true,subtree:true});const stop=CF.animateV2Stats?CF.animateV2Stats(view):()=>{};
   return()=>{obs.disconnect();stop();if(typeof native==='function')native();};
  }};
 }
 CF.route=(pattern,handler)=>register(pattern,params=>decorate(handler(params)||{},pattern));
 if(window.CF_DASHBOARD_V2_PREVIEW&&CF.state.cards[0])CF.state.cards[0].design={tpl:'editorial',sector:'cafe',sicon:'coffee',font:'classic',c1:'#fff9eb',c2:'#a83f23',t1:'Sua pausa',t2:'favorita.',headline:'Junte {n} carimbos. O próximo café é por nossa conta.',infoOn:false,footer:'CAFÉ DA ESQUINA · CLUBE FIEL'};
})();
