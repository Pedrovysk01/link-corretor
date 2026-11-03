(function(){
 'use strict';
 const P=window.CFPremium,C=window.CF||{},pal=C.cardV2Palette;
 document.querySelectorAll('[data-marketing-card]').forEach(el=>{
  const kind=el.dataset.marketingCard,p=pal[kind],brand=el.dataset.cardBrand;
  el.innerHTML=P.render({card:{name:brand,stamps:8,rewardLabel:'Um presente da casa',design:{tpl:kind,c1:p[0],c2:p[2],t1:kind==='espresso'?'Sua pausa':'Seu clube',t2:kind==='espresso'?'favorita.':'favorito.',headline:'Junte {n} carimbos e ganhe sua recompensa.',infoOn:false,footer:'FEITO PARA QUEM SEMPRE VOLTA'}},filled:3,fluid:true});
 });
 document.querySelectorAll('.marketing-v2 .price [data-price]').forEach(el=>{el.setAttribute('aria-live','polite')});
})();
