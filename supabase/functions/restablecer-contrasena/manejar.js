import { fallo } from '../_shared/servir.js'
import { validarSolicitud } from './validar.js'

/*
 * restablecer-contrasena (IRecuperación; SDD 5.3.4, Tabla 23, y 6.1.10 · RF-02). Valida el
 * código temporal que entregó el administrador y fija la contraseña nueva.
 *
 * No exige sesión: la validez la da el código. Aquí está la lógica, para probarla sin Deno ni
 * red (docs/adr/0012). Nada de lo que recibe (correo, código, contraseña) se escribe en el
 * registro.
 */

/**
 * @param {Record<string, unknown>} cuerpo
 * @returns {Promise<import('../_shared/servir.js').Resultado>}
 */
export async function manejar(cuerpo) {
  // 1. La forma, antes de gastar el código.
  const solicitud = validarSolicitud(cuerpo)
  if (!solicitud.ok) return fallo(400, 'DATO_OBLIGATORIO', solicitud.campos)

  // 2. Contrato del Sprint 3: el código y la contraseña llegan con RF-02.
  return fallo(501, 'NO_IMPLEMENTADO')
}
