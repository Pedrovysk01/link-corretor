/* Idiomas do painel (PT · ES · EN · IT).
   O código das telas continua em português; este script traduz o que aparece na tela, em tempo real:
   - dicionário: assets/js/i18n/keys.js (frases em PT, extraídas do código) + assets/js/i18n/<idioma>.js (traduções na mesma ordem);
   - "{*}" numa frase é um trecho variável (número, nome…), ex.: "{*} clientes" → "{*} customers";
   - não traduz o que o dono escreveu nem as prévias do cliente (celular, cartão), que seguem o idioma da página pública.
   Trocar o idioma: CF.actions["set-lang"] grava "clientefiel.lang" e recarrega. */
(function () {
  "use strict";
  let lang = "pt"; try { lang = localStorage.getItem("clientefiel.lang") || "pt"; } catch (e) {}
  document.documentElement.lang = { pt: "pt-BR", es: "es", en: "en", it: "it" }[lang] || "pt-BR";
  if (lang === "pt") return;
  const K = window.CF_I18N_KEYS || [], V = (window.CF_I18N || {})[lang] || [];
  if (!K.length || !V.length) return;

  const rx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const exact = new Map(), buckets = new Map(), same = new Set(); // same: frases que ficam iguais no idioma (ex.: "Logotipo" em ES)
  const addTpl = (k, v) => {
    const parts = k.split("{*}"), re = new RegExp("^" + parts.map(rx).join("([\\s\\S]+?)") + "$");
    const b = parts[0].slice(0, 3); if (!buckets.has(b)) buckets.set(b, []); buckets.get(b).push([re, v]);
  };
  K.forEach((k, i) => {
    const v = V[i]; if (!v) return; if (v === k) { same.add(k); return; }
    if (k.indexOf("{*}") < 0) { if (!exact.has(k)) exact.set(k, v); return; }
    addTpl(k, v);
    // "{*}" na ponta costuma ser um ícone (outro elemento): a frase sem ele também vale. Ex.: "Compartilhar sua página {*}"
    const ks = k.replace(/^\{\*\}\s*/, "").replace(/\s*\{\*\}$/, ""), vs = v.replace(/^\{\*\}\s*/, "").replace(/\s*\{\*\}$/, "");
    if (ks && ks !== k && ks.split("{*}").length === vs.split("{*}").length) { if (ks.indexOf("{*}") < 0) { if (!exact.has(ks)) exact.set(ks, vs); } else addTpl(ks, vs); }
  });
  // o modelo mais específico (mais texto fixo) ganha: "Para uma imagem … {*} px de largura." antes de "Para {*} de {*}"
  const fixedLen = (re) => re.source.replace(/\(\[\\s\\S\]\+\?\)/g, "").length;
  buckets.forEach((arr) => arr.sort((a, b) => fixedLen(b[0]) - fixedLen(a[0])));
  const wild = buckets.get("") || [];
  const cache = new Map();
  const norm = (s) => s.replace(/\s+/g, " ").trim();
  const PLAIN = /^[\s\d.,:;%/+·—–()\-×→↓>|*R$]*$/; // números e símbolos: ficam como estão
  function lookup(t) {
    if (cache.has(t)) return cache.get(t);
    cache.set(t, null); // evita recursão infinita
    let v = exact.get(t);
    if (v == null) {
      for (const [re, out] of (buckets.get(t.slice(0, 3)) || []).concat(wild).sort((a, b) => fixedLen(b[0]) - fixedLen(a[0]))) {
        const m = t.match(re); if (!m) continue;
        let i = 1; v = out.replace(/\{\*\}/g, () => { const x = m[i++]; if (x == null) return ""; const y = tr(x); return y != null ? y : x; }); break;
      }
    }
    // frase composta na tela ("Datas · Dia das Mães", "1 de 3.000 clientes (no teste)"): traduz cada pedaço
    if (v == null && t.length < 160) {
      const segs = t.split(/(\s+·\s+|\s+—\s+|:\s+|\s+(?=\()|\s*->\s*$)/);
      if (segs.length > 1) { let ok = true, any = false; const res = segs.map((s, j) => { if (j % 2 || PLAIN.test(s)) return s; const ns = norm(s); const y = lookup(ns); if (y == null) { if (same.has(ns)) return s; ok = false; return s; } any = true; return y; }); if (ok && any) v = res.join(""); }
    }
    if (cache.size > 5000) cache.clear();
    cache.set(t, v == null ? null : v);
    return v == null ? null : v;
  }
  function tr(s) {
    if (!s || !/[A-Za-zÀ-ú]/.test(s)) return null;
    const t = norm(s); if (!t) return null;
    const v = lookup(t); if (v == null) return null;
    return s.match(/^\s*/)[0] + v + s.match(/\s*$/)[0];
  }
  window.CF_T = (s) => { const v = tr(String(s)); return v == null ? s : v; }; // para textos fora do DOM (ex.: notificações, document.title)
  // textos desenhados em <canvas> (imagem de compartilhar, material impresso): frases fixas saem no idioma do painel
  try { const P = CanvasRenderingContext2D.prototype; ["fillText", "strokeText", "measureText"].forEach((fn) => { const f = P[fn]; P[fn] = function (t, ...r) { if (typeof t === "string" && t.length > 1) { const v = tr(t); if (v != null) t = v; } return f.call(this, t, ...r); }; }); } catch (e) {}

  // áreas que não traduzimos: código, campos de texto e prévias do que o CLIENTE vê
  const SKIP = "script,style,textarea,code,pre,svg,[contenteditable],[data-no-i18n],.device-png,.pc,.wk,.pm-tp,.cf-wm";
  const ATTRS = ["placeholder", "title", "aria-label", "alt"];
  const doAttrs = (el) => { for (const a of ATTRS) { const v = el.getAttribute(a); if (v) { const t = tr(v); if (t != null && t !== v) el.setAttribute(a, t); } }
    if (el.tagName === "INPUT" && (el.type === "button" || el.type === "submit") && el.value) { const t = tr(el.value); if (t != null) el.value = t; } };
  const doText = (n) => { const p = n.parentElement; if (!p || p.closest(SKIP)) return; const v = n.nodeValue, t = tr(v); if (t != null && t !== v) n.nodeValue = t; };
  function walk(root) {
    if (root.nodeType === 3) return doText(root);
    if (root.nodeType !== 1 || root.closest(SKIP)) return;
    doAttrs(root);
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.nodeType === 1 && n.matches(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
    let n; while ((n = tw.nextNode())) { if (n.nodeType === 3) { const v = n.nodeValue, t = tr(v); if (t != null && t !== v) n.nodeValue = t; } else doAttrs(n); }
  }
  const mo = new MutationObserver((list) => {
    for (const m of list) {
      if (m.type === "childList") m.addedNodes.forEach(walk);
      else if (m.type === "characterData") doText(m.target);
      else if (m.type === "attributes" && m.target.nodeType === 1 && !m.target.closest(SKIP)) { const v = m.target.getAttribute(m.attributeName); const t = v && tr(v); if (t != null && t !== v) m.target.setAttribute(m.attributeName, t); }
    }
  });
  const start = () => { walk(document.body); const t = tr(document.title); if (t) document.title = t; mo.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS }); };
  if (document.body) start(); else document.addEventListener("DOMContentLoaded", start);
  // notificações do navegador também saem no idioma escolhido
  const wrapNotify = () => { if (!window.CF || !CF.notify || CF.notify.__i18n) return; const f = CF.notify; CF.notify = (a, b) => f(window.CF_T(a), window.CF_T(b)); CF.notify.__i18n = true; };
  wrapNotify(); document.addEventListener("DOMContentLoaded", wrapNotify);
})();
