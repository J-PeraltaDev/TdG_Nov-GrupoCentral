import { fallo } from '../_shared/servir.js'
import { validarSolicitud } from './validar.js'

/*
 * restablecer-contrasena (IRecuperación; SDD 5.3.4, Tabla 23, y 6.1.10 · RF-02). Valida el
 * código temporal que entregó el administrador y fija la contraseña nueva.
 *
 * No exige sesión: la validez la da el código. Aquí está la lógica, con sus dependencias
 * inyectadas para probarla sin Deno ni red (docs/adr/0012); `index.ts` arma las reales. Nada de
 * lo que recibe (correo, código, contraseña) se escribe en el registro ni vuelve en la
 * respuesta.
 */

/** Lo que la base de datos responde cuando el código no sirve: se le pasa tal cual a la
 * pantalla, que con uno deja corregir (CU-02 9b) y con el otro manda a pedir otro (9a). */
const RECHAZOS = ['CODIGO_INVALIDO', 'CODIGO_VENCIDO']

/**
 * @typedef {object} Recuperacion
 * @property {(correo: string, codigo: string) => Promise<{ resultado: string | null, usuarioId: string | null }>} consumirCodigo
 *   Valida el código y lo gasta: `OK` con el usuario, `CODIGO_INVALIDO` o `CODIGO_VENCIDO`.
 * @property {(usuarioId: string, contrasena: string) => Promise<void>} fijarContrasena
 */

/**
 * @param {Record<string, unknown>} cuerpo
 * @param {Recuperacion} recuperacion
 * @returns {Promise<import('../_shared/servir.js').Resultado>}
 */
export async function manejar(cuerpo, { consumirCodigo, fijarContrasena }) {
  // 1. La forma, antes de gastar el código: una contraseña que no cumple la regla no le
  // cuesta un intento a nadie.
  const solicitud = validarSolicitud(cuerpo)
  if (!solicitud.ok) return fallo(400, 'DATO_OBLIGATORIO', solicitud.campos)
  const { correo, codigo, contrasena } = solicitud.datos

  // 2. El código. La base de datos lo compara con su resumen, cuenta los intentos y lo deja
  // usado; aquí no se sabe si el correo existe.
  const { resultado, usuarioId } = await consumirCodigo(correo, codigo)
  if (RECHAZOS.includes(resultado)) return fallo(400, resultado)
  if (resultado !== 'OK' || !usuarioId) return fallo(500, 'ERROR')

  // 3. La contraseña. El código ya quedó gastado: si Auth falla, la persona pide otro. Es el
  // lado seguro: un código nunca sirve dos veces.
  await fijarContrasena(usuarioId, contrasena)
  return { estado: 200, cuerpo: { ok: true } }
}
