import { useEffect } from 'react'
import { Icono } from './Icono.jsx'
import iconoExito from './iconos/check_circle.svg'
import iconoError from './iconos/error.svg'

/** @typedef {'exito' | 'error'} TipoDeAvisoTemporal */

/** @type {Record<TipoDeAvisoTemporal, { fondo: string, icono: string }>} */
const TIPOS = {
  exito: { fondo: 'bg-texto', icono: iconoExito },
  error: { fondo: 'bg-error', icono: iconoError },
}

/** Tiempo que permanece un aviso que no pide nada a la persona. */
export const DURACION_DEL_AVISO_MS = 6000

/**
 * Aviso temporal (Figma 3:1276 y 13-B): confirma el resultado de una acción sin interrumpir.
 * El de éxito se quita solo; el de error se queda hasta que la persona actúe, porque trae lo
 * que debe hacer («Reintentar»). Nunca se comunica solo con el color: lleva ícono y texto.
 *
 * No decide dónde va: quien lo usa lo ubica con `className`.
 *
 * @param {object} props
 * @param {TipoDeAvisoTemporal} [props.tipo]
 * @param {import('react').ReactNode} props.children El mensaje.
 * @param {{ texto: string, alPulsar: () => void }} [props.accion]
 * @param {() => void} [props.alTerminar] Se llama cuando el aviso de éxito cumple su tiempo.
 * @param {string} [props.className]
 */
export function AvisoTemporal({ tipo = 'exito', children, accion, alTerminar, className = '' }) {
  const { fondo, icono } = TIPOS[tipo]
  const seQuitaSolo = tipo === 'exito' && Boolean(alTerminar)

  useEffect(() => {
    if (!seQuitaSolo) return undefined
    const espera = setTimeout(alTerminar, DURACION_DEL_AVISO_MS)
    return () => clearTimeout(espera)
  }, [seQuitaSolo, alTerminar, children])

  return (
    <div
      // Un error se anuncia de inmediato; una confirmación, cuando el lector termine.
      role={tipo === 'error' ? 'alert' : 'status'}
      data-aviso-temporal={tipo}
      className={`flex items-center gap-2.5 overflow-clip rounded-control px-4 py-3 text-cuerpo-pequeno text-sobre-primario shadow-[0_8px_24px_rgb(15_20_18/0.16)] ${fondo} ${className}`}
    >
      <Icono src={icono} tamano={20} />
      <p className="min-w-0 flex-1 break-words">{children}</p>
      {accion ? (
        <button
          type="button"
          onClick={accion.alPulsar}
          className="relative flex-none cursor-pointer rounded-sm text-etiqueta-fuerte whitespace-nowrap outline-offset-4 outline-sobre-primario after:absolute after:-inset-3.5"
        >
          {accion.texto}
        </button>
      ) : null}
    </div>
  )
}
