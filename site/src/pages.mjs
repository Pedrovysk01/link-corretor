// Páginas do site. Cada função devolve { path, title, description, body, ... } para o layout.
import { SITE, PLANS, COMPANY, isTodo } from "./config.mjs";
import { esc } from "./md.mjs";
import { E3D, ICON, ld, faqBlock, ctaBand, crumbsHtml, abs } from "./layout.mjs";

const brl = (n) => "R$ " + Number(n).toLocaleString("pt-BR");
const A = SITE.signupPath;   // todas as chamadas para criar conta
const fill = (s) => String(s).replace(/\{free\}/g, PLANS.freeClients).replace(/\{pro\}/g, PLANS.proClients.toLocaleString("pt-BR")).replace(/\{price\}/g, PLANS.proPrice).replace(/\{trial\}/g, PLANS.trialDays).replace(/\{annual\}/g, PLANS.proAnnualMonthly);
export const faqItems = (faq, onlyHome) => faq.flatMap((g) => g.items).filter((f) => !onlyHome || f.home).map((f) => ({ q: f.q, a: fill(f.a) }));
const ticks = (list) => `<ul class="ticks">${list.map((t) => `<li>${ICON.check}<span>${t}</span></li>`).join("")}</ul>`;
// eager (imagem principal do topo): sem decoding="async" — com ele + o filtro de sombra, o Chrome pintava o celular em branco na 1ª tela
const img = (src, alt, w, h, cls = "", eager = false) => `<img${cls ? ` class="${cls}"` : ""} src="${src}" alt="${esc(alt)}" width="${w}" height="${h}" ${eager ? 'fetchpriority="high"' : 'loading="lazy" decoding="async"'}>`;

const FEATURES = [
  ["artist-palette", "Cartão com a sua marca", "Logotipo, cores e fundos para o seu segmento e para datas como Natal e Dia das Mães. No Pro, o cartão Premium com foto do seu negócio."],
  ["mobile-phone", "Página do seu negócio", "Cardápio, catálogo, novidades com foto, WhatsApp, Wi-Fi e links reunidos no mesmo QR Code do cartão."],
  ["megaphone", "Campanhas com prazo", "\"Carimbo em dobro até sexta\": a campanha aparece no cartão do cliente e ajuda a movimentar os dias mais fracos."],
  ["birthday-cake", "Aniversário automático", "Uma oferta de aniversário com validade, para quem informou a data no cadastro."],
  ["star", "Avaliações no Google", "Conecte a ficha do seu negócio e convide o cliente a avaliar depois de resgatar a recompensa."],
  ["clipboard", "Pesquisa de satisfação", "Pergunte o que o cliente achou da visita e descubra o que melhorar antes que vire reclamação."],
  ["busts-in-silhouette", "Equipe carimbando", "Funcionários carimbam pelo leitor de QR no celular. O histórico mostra quem deu cada carimbo."],
  ["bar-chart", "Números que importam", "Clientes, carimbos, recompensas e quem não aparece há 30 dias, para agir na hora certa."],
];

/* ============================================================== HOME (página de vendas) */
export { home } from './home.mjs';
export { homeV2 } from './home-v2.mjs';

/* ============================================================== bloco de preços (home e /precos) */
function pricingBlock(full = false) {
  const free = ["Até " + PLANS.freeClients + " clientes no cartão", "Cartão com carimbos, logotipo e fundos", "Página do negócio com o QR Code", "Cartazes e etiquetas para imprimir", "Campanhas, aniversário e pesquisas", "Avaliações no Google"];
  const pro = ["Até " + PLANS.proClients.toLocaleString("pt-BR") + " clientes no cartão", "Tudo do Free", "Cartão Premium com foto do seu negócio", "Estatísticas de visitantes da página", "Contato do cliente em troca da senha do Wi-Fi", "Conteúdos em PDF para download", "Página sem a marca d’água"];
  return `<section class="sec${full ? "" : " warm"}" id="precos"><div class="wrap center">
  ${full ? "" : `<h2 class="sec-h">Preço simples, sem surpresa</h2><p class="sec-lead">Comece grátis. Passe para o Pro quando o cartão crescer.</p>`}
  <div class="billing" role="group" aria-label="Período de cobrança"><button type="button" data-billing="monthly" aria-pressed="true">Mensal</button><button type="button" data-billing="annual" aria-pressed="false">Anual · R$ ${PLANS.proAnnualMonthly}/mês</button></div>
  <div class="plans" style="text-align:left">
    <div class="plan"><h3>Free</h3><div class="price">R$ 0</div><p class="sub">Para começar e testar a ideia.</p>${ticks(free)}<a class="btn" href="${A}" data-cta="plan-free">Começar grátis</a></div>
    <div class="plan pro"><span class="tag">Para quem passa de ${PLANS.freeClients} clientes</span><h3>Pro</h3><div class="price"><span data-price data-monthly="${brl(PLANS.proPrice)}" data-annual="${brl(PLANS.proAnnualMonthly)}">${brl(PLANS.proPrice)}</span><small>/mês</small></div>
      <p class="sub" data-price-note data-monthly="Cobrança mensal, cancele quando quiser." data-annual="${brl(PLANS.proAnnual)} por ano, pagos de uma vez (12 meses). Equivale a ${brl(PLANS.proAnnualMonthly)}/mês.">Cobrança mensal, cancele quando quiser.</p>${ticks(pro)}<a class="btn primary" href="${A}" data-cta="plan-pro">Testar o Pro por ${PLANS.trialDays} dias</a></div>
  </div>
  <p class="sec-lead" style="margin-top:22px">Os dois botões criam a mesma conta, sem cartão de crédito: ${PLANS.trialDays} dias com tudo do Pro. Depois, se você não assinar, ela continua no Free <b>com até ${PLANS.freeClients} clientes</b>: quem já entrou segue no cartão, mas cliente novo só entra se você assinar. Sua lista pode ser exportada quando quiser.${full ? "" : ` <a href="/precos/">Ver detalhes dos planos</a>.`}</p>
</div></section>`;
}

/* ============================================================== COMO FUNCIONA */
export function howItWorks({ faq }) {
  const crumbs = [{ name: "Início", path: "/" }, { name: "Como funciona", path: "/como-funciona/" }];
  const steps = [
    ["Crie a conta e o cartão", "Informe o nome do negócio, envie o logotipo e escolha o número de carimbos (de 4 a 16) e a recompensa, como “o 10º café é por nossa conta”. Escolha um fundo de cartão para o seu segmento."],
    ["Monte a página do negócio", "Adicione cardápio, catálogo, novidades, WhatsApp, Wi-Fi e links. Tudo aparece no mesmo endereço do cartão."],
    ["Imprima o QR Code", "O painel gera cartaz de mesa, folha A4 e etiqueta pequena. Coloque no caixa, na mesa, na comanda ou na sacola."],
    ["Convide o cliente na hora de pagar", "O cliente lê o QR com a câmera do celular, informa nome e telefone ou e-mail e já recebe o cartão, sem baixar aplicativo."],
    ["Dê os carimbos", "Pelo painel, buscando o cliente pelo nome ou telefone, ou lendo o QR do cartão do cliente com o celular. O último carimbo pode ser desfeito em caso de engano."],
    ["Entregue a recompensa", "Quando o cartão completa, o painel avisa. O atendente registra o resgate e o cliente começa um novo ciclo."],
    ["Traga o cliente de volta", "Crie campanhas com prazo, ative a oferta de aniversário, faça pesquisas e acompanhe quem está sumido."],
  ];
  const items = faqItems(faq).filter((f) => /aplicativo|carimbo|trocar de celular|equipamento|LGPD/i.test(f.q));
  const howto = { "@type": "HowTo", name: "Como criar e usar um cartão fidelidade digital", totalTime: "PT15M", step: steps.map(([n, t], i) => ({ "@type": "HowToStep", position: i + 1, name: n, text: t })) };
  const body = `<div class="page-hero"><div class="wrap">${crumbsHtml(crumbs)}<h1 style="margin-top:14px">Como funciona o cartão fidelidade digital</h1>
  <p class="lead">Do cadastro do negócio ao cliente resgatando a recompensa: veja o passo a passo e o que acontece de cada lado do balcão.</p>
  <div class="answer"><strong>Resumindo:</strong> você cria o cartão no painel e coloca o QR Code no balcão. O cliente lê o QR, se cadastra em segundos e recebe o cartão no celular. A cada compra, você dá um carimbo; ao completar o cartão, ele ganha a recompensa.</div></div></div>
<section class="sec" style="padding-top:20px"><div class="wrap narrow"><ol class="steps" style="grid-template-columns:1fr">${steps.map(([n, t]) => `<li><h3>${n}</h3><p>${t}</p></li>`).join("")}</ol></div></section>
<section class="sec alt"><div class="wrap split">
  <div><h2>Para o cliente, é só apontar a câmera</h2><p>Nada de aplicativo, senha ou cartão de papel. O cliente vê os carimbos, a recompensa e as novidades do negócio no navegador, e pode salvar um atalho na tela inicial do celular.</p>
  ${ticks(["Cadastro com nome e telefone ou e-mail", "Consentimento para ofertas separado e opcional", "Cartão salvo no celular e no painel do negócio"])}</div>
  <div class="split-art plain">${img("/assets/img/hero-cartao.webp", "Cartão do cliente no celular com QR Code para carimbar", 860, 1760)}</div>
</div></section>
<section class="sec"><div class="wrap split rev">
  <div><h2>Para a equipe, carimbar leva segundos</h2><p>Busque o cliente pelo nome ou telefone no painel, ou leia o QR do cartão do cliente com o celular. Cada carimbo fica registrado com data, hora e quem carimbou.</p>
  ${ticks(["Funciona no navegador do celular ou do computador", "Desfazer o último carimbo em caso de engano", "Funcionários com acesso ao leitor de carimbos"])}</div>
  <div class="split-art">${img("/assets/img/painel.webp", "Painel com lista de clientes e carimbos", 1440, 900)}</div>
</div></section>
${faqBlock(items, { title: "Dúvidas sobre o funcionamento" })}
${ctaBand({ loc: "como-band" })}`;
  return { path: "/como-funciona/", title: "Como funciona o cartão fidelidade digital", description: "Veja o passo a passo do cartão fidelidade digital: criar o cartão, imprimir o QR Code, cadastrar o cliente, carimbar e entregar a recompensa.", crumbs, body, jsonld: [howto, ld.faq(items)], og: { key: "como-funciona", title: "Como funciona", sub: "Do balcão ao celular do cliente em poucos passos" }, image: "/assets/og/como-funciona.png" };
}

/* ============================================================== RECURSOS */
export function features() {
  const crumbs = [{ name: "Início", path: "/" }, { name: "Recursos", path: "/recursos/" }];
  const groups = [
    ["Cartão fidelidade", "artist-palette", ["Carimbos de 4 a 16, com a recompensa no último círculo", "Logotipo, nome e cores do negócio", "Fundos por segmento (cafeteria, barbearia, pet shop…) e por data comemorativa", "Troca automática de fundo nas datas comemorativas", "Cartão Premium com foto do negócio e 3 layouts (Pro)"]],
    ["Página do negócio", "mobile-phone", ["Cardápio com itens e preços", "Catálogo de produtos com foto", "Novidades com imagem quadrada ou em banner", "WhatsApp, Wi-Fi, redes sociais e links", "Ficha do Google: nota, horários, como chegar e depoimentos", "Contato do cliente em troca da senha do Wi-Fi (Pro)"]],
    ["Relacionamento", "megaphone", ["Campanhas com prazo exibidas no cartão do cliente", "Oferta automática de aniversário", "Pesquisas de satisfação após a visita", "Convite para avaliar no Google após o resgate"]],
    ["Gestão", "bar-chart", ["Lista de clientes com histórico de carimbos", "Prêmios pendentes e clientes sem visita há 30 dias", "Funcionários carimbando pelo leitor de QR", "Exportação dos clientes em planilha", "Estatísticas de visitantes da página (Pro)"]],
    ["Materiais impressos", "printer", ["Cartaz de mesa com QR Code", "Folha A4 e etiqueta pequena", "Imagens prontas para Instagram e Facebook"]],
    ["Privacidade e segurança", "locked", ["Cadastro com finalidade clara e consentimento separado para ofertas", "Cada negócio acessa apenas os próprios clientes", "Conexão criptografada e travas no servidor para dados sensíveis"]],
  ];
  const soon = ["Página em vários idiomas", "Assistente com IA 24 horas", "Banner rotativo", "Vídeo de fundo na página"];
  const body = `<div class="page-hero"><div class="wrap">${crumbsHtml(crumbs)}<h1 style="margin-top:14px">Recursos do Seu Cliente Fiel</h1>
  <p class="lead">Tudo o que você precisa para criar um programa de fidelidade que funciona no balcão e traz o cliente de volta.</p></div></div>
<section class="sec" style="padding-top:20px"><div class="wrap"><div class="grid g3">${groups.map(([t, e, l]) => `<div class="card">${E3D(e)}<h2 style="font-size:1.3rem;margin:14px 0 6px">${t}</h2>${ticks(l)}</div>`).join("")}</div>
<div class="answer" style="margin-top:40px"><strong>Em breve:</strong> ${soon.join(" · ")}. Recursos marcados como Pro estão no plano pago e no teste de ${PLANS.trialDays} dias.</div></div></section>
${ctaBand({ loc: "recursos-band" })}`;
  return { path: "/recursos/", title: "Recursos do cartão fidelidade digital", description: "Cartão com carimbos e a sua marca, página do negócio, campanhas, aniversário, pesquisas, avaliações no Google, equipe e relatórios. Veja todos os recursos.", crumbs, body, og: { key: "recursos", title: "Recursos", sub: "Cartão, página do negócio, campanhas e painel" }, image: "/assets/og/recursos.png" };
}

/* ============================================================== PREÇOS */
export function pricing({ faq }) {
  const crumbs = [{ name: "Início", path: "/" }, { name: "Preços", path: "/precos/" }];
  const items = faqItems(faq).filter((f) => /custa|cartão de crédito|cancelar|anual|aplicativo/i.test(f.q));
  const product = { "@type": "Product", name: `${SITE.name} Pro`, description: `Cartão fidelidade digital para até ${PLANS.proClients} clientes, com recursos avançados.`, brand: { "@type": "Brand", name: SITE.name },
    offers: { "@type": "Offer", price: String(PLANS.proPrice), priceCurrency: "BRL", availability: "https://schema.org/InStock", url: abs("/precos/"), priceSpecification: { "@type": "UnitPriceSpecification", price: String(PLANS.proPrice), priceCurrency: "BRL", unitCode: "MON", referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "MON" } } } };
  const body = `<div class="page-hero"><div class="wrap center">${crumbsHtml(crumbs)}<h1 style="margin-top:14px">Preços do cartão fidelidade digital</h1>
  <p class="lead" style="margin-left:auto;margin-right:auto">Comece grátis até ${PLANS.freeClients} clientes. Quando o cartão crescer, o Pro atende até ${PLANS.proClients.toLocaleString("pt-BR")} clientes por ${brl(PLANS.proPrice)} por mês.</p></div></div>
${pricingBlock(true)}
<section class="sec alt"><div class="wrap narrow"><h2 class="sec-h">Compare os planos</h2>
<div class="table-wrap"><table><thead><tr><th scope="col">Recurso</th><th scope="col">Free</th><th scope="col">Pro</th></tr></thead><tbody>
${[["Clientes no cartão", "até " + PLANS.freeClients, "até " + PLANS.proClients.toLocaleString("pt-BR")], ["Cartão com carimbos, logotipo e fundos", "✓", "✓"], ["Cartão Premium com foto do negócio", "—", "✓"], ["Página do negócio e QR Code", "✓", "✓"], ["Cardápio, catálogo, novidades e links", "✓", "✓"], ["Campanhas, aniversário e pesquisas", "✓", "✓"], ["Avaliações no Google", "✓", "✓"], ["Funcionários carimbando", "✓", "✓"], ["Estatísticas de visitantes da página", "—", "✓"], ["Contato em troca da senha do Wi-Fi", "—", "✓"], ["Conteúdos em PDF para download", "—", "✓"], ["Página sem marca d’água", "—", "✓"]].map((r) => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join("")}
</tbody></table></div>
<p class="fine">Valores em reais. Os preços vigentes são os desta página no momento da contratação.</p></div></section>
${faqBlock(items, { title: "Dúvidas sobre preços" })}
${ctaBand({ loc: "precos-band" })}`;
  return { path: "/precos/", title: "Preços: grátis até 30 clientes", description: `Cartão fidelidade digital grátis até ${PLANS.freeClients} clientes. Plano Pro por ${brl(PLANS.proPrice)}/mês com até ${PLANS.proClients.toLocaleString("pt-BR")} clientes e ${PLANS.trialDays} dias de teste.`, crumbs, body, jsonld: [product, ld.faq(items)], og: { key: "precos", title: "Preços", sub: `Grátis até ${PLANS.freeClients} clientes · Pro ${brl(PLANS.proPrice)}/mês` }, image: "/assets/og/precos.png" };
}

/* ============================================================== FAQ */
export function faqPage({ faq }) {
  const crumbs = [{ name: "Início", path: "/" }, { name: "Perguntas frequentes", path: "/faq/" }];
  const all = faqItems(faq);
  const body = `<div class="page-hero"><div class="wrap">${crumbs.length ? crumbsHtml(crumbs) : ""}<h1 style="margin-top:14px">Perguntas frequentes</h1><p class="lead">Tudo sobre o cartão fidelidade digital: como começar, carimbos, preços e privacidade.</p></div></div>
${faq.map((g) => faqBlock(g.items.map((f) => ({ q: f.q, a: fill(f.a) })), { title: g.group, id: g.group.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]+/g, "-") })).join("")}
${ctaBand({ loc: "faq-band", title: "Ainda com dúvida? Teste grátis", text: "Crie o cartão em minutos e veja na prática. Se precisar, fale com a gente pela página de contato." })}`;
  return { path: "/faq/", title: "Perguntas frequentes sobre cartão fidelidade digital", description: "Respostas sobre o cartão fidelidade digital: como o cliente entra, como carimbar, quanto custa, LGPD e segurança dos dados.", crumbs, body, jsonld: [ld.faq(all)], og: { key: "faq", title: "Perguntas frequentes", sub: "Como começar, carimbos, preços e LGPD" }, image: "/assets/og/faq.png" };
}

/* ============================================================== SEGMENTOS */
export function segmentsHub({ segments }) {
  const crumbs = [{ name: "Início", path: "/" }, { name: "Para o seu negócio", path: "/cartao-fidelidade/" }];
  const list = { "@type": "ItemList", itemListElement: segments.map((s, i) => ({ "@type": "ListItem", position: i + 1, name: s.title, url: abs(`/cartao-fidelidade/${s.slug}/`) })) };
  const body = `<div class="page-hero"><div class="wrap">${crumbsHtml(crumbs)}<h1 style="margin-top:14px">Cartão fidelidade para o seu tipo de negócio</h1>
  <p class="lead">Cada segmento tem um ritmo de visita, um ticket e uma recompensa que funciona melhor. Escolha o seu e veja ideias prontas.</p></div></div>
<section class="sec" style="padding-top:20px"><div class="wrap"><div class="grid g3">${segments.map((s) => `<a class="card" href="/cartao-fidelidade/${s.slug}/">${E3D(s.em)}<h2 style="font-size:1.25rem;margin:14px 0 8px">${esc(s.title)}</h2><p>${esc(s.description)}</p><span class="more">Ver ideias ${ICON.arrow}</span></a>`).join("")}</div></div></section>
${ctaBand({ loc: "hub-band" })}`;
  return { path: "/cartao-fidelidade/", title: "Cartão fidelidade por segmento", description: "Ideias de cartão fidelidade para cafeteria, padaria, salão, barbearia, pet shop, restaurante, academia e outros negócios locais, com recompensas e número de carimbos.", crumbs, body, jsonld: [list], og: { key: "segmentos", title: "Para o seu negócio", sub: "Ideias de cartão fidelidade por segmento" }, image: "/assets/og/segmentos.png" };
}

export function segmentPage(s, { segments, posts }) {
  const path = `/cartao-fidelidade/${s.slug}/`;
  const crumbs = [{ name: "Início", path: "/" }, { name: "Para o seu negócio", path: "/cartao-fidelidade/" }, { name: s.name, path }];
  const rel = (s.blog || []).map((slug) => posts.find((p) => p.slug === slug)).filter(Boolean);
  const others = segments.filter((x) => x.slug !== s.slug).slice(0, 6);
  const body = `<div class="page-hero"><div class="wrap">${crumbsHtml(crumbs)}
  <div class="split" style="margin-top:14px"><div><span class="eyebrow">${E3D(s.em, "e3d", "")} ${esc(s.name)}</span><h1>${esc(s.title)}</h1><p class="lead">${esc(s.intro)}</p>
  <div class="hero-btns" style="margin-top:22px"><a class="btn primary lg" href="${A}" data-cta="seg-${s.slug}">Criar o cartão da minha ${esc(s.name.toLowerCase().split(" e ")[0])} ${ICON.arrow}</a></div>
  <ul class="checks"><li>${ICON.check}Grátis até ${PLANS.freeClients} clientes</li><li>${ICON.check}Sem app para o cliente</li></ul></div>
  <div class="split-art plain" style="max-width:360px;justify-self:center">${img("/assets/img/hero-cartao.webp", `Cartão fidelidade digital de ${s.name.toLowerCase()} no celular`, 860, 1760)}</div></div>
  <div class="answer"><strong>Resposta rápida:</strong> ${esc(s.answer)}</div></div></div>
<section class="sec" style="padding-top:24px"><div class="wrap"><h2 class="sec-h">Por que o cartão fidelidade funciona em ${esc(s.name.toLowerCase())}</h2>
<div class="grid g3" style="margin-top:28px">${s.why.map((w) => `<div class="card"><h3 style="margin-top:0">${esc(w.t)}</h3><p>${esc(w.d)}</p></div>`).join("")}</div></div></section>
<section class="sec alt"><div class="wrap split">
  <div><h2>Ideias de recompensa</h2>${ticks(s.rewards.map(esc))}<h3 style="margin-top:28px">Quantos carimbos pedir</h3><p>${esc(s.stamps)} Confira a conta de margem no guia <a href="/blog/quantos-carimbos-cartao-fidelidade/">quantos carimbos pedir</a>.</p></div>
  <div class="card"><h2 style="font-size:1.35rem">Dicas para começar</h2><ol style="margin-top:14px">${s.tips.map((t) => `<li style="margin-bottom:10px">${esc(t)}</li>`).join("")}</ol></div>
</div></section>
${faqBlock(s.faq, { title: `Perguntas sobre cartão fidelidade para ${s.name.toLowerCase()}` })}
${rel.length ? `<section class="sec alt"><div class="wrap"><h2 class="sec-h">Leia também</h2><div class="grid g2" style="margin-top:28px">${rel.map(postCard).join("")}</div></div></section>` : ""}
<section class="sec"><div class="wrap"><h2 class="sec-h" style="font-size:1.5rem">Outros segmentos</h2><p class="center" style="margin-top:16px">${others.map((o) => `<a href="/cartao-fidelidade/${o.slug}/">${esc(o.name)}</a>`).join(" · ")} · <a href="/cartao-fidelidade/">todos</a></p></div></section>
${ctaBand({ loc: "seg-band-" + s.slug, title: `Crie o cartão fidelidade da sua ${s.name.toLowerCase().split(" e ")[0]} hoje` })}`;
  const service = { "@type": "Service", name: s.title, serviceType: "Programa de fidelidade digital", provider: { "@id": SITE.url + "/#org" }, areaServed: { "@type": "Country", name: "Brasil" }, description: s.description };
  return { path, title: s.title, description: s.description, crumbs, body, jsonld: [service, ld.faq(s.faq)], og: { key: "seg-" + s.slug, title: s.title, sub: s.rewards[0] }, image: `/assets/og/seg-${s.slug}.png` };
}

/* ============================================================== BLOG */
const fmtDate = (d) => new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
export const postCard = (p) => `<a class="card post-card" href="/blog/${p.slug}/">${img(`/assets/og/post-${p.slug}.webp`, "", 600, 315)}<div class="pc-b"><span class="cat">${esc(p.category)}</span><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p><time datetime="${p.date}">${fmtDate(p.date)} · ${p.minutes} min de leitura</time></div></a>`;

export function blogIndex({ posts }) {
  const crumbs = [{ name: "Início", path: "/" }, { name: "Blog", path: "/blog/" }];
  const blog = { "@type": "Blog", "@id": abs("/blog/") + "#blog", name: `Blog ${SITE.name}`, url: abs("/blog/"), inLanguage: SITE.lang, publisher: { "@id": SITE.url + "/#org" }, blogPost: posts.map((p) => ({ "@type": "BlogPosting", headline: p.title, url: abs(`/blog/${p.slug}/`), datePublished: p.date })) };
  const body = `<div class="page-hero"><div class="wrap">${crumbsHtml(crumbs)}<h1 style="margin-top:14px">Blog: fidelização de clientes para negócios locais</h1>
  <p class="lead">Guias práticos sobre cartão fidelidade, recompensas, QR Code, avaliações no Google e LGPD, escritos para quem atende no balcão.</p></div></div>
<section class="sec" style="padding-top:20px"><div class="wrap"><div class="grid g3">${posts.map(postCard).join("")}</div></div></section>
${ctaBand({ loc: "blog-band" })}`;
  return { path: "/blog/", title: "Blog sobre fidelização de clientes", description: "Guias práticos de cartão fidelidade, programa de fidelidade, recompensas, QR Code, avaliações no Google e LGPD para pequenos negócios.", crumbs, body, jsonld: [blog], og: { key: "blog", title: "Blog", sub: "Fidelização de clientes para negócios locais" }, image: "/assets/og/blog.png" };
}

export function blogPost(p, { posts, segments }) {
  const path = `/blog/${p.slug}/`;
  const crumbs = [{ name: "Início", path: "/" }, { name: "Blog", path: "/blog/" }, { name: p.title, path }];
  const related = posts.filter((x) => x.slug !== p.slug).map((x) => ({ x, score: x.tags.filter((t) => p.tags.includes(t)).length + (x.category === p.category ? 1 : 0) })).sort((a, b) => b.score - a.score).slice(0, 3).map((r) => r.x);
  const segLinks = segments.filter((s) => (s.blog || []).includes(p.slug)).slice(0, 4);
  // CTA no meio do texto, depois do 2º título
  let html = p.html, n = 0;
  html = html.replace(/<h2 /g, (m) => (++n === 3 ? `<aside class="post-cta"><h2>Teste o cartão fidelidade digital</h2><p>Crie o cartão do seu negócio em minutos. Grátis até ${PLANS.freeClients} clientes.</p><a class="btn primary" href="${A}" data-cta="post-mid-${p.slug}">Criar meu cartão grátis</a></aside>${m}` : m));
  const toc = p.heads.filter((h) => h.lvl === 2);
  const body = `<div class="page-hero"><div class="wrap narrow" style="max-width:1160px">${crumbsHtml(crumbs)}<span class="eyebrow" style="margin-top:18px">${esc(p.category)}</span><h1 style="max-width:900px">${esc(p.title)}</h1>
  <p class="lead">${esc(p.description)}</p><div class="meta"><span>Por <a href="/sobre/">Equipe ${SITE.name}</a></span><span>Publicado em <time datetime="${p.date}">${fmtDate(p.date)}</time></span>${p.updated && p.updated !== p.date ? `<span>Atualizado em <time datetime="${p.updated}">${fmtDate(p.updated)}</time></span>` : ""}<span>${p.minutes} min de leitura</span></div></div></div>
<div class="wrap"><div class="article-grid">
  <article class="prose">${html}
    <div class="tagrow">${p.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
    ${segLinks.length ? `<p style="margin-top:28px"><strong>Para o seu segmento:</strong> ${segLinks.map((s) => `<a href="/cartao-fidelidade/${s.slug}/">${esc(s.title.toLowerCase())}</a>`).join(" · ")}</p>` : ""}
  </article>
  <aside class="toc" aria-label="Neste artigo"><h2>Neste artigo</h2><ol>${toc.map((h) => `<li><a href="#${h.id}">${esc(h.text)}</a></li>`).join("")}</ol><a class="btn primary sm" href="${A}" data-cta="post-toc-${p.slug}">Criar cartão grátis</a></aside>
</div></div>
<section class="sec alt"><div class="wrap"><h2 class="sec-h">Continue lendo</h2><div class="grid g3" style="margin-top:28px">${related.map(postCard).join("")}</div></div></section>
${ctaBand({ loc: "post-band-" + p.slug })}`;
  const nodes = [ld.article({ ...p, path, image: `/assets/og/post-${p.slug}.png` })];
  if (p.faq.length) nodes.push(ld.faq(p.faq));
  return { path, title: p.seo || p.title, ogTitle: p.title, description: p.description, crumbs, body, type: "article", article: p, jsonld: nodes, og: { key: "post-" + p.slug, title: p.title, sub: p.category }, image: `/assets/og/post-${p.slug}.png` };
}

/* ============================================================== LEGAL */
export function legalPage(doc) {
  const path = `/${doc.slug}/`, crumbs = [{ name: "Início", path: "/" }, { name: doc.title, path }];
  const body = `<div class="page-hero"><div class="wrap narrow">${crumbsHtml(crumbs)}<h1 style="margin-top:14px">${esc(doc.title)}</h1></div></div>
<section class="sec" style="padding-top:10px"><div class="wrap narrow prose">${doc.html}</div></section>`;
  return { path, title: doc.title, description: doc.description, crumbs, body, og: { key: doc.slug, title: doc.title, sub: SITE.name }, image: "/assets/og/default.png", stickyCta: false };
}

/* ============================================================== SOBRE, CONTATO, OBRIGADO, 404 */
export function about() {
  const crumbs = [{ name: "Início", path: "/" }, { name: "Sobre", path: "/sobre/" }];
  const body = `<div class="page-hero"><div class="wrap narrow">${crumbsHtml(crumbs)}<h1 style="margin-top:14px">Sobre o ${SITE.name}</h1>
  <p class="lead">Fazemos o cartão fidelidade digital para quem atende no balcão: cafeterias, padarias, salões, barbearias, pet shops e outros negócios de bairro.</p></div></div>
<section class="sec" style="padding-top:10px"><div class="wrap narrow prose">
<h2>Por que existimos</h2>
<p>O cartão de carimbos de papel é uma das ferramentas de marketing mais antigas e eficientes do comércio local. Ele só tem um problema: não diz ao dono quem são os clientes fiéis. Criamos o ${SITE.name} para manter a simplicidade do carimbo e acrescentar o que faltava: saber quem volta, chamar quem sumiu e medir se a recompensa vale a pena.</p>
<h2>No que acreditamos</h2>
<ul><li><strong>Simples para o cliente:</strong> sem aplicativo, sem senha, sem papel.</li><li><strong>Rápido para a equipe:</strong> carimbar precisa levar segundos, no meio do movimento.</li><li><strong>Os dados são do negócio:</strong> o dono pode exportar a lista de clientes quando quiser.</li><li><strong>Privacidade de verdade:</strong> cadastro com finalidade clara e consentimento separado para ofertas, pensado para a LGPD.</li><li><strong>Preço justo:</strong> grátis para começar, mensalidade simples quando o cartão crescer.</li></ul>
<h2>Quem está por trás</h2>
<p>O ${SITE.name} é operado por ${isTodo(COMPANY.legalName) ? `<mark class="todo">${esc(COMPANY.legalName)}</mark>` : esc(COMPANY.legalName)}${isTodo(COMPANY.cnpj) ? "" : `, CNPJ ${esc(COMPANY.cnpj)}`}${isTodo(COMPANY.city) ? "" : `, em ${esc(COMPANY.city)}`}. Fale com a gente pela página de <a href="/contato/">contato</a>.</p>
</div></section>
${ctaBand({ loc: "sobre-band" })}`;
  return { path: "/sobre/", title: "Sobre nós", description: `Conheça o ${SITE.name}: cartão fidelidade digital simples para negócios locais, com privacidade e preço justo.`, crumbs, body, jsonld: [{ "@type": "AboutPage", url: abs("/sobre/"), about: { "@id": SITE.url + "/#org" } }], og: { key: "sobre", title: "Sobre nós", sub: "Cartão fidelidade digital para negócios locais" }, image: "/assets/og/sobre.png" };
}

export function contact({ segments }) {
  const crumbs = [{ name: "Início", path: "/" }, { name: "Contato", path: "/contato/" }];
  const mail = isTodo(COMPANY.email) ? "" : COMPANY.email, wa = COMPANY.whatsapp;
  const body = `<div class="page-hero"><div class="wrap">${crumbsHtml(crumbs)}<h1 style="margin-top:14px">Fale com a gente</h1>
  <p class="lead">Tire dúvidas, peça uma demonstração ou conte o que o seu negócio precisa. Respondemos em horário comercial.</p></div></div>
<section class="sec" style="padding-top:10px"><div class="wrap split" style="align-items:start">
  <form class="form" data-lead="contato" novalidate>
    <div><label for="f-name">Seu nome</label><input id="f-name" name="name" required minlength="2" maxlength="120" autocomplete="name"></div>
    <div><label for="f-email">E-mail</label><input id="f-email" name="email" type="email" required maxlength="160" autocomplete="email"></div>
    <div><label for="f-phone">WhatsApp (opcional)</label><input id="f-phone" name="phone" type="tel" maxlength="30" autocomplete="tel" inputmode="tel" placeholder="(00) 00000-0000"></div>
    <div><label for="f-business">Nome do negócio (opcional)</label><input id="f-business" name="business" maxlength="120" autocomplete="organization"></div>
    <div><label for="f-seg">Segmento</label><select id="f-seg" name="segment"><option value="">Escolha</option>${segments.map((s) => `<option>${esc(s.name)}</option>`).join("")}<option>Outro</option></select></div>
    <div><label for="f-msg">Mensagem</label><textarea id="f-msg" name="message" maxlength="2000" placeholder="Como podemos ajudar?"></textarea></div>
    <div class="hp" aria-hidden="true"><label for="f-web">Não preencha</label><input id="f-web" name="website" tabindex="-1" autocomplete="off"></div>
    <label class="check"><input type="checkbox" name="consent" value="1" required> <span>Concordo que o ${SITE.name} use estes dados para responder ao meu contato, conforme a <a href="/privacidade/">Política de Privacidade</a>.</span></label>
    <div class="form-msg" role="alert" hidden></div>
    <button class="btn primary lg" type="submit">Enviar mensagem</button>
  </form>
  <div class="card"><h2 style="font-size:1.3rem">Outros canais</h2>
    <p style="margin-top:10px">${mail ? `E-mail: <a href="mailto:${esc(mail)}">${esc(mail)}</a>` : `E-mail de contato: <mark class="todo">${esc(COMPANY.email)}</mark>`}</p>
    ${wa ? `<p><a class="btn" href="https://wa.me/${esc(wa)}" target="_blank" rel="noopener noreferrer" data-cta="contato-whatsapp">Falar no WhatsApp</a></p>` : ""}
    <p class="fine" style="margin-top:14px">Quer ver na prática? <a href="${A}" data-cta="contato-teste">Crie um cartão grátis</a> e teste com o seu celular.</p>
    <p class="fine">Pedidos sobre dados pessoais: veja <a href="/lgpd/">seus direitos (LGPD)</a>.</p></div>
</div></section>`;
  return { path: "/contato/", title: "Contato", description: `Fale com o ${SITE.name}: dúvidas, demonstração e suporte para o cartão fidelidade digital do seu negócio.`, crumbs, body, jsonld: [{ "@type": "ContactPage", url: abs("/contato/"), about: { "@id": SITE.url + "/#org" } }], og: { key: "contato", title: "Fale com a gente", sub: SITE.name }, image: "/assets/og/default.png", stickyCta: false };
}

export function thanks() {
  const body = `<section class="sec"><div class="wrap narrow center">${E3D("party-popper", "e3d", "")}<h1 style="margin-top:16px">Mensagem recebida!</h1><p class="lead" style="margin:18px auto">Obrigado pelo contato. Vamos responder no e-mail informado em breve.</p>
<p>Enquanto isso, que tal criar o seu cartão e testar no seu celular?</p><p style="margin-top:24px"><a class="btn primary lg" href="${A}" data-cta="obrigado">Criar meu cartão grátis ${ICON.arrow}</a></p><p style="margin-top:18px"><a href="/blog/">Ler o blog</a> · <a href="/">Voltar ao início</a></p></div></section>`;
  return { path: "/obrigado/", title: "Obrigado", description: "Recebemos sua mensagem. Enquanto isso, crie o seu cartão fidelidade digital grátis e teste no seu celular.", body, noindex: true, stickyCta: false, image: "/assets/og/default.png" };
}

export function notFound() {
  const body = `<section class="sec"><div class="wrap narrow center">${E3D("magnifying-glass-tilted-left", "e3d", "")}<h1 style="margin-top:16px">Página não encontrada</h1><p class="lead" style="margin:18px auto">O endereço pode ter mudado. Veja alguns caminhos:</p>
<p><a class="btn primary" href="/">Página inicial</a> <a class="btn" href="/blog/">Blog</a> <a class="btn" href="/precos/">Preços</a></p></div></section>`;
  return { path: "/404.html", title: "Página não encontrada", description: "Esta página não existe ou mudou de endereço. Veja o cartão fidelidade digital, os preços e o blog.", body, noindex: true, stickyCta: false, image: "/assets/og/default.png" };
}
