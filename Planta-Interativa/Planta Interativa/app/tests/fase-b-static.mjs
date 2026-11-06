// Fase B, parte estática: estrutura de arquivos, dados em JSON, módulos, estado único, sem remendos e sem órfãos.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rd = p => fs.readFileSync(path.join(root, p), "utf8");
const ls = (d, ext) => fs.existsSync(path.join(root, d)) ? fs.readdirSync(path.join(root, d)).filter(f => f.endsWith(ext)).map(f => d + "/" + f) : [];
const fails = [];
const html = rd("index.html");

// B2: nada embutido no HTML (só o importmap) e entrada única em módulo
const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>/g)].filter(m => !/type="importmap"/.test(m[1]));
if (inline.length) fails.push(`B2: ${inline.length} <script> embutido(s) no index.html`);
if (/<style[\s>]/.test(html)) fails.push("B2: <style> embutido no index.html");
if (!/<script type="module" src="js\/main\.js"><\/script>/.test(html)) fails.push("B2: falta <script type=\"module\" src=\"js/main.js\">");
const cssFiles = ls("css", ".css"), jsFiles = ls("js", ".js");
if (cssFiles.length < 3) fails.push("B2: menos de 3 arquivos em css/");
if (jsFiles.length < 6) fails.push("B2: menos de 6 módulos em js/");
for (const f of cssFiles) if (!html.includes(`href="${f}"`)) fails.push(`B2: ${f} não está ligado no index.html`);

// B1: dados em JSON, coerentes
let U, C;
try { U = JSON.parse(rd("data/units.json")); C = JSON.parse(rd("data/content.json")); } catch (e) { fails.push("B1: JSON ausente ou inválido: " + e.message); }
if (U && C) {
  const houses = Object.entries(U.geo || {}).flatMap(([t, g]) => g.centers.map((_, i) => `${t}-${i + 1}`));
  if (houses.length !== 43) fails.push(`B1: ${houses.length} casas no JSON (esperado 43)`);
  if (Object.keys(U.types || {}).length !== 6) fails.push("B1: tipologias ≠ 6");
  for (const t in U.geo) if ((U.priv?.[t] || []).length !== U.geo[t].centers.length) fails.push(`B1: áreas privativas de ${t} não batem com as casas`);
  const av = Object.keys(U.available || {});
  if (av.length !== 3 || av.some(k => !houses.includes(k))) fails.push("B1: disponíveis no JSON ≠ 3 casas existentes");
  if ((C.areas || []).length !== 4) fails.push("B1: áreas comuns ≠ 4");
  if ((C.experiences || []).length !== 8) fails.push("B1: experiências ≠ 8");
  if ((C.views || []).length !== 5) fails.push("B1: enquadramentos ≠ 5");
  for (const t in U.types) if (!C.book?.[t]) fails.push(`B1: book sem a tipologia ${t}`);
}
const js = Object.fromEntries(jsFiles.map(f => [f, rd(f)]));
const allJs = Object.values(js).join("\n");
if (/AVAIL=\{|"Brisa-6":\s*3861225/.test(allJs) || /const GEO=\{/.test(allJs)) fails.push("B1: dados de casas ainda escritos no JS");

// módulos ES de verdade
for (const [f, s] of Object.entries(js)) if (!/^\s*(import|export)\s/m.test(s)) fails.push(`B2: ${f} não é módulo (sem import/export)`);

// B3: estado mutável compartilhado só em js/state.js
if (!js["js/state.js"] || !/export const state\s*=/.test(js["js/state.js"])) fails.push("B3: js/state.js sem `export const state`");
const SHARED = ["S", "TX", "TY", "ROT", "anim", "selected", "LIGHT", "ONLY", "tipU"];
for (const [f, s] of Object.entries(js)) {
  if (f === "js/state.js") continue;
  for (const v of SHARED) if (new RegExp(`^(let|var)\\s+([\\w$,\\s=]*\\b)?${v}\\b`, "m").test(s)) fails.push(`B3: ${f} declara estado compartilhado "${v}" fora do state.js`);
}
// B3: sem remendos (função reatribuída) e sem `typeof R3` de guarda
for (const [f, s] of Object.entries(js)) {
  const patch = s.match(/const _(\w+)=\1;\s*\1=function/);
  if (patch) fails.push(`B3: remendo em ${f}: ${patch[0]}`);
  if (/typeof R3/.test(s)) fails.push(`B3: guarda "typeof R3" em ${f}`);
}

// B4: sem classes órfãs e sem variáveis CSS sem uso
const css = cssFiles.map(rd).join("\n");
const code = html + "\n" + allJs;
const cssClasses = new Set([...css.replace(/url\([^)]*\)/g, "").matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map(m => m[1]));
const orphan = [...cssClasses].filter(c => !new RegExp(`(["'\`\\s.]|class=")${c}([\\s"'\`.:\\[]|$)`).test(code));
if (orphan.length) fails.push("B4: classes CSS sem uso: " + orphan.join(", "));
const vars = new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1]));
const unused = [...vars].filter(v => !(css + code).includes(`var(${v}`) && !code.includes(`"${v}"`));
if (unused.length) fails.push("B4: variáveis CSS sem uso: " + unused.join(", "));

if (fails.length) { console.log(fails.join("\n")); process.exit(1); }
console.log("FASE-B-STATIC OK");
