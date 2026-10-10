import { useEffect, useState } from 'react'
import { ROL } from '../core/sesion/roles.js'
import { contarSolicitudesPendientes } from '../core/supabase/repositorios/recuperacion.js'
import { alPedirConteoDeInsignias } from './insignias.js'

/** Cada cuánto se vuelve a contar con la aplicación a la vista. */
const INTERVALO_MS = 60_000

const SIN_INSIGNIAS = Object.freeze({})

/**
 * Las insignias del menú de un rol: la cantidad por ruta. Se cuentan al entrar, cada minuto
 * mientras la aplicación está a la vista y con conexión, al volver a ella y cuando una
 * pantalla lo pide. Si la cuenta falla, se conserva la anterior: una insignia no es motivo
 * para mostrar un error.
 *
 * @param {number} rolId
 * @returns {Record<string, number>}
 */
export function useInsignias(rolId) {
  const [insignias, setInsignias] = useState(/** @type {Record<string, number>} */ (SIN_INSIGNIAS))
  const esAdministrador = rolId === ROL.ADMINISTRADOR

  useEffect(() => {
    if (!esAdministrador) return undefined
    let vigente = true

    function contar() {
      if (document.visibilityState !== 'visible' || !navigator.onLine) return
      contarSolicitudesPendientes()
        .then((cantidad) => {
          if (vigente) setInsignias({ '/recuperacion': cantidad })
        })
        .catch(() => {})
    }

    contar()
    const dejarDeEscuchar = alPedirConteoDeInsignias(contar)
    const reloj = setInterval(contar, INTERVALO_MS)
    document.addEventListener('visibilitychange', contar)
    window.addEventListener('online', contar)
    return () => {
      vigente = false
      dejarDeEscuchar()
      clearInterval(reloj)
      document.removeEventListener('visibilitychange', contar)
      window.removeEventListener('online', contar)
    }
  }, [esAdministrador])

  // Si dejó de ser administrador con la aplicación abierta, la cuenta anterior ya no es suya.
  return esAdministrador ? insignias : SIN_INSIGNIAS
}
