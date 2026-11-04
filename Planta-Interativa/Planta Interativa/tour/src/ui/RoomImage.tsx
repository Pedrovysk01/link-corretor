/** Render ilustrativo no topo dos painéis (mesmo padrão da ficha do Bossa: 16:9, legenda em caixa alta). */
export function RoomImage({ src, alt }: { readonly src?: string; readonly alt: string }) {
  if (!src) return null
  return (
    <figure className="media">
      <img src={`${import.meta.env.BASE_URL}${src}`} alt={alt} loading="lazy" decoding="async" />
      <figcaption>Imagem ilustrativa</figcaption>
    </figure>
  )
}
