// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { atender, fallo, tokenDe } from './servir.js'

const ORIGEN = 'http://localhost:5173'
const URL_FUNCION = 'https://proyecto.supabase.co/functions/v1/una-funcion'

function peticion({ metodo = 'POST', cuerpo, origen = ORIGEN, cabeceras = {} } = {}) {
  return new Request(URL_FUNCION, {
    method: metodo,
    headers: { ...(origen ? { Origin: origen } : {}), ...cabeceras },
    body: cuerpo === undefined ? undefined : cuerpo,
  })
}

describe('Atención de una petición en una Edge Function', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('responde la consulta previa del navegador sin llamar al manejador', async () => {
    const manejar = vi.fn()
    const respuesta = await atender(peticion({ metodo: 'OPTIONS' }), manejar)

    expect(respuesta.status).toBe(204)
    expect(respuesta.headers.get('Access-Control-Allow-Origin')).toBe(ORIGEN)
    expect(manejar).not.toHaveBeenCalled()
  })

  it('a un origen ajeno no le devuelve permiso, ni en la consulta previa', async () => {
    const respuesta = await atender(
      peticion({ metodo: 'OPTIONS', origen: 'https://otro-sitio.example' }),
      vi.fn(),
    )

    expect(respuesta.headers.get('Access-Control-Allow-Origin')).toBeNull()
  })

  it('solo admite POST', async () => {
    const manejar = vi.fn()
    const respuesta = await atender(peticion({ metodo: 'GET' }), manejar)

    expect(respuesta.status).toBe(405)
    expect(await respuesta.json()).toEqual({ codigo: 'METODO_NO_PERMITIDO' })
    expect(manejar).not.toHaveBeenCalled()
  })

  it.each([['texto que no es JSON'], ['[1, 2]'], ['"texto"'], ['null']])(
    'un cuerpo que no es un objeto JSON responde 400: %s',
    async (cuerpo) => {
      const manejar = vi.fn()
      const respuesta = await atender(peticion({ cuerpo }), manejar)

      expect(respuesta.status).toBe(400)
      expect(await respuesta.json()).toEqual({ codigo: 'DATO_OBLIGATORIO', campos: ['cuerpo'] })
      expect(manejar).not.toHaveBeenCalled()
    },
  )

  it('entrega al manejador el cuerpo y devuelve su resultado con las cabeceras CORS', async () => {
    const manejar = vi.fn().mockResolvedValue({ estado: 200, cuerpo: { ok: true } })
    const original = peticion({ cuerpo: JSON.stringify({ accion: 'crear' }) })
    const respuesta = await atender(original, manejar)

    expect(manejar).toHaveBeenCalledWith({ accion: 'crear' }, original)
    expect(respuesta.status).toBe(200)
    expect(await respuesta.json()).toEqual({ ok: true })
    expect(respuesta.headers.get('Content-Type')).toMatch(/^application\/json/)
    expect(respuesta.headers.get('Cache-Control')).toBe('no-store')
    expect(respuesta.headers.get('Access-Control-Allow-Origin')).toBe(ORIGEN)
  })

  it('si el manejador falla responde 500 sin detalles y no registra el cuerpo', async () => {
    const registro = vi.spyOn(console, 'error').mockImplementation(() => {})
    const secreto = 'una-contrasena-secreta-1'
    const manejar = vi.fn().mockRejectedValue(new Error(`falló con ${secreto}`))
    const respuesta = await atender(
      peticion({ cuerpo: JSON.stringify({ contrasena: secreto }) }),
      manejar,
    )

    expect(respuesta.status).toBe(500)
    expect(await respuesta.json()).toEqual({ codigo: 'ERROR' })
    expect(JSON.stringify(registro.mock.calls)).not.toContain(secreto)
  })

  it('fallo() arma el cuerpo del error, con los campos solo si los hay', () => {
    expect(fallo(403, 'SIN_PERMISO')).toEqual({ estado: 403, cuerpo: { codigo: 'SIN_PERMISO' } })
    expect(fallo(400, 'DATO_OBLIGATORIO', ['nombre'])).toEqual({
      estado: 400,
      cuerpo: { codigo: 'DATO_OBLIGATORIO', campos: ['nombre'] },
    })
    expect(fallo(400, 'DATO_OBLIGATORIO', [])).toEqual({
      estado: 400,
      cuerpo: { codigo: 'DATO_OBLIGATORIO' },
    })
  })

  it('tokenDe() saca el token de la cabecera Authorization', () => {
    expect(tokenDe(peticion({ cabeceras: { Authorization: 'Bearer abc.def.ghi' } }))).toBe(
      'abc.def.ghi',
    )
    expect(tokenDe(peticion({ cabeceras: { Authorization: 'bearer abc.def.ghi' } }))).toBe(
      'abc.def.ghi',
    )
    expect(tokenDe(peticion({ cabeceras: { Authorization: 'Basic abc' } }))).toBeNull()
    expect(tokenDe(peticion())).toBeNull()
  })
})
