import { vi } from 'vitest'

/**
 * Simula el ancho de la pantalla para `useEsEscritorio`: jsdom no trae `matchMedia`, así que
 * sin esto las pruebas ven siempre el teléfono. Se deshace con `vi.unstubAllGlobals()`.
 *
 * @param {'telefono' | 'escritorio'} tipo
 */
export function simularPantalla(tipo) {
  vi.stubGlobal('matchMedia', (consulta) => ({
    // Solo el ancho: otras consultas, como la de la app instalada (`display-mode`), no coinciden.
    matches: tipo === 'escritorio' && consulta.includes('min-width'),
    media: consulta,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
}
