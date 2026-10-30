/*
 * Reglas de la bandeja del área que no dependen de la pantalla (RF-09, SDD 6.1.11).
 */

/**
 * Las pestañas: separan lo que depende del aprobador de lo que espera a otra persona y de lo
 * que ya terminó. El orden es el de Figma, más «Finalizadas» al final (cambio 48), y el primer
 * elemento es la pestaña inicial.
 */
export const PESTANAS = [
  { id: 'por_atender', nombre: 'Por atender', estados: ['asignada', 'aprobada'] },
  { id: 'en_atencion', nombre: 'En atención', estados: ['en_atencion'] },
  { id: 'en_espera', nombre: 'En espera', estados: ['escalada', 'resuelta'] },
  // Los estados finales ya no esperan a nadie: no son pendientes y van de la más reciente a la
  // más antigua.
  { id: 'finalizadas', nombre: 'Finalizadas', estados: ['rechazada', 'cerrada'], final: true },
]

/**
 * @typedef {object} ResumenDeTransiciones
 * @property {string | null} reasignadaDesde Área de la que llegó, si su última asignación fue
 *   una reasignación.
 * @property {string | null} justificacion La del último escalamiento.
 * @property {{ observacion: string | null, usuario: string | null, fecha_hora: string } | null} decision
 *   La última aprobación del director.
 */

/**
 * Resume, por novedad, lo que su historial explica en la bandeja del escritorio (Figma 12):
 * de qué área fue reasignada, con qué justificación se escaló y qué decidió el director.
 *
 * @param {object[]} transiciones Las de `listarTransicionesDeBandeja`, en orden.
 * @returns {Record<string, ResumenDeTransiciones>} Por `novedad_id`.
 */
export function resumirTransiciones(transiciones) {
  /** @type {Record<string, ResumenDeTransiciones>} */
  const resumen = {}
  for (const transicion of transiciones) {
    const deLaNovedad = (resumen[transicion.novedad_id] ??= {
      reasignadaDesde: null,
      justificacion: null,
      decision: null,
    })
    // Vienen en orden: la última de cada tipo es la que queda.
    if (transicion.estado_nuevo === 'asignada') {
      deLaNovedad.reasignadaDesde = transicion.area_anterior?.nombre ?? null
    } else if (transicion.estado_nuevo === 'escalada') {
      deLaNovedad.justificacion = transicion.observacion
    } else if (transicion.estado_nuevo === 'aprobada') {
      deLaNovedad.decision = {
        observacion: transicion.observacion,
        usuario: transicion.usuario?.nombre ?? null,
        fecha_hora: transicion.fecha_hora,
      }
    }
  }
  return resumen
}

/**
 * Nota que acompaña al estado en la tabla del escritorio, o `null` si no hay nada que aclarar.
 *
 * @param {{ estado: string }} novedad
 * @param {ResumenDeTransiciones} [resumen]
 */
export function notaDelEstado(novedad, resumen) {
  if (novedad.estado === 'aprobada') return 'Aprobada por el director'
  if (novedad.estado === 'asignada' && resumen?.reasignadaDesde) {
    return `Reasignada desde ${resumen.reasignadaDesde}`
  }
  return null
}
