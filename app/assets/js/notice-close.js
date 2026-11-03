/* Botão "Fechar" nos avisos que aparecem na tela, no painel e na página do cliente.
   - Faixas de prévia do painel ("Prévia com dados de exemplo…"): ficam fechadas até fechar a aba.
   - Aviso de campanha enviado a todos os clientes (página do cliente): fica fechado neste aparelho; se a mensagem mudar, volta a aparecer.
   - "Falta só 1" e "Seu cartão está ativo": fechados até fechar a aba.
   Funciona sozinho: observa a página e acrescenta o botão em cada aviso (a página do cliente redesenha o cartão a cada atualização). */
(function () {
  "use strict";
  var SEL = ".v2-preview-banner,.dv2-demo-note,.pub .campaign,.pub .near-banner,.pub .done-msg";
  var X = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  function st(kind) { try { return kind === "local" ? localStorage : sessionStorage; } catch (e) { return null; } }
  function hash(s) { var h = 5381; s = String(s); for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
  function info(el) {
    var txt = (el.textContent || "").replace(/\s+/g, " ").trim();
    if (el.matches(".pub .campaign")) return { key: "cf.dismiss.campaign." + hash(txt), where: "local" };
    if (el.matches(".v2-preview-banner,.dv2-demo-note")) return { key: "cf.dismiss.preview", where: "session" };
    return { key: "cf.dismiss." + (el.className.split(" ")[0] || "aviso") + "." + hash(txt), where: "session" };
  }
  function prep(el) {
    if (el.dataset.nz) return; el.dataset.nz = "1";
    var i = info(el), s = st(i.where);
    try { if (s && s.getItem(i.key)) { el.remove(); return; } } catch (e) {}
    var b = document.createElement("button"); b.type = "button"; b.className = "nz-x"; b.setAttribute("aria-label", "Fechar aviso"); b.title = "Fechar"; b.innerHTML = X;
    b.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); try { if (s) s.setItem(i.key, "1"); } catch (er) {} el.remove(); });
    el.classList.add("nz-host"); el.appendChild(b);
  }
  function scan(root) { if (!root || !root.querySelectorAll) return; if (root.matches && root.matches(SEL)) prep(root); root.querySelectorAll(SEL).forEach(prep); }
  function start() {
    scan(document);
    new MutationObserver(function (ms) { ms.forEach(function (m) { m.addedNodes.forEach(function (n) { if (n.nodeType === 1) scan(n); }); }); }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.body) start(); else document.addEventListener("DOMContentLoaded", start);
})();
