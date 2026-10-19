import { Icono } from './Icono.jsx'
import { ESTADOS } from './presentacionDelEstado.js'

/** @typedef {import('./presentacionDelEstado.js').EstadoNovedad} EstadoNovedad */

/**
 * Chip de estado de la novedad (Figma 1:93). Nunca comunica el estado solo con color:
 * siempre lleva ícono y etiqueta.
 *
 * @param {object} props
 * @param {EstadoNovedad} props.estado
 * @param {string} [props.className]
 */
export function Estado({ estado, className = '' }) {
  const variante = ESTADOS[estado]
  if (!variante) return null

  return (
    <span
      data-estado={estado}
      className={`inline-flex items-center gap-1 rounded-full py-[3px] pr-2.5 pl-2 text-auxiliar-fuerte whitespace-nowrap ${variante.clases} ${className}`}
    >
      <Icono src={variante.icono} tamano={14} />
      {variante.etiqueta}
    </span>
  )
}
