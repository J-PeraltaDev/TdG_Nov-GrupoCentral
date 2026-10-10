/*
 * Insignias del menú: cuántas cosas esperan a la persona en una pantalla. En este sprint solo
 * hay una, la de «Recuperación de contraseñas» del administrador: una solicitud no genera un
 * aviso, porque no es de una novedad, así que la insignia es la única señal de que llegó. Las
 * demás insignias de Figma llegan con los avisos, en el Sprint 5.
 */

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
