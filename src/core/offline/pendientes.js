import { useSyncExternalStore } from 'react'
import { contarPendientes } from './bd.js'

/*
 * Contador de las novedades pendientes de sincronizar del usuario (RF-23 / CU-23 3 y 4). Lo
 * muestra el indicador de conexión en todas las barras; se recalcula cuando cambia la cola en
 * esta pestaña o en otra (`BroadcastChannel`).
 */

export const CANAL_DE_PENDIENTES = 'novedades-pendientes'

let usuario = null
let cantidad = 0
const oyentes = new Set()
const canal =
  typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(CANAL_DE_PENDIENTES)
canal?.addEventListener('message', () => recalcular())

async function recalcular() {
  const nueva = await contarPendientes(usuario).catch(() => cantidad)
  if (nueva === cantidad) return
  cantidad = nueva
  for (const oyente of oyentes) oyente()
}

/**
 * Empieza a contar las pendientes de este usuario (o ninguna, sin sesión).
 *
 * @param {string | null} usuarioId
 */
export function vigilarPendientes(usuarioId) {
  usuario = usuarioId
  return recalcular()
}

/** La cola cambió en esta pestaña: se recalcula aquí y se avisa a las demás. */
export function avisarCambioDePendientes() {
  canal?.postMessage('cambio')
  return recalcular()
}

export const leerPendientes = () => cantidad

/** @param {() => void} oyente */
export function suscribirPendientes(oyente) {
  oyentes.add(oyente)
  return () => oyentes.delete(oyente)
}

/** @returns {number} */
export function usePendientes() {
  return useSyncExternalStore(suscribirPendientes, leerPendientes, () => 0)
}
