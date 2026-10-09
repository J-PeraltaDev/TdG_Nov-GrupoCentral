import { useSyncExternalStore } from 'react'

/** El punto de quiebre `lg` de Tailwind: desde aquí la interfaz es la del escritorio. */
const CONSULTA = '(min-width: 64rem)'

function suscribir(avisar) {
  const consulta = window.matchMedia?.(CONSULTA)
  consulta?.addEventListener('change', avisar)
  return () => consulta?.removeEventListener('change', avisar)
}

const esEscritorio = () => window.matchMedia?.(CONSULTA).matches === true

/**
 * Indica si la pantalla tiene el ancho del escritorio (`lg`). Es para cuando el teléfono y el
 * escritorio no comparten estructura (tarjetas y tabla, por ejemplo): se pinta una sola, no las
 * dos. Lo que solo cambia de estilo se resuelve con las variantes `lg:` de Tailwind.
 */
export function useEsEscritorio() {
  return useSyncExternalStore(suscribir, esEscritorio)
}
