import { useId, useState } from 'react'
import { Link } from 'react-router'
import { Icono } from '../../core/ui/Icono.jsx'
import iconoDesplegar from '../../core/ui/iconos/expand_more.svg'
import iconoPlegar from '../../core/ui/iconos/expand_less.svg'
import iconoInformacion from '../../core/ui/iconos/info.svg'
import iconoToque from '../../core/ui/iconos/touch_app.svg'
import { useEsEscritorio } from '../../core/ui/useEsEscritorio.js'
import { cuantasNovedades } from '../../core/utils/texto.js'
import { escribirFiltros } from '../e4-consulta/filtrosDelHistorial.js'
import { Barras } from './graficos/Barras.jsx'
import { armarMatriz, combinaciones, pasoDeColor } from './matriz.js'
import { SinNovedadesEnElPeriodo } from './SinNovedadesEnElPeriodo.jsx'

/*
 * Pantallas 26 y 27 · Fallas recurrentes (RF-29, CU-29; Figma 5:1862 y 5:2174). Lo que llega de
 * `rpt_recurrencia`: en el escritorio, la matriz finca por tipo de falla y las combinaciones más
 * repetidas; en el teléfono, cada finca desplegable con sus barras. Cada celda abre el historial
 * con esa finca, ese tipo, las resueltas y cerradas y el período (decisión 24).
 */

const TARJETA = 'rounded-xl border border-borde bg-superficie p-5'

// Figma 26: el verde primario en cinco intensidades. El número va oscuro hasta la cuarta: el
// blanco de Figma no alcanza el contraste de AA sobre ella (decisión 25).
const PASOS = {
  1: 'bg-primario/14 text-texto',
  2: 'bg-primario/30 text-texto',
  3: 'bg-primario/50 text-texto',
  4: 'bg-primario/70 text-texto',
  5: 'bg-primario/90 text-sobre-primario',
}

/** El historial con las resueltas y cerradas del período, de una finca y, si se da, un tipo. */
const historial = ({ desde, hasta }, finca, tipo = null) =>
  `/historial?${escribirFiltros({
    finca,
    area: null,
    estados: ['resuelta', 'cerrada'],
    desde,
    hasta,
    tipo,
  })}`

/** Una celda de la matriz: vacía a la vista y «0 novedades» para el lector (decisión 62). */
function Celda({ finca, tipo, cantidad, mayor, a, globoAbajo = false }) {
  if (cantidad === 0) {
    return (
      <td className="p-0.5">
        <span className="sr-only">0 novedades</span>
        <span aria-hidden="true" className="flex h-11 min-w-16 rounded-md bg-gris-100" />
      </td>
    )
  }
  const nombre = `${finca} · ${tipo}: ${cuantasNovedades(cantidad)}`
  const valor = (
    <span
      className={`flex h-11 min-w-16 items-center justify-center rounded-md text-etiqueta-fuerte tabular-nums ${PASOS[pasoDeColor(cantidad, mayor)]}`}
    >
      {cantidad}
    </span>
  )
  if (!a) return <td className="p-0.5">{valor}</td>
  return (
    <td className="p-0.5">
      <Link
        to={a}
        aria-label={nombre}
        className="group relative block rounded-md hover:ring-2 hover:ring-primario"
      >
        {valor}
        {/* El globo de Figma 26; el nombre del enlace ya lo dice todo. En la primera fila abre
            hacia abajo: hacia arriba lo cortaría la caja de la matriz. */}
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute left-1/2 z-30 hidden -translate-x-1/2 flex-col gap-0.5 rounded-lg bg-texto px-3 py-2 text-left whitespace-nowrap drop-shadow-lg group-hover:flex group-focus-visible:flex ${globoAbajo ? 'top-full mt-1.5' : 'bottom-full mb-1.5'}`}
        >
          <span className="text-etiqueta-fuerte text-sobre-primario">{nombre}</span>
          <span className="text-auxiliar text-primario-contenedor">Ver en historial</span>
        </span>
      </Link>
    </td>
  )
}

/** La matriz de 26, como tabla: filas por finca, columnas por tipo, totales al final. */
function Matriz({ datos }) {
  const { columnas, filas, otras, total, mayor } = armarMatriz(datos.celdas)
  const [conOtras, setConOtras] = useState(false)
  const idDeOtras = useId()

  const fila = (finca, i) => (
    <tr key={finca.id}>
      <th scope="row" className="pr-3 text-left text-etiqueta-fuerte text-texto">
        {finca.nombre}
      </th>
      {columnas.map((columna) => (
        <Celda
          key={columna.id}
          finca={finca.nombre}
          tipo={columna.nombre}
          cantidad={finca.cantidades[columna.id]}
          mayor={mayor}
          a={historial(datos, finca.id, columna.id)}
          globoAbajo={i === 0}
        />
      ))}
      <td className="px-3 text-center text-etiqueta-fuerte text-texto tabular-nums">
        {finca.total}
      </td>
    </tr>
  )

  return (
    <div className={`flex min-w-0 flex-1 flex-col gap-3 ${TARJETA}`}>
      <div className="relative overflow-x-auto">
        <table className="border-separate border-spacing-0">
          <caption className="sr-only">
            Novedades resueltas y cerradas por finca y tipo de falla
          </caption>
          <thead>
            <tr>
              <th
                scope="col"
                className="pr-3 pb-2 text-left align-bottom text-auxiliar text-texto-secundario"
              >
                Finca
              </th>
              {columnas.map((columna) => (
                <th
                  key={columna.id}
                  scope="col"
                  className="w-[72px] px-0.5 pb-2 text-center align-bottom text-auxiliar leading-tight text-texto-secundario"
                >
                  {columna.nombre}
                </th>
              ))}
              <th
                scope="col"
                className="px-3 pb-2 text-center align-bottom text-auxiliar text-texto-secundario"
              >
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {filas.map((finca, i) => fila(finca, i))}
            {otras ? (
              <tr>
                <th scope="row" className="pr-3 text-left">
                  <button
                    type="button"
                    aria-expanded={conOtras}
                    aria-controls={idDeOtras}
                    onClick={() => setConOtras(!conOtras)}
                    className="flex min-h-11 cursor-pointer items-center gap-1 text-cuerpo-pequeno whitespace-nowrap text-texto-secundario"
                  >
                    Otras {otras.fincas.length} fincas
                    <Icono src={conOtras ? iconoPlegar : iconoDesplegar} tamano={18} />
                  </button>
                </th>
                {columnas.map((columna) => (
                  <Celda
                    key={columna.id}
                    finca={`Otras ${otras.fincas.length} fincas`}
                    tipo={columna.nombre}
                    cantidad={otras.cantidades[columna.id]}
                    mayor={mayor}
                  />
                ))}
                <td className="px-3 text-center text-etiqueta-fuerte text-texto tabular-nums">
                  {otras.total}
                </td>
              </tr>
            ) : null}
          </tbody>
          {otras ? (
            <tbody id={idDeOtras} hidden={!conOtras}>
              {otras.fincas.map((finca) => fila(finca, -1))}
            </tbody>
          ) : null}
          <tfoot>
            <tr>
              <th scope="row" className="pt-3 pr-3 text-left text-etiqueta-fuerte text-texto">
                Total
              </th>
              {columnas.map((columna) => (
                <td
                  key={columna.id}
                  className="pt-3 text-center text-etiqueta-fuerte text-texto tabular-nums"
                >
                  {columna.total}
                </td>
              ))}
              <td className="px-3 pt-3 text-center text-etiqueta-fuerte text-texto tabular-nums">
                {total}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p
        aria-hidden="true"
        className="flex items-center gap-1.5 text-auxiliar text-texto-secundario"
      >
        Menos
        {[1, 2, 3, 4, 5].map((paso) => (
          <span key={paso} className={`h-3 w-5 rounded-[3px] ${PASOS[paso]}`} />
        ))}
        Más
      </p>
    </div>
  )
}

/**
 * Las combinaciones más repetidas (Figma 26: cinco, con «Ver novedades»). Al lado de la matriz
 * desde 1440 px, como Figma; debajo en pantallas más angostas, donde no caben juntas.
 */
function Combinaciones({ datos }) {
  return (
    <section
      aria-labelledby="combinaciones"
      className={`flex flex-col gap-4 min-[90rem]:w-[320px] min-[90rem]:flex-none ${TARJETA}`}
    >
      <h2 id="combinaciones" className="text-subtitulo text-texto">
        Combinaciones más repetidas
      </h2>
      <ol className="flex flex-col gap-4">
        {combinaciones(datos.celdas, 5).map((celda, i) => (
          <li key={`${celda.finca_id}|${celda.tipo_falla_id}`} className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className={`flex size-7 flex-none items-center justify-center rounded-full text-auxiliar-fuerte ${
                i === 0 ? 'bg-primario text-sobre-primario' : 'bg-gris-100 text-texto'
              }`}
            >
              {i + 1}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-etiqueta-fuerte text-texto">
                {celda.finca} · {celda.tipo_falla}
              </span>
              <Link
                to={historial(datos, celda.finca_id, celda.tipo_falla_id)}
                className="relative text-auxiliar-fuerte text-primario hover:underline after:absolute after:inset-x-0 after:-inset-y-4"
              >
                Ver novedades{' '}
                <span className="sr-only">{`de ${celda.finca} · ${celda.tipo_falla}`}</span>
              </Link>
            </span>
            <span className="text-subtitulo text-texto tabular-nums">{celda.cantidad}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}

/** 27: cada finca, desplegable, con sus barras por tipo y «Ver en historial». */
function FincasDesplegables({ datos }) {
  const { filas, otras, columnas } = armarMatriz(datos.celdas)
  const fincas = [...filas, ...(otras?.fincas ?? [])]
  // Figma 27 muestra la primera abierta.
  const [abiertas, setAbiertas] = useState(() => new Set(fincas.slice(0, 1).map(({ id }) => id)))
  const idBase = useId()
  const cambiar = (id) =>
    setAbiertas((actuales) => {
      const nuevas = new Set(actuales)
      if (nuevas.has(id)) nuevas.delete(id)
      else nuevas.add(id)
      return nuevas
    })

  return (
    <ul className="flex flex-col gap-2.5">
      {fincas.map((finca) => {
        const abierta = abiertas.has(finca.id)
        const idDelPanel = `${idBase}-${finca.id}`
        return (
          <li key={finca.id} className="rounded-xl border border-borde bg-superficie px-4">
            <h3>
              <button
                type="button"
                aria-expanded={abierta}
                aria-controls={idDelPanel}
                onClick={() => cambiar(finca.id)}
                className="flex min-h-14 w-full cursor-pointer items-center gap-3 text-left"
              >
                <span className="min-w-0 flex-1 text-cuerpo-fuerte text-texto">{finca.nombre}</span>{' '}
                <span className="text-subtitulo text-texto tabular-nums">
                  {finca.total} <span className="sr-only">novedades</span>
                </span>
                <Icono
                  src={abierta ? iconoPlegar : iconoDesplegar}
                  tamano={20}
                  className="text-texto-secundario"
                />
              </button>
            </h3>
            {abierta ? (
              <div id={idDelPanel} className="flex flex-col gap-3 pb-4">
                <Barras
                  anchoDeEtiqueta="w-[130px]"
                  filas={columnas
                    .filter((columna) => finca.cantidades[columna.id] > 0)
                    .sort((a, b) => finca.cantidades[b.id] - finca.cantidades[a.id])
                    .map((columna) => ({
                      id: columna.id,
                      etiqueta: columna.nombre,
                      segmentos: [{ valor: finca.cantidades[columna.id], clase: 'bg-primario' }],
                      total: finca.cantidades[columna.id],
                    }))}
                />
                <Link
                  to={historial(datos, finca.id)}
                  className="flex min-h-12 items-center self-start text-etiqueta-fuerte text-primario"
                >
                  Ver en historial <span className="sr-only">{`de ${finca.nombre}`}</span>
                </Link>
              </div>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}

/**
 * @param {object} props
 * @param {any} props.datos Lo que devuelve `rpt_recurrencia`.
 */
export function FallasRecurrentes({ datos }) {
  const esEscritorio = useEsEscritorio()
  if (datos.total === 0) {
    return (
      <SinNovedadesEnElPeriodo
        titulo={
          datos.excluidas > 0 ? 'No hay novedades resueltas ni cerradas en este período' : undefined
        }
      />
    )
  }

  const porFuera =
    datos.excluidas > 0 ? (
      <p className="flex items-start gap-2 rounded-lg bg-info-suave px-3 py-2 text-cuerpo-pequeno text-texto">
        <Icono src={iconoInformacion} tamano={18} className="mt-px flex-none text-info" />
        {esEscritorio
          ? datos.excluidas === 1
            ? '1 novedad quedó por fuera porque todavía no tiene tipo de falla (abierta o rechazada).'
            : `${cuantasNovedades(datos.excluidas)} quedaron por fuera porque todavía no tienen tipo de falla (abiertas o rechazadas).`
          : `${cuantasNovedades(datos.excluidas)} sin tipo de falla ${datos.excluidas === 1 ? 'quedó' : 'quedaron'} por fuera.`}
      </p>
    ) : null

  if (!esEscritorio) {
    return (
      <div className="flex flex-col gap-3">
        {porFuera}
        <section aria-labelledby="mas-repetidas" className={TARJETA}>
          <h2 id="mas-repetidas" className="pb-2 text-etiqueta-fuerte text-texto">
            Más repetidas
          </h2>
          <ol className="flex flex-col gap-1.5">
            {combinaciones(datos.celdas, 3).map((celda, i) => (
              <li
                key={`${celda.finca_id}|${celda.tipo_falla_id}`}
                className="flex items-center gap-2 text-cuerpo-pequeno text-texto"
              >
                <span aria-hidden="true" className="w-4 flex-none text-texto-secundario">
                  {i + 1}.
                </span>
                <span className="min-w-0 flex-1">
                  {celda.finca} · {celda.tipo_falla}
                </span>
                <span className="text-etiqueta-fuerte tabular-nums">{celda.cantidad}</span>
              </li>
            ))}
          </ol>
        </section>
        <FincasDesplegables datos={datos} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="text-cuerpo-fuerte text-texto">
          {datos.total === 1
            ? '1 novedad resuelta o cerrada en el período'
            : `${cuantasNovedades(datos.total)} resueltas y cerradas en el período`}
        </p>
        {porFuera}
      </div>
      <div className="flex flex-col gap-4 min-[90rem]:flex-row min-[90rem]:items-start min-[90rem]:gap-6">
        <Matriz datos={datos} />
        <Combinaciones datos={datos} />
      </div>
      <p className="flex items-center gap-1.5 text-auxiliar text-texto-secundario">
        <Icono src={iconoToque} tamano={16} />
        Haz clic en una celda para ver esas novedades en el historial.
      </p>
    </div>
  )
}
