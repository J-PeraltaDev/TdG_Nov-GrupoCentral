/*
 * Lo que hace el service worker con un push (RF-31; plan del Sprint 5, decisión 46). Va aparte
 * de sw.js para probarlo con Vitest: sw.js solo conecta los eventos.
 */

/**
 * La notificación de un push de enviar-push: su título y su cuerpo (el texto del aviso, sin la
 * descripción), el ícono y la dirección de la novedad. Los avisos de una misma novedad se
 * reemplazan, pero vuelven a sonar: cada uno es un cambio nuevo.
 *
 * @param {{ json: () => any } | null | undefined} datos `evento.data` del push.
 * @returns {{ titulo: string, opciones: NotificationOptions & { renotify: boolean } }}
 */
export function notificacionDelPush(datos) {
  let mensaje = {}
  try {
    mensaje = datos?.json() ?? {}
  } catch {
    // Un mensaje que no es JSON se muestra con el nombre de la aplicación.
  }
  return {
    titulo: mensaje.titulo ?? 'Novedades Grupo Central',
    opciones: {
      body: mensaje.cuerpo,
      icon: '/iconos/icono-192.png',
      lang: 'es-CO',
      tag: mensaje.novedad_id,
      renotify: Boolean(mensaje.novedad_id),
      data: { url: mensaje.url ?? '/' },
    },
  }
}

/**
 * Las pestañas abiertas vuelven a contar los avisos sin leer (RF-30).
 *
 * @param {Clients} clientes
 */
export async function avisarALasPestanas(clientes) {
  for (const pestana of await clientes.matchAll({ type: 'window' })) {
    pestana.postMessage({ type: 'AVISO_NUEVO' })
  }
}

/**
 * Al tocar la notificación: enfoca una pestaña abierta de la aplicación y la lleva a la novedad,
 * o abre una nueva. Nunca sale del origen de la aplicación.
 *
 * @param {Clients} clientes
 * @param {string} origen `self.location.origin`.
 * @param {string | undefined} destino La dirección que trajo el push.
 */
export async function abrirLaNovedad(clientes, origen, destino) {
  const url = new URL(destino ?? '/', origen)
  if (url.origin !== origen) return
  const pestanas = await clientes.matchAll({ type: 'window', includeUncontrolled: true })
  const abierta = pestanas.find((pestana) => 'focus' in pestana)
  if (!abierta) return clientes.openWindow(url.href)
  await abierta.focus()
  // Una pestaña que este service worker no controla no se deja llevar: se abre otra.
  return abierta.navigate(url.href).catch(() => clientes.openWindow(url.href))
}
