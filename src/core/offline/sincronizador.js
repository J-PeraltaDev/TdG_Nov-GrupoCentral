import { useSyncExternalStore } from 'react'
import { estaEnLinea } from '../conexion/monitor.js'
import { traducirError } from '../errores/traducir.js'
import { pedirRevisionDelPerfil } from '../sesion/perfilVigente.js'
import { confirmarSesion } from '../sesion/sesion.js'
import { registrarNovedad } from '../supabase/repositorios/novedades.js'
import { actualizarPendiente, borrarPendiente, guardarMeta, listarPendientes } from './bd.js'
import { avisarCambioDePendientes } from './pendientes.js'

/*
 * Sincronización de las pendientes (C-03, SDD 6.1.5 y Figura 18 · RF-22 / CU-22). Un solo ciclo
 * a la vez: bandera en la pestaña y Web Locks entre pestañas; la idempotencia de
 * `registrar_novedad` por `id_local` es la red de seguridad (RNF-08).
 */

/**
 * @typedef {object} EstadoDeSincronizacion
 * @property {boolean} enCurso
 * @property {number} total Las que este ciclo intenta enviar.
 * @property {Array<object & { codigo: number }>} enviadas Las que llegaron en esta visita (08).
 * @property {boolean} sesionVencida 08-B.
 */

/** @type {EstadoDeSincronizacion} */
let estado = { enCurso: false, total: 0, enviadas: [], sesionVencida: false }
const oyentes = new Set()

function cambiar(cambios) {
  estado = { ...estado, ...cambios }
  for (const oyente of oyentes) oyente()
}

export const leerSincronizacion = () => estado

/** @param {() => void} oyente */
export function suscribirSincronizacion(oyente) {
  oyentes.add(oyente)
  return () => oyentes.delete(oyente)
}

/** @returns {EstadoDeSincronizacion} */
export function useSincronizacion() {
  return useSyncExternalStore(suscribirSincronizacion, leerSincronizacion, leerSincronizacion)
}

/** Al salir de 08, las enviadas dejan de mostrarse: ya están en «Mis novedades». */
export const limpiarEnviadas = () => cambiar({ enviadas: [] })

/**
 * Envía las pendientes del usuario (RF-22). Sin conexión, con otro ciclo en curso aquí o en otra
 * pestaña, no hace nada.
 *
 * @param {string} usuarioId
 */
export async function sincronizar(usuarioId) {
  if (estado.enCurso || !usuarioId || !estaEnLinea()) return
  cambiar({ enCurso: true, total: 0, sesionVencida: false })
  try {
    if (navigator.locks?.request) {
      await navigator.locks.request('novedades-sincronizacion', { ifAvailable: true }, (lock) =>
        lock ? ciclo(usuarioId) : undefined,
      )
    } else {
      await ciclo(usuarioId)
    }
  } finally {
    cambiar({ enCurso: false })
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

async function ciclo(usuarioId) {
  // Las que quedaron «enviando» (se cerró la aplicación a mitad) vuelven a la cola; el ciclo
  // automático no repite las que rechazó una regla de negocio: esas se reintentan a mano.
  const porEnviar = (await listarPendientes(usuarioId)).filter(
    (p) => p.envio !== 'error' || p.ultimo_error?.tipo === 'red',
  )
  if (porEnviar.length > 0) {
    const sesion = await confirmarSesion()
    if (sesion === 'red') return
    if (sesion === 'vencida') return cambiar({ sesionVencida: true })

    cambiar({ total: porEnviar.length })
    for (const p of porEnviar) {
      const intento = { ...p, envio: 'enviando', intentos: p.intentos + 1 }
      await actualizarPendiente(intento)
      try {
        const novedad = await registrarNovedad(p)
        await borrarPendiente(p.id_local)
        cambiar({ enviadas: [...estado.enviadas, { ...p, codigo: novedad.codigo }] })
        await avisarCambioDePendientes()
      } catch (error) {
        const fallo = traducirError(error)
        if (fallo.tipo === 'sesion') {
          await actualizarPendiente({ ...p, envio: 'pendiente' })
          cambiar({ sesionVencida: true })
          break
        }
        await actualizarPendiente({ ...intento, envio: 'error', ultimo_error: fallo })
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
