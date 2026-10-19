import { presentacionDe } from '../../../core/ui/presentacionDelArea.js'

/**
 * La leyenda de las áreas de un gráfico (Figma 23 y 24): el color y, al lado, el nombre, así que
 * nada depende solo del color. Es un adorno para el lector de pantalla, que lee las cifras en el
 * texto o en la tabla del gráfico.
 *
 * @param {object} props
 * @param {{ id: string, nombre: string }[]} props.areas
 */
export function Leyenda({ areas }) {
  return (
    <ul aria-hidden="true" className="flex flex-wrap gap-x-4 gap-y-1">
      {areas.map((area) => (
        <li key={area.id} className="flex items-center gap-1.5 text-auxiliar text-texto">
          <span className={`size-3 rounded-[3px] ${presentacionDe(area.nombre).barra}`} />
          {area.nombre}
        </li>
      ))}
    </ul>
  )
}
