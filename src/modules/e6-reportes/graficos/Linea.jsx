/**
 * @typedef {object} Serie
 * @property {string} id
 * @property {string} nombre
 * @property {string} punto Clase del color de los puntos (`bg-…`).
 * @property {string} trazo Clase del color de la línea (`stroke-…`).
 * @property {(number | null)[]} valores Uno por mes; nulo si ese mes no tiene dato.
 * @property {string} [rotulo] El valor del último mes, al final de la línea: «Mantenimiento ·
 *   3,8 días».
 */

/** El paso de las guías: 1, 2 o 5 por diez, para que haya tres o cuatro. */
function pasoDeLasGuias(mayor) {
  const bruto = mayor / 3
  const potencia = 10 ** Math.floor(Math.log10(bruto))
  const paso = [1, 2, 5, 10].map((n) => n * potencia).find((n) => n >= bruto)
  return Math.max(1, paso)
}

/**
 * Un gráfico de líneas, con SVG (Figma 24; plan del Sprint 5, decisión 25): una serie por área,
 * los meses en el eje horizontal y las guías en días. Las líneas se estiran con el ancho; los
 * puntos y los textos no. Es un adorno para el lector de pantalla: los mismos datos van en la
 * tabla que lo acompaña.
 *
 * @param {object} props
 * @param {{ largo: string, corto: string }[]} props.meses Los rótulos del eje: «Julio» en el
 *   escritorio y «Jul» en el teléfono o con más de seis meses; si no caben, uno de cada tantos.
 * @param {Serie[]} props.series
 * @param {string} [props.unidad] Lo que sigue al número de cada guía: «d».
 */
export function Linea({ meses, series, unidad = 'd' }) {
  const mayor = Math.max(1, ...series.flatMap((serie) => serie.valores.filter((v) => v !== null)))
  const paso = pasoDeLasGuias(mayor)
  const tope = Math.ceil(mayor / paso) * paso
  const guias = Array.from({ length: tope / paso + 1 }, (_, i) => i * paso)
  const x = (i) => (meses.length === 1 ? 50 : (i / (meses.length - 1)) * 100)
  const y = (valor) => 100 - (valor / tope) * 100
  // Cuántos rótulos caben a lo ancho: seis en el teléfono y doce en el escritorio.
  const pasoEnElTelefono = Math.ceil(meses.length / 6)
  const pasoEnElEscritorio = Math.ceil(meses.length / 12)

  return (
    <div aria-hidden="true" className="relative h-[240px] w-full">
      <div className="absolute top-3 right-6 bottom-[30px] left-14 lg:right-52">
        {guias.map((guia) => (
          <div
            key={guia}
            className={`absolute inset-x-0 h-px ${guia === 0 ? 'bg-gris-300' : 'bg-gris-200'}`}
            style={{ top: `${y(guia)}%` }}
          >
            <span className="absolute -left-12 -translate-y-1/2 text-auxiliar whitespace-nowrap text-texto-secundario tabular-nums">
              {guia} {unidad}
            </span>
          </div>
        ))}
        {meses.map((mes, i) => (
          <span
            // oxlint-disable-next-line react/no-array-index-key -- un rótulo por mes, en orden
            key={i}
            className={`absolute top-full mt-2.5 -translate-x-1/2 text-auxiliar whitespace-nowrap text-texto-secundario ${
              i % pasoEnElTelefono === 0 ? '' : 'max-lg:hidden'
            } ${i % pasoEnElEscritorio === 0 ? '' : 'lg:hidden'}`}
            style={{ left: `${x(i)}%` }}
          >
            {/* Hasta seis meses caben con el nombre completo; más, en corto. */}
            <span className={meses.length > 6 ? 'hidden' : 'max-lg:hidden'}>{mes.largo}</span>
            <span className={meses.length > 6 ? '' : 'lg:hidden'}>{mes.corto}</span>
          </span>
        ))}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 size-full overflow-visible"
        >
          {series.map((serie) => (
            <polyline
              key={serie.id}
              points={serie.valores
                .map((valor, i) => (valor === null ? null : `${x(i)},${y(valor)}`))
                .filter(Boolean)
                .join(' ')}
              fill="none"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              className={serie.trazo}
            />
          ))}
        </svg>
        {series.map((serie) => {
          const ultimo = serie.valores.findLastIndex((valor) => valor !== null)
          return (
            <div key={serie.id}>
              {serie.valores.map((valor, i) =>
                valor === null ? null : (
                  <span
                    // oxlint-disable-next-line react/no-array-index-key -- un punto por mes
                    key={i}
                    className={`absolute size-2 -translate-1/2 rounded-full ${serie.punto}`}
                    style={{ left: `${x(i)}%`, top: `${y(valor)}%` }}
                  />
                ),
              )}
              {serie.rotulo && ultimo >= 0 ? (
                <span
                  className="absolute hidden -translate-y-1/2 pl-3.5 text-auxiliar-fuerte whitespace-nowrap text-texto lg:block"
                  style={{ left: `${x(ultimo)}%`, top: `${y(serie.valores[ultimo])}%` }}
                >
                  {serie.rotulo}
                </span>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
