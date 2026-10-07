import { useSyncExternalStore } from 'react'

function suscribir(alCambiar) {
  window.addEventListener('online', alCambiar)
  window.addEventListener('offline', alCambiar)
  return () => {
    window.removeEventListener('online', alCambiar)
    window.removeEventListener('offline', alCambiar)
  }
}

/**
 * Indica si el navegador reporta conexión (eventos `online` y `offline`, SDD 5.3.6).
 *
 * Sprint 0: solo lo que informa el navegador. El Sprint 1 le suma la detección de fallos de
 * red en las solicitudes y el Sprint 4, el monitor completo (SDD 6.1.5).
 *
 * @returns {boolean}
 */
export function useEnLinea() {
  return useSyncExternalStore(
    suscribir,
    () => navigator.onLine,
    () => true,
  )
}
