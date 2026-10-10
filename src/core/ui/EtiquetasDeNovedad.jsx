import { Estado } from './Estado.jsx'
import { Prioridad } from './Prioridad.jsx'

const COLOR_DEL_AREA = {
  Mantenimiento: 'text-area-mantenimiento',
  Sistemas: 'text-area-sistemas',
}

/**
 * Etiqueta gris de un dato de la novedad (Figma: «Etiqueta», 4:653).
 *
 * @param {object} props
 * @param {import('react').ReactNode} props.children
 * @param {string} [props.className] Color del texto.
 */
export function Etiqueta({ children, className = 'text-texto-secundario' }) {
  return (
    <span
      className={`rounded-md bg-gris-100 px-2 py-0.5 text-auxiliar-fuerte whitespace-nowrap ${className}`}
    >
      {children}
    </span>
  )
}

/**
 * Estado, prioridad, área y finca: lo que identifica a la novedad de un vistazo. Lo usan el
 * detalle (13, 14, 20 y 22) y la lista de escaladas (19).
 *
 * @param {object} props
 * @param {{ estado: string, prioridad: string, area: string, finca: string }} props.novedad
 */
export function EtiquetasDeNovedad({ novedad }) {
  return (
    <>
      <Estado estado={novedad.estado} />
      <Prioridad prioridad={novedad.prioridad} />
      <Etiqueta className={COLOR_DEL_AREA[novedad.area] ?? 'text-texto-secundario'}>
        {novedad.area}
      </Etiqueta>
      {/* Figma escribe «Finca Juanca»; si el nombre ya empieza por «Finca», no se repite. */}
      <Etiqueta>
        {/^finca\b/i.test(novedad.finca) ? novedad.finca : `Finca ${novedad.finca}`}
      </Etiqueta>
    </>
  )
}
