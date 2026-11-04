import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

/** Render ilustrativo no topo dos painéis (padrão da ficha do Bossa: 16:9, legenda discreta).
 *  Uma imagem: foto fixa. Várias do mesmo ambiente: carrossel com setas, pontos e arraste (scroll-snap). */
export function RoomImage({ src, srcs, alt }: { readonly src?: string; readonly srcs?: readonly string[]; readonly alt: string }) {
  const lista = srcs && srcs.length ? srcs : src ? [src] : []
  const trilho = useRef<HTMLDivElement>(null)
  const [atual, setAtual] = useState(0)
  const chave = lista.join('|')

  // trocou de ambiente: volta para a primeira foto
  useEffect(() => {
    setAtual(0)
    if (trilho.current) trilho.current.scrollLeft = 0
  }, [chave])

  if (!lista.length) return null
  const ir = (i: number) => {
    const el = trilho.current
    if (!el) return
    const n = (i + lista.length) % lista.length
    el.scrollTo({ left: n * el.clientWidth, behavior: 'smooth' })
  }
  const aoRolar = () => {
    const el = trilho.current
    if (el) setAtual(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)))
  }

  return (
    <figure className="media" aria-roledescription={lista.length > 1 ? 'carrossel' : undefined} aria-label={lista.length > 1 ? `${alt} — ${lista.length} imagens` : undefined}>
      <div className="media__track" ref={trilho} onScroll={aoRolar} tabIndex={lista.length > 1 ? 0 : -1}
        onKeyDown={(e) => { if (e.key === 'ArrowRight') { e.preventDefault(); ir(atual + 1) } if (e.key === 'ArrowLeft') { e.preventDefault(); ir(atual - 1) } }}>
        {lista.map((s, i) => (
          <img key={s} src={`${import.meta.env.BASE_URL}${s}`} alt={lista.length > 1 ? `${alt} (${i + 1} de ${lista.length})` : alt} loading="lazy" decoding="async" draggable={false} />
        ))}
      </div>
      {lista.length > 1 && (
        <>
          <button type="button" className="media__nav media__nav--prev" onClick={() => ir(atual - 1)} aria-label="Imagem anterior">
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <button type="button" className="media__nav media__nav--next" onClick={() => ir(atual + 1)} aria-label="Próxima imagem">
            <ChevronRight size={18} aria-hidden="true" />
          </button>
          <div className="media__dots" aria-hidden="true">
            {lista.map((s, i) => (
              <span key={s} className={i === atual ? 'on' : ''} />
            ))}
          </div>
        </>
      )}
      <figcaption>Imagem ilustrativa{lista.length > 1 ? ` · ${atual + 1}/${lista.length}` : ''}</figcaption>
    </figure>
  )
}
