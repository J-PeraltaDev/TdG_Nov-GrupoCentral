import { BotonDeIcono } from './BotonDeIcono.jsx'
import iconoAnterior from './iconos/chevron_left.svg'
import iconoSiguiente from './iconos/chevron_right.svg'

/**
 * Pie de una lista con páginas (Figma: «1–7 de 12 fincas» y las dos flechas, en 28 y 30).
 *
 * @param {object} props
 * @param {number} props.pagina La página que se ve; empieza en 0.
 * @param {number} props.ultima La última página.
 * @param {number} props.desde Posición del primer elemento visible, empezando en 0.
 * @param {number} props.visibles Cuántos se ven.
 * @param {number} props.total Cuántos hay, con los filtros puestos.
 * @param {string} props.singular «finca», «usuario»…
 * @param {string} props.plural «fincas», «usuarios»…
 * @param {(pagina: number) => void} props.alCambiar
 */
export function Paginacion({
  pagina,
  ultima,
  desde,
  visibles,
  total,
  singular,
  plural,
  alCambiar,
}) {
  return (
    <nav aria-label="Páginas" className="flex items-center justify-between gap-3">
      <p className="text-cuerpo-pequeno text-texto-secundario">
        {desde + 1}–{desde + visibles} de {total} {total === 1 ? singular : plural}
      </p>
      <div className="flex items-center">
        <BotonDeIcono
          icono={iconoAnterior}
          nombre="Página anterior"
          disabled={pagina === 0}
          onClick={() => alCambiar(pagina - 1)}
        />
        <BotonDeIcono
          icono={iconoSiguiente}
          nombre="Página siguiente"
          disabled={pagina === ultima}
          onClick={() => alCambiar(pagina + 1)}
        />
      </div>
    </nav>
  )
}
