import { Link } from 'react-router'
import { Estado } from '../../core/ui/Estado.jsx'
import { Icono } from '../../core/ui/Icono.jsx'
import iconoAbiertas from '../../core/ui/iconos/inbox.svg'
import iconoVer from '../../core/ui/iconos/chevron_right.svg'
import iconoToque from '../../core/ui/iconos/touch_app.svg'
import { presentacionDe } from '../../core/ui/presentacionDelArea.js'
import { Barras } from './graficos/Barras.jsx'
import { Leyenda } from './graficos/Leyenda.jsx'

/*
 * Pantalla 23 · Novedades abiertas (RF-26, CU-26; Figma 5:783). Lo que llega de
 * `rpt_novedades_abiertas`, en tarjetas, dos gráficos y la tabla de todas las fincas. Cada área y
 * cada finca abre el historial con sus abiertas (decisión 24).
 */

const TARJETA = 'rounded-xl border border-borde bg-superficie p-5'
const ENCABEZADO = 'px-2 py-2.5 text-left text-auxiliar-fuerte text-texto-secundario'
const CELDA = 'px-2 py-2.5 text-cuerpo-pequeno text-texto tabular-nums'

const presentacion = (area) => presentacionDe(area.nombre)
const historialDeLaFinca = (finca) => `/historial?finca=${finca.id}&estado=abiertas`
const nombreDeLaFinca = (finca) => (finca.activa ? finca.nombre : `${finca.nombre} (inactiva)`)

/** Una cifra grande con su título (Figma: «Indicador»). */
function Indicador({ icono, colorDelIcono = 'text-texto-secundario', titulo, cifra, children }) {
  return (
    <>
      <span className="flex items-center gap-2 text-etiqueta text-texto-secundario">
        {icono ? <Icono src={icono} tamano={20} className={colorDelIcono} /> : null}
        {titulo}
      </span>
      <span className="text-indicador text-texto tabular-nums">{cifra}</span>
      {children}
    </>
  )
}

/**
 * @param {object} props
 * @param {any} props.datos Lo que devuelve `rpt_novedades_abiertas`.
 */
export function NovedadesAbiertas({ datos }) {
  const { areas, fincas, estados } = datos
  const total = areas.reduce((suma, area) => suma + area.abiertas, 0)
  const conAbiertas = fincas.filter((finca) => finca.total > 0)
  const sinAbiertas = fincas.length - conAbiertas.length
  const repartoDe = (finca) => areas.map((area) => finca.por_area[area.id] ?? 0)

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <div className="grid gap-3 lg:grid-cols-3 lg:items-start lg:gap-4">
        <div className={`flex flex-col gap-1.5 ${TARJETA}`}>
          <Indicador icono={iconoAbiertas} titulo="Novedades abiertas" cifra={total}>
            <span className="text-cuerpo-pequeno text-texto-secundario">
              No cerradas: asignadas, en atención, escaladas, aprobadas y resueltas sin confirmar
            </span>
          </Indicador>
        </div>
        {areas.map((area) => (
          <Link
            key={area.id}
            to={`/historial?area=${area.id}&estado=abiertas`}
            aria-label={`${area.nombre}: ${area.abiertas} abiertas. Verlas en el historial`}
            className={`flex flex-col gap-1.5 hover:bg-gris-100 ${TARJETA}`}
          >
            <Indicador
              icono={presentacion(area).icono}
              colorDelIcono={presentacion(area).texto}
              titulo={area.nombre}
              cifra={area.abiertas}
            />
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
        <section
          aria-labelledby="abiertas-por-finca"
          className={`flex min-w-0 flex-1 flex-col gap-3.5 ${TARJETA}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="abiertas-por-finca" className="text-subtitulo text-texto">
              Abiertas por finca
            </h2>
            <Leyenda areas={areas} />
          </div>
          <Barras
            filas={conAbiertas.map((finca) => ({
              id: finca.id,
              etiqueta: (
                <Link to={historialDeLaFinca(finca)} className="hover:underline">
                  {nombreDeLaFinca(finca)}
                </Link>
              ),
              segmentos: repartoDe(finca).map((valor, i) => ({
                valor,
                clase: presentacion(areas[i]).barra,
              })),
              total: finca.total,
              detalle: `${finca.total} ${finca.total === 1 ? 'abierta' : 'abiertas'}: ${areas
                .map((area, i) => `${area.nombre} ${repartoDe(finca)[i]}`)
                .join(', ')}`,
            }))}
          />
          {sinAbiertas > 0 ? (
            <p className="text-auxiliar text-texto-secundario">
              {sinAbiertas === 1
                ? '1 finca sin novedades abiertas'
                : `${sinAbiertas} fincas sin novedades abiertas`}
            </p>
          ) : null}
        </section>

        <section
          aria-labelledby="abiertas-por-estado"
          className={`flex flex-col gap-3.5 lg:w-[420px] ${TARJETA}`}
        >
          <h2 id="abiertas-por-estado" className="text-subtitulo text-texto">
            Abiertas por estado
          </h2>
          <Barras
            anchoDeEtiqueta="w-[150px]"
            filas={estados
              .filter((estado) => estado.abiertas > 0)
              .map((estado) => ({
                id: estado.estado,
                etiqueta: <Estado estado={estado.estado} />,
                segmentos: [{ valor: estado.abiertas, clase: 'bg-primario' }],
                total: estado.abiertas,
              }))}
          />
        </section>
      </div>

      <div className="relative overflow-x-auto rounded-xl border border-borde bg-superficie">
        <table className="w-full border-collapse">
          <caption className="sr-only">Novedades abiertas por finca</caption>
          <thead className="bg-gris-100">
            <tr>
              <th scope="col" className={`${ENCABEZADO} pl-5`}>
                Finca
              </th>
              <th scope="col" className={ENCABEZADO}>
                Razón social
              </th>
              {areas.map((area) => (
                <th key={area.id} scope="col" className={ENCABEZADO}>
                  {area.nombre}
                </th>
              ))}
              <th scope="col" className={ENCABEZADO}>
                Total
              </th>
              <th scope="col" className={`${ENCABEZADO} pr-5`}>
                <span className="sr-only">Historial</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {fincas.map((finca) => (
              <tr key={finca.id} className="border-b border-borde last:border-b-0">
                <th scope="row" className={`${CELDA} pl-5 text-left text-etiqueta-fuerte`}>
                  {nombreDeLaFinca(finca)}
                </th>
                <td className={`${CELDA} max-w-72 truncate`}>{finca.razon_social}</td>
                {repartoDe(finca).map((valor, i) => (
                  <td key={areas[i].id} className={CELDA}>
                    {valor}
                  </td>
                ))}
                <td className={`${CELDA} font-semibold`}>{finca.total}</td>
                <td className={`${CELDA} pr-5`}>
                  <Link
                    to={historialDeLaFinca(finca)}
                    className="flex min-h-12 items-center gap-1.5 text-etiqueta-fuerte whitespace-nowrap text-primario lg:min-h-0"
                  >
                    Ver en historial <span className="sr-only">de {finca.nombre}</span>
                    <Icono src={iconoVer} tamano={18} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="flex items-center gap-1.5 text-auxiliar text-texto-secundario">
        <Icono src={iconoToque} tamano={16} />
        Haz clic en una finca o un área para ver sus novedades en el historial.
      </p>
    </div>
  )
}
