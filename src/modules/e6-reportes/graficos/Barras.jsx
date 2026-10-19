/**
 * @typedef {object} FilaDeBarras
 * @property {string} id
 * @property {import('react').ReactNode} etiqueta El nombre (o un enlace, o un chip de estado).
 * @property {{ valor: number, clase: string }[]} segmentos Uno por serie; `clase` es su color.
 * @property {number} total El número que va al final de la barra.
 * @property {string} [detalle] Para el lector de pantalla, en lugar del número: «2 abiertas:
 *   Mantenimiento 1, Sistemas 1».
 */

/**
 * Barras horizontales, simples o apiladas (Figma 23; plan del Sprint 5, decisión 25), con CSS:
 * el ancho es proporcional al mayor y cada barra lleva su número, así que nada depende solo del
 * color. La barra es un adorno para el lector de pantalla.
 *
 * @param {object} props
 * @param {FilaDeBarras[]} props.filas
 * @param {string} [props.anchoDeEtiqueta] Clases del ancho de la columna de nombres; sin
 *   `truncate`, el nombre largo pasa a otra línea (Figma 27).
 */
export function Barras({ filas, anchoDeEtiqueta = 'w-[110px] truncate' }) {
  const mayor = Math.max(1, ...filas.map((fila) => fila.total))
  return (
    <ul className="flex flex-col gap-3.5">
      {filas.map((fila) => (
        <li key={fila.id} className="flex items-center gap-3">
          <span className={`flex-none text-cuerpo-pequeno text-texto ${anchoDeEtiqueta}`}>
            {fila.etiqueta}
          </span>
          <span className="flex min-w-0 flex-1 items-center gap-3 lg:max-w-[340px]">
            {/* El número cabe siempre al final: la barra más larga ocupa el resto. */}
            <span
              aria-hidden="true"
              className="flex h-[18px] gap-0.5"
              style={{ width: `calc((100% - 2.5rem) * ${fila.total / mayor})` }}
            >
              {fila.segmentos
                .filter((segmento) => segmento.valor > 0)
                .map((segmento, i, visibles) => (
                  <span
                    // oxlint-disable-next-line react/no-array-index-key -- el orden de las series es fijo
                    key={i}
                    className={`h-full ${segmento.clase} ${i === visibles.length - 1 ? 'rounded-r' : ''}`}
                    style={{ flexGrow: segmento.valor, flexBasis: 0 }}
                  />
                ))}
            </span>
            <span
              aria-hidden={fila.detalle ? true : undefined}
              className="text-etiqueta-fuerte text-texto tabular-nums"
            >
              {fila.total}
            </span>
            {fila.detalle ? <span className="sr-only">{fila.detalle}</span> : null}
          </span>
        </li>
      ))}
    </ul>
  )
}
