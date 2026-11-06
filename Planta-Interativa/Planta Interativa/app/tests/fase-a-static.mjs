// Fase A, parte estática: lê os arquivos e confere A2, A6, A7 e A8.
// Uso: node tests/fase-a-static.mjs [caminho/para/index.html]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const htmlPath = process.argv[2] ? path.resolve(process.argv[2]) : path.join(root, "index.html");
const html = fs.readFileSync(htmlPath, "utf8");
const media = path.join(path.dirname(htmlPath), "media");
const fails = [];

// A7: idioma no <html> (o primeiro <html> do arquivo)
if (!/<html[^>]*\slang="pt-BR"/.test(html.match(/<html[^>]*>/)?.[0] || "")) fails.push("A7: <html> sem lang=\"pt-BR\"");

// A6: nenhum render*.jpg sobrando e nenhuma referência a ele
const jpgs = fs.existsSync(media) ? fs.readdirSync(media).filter(f => /^render.*\.jpg$/i.test(f)) : ["media/ ausente"];
if (jpgs.length) fails.push("A6: JPG de render ainda presentes: " + jpgs.join(", "));
if (/render[\w-]*\.jpg/.test(html)) fails.push("A6: index.html ainda referencia render*.jpg");

// A2: o teste de WebGL do can3D libera o contexto (no HTML ou nos módulos em js/)
const jsDir = path.join(path.dirname(htmlPath), "js");
const code = html + (fs.existsSync(jsDir) ? fs.readdirSync(jsDir).map(f => fs.readFileSync(path.join(jsDir, f), "utf8")).join("\n") : "");
const can3D = code.match(/const can3D=[\s\S]*?\}\};/)?.[0] || "";
if (!can3D) fails.push("A2: can3D não encontrado");
else if (!/WEBGL_lose_context/.test(can3D) || !/loseContext\(\)/.test(can3D)) fails.push("A2: can3D não libera o contexto WebGL");

// A8: README documenta o servidor só local
const readme = path.join(path.dirname(htmlPath), "README.md");
if (!fs.existsSync(readme) || !/--bind 127\.0\.0\.1/.test(fs.readFileSync(readme, "utf8"))) fails.push("A8: README sem o comando do servidor em 127.0.0.1");

if (fails.length) { console.log(fails.join("\n")); process.exit(1); }
console.log("FASE-A-STATIC OK");
