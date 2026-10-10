import { useCallback, useState } from 'react'
import { traducirError } from '../../core/errores/traducir.js'
import { NOMBRE_DE_ESTADO } from '../../core/utils/estados.js'

/**
 * @typedef {object} AvisoDeAccion
 * @property {'exito' | 'error'} tipo
 * @property {string} mensaje
 * @property {(() => void) | null} reintentar Solo cuando la acción no llegó al servidor.
 */

/**
 * @typedef {object} OpcionesDeAccion
 * @property {string} [exito] Aviso temporal cuando la acción termina bien.
 * @property {string[]} [codigosPropios] Códigos de la Tabla 22 que quien llama muestra en su
 *   propio formulario (por ejemplo, `FECHA_INVALIDA`): para esos no se pinta el aviso común.
 * @property {(resultado: any) => void} [alTerminar] Reemplaza a `alCambiar` cuando la acción
 *   saca la novedad de la pantalla (por ejemplo, al reasignarla).
 */

/**
 * Ejecuta una acción sobre una novedad (una función de transición) y trata sus errores igual
 * en todas (RF-10 a RF-17, SDD Tabla 22):
 *
 * - `TRANSICION_INVALIDA`: alguien cambió el estado antes; se avisa y se recarga.
 * - Error de red: la acción no se aplicó; se dice en qué estado sigue la novedad y se ofrece
 *   reintentar (pantalla 14-C). No hay cola ni reintento automático: todas las transiciones
 *   requieren conexión (RF-25).
 * - Los demás (sin permiso, sesión vencida…): su mensaje.
 *
 * @param {object} opciones
 * @param {string} opciones.estado Estado vigente de la novedad.
 * @param {() => void} opciones.alCambiar Recarga los datos de la pantalla.
 */
export function useAccion({ estado, alCambiar }) {
  const [enCurso, setEnCurso] = useState(false)
  const [aviso, setAviso] = useState(/** @type {AvisoDeAccion | null} */ (null))

  const ejecutar = useCallback(
    /**
     * @param {() => Promise<any>} accion
     * @param {OpcionesDeAccion} [opciones]
     * @returns {Promise<{ ok: true, resultado: any } | { ok: false, fallo: import('../../core/errores/traducir.js').ErrorTraducido }>}
     */
    async function ejecutar(accion, opciones = {}) {
      const { exito, codigosPropios = [], alTerminar } = opciones
      setEnCurso(true)
      setAviso(null)
      try {
        const resultado = await accion()
        if (exito) setAviso({ tipo: 'exito', mensaje: exito, reintentar: null })
        ;(alTerminar ?? alCambiar)(resultado)
        return { ok: true, resultado }
      } catch (error) {
        const fallo = traducirError(error)
        if (fallo.tipo === 'red') {
          setAviso({
            tipo: 'error',
            mensaje: `No se aplicó: se perdió la conexión. La novedad sigue ${NOMBRE_DE_ESTADO[estado] ?? 'igual'}.`,
            reintentar: () => ejecutar(accion, opciones),
          })
        } else if (!codigosPropios.includes(fallo.codigo)) {
          setAviso({ tipo: 'error', mensaje: fallo.mensaje, reintentar: null })
          // Otra persona ya actuó sobre la novedad: lo que se ve está desactualizado.
          if (fallo.codigo === 'TRANSICION_INVALIDA') alCambiar()
        }
        return { ok: false, fallo }
      } finally {
        setEnCurso(false)
      }
    },
    [estado, alCambiar],
  )

  const cerrarAviso = useCallback(() => setAviso(null), [])

  return { ejecutar, enCurso, aviso, cerrarAviso }
}
