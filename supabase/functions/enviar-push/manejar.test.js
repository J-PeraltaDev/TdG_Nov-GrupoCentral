// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { manejar } from './manejar.js'

// Claves de ejemplo del RFC 8291 (apéndice A): válidas para cifrar y firmar en la prueba.
const SERVIDOR = {
  publica:
    'BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8',
  privada: 'yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw',
}
const NAVEGADOR = {
  p256dh: 'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4',
  auth: 'BTBZMqHH6r4Tts7J_aSIgg',
}

const AVISO = {
  id: '11111111-1111-4111-8111-111111111111',
  destinatario_id: '22222222-2222-4222-8222-222222222222',
  novedad_id: '33333333-3333-4333-8333-333333333333',
  estado_nuevo: 'en_atencion',
}

const suscripcion = (n) => ({
  id: `00000000-0000-4000-8000-00000000000${n}`,
  endpoint: `https://fcm.googleapis.com/fcm/send/dispositivo-${n}`,
  ...NAVEGADOR,
})

function dependencias({ estados = [201], suscripciones = [suscripcion(1)], ...otras } = {}) {
  const respuestas = [...estados]
  return {
    secreto: 'secreto-del-webhook',
    secretoRecibido: 'secreto-del-webhook',
    vapid: { sujeto: 'mailto:equipo@ejemplo.test', ...SERVIDOR },
    leerDestino: vi.fn(async () => ({
      novedad: { codigo: 153, area: 'Sistemas' },
      rol_id: 1,
      suscripciones,
    })),
    enviar: vi.fn(async () => {
      const estado = respuestas.shift()
      if (estado instanceof Error) throw estado
      return estado
    }),
    borrarSuscripcion: vi.fn(async () => {}),
    registrar: vi.fn(),
    ...otras,
  }
}

describe('enviar-push (RF-31 / CU-31, SDD 5.3.5)', () => {
  it('RF-31: sin el encabezado secreto o con otro, responde 401 y no lee ni envía nada', async () => {
    for (const secretoRecibido of [null, '', 'otro-secreto', 'secreto-del-webhook-y-algo-mas']) {
      const dep = dependencias({ secretoRecibido })
      expect(await manejar({ record: AVISO }, dep)).toEqual({
        estado: 401,
        cuerpo: { codigo: 'SIN_PERMISO' },
      })
      expect(dep.leerDestino).not.toHaveBeenCalled()
      expect(dep.enviar).not.toHaveBeenCalled()
    }
  })

  it('RF-31: sin el secreto configurado en la función, no acepta nada', async () => {
    const dep = dependencias({ secreto: '', secretoRecibido: '' })
    expect((await manejar({ record: AVISO }, dep)).estado).toBe(401)
  })

  it('RF-31: un aviso incompleto responde 400', async () => {
    const dep = dependencias()
    for (const record of [undefined, {}, { ...AVISO, destinatario_id: 'no' }]) {
      expect((await manejar({ record }, dep)).estado).toBe(400)
    }
    expect(dep.leerDestino).not.toHaveBeenCalled()
  })

  it('RF-31 / CU-31 2: envía a cada suscripción del destinatario, cifrado y firmado', async () => {
    const dep = dependencias({
      estados: [201, 201],
      suscripciones: [suscripcion(1), suscripcion(2)],
    })

    const resultado = await manejar({ record: AVISO }, dep)

    expect(resultado).toEqual({ estado: 200, cuerpo: { enviadas: 2, borradas: 0, fallidas: 0 } })
    expect(dep.leerDestino).toHaveBeenCalledWith(AVISO)
    const [url, opciones] = dep.enviar.mock.calls[0]
    expect(url).toBe('https://fcm.googleapis.com/fcm/send/dispositivo-1')
    expect(opciones.headers['Content-Encoding']).toBe('aes128gcm')
    expect(opciones.headers.Authorization).toMatch(/^vapid t=/)
  })

  it('RF-31: 404 o 410 borra esa suscripción y sigue con las demás', async () => {
    const dep = dependencias({
      estados: [410, 404, 201],
      suscripciones: [suscripcion(1), suscripcion(2), suscripcion(3)],
    })

    const { cuerpo } = await manejar({ record: AVISO }, dep)

    expect(cuerpo).toEqual({ enviadas: 1, borradas: 2, fallidas: 0 })
    expect(dep.borrarSuscripcion.mock.calls).toEqual([[suscripcion(1).id], [suscripcion(2).id]])
  })

  it('RF-31 / CU-31 2a: otro error o una falla de red va al log, sigue con las demás y responde 200', async () => {
    const dep = dependencias({
      estados: [500, new Error('connection reset'), 201],
      suscripciones: [suscripcion(1), suscripcion(2), suscripcion(3)],
    })

    const resultado = await manejar({ record: AVISO }, dep)

    expect(resultado).toEqual({ estado: 200, cuerpo: { enviadas: 1, borradas: 0, fallidas: 2 } })
    expect(dep.borrarSuscripcion).not.toHaveBeenCalled()
    expect(dep.registrar).toHaveBeenCalledTimes(2)
    // El log no lleva el punto de entrega: es la dirección privada del dispositivo.
    expect(JSON.stringify(dep.registrar.mock.calls)).not.toContain('dispositivo-')
  })

  it('seguridad: solo envía por https a los servicios push de los navegadores', async () => {
    const con = (endpoint, n) => ({ ...suscripcion(n), endpoint })
    const dep = dependencias({
      estados: [201, 201, 201, 201],
      suscripciones: [
        con('http://fcm.googleapis.com/fcm/send/x', 1),
        con('https://169.254.169.254/latest/meta-data', 2),
        con('https://fcm.googleapis.com.ejemplo.test/fcm/send/x', 3),
        con('no es una dirección', 4),
        con('https://updates.push.services.mozilla.com/wpush/v2/x', 5),
        con('https://web.push.apple.com/x', 6),
        con('https://wns2-par02p.notify.windows.com/w/?token=x', 7),
        suscripcion(8),
      ],
    })

    const { cuerpo } = await manejar({ record: AVISO }, dep)

    expect(cuerpo).toEqual({ enviadas: 4, borradas: 0, fallidas: 4 })
    expect(dep.enviar.mock.calls.map(([url]) => new URL(url).hostname)).toEqual([
      'updates.push.services.mozilla.com',
      'web.push.apple.com',
      'wns2-par02p.notify.windows.com',
      'fcm.googleapis.com',
    ])
    // Se conservan: no hay que borrar lo que no se intentó.
    expect(dep.borrarSuscripcion).not.toHaveBeenCalled()
    expect(dep.registrar).toHaveBeenCalledTimes(4)
  })

  it('RF-31: si no puede leer el destino, lo registra con el id del aviso y falla', async () => {
    const dep = dependencias({
      leerDestino: vi.fn(async () => Promise.reject(new Error('timeout'))),
    })

    await expect(manejar({ record: AVISO }, dep)).rejects.toThrow('timeout')
    expect(dep.registrar).toHaveBeenCalledWith(expect.stringContaining(AVISO.id))
    expect(dep.enviar).not.toHaveBeenCalled()
  })

  it('RF-31: sin suscripciones, responde 200 sin enviar nada', async () => {
    const dep = dependencias({ suscripciones: [] })
    expect(await manejar({ record: AVISO }, dep)).toEqual({
      estado: 200,
      cuerpo: { enviadas: 0, borradas: 0, fallidas: 0 },
    })
    expect(dep.enviar).not.toHaveBeenCalled()
  })
})
