// Materiais: catálogo em PDF e imagens oficiais para abrir, baixar e encaminhar.
import { D, $, esc, isMobile } from "./data.js";
import { IC } from "./icons.js";
import { openViewer } from "./viewer.js";

const panel = $("p-materiais"), abs = p => new URL(p, location.href).href;
function toast(msg) { const t = $("toast"); t.textContent = msg; t.hidden = false; clearTimeout(toast.tm); toast.tm = setTimeout(() => t.hidden = true, 2600) }
async function copy(text) { try { await navigator.clipboard.writeText(text); toast("Link copiado") } catch { toast(text) } }
const meta = m => m.tipo === "pdf" ? `PDF · ${m.paginas} páginas · ${m.tamanho}` : "Imagem em alta resolução";
function card(m) {
  const a = [], url = abs(m.arquivo);
  a.push(m.tipo === "pdf" ? `<a href="${esc(m.arquivo)}" target="_blank" rel="noopener">${IC.expand}<span>Abrir</span></a>` : `<button type="button" data-mt="open" data-id="${m.id}">${IC.expand}<span>Abrir</span></button>`);
  a.push(`<a href="${esc(m.arquivo)}" download>${IC.download}<span>Baixar</span></a>`);
  if (isMobile() && navigator.share) a.push(`<button type="button" data-mt="share" data-t="${esc(m.titulo)}" data-url="${esc(url)}">${IC.send}<span>Encaminhar</span></button>`);
  else a.push(`<button type="button" data-mt="wa" data-t="${esc(m.titulo)}" data-url="${esc(url)}">${IC.send}<span>WhatsApp</span></button><button type="button" data-mt="copy" data-url="${esc(url)}">${IC.copy}<span>Copiar link</span></button>`);
  return `<article class="m-pdf mt-card"><div class="mt-top"><span class="m-ico">${IC[m.tipo === "pdf" ? "pdf" : "grid"]}</span><span><b>${esc(m.titulo)}</b><small>${esc(m.descricao)}</small><small>${meta(m)}</small></span></div><div class="m-acts">${a.join("")}</div></article>`;
}
const cats = [...new Set(D.materiais.map(m => m.categoria))];
panel.innerHTML = `<b class="mt-title">Materiais</b>` + cats.map(c => `<section class="mt-cat"><small>${esc(c)}</small>${D.materiais.filter(m => m.categoria === c).map(card).join("")}</section>`).join("");
panel.addEventListener("click", e => {
  const b = e.target.closest("[data-mt]"); if (!b) return; const k = b.dataset.mt, d = b.dataset;
  if (k === "open") { const m = D.materiais.find(x => x.id === d.id); openViewer([{ src: m.arquivo, label: m.titulo }], 0, m.titulo, "Materiais") }
  else if (k === "wa") open(`https://wa.me/?text=${encodeURIComponent(d.t + " · Villa Montemerano\n" + d.url)}`, "_blank", "noopener");
  else if (k === "copy") copy(d.url); else if (k === "share") navigator.share({ title: d.t, url: d.url }).catch(() => {});
});
