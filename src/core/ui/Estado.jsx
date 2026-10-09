import { NOMBRE_DE_ESTADO } from '../utils/estados.js'
import { Icono } from './Icono.jsx'
import iconoAprobada from './iconos/verified.svg'
import iconoAsignada from './iconos/assignment_ind.svg'
import iconoAtencion from './iconos/build.svg'
import iconoCerrada from './iconos/lock.svg'
import iconoEscalada from './iconos/arrow_circle_up.svg'
import iconoPendiente from './iconos/cloud_off.svg'
import iconoRechazada from './iconos/block.svg'
import iconoRegistrada from './iconos/edit_note.svg'
import iconoResuelta from './iconos/task_alt.svg'

/**
 * Estados de la novedad: los 8 del tipo `estado_novedad` (SDD, Tabla 28) más `pendiente`,
 * que solo existe en el dispositivo (pendiente de sincronizar).
 *
 * @typedef {import('../supabase/database.types').Database['public']['Enums']['estado_novedad'] | 'pendiente'} EstadoNovedad
 */

/** @type {Record<EstadoNovedad, { etiqueta: string, icono: string, clases: string }>} */
const ESTADOS = {
  registrada: {
    etiqueta: NOMBRE_DE_ESTADO.registrada,
    icono: iconoRegistrada,
    clases: 'bg-estado-registrada-fondo text-estado-registrada-texto',
  },
  asignada: {
    etiqueta: NOMBRE_DE_ESTADO.asignada,
    icono: iconoAsignada,
    clases: 'bg-estado-asignada-fondo text-estado-asignada-texto',
  },
  en_atencion: {
    etiqueta: NOMBRE_DE_ESTADO.en_atencion,
    icono: iconoAtencion,
    clases: 'bg-estado-atencion-fondo text-estado-atencion-texto',
  },
  escalada: {
    etiqueta: NOMBRE_DE_ESTADO.escalada,
    icono: iconoEscalada,
    clases: 'bg-estado-escalada-fondo text-estado-escalada-texto',
  },
  aprobada: {
    etiqueta: NOMBRE_DE_ESTADO.aprobada,
    icono: iconoAprobada,
    clases: 'bg-estado-aprobada-fondo text-estado-aprobada-texto',
  },
  rechazada: {
    etiqueta: NOMBRE_DE_ESTADO.rechazada,
    icono: iconoRechazada,
    clases: 'bg-estado-rechazada-fondo text-estado-rechazada-texto',
  },
  resuelta: {
    etiqueta: NOMBRE_DE_ESTADO.resuelta,
    icono: iconoResuelta,
    clases: 'bg-estado-resuelta-fondo text-estado-resuelta-texto',
  },
  cerrada: {
    etiqueta: NOMBRE_DE_ESTADO.cerrada,
    icono: iconoCerrada,
    clases: 'bg-estado-cerrada-fondo text-estado-cerrada-texto',
  },
  pendiente: {
    etiqueta: 'Pendiente de sincronizar',
    icono: iconoPendiente,
    clases:
      'bg-estado-pendiente-fondo text-estado-pendiente-texto outline-[1.5px] -outline-offset-[1.5px] outline-dashed outline-estado-pendiente-borde',
  },
}

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
