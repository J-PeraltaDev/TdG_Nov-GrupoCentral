import { supabase } from '../cliente.js'

/*
 * Indicadores del panel de reportes (RF-26 a RF-29, SDD 6.1.9): una función de la base de datos
 * por pestaña, que devuelve un `jsonb` con la forma documentada en su comentario (migración
 * rf19_contratos_sprint_5). Solo los piden el director y el administrador; a cualquier otro rol
 * el servidor le responde `SIN_PERMISO`. Requieren conexión: no se guardan en el dispositivo.
 */

/**
 * Novedades abiertas por finca, por área y por estado (RF-26, pantalla 23).
 *
 * @returns {Promise<object>} Lanza el error de Supabase si falla.
 */
export async function obtenerNovedadesAbiertas() {
  const { data, error } = await supabase.rpc('rpt_novedades_abiertas')
  if (error) throw error
  return data
}

/**
 * Tiempos de atención por área y por mes, y las abiertas con más tiempo (RF-27, pantalla 24).
 *
 * @param {{ desde: string, hasta: string }} periodo Días de Colombia (`AAAA-MM-DD`), inclusivos.
 * @returns {Promise<object>} Lanza el error de Supabase si falla (`FECHA_INVALIDA`, por ejemplo).
 */
export async function obtenerTiemposDeAtencion({ desde, hasta }) {
  const { data, error } = await supabase.rpc('rpt_tiempos_atencion', {
    p_desde: desde,
    p_hasta: hasta,
  })
  if (error) throw error
  return data
}
