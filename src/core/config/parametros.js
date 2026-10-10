/**
 * Parámetros configurables del sistema (SDD 7.3, «decisiones de diseño por validar»).
 *
 * Los valores son los que propone el plan de arranque del Objetivo 3 y están pendientes de
 * validar con la empresa (docs/decisiones-pendientes.md, punto 4). Los que tienen un
 * equivalente en la base de datos deben cambiarse en los dos lados a la vez.
 */

/** Descripción de la novedad (RF-05). En la BD: CHECK de `novedad.descripcion` (Sprint 1). */
export const DESCRIPCION_MAX_CARACTERES = 500

/**
 * Motivo, justificación, observación y solución (RF-11 a RF-17): los textos que quedan en el
 * historial. En la BD: `private.texto_obligatorio` (Sprint 2).
 */
export const OBSERVACION_MAX_CARACTERES = 500

/**
 * Nombre de un tipo de falla nuevo (RF-14). Solo limita el campo: la base de datos no le pone
 * máximo. Cabe en una etiqueta y en las tablas de los reportes.
 */
export const TIPO_FALLA_NOMBRE_MAX_CARACTERES = 60

/** Código temporal de recuperación de contraseña (RF-02). Se usa en el Sprint 3. */
export const CODIGO_RECUPERACION_VIGENCIA_MINUTOS = 30

/** Evidencias fotográficas (RF-08). Se usan en el Sprint 4. */
export const FOTO_LADO_MAYOR_PX = 1600
export const FOTO_CALIDAD_JPEG = 0.7
export const FOTO_PESO_MAXIMO_BYTES = 1024 * 1024
export const FOTOS_MAXIMO_POR_NOVEDAD = 3

/** Zona horaria de todas las fechas que muestra la aplicación (SDD 6.1.11). */
export const ZONA_HORARIA = 'America/Bogota'
