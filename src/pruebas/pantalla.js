import { vi } from 'vitest'

/**
 * Simula el ancho de la pantalla para `useEsEscritorio`: jsdom no trae `matchMedia`, así que
 * sin esto las pruebas ven siempre el teléfono. Se deshace con `vi.unstubAllGlobals()`.
 *
 * @param {'telefono' | 'escritorio'} tipo
 */
export function simularPantalla(tipo) {
  vi.stubGlobal('matchMedia', (consulta) => ({
    matches: tipo === 'escritorio',
    media: consulta,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
}
