/** @typedef {'segmentada' | 'subrayada'} VarianteDePestanas */

/** @type {Record<VarianteDePestanas, { lista: string, pestana: string, elegida: string, otra: string }>} */
const VARIANTES = {
  // Teléfono (Figma 3:329): control segmentado a todo el ancho. La pastilla mide 36 px; el
  // botón que la contiene amplía el área táctil a 48 px sin cambiar lo que se ve.
  segmentada: {
    lista: 'flex w-full gap-1 rounded-xl bg-gris-100 p-1',
    pestana: '-my-1.5 flex min-h-12 min-w-0 flex-1 items-center',
    elegida:
      'bg-superficie text-etiqueta-fuerte text-texto drop-shadow-[0_1px_1.5px_rgb(0_0_0/0.08)]',
    otra: 'text-etiqueta text-texto-secundario',
  },
  // Escritorio (Figma 3:636): texto con una barra de 3 px debajo de la elegida.
  subrayada: {
    lista: 'flex gap-6 border-b border-borde',
    pestana: 'flex',
    elegida: 'border-primario text-etiqueta-fuerte text-primario',
    otra: 'border-transparent text-etiqueta text-texto-secundario',
  },
}

const FORMA = {
  segmentada: 'flex-1 rounded-[9px] p-2 text-center',
  subrayada: 'border-b-[3px] pb-2.5',
}

/**
 * Pestañas (patrón «tabs» de ARIA): una lista de opciones de la que siempre hay una elegida,
 * y que cambia lo que muestra el panel `idDelPanel`. Con el teclado, las flechas, Inicio y Fin
 * mueven el foco; la pestaña se elige con Enter o con la barra espaciadora, porque elegirla
 * consulta el servidor.
 *
 * @param {object} props
 * @param {string} props.etiqueta Nombre accesible de la lista.
 * @param {{ id: string, nombre: string }[]} props.pestanas
 * @param {string} props.elegida `id` de la pestaña elegida.
 * @param {(id: string) => void} props.alElegir
 * @param {string} props.idDelPanel `id` del elemento con `role="tabpanel"`.
 * @param {VarianteDePestanas} [props.variante]
 * @param {string} [props.className]
 */
export function Pestanas({
  etiqueta,
  pestanas,
  elegida,
  alElegir,
  idDelPanel,
  variante = 'segmentada',
  className = '',
}) {
  const estilo = VARIANTES[variante]

  function alTeclear(evento) {
    const todas = [...evento.currentTarget.parentElement.querySelectorAll('[role="tab"]')]
    const actual = todas.indexOf(evento.currentTarget)
    const destino = {
      ArrowRight: (actual + 1) % todas.length,
      ArrowLeft: (actual - 1 + todas.length) % todas.length,
      Home: 0,
      End: todas.length - 1,
    }[evento.key]
    if (destino === undefined) return
    evento.preventDefault()
    todas[destino].focus()
  }

  return (
    <div
      role="tablist"
      aria-label={etiqueta}
      data-variante={variante}
      className={`${estilo.lista} ${className}`}
    >
      {pestanas.map(({ id, nombre }) => {
        const estaElegida = id === elegida
        return (
          <button
            key={id}
            type="button"
            role="tab"
            id={`${idDelPanel}-pestana-${id}`}
            aria-selected={estaElegida}
            aria-controls={idDelPanel}
            tabIndex={estaElegida ? 0 : -1}
            onClick={() => alElegir(id)}
            onKeyDown={alTeclear}
            className={`group cursor-pointer outline-none ${estilo.pestana}`}
          >
            <span
              className={`whitespace-nowrap group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-primario ${FORMA[variante]} ${estaElegida ? estilo.elegida : estilo.otra}`}
            >
              {nombre}
            </span>
          </button>
        )
      })}
    </div>
  )
}
