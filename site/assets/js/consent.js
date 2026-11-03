/* Consentimento (LGPD) + Google Consent Mode v2 + carregamento condicional de GA4, Google Ads, GTM, Meta, TikTok e Clarity.
   Nada de terceiros é carregado antes do "Aceitar". API: window.cfTrack(evento, parâmetros). */
(function () {
  "use strict";
  var T = window.CF_TRACK || {}, KEY = "cf_consent_v1", dl = (window.dataLayer = window.dataLayer || []);
  function gtag() { dl.push(arguments); }
  window.gtag = window.gtag || gtag;
  var has = !!(T.gtmId || T.ga4 || T.googleAds || T.metaPixel || T.tiktokPixel || T.clarity);
  var gpc = !!navigator.globalPrivacyControl; // sinal "não me rastreie" do navegador
  gtag("consent", "default", { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "denied", functionality_storage: "granted", security_storage: "granted", wait_for_update: 500 });
  gtag("set", "url_passthrough", true); gtag("set", "ads_data_redaction", true);

  function read() { try { var v = JSON.parse(localStorage.getItem(KEY) || "null"); return v && typeof v === "object" ? v : null; } catch (e) { return null; } }
  function save(v) { v.t = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} }
  var loaded = {};
  function script(src) { var s = document.createElement("script"); s.async = true; s.src = src; document.head.appendChild(s); return s; }

  function load(c) {
    if (!has) return;
    if (T.gtmId && !loaded.gtm && (c.analytics || c.marketing)) { loaded.gtm = 1; dl.push({ "gtm.start": Date.now(), event: "gtm.js" }); script("https://www.googletagmanager.com/gtm.js?id=" + encodeURIComponent(T.gtmId)); }
    if (!T.gtmId && (T.ga4 || T.googleAds) && (c.analytics || c.marketing) && !loaded.gtag) {
      loaded.gtag = 1; script("https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(T.ga4 || T.googleAds)); gtag("js", new Date());
      if (T.ga4) gtag("config", T.ga4);
      if (T.googleAds) gtag("config", T.googleAds);
    }
    if (T.metaPixel && c.marketing && !loaded.fb) {
      loaded.fb = 1;
      (function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = true; n.version = "2.0"; n.queue = []; t = b.createElement(e); t.async = true; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
      window.fbq("init", T.metaPixel); window.fbq("track", "PageView");
    }
    if (T.tiktokPixel && c.marketing && !loaded.tt) {
      loaded.tt = 1;
      !function (w, d, t) { w.TiktokAnalyticsObject = t; var ttq = w[t] = w[t] || []; ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie"]; ttq.setAndDefer = function (t2, e) { t2[e] = function () { t2.push([e].concat(Array.prototype.slice.call(arguments, 0))); }; }; for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]); ttq.load = function (e) { var n = "https://analytics.tiktok.com/i18n/pixel/events.js"; ttq._i = ttq._i || {}; ttq._i[e] = []; ttq._i[e]._u = n; ttq._t = ttq._t || {}; ttq._t[e] = +new Date(); var o = d.createElement("script"); o.type = "text/javascript"; o.async = true; o.src = n + "?sdkid=" + e + "&lib=" + t; var a = d.getElementsByTagName("script")[0]; a.parentNode.insertBefore(o, a); }; ttq.load(T.tiktokPixel); ttq.page(); }(window, document, "ttq");
    }
    if (T.clarity && c.analytics && !loaded.cl) {
      loaded.cl = 1;
      (function (c2, l, a, r, i) { c2[a] = c2[a] || function () { (c2[a].q = c2[a].q || []).push(arguments); }; var t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i; var y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y); })(window, document, "clarity", "script", T.clarity);
    }
  }
  function apply(c) {
    window.CF_CONSENT = c;
    gtag("consent", "update", { analytics_storage: c.analytics ? "granted" : "denied", ad_storage: c.marketing ? "granted" : "denied", ad_user_data: c.marketing ? "granted" : "denied", ad_personalization: c.marketing ? "granted" : "denied" });
    load(c);
    document.dispatchEvent(new CustomEvent("cf:consent", { detail: c }));
  }
  var saved = read(); window.CF_CONSENT = saved || { analytics: false, marketing: false };
  if (saved) apply(saved);

  // evento padrão: vai ao dataLayer e às ferramentas que estiverem carregadas
  var FB = { generate_lead: "Lead", cta_signup: "InitiateCheckout", view_pricing: "ViewContent", calc_use: "CustomizeProduct" };
  window.cfTrack = function (name, p) {
    p = p || {}; var ev = { event: name }, k; for (k in p) ev[k] = p[k]; dl.push(ev);
    try {
      if (window.fbq && FB[name]) window.fbq("track", FB[name], p);
      if (window.ttq && window.ttq.track) window.ttq.track(name, p);
      if (!T.gtmId && loaded.gtag) {
        if (T.ga4) window.gtag("event", name, p);
        var label = name === "generate_lead" ? T.adsLeadLabel : name === "cta_signup" ? T.adsSignupLabel : "";
        if (T.googleAds && label) window.gtag("event", "conversion", { send_to: T.googleAds + "/" + label });
      }
    } catch (e) {}
  };

  // ---- banner (só aparece se houver alguma ferramenta configurada)
  function ui() {
    var box = document.getElementById("cf-consent"); if (!box || !has) return;
    function show(detail) {
      var cur = read() || { analytics: false, marketing: false };
      box.hidden = false; document.body.classList.add("has-consent");
      box.innerHTML = '<h2 id="cf-consent-t">Sua privacidade importa</h2><p>Usamos cookies para medir o uso do site e, se você permitir, para medir e melhorar nossos anúncios. Os necessários não coletam dados pessoais. Você pode mudar de ideia quando quiser. <a href="/cookies/">Saiba mais</a>.' + (gpc ? " Detectamos o sinal <em>Global Privacy Control</em> do seu navegador e o respeitamos." : "") + "</p>" +
        (detail ? '<div class="consent-opts"><label><input type="checkbox" checked disabled> <span><b>Necessários</b>: o site não funciona sem eles.</span></label><label><input type="checkbox" id="cf-c-an"' + (cur.analytics ? " checked" : "") + '> <span><b>Estatísticas</b>: entender quais páginas ajudam (Google Analytics' + (T.clarity ? ", Clarity" : "") + ').</span></label><label><input type="checkbox" id="cf-c-mk"' + (cur.marketing ? " checked" : "") + '> <span><b>Marketing</b>: medir e otimizar anúncios (Google Ads, Meta' + (T.tiktokPixel ? ", TikTok" : "") + ').</span></label></div>' : "") +
        '<div class="consent-btns">' + (detail ? '<button type="button" class="btn dark" data-c="save">Salvar escolhas</button>' : '<button type="button" class="btn" data-c="more">Escolher</button>') + '<button type="button" class="btn" data-c="no">Só o necessário</button>' + (gpc ? "" : '<button type="button" class="btn primary" data-c="all">Aceitar tudo</button>') + "</div>";
      var first = box.querySelector("button"); if (first && detail) first.focus();
    }
    function done(c) { save(c); apply(c); box.hidden = true; box.innerHTML = ""; document.body.classList.remove("has-consent"); }
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[data-c]"); if (!b) return; var a = b.getAttribute("data-c");
      if (a === "all") done({ analytics: true, marketing: true });
      else if (a === "no") done({ analytics: false, marketing: false });
      else if (a === "more") show(true);
      else if (a === "save") done({ analytics: !!box.querySelector("#cf-c-an").checked, marketing: !!box.querySelector("#cf-c-mk").checked });
    });
    document.addEventListener("click", function (e) { if (e.target.closest("[data-consent-open]")) show(true); });
    if (!saved) show(false);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ui); else ui();
})();
