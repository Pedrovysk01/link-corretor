/* Acesso v2: composição visual independente, preservando os formulários e eventos de autenticação existentes. */
(function () {
 'use strict';
 const preview=!window.CF_DASHBOARD_V2_PREVIEW&&new URLSearchParams(location.search).get('preview')==='1';
 const esc=window.CF.esc;
 const icon=(name)=>`<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${name==='eye'?'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z':name==='arrow'?'M5 12h14m-6-6 6 6-6 6':name==='coffee'?'M5 8h12v8a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8Zm12 1h2a3 3 0 0 1 0 6h-2M8 2v3m5-3v3':'m5 12 4 4L19 6'}"/></svg>`;
 let activeForm=null;
 function enhance(){
  const form=document.querySelector('#lg,#np');
  if(!form){activeForm=null;return;}
  if(form.dataset.accessV2){syncMode(form);return;}
  activeForm=form;form.dataset.accessV2='true';
  form.removeAttribute('style');form.className='av2-form';
  const oldIntro=form.querySelector('.center');
  const subtitle=form.querySelector('#lg-sub')||oldIntro?.querySelector('p');
  if(subtitle){subtitle.className='av2-subtitle';subtitle.removeAttribute('style');form.prepend(subtitle);}
  oldIntro?.remove();
  const title=document.createElement('h1');title.className='av2-title';title.dataset.av2Title='';form.prepend(title);
  const eyebrow=document.createElement('span');eyebrow.className='av2-eyebrow';eyebrow.textContent='SEU NEGÓCIO. SEU ESPAÇO.';form.prepend(eyebrow);
  form.querySelectorAll('input').forEach(input=>{input.classList.add('av2-input');input.removeAttribute('autofocus')});
  form.querySelectorAll('input[type="password"]').forEach(input=>{
   const wrapper=document.createElement('div');wrapper.className='av2-password';input.before(wrapper);wrapper.append(input);
   const toggle=document.createElement('button');toggle.type='button';toggle.className='av2-password-toggle';toggle.setAttribute('aria-label','Mostrar senha');toggle.setAttribute('aria-pressed','false');toggle.setAttribute('aria-controls',input.id);toggle.innerHTML=icon('eye');wrapper.append(toggle);
   toggle.addEventListener('click',()=>{const show=input.type==='password';input.type=show?'text':'password';toggle.setAttribute('aria-label',show?'Ocultar senha':'Mostrar senha');toggle.setAttribute('aria-pressed',String(show))});
  });
  const root=document.createElement('div');root.className='av2-screen';
  root.innerHTML=`<aside class="av2-story" aria-label="Seu Cliente Fiel"><a class="av2-story-logo" href="/v2/" aria-label="Voltar ao site"><img src="assets/img/seucliente-logo-branco.svg" alt="Seu Cliente Fiel" width="156" height="58"></a><div class="av2-story-copy"><span class="av2-eyebrow">PARA QUEM FAZ O BAIRRO ACONTECER.</span><h2>Hoje, mais<br>um cliente.<br>Amanhã,<br><em>um de sempre.</em></h2><p>Um lugar para cuidar de cada visita.<br>E criar motivos para a próxima.</p></div><div class="av2-mini-card" aria-label="Exemplo ilustrativo de cartão"><div><span class="av2-coffee-circle">${icon('coffee')}</span><span>Café da Esquina<small>EXEMPLO DE CARTÃO</small></span><b>3 / 8</b></div><div class="av2-mini-stamps">${Array.from({length:8},(_,i)=>`<span class="${i<3?'av2-filled':''}${i===7?' av2-prize':''}">${i<3?icon('coffee'):i===7?'✳':i+1}</span>`).join('')}</div><p>Na 8ª visita, um café por nossa conta.</p></div><span class="av2-story-bottom">DO SEU BALCÃO. PARA O DIA A DIA DELES.</span></aside><main class="av2-main"><header class="av2-top"><a class="av2-back" href="/">← Voltar ao site</a><img class="av2-mobile-logo" src="assets/img/seucliente-logo.svg" alt="Seu Cliente Fiel" width="132" height="52"></header><div class="av2-form-area">${preview?'<div class="av2-preview-note" role="note">Prévia de design. Nenhuma conta será criada.</div>':''}<div class="av2-form-slot"></div><p class="av2-safe-note">${icon('check')}Seu negócio no seu ritmo. Sem complicação.</p></div><footer class="av2-footer"><span>© 2026 Seu Cliente Fiel</span><nav aria-label="Informações legais"><a href="/v2/privacidade/">Privacidade</a><a href="/v2/termos/">Termos</a><a href="/v2/contato/">Ajuda</a></nav></footer></main>`;
  root.querySelector('.av2-form-slot').append(form);
  const oldShell=document.querySelector('body > .app');
  if(oldShell)oldShell.replaceWith(root);else document.body.prepend(root);
  const email=form.querySelector('#lg-e');if(email)email.placeholder='voce@seunegocio.com.br';
  const password=form.querySelector('#lg-p,#np-p');if(password)password.placeholder='Sua senha';
  form.querySelectorAll('.alert').forEach(alert=>{alert.removeAttribute('style');alert.classList.add('av2-alert')});
  const forgot=form.querySelector('#lg-fg');if(forgot)forgot.removeAttribute('style');
  const terms=form.querySelector('#lg-terms');if(terms)terms.removeAttribute('style');
  syncMode(form);
 }
 function syncMode(form){
  const recovery=form.id==='np',signup=!recovery&&!form.querySelector('#lg-terms').classList.contains('hide');
  const title=form.querySelector('[data-av2-title]');
  const text=recovery?'Um novo começo.':signup?'Vamos abrir as portas?':'Bom ter você de volta.';
  const button=form.querySelector('#lg-ok,#np-ok');if(button&&button.className!=='av2-submit')button.className='av2-submit';
  const current=recovery?'recovery':signup?'signup':'login';
  if(form.dataset.av2Mode!==current){form.dataset.av2Mode=current;title.textContent=text;}
 }
 const observer=new MutationObserver(()=>{if(activeForm&&!activeForm.isConnected)activeForm=null;enhance()});
 observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
 enhance();
 // Preview is explicitly local. The regular version uses the shared authentication without overrides.
 if(preview){
  window.CF_SUPABASE=null;
  let signup=new URLSearchParams(location.search).get('criar')==='1';
  function renderPassword(message){
   document.body.innerHTML=`<div class="app"><form id="np"><div class="center"><p>Escolha a nova senha da sua conta.</p></div><div class="field"><label for="np-p">Senha nova</label><input class="input" id="np-p" type="password" required minlength="6" autocomplete="new-password"></div>${message?`<div class="alert av2-preview-feedback" role="status">${esc(message)}</div>`:''}<button id="np-ok">Salvar senha e entrar</button><a class="link-btn" href="acesso-v2.html?preview=1">Voltar para entrar</a></form></div>`;
   document.querySelector('#np').addEventListener('submit',e=>{e.preventDefault();renderPassword('Esta é uma prévia. Nenhum acesso ou cadastro foi enviado.')});enhance();
  }
  function renderPreview(message){
   const trial=CF.config.trialDays,free=CF.config.freeClientLimit;
   document.body.innerHTML=`<div class="app"><form id="lg"><div class="center"><p id="lg-sub">${signup?'Crie sua conta e monte o cartão do seu negócio.':'Entre para gerenciar seu cartão fidelidade.'}</p></div><div id="lg-claim" class="hide"></div><div class="field"><label for="lg-e">E-mail</label><input class="input" id="lg-e" type="email" required autocomplete="username"></div><div class="field"><label for="lg-p">Senha</label><input class="input" id="lg-p" type="password" required minlength="6" autocomplete="${signup?'new-password':'current-password'}"><button type="button" id="lg-fg" class="link-btn small${signup?' hide':''}">Esqueci minha senha</button></div><div class="field${signup?'':' hide'}" id="lg-nf"><label for="lg-n">Nome do seu negócio</label><input class="input" id="lg-n" placeholder="Ex.: Café da Praça"></div>${message?`<div class="alert av2-preview-feedback" role="status">${esc(message)}</div>`:''}<button id="lg-ok">${signup?'Criar conta':'Entrar'}</button><p class="small muted${signup?'':' hide'}" id="lg-terms">${trial} dias com tudo do Pro, sem cartão de crédito. Depois, o plano Free segue grátis com até ${free} clientes. Ao criar a conta, você aceita os <a href="/v2/termos/">Termos de uso</a> e a <a href="/v2/privacidade/">Política de Privacidade</a>.</p><button type="button" class="link-btn" id="lg-sw">${signup?'Já tem conta? Entrar':'Não tem conta? Criar conta'}</button></form></div>`;
   document.querySelector('#lg-sw').addEventListener('click',()=>{signup=!signup;renderPreview()});
   document.querySelector('#lg-fg').addEventListener('click',()=>renderPreview('Esta é uma prévia. Nenhum e-mail de recuperação será enviado.'));
   document.querySelector('#lg').addEventListener('submit',event=>{event.preventDefault();renderPreview('Esta é uma prévia. Nenhum acesso ou cadastro foi enviado.')});
   enhance();
  }
  CF.boot=()=>new URLSearchParams(location.search).get('senha')==='1'?renderPassword():renderPreview();
 }
})();
