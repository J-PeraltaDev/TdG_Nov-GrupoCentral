import { Link } from 'react-router'
import { Estado } from '../../core/ui/Estado.jsx'
import { EtiquetaDeArea } from '../../core/ui/EtiquetasDeNovedad.jsx'
import { Icono } from '../../core/ui/Icono.jsx'
import iconoInformacion from '../../core/ui/iconos/info.svg'
import iconoTiempo from '../../core/ui/iconos/schedule.svg'
import { presentacionDe } from '../../core/ui/presentacionDelArea.js'
import { Prioridad } from '../../core/ui/Prioridad.jsx'
import { formatearCodigo } from '../../core/utils/codigo.js'
import { formatearDuracion } from '../../core/utils/fechas.js'
import { formatearDias, nombreDelMes } from './cifras.js'
import { Leyenda } from './graficos/Leyenda.jsx'
import { Linea } from './graficos/Linea.jsx'
import { mesesDelPeriodo } from './periodos.js'

/*
 * Pantallas 24 y 24-B · Tiempos de atención (RF-27, CU-27; Figma 5:1087 y 5:1326). Lo que llega
 * de `rpt_tiempos_atencion` para el período elegido: el promedio de cada área, su evolución
 * mensual y las abiertas con más tiempo, que abren su detalle (decisión 24).
 */

const TARJETA = 'rounded-xl border border-borde bg-superficie p-5'
const ENCABEZADO = 'px-2 py-2.5 text-left text-auxiliar-fuerte text-texto-secundario'
const CELDA = 'px-2 py-2.5 text-cuerpo-pequeno text-texto'

const presentacion = (area) => presentacionDe(area.nombre)
const resueltasEnElPeriodo = (cantidad) =>
  cantidad === 1 ? '1 resuelta en el período' : `${cantidad} resueltas en el período`

/** El promedio de un área, o «No disponible» si no resolvió ninguna (24-B, CU-27 3a). */
function PromedioDelArea({ area }) {
  const disponible = area.promedio_horas !== null
  return (
    <div className={`flex flex-col gap-1.5 ${TARJETA}`}>
      <span className="flex items-center gap-2 text-etiqueta text-texto-secundario">
        {presentacion(area).icono ? (
          <Icono src={presentacion(area).icono} tamano={20} className={presentacion(area).texto} />
        ) : null}
        {area.nombre} · promedio de registro a resolución
      </span>
      <span
        className={`text-indicador tabular-nums ${disponible ? 'text-texto' : 'text-texto-secundario'}`}
      >
        {disponible ? formatearDias(area.promedio_horas) : 'No disponible'}
      </span>
      <span className="text-cuerpo-pequeno text-texto-secundario">
        {disponible
          ? resueltasEnElPeriodo(area.resueltas)
          : 'No hay novedades resueltas en el período'}
      </span>
    </div>
  )
}

/**
 * El promedio mensual por área, como línea y, para el lector de pantalla, como tabla.
 *
 * @param {{ areas: any[], meses: string[], promedios: Map<string, number> }} props `promedios`
 *   por «mes|área», en horas.
 */
function PromedioMensual({ areas, meses, promedios }) {
  const valor = (mes, area) => promedios.get(`${mes}|${area.id}`) ?? null
  // Un período de más de un año repetiría los nombres: entonces van con el año.
  const conAnio = meses.length > 12
  const rotulos = meses.map((mes) => ({
    largo: nombreDelMes(mes, { conAnio }),
    corto: nombreDelMes(mes, { conAnio, corto: true }),
  }))
  const series = areas.map((area) => {
    const valores = meses.map((mes) => valor(mes, area))
    const ultimo = valores.findLast((v) => v !== null)
    return {
      id: area.id,
      nombre: area.nombre,
      punto: presentacion(area).barra,
      trazo: presentacion(area).trazo,
      valores: valores.map((horas) => (horas === null ? null : horas / 24)),
      rotulo: ultimo === undefined ? undefined : `${area.nombre} · ${formatearDias(ultimo)}`,
    }
  })

  return (
    <section aria-labelledby="promedio-mensual" className={`flex flex-col gap-3 ${TARJETA}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="promedio-mensual" className="text-subtitulo text-texto">
          Promedio mensual por área
        </h2>
        <Leyenda areas={areas} />
      </div>
      <Linea meses={rotulos} series={series} />
      <table className="sr-only">
        <caption>Promedio mensual por área, en días</caption>
        <thead>
          <tr>
            <th scope="col">Mes</th>
            {areas.map((area) => (
              <th key={area.id} scope="col">
                {area.nombre}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {meses.map((mes, i) => (
            <tr key={mes}>
              <th scope="row">{rotulos[i].largo}</th>
              {areas.map((area) => (
                <td key={area.id}>
                  {valor(mes, area) === null ? 'Sin resueltas' : formatearDias(valor(mes, area))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

/**
 * @param {object} props
 * @param {any} props.datos Lo que devuelve `rpt_tiempos_atencion`.
 * @param {string} props.origen La dirección del panel: el detalle vuelve a ella.
 */
export function TiemposDeAtencion({ datos, origen }) {
  const meses = mesesDelPeriodo(datos)
  const promedios = new Map(datos.meses.map((m) => [`${m.mes}|${m.area_id}`, m.promedio_horas]))
  // Con un solo mes (24-B, «Mes actual») o sin resueltas no hay evolución que mostrar.
  const conEvolucion = meses.length > 1 && datos.meses.length > 0

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <div className="grid gap-3 lg:grid-cols-2 lg:gap-4">
        {datos.areas.map((area) => (
          <PromedioDelArea key={area.id} area={area} />
        ))}
      </div>
      <p className="-mt-1 flex items-start gap-1.5 text-cuerpo-pequeno text-texto-secundario lg:-mt-2">
        <Icono src={iconoInformacion} tamano={16} className="mt-0.5 flex-none" />
        Se mide desde la fecha de registro en finca, no desde la sincronización.
      </p>

      {conEvolucion ? (
        <PromedioMensual areas={datos.areas} meses={meses} promedios={promedios} />
      ) : null}

      <section aria-labelledby="abiertas-con-mas-tiempo" className="flex flex-col gap-3">
        <h2
          id="abiertas-con-mas-tiempo"
          className="flex items-center gap-2 text-subtitulo text-texto"
        >
          <Icono src={iconoTiempo} tamano={22} className="text-advertencia" />
          Abiertas con más tiempo
        </h2>
        {datos.abiertas.length === 0 ? (
          <p className="text-cuerpo-pequeno text-texto-secundario">No hay novedades abiertas.</p>
        ) : (
          <div className="relative overflow-x-auto rounded-xl border border-borde bg-superficie">
            <table className="w-full border-collapse">
              <caption className="sr-only">
                Las cinco novedades abiertas con más tiempo, de la más antigua a la más reciente
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
                    Estado
                  </th>
                  <th scope="col" className={ENCABEZADO}>
                    Prioridad
                  </th>
                  <th scope="col" className={`${ENCABEZADO} pr-5`}>
                    Tiempo abierta
                  </th>
                </tr>
              </thead>
              <tbody>
                {datos.abiertas.map((novedad, i) => (
                  <tr
                    key={novedad.id}
                    // Figma 24 resalta la que más tiempo lleva.
                    className={`border-b border-borde last:border-b-0 ${i === 0 ? 'bg-advertencia-suave' : ''}`}
                  >
                    <td className={`${CELDA} pl-5 whitespace-nowrap`}>
                      <Link
                        to={`/novedades/${novedad.id}`}
                        state={{ origen }}
                        className="text-etiqueta-fuerte text-texto hover:underline"
                        translate="no"
                      >
                        {formatearCodigo(novedad.codigo)}
                      </Link>
                    </td>
                    <td className={CELDA}>{novedad.finca}</td>
                    <td className={CELDA}>
                      <EtiquetaDeArea area={novedad.area} />
                    </td>
                    <td className={CELDA}>
                      <Estado estado={novedad.estado} />
                    </td>
                    <td className={CELDA}>
                      <Prioridad prioridad={novedad.prioridad} />
                    </td>
                    <td className={`${CELDA} pr-5 font-semibold whitespace-nowrap tabular-nums`}>
                      {formatearDuracion(novedad.fecha_registro, datos.datos_al)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
