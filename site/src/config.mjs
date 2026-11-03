// Configuração central do site de marketing. Troque aqui (ou por variável de ambiente) e rode `node tools/build-site.mjs`.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

const read = (p) => { try { return fs.readFileSync(path.join(ROOT, p), "utf8"); } catch { return ""; } };

// preços e limites: única fonte de verdade é o painel (app/assets/js/core.js → CF.config)
const core = read("app/assets/js/core.js");
const num = (re, d) => { const m = re.exec(core); return m ? Number(m[1]) : d; };
export const PLANS = {
  freeClients: num(/freeClientLimit:\s*(\d+)/, 30),
  proClients: num(/paidClientLimit:\s*(\d+)/, 3000),
  proPrice: num(/pro:\s*(\d+)/, 79),
  proAnnual: num(/proYear:\s*(\d+)/, 708),
  trialDays: num(/trialDays:\s*(\d+)/, 21),
};
PLANS.proAnnualMonthly = Math.round(PLANS.proAnnual / 12); // plano anual = R$ 59/mês cobrado por 12 meses (igual ao painel)

export const SITE = {
  url: (process.env.SITE_URL || "https://seuclientefiel.com.br").replace(/\/$/, ""),
  name: "Seu Cliente Fiel",
  short: "Cliente Fiel",
  tagline: "Cartão fidelidade digital para negócios locais",
  lang: "pt-BR",
  locale: "pt_BR",
  themeColor: "#F26716",
  appPath: "/app/",              // "Entrar": abre o painel no login
  signupPath: "/app/?criar=1",   // chamadas "Criar meu cartão" / "Começar grátis": abre o painel já em "Criar conta"
  today: new Date().toISOString().slice(0, 10),
  version: new Date().toISOString().replace(/\D/g, "").slice(0, 12), // cache-bust dos arquivos do site
};

// ---- DADOS DA EMPRESA (obrigatórios nas páginas legais). Valores entre [colchetes] são PENDENTES e aparecem em destaque nas páginas.
export const COMPANY = {
  legalName: process.env.CF_LEGAL_NAME || "Pedro Antunes Cunha Campos",
  cnpj: process.env.CF_CNPJ || "18.494.871/0001-74",
  address: process.env.CF_ADDRESS || "Bairro Meia Praia, CEP 88220-000",
  city: process.env.CF_CITY || "Itapema/SC",
  email: process.env.CF_EMAIL || "contato@seuclientefiel.com.br",
  privacyEmail: process.env.CF_PRIVACY_EMAIL || "contato@seuclientefiel.com.br",
  dpoName: process.env.CF_DPO_NAME || "[NOME DO ENCARREGADO — PREENCHER]",
  paymentProvider: process.env.CF_PAYMENT_PROVIDER || "[PROVEDOR DE PAGAMENTO — DEFINIR, ex.: Stripe, Mercado Pago, Asaas]",
  whatsapp: process.env.CF_WHATSAPP || "", // só dígitos com DDI/DDD, ex.: 5548999999999 (vazio = não mostra botão)
  social: { instagram: process.env.CF_INSTAGRAM || "", youtube: process.env.CF_YOUTUBE || "", linkedin: process.env.CF_LINKEDIN || "" },
};
export const isTodo = (v) => /^\[.*\]$/.test(String(v || "").trim());
export const todos = () => Object.entries(COMPANY).filter(([, v]) => typeof v === "string" && isTodo(v)).map(([k]) => k);

export const NAV = [
  { href: "/como-funciona/", label: "Como funciona" },
  { href: "/recursos/", label: "Recursos" },
  { href: "/cartao-fidelidade/", label: "Para o seu negócio" },
  { href: "/precos/", label: "Preços" },
  { href: "/blog/", label: "Blog" },
];

export const FOOTER = {
  Produto: [["/como-funciona/", "Como funciona"], ["/recursos/", "Recursos"], ["/precos/", "Preços"], ["/faq/", "Perguntas frequentes"], ["/app/", "Entrar no painel"]],
  "Para o seu negócio": [["/cartao-fidelidade/", "Todos os segmentos"], ["/cartao-fidelidade/cafeteria/", "Cafeteria"], ["/cartao-fidelidade/salao-de-beleza/", "Salão de beleza"], ["/cartao-fidelidade/barbearia/", "Barbearia"], ["/cartao-fidelidade/pet-shop/", "Pet shop"]],
  Conteúdo: [["/blog/", "Blog"], ["/blog/cartao-fidelidade-digital/", "O que é cartão fidelidade digital"], ["/blog/como-criar-programa-de-fidelidade/", "Como criar um programa de fidelidade"], ["/blog/feed.xml", "RSS"]],
  Empresa: [["/sobre/", "Sobre"], ["/contato/", "Contato"], ["/privacidade/", "Privacidade"], ["/termos/", "Termos de uso"], ["/cookies/", "Cookies"], ["/lgpd/", "Seus direitos (LGPD)"]],
};
