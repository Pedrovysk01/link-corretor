// Estrutura comum das páginas: <head> com SEO completo, cabeçalho, rodapé, consentimento e JSON-LD.
import { SITE, COMPANY, NAV, FOOTER, isTodo } from "./config.mjs";
import { esc } from "./md.mjs";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

export const abs = (p) => (/^https?:\/\//.test(p) ? p : SITE.url + (p.startsWith("/") ? p : "/" + p));
// O nome E3D é mantido para compatibilidade dos conteúdos; a saída agora é SVG.
const glyphScope = { window: {} };
runInNewContext(readFileSync(new URL('../../app/assets/js/card-themes.js', import.meta.url), 'utf8'), glyphScope);
const motifAliases = {'hot-beverage':'cup','fork-and-knife-with-plate':'utensils','soft-ice-cream':'ice-cream-cone','flexed-biceps':'dumbbell','automobile':'car-front','dog-face':'paw-print','t-shirt':'shirt','wrapped-gift':'gift','magnifying-glass-tilted-left':'search','busts-in-silhouette':'users','mobile-phone':'smartphone','bar-chart':'chart-column','gear':'settings','money-bag':'wallet','label':'tag','sparkles':'star'};
export const E3D = (n, cls = 'e3d', alt = '') => glyphScope.window.CFThemes.stampSvg(motifAliases[n] || n).replace('class="cf-stamp-glyph"', `class="${esc(cls)}" width="64" height="64"${alt ? ` role="img" aria-label="${esc(alt)}"` : ''}`).replace('aria-hidden="true"', alt ? '' : 'aria-hidden="true"');
export const ICON = {
  check: `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  arrow: `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  menu: `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`,
};

// {{company.x}} nas páginas legais; valores pendentes saem destacados
export const fillCompany = (html) => html.replace(/\{\{company\.(\w+)\}\}/g, (_, k) => { const v = COMPANY[k] ?? ""; return isTodo(v) ? `<mark class="todo">${esc(v)}</mark>` : esc(v); });

/* ------------------------------------------------------------ JSON-LD */
export const ld = {
  org: () => ({
    "@type": "Organization", "@id": SITE.url + "/#org", name: SITE.name, url: SITE.url + "/", logo: { "@type": "ImageObject", url: abs("/app/assets/img/seucliente-logo.svg") },
    ...(isTodo(COMPANY.legalName) ? {} : { legalName: COMPANY.legalName }),
    ...(isTodo(COMPANY.email) ? {} : { email: COMPANY.email, contactPoint: [{ "@type": "ContactPoint", contactType: "customer support", email: COMPANY.email, availableLanguage: ["pt-BR"] }] }),
    ...(Object.values(COMPANY.social).filter(Boolean).length ? { sameAs: Object.values(COMPANY.social).filter(Boolean) } : {}),
  }),
  site: () => ({ "@type": "WebSite", "@id": SITE.url + "/#website", url: SITE.url + "/", name: SITE.name, inLanguage: SITE.lang, publisher: { "@id": SITE.url + "/#org" } }),
  crumbs: (items) => ({ "@type": "BreadcrumbList", itemListElement: items.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: abs(c.path) })) }),
  faq: (items) => ({ "@type": "FAQPage", mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }),
  app: (plans) => ({
    "@type": "SoftwareApplication", "@id": SITE.url + "/#app", name: SITE.name, applicationCategory: "BusinessApplication", operatingSystem: "Web, iOS, Android (navegador)",
    description: "Cartão fidelidade digital com carimbos, QR Code, painel do dono, campanhas e página do negócio para o cliente.", url: SITE.url + "/", inLanguage: SITE.lang,
    offers: [{ "@type": "Offer", name: "Free", price: "0", priceCurrency: "BRL", description: `Até ${plans.freeClients} clientes` }, { "@type": "Offer", name: "Pro", price: String(plans.proPrice), priceCurrency: "BRL", description: `Até ${plans.proClients} clientes, por mês`, priceSpecification: { "@type": "UnitPriceSpecification", price: String(plans.proPrice), priceCurrency: "BRL", unitCode: "MON" } }],
    publisher: { "@id": SITE.url + "/#org" },
  }),
  article: (a) => ({
    "@type": "BlogPosting", "@id": abs(a.path) + "#article", headline: a.title, description: a.description, inLanguage: SITE.lang, datePublished: a.date, dateModified: a.updated || a.date,
    mainEntityOfPage: abs(a.path), image: [abs(a.image)], author: { "@type": "Organization", name: SITE.name, url: SITE.url + "/" }, publisher: { "@id": SITE.url + "/#org" },
    keywords: (a.tags || []).join(", "), wordCount: a.words, articleSection: a.category,
  }),
  graph: (nodes) => `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": nodes.filter(Boolean) }).replace(/</g, "\\u003c")}</script>`,
};

/* ------------------------------------------------------------ página */
export function page(o) {
  const t0 = o.fullTitle || (o.title.includes(SITE.name) ? o.title : `${o.title} | ${SITE.name}`); // com a marca só se couber (≤ 65)
  const url = abs(o.path), title = o.fullTitle || (t0.length > 65 ? o.title : t0), img = abs(o.image || "/assets/og/default.png");
  const robots = o.noindex ? "noindex,follow" : "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";
  const nodes = [ld.org(), ld.site(), ...(o.jsonld || [])];
  if (o.crumbs && o.crumbs.length > 1) nodes.push(ld.crumbs(o.crumbs));
  const v = "?v=" + SITE.version;
  return `<!doctype html>
<html lang="${SITE.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(o.description)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="${robots}">
<meta name="theme-color" content="${o.themeColor || SITE.themeColor}">
<link rel="alternate" hreflang="pt-BR" href="${url}"><link rel="alternate" hreflang="x-default" href="${url}">
<link rel="alternate" type="application/rss+xml" title="Blog ${SITE.name}" href="${abs("/blog/feed.xml")}">
<link rel="icon" href="/favicon.ico" sizes="48x48"><link rel="icon" type="image/svg+xml" href="/app/assets/img/favicon.svg"><link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png"><link rel="manifest" href="/site.webmanifest">
<meta property="og:site_name" content="${SITE.name}"><meta property="og:locale" content="${SITE.locale}"><meta property="og:type" content="${o.type === "article" ? "article" : "website"}">
<meta property="og:title" content="${esc(o.ogTitle || title)}"><meta property="og:description" content="${esc(o.description)}"><meta property="og:url" content="${url}">
<meta property="og:image" content="${img}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${esc(o.imageAlt || title)}">
${o.type === "article" && o.article ? `<meta property="article:published_time" content="${o.article.date}"><meta property="article:modified_time" content="${o.article.updated || o.article.date}"><meta property="article:section" content="${esc(o.article.category || "")}">${(o.article.tags || []).map((t) => `<meta property="article:tag" content="${esc(t)}">`).join("")}` : ""}
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(o.ogTitle || title)}"><meta name="twitter:description" content="${esc(o.description)}"><meta name="twitter:image" content="${img}">
<link rel="preload" href="/app/assets/fonts/montserrat-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/css/site.css${v}">
${o.head || ""}
${ld.graph(nodes)}
<script>window.dataLayer=window.dataLayer||[];</script>
<script src="/assets/js/site-config.js${v}"></script>
<script src="/assets/js/tracking-config.js${v}"></script>
<script src="/assets/js/consent.js${v}"></script>
</head>
<body class="${o.bodyClass || ""}">
<a class="skip" href="#conteudo">Pular para o conteúdo</a>
${o.headerHtml || header(o.path)}
<main id="conteudo">
${o.body}
</main>
${o.footerHtml || footer()}
${o.stickyCta === false ? "" : `<div class="sticky-cta" data-sticky><a class="btn primary" href="${SITE.signupPath}" data-cta="sticky">Criar meu cartão grátis ${ICON.arrow}</a><button type="button" class="sticky-x" data-sticky-close aria-label="Fechar">×</button></div>`}
<div id="cf-consent" class="consent" role="dialog" aria-modal="false" aria-labelledby="cf-consent-t" hidden></div>
<script src="/assets/js/site.js${v}" defer></script>
</body>
</html>`;
}

function header(cur) {
  const links = cur === "/" ? [{href:"#como-funciona",label:"Como funciona"},{href:"#recursos",label:"Recursos"},{href:"#precos",label:"Preços"},{href:"#faq",label:"Perguntas"}] : NAV;
  const active = (h) => (cur === h || (h !== "/" && cur.startsWith(h)) ? ' aria-current="page"' : "");
  return `<header class="hdr"><div class="wrap hdr-in">
  <a class="logo" href="/" aria-label="${SITE.name}: página inicial"><img src="/app/assets/img/seucliente-logo.svg" alt="${SITE.name}" width="190" height="44"></a>
  <nav class="nav" aria-label="Principal">${links.map((n) => `<a href="${n.href}"${active(n.href)}>${n.label}</a>`).join("")}</nav>
  <div class="hdr-cta"><a class="link-entrar" href="${SITE.appPath}" data-cta="header-login">Entrar</a><a class="btn primary sm" href="${SITE.signupPath}" data-cta="header">Criar meu cartão grátis</a></div>
  <details class="nav-m"><summary aria-label="Abrir menu">${ICON.menu}</summary><div class="nav-m-box">${links.map((n) => `<a href="${n.href}">${n.label}</a>`).join("")}<a href="${SITE.appPath}" data-cta="header-login">Entrar</a><a class="btn primary" href="${SITE.signupPath}" data-cta="menu">Criar meu cartão grátis</a></div></details>
</div></header>`;
}

function footer() {
  const co = [!isTodo(COMPANY.legalName) && COMPANY.legalName, !isTodo(COMPANY.cnpj) && "CNPJ " + COMPANY.cnpj, !isTodo(COMPANY.address) && COMPANY.address].filter(Boolean).join(" · ");
  return `<footer class="ftr"><div class="wrap">
  <div class="ftr-top"><div class="ftr-brand"><img src="/app/assets/img/seucliente-logo-branco.svg" alt="${SITE.name}" width="170" height="40" loading="lazy"><p>Cartão fidelidade digital para negócios locais: o cliente guarda o cartão no celular e você acompanha tudo no painel.</p>
  <a class="btn primary" href="${SITE.signupPath}" data-cta="footer">Criar meu cartão grátis</a></div>
  ${Object.entries(FOOTER).map(([h, l]) => `<nav class="ftr-col" aria-label="${h}"><h2>${h}</h2><ul>${l.map(([href, t]) => `<li><a href="${href}">${t}</a></li>`).join("")}</ul></nav>`).join("")}</div>
  <div class="ftr-bot"><p>© ${new Date().getFullYear()} ${SITE.name}.${co ? " " + esc(co) + "." : ""} Feito no Brasil.</p><p><a href="/privacidade/">Privacidade</a> · <a href="/termos/">Termos</a> · <a href="/cookies/">Cookies</a> · <button type="button" class="linklike" data-consent-open>Preferências de cookies</button></p></div>
</div></footer>`;
}

/* ------------------------------------------------------------ blocos reutilizáveis */
export const faqBlock = (items, { title = "Perguntas frequentes", id = "faq", lead = "" } = {}) => `<section class="sec" id="${id}"><div class="wrap narrow"><h2 class="sec-h">${esc(title)}</h2>${lead ? `<p class="sec-lead">${lead}</p>` : ""}
<div class="faq">${items.map((f) => `<details data-faq><summary>${esc(f.q)}</summary><div class="faq-a"><p>${f.aHtml || esc(f.a)}</p></div></details>`).join("")}</div></div></section>`;

export const ctaBand = (o = {}) => `<section class="band"><div class="wrap band-in"><div><h2>${o.title || "Crie seu cartão fidelidade em poucos minutos"}</h2><p>${o.text || "Grátis até 30 clientes. Teste o plano Pro por 21 dias, sem pagar nada para começar."}</p></div><a class="btn primary lg" href="${SITE.signupPath}" data-cta="${o.loc || "band"}">Criar meu cartão grátis ${ICON.arrow}</a></div></section>`;

export const crumbsHtml = (items) => items.length < 2 ? "" : `<nav class="crumbs" aria-label="Você está em"><ol>${items.map((c, i) => `<li>${i < items.length - 1 ? `<a href="${c.path}">${esc(c.name)}</a>` : `<span aria-current="page">${esc(c.name)}</span>`}</li>`).join("")}</ol></nav>`;
