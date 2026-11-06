/* Dados do projeto. A construtora edita apenas este arquivo e a pasta media/. */
window.PROJ = {
  nome: "Felicità", sub: "402 Home Club", construtora: "Vansin",
  cidade: "Itapema", uf: "SC", bairro: "Morretes", endereco: "Rua 402 · Morretes · Itapema/SC",
  lat: -27.1164, lon: -48.6136, tz: -3, // ponto aproximado da Rua 402; trocar pelo ponto exato do lote
  // Direção (graus, 0 = norte) para onde aponta o TOPO da planta tipo. Dedução: rua à direita da planta.
  topoPlantaBearing: 235,
  whatsapp: "", // ex.: "5547999999999"
  pavIni: 7, pavFim: 21, // 5 garagens + 1 lazer + 15 tipos
  entrega: "",
  precoBase: 936949, // apartamento de 69 m² (referência)
  pagamento: { entrada: .10, obra: .10, reforcoParcelas: 6, reforcoPct: .30, chaves: .15, saldoPct: .35, saldoParcelas: 72, indice: "CUB/SC" },
  tipos: {
    "06": { area: 69.86, box: [1.2, 1.4, 28.6, 48.3], fachadas: ["left", "top"] },
    "04": { area: 69.48, box: [29.2, 4.0, 71.7, 43.0], fachadas: ["top"] },
    "02": { area: 69.86, box: [71.8, 0.5, 98.5, 48.3], fachadas: ["top", "right"] },
    "05": { area: 69.21, box: [1.2, 50.0, 28.6, 98.0], fachadas: ["left", "bottom"] },
    "03": { area: 68.18, box: [29.2, 57.0, 71.7, 98.0], fachadas: ["bottom"] },
    "01": { area: 69.21, box: [71.8, 50.0, 98.5, 98.0], fachadas: ["right", "bottom"] }
  },
  overrides: {} // "12-03": {status:"d"|"r"|"v", price:950000}
};

window.CIDADE = {
  stats: [
    { n: 75940, fmt: "int", rot: "habitantes", nota: "Censo 2022 · IBGE" },
    { n: 66, fmt: "pct", pre: "+", rot: "de crescimento desde 2010", nota: "IBGE" },
    { n: 15340, fmt: "brl", rot: "por m², no nível de Balneário Camboriú", nota: "FipeZAP · set/2026" },
    { n: 4.5, fmt: "dec", pre: "+", suf: "%", rot: "de valorização do m² em 12 meses", nota: "FipeZAP · set/2026" },
    { n: 50036, fmt: "brl", rot: "de PIB per capita", nota: "IBGE · 2023" },
    { n: 3, fmt: "ord", rot: "destino turístico de Santa Catarina", nota: "Prefeitura de Itapema" }
  ],
  regiao: [
    { nome: "Balneário Camboriú", lat: -27.0045, lon: -48.6155 },
    { nome: "Porto Belo", lat: -27.1547, lon: -48.5449 },
    { nome: "Bombinhas", lat: -27.1519, lon: -48.4876 },
    { nome: "Navegantes · aeroporto", lat: -26.8784, lon: -48.6492 }
  ]
};

window.FUTURO = [
  { id: "areia", tag: "Projeto", titulo: "Alargamento da Meia Praia", lat: -27.1275, lon: -48.6018, zoom: 13.4, pitch: 50,
    linha: [[-48.5840, -27.1428], [-48.6018, -27.1275], [-48.6089, -27.1141], [-48.6137, -27.1015]],
    kpi: ["4,75 km de orla", "+20 a 60 m de areia", "R$ 60 mi"],
    texto: "Projeto para engordar a faixa de areia do Perequê ao Taboleiro, no mesmo caminho que transformou a orla de Balneário Camboriú." },
  { id: "avenida", tag: "Projeto", titulo: "Avenida beira-mar", lat: -27.1210, lon: -48.6050, zoom: 14.2, pitch: 55,
    kpi: ["Ruas 165 a 321", "Meia Praia ↔ Centro"],
    texto: "Nova via à beira-mar prevista junto ao alargamento, ligando a Meia Praia ao Centro e revitalizando a orla." },
  { id: "pier", tag: "Aberto", titulo: "Píer Oporto + Hard Rock Café", lat: -27.1428, lon: -48.5840, zoom: 15.2, pitch: 60,
    kpi: ["R$ 100 mi investidos", "Píer de 300 m sobre o mar", "Inaugurado em 22/12/2025"],
    texto: "O único Hard Rock Café sobre o mar do mundo virou o novo cartão-postal de Itapema." },
  { id: "roda", tag: "Em instalação", titulo: "Roda-gigante It! Wheel", lat: -27.1425, lon: -48.5845, zoom: 15.6, pitch: 62,
    kpi: ["60 m de altura", "30 cabines", "Vista de Itapema e Porto Belo"],
    texto: "Roda-gigante junto ao píer, com 30 cabines e vista panorâmica para a costa." },
  { id: "mall", tag: "Em obras", titulo: "Garden Open Mall", lat: -27.1290, lon: -48.6030, zoom: 15, pitch: 55,
    kpi: ["Shopping aberto", "Cinema de 2 salas", "~50 operações"],
    texto: "Novo shopping aberto na Meia Praia, com cinema e cerca de 50 operações comerciais." },
  { id: "aero", tag: "Anunciado", titulo: "Aeroportos que crescem", lat: -27.2, lon: -48.58, zoom: 9.4, pitch: 30,
    kpi: ["Florianópolis: +1 mi de passageiros internacionais", "Navegantes: ~R$ 300 mi em investimentos"],
    texto: "Os dois aeroportos que atendem Itapema recebem investimentos e crescem em voos internacionais." }
];

window.EMPRESA = {
  nome: "Vansin", slogan: "Construtora e Incorporadora",
  numeros: [
    { n: 10, suf: "+", rot: "anos de mercado" },
    { n: 11, rot: "lançamentos" },
    { n: 5, suf: "+", rot: "projetos concluídos" },
    { n: 200, suf: "+", rot: "clientes atendidos" }
  ],
  nota: "Números informados pela construtora.",
  entregues: [] // [{nome:"Joe Residence", ano:2026, local:"Meia Praia"}]
};

window.LAZER = [ // [nome, m², x, y px da planta (2000 px de largura), foto]
  ["Pet Place", 41.20, 692, 285, "g24"], ["Espaço Yoga", 62.59, 980, 305, "g15"], ["Playground", 50.93, 1500, 285, "g23"], ["Praça de fogo", 24.89, 1760, 285, "g13"],
  ["Chimarródromo", 27.43, 735, 420, "g10"], ["Redário", 35.37, 770, 580, "g14"], ["Academia", 67.35, 1080, 540, "g25"], ["Coworking", 23.92, 1250, 470, "g21"],
  ["Salão de Festas 01", 65.30, 1700, 500, "g16"], ["Salão de Festas 02", 65.30, 1700, 880, "g17"], ["Smart Market", 34.00, 1305, 940, "g20"], ["Brinquedoteca", 14.31, 1527, 780, "g22"],
  ["Sala de Jogos & Pub", 64.29, 1105, 860, "g19"], ["Piscina adulto", 80.92, 850, 1180, "g08"], ["Piscina infantil", 10.77, 1245, 1230, "g08"], ["Drink Place", 36.66, 1858, 455, "g12"]
];

window.GALERIA = [
  ["g02", "Fachada · dia", "Fachada"], ["g01", "Fachada · noite", "Fachada"], ["g03", "Acesso e fachada", "Fachada"], ["g07", "Salas comerciais", "Fachada"], ["g04", "Vista aérea", "Fachada"], ["g05", "Vista aérea · praia", "Fachada"],
  ["g06", "Hall de entrada", "Lazer"], ["g08", "Piscina", "Lazer"], ["g09", "Deck da piscina", "Lazer"], ["g10", "Chimarródromo", "Lazer"], ["g11", "Terraço", "Lazer"], ["g12", "Drink place", "Lazer"],
  ["g13", "Praça de fogo", "Lazer"], ["g14", "Redário", "Lazer"], ["g15", "Espaço yoga", "Lazer"], ["g16", "Salão de festas 01", "Lazer"], ["g17", "Salão de festas 02", "Lazer"], ["g18", "Salão de festas", "Lazer"],
  ["g19", "Sala de jogos & pub", "Lazer"], ["g20", "Smart market", "Lazer"], ["g21", "Coworking", "Lazer"], ["g22", "Brinquedoteca", "Lazer"], ["g23", "Playground", "Lazer"], ["g24", "Espaço pet", "Lazer"], ["g25", "Academia", "Lazer"],
  ["g26", "Suíte", "Apartamento"]
];

(function () { // status/preço de demonstração, determinístico
  const P = window.PROJ; let s = 402;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  P.units = {};
  for (let f = P.pavIni; f <= P.pavFim; f++) for (const t in P.tipos) {
    const k = f + "-" + t, depth = 1 - (f - P.pavIni) / (P.pavFim - P.pavIni), r = rnd();
    const status = r < 0.15 + 0.4 * depth ? "v" : r < 0.2 + 0.4 * depth ? "r" : "d";
    const price = Math.round(P.tipos[t].area * (13579 + 110 * (f - P.pavIni)) / 100) * 100;
    P.units[k] = Object.assign({ status, price }, P.overrides[k] || {});
  }
})();
