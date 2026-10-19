import { useId, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useEnLinea } from '../core/conexion/useEnLinea.js'
import { esErrorDeRed, traducirError } from '../core/errores/traducir.js'
import { buscarPorCodigo } from '../core/supabase/repositorios/historial.js'
import { Icono } from '../core/ui/Icono.jsx'
import iconoBuscar from '../core/ui/iconos/search.svg'
import { formatearCodigo, leerCodigo } from '../core/utils/codigo.js'

const SIN_CONEXION = 'Buscar por código necesita conexión.'

/**
 * El buscador por código de la barra superior del escritorio (Figma 21 y 23; plan del Sprint 5,
 * decisión 15), para los cuatro roles. Abre el detalle de la novedad, que vuelve a la pantalla
 * donde se buscó. Si no la encuentra, no dice si no existe o si es de otro alcance (como 22-B).
 */
export function BuscadorPorCodigo() {
  const navegar = useNavigate()
  const { pathname, search } = useLocation()
  const enLinea = useEnLinea()
  const [texto, setTexto] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [buscando, setBuscando] = useState(false)
  const idDelMensaje = useId()

  async function buscar(evento) {
    evento.preventDefault()
    if (buscando) return
    const codigo = leerCodigo(texto)
    if (codigo === null) return setMensaje('Escribe un código como NOV-0153.')
    if (!enLinea) return setMensaje(SIN_CONEXION)
    setBuscando(true)
    try {
      const id = await buscarPorCodigo(codigo)
      if (id) {
        setTexto('')
        setMensaje('')
        navegar(`/novedades/${id}`, { state: { origen: `${pathname}${search}` } })
      } else {
        setMensaje(`No encontramos ${formatearCodigo(codigo)} entre las novedades que puedes ver.`)
      }
    } catch (error) {
      setMensaje(esErrorDeRed(error) ? SIN_CONEXION : traducirError(error).mensaje)
    } finally {
      setBuscando(false)
    }
  }

  return (
    <form role="search" noValidate onSubmit={buscar} className="relative">
      <label className="flex w-[22.5rem] items-center gap-2 rounded-control bg-fondo px-3.5 py-2.5 text-texto-secundario inset-ring inset-ring-borde focus-within:inset-ring-2 focus-within:inset-ring-primario">
        <Icono src={iconoBuscar} tamano={20} />
        <span className="sr-only">Buscar por código</span>
        <input
          type="search"
          name="codigo"
          value={texto}
          onChange={(evento) => {
            setTexto(evento.target.value)
            setMensaje('')
          }}
          placeholder="Buscar por código (NOV-…)"
          autoComplete="off"
          enterKeyHint="search"
          spellCheck={false}
          aria-describedby={mensaje ? idDelMensaje : undefined}
          className="min-w-0 flex-1 bg-transparent text-cuerpo-pequeno text-texto outline-none placeholder:text-texto-secundario"
        />
      </label>
      {/* Siempre presente: el lector de pantalla anuncia el mensaje cuando aparece. */}
      <p
        id={idDelMensaje}
        role="status"
        className={
          mensaje
            ? 'absolute top-full left-0 z-20 mt-1 w-[22.5rem] rounded-control bg-superficie px-3.5 py-2.5 text-cuerpo-pequeno text-texto inset-ring inset-ring-borde drop-shadow-lg'
            : 'sr-only'
        }
      >
        {mensaje}
      </p>
    </form>
  )
}
