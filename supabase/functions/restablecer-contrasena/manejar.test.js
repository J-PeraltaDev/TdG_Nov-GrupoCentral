// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { manejar } from './manejar.js'
import { validarSolicitud } from './validar.js'

const SOLICITUD = {
  correo: 'persona@novedades.test',
  codigo: '482719',
  contrasena: 'Banano-4821',
}

const campos = (cuerpo) => {
  const resultado = validarSolicitud(cuerpo)
  return resultado.ok ? [] : resultado.campos
}

describe('restablecer-contrasena · forma de la solicitud (SDD, Tabla 23)', () => {
  it('RF-02 / CU-02 8: acepta correo, código de seis dígitos y contraseña', () => {
    expect(validarSolicitud({ ...SOLICITUD, correo: ' Persona@Novedades.TEST ' })).toEqual({
      ok: true,
      datos: { ...SOLICITUD },
    })
  })

  it('RF-02 / CU-02 8: acepta el código como lo muestra la pantalla 32, con un espacio', () => {
    expect(validarSolicitud({ ...SOLICITUD, codigo: '482 719' }).datos.codigo).toBe('482719')
  })

  it('señala cada dato que falta', () => {
    expect(campos({})).toEqual(['correo', 'codigo', 'contrasena'])
  })

  it.each([
    ['correo', 'sin-arroba'],
    ['correo', 42],
    ['codigo', '48271'],
    ['codigo', '4827190'],
    ['codigo', 'abcdef'],
    ['codigo', 482719],
    ['contrasena', 'corta1'],
    ['contrasena', 'sinnumeros'],
    ['contrasena', '12345678'],
  ])('rechaza %s = %j', (campo, valor) => {
    expect(campos({ ...SOLICITUD, [campo]: valor })).toEqual([campo])
  })
})

describe('restablecer-contrasena · contrato (Sprint 3, antes de implementar)', () => {
  it('una solicitud mal formada responde 400 con los campos, sin gastar el código', async () => {
    expect(await manejar({ ...SOLICITUD, contrasena: 'corta1' })).toEqual({
      estado: 400,
      cuerpo: { codigo: 'DATO_OBLIGATORIO', campos: ['contrasena'] },
    })
  })

  it('una solicitud bien formada responde 501 NO_IMPLEMENTADO', async () => {
    expect(await manejar(SOLICITUD)).toEqual({
      estado: 501,
      cuerpo: { codigo: 'NO_IMPLEMENTADO' },
    })
  })
})
