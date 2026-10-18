/**
 * Una barra repartida en partes, con la leyenda y la cantidad de cada una (Figma 25: las
 * decisiones del director). La leyenda dice todo; la barra es un adorno para el lector de
 * pantalla. Las partes en cero no se dibujan.
 *
 * @param {object} props
 * @param {{ nombre: string, valor: number, clase: string }[]} props.partes `clase`, su color.
 * @param {string} props.titulo
 */
export function BarraApilada({ partes, titulo }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h2 className="text-subtitulo text-texto">{titulo}</h2>
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {partes.map((parte) => (
            <li key={parte.nombre} className="flex items-center gap-1.5 text-auxiliar text-texto">
              <span aria-hidden="true" className={`size-3 rounded-[3px] ${parte.clase}`} />
              {parte.nombre} · {parte.valor}
            </li>
          ))}
        </ul>
      </div>
      <div aria-hidden="true" className="flex h-[18px] gap-0.5 overflow-hidden rounded">
        {partes
          .filter((parte) => parte.valor > 0)
          .map((parte) => (
            <span
              key={parte.nombre}
              className={`h-full ${parte.clase}`}
              style={{ flexGrow: parte.valor, flexBasis: 0 }}
            />
          ))}
      </div>
    </div>
  )
}
