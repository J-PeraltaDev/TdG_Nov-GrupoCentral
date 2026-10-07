import { Icono } from './Icono.jsx'
import iconoAlto from './iconos/keyboard_double_arrow_up.svg'
import iconoBajo from './iconos/keyboard_arrow_down.svg'
import iconoCritico from './iconos/error.svg'
import iconoNormal from './iconos/drag_handle.svg'

/**
 * @typedef {import('../supabase/database.types').Database['public']['Enums']['prioridad_novedad']} PrioridadNovedad
 */

/**
 * Los 4 niveles, en el orden del tipo `prioridad_novedad` (el de la bandeja, RF-09).
 *
 * @type {Record<PrioridadNovedad, { etiqueta: string, icono: string, clases: string }>}
 */
const PRIORIDADES = {
  critico: { etiqueta: 'Crítico', icono: iconoCritico, clases: 'bg-prioridad-critico' },
  alto: { etiqueta: 'Alto', icono: iconoAlto, clases: 'bg-prioridad-alto' },
  normal: { etiqueta: 'Normal', icono: iconoNormal, clases: 'bg-prioridad-normal' },
  bajo: { etiqueta: 'Bajo', icono: iconoBajo, clases: 'bg-prioridad-bajo' },
}

/**
 * Pastilla de prioridad (Figma 1:106): fondo sólido, texto blanco, ícono y etiqueta.
 *
 * @param {object} props
 * @param {PrioridadNovedad} props.prioridad
 * @param {string} [props.className]
 */
export function Prioridad({ prioridad, className = '' }) {
  const variante = PRIORIDADES[prioridad]
  if (!variante) return null

  return (
    <span
      data-prioridad={prioridad}
      className={`inline-flex items-center gap-1 rounded-full py-[3px] pr-2.5 pl-2 text-auxiliar-fuerte whitespace-nowrap text-sobre-primario ${variante.clases} ${className}`}
    >
      <Icono src={variante.icono} tamano={14} />
      {variante.etiqueta}
    </span>
  )
}
