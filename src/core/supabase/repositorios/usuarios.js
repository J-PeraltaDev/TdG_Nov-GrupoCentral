import { supabase } from '../cliente.js'
import { invocarFuncion } from './funciones.js'

/*
 * Repositorio de usuarios (RF-03; SDD 6.1.10). La lista sale de una función de la base de
 * datos, porque la API de datos no expone el correo (ADR 0010). Las escrituras pasan por la
 * Edge Function `gestionar-usuario`, que es la que puede crear y suspender cuentas en Auth.
 */

/**
 * @typedef {object} Usuario
 * @property {string} id
 * @property {string} nombre
 * @property {string} correo
 * @property {number} rol_id
 * @property {string | null} finca_id
 * @property {string | null} area_id
 * @property {boolean} activo
 * @property {string} [creado_en]
 * @property {string | null} [ultimo_ingreso]
 */

/**
 * Todos los usuarios, activos e inactivos, con su correo y su último ingreso. Solo responde
 * a un administrador activo; a los demás, `SIN_PERMISO`.
 *
 * @returns {Promise<Usuario[]>}
 */
export async function listarUsuarios() {
  const { data, error } = await supabase.rpc('listar_usuarios')
  if (error) throw error
  return data
}

/** @returns {Promise<Usuario>} */
async function gestionar(solicitud) {
  const { usuario } = await invocarFuncion('gestionar-usuario', solicitud)
  return usuario
}

/**
 * Crea la cuenta con su contraseña inicial (CU-03, pasos 4 a 6).
 *
 * @param {object} datos
 * @param {string} datos.nombre
 * @param {string} datos.correo
 * @param {string} datos.contrasena_inicial
 * @param {number} datos.rol_id
 * @param {string | null} [datos.finca_id] Solo el reportante.
 * @param {string | null} [datos.area_id] Solo el aprobador de área.
 * @param {boolean} [datos.activo]
 */
export function crearUsuario(datos) {
  return gestionar({ accion: 'crear', ...datos })
}

/**
 * Cambia el nombre, el rol y la finca o el área. El correo no se edita.
 *
 * @param {string} usuarioId
 * @param {{ nombre: string, rol_id: number, finca_id?: string | null, area_id?: string | null, activo?: boolean }} datos
 */
export function actualizarUsuario(usuarioId, datos) {
  return gestionar({ accion: 'actualizar', usuario_id: usuarioId, ...datos })
}

/** Le impide el ingreso y conserva sus registros (CU-03 3a). @param {string} usuarioId */
export function desactivarUsuario(usuarioId) {
  return gestionar({ accion: 'desactivar', usuario_id: usuarioId })
}

/** @param {string} usuarioId */
export function activarUsuario(usuarioId) {
  return gestionar({ accion: 'activar', usuario_id: usuarioId })
}
