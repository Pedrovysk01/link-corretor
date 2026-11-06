// Fase C: design system. Fora das definições de token (--nome: valor), o CSS só usa tokens para cor, tamanho de fonte,
// duração de transição, camada (z-index), raio e sombra. Estilos embutidos no HTML/JS não trazem cor nem tamanho.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const css = fs.readdirSync(path.join(root, "css")).filter(f => f.endsWith(".css")).map(f => [f, fs.readFileSync(path.join(root, "css", f), "utf8")]);
const fails = [];
const COLOR = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/g;
const tokens = new Map(); // nome -> valor
const decls = [];         // [arquivo, propriedade, valor]
for (const [f, s] of css) {
  const clean = s.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const m of clean.matchAll(/([\w-]+)\s*:\s*([^;{}]+)/g)) {
    const [, prop, val] = m;
    if (prop.startsWith("--")) tokens.set(prop, val.trim());
    else decls.push([f, prop, val.trim()]);
  }
}
const lit = (re, pick) => decls.filter(([, p, v]) => pick(p) && re.test(v));
// C1: cor só por token (o SVG da bússola e os efeitos gerados por JS não estão no CSS)
const colorLits = decls.filter(([, p, v]) => !/^(content|font-family|font)$/.test(p) && (v.match(COLOR) || []).length);
if (colorLits.length > 10) fails.push(`C1: ${colorLits.length} cores soltas no CSS (máx. 10): ` + colorLits.slice(0, 12).map(([f, p, v]) => `${f} ${p}:${v.slice(0, 40)}`).join(" | "));
// C2: tamanhos de fonte só por token; no máximo 8 tokens de tamanho
const fsTokens = [...tokens.keys()].filter(k => /^--fs-/.test(k));
if (fsTokens.length < 5 || fsTokens.length > 8) fails.push(`C2: ${fsTokens.length} tokens de tamanho (esperado 5 a 8)`);
const sizeLits = decls.filter(([, p, v]) => (p === "font-size" && !/^(var\(--fs-|inherit|100%)/.test(v)) || (p === "font" && /\d+(\.\d+)?(px|rem|em)\b/.test(v.split("/")[0]) && !/var\(--fs-/.test(v)));
if (sizeLits.length) fails.push(`C2: ${sizeLits.length} tamanhos de fonte fora de token: ` + sizeLits.slice(0, 8).map(([f, p, v]) => `${f} ${v.slice(0, 30)}`).join(" | "));
// C3: transições só com tokens de duração (animações de conteúdo em @keyframes ficam fora)
const tTokens = [...tokens.keys()].filter(k => /^--t-/.test(k));
if (tTokens.length < 2 || tTokens.length > 4) fails.push(`C3: ${tTokens.length} tokens de duração (esperado 2 a 4)`);
const durLits = decls.filter(([, p, v]) => p === "transition" && /\d*\.?\d+m?s\b/.test(v.replace(/var\([^)]*\)/g, "")));
if (durLits.length) fails.push(`C3: ${durLits.length} transições com duração solta: ` + durLits.map(([f, , v]) => `${f} ${v}`).join(" | "));
// C4: camadas só por escala nomeada
const zLits = decls.filter(([, p, v]) => p === "z-index" && !/^var\(--z-/.test(v));
if (zLits.length) fails.push(`C4: ${zLits.length} z-index soltos: ` + zLits.map(([f, , v]) => `${f} ${v}`).join(" | "));
// C5: raios (3 tokens; círculo 50% e pílula 999px são formas) e sombras (tokens)
const rTokens = [...tokens.keys()].filter(k => /^--r-/.test(k));
if (rTokens.length !== 3) fails.push(`C5: ${rTokens.length} tokens de raio (esperado 3)`);
const rLits = decls.filter(([, p, v]) => p === "border-radius" && !v.split(/\s+/).every(x => /^(var\(--r-[\w-]+\)|50%|999px|0)$/.test(x)));
if (rLits.length) fails.push(`C5: ${rLits.length} raios soltos: ` + rLits.map(([f, , v]) => `${f} ${v}`).join(" | "));
const shLits = decls.filter(([, p, v]) => /^(box-shadow|text-shadow)$/.test(p) && v !== "none" && (v.match(COLOR) || []).length);
if (shLits.length) fails.push(`C5: ${shLits.length} sombras soltas: ` + shLits.map(([f, , v]) => `${f} ${v.slice(0, 50)}`).join(" | "));
// tokens usados de fato (sem token órfão) e sem token usado sem definição
const allCss = css.map(([, s]) => s).join("\n");
const code = allCss + fs.readFileSync(path.join(root, "index.html"), "utf8") + fs.readdirSync(path.join(root, "js")).map(f => fs.readFileSync(path.join(root, "js", f), "utf8")).join("\n");
for (const k of tokens.keys()) if (!code.includes(`var(${k}`) && !code.includes(`"${k}"`)) fails.push(`token sem uso: ${k}`);
for (const m of allCss.matchAll(/var\((--[\w-]+)(,)?/g)) if (!tokens.has(m[1]) && !m[2] && m[1] !== "--lift") fails.push(`token usado sem definição: ${m[1]}`);
// estilos embutidos (HTML e JS) sem cor nem tamanho de fonte
const inline = [...code.matchAll(/style="([^"]*)"/g)].map(m => m[1]).filter(s => /font-size|#[0-9a-f]{3,6}\b|rgba?\(/i.test(s));
if (inline.length) fails.push(`${inline.length} style="" com cor/tamanho solto: ` + inline.slice(0, 4).join(" | "));

if (fails.length) { console.log([...new Set(fails)].join("\n")); process.exit(1); }
console.log("FASE-C-STATIC OK");
