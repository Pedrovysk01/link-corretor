/* Link Corretor — aba "← Painel" injetada nas apresentações (/pre/<id>/ e /p/<código>/).
   Só aparece para quem está logado no painel (dono ou corretor); o cliente final nunca vê. Shadow DOM: não herda nem vaza estilo. */
(() => {
  "use strict";
  if (window.__lcVoltar) return;
  window.__lcVoltar = true;
  fetch("/api/me", { credentials: "same-origin" })
    .then((r) => (r.ok ? r.json() : null))
    .then((me) => { if (me && me.user) montar(me.user.name); })
    .catch(() => {});

  function montar(nome) {
    const host = document.createElement("div");
    host.setAttribute("data-lc-voltar", "");
    const sh = host.attachShadow({ mode: "open" });
    sh.innerHTML = `<style>
      a{position:fixed;left:0;top:200px;z-index:2147483000;display:flex;align-items:center;gap:6px;padding:9px 13px 9px 10px;border-radius:0 9px 9px 0;
        background:#16302e;color:#f3efe6;text-decoration:none;font:600 12px/1 "Figtree",system-ui,sans-serif;letter-spacing:.02em;
        box-shadow:0 4px 14px rgba(0,0,0,.28);border:1px solid rgba(243,239,230,.2);border-left:0;transition:translate .2s cubic-bezier(.2,.8,.2,1),background-color .2s}
      a:hover{translate:4px 0;background:#1f433f}
      a:active{scale:.97}
      a:focus-visible{outline:2px solid #f0c27f;outline-offset:2px}
      svg{width:16px;height:16px;stroke:#f0c27f;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
      @media (max-width:640px){a{top:196px;padding:8px 11px 8px 8px}}
      @media (prefers-reduced-motion:reduce){a{transition:none}a:hover{translate:0 0}a:active{scale:1}}
    </style><a href="/painel/" title="Voltar ao painel${nome ? " (" + nome + ")" : ""}" aria-label="Voltar ao painel"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>Painel</a>`;
    document.body.append(host);
  }
})();
