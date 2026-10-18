import { useEffect, useState } from 'react'
import { estaEnLinea, suscribir } from '../core/conexion/monitor.js'
import { ROL } from '../core/sesion/roles.js'
import { contarAvisosSinLeer } from '../core/supabase/repositorios/avisos.js'
import { contarBandeja } from '../core/supabase/repositorios/novedades.js'
import { contarSolicitudesPendientes } from '../core/supabase/repositorios/recuperacion.js'
import { alPedirConteoDeInsignias } from './insignias.js'

/** Cada cuánto se vuelve a contar con la aplicación a la vista. */
const INTERVALO_MS = 60_000

/** La pestaña «Por atender» de la bandeja (SDD 6.1.11). */
const POR_ATENDER = ['asignada', 'aprobada']

const SIN_INSIGNIAS = Object.freeze({})

/**
 * Lo que cuenta cada rol, por ruta del menú: los avisos sin leer, todos (RF-30); la bandeja, el
 * aprobador (decisión 34 del plan del Sprint 5); las solicitudes de recuperación, el
 * administrador (RF-02).
 */
function conteosDe(rolId, areaId) {
  const conteos = { '/avisos': contarAvisosSinLeer }
  if (rolId === ROL.APROBADOR_AREA && areaId) {
    conteos['/bandeja'] = () => contarBandeja({ areaId, estados: POR_ATENDER })
  }
  if (rolId === ROL.ADMINISTRADOR) conteos['/recuperacion'] = contarSolicitudesPendientes
  return conteos
}

/**
 * Las insignias del menú y de la campana: la cantidad por ruta. Se cuentan al entrar, cada
 * minuto mientras la aplicación está a la vista y con conexión, al volver a ella o a la
 * conexión y cuando una pantalla lo pide (SDD 6.1.6). Si una cuenta falla, se conserva la
 * anterior: una insignia no es motivo para mostrar un error.
 *
 * @param {{ id: string, rol_id: number, area_id?: string | null }} perfil
 * @returns {Record<string, number>}
 */
export function useInsignias({ id, rol_id: rolId, area_id: areaId = null }) {
  const clave = `${id}:${rolId}:${areaId}`
  const [estado, setEstado] = useState({ clave, insignias: SIN_INSIGNIAS })

  useEffect(() => {
    let vigente = true
    const conteos = conteosDe(rolId, areaId)

    function contar() {
      if (document.visibilityState !== 'visible' || !estaEnLinea()) return
      for (const [ruta, consulta] of Object.entries(conteos)) {
        Promise.resolve()
          .then(consulta)
          .then((cantidad) => {
            if (!vigente) return
            setEstado((antes) => ({
              clave,
              insignias: { ...(antes.clave === clave ? antes.insignias : {}), [ruta]: cantidad },
            }))
          })
          .catch(() => {})
      }
    }

    contar()
    const dejarDePedir = alPedirConteoDeInsignias(contar)
    const dejarDeEscuchar = suscribir(contar)
    const reloj = setInterval(contar, INTERVALO_MS)
    document.addEventListener('visibilitychange', contar)
    return () => {
      vigente = false
      dejarDePedir()
      dejarDeEscuchar()
      clearInterval(reloj)
      document.removeEventListener('visibilitychange', contar)
    }
  }, [clave, rolId, areaId])

  // Si cambió el usuario, el rol o el área con la aplicación abierta, lo de antes ya no es suyo.
  return estado.clave === clave ? estado.insignias : SIN_INSIGNIAS
}
