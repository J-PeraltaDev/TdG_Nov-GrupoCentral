import { guardarPendiente } from './bd.js'
import { avisarCambioDePendientes } from './pendientes.js'

/*
 * Cola de sincronización (C-03, SDD 6.1.5 y Figura 18): las novedades que se registran sin
 * conexión quedan en el almacén `pendientes` hasta que el servidor las recibe (RF-21, RF-22).
 */

/**
 * @typedef {object} Pendiente La forma de la Tabla 32 (plan del Sprint 4, decisión 1).
 * @property {string} id_local
 * @property {string} fecha_registro
 * @property {string} descripcion
 * @property {string} prioridad
 * @property {string} area_id
 * @property {string} area Nombre del área, para mostrarla sin red.
 * @property {string | null} finca_id
 * @property {string} reportante_id Solo se envía con la sesión de esta persona (RNF-10).
 * @property {'pendiente' | 'enviando' | 'error'} envio
 * @property {number} intentos
 * @property {import('../errores/traducir.js').ErrorTraducido | null} ultimo_error
 */

const NO_HAY_ESPACIO =
  'No se pudo guardar: el teléfono no tiene espacio. Libera espacio e intenta de nuevo.'
const NO_SE_GUARDO = 'La novedad no se guardó en el teléfono. Intenta de nuevo.'

/**
 * Guarda el borrador en el dispositivo, con su identificador local y su fecha real (RF-21 /
 * CU-21). Resuelve cuando la escritura quedó confirmada; si no se pudo, dice por qué (2a, 2b).
 *
 * @param {import('../../modules/e2-registro/enviarNovedad.js').Borrador & { area: string }} borrador
 * @param {{ id: string, finca_id: string | null }} perfil
 * @returns {Promise<
 *   | { ok: true, pendiente: Pendiente }
 *   | { ok: false, tipo: 'local', codigo: 'CUOTA_LLENA' | 'ESCRITURA_LOCAL', mensaje: string }
 * >}
 */
export async function encolar(borrador, perfil) {
  /** @type {Pendiente} */
  const pendiente = {
    ...borrador,
    finca_id: perfil.finca_id,
    reportante_id: perfil.id,
    envio: 'pendiente',
    intentos: 0,
    ultimo_error: null,
  }

  try {
    await guardarPendiente(pendiente)
  } catch (error) {
    const llena = error?.name === 'QuotaExceededError'
    return {
      ok: false,
      tipo: 'local',
      codigo: llena ? 'CUOTA_LLENA' : 'ESCRITURA_LOCAL',
      mensaje: llena ? NO_HAY_ESPACIO : NO_SE_GUARDO,
    }
  }

  // RNF-07: Safari decide si concede el almacenamiento persistente según el uso; se pide otra vez.
  navigator.storage?.persist?.().catch(() => {})
  await avisarCambioDePendientes()
  return { ok: true, pendiente }
}
