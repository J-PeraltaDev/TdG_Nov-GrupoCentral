import { estaEnLinea } from '../../core/conexion/monitor.js'
import { traducirError } from '../../core/errores/traducir.js'
import { encolar } from '../../core/offline/cola.js'
import { vigilarPermiso } from '../../core/sesion/perfilVigente.js'
import { registrarNovedad } from '../../core/supabase/repositorios/novedades.js'

/*
 * Envío de una novedad (SDD 6.1.5, «Registro de la novedad», y Figura 18).
 *
 * El identificador local y la fecha real de registro se generan una sola vez, antes del
 * primer envío, y se conservan en los reintentos: así una caída de la red a mitad del envío
 * no crea duplicados (RNF-08) ni cambia la fecha del registro (RNF-09).
 *
 * Sin conexión, o si la red falla al enviar, el borrador se guarda tal cual en la cola del
 * dispositivo (RF-21) y la sincronización lo envía después (RF-22).
 */

/**
 * @typedef {object} Borrador
 * @property {string} id_local
 * @property {string} fecha_registro ISO 8601, con la hora del dispositivo.
 * @property {string} descripcion
 * @property {string} prioridad
 * @property {string} area_id
 * @property {string} [area] Nombre del área, para mostrarla sin red.
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
 * Envía el borrador al servidor o, si no se puede, lo guarda en el dispositivo.
 *
 * @param {Borrador} borrador
 * @param {{ id: string, finca_id: string | null }} perfil Quién registra: dueño de la pendiente.
 * @returns {Promise<
 *   | { ok: true, novedad: import('../../core/supabase/repositorios/novedades.js').Novedad }
 *   | { ok: true, pendiente: import('../../core/offline/cola.js').Pendiente }
 *   | ({ ok: false } & { tipo: string, codigo: string, mensaje: string })
 * >}
 */
export async function enviarNovedad(borrador, perfil) {
  if (!estaEnLinea()) return encolar(borrador, perfil)
  try {
    // Si responde SIN_PERMISO puede que lo hayan desactivado o que ya no sea reportante: el
    // perfil se relee (RF-03).
    return { ok: true, novedad: await vigilarPermiso(() => registrarNovedad(borrador)) }
  } catch (error) {
    const fallo = traducirError(error)
    // SDD 6.1.5: «si error de red: continuar como sin conexión». Con la sesión vencida, también:
    // lo escrito no se pierde y la sincronización pedirá el ingreso (08-B; decisión 2).
    if (fallo.tipo === 'red' || fallo.tipo === 'sesion') return encolar(borrador, perfil)
    return { ok: false, ...fallo }
  }
}
