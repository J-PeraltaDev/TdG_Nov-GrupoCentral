import { useCallback, useEffect, useState } from 'react'
import { useEnLinea } from '../../core/conexion/useEnLinea.js'
import { listarEvidencias } from '../../core/supabase/repositorios/evidencias.js'

/**
 * Las fotos de una novedad, del reporte y de la solución, en una sola consulta (RF-08). Se
 * vuelven a pedir al volver la conexión (las URLs firmadas solo llegan con red) y con `recargar`,
 * después de adjuntar una.
 *
 * @param {string | undefined} novedadId
 * @returns {{ evidencias: object[] | null, recargar: () => void }} `null` mientras cargan.
 */
export function useEvidencias(novedadId) {
  const enLinea = useEnLinea()
  const [intento, setIntento] = useState(0)
  const [resultado, setResultado] = useState({ id: '', evidencias: /** @type {object[]} */ ([]) })

  useEffect(() => {
    if (!novedadId) return undefined
    let vigente = true
    listarEvidencias(novedadId)
      .then((evidencias) => {
        if (vigente) setResultado({ id: novedadId, evidencias })
      })
      // Sin ellas, el detalle sigue sirviendo: los bloques de fotos no se muestran.
      .catch(() => vigente && setResultado({ id: novedadId, evidencias: [] }))
    return () => {
      vigente = false
    }
  }, [novedadId, enLinea, intento])

  const recargar = useCallback(() => setIntento((n) => n + 1), [])
  return { evidencias: resultado.id === novedadId ? resultado.evidencias : null, recargar }
}
