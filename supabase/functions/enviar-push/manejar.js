import { mensajeDelPush } from '../_shared/plantillas.js'
import { fallo } from '../_shared/servir.js'
import { esUuid } from '../_shared/validaciones.js'
import { solicitudDePush } from '../_shared/webpush.js'

/*
 * enviar-push (SDD 5.3.5 y 6.1.6): la llama el webhook de la base de datos por cada aviso nuevo
 * (RF-31). Comprueba el secreto, arma el mensaje y lo envía a cada suscripción del destinatario.
 * 404 o 410 quiere decir que la suscripción ya no existe: se borra. Cualquier otro error va al
 * log y se sigue con las demás: el aviso dentro de la aplicación nunca se toca (CU-31 2a).
 *
 * Módulo puro (docs/adr/0012): index.ts le pasa la base de datos, `fetch` y los secretos.
 */

/** Los dos secretos pasan por SHA-256 y se comparan completos: el tiempo no depende de dónde difieren. */
async function mismoSecreto(recibido, esperado) {
  if (!recibido || !esperado) return false
  const resumen = async (texto) =>
    new Uint8Array(
      await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto)),
    )
  const [a, b] = await Promise.all([resumen(recibido), resumen(esperado)])
  let diferencia = 0
  for (let i = 0; i < a.length; i++) diferencia |= a[i] ^ b[i]
  return diferencia === 0
}

/** Los servicios push de los navegadores: Chrome, Edge y Opera (FCM), Firefox y Safari. */
const SERVICIOS_PUSH = [
  'fcm.googleapis.com',
  'updates.push.services.mozilla.com',
  'web.push.apple.com',
]

/**
 * Si el punto de entrega es de un servicio push, por https. Lo escribe el cliente en
 * `suscripcion_push`: sin esto, cualquiera con sesión haría que la función llamara a la dirección
 * que quisiera.
 *
 * @param {string} endpoint
 */
function esServicioPush(endpoint) {
  if (!URL.canParse(endpoint)) return false
  const { protocol, hostname } = new URL(endpoint)
  return (
    protocol === 'https:' &&
    (SERVICIOS_PUSH.includes(hostname) || hostname.endsWith('.notify.windows.com'))
  )
}

/**
 * @param {{ record?: Record<string, unknown> }} cuerpo Lo que manda el disparador: el aviso.
 * @param {object} dep
 * @param {string} dep.secreto ENVIAR_PUSH_SECRETO de la función.
 * @param {string | null} dep.secretoRecibido El encabezado `x-webhook-secreto`.
 * @param {{ sujeto: string, publica: string, privada: string }} dep.vapid
 * @param {(aviso: { novedad_id: string, destinatario_id: string }) => Promise<{ novedad: object, rol_id: number, suscripciones: object[] }>} dep.leerDestino
 * @param {(url: string, opciones: RequestInit) => Promise<number>} dep.enviar Devuelve el estado HTTP.
 * @param {(id: string) => Promise<void>} dep.borrarSuscripcion
 * @param {(mensaje: string) => void} dep.registrar
 */
export async function manejar(cuerpo, dep) {
  if (!(await mismoSecreto(dep.secretoRecibido, dep.secreto))) return fallo(401, 'SIN_PERMISO')

  const aviso = cuerpo?.record
  if (!esUuid(aviso?.id) || !esUuid(aviso?.destinatario_id) || !esUuid(aviso?.novedad_id)) {
    return fallo(400, 'DATO_OBLIGATORIO', ['record'])
  }

  const destino = await dep.leerDestino(aviso).catch((error) => {
    dep.registrar(`enviar-push: no se pudo leer el destino (aviso ${aviso.id}): ${error.message}`)
    throw error
  })
  // Título y cuerpo de la Tabla 33, sin la descripción (decisión 47).
  const mensaje = mensajeDelPush(aviso, destino.rol_id, destino.novedad)
  const resultado = { enviadas: 0, borradas: 0, fallidas: 0 }

  for (const suscripcion of destino.suscripciones) {
    if (!esServicioPush(suscripcion.endpoint)) {
      resultado.fallidas++
      dep.registrar(
        `enviar-push: suscripción ${suscripcion.id} fuera de los servicios push (aviso ${aviso.id})`,
      )
      continue
    }
    try {
      const { url, opciones } = await solicitudDePush({ suscripcion, mensaje, vapid: dep.vapid })
      const estado = await dep.enviar(url, opciones)
      if (estado === 404 || estado === 410) {
        await dep.borrarSuscripcion(suscripcion.id)
        resultado.borradas++
      } else if (estado >= 200 && estado < 300) {
        resultado.enviadas++
      } else {
        resultado.fallidas++
        dep.registrar(`enviar-push: el servicio push respondió ${estado} (aviso ${aviso.id})`)
      }
    } catch (error) {
      resultado.fallidas++
      dep.registrar(`enviar-push: ${error.message} (aviso ${aviso.id})`)
    }
  }

  return { estado: 200, cuerpo: resultado }
}
