/*
 * Monitor de conexión (C-02, SDD 6.1.5 · RF-23, RF-25). Un solo estado para toda la aplicación,
 * que se lee con `useEnLinea` (y fuera de React, con `estaEnLinea`).
 *
 * Hay conexión si el navegador dice que la hay y el servidor no dejó de responder:
 *   - `navigator.onLine` y sus eventos `online` y `offline`;
 *   - los fallos de red de cualquier solicitud del cliente de Supabase (`cliente.js` avisa aquí):
 *     una red «conectada» sin internet (portal cautivo, señal débil) no engaña al indicador;
 *   - mientras no responde, una verificación cada 15 s contra Auth, con 5 s de espera máxima y en
 *     pausa con la pestaña oculta. Es otro origen: el service worker no la toca.
 */

const VERIFICAR_CADA_MS = 15_000
const ESPERA_MAXIMA_MS = 5_000

/** El servidor dejó de responder y todavía no ha vuelto a hacerlo. */
let sinRespuesta = false
let temporizador = null
const oyentes = new Set()

/** @returns {boolean} */
export function estaEnLinea() {
  return navigator.onLine && !sinRespuesta
}

/**
 * @param {() => void} oyente
 * @returns {() => void} Deja de escuchar.
 */
export function suscribir(oyente) {
  oyentes.add(oyente)
  return () => oyentes.delete(oyente)
}

function avisar() {
  for (const oyente of oyentes) oyente()
}

/** Una solicitud no llegó al servidor o no volvió de él. */
export function informarFalloDeRed() {
  if (sinRespuesta) return
  sinRespuesta = true
  avisar()
  programar()
}

/** El servidor respondió (con lo que sea): hay conexión. */
export function informarRespuesta() {
  clearTimeout(temporizador)
  if (!sinRespuesta) return
  sinRespuesta = false
  avisar()
}

async function verificar() {
  const control = new AbortController()
  const limite = setTimeout(() => control.abort(), ESPERA_MAXIMA_MS)
  try {
    const respuesta = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/health`, {
      headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
      cache: 'no-store',
      signal: control.signal,
    })
    if (respuesta.ok) informarRespuesta()
  } catch {
    // Sigue sin conexión: lo intenta otra vez en la próxima vuelta.
  } finally {
    clearTimeout(limite)
  }
  programar()
}

/** Agenda la próxima verificación, si hace falta. */
function programar() {
  clearTimeout(temporizador)
  if (!sinRespuesta || !navigator.onLine || document.visibilityState !== 'visible') return
  temporizador = setTimeout(verificar, VERIFICAR_CADA_MS)
}

if (typeof window !== 'undefined') {
  window.addEventListener('offline', () => {
    clearTimeout(temporizador)
    avisar()
  })
  window.addEventListener('online', () => {
    avisar()
    // Si el servidor había dejado de responder, se pregunta ya, sin esperar la vuelta.
    if (sinRespuesta) verificar()
  })
  document.addEventListener('visibilitychange', () => {
    if (sinRespuesta && document.visibilityState === 'visible') verificar()
  })
}
