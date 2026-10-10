import { createContext, use } from 'react'

/**
 * @typedef {object} EstadoDeSesion
 * @property {'cargando' | 'sin_sesion' | 'con_sesion'} fase
 * @property {import('./sesion.js').Perfil | null} perfil
 * @property {'desactivado' | null} [motivoDeSalida] Por qué se cerró la sesión, si no la cerró
 *   la persona: un administrador la desactivó mientras la tenía abierta (CU-01 4b).
 * @property {(correo: string, contrasena: string) => ReturnType<typeof import('./sesion.js').iniciarSesion>} ingresar
 * @property {() => Promise<void>} salir
 */

/** @type {import('react').Context<EstadoDeSesion | null>} */
export const ContextoSesion = createContext(null)

/** Sesión y perfil del usuario. Debe usarse dentro de `ProveedorSesion`. */
export function useSesion() {
  const sesion = use(ContextoSesion)
  if (!sesion) throw new Error('useSesion debe usarse dentro de <ProveedorSesion>.')
  return sesion
}
