/* Cliente Fiel — núcleo: estado, utilitários, ícones, UI e roteador.
   Scripts clássicos (sem ES modules) para funcionar abrindo o index.html direto (file://). */
(function () {
  "use strict";
  const CF = (window.CF = { actions: {}, pages: [] });

  /* ------------------------------------------------------------------ config */
  CF.config = {
    product: "Seu Cliente Fiel",
    publicBase: "https://meu.clientefiel.example", // troque pelo seu domínio
    // Preços de exemplo (placeholders) — ajuste ao seu modelo de negócio.
    prices: { pro: 79, proYear: 708, business: 149, multi: 449, extraLocation: 99 },
    freeClientLimit: 30,
    paidClientLimit: 3000, // 100× o limite do Free
    trialDays: 21, // teste premium: conta a partir da data de criação da conta
  };

  /* ------------------------------------------------------------------- utils */
  CF.esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  CF.uid = () => (window.crypto && crypto.randomUUID ? crypto.randomUUID().slice(0, 13) : Date.now().toString(36) + Math.random().toString(36).slice(2, 8));
  // Inicial para avatar: primeira letra/dígito, ignorando colchetes, aspas e espaços.
  CF.initial = (s) => { const m = String(s == null ? "" : s).match(/[\p{L}\p{N}]/u); return (m ? m[0] : "?").toUpperCase(); };
  // Normaliza para busca: minúsculas e sem acentos.
  CF.norm = (s) => String(s == null ? "" : s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  // Valor seguro para url() em CSS (remove aspas, barras e quebras de linha).
  // aspas simples: o resultado costuma ir dentro de style="..." (aspas duplas quebrariam o atributo)
  CF.cssUrl = (u) => `url('${String(u == null ? "" : u).replace(/["'\\\n\r()]/g, "")}')`;
  // Chave de mês "AAAA-MM" para limites mensais.
  CF.monthKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  CF.$ = (sel, root) => (root || document).querySelector(sel);
  CF.$$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  CF.fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString(CF.locale(), { day: "numeric", month: "short", year: "numeric" }) : "—");
  CF.fmtDateTime = (iso) => new Date(iso).toLocaleString(CF.locale(), { dateStyle: "short", timeStyle: "short" });
  CF.money = (n) => "R$ " + Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  CF.nowTime = () => new Date().toLocaleTimeString(CF.locale(), { hour: "2-digit", minute: "2-digit" });
  CF.plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  // Link da página do cliente (o que o QR do dono abre). Enquanto publicBase for o exemplo, usa o endereço de onde o painel
  // está sendo servido (ex.: http://192.168.0.10:8080/app/c/?s=slug) — assim o QR funciona num celular na mesma rede.
  // Atenção: "localhost" só abre no próprio computador; para testar no celular, sirva pelo IP da máquina.
  // src (opcional) marca de onde a pessoa veio — "qr" (QR impresso/imagem), "link" (link copiado), "whatsapp"… — e aparece
  // em Clientes → Visitantes ("De onde vieram"). A página do cliente lê e tira a marca da barra de endereço.
  CF.withSrc = (u, src) => (src ? u + (u.indexOf("?") >= 0 ? "&" : "?") + "src=" + encodeURIComponent(src) : u);
  CF.publicUrl = (src) => {
    const base = CF.config.publicBase;
    if (base && !/clientefiel\.example/.test(base)) return CF.withSrc(`${base}/${CF.state.biz.slug}`, src);
    const here = location.href.replace(/[#?].*$/, "").replace(/index\.html$/, "").replace(/\/$/, "");
    return CF.withSrc(`${here}/c/?s=${encodeURIComponent(CF.state.biz.slug)}`, src);
  };
  CF.publicUrlIsLocal = () => /^https?:\/\/(localhost|127\.0\.0\.1)/.test(CF.publicUrl());
  CF.debounce = (fn, ms = 200) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  CF.download = (filename, content, type = "text/plain;charset=utf-8") => {
    const blob = content instanceof Blob ? content : new Blob([content], { type });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };
  CF.copy = async (text) => {
    try { await navigator.clipboard.writeText(text); return true; }
    catch (e) {
      const t = document.createElement("textarea"); t.value = text; document.body.appendChild(t); t.select();
      let ok = false; try { ok = document.execCommand("copy"); } catch (_) {} t.remove(); return ok;
    }
  };
  // Lê um arquivo de imagem, reduz e devolve dataURL (mantém o localStorage leve).
  CF.readImage = (file, maxW = 900, quality = 0.85) => new Promise((res, rej) => {
    if (!file || !/^image\//.test(file.type)) return rej(new Error("Escolha uma imagem JPG, PNG ou WebP."));
    if (file.size > 8 * 1024 * 1024) return rej(new Error("A imagem deve ter até 8 MB."));
    const fr = new FileReader();
    fr.onerror = () => rej(new Error("Não foi possível ler o arquivo."));
    fr.onload = () => {
      const img = new Image();
      img.onerror = () => rej(new Error("Imagem inválida."));
      img.onload = () => {
        const k = Math.min(1, maxW / img.width);
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL("image/jpeg", quality));
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });

  /* ------------------------------------------------------------------- icons */
  const P = {
    grid: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
    home: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    "user-plus": '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/>',
    list: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 8h10"/><path d="M7 12h10"/><path d="M7 16h6"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    megaphone: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
    star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    cake: '<path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/><path d="M2 21h20"/><path d="M7 8v3"/><path d="M12 8v3"/><path d="M17 8v3"/><path d="M7 4h.01"/><path d="M12 4h.01"/><path d="M17 4h.01"/>',
    clipboard: '<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    phone: '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>',
    card: '<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>',
    settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    "chevron-down": '<path d="m6 9 6 6 6-6"/>',
    "chevron-up": '<path d="m18 15-6-6-6 6"/>',
    "chevron-right": '<path d="m9 18 6-6-6-6"/>',
    "chevron-left": '<path d="m15 18-6-6 6-6"/>',
    "panel-left": '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="m16 15-3-3 3-3"/>',
    "panel-right": '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="m14 9 3 3-3 3"/>',
    "arrow-right": '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    "arrow-left": '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    minus: '<path d="M5 12h14"/>',
    upload: '<path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    filter: '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    external: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    palette: '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.65-.75 1.65-1.69 0-.44-.18-.84-.44-1.13-.29-.29-.44-.65-.44-1.13a1.64 1.64 0 0 1 1.67-1.67h2c3.05 0 5.55-2.5 5.55-5.55C21.97 6.01 17.46 2 12 2z"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    pause: '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
    play: '<polygon points="6 3 20 12 6 21 6 3"/>',
    archive: '<rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>',
    file: '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/>',
    sparkles: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
    alert: '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>',
    warn: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    refresh: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    crown: '<path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>',
    "image-plus": '<path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"/><line x1="16" x2="22" y1="5" y2="5"/><line x1="19" x2="19" y1="2" y2="8"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
    menu: '<line x1="3" x2="21" y1="6" y2="6"/><line x1="3" x2="15" y1="12" y2="12"/><line x1="3" x2="18" y1="18" y2="18"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
    pencil: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
    wifi: '<path d="M5 13a10 10 0 0 1 14 0"/><path d="M8.5 16.5a5 5 0 0 1 7 0"/><path d="M2 8.82a15 15 0 0 1 20 0"/><line x1="12" x2="12.01" y1="20" y2="20"/>',
    calculator: '<rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><path d="M16 10h.01M12 10h.01M8 10h.01M12 14h.01M8 14h.01M12 18h.01M8 18h.01M16 14v4"/>',
    printer: '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/>',
    zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/>',
    qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14h1v1h-1zM14 20h1v1h-1zM18 18h3v3h-3z"/>',
    mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>',
    coffee: '<path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><path d="M6 2v2"/><path d="M10 2v2"/><path d="M14 2v2"/>',
    scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" x2="8.12" y1="4" y2="15.88"/><line x1="14.47" x2="20" y1="14.48" y2="20"/><line x1="8.12" x2="12" y1="8.12" y2="12"/>',
    utensils: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
    calendar: '<rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>',
    eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    sort: '<path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>',
    facebook: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    "life-buoy": '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><path d="m4.93 4.93 4.24 4.24M14.83 9.17l4.24-4.24M14.83 14.83l4.24 4.24M9.17 14.83l-4.24 4.24"/>',
    "log-out": '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
    tag: '<path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/>',
    chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  };
  // Interface em SVG; os cartões usam as gravuras próprias de CFThemes.
  CF.navIcon = (name, cls = "") => CF.icon(name, cls);
  CF.icon = (name, cls = "") => String(name).indexOf("brand:") === 0 && window.CFBrands && window.CFBrands.has(String(name).slice(6)) ? window.CFBrands.svg(String(name).slice(6), "ic " + cls) :
    `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || P.info}</svg>`;
  const I = CF.icon;
  CF.brandIco = (it, cls = "") => { const B = window.CFBrands; if (!B || !it) return ""; const k = B.ofItem(it); if (k && B.has(k)) return B.svg(k, "ic " + cls);
    if ((it.type === "link" || it.type === "social") && /^https:\/\//i.test(it.url || "")) return `${B.fav(it.url, "ic " + cls)}<span class="fav-fb">${I("link", cls)}</span>`; return ""; };
  const gradStops = (cs, ws) => { const n = cs.length, w0 = (ws && ws.length === n && ws.every((x) => x > 0)) ? ws : cs.map(() => 100 / n), tot = w0.reduce((a, b) => a + b, 0), w = w0.map((x) => (x / tot) * 100); let s = 0; const out = []; cs.forEach((c, i) => { const a = i === 0 ? 0 : s + w[i] * 0.3, b = i === n - 1 ? 100 : s + w[i] * 0.7; out.push(`${c} ${a.toFixed(1)}%`, `${c} ${b.toFixed(1)}%`); s += w[i]; }); return out.join(","); };
  CF.gradStops = gradStops;
  // depois do cadastro: "card" = só o cartão em destaque (resto em "Ver mais") · "all" = tudo aberto. Páginas antigas: "all".
  CF.cardFocus = () => { const v = ((CF.state.biz || {}).pageBg || {}).cardFocus; return v === "card" ? "card" : "all"; };
  CF.pageBgCss = (b) => { const g = (b && b.pageBg) || {}; const base = (b && b.pageColor) || "#fef0c7";
    if (g.type === "image" && g.image) return `${base} ${CF.cssUrl(g.image)} center/cover no-repeat`;   // sem "fixed": nas prévias do painel o fundo fica preso ao celular, não à janela
    if (g.type === "gradient") { const cs = (g.colors || []).filter(Boolean).slice(0, 4); if (cs.length >= 2) return `linear-gradient(${+g.angle || 160}deg,${gradStops(cs, g.weights)})`; }
    return base; };
  CF.iconCols = (n) => { if (n <= 4) return 4; if (n <= 6) return n; let best = 6, gap = 9; [6, 5, 4].forEach((c) => { const g = (c - (n % c)) % c; if (g < gap) { gap = g; best = c; } }); return best; };

  /* ------------------------------------------------------------------- state */
  const KEY = "clientefiel.v1";
  const seed = () => ({
    v: 1,
    // Placeholders: tudo entre colchetes é para o dono preencher em Configurações / Sua página.
    user: { name: "[Seu nome]", email: "voce@suaempresa.com.br" },
    biz: {
      name: "[SUA EMPRESA]", slug: "sua-empresa", tagline: "[Sua frase de apresentação]",
      address: "[Endereço da empresa]",
      logo: "assets/img/logo-placeholder.png", cover: null, pageColor: "#fef0c7", pageBg: { type: "color", colors: ["#fef0c7", "#fce7f6"], angle: 160, image: null },
      lang: "pt-BR", tz: "America/Sao_Paulo", currency: "BRL", type: "Café", visitFreq: "weekly",
      legalType: "individual", legalName: "", privacyEmail: "voce@suaempresa.com.br", customFields: [],
    },
    plan: { name: "Free", trial: true, billing: "monthly", since: new Date().toISOString() },
    onboarding: { installed: false, stamped: false, app: false, shared: false },
    cards: [{ id: "c1", name: "[SUA EMPRESA]", stamps: 8, header: "RECOMPENSAS", rewardText: "Colete carimbos e ganhe recompensas!", rewardLabel: "[Sua recompensa]", theme: "classico", autoSeasonal: false, model: "premium", design: {}, active: true }],
    customers: [{ id: "u1", name: "[Cliente de exemplo]", email: "cliente@exemplo.com.br", phone: "", stamps: 0, total: 0, last: null, created: new Date().toISOString() }],
    totals: { stamps: 0, redeemed: 0 },
    campaigns: [],
    birthday: { configured: false, active: false, notification: "🎂 Feliz aniversário! Sua surpresa está à espera", header: "ANIVERSÁRIO", cardText: "Surpresa de aniversário à espera 🎂", banner: "tp:aniversario:0", bannerFx: { blur: 2, tint: "dark", amount: 25 }, style: "hidden", validity: "2w", email: false },
    surveys: [{
      id: "s1", title: "Como foi sua experiência?", status: "active", created: new Date(Date.now() - 2 * 3600e3).toISOString(),
      questions: [{ text: "Como foi sua experiência conosco?", kind: "stars", required: true }, { text: "Gostaria de acrescentar algo?", kind: "text", required: false }],
      sent: 0, responses: [],
    }],
    google: { name: "", address: "", url: "" },
    staff: [],
    locations: [],                             // filiais: { id, name, address, phone, active } (a matriz é o próprio negócio)
    role: "owner",                             // owner | staff — quem entrou (data.js: my_workspace)
    locStats: null,                            // números por filial vindos do servidor (location_stats); null em demonstração
    savedTexts: { notif: [], text: [] }, // textos de campanha guardados pelo dono (bloco "Salvos")
    pageItems: [
      { id: "pi-wa", type: "contact", title: "WhatsApp", url: "", href: "", iconOnly: true },
      { id: "pi-wifi", type: "wifi", title: "Wi-Fi do estabelecimento", body: "", iconOnly: true },
      { id: "pi-ig", type: "social", title: "Instagram", url: "", iconOnly: true },
    ],
    share: { style: 0, tab: "post", bg: "g0", bgImage: null, title: "Nosso cartão fidelidade, agora no seu celular", show: { logo: true, name: true, title: true, qr: true, wallet: true, link: true }, caption: "" },
    print: { design: 0, format: "a6", name: "[SUA EMPRESA]", upper: true, title: "Seu negócio.\nSeu cartão.", support: "Mostre seu cartão no balcão a cada visita.", qrText: "Escaneie para pegar nosso cartão", scan: "Abra a câmera do celular para começar" },
    monthlySends: { month: CF.monthKey(), used: 0 },
    seenNews: false,
    // regras do cartão: carimbo de boas-vindas no cadastro e comprovante pelo WhatsApp (pedidos aparecem em Clientes)
    welcome: { mode: "off", qty: 1 },          // off | auto | approve
    receipts: { on: true, phone: "" },         // phone vazio = WhatsApp dos contatos da página
    requests: [],                              // pedidos de carimbo abertos: { id, customerId, kind: welcome|receipt, qty, created }
    presence: { radius: 150 },                 // conteúdo só no local: ponto da loja (lat/lng) e raio em metros
    networks: [],                              // redes Wi-Fi da loja cadastradas: { id, label, created, lastSeen }
    ext: { isAdmin: false, nav: [], forja: null, ready: false },  // superadmin + itens de menu atribuídos + chatbot Forja (ver assets/js/ext.js)
  });
  // Merge profundo de objetos simples: campos novos do seed sobrevivem, dados salvos têm prioridade.
  const isObj = (x) => x && typeof x === "object" && !Array.isArray(x);
  const deepMerge = (base, over) => {
    if (!isObj(base) || !isObj(over)) return over === undefined ? base : over;
    const out = Object.assign({}, base);
    for (const k of Object.keys(over)) out[k] = isObj(base[k]) && isObj(over[k]) ? deepMerge(base[k], over[k]) : over[k];
    return out;
  };
  const migrate = (s) => {
    if (!s.biz.pageBg) s.biz.pageBg = { type: "color", colors: [s.biz.pageColor || "#fef0c7", "#fce7f6"], angle: 160, image: null };
    if (!s.savedTexts) s.savedTexts = { notif: [], text: [] };
    // modelo único: todo cartão é personalizável (o antigo "Clássico" virou o formato Compacto)
    (s.cards || []).forEach((c) => { c.model = "premium"; if (!c.design || typeof c.design !== "object") c.design = {}; });
    if (s.plan && !s.plan.since) s.plan.since = new Date().toISOString();
    // estados salvos antes da troca para placeholders ainda trazem os dados do painel de referência
    const legacy = (v) => /prospectador/i.test(String(v == null ? "" : v));
    if (s.biz) {
      if (legacy(s.biz.logo) || /logo-prospectador/.test(s.biz.logo || "") || /logo-placeholder\.svg$/.test(s.biz.logo || "")) s.biz.logo = "assets/img/logo-placeholder.png";
      if (legacy(s.biz.name)) { s.biz.name = "[SUA EMPRESA]"; s.biz.slug = "sua-empresa"; }
      if (s.biz.tagline === "um teste de teste") s.biz.tagline = "[Sua frase de apresentação]";
      if (/Rua Exemplo, 123/.test(s.biz.address || "")) s.biz.address = "[Endereço da empresa]";
      if (s.biz.privacyEmail === "pedro@exemplo.com.br") s.biz.privacyEmail = "voce@suaempresa.com.br";
    }
    if (s.user && (s.user.name === "Pedro Campos" || s.user.email === "pedro@exemplo.com.br")) s.user = { name: "[Seu nome]", email: "voce@suaempresa.com.br" };
    if (s.print && legacy(s.print.name)) s.print.name = "[SUA EMPRESA]";
    (s.cards || []).forEach((c) => { if (legacy(c.name)) c.name = "[SUA EMPRESA]"; if (c.rewardLabel === "Um café por conta da casa") c.rewardLabel = "[Sua recompensa]"; if (!c.theme) c.theme = "classico"; if (c.autoSeasonal == null) c.autoSeasonal = false; });
    (s.customers || []).forEach((c) => { if (c.id === "u1" && c.name === "Pedro") { c.name = "[Cliente de exemplo]"; c.email = "cliente@exemplo.com.br"; } });
    // monthlySends antigo guardava só o índice do mês (0–11), sem o ano
    if (s.monthlySends && typeof s.monthlySends.month === "number") {
      const same = s.monthlySends.month === new Date().getMonth();
      s.monthlySends = { month: CF.monthKey(), used: same ? s.monthlySends.used : 0 };
    }
    s.v = 1;
    return s;
  };
  const load = () => {
    try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && typeof s === "object") return migrate(deepMerge(seed(), s)); } catch (e) {}
    return seed();
  };
  CF.state = load();
  // status de salvamento (barra "Tudo salvo" das telas): saving | saved | error
  CF.saveStatus = (st) => { CF.lastSave = { st, at: Date.now() }; try { document.dispatchEvent(new CustomEvent("cf:save", { detail: CF.lastSave })); } catch (e) {} };
  // salvamento automático (Configurações › Salvamento). Desligado: as mudanças ficam só na tela até "Salvar" (barra do topo e das telas).
  CF.autosave = () => { try { return localStorage.getItem("clientefiel.autosave") !== "0"; } catch (e) { return true; } };
  CF.setAutosave = (on) => { try { on ? localStorage.removeItem("clientefiel.autosave") : localStorage.setItem("clientefiel.autosave", "0"); } catch (e) {} if (on && CF.lastSave && CF.lastSave.st === "dirty") CF.saveNow(); CF.repaintShell && CF.repaintShell(); };
  CF.isDirty = () => !!(CF.lastSave && CF.lastSave.st === "dirty");
  const persistLocal = () => { try { localStorage.setItem(KEY, JSON.stringify(CF.state)); CF.saveStatus("saved"); return true; } catch (e) { CF.saveStatus("error"); CF.toast("Não foi possível salvar (armazenamento cheio). A alteração vale só até recarregar.", "err"); return false; } };
  CF.saveNow = async () => { persistLocal(); };
  CF.save = () => { if (!CF.autosave()) { CF.saveStatus("dirty"); return true; } return persistLocal(); };
  // sair com alterações não salvas: o navegador pergunta antes
  window.addEventListener("beforeunload", (e) => { if (CF.isDirty()) { e.preventDefault(); e.returnValue = ""; } });
  CF.update = (fn) => { fn(CF.state); CF.save(); };
  CF.resetDemo = () => { CF.state = seed(); CF.save(); };
  CF.card = () => CF.state.cards.find((c) => c.active) || CF.state.cards[0];

  /* ---------------------------------------------------------------------- UI */
  const root = () => CF.$("#overlay-root");
  // toast(msg, kind, { action: "Desfazer", onAction, ms })
  CF.toast = (msg, kind = "ok", opts = {}) => {
    const el = document.createElement("div");
    el.className = `toast ${kind}`;
    if (kind === "err") el.setAttribute("role", "alert");
    el.innerHTML = `${I(kind === "err" ? "alert" : "check")}<span>${CF.esc(msg)}</span>${opts.action ? `<button class="toast-act" type="button">${CF.esc(opts.action)}</button>` : ""}<button class="toast-x" type="button" aria-label="Fechar aviso" title="Fechar">${I("x", "sm")}</button>`;
    el.querySelector(".toast-x").addEventListener("click", () => el.remove());
    const b = el.querySelector(".toast-act");
    if (b) b.addEventListener("click", () => { el.remove(); opts.onAction && opts.onAction(); });
    CF.$("#toasts").appendChild(el);
    setTimeout(() => el.remove(), opts.ms || (opts.action ? 6000 : 3500));
    return el;
  };
  const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  function openLayer(html, { side = false, onClose } = {}) {
    const ov = document.createElement("div");
    ov.className = "overlay" + (side ? " right" : "");
    ov.innerHTML = html;
    const prev = document.activeElement;
    let closed = false;
    const close = () => {
      if (closed) return; closed = true;
      ov.remove(); document.removeEventListener("keydown", onKey); onClose && onClose();
      if (!root().querySelector(".overlay")) { CF.$(".app").removeAttribute("aria-hidden"); CF.$(".app").inert = false; }
      if (prev && prev.isConnected && typeof prev.focus === "function") prev.focus({ preventScroll: true });
    };
    const isTop = () => root().lastElementChild === ov;
    const onKey = (e) => {
      if (!isTop()) return;
      if (e.key === "Escape") { e.preventDefault(); return close(); }
      if (e.key === "Tab") { // mantém o foco dentro da camada
        const f = CF.$$(FOCUSABLE, ov).filter((x) => x.offsetParent !== null);
        if (!f.length) return e.preventDefault();
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && (document.activeElement === first || !ov.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    ov.addEventListener("mousedown", (e) => { if (e.target === ov) close(); });
    ov.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) close(); });
    document.addEventListener("keydown", onKey);
    root().appendChild(ov);
    const app = CF.$(".app"); if (app) { app.setAttribute("aria-hidden", "true"); app.inert = true; }
    const f = ov.querySelector("[autofocus]") || ov.querySelector("input,textarea,select,button.btn") || ov.querySelector(FOCUSABLE);
    f && f.focus({ preventScroll: true });
    ov.close = close;
    return ov;
  }
  CF.closeLayers = () => CF.$$("#overlay-root > .overlay").forEach((o) => o.close && o.close());
  CF.modal = ({ title, sub = "", body = "", foot = "", size = "", onClose }) =>
    openLayer(
      `<div class="modal ${size}" role="dialog" aria-modal="true" aria-label="${CF.esc(title)}">
        <button class="m-x" data-close aria-label="Fechar">${I("x")}</button>
        <h2>${title}</h2>${sub ? `<p class="m-sub">${sub}</p>` : ""}
        <div class="m-body">${body}</div>${foot ? `<div class="m-foot">${foot}</div>` : ""}
      </div>`, { onClose });
  CF.drawer = ({ title, sub = "", body = "", onClose }) =>
    openLayer(
      `<aside class="drawer" role="dialog" aria-modal="true" aria-label="${CF.esc(title)}">
        <div class="d-h"><div><h2>${title}</h2>${sub ? `<p>${sub}</p>` : ""}</div><button class="m-x" data-close aria-label="Fechar">${I("x")}</button></div>
        <div class="d-b">${body}</div></aside>`, { side: true, onClose });
  CF.confirm = ({ title, text, ok = "Confirmar", danger = false, onOk }) => {
    const ov = CF.modal({
      title, body: `<p class="muted">${text}</p>`,
      foot: `<button class="btn" data-close>Cancelar</button><button class="btn ${danger ? "danger-solid" : "primary"}" data-ok>${ok}</button>`,
    });
    ov.querySelector("[data-ok]").addEventListener("click", () => { ov.close(); onOk && onOk(); });
    return ov;
  };

  /* ------------------------------------------------------------- shell + nav */
  const NAV = [
    { label: "Menu", items: [["dash", "Painel", "home", "/"], ["customers", "Clientes", "users", "/customers"], ["page", "Visão geral", "pencil", "/page"], ["app", "Aplicativo e telas", "phone", "/app"]] },
    { label: "Cartões", items: [["cards", "Gerenciar cartões", "card", "/cards"], ["catalog", "Criar novo catálogo", "tag", "/page/catalog"], ["pageadd", "Adicionar à página", "plus", "/page/add"], ["locations", "Cartões de filiais", "pin", "/locations"]] },
    { label: "Monetize", items: [["campaigns", "Campanhas", "megaphone", "/campaigns", "dot"], ["reviews", "Avaliações Google", "star", "/reviews"], ["birthdays", "Aniversários", "cake", "/birthdays"], ["surveys", "Pesquisas", "clipboard", "/surveys"]] },
  ];
  /* ---------------------------------------------------------- teste premium (21 dias)
     Conta a partir de plan.since (data de criação da conta). Some em contas pagas (plano diferente de Free).
     day = dia atual do teste (1..total); left = dias restantes; active = ainda dentro dos 21 dias. */
  // marca d'água "Seu Cliente Fiel" em toda página de conta que não é premium (plano Free, inclusive durante o teste)
  CF.ext = CF.ext || {}; // superadmin + itens de menu atribuídos + Forja: preenchido por data.js e assets/js/ext.js (carregados depois das telas)
  CF.isPremium = () => CF.state.plan && CF.state.plan.name !== "Free";
  /* ---- equipe e filiais ---- */
  CF.isStaff = () => CF.state.role === "staff";   // funcionário: só Painel, Clientes e Carimbar
  CF.locations = () => (CF.state.locations || []).filter((l) => l.active !== false);
  CF.locName = (id) => { if (!id) return ""; const l = (CF.state.locations || []).find((x) => x.id === id); return l ? l.name : ""; };
  // filial em que ESTE aparelho carimba: a do funcionário (fixa) ou a escolhida neste navegador ("" = matriz)
  const LOC_KEY = "clientefiel.loc";
  CF.currentLocation = () => { const me = CF.state.staffMe; if (CF.isStaff() && me && me.locationId) return me.locationId; let id = ""; try { id = localStorage.getItem(LOC_KEY) || ""; } catch (e) {} return CF.locations().some((l) => l.id === id) ? id : ""; };
  CF.setLocation = (id) => { try { if (id) localStorage.setItem(LOC_KEY, id); else localStorage.removeItem(LOC_KEY); } catch (e) {} };
  // seletor "Carimbando em: …" (só aparece quando há filiais); funcionário com filial fixa vê só o nome dela
  CF.locPicker = () => { const list = CF.locations(); if (!list.length) return ""; const cur = CF.currentLocation(), me = CF.state.staffMe;
    if (CF.isStaff() && me && me.locationId) return `<span class="loc-pick fixed" title="Sua filial">${I("pin", "sm")}${CF.esc(CF.locName(me.locationId))}</span>`;
    return `<label class="loc-pick" title="Filial em que este aparelho carimba">${I("pin", "sm")}<span>Carimbando em</span><select class="select sm" data-change="set-loc" aria-label="Filial em que este aparelho carimba"><option value="">Matriz</option>${list.map((l) => `<option value="${CF.esc(l.id)}" ${l.id === cur ? "selected" : ""}>${CF.esc(l.name)}</option>`).join("")}</select></label>`; };
  const STAFF_NAV = [{ label: "Menu", items: [["dash", "Painel", "home", "/"], ["customers", "Clientes", "users", "/customers"], ["scan", "Carimbar", "qr", "/scan"]] }];
  const STAFF_ROUTES = /^\/(customers(\/.*)?|scan)?$/;   // o que o funcionário pode abrir
  CF.hasPro = () => CF.isPremium() || CF.trial().active; // recursos Pro liberados no plano pago e durante o teste
  // barra de salvamento: mostra o estado e tem "Salvar" para gravar na hora
  const saveText = () => { const l = CF.lastSave || { st: "saved" }; return l.st === "dirty" ? `${I("warn", "sm")}Alterações não salvas` : l.st === "saving" ? `<span class="spinner sm"></span>Salvando…` : l.st === "error" ? `${I("warn", "sm")}Não foi possível salvar` : `${I("check", "sm")}Tudo salvo automaticamente`; };
  CF.saveBar = (o = {}) => `<div class="save-bar ${o.compact ? "compact" : ""}"><span class="save-st ${(CF.lastSave || {}).st || "saved"}" aria-live="polite">${saveText()}</span><button type="button" class="btn sm primary" data-act="save-now">${I("check", "sm")}Salvar</button></div>`;
  document.addEventListener("cf:save", () => { const tsv = CF.$("#top-save"); if (tsv && !tsv.firstElementChild && (!CF.autosave() || CF.isDirty())) tsv.innerHTML = CF.saveBar({ compact: true }); if (tsv && tsv.firstElementChild && CF.autosave() && !CF.isDirty()) tsv.innerHTML = ""; });
  document.addEventListener("cf:save", () => document.querySelectorAll(".save-st").forEach((el) => { el.className = "save-st " + CF.lastSave.st; el.innerHTML = saveText(); }));
  CF.watermark = () => (CF.isPremium() ? "" : `<div class="cf-wm" aria-label="Feito com Seu Cliente Fiel"><img src="${(window.CF_ASSET_BASE || "") + "assets/img/seucliente-marca.svg"}" alt=""><span>Feito com <b>Seu Cliente Fiel</b></span></div>`);
  CF.trial = () => {
    const p = CF.state.plan, total = CF.config.trialDays, paid = p.name !== "Free";
    const mid = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const start = mid(new Date(p.since || Date.now())), today = mid(new Date());
    const day = Math.floor((today - start) / 864e5) + 1;
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + total - 1);
    return { paid, total, start, end, day: Math.max(1, day), left: Math.max(0, total - day), ended: !paid && day > total, active: !paid && p.trial !== false && day <= total };
  };
  /* limite de clientes: todas as funções são livres; só o limite muda.
     teste de 21 dias e plano pago = 3.000 · Free depois do teste = 30 */
  CF.clientLimit = () => (CF.trial().paid || CF.trial().active ? CF.config.paidClientLimit : CF.config.freeClientLimit);
  CF.clientsLeft = () => Math.max(0, CF.clientLimit() - CF.state.customers.length);
  CF.atClientLimit = () => CF.state.customers.length >= CF.clientLimit();
  CF.limitModal = () => {
    const lim = CF.clientLimit(), t = CF.trial();
    const ov = CF.modal({ title: "Limite de clientes atingido", sub: t.paid ? `Seu plano inclui até ${lim.toLocaleString(CF.locale())} clientes.` : `O plano Free inclui até ${lim} clientes.`,
      body: `<p class="muted">${t.paid ? "Fale com a gente para ampliar o limite." : `Com o plano Pro você tem <b>${CF.config.paidClientLimit.toLocaleString(CF.locale())} clientes</b>, ${CF.config.paidClientLimit / CF.config.freeClientLimit}× mais, com todas as funções.`}</p>`,
      foot: `<button class="btn" data-close>Agora não</button>${t.paid ? "" : `<a class="btn primary" href="#/billing" data-close>Ver o plano Pro</a>`}` });
    return ov;
  };
  const WD = ["D", "S", "T", "Q", "Q", "S", "S"];
  const MES3 = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  function trialCalendar(t) {
    const heads = Array.from({ length: 7 }, (_, i) => `<span class="tc-h">${WD[(t.start.getDay() + i) % 7]}</span>`).join("");
    const cells = Array.from({ length: t.total }, (_, i) => {
      const d = new Date(t.start.getFullYear(), t.start.getMonth(), t.start.getDate() + i), n = i + 1;
      const cls = t.ended || n < t.day ? "past" : n === t.day ? "today" : "future";
      return `<span class="tc-d ${cls}" title="Dia ${n} de ${t.total} · ${d.getDate()} ${MES3[d.getMonth()]}"${cls === "today" ? ' aria-current="date"' : ""}>${d.getDate()}</span>`;
    }).join("");
    const head = t.ended ? "Teste grátis encerrado" : `Teste grátis · dia ${t.day} de ${t.total}`;
    const sub = t.ended ? `Agora o Free permite ${CF.config.freeClientLimit} clientes. Ative o Pro para ${CF.config.paidClientLimit.toLocaleString(CF.locale())}.` : t.left === 0 ? "Último dia do teste. Termina hoje." : `Faltam ${t.left} ${t.left === 1 ? "dia" : "dias"} · termina em ${t.end.getDate()} ${MES3[t.end.getMonth()]}`;
    return `<div class="trial-cal" role="group" aria-label="${head}"><div class="tc-top"><b>${head}</b><small>${sub}</small></div>
      <div class="tc-grid" aria-hidden="true">${heads}${cells}</div>
      <a class="tc-cta" href="#/billing">${t.ended ? "Ativar um plano" : "Ver os planos"} -&gt;</a></div>`;
  }
  // grupos do menu: fechados por padrão; o grupo da tela atual abre sozinho; os abertos pelo usuário ficam guardados
  const openGroups = () => { try { return new Set(JSON.parse(localStorage.getItem("clientefiel.navopen") || "[]")); } catch (e) { return new Set(); } };
  const saveGroups = (set) => { try { localStorage.setItem("clientefiel.navopen", JSON.stringify([...set])); } catch (e) {} };
  function sidebarHtml(active) {
    const s = CF.state, n = s.customers.length, lim = CF.clientLimit();
    const tr = CF.trial(), now = new Date(), md = (d) => (d ? String(d).slice(5, 10) : ""), today = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const cap = (x) => (x > 99 ? "+99" : String(x));
    const COUNT = {
      customers: [(s.requests || []).length, "orange", "pedidos de carimbo esperando aprovação"],
      birthdays: [s.customers.filter((c) => md(c.birthday) === today).length, "red", "aniversariantes hoje"],
      reviews: [((s.gmaps || {}).main || {}).total_avaliacoes || 0, "blue", "avaliações no Google"],
      campaigns: [s.campaigns.filter((c) => c.status !== "ended" && new Date(c.endsAt) > now).length, "green", "campanhas ativas"],
      surveys: [(s.surveys || []).reduce((a, v) => a + ((v.responses || []).length), 0), "orange", "pesquisas respondidas"],
    };
    const badge = (id) => { const c = COUNT[id]; return c && c[0] > 0 ? `<b class="nav-badge ${c[1]}" title="${c[0]} ${c[2]}" aria-label="${c[0]} ${c[2]}">${cap(c[0])}</b>` : ""; };
    return `
      <a class="brand" href="#/"><img src="${CF.esc(s.biz.logo)}" alt=""><span>${CF.esc(s.biz.name)}</span></a>
      <nav aria-label="Principal">
      ${(CF.isStaff() ? STAFF_NAV : NAV.concat(CF.ext && CF.ext.navGroups ? CF.ext.navGroups() : [])).map((g) => { const has = g.items.some(([id]) => id === active), open = has || openGroups().has(g.label); return `<div class="nav-group ${open ? "open" : ""}" data-group="${CF.esc(g.label)}"><button type="button" class="nav-label" data-act="nav-group" aria-expanded="${open}">${g.label}${I("chevron-down", "xs")}</button><div class="nav-items">${g.items.map(([id, label, ic, href, extra]) =>
        `<a class="nav-item ${id === active ? "active" : ""}" href="${/^(https?:|[a-z0-9-]+\/)/i.test(href) ? CF.esc(href) : "#" + href}" title="${CF.esc(label)}" ${id === active ? 'aria-current="page"' : ""}>${CF.navIcon(ic)}<span>${label}</span>
          ${badge(id)}
          ${extra === "multi" ? `<span class="pill">${I("crown")}MULTI</span>` : ""}</a>`).join("")}</div></div>`; }).join("")}
      </nav>
      <div class="sidebar-foot">${CF.isStaff() ? `<div class="plan-box staff-box"><strong>Equipe de ${CF.esc(s.biz.name)}</strong><div class="pb-line">${CF.esc((CF.state.staffMe || {}).name || s.user.name)}${(CF.state.staffMe || {}).locationId ? ` · ${CF.esc(CF.locName(CF.state.staffMe.locationId))}` : ""}</div><small class="muted">Você carimba e busca clientes. O resto do painel é do dono.</small></div>` : `<div class="plan-box">
        <div class="row between"><strong>Plano ${CF.esc(s.plan.name)}</strong>${tr.active ? `<span class="pill">${I("crown")}Teste grátis</span>` : ""}</div>
        ${tr.paid ? "" : trialCalendar(tr)}
        <div class="pb-line">${s.cards.length ? "Seu cartão está pronto." : "Crie seu primeiro cartão."}</div>
        <div class="pb-use" title="Clientes no limite do plano"><div class="pb-bar"><i style="width:${Math.min(100, Math.round((n / lim) * 100))}%"></i></div><small>${n.toLocaleString(CF.locale())} de ${lim.toLocaleString(CF.locale())} clientes${tr.active ? " (no teste)" : ""}</small></div>
        ${!tr.paid && (n >= lim * 0.8 || tr.ended) ? `<a class="tc-cta" href="#/billing">Ter ${CF.config.paidClientLimit.toLocaleString(CF.locale())} clientes -&gt;</a>` : ""}
        <a href="#/page/share">Compartilhar cartão -&gt;</a>
      </div>`}
      <button type="button" class="sb-hide" data-act="sb-mini" title="${document.body.classList.contains("sb-mini") ? "Mostrar barra" : "Ocultar barra"}" aria-label="${document.body.classList.contains("sb-mini") ? "Mostrar barra" : "Ocultar barra"}">${I(document.body.classList.contains("sb-mini") ? "panel-right" : "panel-left")}<span>${document.body.classList.contains("sb-mini") ? "Mostrar barra" : "Ocultar barra"}</span></button></div>`;
  }
  // celular: barra fixa embaixo com o que se usa no balcão; "Mais" abre o menu completo. Pedidos de carimbo contam em Clientes.
  function bnavHtml(active) {
    const req = (CF.state.requests || []).length, it = (id, href, ic, label, cls = "") => `<a class="bn-it ${cls} ${id === active ? "on" : ""}" href="#${href}" ${id === active ? 'aria-current="page"' : ""}>${I(ic)}<span>${label}</span>${id === "customers" && req ? `<b class="bn-badge" aria-label="${req} pedidos de carimbo">${req > 99 ? "+99" : req}</b>` : ""}</a>`;
    return it("dash", "/", "home", "Início") + it("customers", "/customers", "users", "Clientes") + it("scan", "/scan", "qr", "Carimbar", "bn-main") + (CF.isStaff() ? "" : it("cards", "/cards", "card", "Cartões"))
      + `<button type="button" class="bn-it" data-act="sb-toggle" aria-label="Abrir o menu completo">${I("menu")}<span>Mais</span></button>`;
  }
  function shellHtml() {
    return `
    <div class="app">
      <aside class="sidebar" id="sidebar"></aside>
      <div class="scrim" data-act="sb-close"></div>
      <div class="main">
        <header class="topbar">
          <button class="icon-btn" data-act="sb-toggle" aria-label="Alternar menu lateral">${I("menu")}</button>
          <a class="brandbar" href="#/" aria-label="${CF.esc(CF.config.product)}"><img src="assets/img/seucliente-marca.svg" alt=""><small class="hide-sm">Seu Cliente Fiel</small></a>
          <div id="top-stats-slot" class="top-stats-slot"></div>
          <div id="top-save" class="top-save"></div>
          <div class="top-right">
            <a class="icon-btn scan-top" href="#/scan" title="Carimbar lendo o QR do cliente" aria-label="Carimbar lendo o QR do cliente">${I("qr")}</a>
            <div class="rel">
              <button class="user-btn" data-act="user-menu" aria-haspopup="menu"><div><b id="u-name"></b><small id="u-mail"></small></div>${I("chevron-down")}</button>
              <div class="menu hide" id="user-menu" role="menu"></div>
            </div>
          </div>
        </header>
        <main id="view" tabindex="-1"></main>
      </div>
    </div>
    <a class="fab-scan" href="#/scan" aria-label="Carimbar lendo o QR do cliente">${I("qr")}<span>Carimbar</span></a>
    <nav class="bnav" id="bnav" aria-label="Atalhos do celular"></nav>
    <div id="overlay-root"></div><div id="toasts" aria-live="polite" role="status"></div>`;
  }
  /* ---- painel rápido do usuário (estilo One UI): botões redondos que ligam/desligam ---- */
  const LANGS = [["pt", "Português"], ["es", "Español"], ["en", "English"], ["it", "Italiano"]];
  CF.flag = (code) => ({
    pt: '<svg viewBox="0 0 30 30" aria-hidden="true"><rect width="30" height="30" fill="#009c3b"/><path d="M15 5 27 15 15 25 3 15z" fill="#ffdf00"/><circle cx="15" cy="15" r="5.6" fill="#002776"/><path d="M9.6 14.2c3.4-.9 7.4-.5 10.8 1.2" stroke="#fff" stroke-width="1" fill="none"/></svg>',
    es: '<svg viewBox="0 0 30 30" aria-hidden="true"><rect width="30" height="30" fill="#c60b1e"/><rect y="7.5" width="30" height="15" fill="#ffc400"/></svg>',
    en: '<svg viewBox="0 0 30 30" aria-hidden="true"><rect width="30" height="30" fill="#fff"/>' + [0, 2, 4, 6, 8, 10, 12].map((i) => `<rect y="${(i * 30) / 13}" width="30" height="${30 / 13}" fill="#b22234"/>`).join("") + '<rect width="14" height="16.2" fill="#3c3b6e"/><g fill="#fff">' + [[3, 3], [7, 3], [11, 3], [5, 6], [9, 6], [3, 9], [7, 9], [11, 9], [5, 12], [9, 12]].map(([x, y]) => `<circle cx="${x}" cy="${y + 0.5}" r=".75"/>`).join("") + "</g></svg>",
    it: '<svg viewBox="0 0 30 30" aria-hidden="true"><rect width="10" height="30" fill="#009246"/><rect x="10" width="10" height="30" fill="#fff"/><rect x="20" width="10" height="30" fill="#ce2b37"/></svg>',
  }[code] || "");
  CF.lang = () => { try { return localStorage.getItem("clientefiel.lang") || "pt"; } catch (e) { return "pt"; } };
  CF.locale = () => ({ pt: "pt-BR", es: "es-ES", en: "en-US", it: "it-IT" }[CF.lang()] || "pt-BR");
  CF.notifyOn = () => { try { return localStorage.getItem("clientefiel.notify") === "1" && "Notification" in window && Notification.permission === "granted"; } catch (e) { return false; } };
  // notificação do navegador (só quando o dono ligou no painel rápido)
  CF.notify = (title, body) => { if (!CF.notifyOn()) return; try { new Notification(title, { body, icon: "assets/img/seucliente-marca.svg", tag: "cf-" + Date.now() }); } catch (e) {} };
  function quickPanelHtml() {
    const s = CF.state, dark = document.documentElement.dataset.mode === "dark", newLook = !!window.CF_V2_ACTIVE, lang = CF.lang(), noti = CF.notifyOn();
    const tile = (act, icon, label, on, extra = "") => `<button type="button" class="qp-tile ${on ? "on" : ""}" data-act="${act}" role="menuitemcheckbox" aria-checked="${!!on}" ${extra}><span class="qp-ico">${icon}</span><small>${label}</small></button>`;
    return `<div class="qp-head"><span class="qp-av">${CF.esc(CF.initial(s.user.name))}</span><div><b>${CF.esc(s.user.name)}</b><small>${CF.esc(s.user.email)}</small></div></div>
      <div class="qp-grid">
        ${tile("qp-lang", `<span class="qp-flag">${CF.flag(lang)}</span>`, (LANGS.find((l) => l[0] === lang) || LANGS[0])[1], false, 'aria-haspopup="true"')}
        ${tile("news", I("sparkles"), "Novidades", false)}
        <button type="button" class="qp-tile" data-act="qp-settings" role="menuitem"><span class="qp-ico">${I("settings")}</span><small>Configurações</small></button>
        ${tile("notify", I("bell"), "Notificações", noti)}
        ${tile("logout", I("log-out"), "Sair", false, 'data-danger="1"')}
      </div>
      <div class="qp-langs hide" id="qp-langs">${LANGS.map(([c, n]) => `<button type="button" class="qp-lang ${c === lang ? "on" : ""}" data-act="set-lang" data-lang="${c}"><span class="qp-flag">${CF.flag(c)}</span>${n}</button>`).join("")}</div>
      <div class="qp-list">${CF.isStaff() ? `
        <button data-act="nps">${I("message")}Dar feedback</button>` : `
        <a href="#/staff">${I("user")}Funcionários</a>
        <a href="#/locations">${I("pin")}Filiais</a>
        <a href="#/billing">${I("card")}Faturamento</a>
        <a href="#/integrations">${I("zap")}Integrações</a>
        ${s.ext && s.ext.isAdmin ? `<a href="#/admin">${I("key")}Superadmin da plataforma</a>` : ""}
        <button data-act="setup-wizard">${I("sparkles")}Configuração inicial</button>
        <button data-act="tour">${I("info")}Tutorial do painel</button>
        <button data-act="nps">${I("message")}Dar feedback</button>
        <button data-act="reset-demo">${I("refresh")}Restaurar dados de exemplo</button>`}
      </div>`;
  }
  const repaintQP = () => { const m = CF.$("#user-menu"); if (m) m.innerHTML = quickPanelHtml(); };
  // só o menu e o topo (contadores) — usado pelos avisos em tempo real quando a tela atual não precisa ser redesenhada
  CF.repaintShell = () => { if (CF.$("#sidebar")) refreshShell(CF._nav || ""); };
  function refreshShell(active) {
    const s = CF.state; CF._nav = active;
    CF.$("#sidebar").innerHTML = sidebarHtml(active);
    const bn = CF.$("#bnav"); if (bn) bn.innerHTML = bnavHtml(active);
    CF.$("#u-name").textContent = s.user.name;
    CF.$("#u-mail").textContent = s.user.email;
    CF.$("#user-menu").innerHTML = quickPanelHtml();
    const ts = CF.$("#top-stats-slot"); if (ts) ts.innerHTML = CF.topStatsHtml();
    const tsv = CF.$("#top-save"); if (tsv) tsv.innerHTML = !CF.autosave() || CF.isDirty() ? CF.saveBar({ compact: true }) : "";
  }
  // barra do topo: página ativa + clientes, carimbos, recompensas e visitantes (acima de 999 → "+999")
  CF.cap999 = (n) => (+n > 999 ? "+999" : String(+n || 0));
  CF.topStatsHtml = () => {
    const s = CF.state, t = s.totals || {}, pro = CF.hasPro ? CF.hasPro() : false;
    const symbol = (f) => I(({"busts-in-silhouette":"users",label:"stamp","wrapped-gift":"gift",eye:"eye"})[f] || f, "ts-emo");
    let vis = 0; try { vis = pro && CF.visitorStats ? CF.visitorStats(30).uniq : 0; } catch (e) {}
    const it = (href, f, n, label) => `<a class="ts-it" href="${href}" title="${CF.esc(label)}" aria-label="${CF.esc(label)}: ${+n || 0}">${symbol(f)}<b>${CF.cap999(n)}</b></a>`;
    return `<div class="top-stats" role="group" aria-label="Resumo">${CF.isPreview && CF.isPreview() ? `<button type="button" class="ts-live ts-prev" data-act="activate-page" title="Sua página está em prévia: os clientes ainda não conseguem se cadastrar"><i></i>Página em prévia</button>` : s.cards.some((c) => c.active) ? `<span class="ts-live" title="Sua página está no ar"><i></i>Página ativa</span>` : `<a class="ts-live warn" href="#/cards" title="Nenhum cartão ativo: os clientes não conseguem receber carimbos"><i></i>Sem cartão ativo</a>`}
      ${it("#/customers", "busts-in-silhouette", s.customers.length, "Clientes com cartão")}${it("#/customers", "label", t.stamps || 0, "Carimbos concedidos")}${it("#/customers", "wrapped-gift", t.redeemed || 0, "Recompensas resgatadas")}
      ${pro ? it("#/customers", "eye", vis, "Visitantes (30 dias)") : `<a class="ts-it" href="#/billing" title="Visitantes: recurso do plano Pro">${symbol("eye")}<span class="ts-pro">Pro</span></a>`}</div>`;
  };

  /* -------------------------------------------------------------- page chrome */
  CF.crumbs = (items) =>
    `<nav class="crumbs" aria-label="Trilha">${items.map((c, i) => {
      const last = i === items.length - 1;
      const t = c.href && !last ? `<a href="#${c.href}">${CF.esc(c.t)}</a>` : last ? `<b>${CF.esc(c.t)}</b>` : `<span>${CF.esc(c.t)}</span>`;
      return (i ? I("chevron-right") : "") + t;
    }).join("")}</nav>`;
  CF.pageHead = ({ title, sub, crumbs, back, badge, actions }) =>
    `<div class="page-head"><div class="left">
        ${back ? `<a class="icon-btn back-btn" href="#${back}" aria-label="Voltar">${I("arrow-left")}</a>` : ""}
        <div><h1>${title}${badge || ""}</h1>${sub ? `<p class="sub">${sub}</p>` : ""}</div></div>
      <div>${crumbs ? CF.crumbs(crumbs) : ""}${actions ? `<div class="actions">${actions}</div>` : ""}</div></div>`;

  /* ------------------------------------------------------------------ router */
  const routes = [];
  CF.route = (pattern, handler) => {
    const keys = [];
    const re = new RegExp("^" + pattern.replace(/:[a-z]+/gi, (m) => { keys.push(m.slice(1)); return "([^/]+)"; }) + "/?$");
    routes.push({ re, keys, handler });
  };
  CF.go = (path) => { location.hash = "#" + path; };
  let cleanup = null;
  let lastPath = null;
  CF.render = () => {
    let raw = (location.hash || "#/").slice(1);
    try { raw = decodeURIComponent(raw); } catch (e) { /* hash malformado (#/%): usa como está */ }
    const path = raw.split("?")[0] || "/";
    document.body.classList.toggle("role-staff", CF.isStaff());
    if (CF.isStaff() && !STAFF_ROUTES.test(path)) { CF.toast("Esta tela é só do dono do negócio.", "err"); location.hash = "#/"; return; }
    let match = null, params = {};
    for (const r of routes) { const m = r.re.exec(path); if (m) { match = r; r.keys.forEach((k, i) => (params[k] = m[i + 1])); break; } }
    try { cleanup && cleanup(); } catch (e) { console.error(e); } cleanup = null;
    const oldView = CF.$("#view"), view = oldView.cloneNode(false); // clone raso = sem listeners herdados
    oldView.replaceWith(view);
    const changed = path !== lastPath; lastPath = path;
    if (!match) {
      document.title = `Página não encontrada | ${CF.config.product}`;
      refreshShell("");
      view.innerHTML = `<div class="empty-state"><h2>Página não encontrada</h2><p class="lead">O endereço <code>${CF.esc(path)}</code> não existe.</p><p style="margin-top:20px"><a class="btn primary" href="#/">Voltar ao painel</a></p></div>`;
      return;
    }
    try {
      const page = match.handler(params) || {};
      document.title = `${(page.docTitle || page.title || "Painel").replace(/<[^>]+>/g, "")} | ${CF.config.product}`;
      refreshShell(page.nav);
      view.innerHTML = (page.noHead ? "" : CF.pageHead(page)) + (page.html || "");
      CF.$("#view").scrollTop = 0;
      if (page.mount) cleanup = page.mount(view) || null;
    } catch (err) {
      console.error(err);
      refreshShell("");
      view.innerHTML = `<div class="empty-state"><h2>Algo deu errado nesta tela</h2><p class="lead">Ocorreu um erro ao montar a página. Tente voltar ao painel; se persistir, restaure os dados de exemplo no menu do usuário.</p><p class="small muted" style="margin-top:8px"><code>${CF.esc(err && err.message)}</code></p><p style="margin-top:20px"><a class="btn primary" href="#/">Voltar ao painel</a></p></div>`;
    }
    document.body.classList.remove("sb-open");
    // leitores de tela: anunciar a nova tela ao navegar (não em refresh da mesma rota)
    if (changed) view.focus({ preventScroll: true });
  };
  CF.refresh = () => { const y = window.scrollY; CF.render(); window.scrollTo(0, y); };

  /* ------------------------------------------------------- global interactions */
  function bind() {
    document.addEventListener("click", (e) => {
      const um = CF.$("#user-menu");
      if (um && !e.target.closest("#user-menu") && !e.target.closest('[data-act="user-menu"]')) um.classList.add("hide");
      // acordeões genéricos
      const ah = e.target.closest(".acc > .acc-h");
      if (ah) { ah.parentElement.classList.toggle("open"); return; }
      const el = e.target.closest("[data-act]");
      if (!el) return;
      const fn = CF.actions[el.dataset.act];
      if (fn) { e.preventDefault(); fn(el, e); }
    });
    window.addEventListener("hashchange", () => { CF.closeLayers(); CF.render(); window.scrollTo(0, 0); });
    document.addEventListener("change", (e) => { const sel = e.target.closest && e.target.closest('[data-change="set-loc"]'); if (!sel) return; CF.setLocation(sel.value); CF.toast(sel.value ? "Este aparelho agora carimba em " + CF.locName(sel.value) + "." : "Este aparelho agora carimba na matriz."); document.querySelectorAll('[data-change="set-loc"]').forEach((x) => { if (x !== sel) x.value = sel.value; }); });
  }
  Object.assign(CF.actions, {
    "sb-toggle"() {
      if (window.matchMedia("(max-width:1024px)").matches) document.body.classList.toggle("sb-open");
      else document.body.classList.toggle("sb-collapsed");
    },
    "nav-group"(el) {
      const g = el.closest(".nav-group"), open = !g.classList.contains("open"), set = openGroups();
      g.classList.toggle("open", open); el.setAttribute("aria-expanded", open);
      open ? set.add(g.dataset.group) : set.delete(g.dataset.group); saveGroups(set);
    },
    "sb-close"() { document.body.classList.remove("sb-open"); },
    async "save-now"(el) { el.disabled = true; try { await CF.saveNow(); CF.toast(CF.lastSave && CF.lastSave.st === "error" ? "Não foi possível salvar agora." : "Tudo salvo.", CF.lastSave && CF.lastSave.st === "error" ? "err" : undefined); } finally { el.disabled = false; } },
    // menu recolhido: só os ícones (com contadores); clicar num ícone abre a tela. Fica guardado neste navegador.
    "sb-mini"() { const on = !document.body.classList.contains("sb-mini"); document.body.classList.toggle("sb-mini", on); try { on ? localStorage.setItem("clientefiel.sbmini", "1") : localStorage.removeItem("clientefiel.sbmini"); } catch (e) {} CF.render(); },
    "user-menu"() { CF.$("#user-menu").classList.toggle("hide"); },
    "theme-dark"() {
      const on = document.documentElement.dataset.mode !== "dark";
      if (on) document.documentElement.setAttribute("data-mode", "dark"); else document.documentElement.removeAttribute("data-mode");
      try { on ? localStorage.setItem("clientefiel.mode", "dark") : localStorage.removeItem("clientefiel.mode"); } catch (e) {}
      CF.render(); CF.$("#user-menu").classList.remove("hide");
      CF.toast(on ? "Modo escuro ligado." : "Modo claro restaurado.");
    },
    // Visual novo (amarelo, v2) ↔ original: são páginas diferentes (v2.html carrega os CSS/JS do v2), então troca de página mantendo a tela (#/…) e o ?preview=1.
    "theme-new"() {
      const to = window.CF_V2_ACTIVE ? "index.html" : "v2.html";
      location.href = to + location.search + location.hash;
    },
    // Tema Aura (roxo, antigo): continua disponível por localStorage "clientefiel.theme"="v2" (usado pelos testes), sem botão no menu.
    "theme-v2"() {
      const on = document.documentElement.dataset.theme !== "v2";
      if (on) document.documentElement.setAttribute("data-theme", "v2"); else document.documentElement.removeAttribute("data-theme");
      try { on ? localStorage.setItem("clientefiel.theme", "v2") : localStorage.removeItem("clientefiel.theme"); } catch (e) {}
      CF.render(); CF.$("#user-menu").classList.remove("hide");
      CF.toast(on ? "Visual v2 (Aura) ligado." : "Visual original restaurado.");
    },
    "reset-demo"() {
      CF.$("#user-menu").classList.add("hide");
      CF.confirm({ title: "Restaurar dados de exemplo?", text: "Isso apaga as alterações feitas neste navegador e volta ao estado inicial.", ok: "Restaurar", danger: true, onOk() { CF.resetDemo(); CF.render(); CF.toast("Dados de exemplo restaurados."); } });
    },
    logout() { CF.$("#user-menu").classList.add("hide"); CF.toast("Demonstração: não há sessão para encerrar."); },
    "qp-settings"() { CF.$("#user-menu").classList.add("hide"); location.hash = "#/settings"; },
    "qp-lang"() { const l = CF.$("#qp-langs"); if (l) l.classList.toggle("hide"); },
    "set-lang"(el) { const c = el.dataset.lang; if (c === CF.lang()) return; try { localStorage.setItem("clientefiel.lang", c); } catch (e) {} location.reload(); },
    notify() {
      if (CF.notifyOn()) { try { localStorage.removeItem("clientefiel.notify"); } catch (e) {} repaintQP(); return CF.toast("Notificações do navegador desligadas."); }
      if (!("Notification" in window)) return CF.toast("Este navegador não permite notificações.", "err");
      if (!window.isSecureContext) return CF.toast("Notificações só funcionam com o painel aberto por https:// ou localhost.", "err");
      Notification.requestPermission().then((p) => {
        if (p !== "granted") { repaintQP(); return CF.toast("Permissão negada. Libere as notificações no cadeado da barra de endereço.", "err"); }
        try { localStorage.setItem("clientefiel.notify", "1"); } catch (e) {}
        repaintQP(); CF.notify("Seu Cliente Fiel", "Pronto! Você vai ser avisado de clientes novos, pedidos de carimbo e recompensas."); CF.toast("Notificações do navegador ligadas.");
      });
    },
    news() {
      CF.$("#user-menu").classList.add("hide");
      CF.drawer({ title: "Novidades", sub: "Últimas melhorias do produto", body: `
        ${[["Estilos de publicação", "Crie imagens prontas para Instagram e Facebook com o QR do seu cartão."], ["Aniversários automáticos", "Envie uma oferta no dia do aniversário de cada cliente."], ["Pesquisas de satisfação", "Entenda a experiência dos clientes antes que virem avaliações ruins."]]
          .map(([t, d]) => `<div class="list-row"><span class="ico-tile brand">${I("sparkles")}</span><div><b class="strong">${t}</b><p class="muted">${d}</p></div></div>`).join("")}`, });
    },
    nps() {
      CF.$("#user-menu").classList.add("hide");
      const ov = CF.drawer({ title: "Como o Seu Cliente Fiel está funcionando para você?", sub: "Uma resposta curta nos ajuda a melhorar o produto para negócios como o seu.", body: `
        <div class="field"><label>Qual a chance de você recomendar o Seu Cliente Fiel a outro dono de negócio local?</label>
        <div class="nps">${Array.from({ length: 11 }, (_, i) => `<button data-n="${i}">${i}</button>`).join("")}</div>
        <div class="row between small muted"><span>Improvável</span><span>Muito provável</span></div></div>
        <div class="field" style="margin-top:20px"><label>Mais alguma coisa?</label><textarea class="textarea" placeholder="Detalhes (opcional)"></textarea></div>
        <div class="row" style="justify-content:flex-end;margin-top:16px"><button class="btn" data-close>Perguntar depois</button><button class="btn primary" id="nps-send" disabled>${I("send", "sm")}Enviar feedback</button></div>` });
      let sel = null;
      ov.querySelector(".nps").addEventListener("click", (e) => {
        const b = e.target.closest("button"); if (!b) return; sel = b.dataset.n;
        ov.querySelectorAll(".nps button").forEach((x) => x.classList.toggle("on", x === b)); ov.querySelector("#nps-send").disabled = false;
      });
      ov.querySelector("#nps-send").addEventListener("click", () => { ov.close(); CF.toast("Obrigado pelo feedback!"); });
    },
  });

  /* -------------------------------------------------------------------- boot */
  CF.boot = () => {
    document.body.innerHTML = shellHtml();
    bind();
    CF.render();
  };
})();
