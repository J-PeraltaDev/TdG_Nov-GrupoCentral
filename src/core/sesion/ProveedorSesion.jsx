import { useCallback, useEffect, useMemo, useState } from 'react'
import { borrarDatosDeSesion } from '../offline/bd.js'
import { supabase } from '../supabase/cliente.js'
import { ContextoSesion } from './ContextoSesion.js'
import { cerrarSesion, iniciarSesion, restaurarSesion } from './sesion.js'

const SIN_SESION = { fase: 'sin_sesion', perfil: null }

/**
 * Mantiene la sesión y el perfil para toda la aplicación (C-02, SDD 6.1.10).
 *
 * @param {object} props
 * @param {import('react').ReactNode} props.children
 */
export function ProveedorSesion({ children }) {
  const [estado, setEstado] = useState({ fase: 'cargando', perfil: null })

  useEffect(() => {
    let vigente = true

    restaurarSesion()
      .catch(() => null)
      .then((perfil) => {
        if (vigente) setEstado(perfil ? { fase: 'con_sesion', perfil } : SIN_SESION)
      })

    // Si Auth da por terminada la sesión (por ejemplo, la cuenta fue suspendida), se sale y se
    // borra lo descargado; las pendientes se conservan.
    const { data } = supabase.auth.onAuthStateChange((evento) => {
      if (evento !== 'SIGNED_OUT') return
      borrarDatosDeSesion().catch(() => {})
      if (vigente) setEstado(SIN_SESION)
    })

    // Al volver la red se confirma la sesión contra el servidor.
    const alVolverLaRed = () => {
      restaurarSesion()
        .catch(() => null)
        .then((perfil) => {
          if (vigente) setEstado(perfil ? { fase: 'con_sesion', perfil } : SIN_SESION)
        })
    }
    window.addEventListener('online', alVolverLaRed)

    return () => {
      vigente = false
      data.subscription.unsubscribe()
      window.removeEventListener('online', alVolverLaRed)
    }
  }, [])

  const ingresar = useCallback(async (correo, contrasena) => {
    const resultado = await iniciarSesion(correo, contrasena)
    if (resultado.ok) setEstado({ fase: 'con_sesion', perfil: resultado.perfil })
    return resultado
  }, [])

  const salir = useCallback(async () => {
    await cerrarSesion()
    setEstado(SIN_SESION)
  }, [])

  const valor = useMemo(() => ({ ...estado, ingresar, salir }), [estado, ingresar, salir])

  return <ContextoSesion value={valor}>{children}</ContextoSesion>
}
