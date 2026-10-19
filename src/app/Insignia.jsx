import { textoDeInsignia } from './insignias.js'

/**
 * Insignia de un elemento del menú o de la campana (Figma 6:3343 y 10): cuántas cosas esperan en
 * esa pantalla. El número solo no dice de qué es: un lector de pantalla oye, por ejemplo, «2
 * avisos sin leer» junto al nombre de la pantalla. Sin nada que contar, no se pinta.
 *
 * @param {object} props
 * @param {number | undefined} props.cantidad
 * @param {string} [props.ruta] La pantalla que cuenta (ver `textoDeInsignia`).
 * @param {boolean} [props.soloVisual] Sin el texto para el lector, cuando quien la usa lo pone
 *   después del nombre (la barra inferior, donde la insignia va antes de la etiqueta).
 */
export function Insignia({ cantidad, ruta, soloVisual = false }) {
  if (!(cantidad > 0)) return null
  return (
    <span
      aria-hidden={soloVisual || undefined}
      className="flex h-[18px] min-w-5 flex-none items-center justify-center rounded-full bg-error px-1.5 text-auxiliar-fuerte text-sobre-primario"
    >
      <span aria-hidden="true">{cantidad > 99 ? '99+' : cantidad}</span>
      {soloVisual ? null : <span className="sr-only">{textoDeInsignia(cantidad, ruta)}</span>}
    </span>
  )
}
