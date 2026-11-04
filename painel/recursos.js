/* Link Corretor — liga/desliga módulos da apresentação conforme o painel da construtora.
   Injetado em /p/<código>/ e /pre/<id>/ com data-recursos='{"sol":true,"mapa":false,…}'.
   Regra: cada elemento de módulo leva data-recurso="<chave>"; se a chave estiver desligada, some. window.LC_RECURSOS fica
   disponível para os apps que precisam de lógica além de esconder (ex.: não calcular o sol). */
(() => {
  "use strict";
  const sc = document.currentScript; let r = {};
  try { r = JSON.parse((sc && sc.dataset.recursos) || "{}"); } catch { /* vazio = tudo ligado */ }
  window.LC_RECURSOS = r;
  const off = Object.keys(r).filter((k) => r[k] === false);
  if (!off.length) return;
  const st = document.createElement("style"); st.id = "lc-recursos";
  st.textContent = off.map((k) => `[data-recurso="${k}"]{display:none!important}`).join("");
  (document.head || document.documentElement).append(st);
  document.documentElement.dataset.lcOff = off.join(" ");
})();
