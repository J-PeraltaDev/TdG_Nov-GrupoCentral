import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { contarPendientes } from '../../core/offline/bd.js'
import { useSesion } from '../../core/sesion/ContextoSesion.js'
import { descripcionDelPerfil } from '../../core/sesion/roles.js'
import { Icono } from '../../core/ui/Icono.jsx'
import iconoIr from '../../core/ui/iconos/chevron_right.svg'
import { Aviso } from '../../core/ui/Aviso.jsx'
import { Boton } from '../../core/ui/Boton.jsx'
import iconoPendientes from '../../core/ui/iconos/cloud_off.svg'
import iconoSalir from '../../core/ui/iconos/logout.svg'
import { MENU } from '../menu.js'

/**
 * Cuenta: quién ingresó y el cierre de sesión (RF-01, CU-01 pasos 5 y 6). Si hay novedades
 * pendientes de sincronizar, advierte antes de cerrar que se conservarán en el dispositivo
 * (CU-01 5a, RNF-07).
 *
 * En el teléfono trae además las pantallas del rol que no caben en la barra inferior: para el
 * administrador, Fincas, Tipos de falla y Recuperación de contraseñas.
 */
export function Cuenta() {
  const { perfil, salir } = useSesion()
  const navegar = useNavigate()
  const [pendientes, setPendientes] = useState(0)
  const [saliendo, setSaliendo] = useState(false)

  useEffect(() => {
    let vigente = true
    contarPendientes()
      .then((cantidad) => vigente && setPendientes(cantidad))
      .catch(() => {})
    return () => {
      vigente = false
    }
  }, [])

  // Lo que el menú de este rol solo muestra en el escritorio: en el teléfono se abre desde aquí.
  const soloEnElEscritorio = (MENU[perfil.rol_id] ?? []).filter((item) => item.soloEscritorio)

  async function alCerrarSesion() {
    setSaliendo(true)
    await salir()
    navegar('/ingresar', { replace: true })
  }

  return (
    <section className="mx-auto flex w-full max-w-xl flex-col gap-4 p-4 lg:p-8">
      <h1 className="text-titulo text-texto">Cuenta</h1>

      <div className="flex flex-col gap-1 rounded-2xl bg-superficie p-5 inset-ring inset-ring-borde">
        <p className="text-cuerpo-fuerte text-texto">{perfil.nombre}</p>
        <p className="text-cuerpo-pequeno text-texto-secundario">{descripcionDelPerfil(perfil)}</p>
        {perfil.finca?.razon_social ? (
          <p className="text-cuerpo-pequeno text-texto-secundario">
            {perfil.finca.razon_social.nombre}
          </p>
        ) : null}
      </div>

      {pendientes > 0 ? (
        <Aviso tipo="advertencia" icono={iconoPendientes} titulo="Tienes novedades sin enviar">
          {pendientes === 1
            ? 'Hay 1 novedad pendiente de sincronizar.'
            : `Hay ${pendientes} novedades pendientes de sincronizar.`}{' '}
          Si cierras la sesión, se conservarán en este dispositivo y se enviarán cuando vuelvas a
          ingresar con tu usuario.
        </Aviso>
      ) : null}

      {soloEnElEscritorio.length > 0 ? (
        <nav
          aria-label="Administración"
          className="flex flex-col rounded-2xl bg-superficie inset-ring inset-ring-borde lg:hidden"
        >
          {soloEnElEscritorio.map(({ ruta, etiqueta, icono }) => (
            <Link
              key={ruta}
              to={ruta}
              className="flex min-h-14 items-center gap-3 border-b border-borde px-5 text-cuerpo text-texto last:border-b-0"
            >
              <Icono src={icono} tamano={22} className="flex-none text-texto-secundario" />
              <span className="min-w-0 flex-1">{etiqueta}</span>
              <Icono src={iconoIr} tamano={20} className="flex-none text-texto-secundario" />
            </Link>
          ))}
        </nav>
      ) : null}

      <Boton
        tipo="secundario-peligro"
        icono={iconoSalir}
        onClick={alCerrarSesion}
        disabled={saliendo}
        className="self-start"
      >
        {saliendo ? 'Cerrando la sesión…' : 'Cerrar sesión'}
      </Boton>
    </section>
  )
}
