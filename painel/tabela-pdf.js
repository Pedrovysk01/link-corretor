/* Link Corretor — leitura de tabela de preços em PDF, linha por linha, no navegador (nada sai do computador).
   1) pdf.js lê o texto de cada página; 2) página sem texto (PDF escaneado/foto) passa por OCR (tesseract.js, português);
   3) cada linha vira uma proposta de {unidade, preço}, com alertas; 4) quem confirma é a pessoa, linha por linha (painel.js).
   Bibliotecas em painel/vendor/pdf e painel/vendor/ocr, carregadas só quando alguém envia um PDF.
   API: LC_TABELA.lerPdf(arquivo, aoProgresso) → [{pagina, texto, origem: "texto"|"ocr", conf}]
        LC_TABELA.interpretar(linhas, unidadesConhecidas) → [{pagina, texto, origem, conf, unit, price, alertas:[...]}] */
(() => {
  "use strict";
  if (window.LC_TABELA) return;
  const V = "vendor/";
  const script = (src) => new Promise((ok, erro) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = () => erro(new Error("Não consegui carregar " + src)); document.head.append(s); });
  let pdfPronto = null, ocr = null;
  const carregarPdf = () => pdfPronto || (pdfPronto = script(V + "pdf/pdf.min.js?v=1").then(() => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = V + "pdf/pdf.worker.min.js?v=1"; return window.pdfjsLib; }));
  const base = () => new URL(V + "ocr/", location.href).href;
  const carregarOcr = async (aoProgresso) => {
    if (ocr) return ocr;
    await script(V + "ocr/tesseract.min.js?v=1");
    ocr = await window.Tesseract.createWorker("por", 1, { workerPath: base() + "worker.min.js", corePath: base(), langPath: base(), gzip: true,
      logger: (m) => { if (aoProgresso && m.status === "recognizing text") aoProgresso({ etapa: "ocr", fracao: m.progress }); } });
    return ocr;
  };

  // junta os pedaços de texto do PDF em linhas (mesma altura = mesma linha), da esquerda para a direita
  function linhasDoTexto(itens) {
    const ls = [];
    itens.filter((i) => i.str && i.str.trim()).forEach((i) => { const y = i.transform[5], x = i.transform[4]; let l = ls.find((k) => Math.abs(k.y - y) <= 3); if (!l) { l = { y, p: [] }; ls.push(l); } l.p.push({ x, s: i.str, w: i.width || 0 }); });
    ls.sort((a, b) => b.y - a.y);
    return ls.map((l) => { l.p.sort((a, b) => a.x - b.x); let t = "", fim = null; l.p.forEach((p) => { t += (fim !== null && p.x - fim > 1.5 ? " " : "") + p.s; fim = p.x + p.w; }); return t.replace(/\s+/g, " ").trim(); }).filter(Boolean);
  }

  async function lerPdf(arquivo, aoProgresso) {
    const pdfjs = await carregarPdf(), doc = await pdfjs.getDocument({ data: await arquivo.arrayBuffer() }).promise, out = [];
    for (let n = 1; n <= doc.numPages; n++) {
      aoProgresso && aoProgresso({ etapa: "pagina", pagina: n, total: doc.numPages });
      const pg = await doc.getPage(n), tc = await pg.getTextContent(), linhas = linhasDoTexto(tc.items);
      if (linhas.join("").replace(/\s/g, "").length >= 20) { linhas.forEach((t) => out.push({ pagina: n, texto: t, origem: "texto", conf: 100 })); continue; }
      // página sem texto: é imagem. Desenha em alta e passa pelo OCR.
      const vp = pg.getViewport({ scale: 2.5 }), cv = document.createElement("canvas"); cv.width = Math.ceil(vp.width); cv.height = Math.ceil(vp.height);
      await pg.render({ canvasContext: cv.getContext("2d"), viewport: vp }).promise;
      const w = await carregarOcr(aoProgresso), r = await w.recognize(cv, {}, { blocks: true });
      const ll = (r.data.lines && r.data.lines.length ? r.data.lines : (r.data.blocks || []).flatMap((b) => (b.paragraphs || []).flatMap((p) => p.lines || [])));
      if (ll.length) ll.forEach((l) => { const t = (l.text || "").replace(/\s+/g, " ").trim(); if (t) out.push({ pagina: n, texto: t, origem: "ocr", conf: Math.round(l.confidence || 0) }); });
      else (r.data.text || "").split("\n").map((t) => t.trim()).filter(Boolean).forEach((t) => out.push({ pagina: n, texto: t, origem: "ocr", conf: Math.round(r.data.confidence || 0) }));
    }
    return out;
  }

  const DINHEIRO = /(R\$\s*)?(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d{5,9}(?:,\d{1,2})?)/g;
  const valor = (s) => Number(s.replace(/\./g, "").replace(",", "."));
  // Uma linha da tabela → unidade + preço. Preço = o maior valor em dinheiro da linha (o total; entrada e parcelas são menores).
  // Unidade = número de 3 ou 4 dígitos; se a lista de unidades do empreendimento for conhecida, vale o que existir nela.
  function interpretar(linhas, conhecidas) {
    const set = new Set((conhecidas || []).map(String)), out = [];
    linhas.forEach((l) => {
      const precos = []; let m; DINHEIRO.lastIndex = 0;
      while ((m = DINHEIRO.exec(l.texto))) { const v = valor(m[2]); if (v >= 50000 && v < 1e9) precos.push({ v, rs: !!m[1] }); }
      if (!precos.length) return;
      const resto = l.texto.replace(DINHEIRO, " ").replace(/\d+[.,]\d+/g, " ");            // tira dinheiro e decimais (áreas: 128,60)
      const nums = (resto.match(/\b\d{3,4}\b/g) || []).map((x) => String(Number(x)));
      const naLista = nums.filter((x) => set.has(x)), unit = naLista[0] || nums[0] || "";
      if (!unit) return;
      const price = Math.max(...precos.map((p) => p.v)), alertas = [];
      if (set.size && !set.has(unit)) alertas.push("Unidade não existe no empreendimento");
      if (naLista.length > 1 && new Set(naLista).size > 1) alertas.push("Mais de uma unidade na linha");
      // outro valor grande na mesma linha (≥ 60% do maior) = pode ser "à vista × a prazo" ou duas tabelas: a pessoa decide. Entrada e parcelas (bem menores) não alertam.
      if (precos.some((p) => p.v !== price && p.v >= price * 0.6)) alertas.push("Dois valores altos na linha: confira qual é o preço total");
      if (l.origem === "ocr") alertas.push(l.conf < 80 ? `Lido por OCR com baixa confiança (${l.conf}%)` : "Lido por OCR");
      out.push({ ...l, unit, price, alertas });
    });
    const vistos = {}; out.forEach((r) => { (vistos[r.unit] = vistos[r.unit] || []).push(r); });
    Object.values(vistos).filter((g) => g.length > 1).forEach((g) => g.forEach((r) => r.alertas.push("Unidade repetida na tabela")));
    return out;
  }
  window.LC_TABELA = { lerPdf, interpretar, linhasDoTexto };
})();
