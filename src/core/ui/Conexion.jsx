import { Link } from 'react-router'
import { useEnLinea } from '../conexion/useEnLinea.js'
import { useSincronizacion } from '../offline/estadoDeSincronizacion.js'
import { usePendientes } from '../offline/pendientes.js'
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
 * Lo que dice el indicador: la variante de Figma y, si quedan, las pendientes del usuario
 * («Sin conexión · 1 pendiente», Figma 04-B y 07). Mientras sincroniza no se cuentan.
 *
 * @param {EstadoConexion} estado
 * @param {number} [pendientes]
 */
function textoDeConexion(estado, pendientes = 0) {
  const etiqueta = CONEXIONES[estado]?.etiqueta
  if (!etiqueta || estado === 'sincronizando' || pendientes < 1) return etiqueta
  return `${etiqueta} · ${pendientes} ${pendientes === 1 ? 'pendiente' : 'pendientes'}`
}

/** El estado vivo: sin conexión, sincronizando (mientras envía) o en línea. */
function useEstadoDeConexion() {
  const enLinea = useEnLinea()
  const { enCurso, total } = useSincronizacion()
  if (!enLinea) return 'sin_conexion'
  return enCurso && total > 0 ? 'sincronizando' : 'en_linea'
}

/**
 * Indicador de conexión, siempre visible (RF-23 · Figma 1:116). Lee el monitor de conexión, el
 * contador de pendientes y la sincronización; `estado` y `pendientes` solo se pasan para mostrar
 * una variante fija.
 *
 * Con pendientes, es el enlace a la pantalla 08: así se llega a ellas desde cualquier pantalla.
 * No se anuncia por sí mismo: varias barras pintan uno a la vez, y el marco tiene una sola
 * región que avisa los cambios a los lectores de pantalla.
 *
 * @param {object} props
 * @param {EstadoConexion} [props.estado]
 * @param {number} [props.pendientes]
 * @param {string} [props.className]
 */
export function Conexion({ estado, pendientes, className = '' }) {
  const vivo = useEstadoDeConexion()
  const enCola = usePendientes()
  const actual = estado ?? vivo
  const variante = CONEXIONES[actual]
  if (!variante) return null

  const contenido = (
    <>
      {variante.icono ? (
        <Icono src={variante.icono} tamano={16} />
      ) : (
        <img src={punto} alt="" width={8} height={8} className="flex-none" />
      )}
      {textoDeConexion(actual, pendientes ?? enCola)}
    </>
  )
  const clases = `inline-flex items-center gap-1.5 rounded-full py-[5px] pr-3 pl-2.5 text-auxiliar-fuerte whitespace-nowrap inset-ring ${variante.clases} ${className}`

  // Una variante fija (la vitrina de componentes) nunca es enlace.
  if (pendientes !== undefined || enCola < 1) {
    return (
      <span data-conexion={actual} className={clases}>
        {contenido}
      </span>
    )
  }
  return (
    // 28 px a la vista; el pseudoelemento lleva el área táctil a 48 px.
    <Link
      to="/pendientes"
      data-conexion={actual}
      className={`${clases} relative after:absolute after:-inset-x-1 after:-inset-y-2.5`}
    >
      {contenido}
      <span className="sr-only">: ver la lista</span>
    </Link>
  )
}

/**
 * La región que anuncia a los lectores de pantalla los cambios de conexión y de pendientes. Va
 * una sola vez, en el marco: las barras pintan varios indicadores a la vez y ninguno se anuncia
 * por sí mismo (RF-23). Es su propio componente para que un cambio del contador no vuelva a
 * pintar todo el marco.
 */
export function AnuncioDeConexion() {
  const estado = useEstadoDeConexion()
  const pendientes = usePendientes()
  return (
    <p aria-live="polite" className="sr-only">
      {textoDeConexion(estado, pendientes)}
    </p>
  )
}
