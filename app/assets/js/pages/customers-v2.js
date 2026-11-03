/* Terceira tela v2. Recompõe a tela de Clientes mantendo as ações e regras existentes. */
(function(){
 'use strict';
 const CF=window.CF,I=CF.icon,E=CF.esc,register=CF.route;
 const FILTERS=[['all','Todos'],['reward','Com prêmio'],['none','Sem carimbos'],['inactive','Sem visita recente']];
 CF.route=(pattern,handler)=>{
  if(pattern!=='/customers')return register(pattern,handler);
  // Captura somente a rota de Clientes. As demais rotas seguem sem alteração.
  CF.route=register;
  register(pattern,(params)=>{
   if(!CF.card())return {title:'Clientes v2',nav:'customers',noHead:true,html:`<div class="cv2-customers"><header class="cv2-heading"><div><span class="cv2-eyebrow">GENTE QUE FAZ PARTE DO SEU NEGÓCIO</span><h1>Clientes</h1><p>Crie seu primeiro cartão de fidelidade.</p></div><div class="card act-box"><div class="act-copy"><b>Comece pelo cartão</b><span>Sem um cartão ativo ainda não dá para cadastrar nem carimbar clientes.</span></div><div class="cv2-heading-actions"><a class="cv2-button cv2-primary" href="#/cards/new">Criar cartão ${I('arrow-right')}</a></div></div></header></div>`};
   const page=handler(params),template=document.createElement('template');template.innerHTML=page.html;
   const stack=template.content.querySelector('.stack'),kpis=stack.querySelector('.cu-kpis');
   kpis.hidden=true;kpis.setAttribute('aria-hidden','true');
   const list=Array.from(stack.children).find(e=>e.matches('section.card:not(.req-sec)'));
   list.classList.add('cv2-list-panel');
   const tableHeader=list.querySelector('.card-h');
   tableHeader.innerHTML=`<div><span class="cv2-eyebrow">CADA VISITA TEM UMA HISTÓRIA</span><h2>Seus clientes.</h2></div><button type="button" class="cv2-small-action" data-act="add-customer">${I('user-plus')}Adicionar cliente</button>`;
   const visitors=stack.querySelector('#vis'),visitorsDetails=document.createElement('details');
   visitorsDetails.className='cv2-visitors';
   visitorsDetails.innerHTML=`<summary><span>${I('users')}<b>Quem ainda está chegando</b><small>Visitantes, origem das visitas e contatos do Wi-Fi</small></span>${I('chevron-down')}</summary>`;
   visitors.before(visitorsDetails);visitorsDetails.append(visitors);
   const customers=CF.state.customers,card=CF.card(),target=card?.stamps||8;
   const ready=customers.filter(c=>c.stamps>=target).length,none=customers.filter(c=>!c.stamps).length;
   const inactive=customers.filter(c=>!c.last||Date.now()-new Date(c.last)>30*864e5).length;
   const stat=(name,value,ic,filter,featured=false)=>`<a class="dv2-stat ${featured?'dv2-stat-featured':''}" href="#/customers?f=${filter}" data-cv2-filter="${filter}"><div><span>${name}</span>${I(ic)}</div><b data-dv2-number="${value}" data-number-key="clientes:${E(name)}" aria-label="${value.toLocaleString(CF.locale())}">${value.toLocaleString(CF.locale())}</b><small>${featured?'Sua base de relacionamento':'Ver estes clientes'}</small></a>`;
   const preview=!!window.CF_DASHBOARD_V2_PREVIEW;
   page.noHead=true;page.title='Clientes v2';
   page.html=`<div class="cv2-customers">${preview?'<div class="dv2-demo-note"><span><i></i>Prévia · dados de exemplo</span><span>As ações não alteram o seu negócio.</span></div>':''}<header class="cv2-heading"><div><span class="cv2-eyebrow">GENTE QUE FAZ PARTE DO SEU NEGÓCIO</span><h1>Mais que nomes.<br><em>Pessoas que voltam.</em></h1><p>Conheça cada cliente, acompanhe os carimbos e cuide da próxima visita.</p></div><div class="card act-box"><div class="act-copy"><b>Ações rápidas</b><span>Dê um carimbo, exporte a lista de clientes ou escolha a filial em que carimba.</span></div><div class="cv2-heading-actions"><button type="button" class="cv2-button cv2-primary" data-act="give-stamp">${I('plus')}Dar carimbo</button><button type="button" class="cv2-button" data-cv2-export>${I('download')}Exportar lista</button>${CF.locPicker()}</div></div></header><div class="dv2-stats">${stat('Clientes com cartão',customers.length,'users','all',true)}${stat('Prontos para resgatar',ready,'gift','reward')}${stat('Sem carimbos',none,'card','none')}${stat('Sem visita recente',inactive,'refresh','inactive')}</div><div class="cv2-list-tools"><div class="cv2-filter-tabs" role="group" aria-label="Filtrar clientes">${FILTERS.map(([value,label])=>`<button type="button" data-cv2-filter="${value}" aria-pressed="false">${label}</button>`).join('')}</div><a class="cv2-visitors-link" href="#vis" data-cv2-visitors>Ver visitantes ${I('arrow-right')}</a></div><div class="cv2-original">${stack.outerHTML}</div><footer class="cv2-page-footer"><span>Seu Cliente Fiel</span><a href="#/page/share">Convide mais clientes pelo QR ${I('arrow-right')}</a></footer></div>`;
   const originalMount=page.mount;
   page.mount=view=>{
    const originalCleanup=originalMount?originalMount(view):null,host=view.querySelector('#cu-body');
    const cleanupNumbers=CF.animateV2Stats(view);
    const decorate=()=>{
     const selected=view.querySelector('#cu-filter').value;
     view.querySelectorAll('.cv2-filter-tabs [data-cv2-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.cv2Filter===selected)));
     const banner=host.querySelector('.alert.info');if(banner)banner.hidden=true;
     const nativeFilter=host.querySelector('#cu-filter')?.closest('.row');if(nativeFilter)nativeFilter.hidden=true;
     const selection=host.querySelector('[data-all],[data-clear]')?.closest('.row');if(selection)selection.classList.add('cv2-selection-bar');
     const toolbar=host.querySelector('#cu-sort')?.closest('.row.wrap');if(toolbar)toolbar.classList.add('cv2-table-toolbar');
     host.querySelector('[data-export-all]')?.setAttribute('aria-label','Exportar CSV');
     const search=host.querySelector('#cu-search');if(search){search.setAttribute('aria-label','Buscar por nome, e-mail, telefone ou código');search.placeholder='Nome, e-mail, telefone ou código';}
     const table=host.querySelector('table.t');if(!table)return;
     table.classList.add('cv2-table');
     const labels={select:'Selecionar',name:'Cliente',email:'E-mail',stamps:'Carimbos',last:'Último carimbo',created:'Cadastro',actions:'Detalhes'};
     const columns=Array.from(table.querySelectorAll('thead th')).map(th=>{
      const key=th.querySelector('[data-sort]')?.dataset.sort||(th.querySelector('#cu-all')?'select':'actions');
      th.dataset.cv2Column=key;return key;
     });
     table.querySelectorAll('tbody>tr').forEach(row=>{
      if(row.querySelector('[data-sel]')){
       row.classList.add('cv2-customer-row');
       Array.from(row.children).forEach((td,i)=>{const key=columns[i],label=window.CF_T?CF_T(labels[key]):labels[key];td.dataset.cv2Column=key;if(td.dataset.cv2Label!==label)td.dataset.cv2Label=label;});
       const id=row.querySelector('[data-sel]').dataset.sel,c=CF.state.customers.find(c=>c.id===id);
       const stampCell=row.querySelector('[data-cv2-column="stamps"]'),progress=stampCell.querySelector('.cv2-stamp-bar');
       const av=row.querySelector('.avatar');if(av&&c){const gift=c.stamps>=target;let g=av.querySelector('.cv2-gift');if(gift&&!g){g=document.createElement('i');g.className='cv2-gift';g.setAttribute('role','img');g.setAttribute('aria-label','Tem recompensa para resgatar');g.title='Tem recompensa para resgatar';g.innerHTML=CF.icon('gift','xs');av.append(g);}else if(!gift&&g)g.remove();}
       if(!progress&&c){const track=document.createElement('span');track.className='cv2-stamp-bar';track.setAttribute('aria-hidden','true');const fill=document.createElement('i');fill.style.width=Math.min(100,c.stamps/target*100)+'%';track.append(fill);stampCell.append(track);}
      }else if(row.querySelector('.hist'))row.classList.add('cv2-detail-row');
     });
    };
    decorate();
    const observer=new MutationObserver(decorate);observer.observe(host,{childList:true,subtree:true});
    view.querySelectorAll('[data-cv2-filter]').forEach(b=>b.addEventListener('click',event=>{
     event.preventDefault();const filter=view.querySelector('#cu-filter');filter.value=b.dataset.cv2Filter;filter.dispatchEvent(new Event('change',{bubbles:true}));decorate();
    }));
    view.querySelector('[data-cv2-export]').addEventListener('click',()=>{view.querySelector('[data-export-all]').click()});
    view.querySelector('[data-cv2-visitors]').addEventListener('click',event=>{
     event.preventDefault();view.querySelector('.cv2-visitors').open=true;view.querySelector('#vis').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
    });
    if(new URLSearchParams(location.hash.split('?')[1]||'').get('f')==='requests'){view.querySelector('#req')?.scrollIntoView({block:'start'});}
    return()=>{observer.disconnect();cleanupNumbers();if(typeof originalCleanup==='function')originalCleanup()};
   };
   return page;
  });
 };
})();
