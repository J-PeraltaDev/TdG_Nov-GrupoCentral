import { esContrasenaValida } from '../_shared/contrasena.js'
import { normalizarCorreo } from '../_shared/validaciones.js'

/*
 * Forma de la solicitud de `restablecer-contrasena` (SDD, Tabla 23; RF-02 / CU-02 8). Se revisa
 * antes de tocar el código temporal: una solicitud mal formada no le gasta un intento a nadie.
 */

/**
 * @param {Record<string, unknown>} cuerpo
 * @returns {{ ok: true, datos: { correo: string, codigo: string, contrasena: string } } | { ok: false, campos: string[] }}
 */
export function validarSolicitud(cuerpo) {
  const correo = normalizarCorreo(cuerpo.correo)
  // La pantalla 32 lo muestra en dos grupos («482 719»): los espacios no cuentan.
  const codigo = typeof cuerpo.codigo === 'string' ? cuerpo.codigo.replace(/\s/g, '') : ''

  const campos = []
  if (!correo) campos.push('correo')
  if (!/^\d{6}$/.test(codigo)) campos.push('codigo')
  if (!esContrasenaValida(cuerpo.contrasena)) campos.push('contrasena')

  return campos.length > 0
    ? { ok: false, campos }
    : { ok: true, datos: { correo, codigo, contrasena: cuerpo.contrasena } }
}
