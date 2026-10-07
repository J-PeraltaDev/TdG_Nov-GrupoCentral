import { DESCRIPCION_MAX_CARACTERES } from '../../core/config/parametros.js'

/**
 * Valida el formulario de registro (RF-05, CU-05 4a · pantalla 05-C). Los mensajes son los de
 * Figma. El servidor valida lo mismo en `registrar_novedad`.
 *
 * @param {object} datos
 * @param {string} datos.descripcion
 * @param {string} datos.prioridad
 * @param {string} datos.areaId
 * @returns {{ descripcion?: string, prioridad?: string, area?: string }} Un mensaje por campo
 *   con error; vacío si todo está bien.
 */
export function validarNovedad({ descripcion, prioridad, areaId }) {
  /** @type {{ descripcion?: string, prioridad?: string, area?: string }} */
  const errores = {}
  const texto = (descripcion ?? '').trim()

  if (texto === '') errores.descripcion = 'Describe la novedad'
  else if (texto.length > DESCRIPCION_MAX_CARACTERES) {
    errores.descripcion = `Usa máximo ${DESCRIPCION_MAX_CARACTERES} caracteres`
  }
  if (!prioridad) errores.prioridad = 'Elige la prioridad'
  if (!areaId) errores.area = 'Elige el área'

  return errores
}

/**
 * «Falta 1 dato obligatorio» o «Faltan 3 datos obligatorios».
 *
 * @param {number} cantidad
 */
export function resumenDeFaltantes(cantidad) {
  return cantidad === 1 ? 'Falta 1 dato obligatorio' : `Faltan ${cantidad} datos obligatorios`
}
