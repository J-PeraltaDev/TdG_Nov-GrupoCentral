import { useEffect, useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router'
import { usePendientes } from '../../core/offline/pendientes.js'
import { activarPush, desactivarPush, estadoDelPush } from '../../core/push/suscripcion.js'
import { useSesion } from '../../core/sesion/ContextoSesion.js'
import { descripcionDelPerfil } from '../../core/sesion/roles.js'
import { Icono } from '../../core/ui/Icono.jsx'
import iconoIr from '../../core/ui/iconos/chevron_right.svg'
import { Aviso } from '../../core/ui/Aviso.jsx'
import { Boton } from '../../core/ui/Boton.jsx'
import iconoPendientes from '../../core/ui/iconos/cloud_off.svg'
import iconoSalir from '../../core/ui/iconos/logout.svg'
import { Insignia } from '../Insignia.jsx'
import { MENU } from '../menu.js'

/** Lo que dice la fila de las notificaciones según el estado (sin dibujo en Figma; decisión 44). */
const ESTADO_DEL_PUSH = {
  activadas: 'Activadas',
  desactivadas: 'Desactivadas',
  bloqueadas:
    'Bloqueaste las notificaciones en el navegador. Para activarlas, cámbialo en su configuración.',
  'no-disponible':
    'Este navegador no permite notificaciones. En iPhone, primero agrega la aplicación a la pantalla de inicio.',
}

/** «Puedes cambiarlo después en Cuenta» (10-B): activar o desactivar el push del dispositivo. */
function NotificacionesDelDispositivo({ usuarioId }) {
  const [estado, setEstado] = useState(null)
  const [ocupado, setOcupado] = useState(false)
  const [fallo, setFallo] = useState(false)

  useEffect(() => {
    estadoDelPush().then(setEstado, () => setEstado('no-disponible'))
  }, [])

  // Hasta saber el estado no se pinta: en desarrollo no hay service worker y nunca se sabe.
  if (!estado) return null

  async function cambiar() {
    setOcupado(true)
    setFallo(false)
    try {
      setEstado(estado === 'activadas' ? await desactivarPush() : await activarPush(usuarioId))
    } catch {
      setFallo(true)
    } finally {
      setOcupado(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-superficie p-5 inset-ring inset-ring-borde">
      <div className="flex items-center gap-3">
        <p className="flex min-w-0 flex-1 flex-col">
          <span className="text-cuerpo-fuerte text-texto">Notificaciones en este dispositivo</span>
          <span className="text-cuerpo-pequeno text-texto-secundario">
            {ESTADO_DEL_PUSH[estado]}
          </span>
        </p>
        {estado === 'activadas' || estado === 'desactivadas' ? (
          <Boton tipo="secundario" onClick={cambiar} disabled={ocupado} className="flex-none">
            {estado === 'activadas' ? 'Desactivar' : 'Activar'}
          </Boton>
        ) : null}
      </div>
      {fallo ? (
        <p role="alert" className="text-cuerpo-pequeno text-error">
          No se pudo cambiar. Revisa la conexión e intenta de nuevo.
        </p>
      ) : null}
    </div>
  )
}

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
  // Las cuenta el marco, que es el que tiene el menú.
  const { insignias = {} } = useOutletContext() ?? {}
  // Las del usuario, no las de otra persona del dispositivo (RNF-10). Las cuenta el marco.
  const pendientes = usePendientes()
  const [saliendo, setSaliendo] = useState(false)

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

      <NotificacionesDelDispositivo usuarioId={perfil.id} />

      {pendientes > 0 ? (
        <Aviso
          tipo="advertencia"
          icono={iconoPendientes}
          titulo="Tienes novedades sin enviar"
          accion={
            <Link
              to="/pendientes"
              className="relative inline-flex h-10 flex-none items-center rounded-control px-4 text-etiqueta-fuerte whitespace-nowrap text-primario after:absolute after:inset-x-0 after:-inset-y-1"
            >
              Ver pendientes
            </Link>
          }
        >
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
              <Insignia cantidad={insignias[ruta]} />
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
