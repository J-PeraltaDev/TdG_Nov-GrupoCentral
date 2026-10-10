import { useId } from 'react'
import { Icono } from '../../core/ui/Icono.jsx'
import iconoCita from '../../core/ui/iconos/format_quote.svg'

/**
 * Recuadro con la justificación con que el área escaló la novedad (Figma 4:661, pantallas 19,
 * 20 y 20-C): lo que el director lee antes de decidir.
 *
 * @param {object} props
 * @param {string} props.texto La justificación.
 * @param {string} [props.pie] Quién escaló y, en el detalle, cuándo.
 * @param {boolean} [props.seccion] En el detalle es una sección de la página, con su título;
 *   en la lista (una por tarjeta) es solo un recuadro.
 */
export function JustificacionDelEscalamiento({ texto, pie, seccion = false }) {
  const idDelTitulo = useId()
  const Contenedor = seccion ? 'section' : 'div'
  const Titulo = seccion ? 'h2' : 'p'

  return (
    <Contenedor
      aria-labelledby={seccion ? idDelTitulo : undefined}
      className="flex items-start gap-3 rounded-control bg-estado-escalada-fondo p-3.5"
    >
      <Icono src={iconoCita} tamano={22} className="flex-none text-estado-escalada-texto" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Titulo id={idDelTitulo} className="text-auxiliar-fuerte text-estado-escalada-texto">
          Justificación del escalamiento
        </Titulo>
        <p className="text-cuerpo break-words text-texto">{texto}</p>
        {pie ? <p className="text-auxiliar text-texto-secundario">{pie}</p> : null}
      </div>
    </Contenedor>
  )
}
