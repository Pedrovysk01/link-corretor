// Gera o site completo em dist/: site de marketing (raiz) + painel (dist/app/).
// Uso:  node tools/build-site.mjs            (gera)
//       node tools/build-site.mjs --check    (gera e valida SEO, links internos, JSON-LD; sai com 1 se houver erro)
// Sem dependências. A Vercel roda este comando (vercel.json → buildCommand) e publica dist/.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createHash } from "node:crypto";
import { ROOT, SITE, PLANS, COMPANY, todos, isTodo } from "../site/src/config.mjs";
import { frontMatter, render, esc } from "../site/src/md.mjs";
import { page, fillCompany, abs } from "../site/src/layout.mjs";
import * as P from "../site/src/pages.mjs";
import { screensV2 } from "../site/src/screens-v2.mjs";

const DIST = path.join(ROOT, "dist"), SRC = path.join(ROOT, "site");
const CHECK = process.argv.includes("--check");
const rd = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const json = (p) => JSON.parse(rd(p));

// ---------------------------------------------------------------- conteúdo
const faq = json("site/content/faq.json");
const segments = json("site/content/segments.json");
const posts = fs.readdirSync(path.join(SRC, "content/blog")).filter((f) => f.endsWith(".md")).map((f) => {
  const { meta, body } = frontMatter(rd(`site/content/blog/${f}`)), r = render(body);
  return { slug: f.replace(/\.md$/, ""), title: meta.title, seo: meta.seo, description: meta.description, category: meta.category || "Guias", tags: [].concat(meta.tags || []),
    date: meta.date || SITE.today, updated: meta.updated || meta.date || SITE.today, html: r.html, heads: r.heads, faq: r.faq, words: r.words, minutes: Math.max(3, Math.round(r.words / 200)), md: body };
}).sort((a, b) => (b.date + b.title > a.date + a.title ? 1 : -1));
// ordem editorial do blog (pilar primeiro)
const ORDER = ["cartao-fidelidade-digital", "como-criar-programa-de-fidelidade", "quantos-carimbos-cartao-fidelidade", "fidelizar-clientes-estrategias", "cartao-fidelidade-papel-ou-digital", "qr-code-no-balcao", "pedir-avaliacoes-no-google", "roi-programa-de-fidelidade", "lgpd-cartao-fidelidade"];
const ord = (p) => { const i = ORDER.indexOf(p.slug); return i < 0 ? 999 : i; };
posts.sort((a, b) => ord(a) - ord(b));

const T = (() => { const ctx = { window: {} }; try { vm.runInNewContext(rd("site/assets/js/tracking-config.js"), ctx); } catch {} return ctx.window.CF_TRACK || {}; })();
const hasTrackers = Object.values(T).some(Boolean);
const legal = ["privacidade", "termos", "cookies", "lgpd"].map((slug) => {
  const { meta, body } = frontMatter(rd(`site/content/legal/${slug}.md`)); let html = render(body).html;
  html = fillCompany(html).replace(/\{\{today\}\}/g, new Date(SITE.today + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" }))
    .replace(/<p>\{\{consentButton\}\}<\/p>/, hasTrackers ? `<p><button type="button" class="btn" data-consent-open>Preferências de cookies</button></p>` : `<div class="answer"><strong>Neste momento</strong> este site não usa cookies de estatística nem de marketing: nenhuma ferramenta de terceiros está ativada.</div>`);
  return { slug, title: meta.title, description: meta.description, html };
});

// ---------------------------------------------------------------- páginas
const ctx = { faq, segments, posts };
const pages = [P.homeV2(ctx), P.howItWorks(ctx), P.features(ctx), P.pricing(ctx), P.faqPage(ctx), P.segmentsHub(ctx), ...segments.map((s) => P.segmentPage(s, ctx)),
  P.blogIndex(ctx), ...posts.map((p) => P.blogPost(p, ctx)), ...legal.map(P.legalPage), P.about(ctx), P.contact(ctx), P.thanks(ctx), P.notFound(ctx)];
{ const skinned = screensV2(pages), home = pages.find((p) => p.path === "/"); pages.splice(0, pages.length, home, ...skinned); }   // visual v2 em todas as páginas

// ---------------------------------------------------------------- saída
fs.rmSync(DIST, { recursive: true, force: true });
const copyDir = (from, to, skip = () => false) => {
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, e.name), b = path.join(to, e.name);
    if (skip(a, e)) continue;
    if (e.isDirectory()) copyDir(a, b, skip); else fs.copyFileSync(a, b);
  }
};
copyDir(path.join(SRC, "assets"), path.join(DIST, "assets"));
if (fs.existsSync(path.join(SRC, "static"))) copyDir(path.join(SRC, "static"), DIST); // favicon.ico etc. na raiz
copyDir(path.join(ROOT, "app"), path.join(DIST, "app"), (a, e) => /\.(md)$/i.test(e.name));
// ?v= de cada script/estilo do painel = impressão digital do CONTEÚDO do arquivo. Assim o navegador (e o Vercel) podem guardar
// os arquivos por dias e, quando um arquivo muda, o endereço muda junto: ninguém fica com versão velha, e ninguém precisa trocar ?v= à mão.
{
  const appDist = path.join(DIST, "app"), h8 = (f) => createHash("md5").update(fs.readFileSync(f)).digest("hex").slice(0, 8);
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  const files = walk(appDist), isUrl = (u) => /^(https?:)?\/\//.test(u);
  for (const f of files.filter((x) => x.endsWith(".css"))) {   // @import "x.css?v=…" dentro dos estilos
    const c = fs.readFileSync(f, "utf8"), n = c.replace(/(@import\s+url\(["']?)([^"')?]+)\?v=[^"')]*(["']?\))/g, (m, x, u, z) => { const t = path.resolve(path.dirname(f), u); return !isUrl(u) && fs.existsSync(t) ? `${x}${u}?v=${h8(t)}${z}` : m; });
    if (n !== c) fs.writeFileSync(f, n);
  }
  for (const f of files.filter((x) => x.endsWith(".html"))) {  // <script src> e <link href> nas páginas
    const c = fs.readFileSync(f, "utf8"), n = c.replace(/((?:src|href)=["'])([^"'#?]+\.(?:js|css))\?v=[^"']*(["'])/g, (m, x, u, z) => { if (isUrl(u)) return m; const t = u.startsWith("/") ? path.join(DIST, u) : path.resolve(path.dirname(f), u); return fs.existsSync(t) ? `${x}${u}?v=${h8(t)}${z}` : m; });
    if (n !== c) fs.writeFileSync(f, n);
  }
}
const out = (p, s) => { const f = path.join(DIST, p.endsWith(".html") || /\.[a-z0-9]+$/i.test(p) ? p : path.join(p, "index.html")); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s); };
for (const pg of pages) out(pg.path, page(pg));
// home da versão 1 (antiga), só para consulta em /v1/: fora do sitemap e sem indexação
out("/v1/", page({ ...P.home(), path: "/v1/", noindex: true }));
// endereços antigos /v2/... (período de testes) levam para a página de sempre
for (const pg of pages) if (pg.path !== "/404.html") out("/v2" + (pg.path === "/" ? "/" : pg.path), `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=${pg.path}"><link rel="canonical" href="${SITE.url}${pg.path}"><title>${SITE.name}</title><script>location.replace(${JSON.stringify(pg.path)}+location.search+location.hash)</script></head><body><a href="${pg.path}">${SITE.name}</a></body></html>`);

// configuração pública do site (URL e chave anon do Supabase saem do painel: um lugar só)
const sb = (() => { const c = { window: {} }; try { vm.runInNewContext(rd("app/assets/js/supabase-config.js"), c); } catch {} return c.window.CF_SUPABASE || {}; })();
out("assets/js/site-config.js", `/* gerado por tools/build-site.mjs — chave anon é pública por desenho (segurança no banco/RLS) */\nwindow.CF_SITE=${JSON.stringify({ supabaseUrl: sb.url || "", anonKey: sb.anonKey || "", contactEmail: isTodo(COMPANY.email) ? "" : COMPANY.email, version: SITE.version })};\n`);

// sitemap
const idx = pages.filter((p) => !p.noindex && p.path !== "/404.html");
const lastmod = (p) => (p.article ? p.article.updated || p.article.date : SITE.today);
out("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${idx.map((p) => `<url><loc>${abs(p.path)}</loc><lastmod>${lastmod(p)}</lastmod>${p.image ? `<image:image><image:loc>${abs(p.image)}</image:loc></image:image>` : ""}</url>`).join("\n")}\n</urlset>\n`);

// robots: tudo liberado (inclusive buscadores de IA), menos o painel e as páginas dos negócios
const AI = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended", "Bingbot", "CCBot"];
out("robots.txt", `# ${SITE.name}\nUser-agent: *\nAllow: /\nDisallow: /app/\nDisallow: /obrigado/\n\n# Buscadores e assistentes de IA: o conteúdo público pode ser lido e citado (veja /llms.txt)\n${AI.map((a) => `User-agent: ${a}\nAllow: /\nDisallow: /app/\n`).join("\n")}\nSitemap: ${abs("/sitemap.xml")}\n`);

// llms.txt (padrão llmstxt.org) + llms-full.txt (texto completo para IAs)
const strip = (h) => h.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/[ \t]+/g, " ").replace(/\s*\n\s*/g, "\n").trim();
const allFaq = P.faqItems(faq);
out("llms.txt", `# ${SITE.name}

> ${SITE.name} é um cartão fidelidade digital para negócios locais no Brasil (cafeterias, padarias, salões, barbearias, pet shops, restaurantes e outros). O cliente entra lendo um QR Code, sem baixar aplicativo, recebe um carimbo a cada compra e ganha uma recompensa ao completar o cartão. O negócio acompanha tudo em um painel web. Plano Free gratuito até ${PLANS.freeClients} clientes; plano Pro por R$ ${PLANS.proPrice}/mês até ${PLANS.proClients} clientes; ${PLANS.trialDays} dias de teste dos recursos Pro.

Fatos principais:
- Cliente não precisa de aplicativo: o cartão abre no navegador do celular pelo QR Code ou link.
- Carimbo pelo painel (busca por nome/telefone) ou lendo o QR do cartão do cliente; o último carimbo pode ser desfeito.
- Cartão de 4 a 16 carimbos, com logotipo, cores e fundos por segmento e datas comemorativas.
- Página do negócio no mesmo QR: cardápio, catálogo, novidades com imagem, WhatsApp, Wi-Fi, links e ficha do Google.
- Campanhas com prazo exibidas no cartão, oferta de aniversário, pesquisas de satisfação e convite para avaliar no Google (sem incentivo por avaliação).
- LGPD: o negócio é controlador dos dados dos seus clientes; o ${SITE.name} atua como operador. Consentimento para ofertas é separado e opcional.

## Produto
- [Como funciona](${abs("/como-funciona/")}): passo a passo do cadastro ao resgate da recompensa
- [Recursos](${abs("/recursos/")}): lista completa de recursos Free e Pro
- [Preços](${abs("/precos/")}): planos Free e Pro, teste e cobrança
- [Perguntas frequentes](${abs("/faq/")})

## Cartão fidelidade por segmento
${segments.map((s) => `- [${s.title}](${abs(`/cartao-fidelidade/${s.slug}/`)}): ${s.answer}`).join("\n")}

## Guias (blog)
${posts.map((p) => `- [${p.title}](${abs(`/blog/${p.slug}/`)}): ${p.description}`).join("\n")}

## Políticas
- [Política de Privacidade](${abs("/privacidade/")})
- [Termos de Uso](${abs("/termos/")})
- [Seus direitos (LGPD)](${abs("/lgpd/")})

## Optional
- [Texto completo para assistentes de IA](${abs("/llms-full.txt")})
`);
out("llms-full.txt", [`# ${SITE.name} — conteúdo completo\nFonte: ${SITE.url}/ · Atualizado em ${SITE.today}\n`,
  `## Perguntas frequentes\n\n${allFaq.map((f) => `### ${f.q}\n${f.a}`).join("\n\n")}`,
  ...segments.map((s) => `## ${s.title}\nURL: ${abs(`/cartao-fidelidade/${s.slug}/`)}\n\n${s.answer}\n\n${s.intro}\n\nIdeias de recompensa: ${s.rewards.join("; ")}.\nQuantos carimbos: ${s.stamps}\n\n${s.faq.map((f) => `### ${f.q}\n${f.a}`).join("\n\n")}`),
  ...posts.map((p) => `## ${p.title}\nURL: ${abs(`/blog/${p.slug}/`)}\n\n${p.md.trim()}`)].join("\n\n---\n\n") + "\n");

// manifesto (atalho na tela inicial do Android/Chrome)
out("site.webmanifest", JSON.stringify({ name: SITE.name, short_name: SITE.short, lang: SITE.lang, start_url: "/", display: "standalone", background_color: "#FFFAF3", theme_color: SITE.themeColor,
  icons: [{ src: "/assets/img/icon-192.png", sizes: "192x192", type: "image/png" }, { src: "/app/assets/img/favicon.svg", sizes: "any", type: "image/svg+xml" }] }, null, 1));

// RSS
const x = (s) => esc(s);
out("blog/feed.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>\n<title>Blog ${x(SITE.name)}</title><link>${abs("/blog/")}</link><description>Fidelização de clientes para negócios locais</description><language>pt-BR</language>\n<atom:link href="${abs("/blog/feed.xml")}" rel="self" type="application/rss+xml"/>\n${posts.map((p) => `<item><title>${x(p.title)}</title><link>${abs(`/blog/${p.slug}/`)}</link><guid>${abs(`/blog/${p.slug}/`)}</guid><pubDate>${new Date(p.date + "T12:00:00Z").toUTCString()}</pubDate><description>${x(p.description)}</description></item>`).join("\n")}\n</channel></rss>\n`);

// segurança: contato para quem encontrar falhas (só com e-mail definido)
if (!isTodo(COMPANY.email)) out(".well-known/security.txt", `Contact: mailto:${COMPANY.email}\nExpires: ${new Date(Date.now() + 365 * 864e5).toISOString()}\nPreferred-Languages: pt, en\nCanonical: ${abs("/.well-known/security.txt")}\n`);

// lista para gerar as imagens de compartilhamento (tools/make-site-images.py)
out("og-list.json", JSON.stringify(pages.filter((p) => p.og && !p.path.startsWith('/v2/')).map((p) => ({ key: p.og.key, title: p.og.title, sub: p.og.sub, file: (p.image || "").replace(/^\//, "") })), null, 1));

console.log(`site: ${pages.length} páginas, ${posts.length} artigos, ${segments.length} segmentos → dist/  (SITE_URL=${SITE.url})`);
const pend = todos(); if (pend.length) console.log(`ATENÇÃO — dados da empresa pendentes (aparecem destacados nas páginas legais): ${pend.join(", ")}. Defina em site/src/config.mjs ou por variável de ambiente (CF_LEGAL_NAME, CF_CNPJ, CF_EMAIL…).`);
if (!hasTrackers) console.log("Anúncios/métricas: nenhum ID em site/assets/js/tracking-config.js (o aviso de cookies só aparece quando houver).");

// ---------------------------------------------------------------- validação
if (CHECK) {
  const errs = [], warn = [], titles = new Map(), descs = new Map();
  const exists = (href) => { const u = href.split("#")[0].split("?")[0]; if (!u || u === "/") return fs.existsSync(path.join(DIST, "index.html")); const f = path.join(DIST, decodeURIComponent(u)); return fs.existsSync(f) && fs.statSync(f).isFile() || fs.existsSync(path.join(f, "index.html")); };
  for (const pg of pages) {
    const f = pg.path.endsWith(".html") ? pg.path.replace(/^\//, "") : pg.path.replace(/^\//, "") + "index.html", html = fs.readFileSync(path.join(DIST, f), "utf8");
    const title = (/<title>([\s\S]*?)<\/title>/.exec(html) || [])[1] || "", desc = (/<meta name="description" content="([^"]*)"/.exec(html) || [])[1] || "";
    const h1 = (html.match(/<h1[\s>]/g) || []).length;
    if (!title) errs.push(`${pg.path}: sem <title>`); else if (title.length > 70) warn.push(`${pg.path}: título com ${title.length} caracteres (ideal ≤ 60–65)`);
    if (!pg.noindex) { if (titles.has(title)) errs.push(`${pg.path}: título repetido com ${titles.get(title)}`); titles.set(title, pg.path); if (descs.has(desc)) errs.push(`${pg.path}: descrição repetida com ${descs.get(desc)}`); descs.set(desc, pg.path); }
    if (desc.length < 50 || desc.length > 170) warn.push(`${pg.path}: descrição com ${desc.length} caracteres (ideal 70–160)`);
    if (h1 !== 1) errs.push(`${pg.path}: ${h1} <h1> (precisa de 1)`);
    if (!/<link rel="canonical"/.test(html)) errs.push(`${pg.path}: sem canonical`);
    for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) { try { JSON.parse(m[1]); } catch (e) { errs.push(`${pg.path}: JSON-LD inválido`); } }
    for (const m of html.matchAll(/<img\b[^>]*>/g)) if (!/\balt="/.test(m[0])) errs.push(`${pg.path}: imagem sem alt: ${m[0].slice(0, 80)}`);
    for (const m of html.matchAll(/\shref="(\/[^"]*)"/g)) { const h = m[1]; if (h.startsWith("/app/")) continue; if (!exists(h)) errs.push(`${pg.path}: link quebrado ${h}`); }
    for (const m of html.matchAll(/\ssrc="(\/[^"]*)"/g)) { if (!exists(m[1])) (m[1].startsWith("/assets/og/") || m[1].startsWith("/assets/img/") ? warn : errs).push(`${pg.path}: arquivo ausente ${m[1]}`); }
    for (const m of html.matchAll(/href="#([^"]+)"/g)) if (!new RegExp(`id="${m[1]}"`).test(html)) errs.push(`${pg.path}: âncora #${m[1]} não existe`);
  }
  const uniqWarn = [...new Set(warn)];
  if (uniqWarn.length) console.log("AVISOS:\n  " + uniqWarn.slice(0, 40).join("\n  ") + (uniqWarn.length > 40 ? `\n  … +${uniqWarn.length - 40}` : ""));
  if (errs.length) { console.log("ERROS:\n  " + errs.join("\n  ")); process.exit(1); }
  console.log(`ok — ${pages.length} páginas validadas (títulos, descrições, h1, canonical, JSON-LD, imagens com alt, links e âncoras internas)`);
}
