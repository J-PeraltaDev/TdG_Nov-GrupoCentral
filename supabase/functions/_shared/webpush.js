/*
 * Web Push sin librerías (RF-31; plan del Sprint 5, decisión 43): el cuerpo cifrado con
 * aes128gcm (RFC 8291) y la firma VAPID (RFC 8292), con Web Crypto. Módulo puro: corre igual en
 * Deno (enviar-push) y en Node (Vitest), como pide docs/adr/0012.
 *
 * Las claves van en base64url, como las entrega el navegador en la suscripción (p256dh y auth) y
 * como las genera scripts/vapid.mjs: la pública, el punto P-256 sin comprimir (65 bytes); la
 * privada, el escalar `d` (32 bytes).
 */

const sutil = globalThis.crypto.subtle
const texto = new TextEncoder()
const P256 = { name: 'ECDH', namedCurve: 'P-256' }

/** Registro único de 4096 bytes: alcanza para un aviso y es lo que admiten todos los servicios. */
const TAMANO_DE_REGISTRO = 4096
// Lo que ocupan la cabecera (86), el delimitador (1) y la etiqueta de AES-GCM (16).
const MAXIMO_DEL_MENSAJE = TAMANO_DE_REGISTRO - 86 - 1 - 16

/** @param {Uint8Array} bytes */
export function aBase64Url(bytes) {
  let binario = ''
  for (const byte of bytes) binario += String.fromCharCode(byte)
  return btoa(binario).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

/** @param {string} cadena */
export function deBase64Url(cadena) {
  const base64 = cadena.replaceAll('-', '+').replaceAll('_', '/')
  const binario = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4))
  return Uint8Array.from(binario, (letra) => letra.charCodeAt(0))
}

/** @param {...ArrayLike<number>} partes */
function unir(...partes) {
  const todo = new Uint8Array(partes.reduce((suma, parte) => suma + parte.length, 0))
  let desde = 0
  for (const parte of partes) {
    todo.set(parte, desde)
    desde += parte.length
  }
  return todo
}

/** JWK de una clave P-256 a partir de la privada (`d`) y la pública sin comprimir. */
function jwk(privada, publica) {
  const punto = deBase64Url(publica)
  const x = aBase64Url(punto.slice(1, 33))
  const y = aBase64Url(punto.slice(33, 65))
  return { kty: 'EC', crv: 'P-256', d: privada, x, y, ext: true }
}

/**
 * Par ECDH a partir de claves conocidas. El cifrado usa uno nuevo en cada mensaje; este sirve
 * para reproducir el ejemplo del RFC 8291.
 *
 * @param {string} privada
 * @param {string} publica
 */
export async function importarParEcdh(privada, publica) {
  const privateKey = await sutil.importKey('jwk', jwk(privada, publica), P256, false, [
    'deriveBits',
  ])
  return { privateKey, publica: deBase64Url(publica) }
}

async function hkdf(sal, ikm, info, bytes) {
  const clave = await sutil.importKey('raw', ikm, 'HKDF', false, ['deriveBits'])
  const bits = await sutil.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: sal, info },
    clave,
    bytes * 8,
  )
  return new Uint8Array(bits)
}

/**
 * Cifra el mensaje para una suscripción (RFC 8291 y RFC 8188, un solo registro).
 *
 * @param {{ p256dh: string, auth: string }} claves De la suscripción del navegador.
 * @param {Uint8Array} mensaje
 * @param {{ sal?: Uint8Array, par?: { privateKey: CryptoKey, publica: Uint8Array } }} [fijos]
 *   Solo para las pruebas: la sal y el par del servidor salen al azar en cada mensaje.
 * @returns {Promise<Uint8Array>} El cuerpo: cabecera, clave pública del servidor y cifrado.
 */
export async function cifrar({ p256dh, auth }, mensaje, fijos = {}) {
  if (mensaje.length > MAXIMO_DEL_MENSAJE) throw new Error('MENSAJE_DEMASIADO_LARGO')

  const sal = fijos.sal ?? globalThis.crypto.getRandomValues(new Uint8Array(16))
  let par = fijos.par
  if (!par) {
    const nuevo = await sutil.generateKey(P256, true, ['deriveBits'])
    par = {
      privateKey: nuevo.privateKey,
      publica: new Uint8Array(await sutil.exportKey('raw', nuevo.publicKey)),
    }
  }

  const delNavegador = deBase64Url(p256dh)
  const navegador = await sutil.importKey('raw', delNavegador, P256, false, [])
  const ecdh = await sutil.deriveBits({ name: 'ECDH', public: navegador }, par.privateKey, 256)

  const info = unir(texto.encode('WebPush: info\u0000'), delNavegador, par.publica)
  const ikm = await hkdf(deBase64Url(auth), ecdh, info, 32)
  const cek = await hkdf(sal, ikm, texto.encode('Content-Encoding: aes128gcm\u0000'), 16)
  const nonce = await hkdf(sal, ikm, texto.encode('Content-Encoding: nonce\u0000'), 12)

  const clave = await sutil.importKey('raw', cek, 'AES-GCM', false, ['encrypt'])
  // El 2 marca el último (y único) registro (RFC 8188).
  const cifrado = await sutil.encrypt({ name: 'AES-GCM', iv: nonce }, clave, unir(mensaje, [2]))

  const cabecera = new Uint8Array(21)
  cabecera.set(sal)
  new DataView(cabecera.buffer).setUint32(16, TAMANO_DE_REGISTRO)
  cabecera[20] = par.publica.length
  return unir(cabecera, par.publica, new Uint8Array(cifrado))
}

/**
 * Encabezado `Authorization` de VAPID (RFC 8292): un JWT ES256 para el origen del servicio push,
 * que vence en 12 horas (el máximo es 24), y la clave pública del servidor.
 *
 * @param {{ endpoint: string, sujeto: string, publica: string, privada: string, ahora?: number }} datos
 */
export async function encabezadoVapid({ endpoint, sujeto, publica, privada, ahora = Date.now() }) {
  const json = (objeto) => aBase64Url(texto.encode(JSON.stringify(objeto)))
  const cabecera = json({ typ: 'JWT', alg: 'ES256' })
  const reclamos = json({
    aud: new URL(endpoint).origin,
    exp: Math.floor(ahora / 1000) + 12 * 3600,
    sub: sujeto,
  })
  const clave = await sutil.importKey(
    'jwk',
    jwk(privada, publica),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  )
  // Web Crypto firma en el formato de JOSE (r y s concatenados), el que pide ES256.
  const firma = await sutil.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    clave,
    texto.encode(`${cabecera}.${reclamos}`),
  )
  return `vapid t=${cabecera}.${reclamos}.${aBase64Url(new Uint8Array(firma))}, k=${publica}`
}

/**
 * La solicitud al servicio push del navegador para una suscripción (RFC 8030).
 *
 * @param {object} datos
 * @param {{ endpoint: string, p256dh: string, auth: string }} datos.suscripcion Una fila de
 *   `suscripcion_push`.
 * @param {object} datos.mensaje Lo que recibe el service worker, en JSON.
 * @param {{ sujeto: string, publica: string, privada: string }} datos.vapid
 * @param {number} [datos.ttl] Segundos que el servicio lo guarda si el dispositivo está apagado.
 */
export async function solicitudDePush({ suscripcion, mensaje, vapid, ttl = 86_400 }) {
  const cuerpo = await cifrar(suscripcion, texto.encode(JSON.stringify(mensaje)))
  return {
    url: suscripcion.endpoint,
    opciones: {
      method: 'POST',
      headers: {
        Authorization: await encabezadoVapid({ endpoint: suscripcion.endpoint, ...vapid }),
        'Content-Encoding': 'aes128gcm',
        'Content-Type': 'application/octet-stream',
        TTL: String(ttl),
        Urgency: 'normal',
      },
      body: cuerpo,
    },
  }
}
