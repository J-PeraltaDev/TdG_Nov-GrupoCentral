/*
 * Aviso de que el perfil guardado puede estar desactualizado (RF-03 / CU-01 4b).
 *
 * Un administrador puede desactivar a alguien, o cambiarle el rol o la finca, mientras esa
 * persona tiene la aplicación abierta. La base de datos deja de responderle de inmediato, pero
 * el menú y las pantallas siguen siendo los de antes hasta que se relea el perfil. La primera
 * señal suele ser una acción que responde `SIN_PERMISO`: quien la recibe lo avisa aquí, y el
 * proveedor de la sesión, que es quien escucha, relee el perfil.
 *
 * Es un aviso, no un estado: las pantallas no necesitan la sesión para darlo.
 */

/** @type {Set<() => void>} */
const oyentes = new Set()

/** Pide que el perfil se vuelva a leer del servidor. */
export function pedirRevisionDelPerfil() {
  for (const oyente of oyentes) oyente()
}

/**
 * @param {() => void} oyente
 * @returns {() => void} Para dejar de escuchar.
 */
export function alPedirRevisionDelPerfil(oyente) {
  oyentes.add(oyente)
  return () => oyentes.delete(oyente)
}

/**
 * Ejecuta una acción y, si responde `SIN_PERMISO`, pide revisar el perfil. El error sigue su
 * camino: quien llama lo muestra como siempre.
 *
 * @template T
 * @param {() => Promise<T>} accion
 * @returns {Promise<T>}
 */
export async function vigilarPermiso(accion) {
  try {
    return await accion()
  } catch (error) {
    if (String(/** @type {any} */ (error)?.message ?? '').trim() === 'SIN_PERMISO') {
      pedirRevisionDelPerfil()
    }
    throw error
  }
}
