import { esContrasenaValida } from '../_shared/contrasena.js'
import { esUuid, falta, normalizarCorreo } from '../_shared/validaciones.js'

/*
 * Forma de la solicitud de `gestionar-usuario` (SDD, Tabla 23; RF-03 / CU-03 6b). Dice qué
 * campos están mal, para que el formulario 29 los señale uno por uno.
 *
 * Aquí solo se revisa lo que se puede saber sin consultar nada. Que la finca o el área existan
 * y estén activas, y que el correo no esté registrado, lo revisa el manejador.
 */

const ACCIONES = ['crear', 'actualizar', 'desactivar', 'activar']
const NOMBRE_MAX_CARACTERES = 120

const ROL = { REPORTANTE: 1, APROBADOR_AREA: 2 }

/** El nombre sin espacios sobrantes, o `null` si está vacío o es demasiado largo. */
function normalizarNombre(valor) {
  if (typeof valor !== 'string') return null
  const nombre = valor.trim().replace(/\s+/g, ' ')
  return nombre !== '' && nombre.length <= NOMBRE_MAX_CARACTERES ? nombre : null
}

/**
 * La misma regla de la restricción `usuario_alcance_segun_rol`: el reportante tiene finca y no
 * área; el aprobador, área y no finca; el director y el administrador, ninguna de las dos.
 *
 * @returns {string[]} Campos que no cumplen.
 */
function alcanceInvalido(rolId, fincaId, areaId) {
  const pideFinca = rolId === ROL.REPORTANTE
  const pideArea = rolId === ROL.APROBADOR_AREA
  const campos = []
  if (pideFinca ? !esUuid(fincaId) : !falta(fincaId)) campos.push('finca_id')
  if (pideArea ? !esUuid(areaId) : !falta(areaId)) campos.push('area_id')
  return campos
}

/**
 * @param {Record<string, unknown>} cuerpo
 * @returns {{ ok: true, datos: Record<string, any> } | { ok: false, campos: string[] }}
 */
export function validarSolicitud(cuerpo) {
  const { accion } = cuerpo
  if (typeof accion !== 'string' || !ACCIONES.includes(accion)) {
    return { ok: false, campos: ['accion'] }
  }

  const campos = []

  if (accion === 'desactivar' || accion === 'activar') {
    if (!esUuid(cuerpo.usuario_id)) campos.push('usuario_id')
    return campos.length > 0
      ? { ok: false, campos }
      : { ok: true, datos: { accion, usuario_id: cuerpo.usuario_id } }
  }

  // `crear` y `actualizar` comparten el nombre, el rol y su alcance.
  const esCrear = accion === 'crear'
  const nombre = normalizarNombre(cuerpo.nombre)
  const correo = esCrear ? normalizarCorreo(cuerpo.correo) : null
  const rolValido = Number.isInteger(cuerpo.rol_id) && cuerpo.rol_id >= 1 && cuerpo.rol_id <= 4

  if (!esCrear && !esUuid(cuerpo.usuario_id)) campos.push('usuario_id')
  if (!nombre) campos.push('nombre')
  if (esCrear && !correo) campos.push('correo')
  if (esCrear && !esContrasenaValida(cuerpo.contrasena_inicial)) campos.push('contrasena_inicial')
  if (!rolValido) campos.push('rol_id')
  // Sin un rol válido no se sabe qué alcance pedir.
  if (rolValido) campos.push(...alcanceInvalido(cuerpo.rol_id, cuerpo.finca_id, cuerpo.area_id))
  if (!falta(cuerpo.activo) && typeof cuerpo.activo !== 'boolean') campos.push('activo')

  if (campos.length > 0) return { ok: false, campos }

  const comunes = {
    nombre,
    rol_id: cuerpo.rol_id,
    finca_id: cuerpo.finca_id ?? null,
    area_id: cuerpo.area_id ?? null,
  }
  return esCrear
    ? {
        ok: true,
        datos: {
          accion,
          nombre,
          correo,
          contrasena_inicial: cuerpo.contrasena_inicial,
          rol_id: comunes.rol_id,
          finca_id: comunes.finca_id,
          area_id: comunes.area_id,
          // Una cuenta nueva nace activa, salvo que el formulario diga lo contrario.
          activo: cuerpo.activo ?? true,
        },
      }
    : {
        ok: true,
        datos: {
          accion,
          usuario_id: cuerpo.usuario_id,
          ...comunes,
          // `null`: el estado no cambia.
          activo: cuerpo.activo ?? null,
        },
      }
}
