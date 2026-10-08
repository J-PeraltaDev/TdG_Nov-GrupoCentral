import { supabase } from '../cliente.js'

/*
 * Repositorio del catálogo de tipos de falla (C-03, SDD 6.1.8).
 */

/** @typedef {import('../database.types').Database} Database */
/** @typedef {Database['public']['Functions']['sugerir_tipos_falla']['Returns'][number]} Sugerencia */

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
