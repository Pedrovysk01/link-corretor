// Markdown mínimo (sem dependências) para o blog e as páginas legais.
// Suporta: front matter, títulos (##/###/####), parágrafos, listas (- / 1.), citação (>), tabela com |, ---, **negrito**, *itálico*, `código`,
// [link](url) e ![alt](url). Gera ids nos títulos (âncoras/sumário) e entrega a lista de títulos e o FAQ (seção "Perguntas frequentes").

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export const slugify = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export function frontMatter(src) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(src);
  if (!m) return { meta: {}, body: src };
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(":"); if (i < 0) continue;
    const k = line.slice(0, i).trim(); let v = line.slice(i + 1).trim();
    if (/^\[.*\]$/.test(v)) v = v.slice(1, -1).split(",").map((x) => x.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
    else v = v.replace(/^["']|["']$/g, "");
    meta[k] = v;
  }
  return { meta, body: src.slice(m[0].length) };
}

// links permitidos: caminhos do site, âncoras, https e mailto (nada de javascript:/data:)
const safeHref = (u) => (/^(\/|#|https:\/\/|mailto:)/i.test(u) ? u : "#");

export function inline(t) {
  let s = esc(t);
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, a, u) => `<img src="${esc(safeHref(u.replace(/&amp;/g, "&")))}" alt="${a}" loading="lazy" decoding="async">`);
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, a, u) => {
    const href = safeHref(u.replace(/&amp;/g, "&")), ext = /^https:\/\//i.test(href);
    return `<a href="${href}"${ext ? ' target="_blank" rel="noopener noreferrer"' : ""}>${a}</a>`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/(^|[\s(])\*([^*\s][^*]*)\*(?=[\s).,;:!?]|$)/g, "$1<em>$2</em>");
  return s;
}

export function render(body) {
  const lines = body.replace(/\r/g, "").split("\n"), out = [], heads = [], faq = [];
  let i = 0, inFaq = false, curQ = null;
  const flushQ = () => { if (curQ && curQ.a.length) faq.push({ q: curQ.q, a: curQ.a.join(" ").trim() }); curQ = null; };
  const para = (buf) => { const t = buf.join(" ").trim(); if (!t) return; out.push(`<p>${inline(t)}</p>`); if (curQ) curQ.a.push(t.replace(/\*\*|\*|`/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")); };
  while (i < lines.length) {
    const ln = lines[i];
    if (!ln.trim()) { i++; continue; }
    let m;
    if ((m = /^(#{2,4})\s+(.+?)\s*#*$/.exec(ln))) {
      const lvl = m[1].length, text = m[2].replace(/\*\*|`/g, ""), id = slugify(text);
      if (lvl === 2) { flushQ(); inFaq = /perguntas frequentes/i.test(text); }
      if (lvl === 3 && inFaq) { flushQ(); curQ = { q: text, a: [] }; }
      if (lvl <= 3) heads.push({ lvl, text, id });
      out.push(`<h${lvl} id="${id}">${inline(m[2])}</h${lvl}>`); i++; continue;
    }
    if (/^---+\s*$/.test(ln)) { out.push("<hr>"); i++; continue; }
    if (/^>\s?/.test(ln)) { const buf = []; while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, "")); out.push(`<blockquote>${inline(buf.join(" "))}</blockquote>`); continue; }
    if (/^\|.+\|\s*$/.test(ln) && /^\|[\s:|-]+\|\s*$/.test(lines[i + 1] || "")) {
      const row = (r) => r.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      const head = row(ln); i += 2; const rows = [];
      while (i < lines.length && /^\|.+\|\s*$/.test(lines[i])) rows.push(row(lines[i++]));
      out.push(`<div class="table-wrap"><table><thead><tr>${head.map((c) => `<th scope="col">${inline(c)}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`); continue;
    }
    if ((m = /^(\s*)([-*]|\d+[.)])\s+/.exec(ln))) {
      const ordered = /\d/.test(m[2]), items = [];
      while (i < lines.length && /^(\s*)([-*]|\d+[.)])\s+/.test(lines[i])) {
        let t = lines[i].replace(/^(\s*)([-*]|\d+[.)])\s+/, ""); i++;
        while (i < lines.length && lines[i].trim() && /^\s{2,}\S/.test(lines[i]) && !/^(\s*)([-*]|\d+[.)])\s+/.test(lines[i])) t += " " + lines[i++].trim();
        items.push(t);
      }
      const task = items.every((t) => /^\[[ xX]\]\s/.test(t));
      out.push(`<${ordered ? "ol" : "ul"}${task ? ' class="tasks"' : ""}>${items.map((t) => task ? `<li><span class="box${/^\[[xX]\]/.test(t) ? " on" : ""}" aria-hidden="true"></span>${inline(t.replace(/^\[[ xX]\]\s/, ""))}</li>` : `<li>${inline(t)}</li>`).join("")}</${ordered ? "ol" : "ul"}>`); continue;
    }
    const buf = [];
    while (i < lines.length && lines[i].trim() && !/^(#{2,4}\s|>|---+\s*$|\s*([-*]|\d+[.)])\s+|\|.+\|)/.test(lines[i])) buf.push(lines[i++]);
    para(buf);
  }
  flushQ();
  const words = body.replace(/[#>*`|\-\[\]()!]/g, " ").split(/\s+/).filter(Boolean).length;
  return { html: out.join("\n"), heads, faq, words };
}
