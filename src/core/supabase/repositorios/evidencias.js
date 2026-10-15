import { leerNovedadDescargada } from '../../offline/bd.js'
import { guardarNovedad } from '../../offline/novedadesLocales.js'
import { supabase } from '../cliente.js'
import { conRespaldo } from './conRespaldo.js'

/*
 * Repositorio de evidencias fotográficas (RF-08; SDD 6.1.7 y plan del Sprint 4, decisiones 19 a
 * 23). El bucket es privado: las fotos se ven con URLs firmadas, que el service worker no guarda.
 */

const BUCKET = 'evidencias'
/** Las URLs firmadas valen 5 minutos: lo justo para ver la foto (decisión 23). */
const VIGENCIA_DE_LA_URL_S = 300

/**
 * Sube una foto ya reducida y registra su fila (CU-08 4). Primero el archivo y después la fila:
 * si la fila falla, el archivo queda sin fila y nadie lo ve (decisión 21). El servidor revisa el
 * estado, el máximo de 3 y el tamaño real (`LIMITE_DE_FOTOS`, `EVIDENCIA_INVALIDA`).
 *
 * @param {string} novedadId
 * @param {Blob} foto Un JPEG.
 * @param {string} usuarioId Quien la sube: la política exige que sea quien tiene la sesión.
 * @returns {Promise<{ id: string, ruta_storage: string, subida_en: string, transicion_id: number | null }>}
 */
export async function subirEvidencia(novedadId, foto, usuarioId) {
  const ruta = `${novedadId}/${crypto.randomUUID()}.jpg`
  const subida = await supabase.storage
    .from(BUCKET)
    .upload(ruta, foto, { contentType: 'image/jpeg' })
  if (subida.error) throw subida.error
  const { data, error } = await supabase
    .from('evidencia')
    .insert({
      novedad_id: novedadId,
      ruta_storage: ruta,
      subida_por: usuarioId,
      tamano_bytes: foto.size,
    })
    .select('id, ruta_storage, subida_en, transicion_id')
    .single()
  if (error) throw error
  return data
}

/**
 * Las fotos de una novedad, en el orden en que se subieron, cada una con su URL firmada: todas
 * en una sola llamada. Las del reporte tienen `transicion_id` nulo; las de la solución, la
 * transición → resuelta de su intento (cambio 23). Sin conexión, las que se descargaron, sin
 * URL: se dibujan como recuadros (09-D y 14-B).
 *
 * @param {string} novedadId
 * @returns {Promise<{ id: string, ruta_storage: string, subida_en: string, transicion_id: number | null, url: string | null }[]>}
 */
export function listarEvidencias(novedadId) {
  return conRespaldo(
    async () => {
      const { data, error } = await supabase
        .from('evidencia')
        .select('id, ruta_storage, subida_en, transicion_id')
        .eq('novedad_id', novedadId)
        .order('subida_en', { ascending: true })
      if (error) throw error
      if (data.length === 0) return []
      const firmadas = await supabase.storage.from(BUCKET).createSignedUrls(
        data.map(({ ruta_storage }) => ruta_storage),
        VIGENCIA_DE_LA_URL_S,
      )
      if (firmadas.error) throw firmadas.error
      return data.map((evidencia, i) => ({
        ...evidencia,
        url: firmadas.data[i]?.signedUrl ?? null,
      }))
    },
    // Se guardan sin la URL, que vence a los 5 minutos.
    (evidencias) =>
      guardarNovedad(novedadId, {
        evidencias: evidencias.map(({ id, ruta_storage, subida_en, transicion_id }) => ({
          id,
          ruta_storage,
          subida_en,
          transicion_id,
        })),
      }),
    async () =>
      ((await leerNovedadDescargada(novedadId))?.evidencias ?? []).map((evidencia) => ({
        ...evidencia,
        url: null,
      })),
  )
}
