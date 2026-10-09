import { fallo } from '../_shared/servir.js'
import { validarSolicitud } from './validar.js'

/*
 * gestionar-usuario (IAdmin; SDD 5.3.4, Tabla 23, y 6.1.10 · RF-03). Crea la cuenta con su
 * contraseña inicial, actualiza sus datos y la desactiva o reactiva.
 *
 * Aquí está la lógica, con sus dependencias inyectadas, para probarla sin Deno ni red
 * (docs/adr/0012). `index.ts` solo arma las dependencias reales.
 */

const ROL_ADMINISTRADOR = 4

/**
 * @typedef {object} Dependencias
 * @property {string | null} token Token de la cabecera `Authorization`.
 * @property {(token: string) => Promise<string | null>} identificar `id` del usuario del token,
 *   verificado por Auth, o `null`.
 * @property {(id: string) => Promise<{ id: string, rol_id: number, activo: boolean } | null>} leerPerfil
 */

/**
 * @param {Record<string, unknown>} cuerpo
 * @param {Dependencias} dependencias
 * @returns {Promise<import('../_shared/servir.js').Resultado>}
 */
export async function manejar(cuerpo, { token, identificar, leerPerfil }) {
  // 1. Quién llama. La plataforma ya rechazó las peticiones sin un token válido (verify_jwt);
  // aquí se confirma la identidad y se exige un administrador activo. El rol sale de la tabla
  // `usuario`, nunca de los metadatos del token, que la persona puede cambiar.
  const usuarioId = token ? await identificar(token) : null
  if (!usuarioId) return fallo(401, 'SIN_SESION')

  const perfil = await leerPerfil(usuarioId)
  if (!perfil || !perfil.activo || perfil.rol_id !== ROL_ADMINISTRADOR) {
    return fallo(403, 'SIN_PERMISO')
  }

  // 2. La forma de la solicitud (CU-03 6b). Va después del permiso: a quien no es
  // administrador no se le dice nada más.
  const solicitud = validarSolicitud(cuerpo)
  if (!solicitud.ok) return fallo(400, 'DATO_OBLIGATORIO', solicitud.campos)

  // 3. Contrato del Sprint 3: las acciones llegan con RF-03.
  return fallo(501, 'NO_IMPLEMENTADO')
}
