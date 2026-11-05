/** Tour aberto DENTRO do mapa (iframe do apresentacao-montemerano, com ?embed=1). Lido uma vez, no carregamento: a URL é reescrita
 *  pelo urlState ao trocar de ambiente e perderia o parâmetro. Nesse modo o tour não tem abertura da cidade nem entorno 3D (o mapa
 *  aéreo é o do site), ganha o botão "Mapa" para voltar e o "Fale conosco" aciona o widget do Link Corretor da página-mãe. */
export const EMBED = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('embed')

interface LcEmbed { readonly abrirIA: () => void }

/** Volta ao mapa: a página-mãe fecha a camada do tour. */
export const voltarAoMapa = () => window.parent.postMessage({ lc: 'tour-fechar' }, window.location.origin)

/** "Fale conosco": no mapa abre a IA/contato do corretor (que pede o cadastro se preciso); fora dele, o formulário do tour. */
export const falarComCorretor = (abrirFormulario: () => void) => {
  if (!EMBED) return abrirFormulario()
  try {
    ;(window.parent as Window & { LC_EMBED?: LcEmbed }).LC_EMBED?.abrirIA() // dentro do mapa o contato é sempre o do corretor do link
  } catch {
    /* página-mãe de outra origem: sem contato aqui */
  }
}
