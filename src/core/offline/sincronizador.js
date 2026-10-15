import { useEffect } from 'react'
import { estaEnLinea, suscribir } from '../conexion/monitor.js'
import { traducirError } from '../errores/traducir.js'
import { pedirRevisionDelPerfil } from '../sesion/perfilVigente.js'
import { confirmarSesion } from '../sesion/sesion.js'
import { registrarNovedad } from '../supabase/repositorios/novedades.js'
import { actualizarPendiente, borrarPendiente, guardarMeta, listarPendientes } from './bd.js'
import { cambiarSincronizacion, leerSincronizacion } from './estadoDeSincronizacion.js'
import { avisarCambioDePendientes } from './pendientes.js'

/*
 * Sincronización de las pendientes (C-03, SDD 6.1.5 y Figura 18 · RF-22 / CU-22). Un solo ciclo
 * a la vez: bandera en la pestaña y Web Locks entre pestañas; la idempotencia de
 * `registrar_novedad` por `id_local` es la red de seguridad (RNF-08).
 */

/**
 * Envía las pendientes del usuario (RF-22). Sin conexión, con otro ciclo en curso aquí o en otra
 * pestaña, no hace nada.
 *
 * @param {string} usuarioId
 */
export async function sincronizar(usuarioId) {
  if (leerSincronizacion().enCurso || !usuarioId || !estaEnLinea()) return
  cambiarSincronizacion({ enCurso: true, total: 0, hechas: 0, sesionVencida: false })
  try {
    if (navigator.locks?.request) {
      await navigator.locks.request('novedades-sincronizacion', { ifAvailable: true }, (lock) =>
        lock ? ciclo(usuarioId) : undefined,
      )
    } else {
      await ciclo(usuarioId)
    }
  } finally {
    cambiarSincronizacion({ enCurso: false, enviando: null })
  }
}

/**
 * «Reintentar» (una) y «Reintentar todo» (08, CU-23 3a): las con error vuelven a la cola.
 *
 * @param {string} usuarioId
 * @param {string} [idLocal] Sin él, todas.
 */
export async function reintentar(usuarioId, idLocal) {
  for (const p of await listarPendientes(usuarioId)) {
    if (p.envio === 'error' && (!idLocal || p.id_local === idLocal)) {
      await actualizarPendiente({ ...p, envio: 'pendiente' })
    }
  }
  return sincronizar(usuarioId)
}

/**
 * Los disparadores automáticos (decisión 5 del plan): al abrir la aplicación con sesión (también
 * después de volver a ingresar) y cada vez que el monitor de conexión pasa a «en línea».
 *
 * @param {string} usuarioId
 */
export function useSincronizacionAutomatica(usuarioId) {
  useEffect(() => {
    const intentar = () => {
      if (estaEnLinea()) sincronizar(usuarioId)
    }
    intentar()
    return suscribir(intentar)
  }, [usuarioId])
}

async function ciclo(usuarioId) {
  // Las que quedaron «enviando» (se cerró la aplicación a mitad) vuelven a la cola; el ciclo
  // automático no repite las que rechazó una regla de negocio: esas se reintentan a mano.
  const porEnviar = (await listarPendientes(usuarioId)).filter(
    (p) => p.envio !== 'error' || p.ultimo_error?.tipo === 'red',
  )
  if (porEnviar.length > 0) {
    const sesion = await confirmarSesion()
    if (sesion === 'red') return
    if (sesion === 'vencida') return cambiarSincronizacion({ sesionVencida: true })

    cambiarSincronizacion({ total: porEnviar.length })
    for (const p of porEnviar) {
      const intento = { ...p, envio: 'enviando', intentos: p.intentos + 1 }
      await actualizarPendiente(intento)
      cambiarSincronizacion({ enviando: p.id_local })
      try {
        const novedad = await registrarNovedad(p)
        await borrarPendiente(p.id_local)
        cambiarSincronizacion({
          enviadas: [...leerSincronizacion().enviadas, { ...p, codigo: novedad.codigo }],
          hechas: leerSincronizacion().hechas + 1,
        })
        await avisarCambioDePendientes()
      } catch (error) {
        const fallo = traducirError(error)
        if (fallo.tipo === 'sesion') {
          await actualizarPendiente({ ...p, envio: 'pendiente' })
          cambiarSincronizacion({ sesionVencida: true })
          break
        }
        await actualizarPendiente({ ...intento, envio: 'error', ultimo_error: fallo })
        cambiarSincronizacion({ hechas: leerSincronizacion().hechas + 1 })
        if (fallo.tipo === 'red') break
        // Puede que lo hayan desactivado o que ya no sea reportante: no se marca toda la cola.
        if (fallo.codigo === 'SIN_PERMISO') {
          pedirRevisionDelPerfil()
          break
        }
      }
    }
  }
  if ((await listarPendientes(usuarioId)).length === 0) {
    await guardarMeta('ultima_sincronizacion', new Date().toISOString())
  }
  await avisarCambioDePendientes()
}
