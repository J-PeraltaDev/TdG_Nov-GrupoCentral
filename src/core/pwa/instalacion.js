/*
 * Instalación de la aplicación (RNF-03). El navegador avisa que la app se puede instalar con
 * el evento `beforeinstallprompt`, que puede llegar antes de que exista la pantalla de
 * ingreso: por eso se escucha desde que carga la aplicación (este módulo se importa en
 * main.jsx) y se guarda para usarlo después.
 *
 * Safari en iPhone y iPad no tiene ese evento: allí se muestran las instrucciones de
 * «Agregar a inicio».
 */

/** @type {any} */
let eventoDeInstalacion = null
const oyentes = new Set()

const avisar = () => oyentes.forEach((oyente) => oyente())

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (evento) => {
    // Evita el aviso propio del navegador: la invitación la muestra la pantalla de ingreso.
    evento.preventDefault()
    eventoDeInstalacion = evento
    avisar()
  })
  window.addEventListener('appinstalled', () => {
    eventoDeInstalacion = null
    avisar()
  })
}

/** @param {() => void} oyente */
export function suscribirInstalacion(oyente) {
  oyentes.add(oyente)
  return () => oyentes.delete(oyente)
}

/** Indica si el navegador ofrece instalar la aplicación ahora mismo. */
export function sePuedeInstalar() {
  return eventoDeInstalacion !== null
}

/** Abre el diálogo de instalación del navegador. */
export async function instalar() {
  if (!eventoDeInstalacion) return false
  eventoDeInstalacion.prompt()
  const { outcome } = await eventoDeInstalacion.userChoice
  eventoDeInstalacion = null
  avisar()
  return outcome === 'accepted'
}

/** La aplicación ya está instalada y abierta como aplicación independiente. */
export function estaInstalada() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    /** @type {any} */ (navigator).standalone === true
  )
}

/** iPhone o iPad: no hay `beforeinstallprompt`; se instala desde el menú Compartir de Safari. */
export function esIos() {
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}
