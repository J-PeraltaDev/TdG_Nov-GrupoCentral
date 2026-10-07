import { guardarCatalogo, leerCatalogo } from '../../offline/bd.js'
import { supabase } from '../cliente.js'

/**
 * Áreas activas (RF-05). Se descargan al ingresar y quedan en el dispositivo, así el
 * formulario de registro abre sin red; si no están, se piden al servidor.
 *
 * @returns {Promise<{ id: string, nombre: string }[]>}
 */
export async function listarAreas() {
  const guardadas = await leerCatalogo('areas').catch(() => undefined)
  if (guardadas?.length) return guardadas

  const { data, error } = await supabase
    .from('area')
    .select('id, nombre')
    .eq('activo', true)
    .order('nombre')
  if (error) throw error
  await guardarCatalogo('areas', data).catch(() => {})
  return data
}
