// Estado compartilhado do mapa: tudo o que muda e é lido por mais de um módulo mora aqui.
export const state = {
  selected: null,  // casa ou área com a ficha aberta
  light: "dia",    // luz atual: manha, dia, tarde, por, noite
  only: false,     // filtro "Só disponíveis"
  tipU: null,      // casa sob o mouse (tooltip)
  sun: { season: "hoje", h: 12, pos: null }, // época (hoje, verao, inverno), hora local e posição do sol aplicadas
  cam: { S: 1, TX: 0, TY: 0, ROT: false, anim: null }, // câmera do 2D; ROT = celular em pé com o mapa girado
  r3: { on: false, ready: false, loading: false },      // relevo 3D
};
export const cam = state.cam, R3 = state.r3;
