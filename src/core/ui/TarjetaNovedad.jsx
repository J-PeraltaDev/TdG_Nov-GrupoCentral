import { Link } from 'react-router'
import { formatearCodigo } from '../utils/codigo.js'
import { tiempoTranscurrido } from '../utils/fechas.js'
import { Estado } from './Estado.jsx'
import { Icono } from './Icono.jsx'
import iconoTiempo from './iconos/schedule.svg'
import { Prioridad } from './Prioridad.jsx'

const COLOR_DE_LA_BARRA = {
  critico: 'bg-prioridad-critico',
  alto: 'bg-prioridad-alto',
  normal: 'bg-prioridad-normal',
  bajo: 'bg-prioridad-bajo',
}

/**
 * Tarjeta de una novedad en las listas del teléfono (Figma 2:36 y 3:338): código, estado,
 * prioridad, descripción y tiempo desde el registro. Va dentro de una lista (`<ul>`).
 *
 * @param {object} props
 * @param {object} props.novedad Fila de `v_novedad` con `codigo`, `estado`, `prioridad`,
 *   `descripcion`, `fecha_registro` y el dato del pie (`area` o `finca`).
 * @param {'area' | 'finca'} [props.pie] Qué acompaña al tiempo: el reportante ve el área que
 *   atiende; el aprobador, la finca que reporta.
 * @param {string} [props.a] Ruta que abre la tarjeta. Sin ella, la tarjeta no es un enlace.
 */
export function TarjetaNovedad({ novedad, pie = 'area', a }) {
  const codigo = formatearCodigo(novedad.codigo)

  return (
    <li className="relative flex overflow-clip rounded-xl border border-borde bg-superficie has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primario">
      <span className={`w-1 flex-none ${COLOR_DE_LA_BARRA[novedad.prioridad] ?? 'bg-gris-300'}`} />
      <article className="flex min-w-0 flex-1 flex-col gap-2 py-3 pr-3.5 pl-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <h2 className="text-cuerpo-fuerte text-texto" translate="no">
            {/* El enlace cubre toda la tarjeta; su nombre es el código. */}
            {a ? (
              <Link to={a} className="outline-none after:absolute after:inset-0">
                {codigo}
              </Link>
            ) : (
              codigo
            )}
          </h2>
          <Estado estado={novedad.estado} />
          <Prioridad prioridad={novedad.prioridad} />
        </div>
        <p className="line-clamp-2 text-cuerpo-pequeno break-words text-texto">
          {novedad.descripcion}
        </p>
        <p className="flex items-center gap-1.5 text-auxiliar text-texto-secundario">
          <span className="min-w-0 flex-1 truncate">{novedad[pie]}</span>
          <Icono src={iconoTiempo} tamano={14} />
          <time dateTime={novedad.fecha_registro}>
            {tiempoTranscurrido(novedad.fecha_registro)}
          </time>
        </p>
      </article>
    </li>
  )
}
