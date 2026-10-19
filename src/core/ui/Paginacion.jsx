import { paginasVisibles } from '../utils/paginar.js'
import { BotonDeIcono } from './BotonDeIcono.jsx'
import iconoAnterior from './iconos/chevron_left.svg'
import iconoSiguiente from './iconos/chevron_right.svg'

/**
 * Pie de una lista con páginas (Figma: «1–7 de 12 fincas» y las dos flechas, en 28 y 30; con
 * los números de página y sin el nombre, en 21).
 *
 * @param {object} props
 * @param {number} props.pagina La página que se ve; empieza en 0.
 * @param {number} props.ultima La última página.
 * @param {number} props.desde Posición del primer elemento visible, empezando en 0.
 * @param {number} props.visibles Cuántos se ven.
 * @param {number} props.total Cuántos hay, con los filtros puestos.
 * @param {string} [props.singular] «finca», «usuario»… Sin él, «1–8 de 9», como 21.
 * @param {string} [props.plural] «fincas», «usuarios»…
 * @param {boolean} [props.numeros] Los números de página, en el escritorio (Figma 21).
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
  numeros = false,
  alCambiar,
}) {
  const nombre = singular ? ` ${total === 1 ? singular : plural}` : ''
  return (
    <nav aria-label="Páginas" className="flex items-center justify-between gap-3">
      <p className="text-cuerpo-pequeno text-texto-secundario">
        {(desde + 1).toLocaleString('es-CO')}–{(desde + visibles).toLocaleString('es-CO')} de{' '}
        {total.toLocaleString('es-CO')}
        {nombre}
      </p>
      <div className="flex items-center gap-2">
        <BotonDeIcono
          icono={iconoAnterior}
          nombre="Página anterior"
          disabled={pagina === 0}
          onClick={() => alCambiar(pagina - 1)}
        />
        {numeros ? (
          <ol className="hidden items-center gap-2 lg:flex">
            {paginasVisibles(pagina, ultima).map((numero, i) =>
              numero === null ? (
                // oxlint-disable-next-line react/no-array-index-key -- los «…» no tienen otra identidad
                <li key={`salto-${i}`} aria-hidden="true" className="px-1 text-texto-secundario">
                  …
                </li>
              ) : (
                <li key={numero}>
                  <button
                    type="button"
                    aria-label={`Página ${numero + 1}`}
                    aria-current={numero === pagina ? 'page' : undefined}
                    onClick={() => alCambiar(numero)}
                    className={`flex size-8 cursor-pointer items-center justify-center rounded-control text-etiqueta-fuerte ${
                      numero === pagina
                        ? 'bg-primario text-sobre-primario'
                        : 'bg-superficie text-texto inset-ring inset-ring-borde hover:bg-gris-100'
                    }`}
                  >
                    {numero + 1}
                  </button>
                </li>
              ),
            )}
          </ol>
        ) : null}
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
