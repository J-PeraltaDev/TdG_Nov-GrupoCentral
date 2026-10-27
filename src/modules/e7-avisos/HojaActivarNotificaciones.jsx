import { useEffect, useState } from 'react'
import { guardarMeta, leerMeta } from '../../core/offline/bd.js'
import { activarPush, estadoDelPush, textoDelFallo } from '../../core/push/suscripcion.js'
import { ROL } from '../../core/sesion/roles.js'
import { Aviso } from '../../core/ui/Aviso.jsx'
import { Boton } from '../../core/ui/Boton.jsx'
import { Hoja } from '../../core/ui/Hoja.jsx'
import { Icono } from '../../core/ui/Icono.jsx'
import iconoError from '../../core/ui/iconos/error.svg'
import iconoActivar from '../../core/ui/iconos/notifications_active.svg'

/** En el almacén `meta`: ya se ofreció en este dispositivo (decisión 44). */
const YA_OFRECIDA = 'push-ofrecida'

/**
 * 10-B · Activa las notificaciones (RF-31, Figma 2:1703). Sale la primera vez que se abren los
 * avisos en el dispositivo, si el navegador lo admite y el permiso no está decidido. «Ahora no»
 * (o cerrarla) no vuelve a preguntar; Cuenta permite cambiarlo después. El permiso se pide
 * solo después del toque.
 *
 * @param {object} props
 * @param {{ id: string, rol_id: number }} props.perfil
 */
export function HojaActivarNotificaciones({ perfil }) {
  const [abierta, setAbierta] = useState(false)
  const [activando, setActivando] = useState(false)
  const [fallo, setFallo] = useState(/** @type {string | null} */ (null))

  useEffect(() => {
    let vigente = true
    Promise.all([estadoDelPush(), leerMeta(YA_OFRECIDA)]).then(
      ([estado, ofrecida]) => {
        const sinDecidir = estado === 'desactivadas' && Notification.permission === 'default'
        if (vigente && sinDecidir && !ofrecida) setAbierta(true)
      },
      () => {},
    )
    return () => {
      vigente = false
    }
  }, [])

  function cerrar() {
    setAbierta(false)
    guardarMeta(YA_OFRECIDA, true).catch(() => {})
  }

  async function activar() {
    setActivando(true)
    setFallo(null)
    try {
      await activarPush(perfil.id)
      cerrar()
    } catch (error) {
      setFallo(
        textoDelFallo(error, 'No se pudieron activar. Revisa la conexión e intenta de nuevo.'),
      )
    } finally {
      setActivando(false)
    }
  }

  return (
    <Hoja
      abierta={abierta}
      alCerrar={cerrar}
      centrada
      titulo="Activa las notificaciones"
      icono={
        <span className="flex size-16 items-center justify-center rounded-full bg-primario-contenedor text-primario">
          <Icono src={iconoActivar} tamano={32} />
        </span>
      }
    >
      <p className="text-center text-cuerpo text-texto-secundario">
        {perfil.rol_id === ROL.REPORTANTE
          ? 'Te avisaremos en este teléfono cuando tu novedad cambie de estado, aunque la app esté cerrada.'
          : 'Te avisaremos en este dispositivo cuando cambie una novedad que atiendes, aunque la app esté cerrada.'}
      </p>
      {fallo ? (
        <Aviso tipo="error" icono={iconoError} role="alert">
          {fallo}
        </Aviso>
      ) : null}
      <div className="flex flex-col gap-1">
        <Boton onClick={activar} disabled={activando} className="w-full">
          {activando ? 'Activando…' : 'Activar notificaciones'}
        </Boton>
        <Boton tipo="texto" onClick={cerrar} className="w-full">
          Ahora no
        </Boton>
      </div>
      <p className="text-center text-auxiliar text-texto-secundario">
        Puedes cambiarlo después en Cuenta.
      </p>
    </Hoja>
  )
}
