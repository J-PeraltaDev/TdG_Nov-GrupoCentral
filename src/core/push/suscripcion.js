import { deBase64Url } from '../../../supabase/functions/_shared/webpush.js'
import { borrarSuscripcion, guardarSuscripcion } from '../supabase/repositorios/suscripciones.js'

/*
 * Notificaciones push en este dispositivo (RF-31; plan del Sprint 5, decisiones 44 y 45). El
 * permiso se pide solo después de un toque de la persona. Sin soporte del navegador (en iPhone,
 * sin la aplicación instalada) o sin la clave pública del proyecto, no se ofrecen.
 */

/** @typedef {'no-disponible' | 'bloqueadas' | 'activadas' | 'desactivadas'} EstadoDelPush */

const clavePublica = () => import.meta.env.VITE_VAPID_PUBLIC_KEY

/** La RLS rechazó la fila: el punto de entrega es de otra persona del dispositivo. */
const RLS = '42501'

export function sePuedeActivar() {
  return (
    Boolean(clavePublica()) &&
    Boolean(navigator.serviceWorker) &&
    'PushManager' in window &&
    'Notification' in window
  )
}

const pushManager = async () => (await navigator.serviceWorker.ready).pushManager

/**
 * La suscripción actual, sin esperar al service worker: `ready` nunca se resuelve si no hay uno
 * (`npm run dev`, o la primera visita mientras se instala), y cerrar sesión no puede quedarse
 * esperando. Sin el permiso concedido no puede haber una, y no se le pregunta al servicio push: en
 * el CI, el WebKit de Playwright deja la página sin responder con esa llamada.
 *
 * @returns {Promise<PushSubscription | null | undefined>} `undefined` sin service worker.
 */
async function suscripcionActual() {
  const registro = await navigator.serviceWorker.getRegistration()
  if (!registro) return undefined
  return Notification.permission === 'granted' ? registro.pushManager.getSubscription() : null
}

/** @returns {Promise<EstadoDelPush>} */
export async function estadoDelPush() {
  if (!sePuedeActivar()) return 'no-disponible'
  if (Notification.permission === 'denied') return 'bloqueadas'
  const suscripcion = await suscripcionActual()
  if (suscripcion === undefined) return 'no-disponible'
  return suscripcion && Notification.permission === 'granted' ? 'activadas' : 'desactivadas'
}

/**
 * El texto para la persona cuando activar falla: el de Brave dice qué ajuste encender (cambio
 * 43); cualquier otro fallo, el genérico de cada pantalla.
 *
 * @param {unknown} error
 * @param {string} generico
 */
export const textoDelFallo = (error, generico) =>
  /** @type {any} */ (error)?.name === 'ServicioPushApagado'
    ? /** @type {Error} */ (error).message
    : generico

/**
 * Suscribe el navegador. Brave de escritorio apaga por omisión el servicio push de Google y ahí
 * `subscribe` falla con AbortError («push service error»): Chrome, con el mismo código, funciona.
 * En Brave para Android ese ajuste no existe, así que allí queda el mensaje genérico.
 *
 * @param {PushManager} manager
 */
async function suscribir(manager) {
  try {
    return await manager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: deBase64Url(clavePublica()),
    })
  } catch (error) {
    const esBraveDeEscritorio =
      /** @type {any} */ (error)?.name === 'AbortError' &&
      !/Android/i.test(navigator.userAgent) &&
      (await /** @type {any} */ (navigator).brave?.isBrave?.().catch(() => false))
    if (!esBraveDeEscritorio) throw error
    const apagado = new Error(
      'Brave tiene apagado el servicio de notificaciones. Abre brave://settings/privacy, activa «Usar los servicios de Google para la mensajería push», reinicia el navegador e intenta de nuevo.',
    )
    apagado.name = 'ServicioPushApagado'
    throw apagado
  }
}

/**
 * Pide el permiso, suscribe el navegador y guarda la suscripción a nombre del usuario.
 *
 * @param {string} usuarioId
 * @returns {Promise<EstadoDelPush>} Lanza el error si no se pudo guardar.
 */
export async function activarPush(usuarioId) {
  if ((await Notification.requestPermission()) !== 'granted') return 'bloqueadas'
  const manager = await pushManager()
  const suscripcion = (await manager.getSubscription()) ?? (await suscribir(manager))
  try {
    await guardarSuscripcion(usuarioId, suscripcion.toJSON())
  } catch (error) {
    if (error?.code !== RLS) throw error
    // Otra persona activó las notificaciones en este navegador y la RLS no deja tocar su fila:
    // se cancela esa suscripción y el navegador entrega un punto de entrega nuevo (decisión 45).
    await suscripcion.unsubscribe()
    await guardarSuscripcion(usuarioId, (await suscribir(manager)).toJSON())
  }
  return 'activadas'
}

/**
 * Cancela la suscripción del navegador (funciona sin red) y borra su fila. Sin red, la fila
 * queda y enviar-push la borra con el 410 del servicio push.
 *
 * @returns {Promise<EstadoDelPush>}
 */
export async function desactivarPush() {
  if (!sePuedeActivar()) return 'no-disponible'
  const suscripcion = await suscripcionActual()
  if (suscripcion) {
    const { endpoint } = suscripcion
    await suscripcion.unsubscribe()
    await borrarSuscripcion(endpoint).catch(() => {})
  }
  return 'desactivadas'
}
