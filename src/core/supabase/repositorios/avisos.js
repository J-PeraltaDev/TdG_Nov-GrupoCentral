import { supabase } from '../cliente.js'

/*
 * Repositorio de los avisos dentro de la aplicación (RF-30; SDD 6.1.6). La RLS solo deja ver los
 * propios, y marcarlos como leídos pasa por marcar_avisos_leidos: el cliente no escribe en
 * notificacion (regla 1).
 */

export const AVISOS_POR_PAGINA = 20

// La novedad del aviso, con lo que necesitan los textos de la Tabla 33. Si quien recibe el aviso
// ya no la puede ver (por ejemplo, se reasignó a otra área), la API la devuelve nula.
const COLUMNAS =
  'id, estado_nuevo, leida, creada_en, novedad_id, novedad(codigo, prioridad, finca(nombre), area(nombre), tipo_falla(nombre))'

/**
 * @typedef {object} Aviso
 * @property {string} id
 * @property {string} estado_nuevo
 * @property {boolean} leida
 * @property {string} creada_en
 * @property {string} novedad_id
 * @property {import('../../../../supabase/functions/_shared/plantillas.js').NovedadDelAviso | null} novedad
 */

/** @returns {Aviso} */
function aplanar({ novedad, ...aviso }) {
  return {
    ...aviso,
    novedad: novedad && {
      codigo: novedad.codigo,
      prioridad: novedad.prioridad,
      finca: novedad.finca?.nombre,
      area: novedad.area?.nombre,
      tipo_falla: novedad.tipo_falla?.nombre ?? null,
    },
  }
}

/**
 * Una página de avisos del usuario, del más reciente al más antiguo.
 *
 * @param {{ pagina?: number }} [opciones] `pagina` empieza en 0.
 * @returns {Promise<{ avisos: Aviso[], total: number }>}
 */
export async function listarAvisos({ pagina = 0 } = {}) {
  const desde = pagina * AVISOS_POR_PAGINA
  const { data, error, count } = await supabase
    .from('notificacion')
    .select(COLUMNAS, { count: 'exact' })
    .order('creada_en', { ascending: false })
    .order('id')
    .range(desde, desde + AVISOS_POR_PAGINA - 1)
  if (error) throw error
  return { avisos: data.map(aplanar), total: count ?? data.length }
}

/** Cuántos avisos sin leer tiene el usuario: la insignia de «Avisos» y de la campana. */
export async function contarAvisosSinLeer() {
  const { count, error } = await supabase
    .from('notificacion')
    .select('id', { count: 'exact', head: true })
    .eq('leida', false)
  if (error) throw error
  return count ?? 0
}

/**
 * Los avisos de rechazo sin leer del usuario: la insignia de «Rechazadas» en Mis novedades. El
 * rechazo es final, así que cada uno es de una novedad que sigue rechazada.
 *
 * @returns {Promise<{ id: string, novedad_id: string }[]>}
 */
export async function listarRechazosSinLeer() {
  const { data, error } = await supabase
    .from('notificacion')
    .select('id, novedad_id')
    .eq('leida', false)
    .eq('estado_nuevo', 'rechazada')
  if (error) throw error
  return data
}

/**
 * Marca como leídos esos avisos, o todos los del usuario si `ids` es nulo, y devuelve cuántos.
 *
 * @param {string[] | null} [ids]
 */
export async function marcarAvisosLeidos(ids = null) {
  const { data, error } = await supabase.rpc('marcar_avisos_leidos', { p_ids: ids })
  if (error) throw error
  return data
}
