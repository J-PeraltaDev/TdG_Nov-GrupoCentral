// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  aBase64Url,
  cifrar,
  deBase64Url,
  encabezadoVapid,
  importarParEcdh,
  solicitudDePush,
} from './webpush.js'

const sutil = globalThis.crypto.subtle
const texto = new TextEncoder()

// RFC 8291, apéndice A: los valores intermedios del cifrado de un mensaje de ejemplo.
const RFC = {
  contenido: 'V2hlbiBJIGdyb3cgdXAsIEkgd2FudCB0byBiZSBhIHdhdGVybWVsb24',
  servidorPublica:
    'BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8',
  servidorPrivada: 'yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw',
  navegadorPublica:
    'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4',
  navegadorPrivada: 'q1dXpw3UpT5VOmu_cf_v6ih07Aems3njxI-JWgLcM94',
  auth: 'BTBZMqHH6r4Tts7J_aSIgg',
  sal: 'DGv6ra1nlYgDCS1FRnbzlw',
  cabecera:
    'DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8',
  cifrado: '8pfeW0KbunFT06SuDKoJH9Ql87S1QUrdirN6GcG7sFz1y1sqLgVi1VhjVkHsUoEsbI_0LpXMuGvnzQ',
}

/** Descifra como lo haría el navegador (RFC 8291, sección 3.4), para probar el camino al azar. */
async function descifrar(cuerpo, { navegadorPrivada, navegadorPublica, auth }) {
  const sal = cuerpo.slice(0, 16)
  const largo = cuerpo[20]
  const servidorPublica = cuerpo.slice(21, 21 + largo)
  const { privateKey } = await importarParEcdh(navegadorPrivada, navegadorPublica)
  const servidor = await sutil.importKey(
    'raw',
    servidorPublica,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    [],
  )
  const ecdh = await sutil.deriveBits({ name: 'ECDH', public: servidor }, privateKey, 256)
  const hkdf = async (salt, ikm, info, bytes) =>
    new Uint8Array(
      await sutil.deriveBits(
        { name: 'HKDF', hash: 'SHA-256', salt, info },
        await sutil.importKey('raw', ikm, 'HKDF', false, ['deriveBits']),
        bytes * 8,
      ),
    )
  const info = new Uint8Array([
    ...texto.encode('WebPush: info\u0000'),
    ...deBase64Url(navegadorPublica),
    ...servidorPublica,
  ])
  const ikm = await hkdf(deBase64Url(auth), ecdh, info, 32)
  const cek = await hkdf(sal, ikm, texto.encode('Content-Encoding: aes128gcm\u0000'), 16)
  const nonce = await hkdf(sal, ikm, texto.encode('Content-Encoding: nonce\u0000'), 12)
  const clave = await sutil.importKey('raw', cek, 'AES-GCM', false, ['decrypt'])
  const claro = new Uint8Array(
    await sutil.decrypt({ name: 'AES-GCM', iv: nonce }, clave, cuerpo.slice(21 + largo)),
  )
  expect(claro.at(-1)).toBe(2)
  return new TextDecoder().decode(claro.slice(0, -1))
}

describe('Web Push con Web Crypto (RF-31, RFC 8291 y RFC 8292)', () => {
  it('RF-31: base64url va y vuelve sin relleno', () => {
    const bytes = Uint8Array.from([0, 251, 255, 62, 63, 1])
    expect(aBase64Url(bytes)).toBe('APv_Pj8B')
    expect(deBase64Url('APv_Pj8B')).toEqual(bytes)
  })

  it('RF-31 / RFC 8291 apéndice A: con la sal y la clave del ejemplo, da el mismo cuerpo cifrado', async () => {
    const cuerpo = await cifrar(
      { p256dh: RFC.navegadorPublica, auth: RFC.auth },
      deBase64Url(RFC.contenido),
      {
        sal: deBase64Url(RFC.sal),
        par: await importarParEcdh(RFC.servidorPrivada, RFC.servidorPublica),
      },
    )

    expect(aBase64Url(cuerpo.slice(0, 86))).toBe(RFC.cabecera)
    expect(aBase64Url(cuerpo.slice(86))).toBe(RFC.cifrado)
  })

  it('RF-31: con una sal y una clave al azar, el navegador lo descifra', async () => {
    const mensaje = JSON.stringify({ titulo: 'NOV-0153 · Asignada', cuerpo: 'Tíldes y ñ.' })
    const cuerpo = await cifrar(
      { p256dh: RFC.navegadorPublica, auth: RFC.auth },
      texto.encode(mensaje),
    )

    expect(cuerpo.slice(0, 16)).not.toEqual(deBase64Url(RFC.sal))
    expect(await descifrar(cuerpo, RFC)).toBe(mensaje)
  })

  it('RF-31: un mensaje que no cabe en un registro de 4096 bytes no se cifra', async () => {
    await expect(
      cifrar({ p256dh: RFC.navegadorPublica, auth: RFC.auth }, new Uint8Array(4000)),
    ).rejects.toThrow('MENSAJE_DEMASIADO_LARGO')
  })

  it('RF-31 / RFC 8292: la firma VAPID lleva el origen del servicio, vence en menos de 24 h y se verifica con la clave pública', async () => {
    const ahora = Date.UTC(2026, 9, 17, 20, 0, 0)
    const encabezado = await encabezadoVapid({
      endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
      sujeto: 'mailto:equipo@ejemplo.test',
      publica: RFC.servidorPublica,
      privada: RFC.servidorPrivada,
      ahora,
    })

    const [, jwt, k] = /^vapid t=([^,]+), k=(.+)$/.exec(encabezado)
    expect(k).toBe(RFC.servidorPublica)
    const [cabecera, datos, firma] = jwt.split('.')
    expect(JSON.parse(new TextDecoder().decode(deBase64Url(cabecera)))).toEqual({
      typ: 'JWT',
      alg: 'ES256',
    })
    const reclamos = JSON.parse(new TextDecoder().decode(deBase64Url(datos)))
    expect(reclamos.aud).toBe('https://fcm.googleapis.com')
    expect(reclamos.sub).toBe('mailto:equipo@ejemplo.test')
    expect(reclamos.exp * 1000).toBeGreaterThan(ahora)
    expect(reclamos.exp * 1000 - ahora).toBeLessThanOrEqual(24 * 3_600_000)

    const publica = await sutil.importKey(
      'raw',
      deBase64Url(RFC.servidorPublica),
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['verify'],
    )
    const valida = await sutil.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      publica,
      deBase64Url(firma),
      texto.encode(`${cabecera}.${datos}`),
    )
    expect(valida).toBe(true)
  })

  it('RF-31: la solicitud al servicio push lleva el cuerpo cifrado, aes128gcm, TTL y la firma', async () => {
    const { url, opciones } = await solicitudDePush({
      suscripcion: {
        endpoint: 'https://web.push.apple.com/QGuQyavXutnMH',
        p256dh: RFC.navegadorPublica,
        auth: RFC.auth,
      },
      mensaje: { titulo: 'NOV-0153 · Asignada', cuerpo: 'Prueba', url: '/novedades/1' },
      vapid: {
        sujeto: 'mailto:equipo@ejemplo.test',
        publica: RFC.servidorPublica,
        privada: RFC.servidorPrivada,
      },
    })

    expect(url).toBe('https://web.push.apple.com/QGuQyavXutnMH')
    expect(opciones.method).toBe('POST')
    expect(opciones.headers).toMatchObject({
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      TTL: '86400',
      Urgency: 'normal',
    })
    expect(opciones.headers.Authorization).toMatch(/^vapid t=.+, k=/)
    expect(JSON.parse(await descifrar(opciones.body, RFC))).toEqual({
      titulo: 'NOV-0153 · Asignada',
      cuerpo: 'Prueba',
      url: '/novedades/1',
    })
  })
})
