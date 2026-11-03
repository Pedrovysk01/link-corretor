/* Seu Cliente Fiel — comportamento do site (sem dependências). */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var track = function (n, p) { if (window.cfTrack) window.cfTrack(n, p); };
  var page = location.pathname;

  /* ---- atribuição de campanhas (UTM, gclid, fbclid…): vai junto no link para o painel; só é guardada com consentimento */
  var KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "gbraid", "wbraid", "fbclid", "ttclid", "msclkid"];
  function attr() {
    var a = {}, q = new URLSearchParams(location.search), stored = {};
    try { stored = JSON.parse(localStorage.getItem("cf_attr") || "{}"); } catch (e) {}
    KEYS.forEach(function (k) { if (stored[k]) a[k] = stored[k]; });
    var fresh = false; KEYS.forEach(function (k) { var v = q.get(k); if (v) { a[k] = v.slice(0, 200); fresh = true; } });
    if (fresh) { a.landing = page; a.ts = new Date().toISOString(); }
    var c = window.CF_CONSENT || {};
    if (fresh && (c.analytics || c.marketing)) { try { localStorage.setItem("cf_attr", JSON.stringify(a)); } catch (e) {} }
    return a;
  }
  function decorate() {
    var a = attr(), keys = Object.keys(a).filter(function (k) { return KEYS.indexOf(k) >= 0; }); if (!keys.length) return;
    $$('a[href^="/app/"]').forEach(function (l) {
      var u = new URL(l.getAttribute("href"), location.origin); keys.forEach(function (k) { u.searchParams.set(k, a[k]); });
      l.setAttribute("href", u.pathname + u.search + u.hash);
    });
  }
  decorate(); document.addEventListener("cf:consent", decorate);
  $$(".nav-m-box a").forEach(function (a) { a.addEventListener("click", function () { var menu = a.closest("details"); if (menu) menu.open = false; }); });

  /* ---- cliques nas chamadas (CTA) */
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-cta]"); if (!el) return;
    var loc = el.getAttribute("data-cta"), href = el.getAttribute("href") || "";
    track("cta_click", { location: loc, page: page });
    if (href.indexOf("/app/") === 0) track("cta_signup", { location: loc, page: page });
  });
  $$("[data-faq]").forEach(function (d) { d.addEventListener("toggle", function () { if (d.open) track("faq_open", { question: (d.querySelector("summary") || {}).textContent }); }); });

  /* ---- profundidade de rolagem */
  var marks = [25, 50, 75, 90], sent = {};
  window.addEventListener("scroll", function () {
    var h = document.documentElement, p = Math.round(((h.scrollTop + window.innerHeight) / h.scrollHeight) * 100);
    marks.forEach(function (m) { if (p >= m && !sent[m]) { sent[m] = 1; track("scroll_depth", { percent: m, page: page }); } });
  }, { passive: true });

  /* ---- barra de CTA fixa no celular: aparece depois do topo */
  var sticky = $("[data-sticky]");
  if (sticky) {
    var closed = false; try { closed = sessionStorage.getItem("cf_sticky_off") === "1"; } catch (e) {}
    var chk = function () { sticky.classList.toggle("show", !closed && window.scrollY > 520); };
    var x = $("[data-sticky-close]", sticky);
    if (x) x.addEventListener("click", function () { closed = true; try { sessionStorage.setItem("cf_sticky_off", "1"); } catch (e) {} chk(); });
    window.addEventListener("scroll", chk, { passive: true }); chk();
  }

  /* ---- demonstração do cartão de carimbos */
  var demo = $("[data-demo]");
  if (demo && demo.hasAttribute("data-home-demo")) {
    var buttons = $$(".demo-stamp", demo), count = $("[data-demo-count]", demo), message = $(".demo-msg", demo);
    var filled = Number(demo.getAttribute("data-initial")) || 0, demoStarted = false;
    function renderDemo() {
      buttons.forEach(function (button, i) {
        button.classList.toggle("on", i < filled);
        button.setAttribute("aria-pressed", String(i < filled));
      });
      count.textContent = filled + "/8";
      message.textContent = filled === 8 ? "Recompensa liberada! Mostre este cartão no balcão." : "Faltam " + (8 - filled) + " carimbos para o café grátis";
    }
    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        if (filled < 8) { if (!demoStarted) { demoStarted = true; track("demo_start", {}); } filled++; renderDemo(); if (filled === 8) track("demo_complete", {}); }
      });
    });
    $("[data-demo-reset]", demo).addEventListener("click", function () { filled = 0; renderDemo(); });
    renderDemo();
  } else if (demo) {
    var stamps = $$(".demo-stamp:not(.rw)", demo), rw = $(".demo-stamp.rw", demo), msg = $(".demo-msg", demo), cnt = $("[data-demo-count]", demo), n = 0;
    var upd = function () {
      stamps.forEach(function (s, i) { s.classList.toggle("on", i < n); s.setAttribute("aria-pressed", i < n); });
      if (cnt) cnt.textContent = n + "/" + (stamps.length + 1);
      msg.textContent = n >= stamps.length ? "Recompensa liberada! Mostre este cartão no balcão." : n === 0 ? "Toque nos círculos para dar carimbos." : "Faltam " + (stamps.length - n) + " para a recompensa.";
    };
    stamps.forEach(function (s, i) { s.addEventListener("click", function () { n = (i + 1 === n) ? i : i + 1; upd(); if (n === stamps.length) track("demo_complete", {}); else if (n === 1) track("demo_start", {}); }); });
    if (rw) rw.addEventListener("click", function () { n = n >= stamps.length ? 0 : stamps.length; upd(); });
    upd();
  }

  /* ---- calculadora de retorno (estimativa) */
  var calc = $("[data-calc]");
  if (calc) {
    var brl = function (v) { return "R$ " + Math.round(v).toLocaleString("pt-BR"); };
    var ci = $("#calc-c", calc), ti = $("#calc-t", calc), vi = $("#calc-v", calc), used = false;
    var run = function () {
      var c = +ci.value, t = +ti.value, v = +vi.value, extra = c * t * v;
      $("#calc-c-o", calc).textContent = c.toLocaleString("pt-BR"); $("#calc-t-o", calc).textContent = brl(t); $("#calc-v-o", calc).textContent = String(v).replace(".", ",");
      $("#calc-out", calc).textContent = brl(extra);
      $("#calc-note", calc).textContent = extra > 0 ? "Estimativa: " + c.toLocaleString("pt-BR") + " clientes × " + brl(t) + " × " + String(v).replace(".", ",") + " visita(s) a mais por mês, antes de descontar margem e custo das recompensas." : "Mova os controles para simular.";
      if (!used) { used = true; track("calc_use", {}); }
    };
    [ci, ti, vi].forEach(function (i) { i.addEventListener("input", run); }); run(); used = false;
  }

  /* ---- preço mensal/anual */
  $$("[data-billing]").forEach(function (b) {
    b.addEventListener("click", function () {
      var m = b.getAttribute("data-billing"); $$("[data-billing]").forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
      $$("[data-price]").forEach(function (p) { p.textContent = p.getAttribute("data-" + m); });
      $$("[data-price-note]").forEach(function (p) { p.textContent = p.getAttribute("data-" + m); });
      track("billing_toggle", { period: m });
    });
  });
  if (/^\/precos\//.test(page)) track("view_pricing", {});

  /* ---- formulário de contato/lead (RPC submit_lead no Supabase) */
  var form = $("form[data-lead]");
  if (form) {
    var cfg = window.CF_SITE || {}, out = $(".form-msg", form), btn = $("button[type=submit]", form), start = Date.now();
    form.addEventListener("submit", function (e) {
      e.preventDefault(); out.hidden = true;
      var d = new FormData(form);
      if (d.get("website")) return; // isca anti-robô preenchida
      if (!d.get("consent")) { out.className = "form-msg err"; out.textContent = "Marque a caixa de consentimento para enviarmos sua mensagem."; out.hidden = false; return; }
      if (Date.now() - start < 1500) return; // rápido demais para ser humano
      if (!cfg.supabaseUrl || !cfg.anonKey) { out.className = "form-msg err"; out.innerHTML = 'O envio está indisponível agora. Escreva para <a href="mailto:' + (cfg.contactEmail || "") + '">' + (cfg.contactEmail || "nosso e-mail") + "</a>."; out.hidden = false; return; }
      btn.disabled = true; btn.setAttribute("aria-busy", "true");
      var base = cfg.supabaseUrl.replace(/\/$/, ""), src = Object.assign({ page: page, ref: document.referrer ? document.referrer.slice(0, 200) : "" }, attr());
      // 1º a função forms-intake (guarda o contato e repassa para o seu sistema, se configurado); sem ela, direto no banco
      var viaFn = Object.assign({ source: "site", name: d.get("name"), email: d.get("email"), phone: d.get("phone") || "", business: d.get("business") || "", segment: d.get("segment") || "", message: d.get("message") || "", consent: true, website: d.get("website") || "" }, src);
      var viaRpc = { p_name: d.get("name"), p_email: d.get("email"), p_phone: d.get("phone") || null, p_business: d.get("business") || null, p_segment: d.get("segment") || null, p_message: d.get("message") || null, p_consent: true, p_hp: d.get("website") || "", p_source: src };
      var headers = { "Content-Type": "application/json", apikey: cfg.anonKey, Authorization: "Bearer " + cfg.anonKey };
      fetch(base + "/functions/v1/forms-intake", { method: "POST", headers: headers, body: JSON.stringify(viaFn) })
        .then(function (r) { return r.status === 404 ? fetch(base + "/rest/v1/rpc/submit_lead", { method: "POST", headers: headers, body: JSON.stringify(viaRpc) }) : r; })
        .then(function (r) { if (!r.ok) throw new Error("http " + r.status); track("generate_lead", { form: form.getAttribute("data-lead"), page: page }); location.href = "/obrigado/"; })
        .catch(function () { btn.disabled = false; btn.removeAttribute("aria-busy"); out.className = "form-msg err"; out.textContent = "Não foi possível enviar agora. Confira os campos e tente de novo em instantes."; out.hidden = false; });
    });
  }
})();
