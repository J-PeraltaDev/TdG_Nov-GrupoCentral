import { CODIGO_RECUPERACION_MAX_INTENTOS } from '../../core/config/parametros.js'

/** @typedef {'pendiente' | 'codigo_generado' | 'usada' | 'vencida'} EstadoDeSolicitud */

/**
 * @typedef {object} Solicitud
 * @property {string} id
 * @property {string} usuario_id
 * @property {string} creada_en
 * @property {string | null} expira_en Nulo hasta que el administrador genera el código.
 * @property {boolean} usado
 * @property {number} intentos_fallidos
 */

/**
 * El estado de una solicitud de recuperación (SDD 6.1.10). No se guarda: se deriva de lo que
 * sí se guarda, con la misma regla que aplica el servidor (`private.solicitud_abierta`).
 *
 *   pendiente        espera que el administrador genere su código;
 *   codigo_generado  tiene un código vigente, que todavía no se usa;
 *   usada            la persona ya creó su contraseña con el código;
 *   vencida          el código venció o agotó sus intentos sin usarse. No se reabre: la
 *                    persona pide otra desde la pantalla 02.
 *
 * Si al usuario lo desactivaron, su solicitud abierta ya no admite un código ni sirve el que
 * tenga: también es «vencida».
 *
 * @param {Solicitud} solicitud
 * @param {Date | string | number} [ahora]
 * @param {boolean} [usuarioActivo]
 * @returns {EstadoDeSolicitud}
 */
export function estadoDeSolicitud(solicitud, ahora = Date.now(), usuarioActivo = true) {
  if (solicitud.usado) return 'usada'
  if (!usuarioActivo) return 'vencida'
  if (solicitud.expira_en === null) return 'pendiente'
  const vigente =
    new Date(solicitud.expira_en).getTime() > new Date(ahora).getTime() &&
    solicitud.intentos_fallidos < CODIGO_RECUPERACION_MAX_INTENTOS
  return vigente ? 'codigo_generado' : 'vencida'
}

/**
 * Las que todavía le sirven a la persona: van en la pestaña «Pendientes».
 *
 * @param {EstadoDeSolicitud} estado
 */
export function estaAbierta(estado) {
  return estado === 'pendiente' || estado === 'codigo_generado'
}
