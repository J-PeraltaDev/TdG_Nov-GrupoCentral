import { Icono } from './Icono.jsx'

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
  escritorio: TAMANO_ESCRITORIO,
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
 * @param {string} [props.className]
 * @param {import('react').ReactNode} props.children
 * @param {import('react').ButtonHTMLAttributes<HTMLButtonElement>} [props.resto]
 */
export function Boton({
  tipo = 'primario',
  tamano,
  icono,
  disabled = false,
  className = '',
  children,
  ...resto
}) {
  const apariencia = disabled ? DESHABILITADO : `${TIPOS_BOTON[tipo]} cursor-pointer`

  return (
    <button
      type="button"
      {...resto}
      disabled={disabled}
      data-tipo={tipo}
      className={`inline-flex items-center justify-center gap-2 rounded-control whitespace-nowrap ${TAMANOS[tamano ?? 'adaptable']} ${apariencia} ${className}`}
    >
      {icono ? <Icono src={icono} tamano={20} /> : null}
      {children}
    </button>
  )
}
