/* Link Corretor — som de caixa registradora ("cha-ching") para o aviso de proposta enviada.
   Sintetizado no navegador (Web Audio), sem arquivo de áudio. Usado no painel (construtora e corretor) e na apresentação (cliente).
   API: LC_SOM.caixa()  toca;  LC_SOM.ligado()  lê a preferência;  LC_SOM.definir(true|false)  grava;  LC_SOM.desbloquear()  libera o áudio no 1º toque.
   O navegador só deixa tocar depois de um clique/toque na página: o painel chama desbloquear() no login e a apresentação, no envio da proposta. */
(() => {
  "use strict";
  if (window.LC_SOM) return;
  let ctx = null, mestre = null;
  const AC = window.AudioContext || window.webkitAudioContext;
  const pref = () => { try { return localStorage.getItem("lc.som") !== "0"; } catch { return true; } };

  function contexto(forcado) {
    if (!AC) return null;
    if (!ctx) { ctx = forcado || new AC(); montar(ctx); }
    if (ctx.state === "suspended" && ctx.resume) ctx.resume().catch(() => {});
    return ctx;
  }
  // compressor no fim da cadeia: o "ching" é forte e o "cha" é seco; assim nada estoura nos alto-falantes do notebook
  function montar(c) {
    const comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 5; comp.attack.value = 0.003; comp.release.value = 0.2;
    mestre = c.createGain(); mestre.gain.value = 0.9; mestre.connect(comp); comp.connect(c.destination);
  }

  function ruido(c, t, dur, freq, q, ganho) {   // "cha": gaveta abrindo (rajada de ruído filtrada)
    const n = Math.max(1, Math.floor(c.sampleRate * dur)), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = c.createBufferSource(); src.buffer = buf;
    const f = c.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain(); g.gain.setValueAtTime(ganho, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f); f.connect(g); g.connect(mestre); src.start(t); src.stop(t + dur);
  }
  function baque(c, t) {                       // pancada grave da gaveta
    const o = c.createOscillator(), g = c.createGain(); o.type = "sine";
    o.frequency.setValueAtTime(170, t); o.frequency.exponentialRampToValueAtTime(55, t + 0.14);
    g.gain.setValueAtTime(0.7, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    o.connect(g); g.connect(mestre); o.start(t); o.stop(t + 0.2);
  }
  function sino(c, t, f0, ganho, dur) {        // "ching": sino metálico = vários parciais inarmônicos com decaimento longo
    [[1, 1], [2.76, 0.55], [5.4, 0.28], [8.93, 0.14]].forEach(([r, a]) => {
      const o = c.createOscillator(), g = c.createGain(); o.type = "sine"; o.frequency.value = f0 * r;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(ganho * a, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + dur / (1 + r * 0.18));
      o.connect(g); g.connect(mestre); o.start(t); o.stop(t + dur);
    });
  }
  function moeda(c, t, f, ganho) {             // moedas caindo: pings curtos e agudos
    [1, 2.31].forEach((r, i) => {
      const o = c.createOscillator(), g = c.createGain(); o.type = "triangle"; o.frequency.value = f * r;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(ganho / (1 + i), t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      o.connect(g); g.connect(mestre); o.start(t); o.stop(t + 0.24);
    });
  }

  // Monta o som inteiro num contexto (real ou offline). Retorna a duração em segundos.
  function compor(c, t0) {
    ruido(c, t0, 0.09, 3600, 0.9, 0.55);       // cha
    baque(c, t0 + 0.01);                       //  (gaveta)
    sino(c, t0 + 0.13, 2093, 0.42, 1.5);       // CHING (dó agudo)
    sino(c, t0 + 0.22, 2637, 0.34, 1.35);      //  e a terça, para soar como campainha de caixa
    [0.55, 0.66, 0.74, 0.86, 0.93, 1.04, 1.12].forEach((dt, i) => moeda(c, t0 + dt, 3000 + ((i * 937) % 2200), 0.16));
    return 1.7;
  }

  window.LC_SOM = {
    ligado: pref,
    definir(v) { try { localStorage.setItem("lc.som", v ? "1" : "0"); } catch { /* sem storage */ } },
    desbloquear() { contexto(); },             // chame dentro de um clique/toque
    caixa(opcoes) {
      if (!(opcoes && opcoes.forcar) && !pref()) return false;
      const c = contexto(); if (!c) return false;
      try { compor(c, c.currentTime + 0.03); return true; } catch { return false; }
    },
    // para teste automático: renderiza o som sem placa de áudio e devolve as amostras
    async renderizar() {
      const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext; if (!OAC) return null;
      const off = new OAC(1, 44100 * 2, 44100); const salvo = [ctx, mestre]; ctx = null; mestre = null; ctx = off; montar(off);
      compor(off, 0.02); const buf = await off.startRendering(); ctx = salvo[0]; mestre = salvo[1]; return buf.getChannelData(0);
    }
  };
  // libera o áudio no primeiro gesto do usuário (login, clique em qualquer lugar)
  const liberar = () => { contexto(); document.removeEventListener("pointerdown", liberar, true); document.removeEventListener("keydown", liberar, true); };
  document.addEventListener("pointerdown", liberar, true); document.addEventListener("keydown", liberar, true);
})();
