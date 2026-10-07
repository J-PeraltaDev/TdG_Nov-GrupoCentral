import { traducirError } from '../../core/errores/traducir.js'
import { registrarNovedad } from '../../core/supabase/repositorios/novedades.js'

/*
 * Envío de una novedad (SDD 6.1.5, «Registro de la novedad»).
 *
 * El identificador local y la fecha real de registro se generan una sola vez, antes del
 * primer envío, y se conservan en los reintentos: así una caída de la red a mitad del envío
 * no crea duplicados (RNF-08) ni cambia la fecha del registro (RNF-09).
 *
 * Sprint 4: este es el único punto que cambia para el registro sin conexión. Cuando el
 * resultado sea de tipo «red», en lugar de devolverlo se guarda el borrador en el almacén
 * `pendientes` y se muestra la constancia local (pantalla 07).
 */

/**
 * @typedef {object} Borrador
 * @property {string} id_local
 * @property {string} fecha_registro ISO 8601, con la hora del dispositivo.
 * @property {string} descripcion
 * @property {string} prioridad
 * @property {string} area_id
 */

/**
 * Prepara el envío: fija el identificador local y la fecha real de registro.
 *
 * @param {{ descripcion: string, prioridad: string, areaId: string }} datos
 * @returns {Borrador}
 */
export function crearBorrador({ descripcion, prioridad, areaId }) {
  return {
    id_local: crypto.randomUUID(),
    fecha_registro: new Date().toISOString(),
    descripcion: descripcion.trim(),
    prioridad,
    area_id: areaId,
  }
}

/**
 * Envía el borrador al servidor.
 *
 * @param {Borrador} borrador
 * @returns {Promise<
 *   | { ok: true, novedad: import('../../core/supabase/repositorios/novedades.js').Novedad }
 *   | ({ ok: false } & import('../../core/errores/traducir.js').ErrorTraducido)
 * >}
 */
export async function enviarNovedad(borrador) {
  try {
    return { ok: true, novedad: await registrarNovedad(borrador) }
  } catch (error) {
    return { ok: false, ...traducirError(error) }
  }
}
