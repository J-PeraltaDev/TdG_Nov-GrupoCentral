/*
 * Datos de la política de tratamiento de datos personales (RNF-18, Ley 1581 de 2012) que solo
 * la empresa puede dar. Lo que está en `null` no se muestra: nunca se inventa.
 *
 * Decreto 1377 de 2013, artículo 13: la política debe traer la razón social, el domicilio, la
 * dirección, el correo y el teléfono del responsable, y la fecha desde la que rige. Mientras
 * falten, la pantalla dice que es una versión preliminar (docs/decisiones-pendientes.md,
 * punto 26).
 */

/** Responsable del tratamiento. */
export const RESPONSABLE = Object.freeze({
  razonSocial: 'Agropecuaria Tumaradó S.A.S.',
  /** @type {string | null} */
  nit: null,
  /** @type {string | null} Dirección y municipio del domicilio. */
  direccion: null,
  /** @type {string | null} Correo que recibe las consultas y los reclamos. */
  correo: null,
  /** @type {string | null} */
  telefono: null,
})

/**
 * Fecha desde la que rige la política (`AAAA-MM-DD`). Se pone cuando la empresa la aprueba.
 *
 * @type {string | null}
 */
export const VIGENTE_DESDE = null
