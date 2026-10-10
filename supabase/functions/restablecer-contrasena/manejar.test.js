// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { atender } from '../_shared/servir.js'
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

/** Las dependencias de la función, simuladas: la base de datos responde `resultado`. */
function simular(resultado = 'OK', usuarioId = resultado === 'OK' ? 'u-1' : null) {
  return {
    consumirCodigo: vi.fn().mockResolvedValue({ resultado, usuarioId }),
    fijarContrasena: vi.fn().mockResolvedValue(undefined),
  }
}

afterEach(() => vi.restoreAllMocks())

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

describe('restablecer-contrasena · el código y la contraseña (SDD 6.1.10)', () => {
  it('RF-02 / CU-02 8: una solicitud mal formada responde 400 con los campos, sin gastar el código', async () => {
    const dependencias = simular()

    expect(await manejar({ ...SOLICITUD, contrasena: 'corta1' }, dependencias)).toEqual({
      estado: 400,
      cuerpo: { codigo: 'DATO_OBLIGATORIO', campos: ['contrasena'] },
    })
    expect(dependencias.consumirCodigo).not.toHaveBeenCalled()
    expect(dependencias.fijarContrasena).not.toHaveBeenCalled()
  })

  it('RF-02 / CU-02 9: con el código correcto fija la contraseña del usuario y responde 200', async () => {
    const dependencias = simular('OK', 'u-7')

    expect(await manejar(SOLICITUD, dependencias)).toEqual({ estado: 200, cuerpo: { ok: true } })
    expect(dependencias.consumirCodigo).toHaveBeenCalledExactlyOnceWith(
      'persona@novedades.test',
      '482719',
    )
    expect(dependencias.fijarContrasena).toHaveBeenCalledExactlyOnceWith('u-7', 'Banano-4821')
  })

  it('RF-02 / CU-02 9: consume el código con el correo normalizado y el código sin espacios', async () => {
    const dependencias = simular()

    await manejar(
      { ...SOLICITUD, correo: ' Persona@Novedades.TEST ', codigo: '482 719' },
      dependencias,
    )

    expect(dependencias.consumirCodigo).toHaveBeenCalledWith('persona@novedades.test', '482719')
  })

  it('RF-02 / CU-02 9: gasta el código antes de cambiar la contraseña', async () => {
    const orden = []
    const dependencias = {
      consumirCodigo: vi.fn(async () => {
        orden.push('consumir')
        return { resultado: 'OK', usuarioId: 'u-1' }
      }),
      fijarContrasena: vi.fn(async () => {
        orden.push('fijar')
      }),
    }

    await manejar(SOLICITUD, dependencias)

    expect(orden).toEqual(['consumir', 'fijar'])
  })

  it.each(['CODIGO_INVALIDO', 'CODIGO_VENCIDO'])(
    'RF-02 / CU-02 9a y 9b: %s responde 400 con ese código y no toca la contraseña',
    async (codigo) => {
      const dependencias = simular(codigo)

      expect(await manejar(SOLICITUD, dependencias)).toEqual({ estado: 400, cuerpo: { codigo } })
      expect(dependencias.fijarContrasena).not.toHaveBeenCalled()
    },
  )

  it.each([
    ['un resultado que no conoce', 'OTRA_COSA', 'u-1'],
    ['ningún resultado', null, null],
    ['un OK sin usuario', 'OK', null],
  ])('con %s responde 500 y no toca la contraseña', async (_caso, resultado, usuarioId) => {
    const dependencias = simular(resultado, usuarioId)

    expect(await manejar(SOLICITUD, dependencias)).toEqual({
      estado: 500,
      cuerpo: { codigo: 'ERROR' },
    })
    expect(dependencias.fijarContrasena).not.toHaveBeenCalled()
  })
})

describe('restablecer-contrasena · lo que falla y lo que se registra (RNF-11)', () => {
  const peticion = (cuerpo = SOLICITUD) =>
    new Request('https://proyecto.supabase.co/functions/v1/restablecer-contrasena', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cuerpo),
    })

  /** Todo lo que la función escribió en el registro, por cualquier nivel. */
  function espiarRegistro() {
    const espias = ['log', 'info', 'warn', 'error', 'debug'].map((nivel) =>
      vi.spyOn(console, nivel).mockImplementation(() => {}),
    )
    return () => JSON.stringify(espias.flatMap((espia) => espia.mock.calls))
  }

  it('RF-02 / CU-02 9: si Auth no cambia la contraseña responde 500, sin detalles', async () => {
    const registro = espiarRegistro()
    const dependencias = simular()
    dependencias.fijarContrasena.mockRejectedValue(
      new Error(`No se pudo guardar ${SOLICITUD.contrasena} de ${SOLICITUD.correo}`),
    )

    const respuesta = await atender(peticion(), (cuerpo) => manejar(cuerpo, dependencias))

    expect(respuesta.status).toBe(500)
    expect(await respuesta.json()).toEqual({ codigo: 'ERROR' })
    expect(registro()).not.toContain(SOLICITUD.contrasena)
    expect(registro()).not.toContain(SOLICITUD.correo)
  })

  it('RF-02: si la base de datos falla al consumir el código responde 500 y no cambia nada', async () => {
    const registro = espiarRegistro()
    const dependencias = simular()
    dependencias.consumirCodigo.mockRejectedValue(new Error(`falló con ${SOLICITUD.codigo}`))

    const respuesta = await atender(peticion(), (cuerpo) => manejar(cuerpo, dependencias))

    expect(respuesta.status).toBe(500)
    expect(dependencias.fijarContrasena).not.toHaveBeenCalled()
    expect(registro()).not.toContain(SOLICITUD.codigo)
  })

  it.each([
    ['todo sale bien', 'OK'],
    ['el código no es válido', 'CODIGO_INVALIDO'],
    ['el código venció', 'CODIGO_VENCIDO'],
  ])(
    'RNF-11: cuando %s, ni el correo, ni el código, ni la contraseña van al registro ni vuelven en la respuesta',
    async (_caso, resultado) => {
      const registro = espiarRegistro()

      const respuesta = await atender(peticion(), (cuerpo) => manejar(cuerpo, simular(resultado)))
      const texto = await respuesta.text()

      for (const secreto of Object.values(SOLICITUD)) {
        expect(registro()).not.toContain(secreto)
        expect(texto).not.toContain(secreto)
      }
    },
  )
})
