/* Versão v2: demonstração local, sem alterar contas reais. */
(function(){
 'use strict';
 const $=(s)=>document.querySelector(s);
 const $$=(s)=>Array.from(document.querySelectorAll(s));
 const settings={
  cafe:{name:'Café da Esquina',subtitle:'A sua pausa favorita.',reward:'Na 8ª visita, um café por nossa conta.',icon:'M5 8h12v8a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8Zm12 1h2a3 3 0 0 1 0 6h-2M8 2v3m5-3v3'},
  barber:{name:'Barbearia do Bairro',subtitle:'O seu estilo, de sempre.',reward:'No 8º corte, uma hidratação por nossa conta.',icon:'M9 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm0 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM8 9l13 12M8 15 21 3'},
  pet:{name:'Pet & Cuidado',subtitle:'Carinho em cada visita.',reward:'No 8º banho, uma hidratação por nossa conta.',icon:'M8 14c-2 2-3 4-1 6 2 1 3-1 5-1s3 2 5 1c2-2 1-4-1-6-2-3-6-3-8 0ZM7 7a2 3 0 1 1-4 0 2 3 0 0 1 4 0Zm7-3a2 3 0 1 1-4 0 2 3 0 0 1 4 0Zm7 3a2 3 0 1 1-4 0 2 3 0 0 1 4 0Z'}
 };
 // eventos para anúncios/métricas (mesmos nomes da home anterior): só disparam quando o consentimento liberar as tags
 const sent={};const track=(event,extra)=>{if(sent[event])return;sent[event]=1;try{(window.dataLayer=window.dataLayer||[]).push(Object.assign({event},extra||{}))}catch(e){}};
 let count=3;
 const visit=$('[data-v2-visit]');
 function renderCard(){
  $$('[data-v2-card] .v2-stamp').forEach((stamp,i)=>stamp.classList.toggle('is-filled',i<count));
  $('[data-v2-count]').textContent=count+' / 8';
  $('[data-v2-feedback]').textContent=count===8?'Recompensa liberada! Este é um exemplo do cartão completo.':'Faltam '+(8-count)+' carimbos para a recompensa.';
  visit.innerHTML=count===8?'Recomeçar exemplo ↶':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v16M4 12h16"/></svg>Simular uma visita';
 }
 visit.addEventListener('click',()=>{track('demo_start');count=count===8?0:count+1;renderCard()});
 $$('[data-v2-segment]').forEach(button=>button.addEventListener('click',()=>{
  const data=settings[button.dataset.v2Segment];
  $$('[data-v2-segment]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  $('[data-v2-business]').textContent=data.name;
  $('[data-v2-subtitle]').textContent=data.subtitle;
  $('[data-v2-reward]').textContent=data.reward;
  $('[data-v2-icon] path').setAttribute('d',data.icon);
  $$('.v2-stamp:not(.is-prize) path').forEach(path=>path.setAttribute('d',data.icon));
  count=3;renderCard();
 }));
 $$('[data-lp-wallet]').forEach(button=>button.addEventListener('click',()=>{const google=button.dataset.lpWallet==='google';$$('[data-lp-wallet]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));$('[data-lp-wallet-title]').textContent=google?'Google Wallet':'Carteira';}));
 const currency=(n)=>'R$ '+Math.round(n).toLocaleString('pt-BR');
 const inputs=[$('#v2-clients'),$('#v2-spend'),$('#v2-visits')];
 function calculate(){
  const [clients,spend,visits]=inputs.map(input=>Number(input.value));
  const visitsLabel=visits.toLocaleString('pt-BR');
  $('#v2-clients-value').textContent=clients.toLocaleString('pt-BR');$('#v2-spend-value').textContent=currency(spend);$('#v2-visits-value').textContent=visitsLabel;
  $('#v2-total').textContent=currency(clients*spend*visits);
  $('#v2-formula').textContent=clients.toLocaleString('pt-BR')+' clientes × '+currency(spend)+' × '+visitsLabel+' visita'+(visits===1?'':'s')+' extra'+(visits===1?'':'s');
  inputs.forEach(input=>input.style.setProperty('--range-progress',((input.value-input.min)/(input.max-input.min)*100)+'%'));
 }
 inputs.forEach(input=>input.addEventListener('input',()=>{track('calc_use');calculate()}));calculate();
 // Price values are embedded in the page's central configuration, not duplicated here.
 const monthly=Number($('[data-v2-price]').textContent.replace(/[^0-9]/g,'')),yearly=Number($('[data-v2-price]').dataset.v2Annual)||monthly*12;
 $$('[data-v2-billing]').forEach(button=>button.addEventListener('click',()=>{
  const annual=button.dataset.v2Billing==='annual';
  $$('[data-v2-billing]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  $('[data-v2-price]').textContent=currency(annual?Math.round(yearly/12):monthly);
  $('[data-v2-price-note]').textContent=annual?currency(yearly)+' por ano, pagos de uma vez (12 meses).':'Cobrança mensal. Cancele quando quiser.';
 }));
 const menuButton=$('.v2-menu-button'),menu=$('#v2-mobile-menu');
 function setMenu(open){menu.hidden=!open;menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Fechar menu':'Abrir menu')}
 menuButton.addEventListener('click',()=>setMenu(menu.hidden));
 $$('#v2-mobile-menu a').forEach(link=>link.addEventListener('click',()=>setMenu(false)));
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!menu.hidden){setMenu(false);menuButton.focus()}});
 const sticky=$('[data-v2-sticky]');let dismissed=false;
 try{dismissed=sessionStorage.getItem('cf_v2_sticky_closed')==='1'}catch{}
 const updateSticky=()=>{sticky.hidden=dismissed||window.scrollY<700||window.innerWidth>650;if(window.scrollY+window.innerHeight>=document.documentElement.scrollHeight*0.5)track('scroll_depth',{depth:50})};
 $('[data-v2-close]').addEventListener('click',()=>{dismissed=true;try{sessionStorage.setItem('cf_v2_sticky_closed','1')}catch{}updateSticky()});
 window.addEventListener('scroll',updateSticky,{passive:true});window.addEventListener('resize',updateSticky);updateSticky();
})();
