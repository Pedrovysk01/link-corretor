// Compara tests/out/roteiro.json (agora) com tests/baseline/roteiro.json (antes da Fase B).
// Números dentro de textos (ex.: posições em px) aceitam diferença de até 2.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const dir = path.dirname(fileURLToPath(import.meta.url));
const a = JSON.parse(fs.readFileSync(path.join(dir, "baseline/roteiro.json"), "utf8"));
const b = JSON.parse(fs.readFileSync(path.join(dir, "out/roteiro.json"), "utf8"));
const difs = [];
const nums = s => String(s).match(/-?\d+(\.\d+)?/g) || [];
const shape = s => String(s).replace(/-?\d+(\.\d+)?/g, "#");
function same(x, y) {
  if (typeof x === "string" && typeof y === "string" && x !== y) {
    if (shape(x) !== shape(y)) return false;
    const nx = nums(x), ny = nums(y);
    return nx.every((v, i) => Math.abs(+v - +ny[i]) <= 2);
  }
  return JSON.stringify(x) === JSON.stringify(y);
}
function walk(x, y, p) {
  if (x && y && typeof x === "object" && typeof y === "object") {
    for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) walk(x[k], y[k], p + "." + k);
  } else if (!same(x, y)) difs.push(`${p}: antes ${JSON.stringify(x)?.slice(0, 160)} | agora ${JSON.stringify(y)?.slice(0, 160)}`);
}
walk(a, b, "");
if (difs.length) { console.log(difs.join("\n")); process.exit(1); }
console.log("ROTEIRO IGUAL");
