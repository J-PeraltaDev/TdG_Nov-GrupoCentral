import { supabase } from '../cliente.js'

/*
 * Repositorio del catálogo de tipos de falla (C-03, SDD 6.1.8).
 */

/** @typedef {import('../database.types').Database} Database */
/** @typedef {Database['public']['Functions']['sugerir_tipos_falla']['Returns'][number]} Sugerencia */
/** @typedef {Database['public']['Tables']['tipo_falla']['Row']} TipoFalla */
/** @typedef {Database['public']['Tables']['novedad']['Row']} Novedad */

/**
 * @typedef {object} TipoDelCatalogo
 * @property {string} id
 * @property {string} nombre
 * @property {boolean} activo
 * @property {string} creado_en
 * @property {string | null} creado_por El nombre de quien lo creó al resolver.
 * @property {number} novedades Las novedades que lo tienen.
 */

/**
 * @typedef {object} CambioDelCatalogo Una fila de `auditoria_tipo_falla` (RF-32).
 * @property {string} id
 * @property {string} tipo_falla_id
 * @property {string | null} tipo_destino_id Solo en una fusión.
 * @property {'renombrar' | 'fusionar' | 'desactivar'} accion
 * @property {string | null} valor_anterior El nombre antes del cambio.
 * @property {string} fecha
 * @property {string | null} usuario
 */

/**
 * Tipos de falla activos que coinciden con lo escrito, sin importar mayúsculas ni tildes:
 * primero la coincidencia exacta y luego los más usados, máximo ocho (RF-14). Solo para el
 * aprobador y el administrador.
 *
 * @param {string} texto
 * @returns {Promise<Sugerencia[]>} Lanza el error de Supabase si falla.
 */
export async function sugerirTiposFalla(texto) {
  const { data, error } = await supabase.rpc('sugerir_tipos_falla', { p_texto: texto })
  if (error) throw error
  return data
}

/**
 * Todo el catálogo, también los inactivos y los fusionados, con cuántas novedades tiene cada
 * tipo (el administrador las ve todas) y quién lo creó (pantalla 31; decisión 52).
 *
 * @returns {Promise<TipoDelCatalogo[]>}
 */
export async function listarCatalogo() {
  // atajo: se trae todo el catálogo; con más de 500 tipos, paginar.
  const { data, error } = await supabase
    .from('tipo_falla')
    .select('id, nombre, activo, creado_en, creador:usuario!creado_por(nombre), novedad(count)')
  if (error) throw error
  return data.map(({ creador, novedad, ...tipo }) => ({
    ...tipo,
    creado_por: creador?.nombre ?? null,
    novedades: novedad[0]?.count ?? 0,
  }))
}

/**
 * Los tipos que se pueden elegir al corregir una novedad: los activos, por nombre.
 *
 * @returns {Promise<{ id: string, nombre: string }[]>}
 */
export async function listarTiposActivos() {
  const { data, error } = await supabase
    .from('tipo_falla')
    .select('id, nombre')
    .eq('activo', true)
    .order('nombre')
  if (error) throw error
  return data
}

/**
 * El registro de cambios del catálogo, del más reciente al más antiguo. Solo lo lee el
 * administrador (RLS).
 *
 * @returns {Promise<CambioDelCatalogo[]>}
 */
export async function listarCambios() {
  // atajo: se trae todo el registro; con más de 500 cambios, paginar.
  const { data, error } = await supabase
    .from('auditoria_tipo_falla')
    .select('id, tipo_falla_id, tipo_destino_id, accion, valor_anterior, fecha, usuario(nombre)')
    .order('fecha', { ascending: false })
    .order('id')
  if (error) throw error
  return data.map(({ usuario, ...cambio }) => ({ ...cambio, usuario: usuario?.nombre ?? null }))
}

/**
 * @template T
 * @param {string} funcion
 * @param {Record<string, unknown>} parametros
 * @returns {Promise<T>} Lanza el error de Supabase: TIPO_FALLA_DUPLICADO, TIPO_FALLA_INVALIDO…
 */
async function llamar(funcion, parametros) {
  const { data, error } = await supabase.rpc(funcion, parametros)
  if (error) throw error
  return data
}

/**
 * @param {string} tipoId
 * @param {string} nombre
 * @returns {Promise<TipoFalla>}
 */
export const renombrarTipoFalla = (tipoId, nombre) =>
  llamar('renombrar_tipo_falla', { p_tipo_id: tipoId, p_nombre: nombre })

/**
 * Pasa las novedades del origen al destino y retira el origen. Devuelve el destino.
 *
 * @param {string} origenId
 * @param {string} destinoId
 * @returns {Promise<TipoFalla>}
 */
export const fusionarTiposFalla = (origenId, destinoId) =>
  llamar('fusionar_tipos_falla', { p_origen_id: origenId, p_destino_id: destinoId })

/**
 * @param {string} tipoId
 * @returns {Promise<TipoFalla>}
 */
export const desactivarTipoFalla = (tipoId) =>
  llamar('desactivar_tipo_falla', { p_tipo_id: tipoId })

/**
 * El tipo de una novedad cerrada (CU-32 1a). Devuelve la novedad.
 *
 * @param {string} novedadId
 * @param {string} tipoId
 * @returns {Promise<Novedad>}
 */
export const corregirTipoFalla = (novedadId, tipoId) =>
  llamar('corregir_tipo_falla', { p_novedad_id: novedadId, p_tipo_falla_id: tipoId })
