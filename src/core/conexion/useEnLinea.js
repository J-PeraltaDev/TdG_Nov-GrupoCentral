import { useSyncExternalStore } from 'react'
import { estaEnLinea, suscribir } from './monitor.js'

/**
 * Indica si hay conexión, según el monitor único (SDD 6.1.5, RF-23): lo que dice el navegador
 * más los fallos de red de las solicitudes y la verificación periódica (`monitor.js`).
 *
 * @returns {boolean}
 */
export function useEnLinea() {
  return useSyncExternalStore(suscribir, estaEnLinea, () => true)
}
