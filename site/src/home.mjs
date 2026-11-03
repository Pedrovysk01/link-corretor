import { SITE, PLANS } from './config.mjs';
import { ICON, ld, faqBlock } from './layout.mjs';

const coffee = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9h12v7a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V9Zm12 1h2a3 3 0 0 1 0 6h-2M8 3v3m4-3v3M4 23h15" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const star = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.8 5.8 6.4.9-4.6 4.5 1.1 6.3-5.7-3-5.7 3 1.1-6.3-4.6-4.5 6.4-.9Z" fill="currentColor"/></svg>';
const glyphPaths = {
 '+':'M12 5v14M5 12h14',
 '◷':'M12 8v5l3 2M9 2h6M12 2v3M20 5l-2 2',
 '▯':'M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2ZM11 18h2',
 '♧':'M3 8h18v4H3ZM5 12v9h14v-9M12 8v13M12 8H8a3 3 0 1 1 3-3l1 3Zm0 0h4a3 3 0 1 0-3-3l-1 3Z',
 '◈':'M12 3 3 12l9 9 9-9-9-9ZM12 8l-4 4 4 4 4-4-4-4Z',
 '▱':'M3 6h18v13H3ZM3 10h18M15 15h3',
 '◎':'M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM16 16l6 6',
 '↶':'M3 10a9 9 0 1 1 1 8M3 4v6h6',
 '▤':'M4 3h16v18H4ZM8 7h8M8 11h8M8 15h5',
 '⚑':'M3 11v4h4l10 5V6L7 11H3ZM7 15l2 6h3M20 9l2-2M20 16l2 2',
 '☆':'m12 3 2.8 5.8 6.4.9-4.6 4.5 1.1 6.3-5.7-3-5.7 3 1.1-6.3-4.6-4.5 6.4-.9Z',
 '☷':'M9 4H5v18h14V4h-4M9 2h6v5H9ZM8 12h8M8 16h6',
 '♙':'M15 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM3 22v-3a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v3M18 4a4 4 0 0 1 0 8M21 15a5 5 0 0 1 2 4v3',
 '▥':'M4 20V10h4v10M10 20V4h4v16M16 20v-7h4v7M2 20h20',
 '▦':'M3 3h6v6H3ZM15 3h6v6h-6ZM3 15h6v6H3ZM15 15h3v3h3v3h-6ZM21 12v3M12 3v3M12 12h3M12 18v3',
};
const glyph = (n) => `<span class="hf-symbol" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${n==='◷'?'<circle cx="12" cy="14" r="9"/>':''}<path d="${glyphPaths[n] || glyphPaths['◈']}"/></svg></span>`;
const check = (t) => `<li>${ICON.check}<span>${t}</span></li>`;
const cta = (text='Criar meu cartão grátis', loc='home') => `<a class="btn primary" href="${SITE.signupPath}" data-cta="${loc}">${text} ${ICON.arrow}</a>`;
const stamps = (count, interactive=false) => Array.from({length:8}, (_,i) => {
  const reward=i===7, on=i<count;
  const content = reward ? `${star}<span>${interactive?'CAFÉ ':''}GRÁTIS</span>` : `${coffee}<span class="hf-stamp-number">${i+1}</span>`;
  return interactive ? `<button type="button" class="demo-stamp${reward?' rw':''}${on?' on':''}" aria-label="${reward?'Dar o oitavo carimbo e liberar recompensa':`Dar carimbo ${i+1}`}" aria-pressed="${on}">${content}</button>` : `<div class="hf-stamp${reward?' hf-reward':''}${on?' hf-filled':''}">${content}</div>`;
}).join('');

const QUESTIONS = [
  ['O cliente precisa baixar algum aplicativo?', 'Não. O cliente aponta a câmera do celular para o QR Code do balcão, informa nome e telefone ou e-mail e o cartão abre no navegador. Ele pode guardar um atalho na tela inicial.'],
  ['Quanto tempo leva para começar?', 'Poucos minutos: você cria a conta, escolhe o nome, o logotipo, o número de carimbos e a recompensa, e imprime o QR Code. O primeiro cliente já pode entrar no cartão.'],
  ['Como eu dou o carimbo?', 'Pelo painel, buscando o cliente pelo nome ou telefone, ou lendo o QR Code do cartão do cliente com o celular. O último carimbo pode ser desfeito em caso de engano.'],
  ['Quanto custa?', `O plano Free é gratuito para até ${PLANS.freeClients} clientes. O Pro custa R$ ${PLANS.proPrice} por mês e atende até ${PLANS.proClients.toLocaleString('pt-BR')} clientes. Toda conta nova começa com ${PLANS.trialDays} dias de teste do Pro, sem cartão de crédito.`],
  ['O que acontece quando o teste acaba?', `A conta continua no Free, com até ${PLANS.freeClients} clientes. Quem já entrou segue no cartão; cliente novo só entra se você assinar o Pro. Sua lista pode ser exportada quando quiser.`],
  ['De quem são os dados dos clientes?', 'Do seu negócio. Pela LGPD, o negócio é o controlador dos dados e o Seu Cliente Fiel atua como operador. Você pode exportar a lista em planilha a qualquer momento.'],
].map(([q,a])=>({q,a}));

export function home() {
 const features = [
 ['◈','Cartão com a sua marca','Logotipo, cores e fundos para o seu segmento e para datas como Natal e Dia das Mães.'],
 ['▤','Página do seu negócio','Cardápio, catálogo, novidades com foto, WhatsApp, Wi-Fi e links no mesmo QR Code do cartão.'],
 ['⚑','Campanhas com prazo','“Carimbo em dobro até sexta”: a campanha aparece no cartão e ajuda a movimentar os dias fracos.'],
 ['♧','Aniversário automático','Uma oferta de aniversário com validade, para quem informou a data no cadastro.'],
 ['☆','Avaliações no Google','Conecte a ficha do seu negócio e convide o cliente a avaliar depois de resgatar a recompensa.'],
 ['☷','Pesquisa de satisfação','Pergunte o que o cliente achou da visita e descubra o que melhorar antes que vire reclamação.'],
 ['♙','Equipe carimbando','Funcionários carimbam pelo leitor de QR no celular. O histórico mostra quem deu cada carimbo.'],
 ['▥','Números que importam','Clientes, carimbos, recompensas e quem não aparece há 30 dias, para agir na hora certa.']
 ];
 const free = [`Até ${PLANS.freeClients} clientes no cartão`,'Cartão com carimbos, logotipo e fundos','Página do negócio com o QR Code','Cartazes e etiquetas para imprimir','Campanhas, aniversário e pesquisas','Avaliações no Google'];
 const pro = [`Até ${PLANS.proClients.toLocaleString('pt-BR')} clientes no cartão`,'Tudo do Free','Cartão Premium com foto do seu negócio','Estatísticas de visitantes da página','Contato do cliente em troca da senha do Wi-Fi','Página sem a marca d’água'];
 const body = `
 <section class="hero"><div class="wrap hero-in">
 <div class="hf-hero-copy"><span class="hf-pill"><i></i>Cartão fidelidade digital para negócios locais</span>
 <h1>Seu cliente volta mais vezes com um cartão fidelidade <em>no celular</em></h1>
 <p class="lead">Crie em minutos o cartão de carimbos do seu negócio. O cliente entra pelo QR Code, sem baixar aplicativo, e você acompanha cada visita no painel.</p>
 <div class="hero-btns">${cta()}<a class="btn" href="#como-funciona">Ver como funciona</a></div>
 <ul class="checks">${check(`Grátis até ${PLANS.freeClients} clientes`)}${check(`${PLANS.trialDays} dias de Pro, sem cartão de crédito`)}${check('Sem app para o cliente')}</ul></div>
 <div class="hf-art"><div class="hf-orbit" aria-hidden="true"></div>
 <div class="hf-phone" role="img" aria-label="Exemplo: cartão Café da Praça no celular com 3 de 8 carimbos">
 <div class="hf-phone-screen"><div class="hf-status"><b>9:41</b><span aria-hidden="true">▮▮▮ ▰</span></div><div class="hf-island"></div>
 <div class="hf-screen-heading">SEU CARTÃO FIDELIDADE <span>♡</span></div>
 <div class="hf-phone-card"><div class="hf-cafe-avatar">${coffee}</div><h3>Café da Praça</h3><p>Um café. Uma pausa. Mais um motivo para voltar.</p><div class="hf-count"><span>CARIMBOS</span><b>3<span>/8</span></b></div><div class="hf-stamps">${stamps(3)}</div><div class="hf-card-note">Junte 8 carimbos e ganhe um café</div></div>
 <div class="hf-counter-note">${glyph('▦')}<div><b>Mostre no balcão</b><span>O atendente carimba na hora</span></div></div><div class="hf-screen-brand">feito com <b>Seu Cliente Fiel</b></div><div class="hf-home-bar"></div></div></div>
 <div class="hf-float hf-float-one">${glyph('+')}<div><b>+1 carimbo</b><span>Visita registrada agora</span></div></div>
 <div class="hf-float hf-float-two">${glyph('♧')}<div><b>Recompensa liberada</b><span>Café grátis no 8º carimbo</span></div></div>
 </div></div></section>
 <section class="hf-trust"><div class="wrap">${[['◷','Pronto em minutos'],['▯','Sem aplicativo para o cliente'],['◈','Com a sua marca'],['♧','Pensado para a LGPD']].map(([g,t])=>`<div>${glyph(g)}<span>${t}</span></div>`).join('')}</div></section>
 <section class="sec hf-problem"><div class="wrap"><span class="eyebrow center">A realidade do balcão</span><h2 class="sec-h">O cartãozinho de papel não diz quem são os seus clientes</h2><p class="sec-lead">Ele funciona no balcão, mas para por aí. Sem saber quem volta, você não consegue agradecer, chamar de volta nem medir se a recompensa vale a pena.</p><div class="grid g3">${[
 ['▱','Some na carteira','O cliente esquece, perde ou lava o cartão no bolso. Os carimbos vão junto, e a vontade de voltar também.'],
 ['◎','Não diz quem volta','Você sabe que alguém completou um cartão, mas não quem, nem com que frequência aparece.'],
 ['↶','Não chama ninguém de volta','Quando um cliente frequente some, o papel não avisa. O digital mostra quem está há 30 dias sem vir.']
 ].map(([g,t,d])=>`<div class="card pain">${glyph(g)}<h3>${t}</h3><p>${d}</p></div>`).join('')}</div></div></section>
 <section class="sec hf-white" id="como-funciona"><div class="wrap"><span class="eyebrow center">Passo a passo</span><h2 class="sec-h">Do balcão ao celular do cliente em 4 passos</h2><p class="sec-lead">Sem equipamento novo e sem treinamento demorado. Se a sua equipe sabe usar o celular, sabe usar o Seu Cliente Fiel.</p><ol class="steps">${[
 ['Crie o cartão','Nome, logotipo, número de carimbos e a recompensa. Escolha um fundo para o seu segmento.'],
 ['Coloque o QR no balcão','O painel gera cartazes de mesa, folhas A4 e etiquetas prontas para imprimir.'],
 ['O cliente entra em segundos','Ele lê o QR com a câmera, informa nome e telefone ou e-mail e recebe o cartão no celular.'],
 ['Carimbe e recompense','A cada compra, um carimbo pelo painel ou pelo QR do cliente. Cartão completo, recompensa entregue.']
 ].map(([t,d])=>`<li><h3>${t}</h3><p>${d}</p></li>`).join('')}</ol><div class="hf-action">${cta('Começar agora, é grátis','steps')}</div></div></section>
 <section class="sec hf-demo-section" id="experimente"><div class="wrap split"><div><span class="eyebrow">Veja na prática</span><h2>É assim que o cliente vê o progresso no celular</h2><p class="lead">Cada carimbo aparece na hora. Ver o prêmio chegando perto ajuda o cliente a voltar.</p><ul class="ticks">${['Progresso sempre visível, sem papel para perder','Você escolhe de 4 a 16 carimbos e a recompensa','O último círculo é sempre o prêmio do cliente'].map(check).join('')}</ul><p class="hf-demo-hint">Toque em um círculo para adicionar um carimbo ${ICON.arrow}</p></div>
 <div class="demo" data-demo data-initial="5" data-home-demo><div class="demo-top"><div class="hf-demo-name"><span class="hf-cafe-avatar">${coffee}</span><span>Café da Praça</span></div><span><small>CARIMBOS</small><b data-demo-count>5/8</b></span></div><div class="demo-grid">${stamps(5,true)}</div><div class="demo-foot"><span class="demo-msg" aria-live="polite">Faltam 3 carimbos para o café grátis</span></div><button class="hf-reset" type="button" data-demo-reset>Recomeçar demonstração ↶</button></div></div></section>
 <section class="sec" id="recursos"><div class="wrap"><span class="eyebrow center">Tudo no mesmo QR</span><h2 class="sec-h">Tudo o que você precisa para o cliente voltar</h2><p class="sec-lead">Um painel simples para o dono e uma experiência leve para o cliente. Sem contrato e sem mensalidade para começar.</p><div class="grid g4">${features.map(([g,t,d])=>`<div class="card">${glyph(g)}<h3>${t}</h3><p>${d}</p></div>`).join('')}</div></div></section>
 <section class="sec hf-white" id="calculadora"><div class="wrap"><span class="eyebrow center">Simule com os seus números</span><h2 class="sec-h">Quanto um cliente que volta vale para você?</h2><p class="sec-lead">É uma estimativa para ajudar na decisão, não uma promessa de resultado.</p><div class="calc" data-calc><div><label for="calc-c">Clientes no cartão <output id="calc-c-o">50</output></label><input type="range" id="calc-c" min="10" max="1000" step="10" value="50"><label for="calc-t">Gasto médio por visita <output id="calc-t-o">R$ 25</output></label><input type="range" id="calc-t" min="5" max="300" step="5" value="25"><label for="calc-v">Visitas a mais por cliente, por mês <output id="calc-v-o">0,5</output></label><input type="range" id="calc-v" min="0.25" max="4" step="0.25" value="0.5"></div><div class="calc-out"><small>Receita bruta extra estimada por mês</small><b id="calc-out" aria-live="polite">R$ 625</b><p id="calc-note">50 clientes × R$ 25 × 0,5 visita a mais por mês, antes de descontar margem e custo das recompensas.</p></div></div></div></section>
 <section class="sec" id="precos"><div class="wrap center"><span class="eyebrow">Transparência total</span><h2 class="sec-h">Preço simples, sem surpresa</h2><p class="sec-lead">Comece grátis. Passe para o Pro quando o cartão crescer.</p><div class="billing" role="group" aria-label="Período de cobrança"><button type="button" data-billing="monthly" aria-pressed="true">Mensal</button><button type="button" data-billing="annual" aria-pressed="false">Anual <span>2 meses grátis</span></button></div>
 <div class="plans"><div class="plan"><h3>Free</h3><div class="price">R$ 0</div><p class="sub">Para começar e testar a ideia no balcão.</p><ul class="ticks">${free.map(check).join('')}</ul><a class="btn" href="${SITE.signupPath}" data-cta="plan-free">Começar grátis</a></div><div class="plan pro"><span class="tag">Para quem passa de ${PLANS.freeClients} clientes</span><h3>Pro</h3><div class="price"><span data-price data-monthly="R$ ${PLANS.proPrice}" data-annual="R$ ${PLANS.proAnnualMonthly}">R$ ${PLANS.proPrice}</span><small>/mês</small></div><p class="sub" data-price-note data-monthly="Cobrança mensal, cancele quando quiser." data-annual="R$ ${PLANS.proPrice*10} por ano, pagos de uma vez (10 meses)">Cobrança mensal, cancele quando quiser.</p><ul class="ticks">${pro.map(check).join('')}</ul>${cta(`Testar o Pro por ${PLANS.trialDays} dias`,'plan-pro')}</div></div>
 <div class="hf-plan-notice"><span aria-hidden="true">ⓘ</span><p>Os dois botões criam a mesma conta, sem cartão de crédito: ${PLANS.trialDays} dias com tudo do Pro. Depois, se você não assinar, ela continua no Free com até ${PLANS.freeClients} clientes: quem já entrou segue no cartão, mas cliente novo só entra se você assinar. Sua lista pode ser exportada quando quiser.</p></div></div></section>
 ${faqBlock(QUESTIONS).replace('<h2 class="sec-h">','<span class="eyebrow center">Dúvidas</span><h2 class="sec-h">')}
 <section class="hf-final"><div class="wrap"><div class="hf-final-inner"><div><h2>Crie seu cartão fidelidade em poucos minutos</h2><p>Grátis até ${PLANS.freeClients} clientes. ${PLANS.trialDays} dias de Pro, sem cartão de crédito.</p></div><a class="btn dark" href="${SITE.signupPath}" data-cta="home-band">Criar meu cartão grátis ${ICON.arrow}</a></div></div></section>`;
 return {path:'/', fullTitle:'Seu Cliente Fiel — Cartão fidelidade digital', description:'Cartão fidelidade digital para negócios locais. O cliente entra pelo QR Code, sem app. Grátis até 30 clientes.',body,bodyClass:'hf-home',head:`<link rel="stylesheet" href="/assets/css/home.css?v=${SITE.version}">`,image:'/assets/og/home.png',jsonld:[ld.app(PLANS),ld.faq(QUESTIONS)],og:{key:'home',title:'Seu cliente volta mais vezes',sub:'Cartão fidelidade digital para negócios locais'}};
}
