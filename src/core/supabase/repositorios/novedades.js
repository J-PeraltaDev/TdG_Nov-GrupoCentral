import { supabase } from '../cliente.js'

/*
 * Repositorio de novedades (C-03, SDD 4.2.3). Aísla al resto del cliente de los detalles de
 * Supabase: las pantallas no llaman a `supabase` directamente.
 */

/** @typedef {import('../database.types').Database} Database */
/** @typedef {Database['public']['Tables']['novedad']['Row']} Novedad */
/** @typedef {Database['public']['Enums']['estado_novedad']} EstadoNovedad */

/** Columnas de `v_novedad` que usa la lista (RF-18): solo las necesarias (RNF-06). */
const COLUMNAS_DE_LA_LISTA = 'id, codigo, descripcion, prioridad, estado, area, fecha_registro'

/** Tamaño de página de las listas. */
export const NOVEDADES_POR_PAGINA = 20

/**
 * Registra una novedad (RF-05). El servidor le asigna el código, la enruta a su área y deja
 * el historial y los avisos (RF-06, RF-07, RF-16). Es idempotente por `id_local` (RNF-08):
 * repetir el envío devuelve la misma novedad.
 *
 * @param {object} datos
 * @param {string} datos.id_local Generado en el dispositivo antes del primer envío.
 * @param {string} datos.descripcion
 * @param {Database['public']['Enums']['prioridad_novedad']} datos.prioridad
 * @param {string} datos.area_id
 * @param {string} datos.fecha_registro Fecha y hora reales del registro (ISO 8601).
 * @returns {Promise<Novedad>} Lanza el error de Supabase si falla.
 */
export async function registrarNovedad({
  id_local,
  descripcion,
  prioridad,
  area_id,
  fecha_registro,
}) {
  const { data, error } = await supabase.rpc('registrar_novedad', {
    p_id_local: id_local,
    p_descripcion: descripcion,
    p_prioridad: prioridad,
    p_area_id: area_id,
    p_fecha_registro: fecha_registro,
  })
  if (error) throw error
  return data
}

/**
 * Página de novedades del alcance del usuario, de la más reciente a la más antigua. Las
 * políticas de la base de datos limitan el resultado: el reportante solo recibe las de su
 * finca (RNF-11).
 *
 * @param {object} opciones
 * @param {EstadoNovedad[]} opciones.estados
 * @param {number} [opciones.pagina] Empieza en 0.
 * @returns {Promise<{ novedades: object[], total: number }>}
 */
export async function listarNovedades({ estados, pagina = 0 }) {
  const desde = pagina * NOVEDADES_POR_PAGINA
  const { data, error, count } = await supabase
    .from('v_novedad')
    .select(COLUMNAS_DE_LA_LISTA, { count: 'exact' })
    .in('estado', estados)
    .order('fecha_registro', { ascending: false })
    .range(desde, desde + NOVEDADES_POR_PAGINA - 1)
  if (error) throw error
  return { novedades: data, total: count ?? data.length }
}

/**
 * Cantidad de novedades del alcance del usuario en esos estados.
 *
 * @param {EstadoNovedad[]} estados
 */
export async function contarNovedades(estados) {
  const { count, error } = await supabase
    .from('v_novedad')
    .select('id', { count: 'exact', head: true })
    .in('estado', estados)
  if (error) throw error
  return count ?? 0
}
