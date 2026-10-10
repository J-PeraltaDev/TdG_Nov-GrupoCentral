import { OBSERVACION_MAX_CARACTERES } from '../../core/config/parametros.js'

/**
 * Motivos frecuentes de rechazo: accesos rápidos de la hoja 16, con los textos exactos de
 * Figma (3:1476). No son un catálogo: el motivo se guarda como texto libre en el historial.
 */
export const MOTIVOS_FRECUENTES = Object.freeze([
  'Duplicada',
  'Es una solicitud de insumos',
  'No corresponde a Mantenimiento ni a Sistemas',
])

/**
 * El motivo frecuente con el que empieza el texto, si empieza con alguno. «Duplicadas las
 * dos» no cuenta: después del motivo debe venir el final, un espacio o un signo.
 *
 * @param {string} motivo
 * @returns {string | null}
 */
export function motivoFrecuenteDe(motivo) {
  return (
    MOTIVOS_FRECUENTES.find(
      (frecuente) =>
        motivo.startsWith(frecuente) && /^(?:$|[\s:.,;])/.test(motivo.slice(frecuente.length)),
    ) ?? null
  )
}

/**
 * Lo que queda escrito al tocar un motivo frecuente. Se pone al comienzo y conserva lo que la
 * persona ya escribió, como el ejemplo de Figma («Duplicada: ya está en atención como
 * NOV-0149.»). Si el texto ya empezaba con otro motivo frecuente, lo reemplaza; si empezaba
 * con el mismo, lo quita.
 *
 * @param {string} motivo Lo que hay en el campo.
 * @param {string} frecuente El motivo frecuente que se tocó.
 * @returns {string}
 */
export function alternarMotivoFrecuente(motivo, frecuente) {
  const actual = motivoFrecuenteDe(motivo)
  const detalle = (actual ? motivo.slice(actual.length).replace(/^:/, '') : motivo).trim()
  if (actual === frecuente) return detalle
  const nuevo = detalle ? `${frecuente}: ${detalle}` : frecuente
  return nuevo.slice(0, OBSERVACION_MAX_CARACTERES)
}
