/* Segunda tela v2: visão geral. Usa as ações e o estado do painel existente. */
(function(){
 'use strict';
 const CF=window.CF,I=CF.icon,E=CF.esc;
 const preview=new URLSearchParams(location.search).get('preview')==='1'&&!/acesso-v2\.html$/.test(location.pathname);   // painel principal em modo prévia (a tela de entrada tem a prévia própria, em access-v2.js)
 let filter='near',search='';
 const lastNumbers=new Map();
 CF.animateV2Stats=(view)=>{
   const ownRoute=(location.hash||'#/').slice(1).split('?')[0];
   const frames=new Set();
   const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
   view.querySelectorAll('[data-dv2-number]').forEach(number=>{
    const target=Number(number.dataset.dv2Number),key=number.dataset.numberKey;
    const from=lastNumbers.get(key)||0;lastNumbers.set(key,target);
    if(reduced||target===from)return;
    const started=performance.now(),duration=850;
    number.classList.add('dv2-counting');
    const tick=now=>{
     if(!number.isConnected)return;
     const progress=Math.min(1,(now-started)/duration),eased=1-Math.pow(1-progress,3);
     number.textContent=Math.round(from+(target-from)*eased).toLocaleString(CF.locale());
     if(progress<1){const id=requestAnimationFrame(time=>{frames.delete(id);tick(time)});frames.add(id);}
     else{number.textContent=target.toLocaleString(CF.locale());number.classList.remove('dv2-counting');}
    };
    tick(started);
   });
   return ()=>{
    frames.forEach(cancelAnimationFrame);frames.clear();
    if((location.hash||'#/').slice(1).split('?')[0]!==ownRoute)lastNumbers.clear();
   };
 };

 if(preview){
  // Isola a demonstração: nem persistência local do negócio, nem escrita no servidor.
  CF.save=()=>true;CF.saveNow=async()=>{};CF.resetDemo();
  const ago=days=>new Date(Date.now()-days*864e5).toISOString();
  CF.state.user={name:'Marina',email:'marina@exemplo.com'};
  Object.assign(CF.state.biz,{name:'Café da Esquina',type:'Cafeteria',slug:'cafe-da-esquina',tagline:'A sua pausa favorita.',logo:'assets/img/demo-cafe-v2.svg',cover:null});
  Object.assign(CF.state.cards[0],{name:'Café da Esquina',rewardLabel:'Um café especial',rewardText:'Junte 8 carimbos e ganhe um café especial',theme:'cafe',design:{},active:true});
  CF.state.onboarding={installed:true,stamped:true,app:false,shared:false};
  CF.state.customers=[
   {id:'demo-ana',name:'Ana Oliveira',stamps:7,total:15,last:ago(0),created:ago(20),phone:'',email:'',history:[{kind:'stamp',qty:1,at:ago(0)}]},
   {id:'demo-pedro',name:'Pedro Santos',stamps:6,total:14,last:ago(2),created:ago(35),phone:'',email:'',history:[{kind:'stamp',qty:1,at:ago(2)}]},
   {id:'demo-luiza',name:'Luiza Costa',stamps:8,total:8,last:ago(1),created:ago(15),phone:'',email:'',history:[{kind:'stamp',qty:1,at:ago(1)}]},
   {id:'demo-rafa',name:'Rafael Lima',stamps:3,total:3,last:ago(36),created:ago(45),phone:'',email:'',history:[{kind:'stamp',qty:1,at:ago(36)}]},
   {id:'demo-julia',name:'Júlia Souza',stamps:2,total:2,last:ago(42),created:ago(60),phone:'',email:'',history:[{kind:'stamp',qty:1,at:ago(42)}]},
   {id:'demo-bruno',name:'Bruno Alves',stamps:1,total:1,last:ago(0),created:ago(0),phone:'',email:'',history:[{kind:'stamp',qty:1,at:ago(0)}]},
  ];
  CF.state.totals={stamps:43,redeemed:2};
  CF.state.requests=[{id:'demo-request',customerId:'demo-bruno',kind:'receipt',qty:1,created:ago(0)}];
  CF.state.surveys=[{id:'demo-survey',title:'Como foi sua visita?',status:'active',created:ago(7),sent:0,questions:[{text:'Como foi sua visita?',kind:'stars',required:true},{text:'Gostaria de acrescentar algo?',kind:'text',required:false}],responses:[{customer:'Ana Oliveira',rating:5,text:'Adorei o atendimento.',date:ago(1)},{customer:'Pedro Santos',rating:4,text:'Meu café favorito.',date:ago(2)}]}];
  CF.publicUrl=src=>CF.withSrc(location.origin+'/app/c/?preview=1&s='+encodeURIComponent(CF.state.biz.slug),src);
  // data.js will see no configuration and keep this demonstration entirely local.
  window.CF_DASHBOARD_V2_PREVIEW=true;
 }
 const button=(text,attr='',primary=false)=>`<button type="button" class="dv2-button${primary?' dv2-primary':''}" ${attr}>${text}${I('arrow-right')}</button>`;
 const link=(text,href,primary=false)=>`<a class="dv2-button${primary?' dv2-primary':''}" href="${E(href)}">${text}${I('arrow-right')}</a>`;
 const validDate=value=>value&&Number.isFinite(new Date(value).getTime());
 const daysSince=c=>validDate(c.last)?Math.max(0,Math.floor((Date.now()-new Date(c.last))/864e5)):null;
 const near=(c,card)=>card&&card.stamps-c.stamps>0&&card.stamps-c.stamps<=2;
 const absent=c=>daysSince(c)!==null&&daysSince(c)>=30;
 const ageLabel=c=>daysSince(c)===0?'Visitou hoje':daysSince(c)===null?'Ainda sem visita':`Há ${daysSince(c)} dias sem visitar`;
 const row=(c,card)=>{
  const target=card?.stamps||8,full=c.stamps>=target;
  return `<div class="dv2-client-row"><span class="dv2-avatar">${E(CF.initial(c.name))}</span><div class="dv2-client-name"><b>${E(c.name)}</b><span>${full?'Recompensa disponível':near(c,card)?`${target-c.stamps} carimbos para o prêmio`:E(ageLabel(c))}</span></div><div class="dv2-client-progress"><b>${c.stamps} <span>/ ${target}</span></b><div><i style="width:${Math.min(100,c.stamps/target*100)}%"></i></div></div>${full?`<a class="dv2-row-action" href="#/customers?f=reward" aria-label="Ver recompensa de ${E(c.name)}">${I('gift')}</a>`:`<button class="dv2-row-action" type="button" data-act="give-stamp" data-id="${E(c.id)}" aria-label="Dar carimbo para ${E(c.name)}">${I('plus')}</button>`}</div>`;
 };
 const customersBlock=()=>{
  const card=CF.card(),all=CF.state.customers;
  let selected=all.filter(c=>filter==='all'||filter==='near'&&near(c,card)||filter==='absent'&&absent(c));
  if(search)selected=selected.filter(c=>CF.norm(c.name+' '+(c.phone||'')+' '+(c.code||'')).includes(CF.norm(search)));
  const items=selected.slice(0,5);
  return items.length?items.map(c=>row(c,card)).join(''):`<div class="dv2-empty">${I('users')}<b>${search?'Nenhum cliente encontrado.':filter==='near'?'Ninguém perto do prêmio por enquanto.':filter==='absent'?'Nenhum cliente sem visitar há 30 dias.':'Seu primeiro cliente começa aqui.'}</b><p>${search?'Tente outro nome, telefone ou código.':'Compartilhe o QR do seu cartão no balcão.'}</p>${!all.length?'<a href="#/page/share">Compartilhar cartão →</a>':''}</div>`;
 };
 CF.route('/',()=>{
  const s=CF.state,card=CF.card(),customers=s.customers||[],requests=(s.requests||[]).length;
  const active=s.cards.some(c=>c.active),isPrepared=CF.isPreview&&CF.isPreview(),pending=card?customers.filter(c=>c.stamps>=card.stamps).length:0,risk=customers.filter(absent).length;
  const steps=[{done:active,t:'Crie um cartão de fidelidade',href:'#/cards'},{done:s.onboarding.installed,t:'Instale o cartão no seu celular',act:'install-card'},{done:s.onboarding.stamped,t:'Dê um carimbo para você',act:'give-stamp'},{done:s.onboarding.app,t:'Veja como seu cartão aparece no celular do cliente',href:'#/app'},{done:s.onboarding.shared,t:'Compartilhe sua página para que os clientes recebam o cartão',href:'#/page/share'}];
  const complete=steps.filter(x=>x.done).length,tr=CF.trial(),limit=CF.clientLimit();
  const recent=customers.filter(c=>validDate(c.last)).sort((a,b)=>new Date(b.last)-new Date(a.last)).slice(0,4);
  const date=new Intl.DateTimeFormat(CF.locale(),{day:'numeric',month:'long',timeZone:s.biz.tz||'America/Sao_Paulo'}).format(new Date());
  const stat=(name,n,ic,href,tag='')=>`<a class="dv2-stat ${tag}" href="${href}"><div><span>${name}</span>${I(ic)}</div><b data-dv2-number="${Number(n||0)}" data-number-key="${E(name)}" aria-label="${Number(n||0).toLocaleString(CF.locale())}">${Number(n||0).toLocaleString(CF.locale())}</b><small>${name==='Recompensas disponíveis'?'Prontas para resgatar':'Total acumulado'}</small></a>`;
  const AL=CF.dashAlerts?CF.dashAlerts():{preview:'',trial:'',wa:''};
  return {title:'Painel',nav:'dash',noHead:true,html:`<div class="dv2-dashboard">
   ${AL.preview}${AL.trial}
   ${preview?'<div class="dv2-demo-note"><span><i></i>Prévia · dados de exemplo</span><span>As ações não alteram o seu negócio.</span></div>':''}
   <header class="dv2-heading"><div><span class="dv2-eyebrow">O SEU BALCÃO, EM DIA.</span><h1>Seu negócio.<br><em>Boas próximas visitas.</em></h1><p>${E(s.biz.name)} <span>·</span> ${E(date)}</p></div><div class="card act-box"><div class="act-copy"><b>${card?'Atendimento rápido':'Comece pelo cartão'}</b><span>${card?'Dê um carimbo agora ou abra o leitor para ler o QR do cartão do cliente.':'Crie o primeiro cartão de fidelidade para começar a carimbar.'}</span></div><div class="dv2-heading-actions">${card?button('Dar carimbo','data-act="give-stamp"',true):link('Criar cartão','#/cards/new',true)}<a class="dv2-icon-button" href="#/scan" aria-label="Carimbar com a câmera">${I('qr')}</a></div></div></header>
   ${isPrepared?`<div class="dv2-alert"><b>Sua página está em prévia.</b><span>Ative para liberar o cadastro de clientes.</span>${button('Ativar minha página','data-act="activate-page"',true)}</div>`:!tr.paid&&(tr.ended||tr.active&&tr.left<=5)?`<div class="dv2-alert"><b>${tr.ended?'Seu teste grátis acabou.':`Seu teste termina em ${tr.left} dias.`}</b><span>O Free aceita até ${CF.config.freeClientLimit} clientes. Quem já entrou continua no cartão.${customers.length>=CF.config.freeClientLimit?' Novos clientes dependem da assinatura do Pro.':''}</span><a href="#/billing">Ver planos →</a></div>`:''}
   <div class="dv2-stats" aria-label="Resumo do negócio">${stat('Clientes com cartão',customers.length,'users','#/customers','dv2-stat-featured')}${stat('Carimbos concedidos',s.totals.stamps,'check','#/customers')}${stat('Recompensas resgatadas',s.totals.redeemed,'gift','#/customers')}${stat('Recompensas disponíveis',pending,'star','#/customers?f=reward')}</div>
   <div class="dv2-columns"><div class="dv2-main-column">
    <section class="dv2-panel dv2-attention"><header class="dv2-panel-head"><div><span class="dv2-eyebrow">O QUE PEDE UM OLHAR HOJE</span><h2>Merece sua atenção.</h2></div><span class="dv2-count-pill">${requests+pending+risk}</span></header><div class="dv2-attention-list">
     <a href="#/customers?f=requests"><span class="dv2-attention-icon">${I('bell')}</span><div><b>Pedidos de carimbo</b><span>${requests?'Confira os comprovantes e pedidos de boas-vindas.':'Tudo em dia. Nenhum pedido aguardando.'}</span></div><strong>${requests}</strong>${I('arrow-right')}</a>
     <a href="#/customers?f=reward"><span class="dv2-attention-icon">${I('gift')}</span><div><b>Recompensas no balcão</b><span>${pending?'Clientes que completaram o cartão.':'Nenhuma recompensa pendente.'}</span></div><strong>${pending}</strong>${I('arrow-right')}</a>
     <a href="#/campaigns/quick/winback"><span class="dv2-attention-icon">${I('refresh')}</span><div><b>Hora de se reaproximar</b><span>Clientes sem visitar há 30 dias.</span></div><strong>${risk}</strong>${I('arrow-right')}</a>
    </div></section>
    <section class="dv2-panel dv2-customers"><header class="dv2-panel-head"><div><span class="dv2-eyebrow">A PRÓXIMA VISITA TEM NOME</span><h2>Clientes para acompanhar.</h2></div><a class="dv2-small-link" href="#/customers">Ver todos ${I('arrow-right')}</a></header><div class="dv2-customer-toolbar"><div class="dv2-tabs" role="group" aria-label="Filtrar clientes"><button type="button" data-dv2-filter="near" aria-pressed="${filter==='near'}">Perto do prêmio</button><button type="button" data-dv2-filter="absent" aria-pressed="${filter==='absent'}">Sem visitar</button><button type="button" data-dv2-filter="all" aria-pressed="${filter==='all'}">Todos</button></div><label class="dv2-search">${I('search')}<input type="search" id="dv2-search" placeholder="Buscar cliente" aria-label="Buscar cliente pelo nome, telefone ou código" value="${E(search)}"></label></div><div id="dv2-client-list" aria-live="polite">${customersBlock()}</div><footer class="dv2-panel-footer">Dê um carimbo pelo nome, telefone ou código do cartão.</footer></section>
    <section class="dv2-panel dv2-recent"><header class="dv2-panel-head"><div><span class="dv2-eyebrow">GENTE QUE PASSOU POR AQUI</span><h2>Últimas visitas.</h2></div>${I('clock')}</header><div class="dv2-recent-list">${recent.length?recent.map(c=>`<a href="#/customers" class="dv2-visit"><span class="dv2-avatar">${E(CF.initial(c.name))}</span><div><b>${E(c.name)}</b><span>${c.stamps}/${card?.stamps||8} carimbos no cartão</span></div><time datetime="${E(c.last)}">${E(CF.fmtDate(c.last))}</time></a>`).join(''):'<p class="dv2-recent-empty">As primeiras visitas vão aparecer aqui.</p>'}</div></section>
   </div><aside class="dv2-side-column">
    <section class="dv2-card-panel"><header><span class="dv2-eyebrow">DO SEU BALCÃO PARA O CELULAR</span><span class="dv2-live-state ${active&&!isPrepared?'':'dv2-state-inactive'}"><i></i>${isPrepared?'Em prévia':active?'Cartão ativo':'Sem cartão ativo'}</span></header><h2>Um motivo<br>para voltar.</h2><div class="dv2-card-preview" data-no-i18n>${card?`<div class="dv2-real-card">${CF.walletCard({card,filled:Math.min(3,Math.max(0,card.stamps-1)),size:9,fluid:true,header:card.header,text:card.rewardText})}</div>`:'<p>Crie seu primeiro cartão de fidelidade.</p>'}</div><div class="dv2-card-actions">${link(active?'Compartilhar cartão':'Criar cartão',active?'#/app?sec=share':'#/cards/new',true)}<a class="dv2-small-link" href="${card?'#/cards/'+E(card.id):'#/cards'}">Personalizar cartão ${I('arrow-right')}</a></div></section>
    ${complete<steps.length?`<details class="dv2-setup"><summary><span><b>Primeiros passos</b><small>${complete} de ${steps.length} concluídos</small></span>${I('chevron-down')}</summary><div class="dv2-setup-progress"><i style="width:${complete/steps.length*100}%"></i></div><ol>${steps.map(st=>`<li class="${st.done?'is-done':''}"><span>${I(st.done?'check':'minus')}</span>${st.act?`<button type="button" data-act="${st.act}">${E(st.t)}</button>`:`<a href="${st.href}">${E(st.t)}</a>`}</li>`).join('')}</ol></details>`:''}
    <section class="dv2-campaign"><span class="dv2-eyebrow">A RELAÇÃO CONTINUA</span><h3>Faz tempo que<br>alguém não vem?</h3><p>Uma campanha com prazo pode dar um motivo para a próxima visita.</p>${link('Criar campanha','#/campaigns')}</section>
    <div class="dv2-plan-summary"><div><b>${tr.paid?'Plano Pro':tr.active?'Teste do Pro':'Plano Free'}</b><a href="#/billing">Ver plano ${I('arrow-right')}</a></div><p>${customers.length.toLocaleString(CF.locale())} de ${limit.toLocaleString(CF.locale())} clientes</p><div><i style="width:${Math.min(100,customers.length/limit*100)}%"></i></div>${tr.active?`<small>${tr.left} dias restantes no teste. Depois, Free até ${CF.config.freeClientLimit} clientes.</small>`:''}</div>
   </aside></div>${AL.wa?`<div class="dv2-wa">${AL.wa}</div>`:''}<footer class="dv2-page-footer"><span>Seu Cliente Fiel</span><a href="#/settings">Ajustes do seu negócio ${I('arrow-right')}</a></footer>
  </div>`,mount(view){
   const list=view.querySelector('#dv2-client-list'),input=view.querySelector('#dv2-search');
   view.querySelectorAll('[data-dv2-filter]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.dv2Filter;view.querySelectorAll('[data-dv2-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));list.innerHTML=customersBlock()}));
   input.addEventListener('input',()=>{search=input.value.trim();list.innerHTML=customersBlock()});
   return CF.animateV2Stats(view);
  }};
 });
})();
