#!/usr/bin/env node
/*
 * Genera las claves de las notificaciones push de un proyecto (RF-31; plan del Sprint 5,
 * decisiones 40 y 41) y las agrega a un archivo de variables que Git ignora, sin imprimirlas:
 *
 *   VAPID_PUBLIC_KEY y VITE_VAPID_PUBLIC_KEY   la clave pública (la segunda es la del cliente)
 *   VAPID_PRIVATE_KEY                           la privada: solo como secreto de enviar-push
 *   ENVIAR_PUSH_SECRETO                         el que el webhook le manda a enviar-push
 *
 * Lo que ya está en el archivo no se toca: otra clave VAPID invalidaría todas las suscripciones.
 * VAPID_SUBJECT (mailto: del equipo) se escribe a mano.
 *
 *   npm run vapid:claves                                      .env.local («staging» y desarrollo)
 *   npm run vapid:claves -- --archivo .env.proyecto.local     las de «PROYECTO», aparte
 */
import { appendFileSync, existsSync, readFileSync } from 'node:fs'
import { aBase64Url } from '../supabase/functions/_shared/webpush.js'

const i = process.argv.indexOf('--archivo')
const archivo = i > -1 ? process.argv[i + 1] : '.env.local'
if (!archivo?.endsWith('.local')) {
  console.error('El archivo tiene que terminar en .local, para que Git lo ignore.')
  process.exit(1)
}

const actual = existsSync(archivo) ? readFileSync(archivo, 'utf8') : ''
const tiene = (nombre) => new RegExp(`^${nombre}=.+`, 'm').test(actual)
const nuevas = {}

if (!tiene('VAPID_PRIVATE_KEY')) {
  const par = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, [
    'sign',
    'verify',
  ])
  const publica = aBase64Url(new Uint8Array(await crypto.subtle.exportKey('raw', par.publicKey)))
  nuevas.VAPID_PUBLIC_KEY = publica
  nuevas.VITE_VAPID_PUBLIC_KEY = publica
  nuevas.VAPID_PRIVATE_KEY = (await crypto.subtle.exportKey('jwk', par.privateKey)).d
}
if (!tiene('ENVIAR_PUSH_SECRETO')) {
  nuevas.ENVIAR_PUSH_SECRETO = aBase64Url(crypto.getRandomValues(new Uint8Array(32)))
}

const lineas = Object.entries(nuevas).map(([nombre, valor]) => `${nombre}=${valor}`)
if (lineas.length) {
  const salto = actual && !actual.endsWith('\n') ? '\n' : ''
  appendFileSync(archivo, `${salto}${lineas.join('\n')}\n`)
  console.log(`Agregadas a ${archivo}: ${Object.keys(nuevas).join(', ')}.`)
} else {
  console.log(`${archivo} ya tenía las claves: no cambió nada.`)
}
if (!tiene('VAPID_SUBJECT')) {
  console.log(`Falta VAPID_SUBJECT=mailto:… en ${archivo}: escríbelo a mano.`)
}
