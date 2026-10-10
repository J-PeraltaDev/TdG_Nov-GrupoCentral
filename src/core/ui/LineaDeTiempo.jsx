import { firmaDe } from '../sesion/roles.js'
import { formatearFechaCorta } from '../utils/fechas.js'
import { Estado } from './Estado.jsx'
import { Icono } from './Icono.jsx'
import iconoPasaA from './iconos/arrow_forward.svg'
import iconoInmutable from './iconos/lock.svg'

/**
 * @typedef {object} Transicion Fila de `historial_transicion` con sus nombres.
 * @property {number} id
 * @property {string | null} estado_anterior Nulo en la creación de la novedad.
 * @property {string} estado_nuevo
 * @property {string | null} observacion
 * @property {string} fecha_hora
 * @property {{ nombre: string } | null} area_anterior Solo en una reasignación.
 * @property {{ nombre: string } | null} area_nueva En el enrutamiento y en una reasignación.
 * @property {{ nombre: string, rol_id: number, area: string | null } | null} usuario
 */

/**
 * El enrutamiento (registrada → asignada) queda a nombre del reportante, pero lo hace el
 * sistema en la misma transacción del registro: así se presenta (SDD, Tabla 30).
 *
 * @param {Transicion} transicion
 */
const esDelSistema = (transicion) =>
  transicion.estado_anterior === 'registrada' && transicion.estado_nuevo === 'asignada'

/** «Carlos Mario Restrepo · Aprobador · Mantenimiento» (SDD 5.2.5: usuario y rol). */
function autor(transicion) {
  return esDelSistema(transicion) ? 'Sistema' : firmaDe(transicion.usuario)
}

/** « · Área: Sistemas» después de la fecha, si la transición cambió el área. */
function cambioDeArea(transicion) {
  const nueva = transicion.area_nueva?.nombre
  if (!nueva) return ''
  const anterior = transicion.area_anterior?.nombre
  return anterior ? ` · Área: de ${anterior} a ${nueva}` : ` · Área: ${nueva}`
}

/**
 * Línea de tiempo de una novedad (Figma: «Riel» y «Transición», 3:817 y 4:2212): cada cambio
 * de estado o de área con quién lo hizo, cuándo y su observación (RF-16, RF-18). No decide
 * el orden: muestra las transiciones como llegan, de la más reciente a la más antigua.
 *
 * @param {object} props
 * @param {Transicion[]} props.transiciones De la más reciente a la más antigua.
 * @param {boolean} [props.conPie] Aclara que el historial no se puede cambiar (pantalla 22).
 */
export function LineaDeTiempo({ transiciones, conPie = false }) {
  return (
    <>
      <ol className="flex flex-col gap-3">
        {transiciones.map((transicion, indice) => {
          const ultima = indice === transiciones.length - 1
          return (
            <li key={transicion.id} className="flex items-stretch gap-3">
              {/* Riel: el punto de la transición más reciente va en el color primario. */}
              <span
                aria-hidden="true"
                className="flex w-3.5 flex-none flex-col items-center gap-1 pt-1"
              >
                <span
                  className={`size-3 flex-none rounded-full ${indice === 0 ? 'bg-primario' : 'bg-gris-300'}`}
                />
                {ultima ? null : <span className="w-0.5 flex-1 bg-borde" />}
              </span>

              <div className="flex min-w-0 flex-1 flex-col gap-1 pb-4">
                <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                  {transicion.estado_anterior ? (
                    <>
                      <Estado estado={transicion.estado_anterior} />
                      <Icono src={iconoPasaA} tamano={14} className="text-texto-secundario" />
                      <span className="sr-only">pasa a</span>
                    </>
                  ) : null}
                  <Estado estado={transicion.estado_nuevo} />
                </p>
                <p className="text-etiqueta-fuerte break-words text-texto">{autor(transicion)}</p>
                <p className="text-auxiliar text-texto-secundario">
                  <time dateTime={transicion.fecha_hora}>
                    {formatearFechaCorta(transicion.fecha_hora)}
                  </time>
                  {cambioDeArea(transicion)}
                </p>
                {transicion.observacion ? (
                  <p className="rounded-lg bg-gris-100 px-2.5 py-2 text-cuerpo-pequeno break-words text-texto">
                    {transicion.observacion}
                  </p>
                ) : null}
              </div>
            </li>
          )
        })}
      </ol>

      {conPie ? (
        <p className="flex items-center gap-1.5 pb-3 text-auxiliar text-texto-secundario">
          <Icono src={iconoInmutable} tamano={14} />
          El historial no se puede editar ni borrar.
        </p>
      ) : null}
    </>
  )
}
