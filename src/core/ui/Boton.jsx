import { Icono } from './Icono.jsx'
import iconoCandado from './iconos/lock.svg'

/** @typedef {'primario' | 'secundario' | 'secundario-peligro' | 'texto' | 'peligro'} TipoBoton */
/** @typedef {'movil' | 'escritorio'} TamanoBoton */

/** @type {Record<TipoBoton, string>} */
const TIPOS_BOTON = {
  primario: 'bg-primario text-sobre-primario hover:bg-primario-hover',
  // El borde va como sombra interior: no cambia el tamaño y deja libre `outline` para el foco.
  secundario: 'bg-superficie text-texto inset-ring inset-ring-borde',
  'secundario-peligro': 'bg-superficie text-error inset-ring inset-ring-borde',
  texto: 'text-primario',
  peligro: 'bg-error text-sobre-primario',
}

// El sexto tipo de Figma: se aplica a cualquier botón con `disabled`.
const DESHABILITADO = 'bg-gris-200 text-deshabilitado cursor-not-allowed'

const TAMANO_MOVIL = 'h-12 px-5 text-cuerpo-fuerte'
const TAMANO_ESCRITORIO = 'h-10 px-4 text-etiqueta-fuerte'

/** @type {Record<TamanoBoton | 'adaptable', string>} */
const TAMANOS = {
  movil: TAMANO_MOVIL,
  // Forzado a 40 px (botones dentro de un aviso o junto a un dato): el área táctil se amplía
  // a 48 px con un pseudoelemento, sin cambiar el tamaño visible.
  escritorio: `${TAMANO_ESCRITORIO} relative after:absolute after:inset-x-0 after:-inset-y-1`,
  // 48 px en el teléfono (uso táctil) y 40 px desde lg.
  adaptable: `${TAMANO_MOVIL} lg:h-10 lg:px-4 lg:text-etiqueta-fuerte`,
}

/**
 * Botón del sistema de diseño (Figma 1:153): 6 tipos en 2 tamaños. Sin `tamano` se adapta:
 * 48 px en el teléfono y 40 px en el escritorio.
 *
 * @param {object} props
 * @param {TipoBoton} [props.tipo]
 * @param {TamanoBoton} [props.tamano] Fuerza un tamaño; por defecto se adapta al ancho.
 * @param {string} [props.icono] URL de un SVG de `iconos/`, opcional.
 * @param {boolean} [props.disabled]
 * @param {boolean} [props.noDisponible] Sin conexión (RF-25): se ve deshabilitado y con candado
 *   (Figma 09-D y 14-B), pero sigue en el orden del teclado y se anuncia como no disponible
 *   (`aria-disabled`); pulsarlo no hace nada. La explicación va con `aria-describedby`.
 * @param {string} [props.className]
 * @param {import('react').ReactNode} props.children
 * @param {import('react').ButtonHTMLAttributes<HTMLButtonElement>} [props.resto]
 */
export function Boton({
  tipo = 'primario',
  tamano,
  icono,
  disabled = false,
  noDisponible = false,
  className = '',
  children,
  ...resto
}) {
  const apariencia =
    disabled || noDisponible ? DESHABILITADO : `${TIPOS_BOTON[tipo]} cursor-pointer`
  const imagen = noDisponible ? iconoCandado : icono

  return (
    <button
      type="button"
      {...resto}
      disabled={disabled}
      aria-disabled={noDisponible || undefined}
      // También frena el envío del formulario, con el clic o con Enter en un campo.
      onClick={noDisponible ? (evento) => evento.preventDefault() : resto.onClick}
      data-tipo={tipo}
      className={`inline-flex items-center justify-center gap-2 rounded-control whitespace-nowrap ${TAMANOS[tamano ?? 'adaptable']} ${apariencia} ${className}`}
    >
      {imagen ? <Icono src={imagen} tamano={20} /> : null}
      {children}
    </button>
  )
}
