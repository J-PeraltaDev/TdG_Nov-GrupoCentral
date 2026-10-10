import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { borrarDatosDeSesion } from '../offline/bd.js'
import { supabase } from '../supabase/cliente.js'
import { ContextoSesion } from './ContextoSesion.js'
import { alPedirRevisionDelPerfil } from './perfilVigente.js'
import { cerrarSesion, iniciarSesion, revisarSesion } from './sesion.js'

const SIN_SESION = { fase: 'sin_sesion', perfil: null, motivoDeSalida: null }

/** Al volver a la pestaña, el perfil no se relee más seguido que esto. */
const ESPERA_ENTRE_REVISIONES_MS = 60_000

/**
 * Indica si dos perfiles dicen lo mismo. El servidor entrega un objeto nuevo en cada lectura:
 * si nada cambió, se conserva el anterior y ninguna pantalla se vuelve a pintar.
 */
const esElMismoPerfil = (a, b) => JSON.stringify(a) === JSON.stringify(b)

/**
 * Mantiene la sesión y el perfil para toda la aplicación (C-02, SDD 6.1.10).
 *
 * El perfil se lee al abrir, al volver la red y, con la sesión viva, cada vez que la persona
 * vuelve a la pestaña o una acción responde `SIN_PERMISO`: un administrador puede haberla
 * desactivado o haberle cambiado el rol o la finca mientras tanto (RF-03 / CU-01 4b).
 *
 * @param {object} props
 * @param {import('react').ReactNode} props.children
 */
export function ProveedorSesion({ children }) {
  const [estado, setEstado] = useState({ fase: 'cargando', perfil: null, motivoDeSalida: null })
  // Lo que los oyentes necesitan saber sin volver a suscribirse en cada cambio.
  const fase = useRef(estado.fase)
  const ultimaRevision = useRef(0)

  useEffect(() => {
    fase.current = estado.fase
  }, [estado.fase])

  useEffect(() => {
    let vigente = true

    /** Lee la sesión y el perfil, y deja el estado como corresponde. */
    const revisar = () => {
      ultimaRevision.current = Date.now()
      revisarSesion()
        .then(({ perfil, desactivado }) => {
          if (!vigente) return
          setEstado((actual) => {
            if (!perfil) {
              // Si ya estaba sin sesión, el motivo con que quedó no se pierde.
              if (!desactivado && actual.fase === 'sin_sesion') return actual
              return { ...SIN_SESION, motivoDeSalida: desactivado ? 'desactivado' : null }
            }
            if (actual.fase === 'con_sesion' && esElMismoPerfil(actual.perfil, perfil)) {
              return actual
            }
            return { fase: 'con_sesion', perfil, motivoDeSalida: null }
          })
        })
        .catch(() => {
          // Al abrir, sin poder leer nada, no hay sesión. Después, se sigue como estaba.
          if (vigente) setEstado((actual) => (actual.fase === 'cargando' ? SIN_SESION : actual))
        })
    }

    revisar()

    // Si Auth da por terminada la sesión (por ejemplo, la cuenta fue suspendida), se sale y se
    // borra lo descargado; las pendientes se conservan. Si ya se había salido, no cambia nada:
    // el motivo con que quedó la sesión no se pierde.
    const { data } = supabase.auth.onAuthStateChange((evento) => {
      if (evento !== 'SIGNED_OUT') return
      borrarDatosDeSesion().catch(() => {})
      if (vigente) setEstado((actual) => (actual.fase === 'sin_sesion' ? actual : SIN_SESION))
    })

    // Con la sesión viva: sin sesión no hay perfil que releer.
    const revisarSiHaySesion = () => {
      if (fase.current === 'con_sesion') revisar()
    }
    // Al volver la red se confirma la sesión contra el servidor, haya o no perfil en pantalla:
    // quien abrió la aplicación sin red puede tener una sesión que no se había podido leer.
    const alVolverLaRed = () => revisar()
    // Al volver a la pestaña, sin insistir: basta una vez por minuto.
    const alVolverALaPestana = () => {
      if (document.visibilityState !== 'visible') return
      if (Date.now() - ultimaRevision.current < ESPERA_ENTRE_REVISIONES_MS) return
      revisarSiHaySesion()
    }
    const dejarDeEscuchar = alPedirRevisionDelPerfil(revisarSiHaySesion)
    window.addEventListener('online', alVolverLaRed)
    window.addEventListener('focus', alVolverALaPestana)
    document.addEventListener('visibilitychange', alVolverALaPestana)

    return () => {
      vigente = false
      data.subscription.unsubscribe()
      dejarDeEscuchar()
      window.removeEventListener('online', alVolverLaRed)
      window.removeEventListener('focus', alVolverALaPestana)
      document.removeEventListener('visibilitychange', alVolverALaPestana)
    }
  }, [])

  const ingresar = useCallback(async (correo, contrasena) => {
    const resultado = await iniciarSesion(correo, contrasena)
    if (resultado.ok) {
      setEstado({ fase: 'con_sesion', perfil: resultado.perfil, motivoDeSalida: null })
    }
    return resultado
  }, [])

  const salir = useCallback(async () => {
    await cerrarSesion()
    setEstado(SIN_SESION)
  }, [])

  const valor = useMemo(() => ({ ...estado, ingresar, salir }), [estado, ingresar, salir])

  return <ContextoSesion value={valor}>{children}</ContextoSesion>
}
