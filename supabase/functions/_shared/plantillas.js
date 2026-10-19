/*
 * Textos de los avisos (RF-30 y RF-31; SDD 6.1.6, Tabla 33). Una sola copia para la pantalla 10
 * y para enviar-push: el cliente la importa directo (plan del Sprint 5, decisión 30). Módulo
 * puro (docs/adr/0012).
 *
 * notificacion solo guarda el estado nuevo; el resto del contexto sale del rol del destinatario,
 * porque cada transición avisa a roles distintos: el reportante solo recibe «asignada» por una
 * reasignación, los aprobadores solo reciben «en atención» cuando la falla persiste y los
 * administradores solo reciben «resuelta» por un tipo de falla nuevo.
 *
 * El código no va en el texto: la pantalla 10 lo pone arriba de cada aviso y el push, en el
 * título (decisiones 31 y 47).
 */

const ROL = { REPORTANTE: 1, APROBADOR: 2, DIRECTOR: 3, ADMINISTRADOR: 4 }

const ESTADO = {
  registrada: 'Registrada',
  asignada: 'Asignada',
  en_atencion: 'En atención',
  escalada: 'Escalada',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
  resuelta: 'Resuelta',
  cerrada: 'Cerrada',
}

const PRIORIDAD = { critico: 'Crítico', alto: 'Alto', normal: 'Normal', bajo: 'Bajo' }

/**
 * @typedef {object} NovedadDelAviso Los datos actuales de la novedad.
 * @property {number} codigo
 * @property {string} finca
 * @property {string} area
 * @property {string} prioridad
 * @property {string | null} [tipo_falla]
 */

/**
 * Texto de un aviso según el estado nuevo y el rol de quien lo recibe (Tabla 33).
 *
 * @param {{ estado_nuevo: string }} aviso
 * @param {number} rolId Rol del destinatario.
 * @param {NovedadDelAviso} novedad
 */
export function textoDelAviso({ estado_nuevo: estado }, rolId, novedad) {
  const { finca, area, prioridad, tipo_falla: tipo } = novedad
  const reportante = rolId === ROL.REPORTANTE

  if (estado === 'asignada' && reportante) return `Tu novedad fue reasignada a ${area}.`
  if (estado === 'asignada' && rolId === ROL.APROBADOR) {
    return `Nueva novedad de ${finca} · ${PRIORIDAD[prioridad] ?? prioridad}.`
  }
  if (estado === 'en_atencion' && reportante) return `${area} tomó tu novedad para atención.`
  if (estado === 'en_atencion' && rolId === ROL.APROBADOR) {
    return `La finca ${finca} indica que la falla persiste.`
  }
  if (estado === 'escalada' && rolId === ROL.DIRECTOR) {
    return `Escalada por ${area}: requiere tu decisión.`
  }
  if (estado === 'escalada' && reportante) {
    return 'Tu novedad fue escalada al director de agricultura.'
  }
  if (estado === 'aprobada') {
    return `El director de agricultura aprobó la novedad; vuelve a ${area} para ejecutarla.`
  }
  if (estado === 'rechazada') return 'La novedad fue rechazada. Ábrela para ver el motivo.'
  if (estado === 'resuelta' && reportante) {
    return `${area} registró la solución. Confirma si quedó resuelta.`
  }
  if (estado === 'resuelta' && rolId === ROL.ADMINISTRADOR) {
    return tipo
      ? `Se creó el tipo de falla «${tipo}»; revísalo en el catálogo.`
      : 'Se creó un tipo de falla nuevo; revísalo en el catálogo.'
  }
  if (estado === 'cerrada' && rolId === ROL.APROBADOR) {
    return `La finca ${finca} confirmó el cierre.`
  }
  return `La novedad pasó a «${ESTADO[estado] ?? estado}».`
}

/**
 * Lo que recibe el service worker: título, cuerpo y a dónde lleva al tocarlo. Sin la
 * descripción, que es texto libre y se vería en la pantalla bloqueada (RNF-18).
 *
 * @param {{ id: string, novedad_id: string, estado_nuevo: string }} aviso
 * @param {number} rolId
 * @param {NovedadDelAviso} novedad
 */
export function mensajeDelPush(aviso, rolId, novedad) {
  const codigo = `NOV-${String(novedad.codigo).padStart(4, '0')}`
  return {
    titulo: `${codigo} · ${ESTADO[aviso.estado_nuevo] ?? aviso.estado_nuevo}`,
    cuerpo: textoDelAviso(aviso, rolId, novedad),
    url: `/novedades/${aviso.novedad_id}?aviso=${aviso.id}`,
    novedad_id: aviso.novedad_id,
  }
}
