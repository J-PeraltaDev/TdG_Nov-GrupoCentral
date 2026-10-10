/**
 * Nombre de cada estado de la novedad como lo ve la persona (SDD, Tabla 28). Lo usan el chip
 * de estado y los mensajes que nombran el estado («La novedad sigue En atención.»).
 *
 * @type {Record<import('../supabase/database.types').Database['public']['Enums']['estado_novedad'], string>}
 */
export const NOMBRE_DE_ESTADO = Object.freeze({
  registrada: 'Registrada',
  asignada: 'Asignada',
  en_atencion: 'En atención',
  escalada: 'Escalada',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
  resuelta: 'Resuelta',
  cerrada: 'Cerrada',
})
