import { Icono } from './Icono.jsx'
import iconoSinConexion from './iconos/cloud_off.svg'
import punto from './iconos/punto.svg'
import iconoSincronizando from './iconos/sync.svg'

/** @typedef {'en_linea' | 'sin_conexion' | 'sincronizando'} EstadoConexion */

/** @type {Record<EstadoConexion, { etiqueta: string, icono: string | null, clases: string }>} */
const CONEXIONES = {
  en_linea: {
    etiqueta: 'En línea',
    icono: null,
    clases: 'bg-superficie text-texto inset-ring-borde',
  },
  sin_conexion: {
    etiqueta: 'Sin conexión',
    icono: iconoSinConexion,
    clases: 'bg-advertencia-suave text-advertencia inset-ring-advertencia',
  },
  sincronizando: {
    etiqueta: 'En línea · sincronizando',
    icono: iconoSincronizando,
    clases: 'bg-info-suave text-info inset-ring-info',
  },
}

/**
 * Indicador de conexión, siempre visible (RF-23 · Figma 1:116). Se anuncia a los lectores
 * de pantalla cuando cambia (`role="status"`).
 *
 * @param {object} props
 * @param {EstadoConexion} props.estado
 * @param {string} [props.className]
 */
export function Conexion({ estado, className = '' }) {
  const variante = CONEXIONES[estado]
  if (!variante) return null

  return (
    <span
      role="status"
      data-conexion={estado}
      className={`inline-flex items-center gap-1.5 rounded-full py-[5px] pr-3 pl-2.5 text-auxiliar-fuerte whitespace-nowrap inset-ring ${variante.clases} ${className}`}
    >
      {variante.icono ? (
        <Icono src={variante.icono} tamano={16} />
      ) : (
        <img src={punto} alt="" width={8} height={8} className="flex-none" />
      )}
      {variante.etiqueta}
    </span>
  )
}
