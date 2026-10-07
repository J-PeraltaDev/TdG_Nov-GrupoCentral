// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8')

/** @type {Record<string, string>} */
const colores = Object.fromEntries(
  [...css.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-f]{6});/g)].map(([, nombre, valor]) => [
    nombre,
    valor,
  ]),
)

const estilosDeTexto = [...css.matchAll(/--text-([a-z]+(?:-[a-z]+)*):/g)].map(([, n]) => n)

/** Luminancia relativa (WCAG 2.2). */
function luminancia(hex) {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contraste(a, b) {
  const [claro, oscuro] = [luminancia(colores[a]), luminancia(colores[b])].sort((x, y) => y - x)
  return (claro + 0.05) / (oscuro + 0.05)
}

describe('Tokens de diseño (Figma, nodo 1:63)', () => {
  it('tiene las 47 variables de color de Figma', () => {
    expect(Object.keys(colores)).toHaveLength(47)
    expect(colores.primario).toBe('#1e6b3a')
    expect(colores['area-mantenimiento']).toBe('#a85f12')
    expect(colores['area-sistemas']).toBe('#3b5bdb')
  })

  it('tiene los 12 estilos de texto de Figma', () => {
    expect(estilosDeTexto.toSorted()).toEqual([
      'auxiliar',
      'auxiliar-fuerte',
      'codigo',
      'cuerpo',
      'cuerpo-fuerte',
      'cuerpo-pequeno',
      'display',
      'etiqueta',
      'etiqueta-fuerte',
      'indicador',
      'subtitulo',
      'titulo',
    ])
  })

  // WCAG 1.4.3: 4,5:1 para el texto normal.
  it.each([
    'registrada',
    'asignada',
    'atencion',
    'aprobada',
    'rechazada',
    'resuelta',
    'cerrada',
    'pendiente',
  ])('estado %s: el texto contrasta al menos 4,5:1 con su fondo', (estado) => {
    expect(contraste(`estado-${estado}-texto`, `estado-${estado}-fondo`)).toBeGreaterThanOrEqual(
      4.5,
    )
  })

  // Hallazgo del Sprint 0: en Figma, «escalada» da 4,42:1. El valor no se cambia aquí
  // porque el diseño se corrige primero en Figma (docs/decisiones-pendientes.md, punto 6).
  // Cuando se ajuste el token, esta prueba fallará: pásala entonces a la lista de arriba.
  it.fails('estado escalada: el texto contrasta al menos 4,5:1 con su fondo', () => {
    expect(contraste('estado-escalada-texto', 'estado-escalada-fondo')).toBeGreaterThanOrEqual(4.5)
  })

  it.each(['critico', 'alto', 'normal', 'bajo'])(
    'prioridad %s: el texto blanco contrasta al menos 4,5:1 con su fondo',
    (prioridad) => {
      expect(contraste('sobre-primario', `prioridad-${prioridad}`)).toBeGreaterThanOrEqual(4.5)
    },
  )

  it.each([
    ['texto', 'superficie'],
    ['texto', 'fondo'],
    ['texto-secundario', 'superficie'],
    ['texto-secundario', 'fondo'],
    ['sobre-primario', 'primario'],
    ['sobre-primario', 'primario-hover'],
    ['sobre-primario', 'error'],
    ['primario', 'superficie'],
    ['primario', 'fondo'],
    ['error', 'superficie'],
    ['error', 'error-suave'],
    ['advertencia', 'advertencia-suave'],
    ['info', 'info-suave'],
  ])('%s sobre %s contrasta al menos 4,5:1', (texto, fondo) => {
    expect(contraste(texto, fondo)).toBeGreaterThanOrEqual(4.5)
  })
})
