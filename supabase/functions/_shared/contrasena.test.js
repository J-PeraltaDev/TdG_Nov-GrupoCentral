// @vitest-environment node
import { describe, expect, it } from 'vitest'
import * as delCliente from '../../../src/core/utils/contrasena.js'
import * as deLaFuncion from './contrasena.js'

/*
 * La regla de la contraseña (pantalla 03 de Figma: «Mínimo 8 caracteres» y «Al menos una letra
 * y un número») se valida en el navegador y otra vez en las Edge Functions, que no pueden
 * importar código de `src/`. Son dos copias: esta tabla las prueba a las dos y falla si alguna
 * se aparta de la otra.
 */
const CASOS = [
  ['Banano-4821', true],
  ['abcdefg1', true],
  ['1234567a', true],
  ['Ñandú2026', true],
  ['clave con espacios 1', true],
  ['a1'.repeat(36), true],
  ['abcdef1', false],
  ['abcdefgh', false],
  ['12345678', false],
  ['--------', false],
  ['', false],
  ['a1'.repeat(36) + 'x', false],
  [null, false],
  [undefined, false],
  [12345678, false],
]

describe.each([
  ['la Edge Function', deLaFuncion],
  ['el cliente', delCliente],
])('Regla de la contraseña en %s (RF-02 / CU-02 8, RF-03)', (_, modulo) => {
  it.each(CASOS)('%j → %s', (contrasena, esperado) => {
    expect(modulo.esContrasenaValida(contrasena)).toBe(esperado)
  })

  it('dice cuál de las dos reglas se cumple, para pintarlas en la pantalla 03', () => {
    expect(modulo.reglasDeContrasena('abcdefgh')).toEqual({ longitud: true, letraYNumero: false })
    expect(modulo.reglasDeContrasena('a1')).toEqual({ longitud: false, letraYNumero: true })
    expect(modulo.reglasDeContrasena('')).toEqual({ longitud: false, letraYNumero: false })
  })

  it('usa los mismos límites', () => {
    expect(modulo.CONTRASENA_MIN_CARACTERES).toBe(8)
    expect(modulo.CONTRASENA_MAX_CARACTERES).toBe(72)
  })
})

describe('Las dos copias de la regla', () => {
  it('son el mismo código', () => {
    expect(String(deLaFuncion.esContrasenaValida)).toBe(String(delCliente.esContrasenaValida))
    expect(String(deLaFuncion.reglasDeContrasena)).toBe(String(delCliente.reglasDeContrasena))
  })
})
