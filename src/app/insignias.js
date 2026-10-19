/*
 * Insignias del menú y de la campana: cuántas cosas esperan a la persona en una pantalla. Los
 * avisos sin leer (RF-30), las novedades por atender del aprobador y, para el administrador, las
 * solicitudes de recuperación: una solicitud no genera un aviso, porque no es de una novedad, así
 * que la insignia es la única señal de que llegó.
 */

/** Qué cuenta la insignia de cada pantalla, en singular y en plural, para el lector de pantalla. */
const TEXTOS = {
  '/avisos': ['aviso sin leer', 'avisos sin leer'],
  '/bandeja': ['novedad por atender', 'novedades por atender'],
  '/recuperacion': ['solicitud pendiente', 'solicitudes pendientes'],
}

/**
 * Lo que oye el lector de pantalla después del nombre de la pantalla: «, 2 avisos sin leer».
 *
 * @param {number} cantidad
 * @param {string} [ruta] Por omisión, la recuperación de contraseñas (lo que «Cuenta» suma en
 *   el teléfono del administrador).
 */
export function textoDeInsignia(cantidad, ruta = '/recuperacion') {
  const [singular, plural] = TEXTOS[ruta] ?? TEXTOS['/recuperacion']
  return `, ${cantidad === 1 ? `1 ${singular}` : `${cantidad} ${plural}`}`
}

/** @type {Set<() => void>} */
const oyentes = new Set()

/** Pide contar de nuevo ya: una pantalla acaba de cambiar lo que se cuenta. */
export function pedirConteoDeInsignias() {
  for (const oyente of oyentes) oyente()
}

/**
 * @param {() => void} oyente
 * @returns {() => void} Deja de escuchar.
 */
export function alPedirConteoDeInsignias(oyente) {
  oyentes.add(oyente)
  return () => oyentes.delete(oyente)
}
