import { useState } from 'react'

/**
 * @typedef {(texto: string) => Promise<{ ok: boolean, fallo?: { codigo: string | null, mensaje: string } }>} AlConfirmarTexto
 */

/**
 * El texto obligatorio de una hoja (motivo o justificación) y su envío. Lo comparten las hojas
 * 15, 16 y 17: sin texto no se puede confirmar (CU-11 3a, CU-12 3a, CU-17 3a), y lo que se
 * envía va sin espacios sobrantes.
 *
 * @param {object} opciones
 * @param {AlConfirmarTexto} opciones.alConfirmar
 * @param {boolean} opciones.enCurso La acción se está ejecutando.
 * @param {boolean} [opciones.listo] Los demás datos de la hoja están completos.
 */
export function useTextoObligatorio({ alConfirmar, enCurso, listo = true }) {
  const [texto, setTexto] = useState('')
  const [error, setError] = useState(/** @type {string | null} */ (null))
  const bloqueado = texto.trim() === '' || !listo || enCurso

  /** @param {{ preventDefault: () => void }} evento */
  async function confirmar(evento) {
    evento.preventDefault()
    if (bloqueado) return
    const resultado = await alConfirmar(texto.trim())
    // El único error que se corrige en la hoja: los demás la cierran y van en el detalle.
    if (!resultado.ok && resultado.fallo?.codigo === 'DATO_OBLIGATORIO') {
      setError(resultado.fallo.mensaje)
    }
  }

  /** @param {string} nuevo */
  function escribir(nuevo) {
    setTexto(nuevo)
    setError(null)
  }

  return { texto, escribir, error, bloqueado, confirmar }
}
