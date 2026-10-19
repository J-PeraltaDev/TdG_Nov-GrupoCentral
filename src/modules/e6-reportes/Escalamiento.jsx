import { Link } from 'react-router'
import { Estado } from '../../core/ui/Estado.jsx'
import { EtiquetaDeArea } from '../../core/ui/EtiquetasDeNovedad.jsx'
import { Icono } from '../../core/ui/Icono.jsx'
import iconoEscaladas from '../../core/ui/iconos/arrow_circle_up.svg'
import { presentacionDe } from '../../core/ui/presentacionDelArea.js'
import { formatearCodigo } from '../../core/utils/codigo.js'
import { formatearDuracion } from '../../core/utils/fechas.js'
import { formatearPorcentaje } from './cifras.js'
import { BarraApilada } from './graficos/BarraApilada.jsx'
import { SinNovedadesEnElPeriodo } from './SinNovedadesEnElPeriodo.jsx'

/*
 * Pantallas 25 y 25-B · Escalamiento (RF-28, CU-28; Figma 5:1530 y 5:1776). Lo que llega de
 * `rpt_escalamiento` para el período: la proporción escalada, por área, las decisiones del
 * director y la lista de las escaladas, que abren su detalle (decisión 24).
 */

const TARJETA = 'rounded-xl border border-borde bg-superficie p-5'
const ENCABEZADO = 'px-2 py-2.5 text-left text-auxiliar-fuerte text-texto-secundario'
const CELDA = 'px-2 py-2.5 text-cuerpo-pequeno text-texto'

const deRegistradas = (escaladas, registradas) => `${escaladas} de ${registradas}`

/** La decisión del director: aprobada o rechazada, con su estado; si espera, el chip de 25. */
function Decision({ decision }) {
  if (decision) return <Estado estado={decision} />
  // Decisión 61 del plan: el texto y el color de «escalada», sin ícono, porque no es un estado.
  return (
    <span className="rounded-full bg-estado-escalada-fondo px-2.5 py-[3px] text-auxiliar-fuerte whitespace-nowrap text-estado-escalada-texto">
      En espera
    </span>
  )
}

/** La proporción escalada de cada área (Figma 25), con su porcentaje y «5 de 19». */
function ProporcionPorArea({ areas }) {
  return (
    <section aria-labelledby="escalada-por-area" className={`flex flex-col gap-3.5 ${TARJETA}`}>
      <h2 id="escalada-por-area" className="text-subtitulo text-texto">
        Proporción escalada por área
      </h2>
      <ul className="flex flex-col gap-3">
        {areas.map((area) => (
          <li key={area.id} className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="w-[120px] flex-none text-cuerpo-pequeno text-texto">
              {area.nombre}
            </span>
            {area.registradas > 0 ? (
              <>
                <span
                  aria-hidden="true"
                  className="h-[18px] min-w-24 flex-1 overflow-hidden rounded bg-gris-100 lg:max-w-[300px]"
                >
                  <span
                    className={`block h-full rounded ${presentacionDe(area.nombre).barra}`}
                    style={{ width: `${(area.escaladas / area.registradas) * 100}%` }}
                  />
                </span>
                <span className="text-etiqueta-fuerte text-texto tabular-nums">
                  {formatearPorcentaje(area.escaladas, area.registradas)}
                </span>
                <span className="text-cuerpo-pequeno text-texto-secundario tabular-nums">
                  {deRegistradas(area.escaladas, area.registradas)}
                </span>
              </>
            ) : (
              <span className="text-cuerpo-pequeno text-texto-secundario">
                Sin novedades registradas
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

/**
 * @param {object} props
 * @param {any} props.datos Lo que devuelve `rpt_escalamiento`.
 * @param {string} props.origen La dirección del panel: el detalle vuelve a ella.
 */
export function Escalamiento({ datos, origen }) {
  if (datos.registradas === 0) return <SinNovedadesEnElPeriodo />

  const { decisiones } = datos
  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-4">
        <div className={`flex flex-col gap-1.5 lg:w-[340px] lg:flex-none ${TARJETA}`}>
          <span className="flex items-center gap-2 text-etiqueta text-texto-secundario">
            <Icono src={iconoEscaladas} tamano={20} className="text-estado-escalada-texto" />
            Novedades escaladas al director
          </span>
          <span className="text-indicador text-texto tabular-nums">
            {formatearPorcentaje(datos.escaladas, datos.registradas)}
          </span>
          <span className="text-cuerpo-pequeno text-texto-secundario">
            {deRegistradas(datos.escaladas, datos.registradas)} registradas en el período
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <ProporcionPorArea areas={datos.areas} />
        </div>
      </div>

      <section className={TARJETA}>
        {datos.escaladas > 0 ? (
          <BarraApilada
            titulo="Decisiones del director"
            partes={[
              {
                nombre: 'Aprobadas',
                valor: decisiones.aprobadas,
                clase: 'bg-estado-aprobada-texto',
              },
              {
                nombre: 'Rechazadas',
                valor: decisiones.rechazadas,
                clase: 'bg-estado-rechazada-texto',
              },
              {
                nombre: 'En espera',
                valor: decisiones.en_espera,
                clase: 'bg-estado-escalada-texto',
              },
            ]}
          />
        ) : (
          <>
            <h2 className="text-subtitulo text-texto">Decisiones del director</h2>
            <p className="mt-2 text-cuerpo-pequeno text-texto-secundario">
              Ninguna novedad se escaló en el período.
            </p>
          </>
        )}
      </section>

      {datos.novedades.length > 0 ? (
        <section aria-labelledby="escaladas-en-el-periodo" className="flex flex-col gap-3">
          <h2 id="escaladas-en-el-periodo" className="text-subtitulo text-texto">
            Novedades escaladas en el período
          </h2>
          <div className="relative overflow-x-auto rounded-xl border border-borde bg-superficie">
            <table className="w-full border-collapse">
              <caption className="sr-only">
                Novedades escaladas en el período, de la más reciente a la más antigua
              </caption>
              <thead className="bg-gris-100">
                <tr>
                  <th scope="col" className={`${ENCABEZADO} pl-5`}>
                    Código
                  </th>
                  <th scope="col" className={ENCABEZADO}>
                    Finca
                  </th>
                  <th scope="col" className={ENCABEZADO}>
                    Área
                  </th>
                  <th scope="col" className={ENCABEZADO}>
                    Justificación
                  </th>
                  <th scope="col" className={ENCABEZADO}>
                    Decisión
                  </th>
                  <th scope="col" className={`${ENCABEZADO} pr-5`}>
                    Tiempo hasta la decisión
                  </th>
                </tr>
              </thead>
              <tbody>
                {datos.novedades.map((novedad) => (
                  <tr key={novedad.id} className="border-b border-borde last:border-b-0">
                    <td className={`${CELDA} pl-5 whitespace-nowrap`}>
                      <Link
                        to={`/novedades/${novedad.id}`}
                        state={{ origen }}
                        className="flex min-h-12 items-center text-etiqueta-fuerte text-texto hover:underline lg:min-h-0"
                        translate="no"
                      >
                        {formatearCodigo(novedad.codigo)}
                      </Link>
                    </td>
                    <td className={`${CELDA} whitespace-nowrap`}>{novedad.finca}</td>
                    <td className={CELDA}>
                      <EtiquetaDeArea area={novedad.area} />
                    </td>
                    {/* Una línea: la justificación completa está en el detalle. */}
                    <td className={`${CELDA} max-w-[22rem] truncate`} title={novedad.justificacion}>
                      {novedad.justificacion}
                    </td>
                    <td className={CELDA}>
                      <Decision decision={novedad.decision} />
                    </td>
                    <td className={`${CELDA} pr-5 whitespace-nowrap tabular-nums`}>
                      {novedad.decidida_en ? (
                        formatearDuracion(novedad.escalada_en, novedad.decidida_en)
                      ) : (
                        <>
                          <span aria-hidden="true">—</span>
                          <span className="sr-only">Sin decisión</span>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  )
}
