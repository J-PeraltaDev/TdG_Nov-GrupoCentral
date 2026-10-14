import { Link } from 'react-router'
import { formatearCodigo } from '../utils/codigo.js'
import {
  esMismoDiaEnColombia,
  formatearFechaCorta,
  formatearHora,
  tiempoTranscurrido,
} from '../utils/fechas.js'
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

/** Cuándo se registró una pendiente: «hoy 6:52 a. m.» o «22 sep, 6:52 a. m.» (Figma 04-B). */
const registradaEl = (fecha) =>
  esMismoDiaEnColombia(fecha) ? `hoy ${formatearHora(fecha)}` : formatearFechaCorta(fecha)

/**
 * Tarjeta de una novedad en las listas del teléfono (Figma 2:36 y 3:338): código, estado,
 * prioridad, descripción y tiempo desde el registro. Va dentro de una lista (`<ul>`).
 *
 * Una pendiente de sincronizar (estado `pendiente`, 04-B) todavía no tiene código: dice «Sin
 * código» y la hora en que se registró.
 *
 * @param {object} props
 * @param {object} props.novedad Fila de `v_novedad` con `codigo`, `estado`, `prioridad`,
 *   `descripcion`, `fecha_registro` y el dato del pie (`area` o `finca`).
 * @param {'area' | 'finca'} [props.pie] Qué acompaña al tiempo: el reportante ve el área que
 *   atiende; el aprobador, la finca que reporta.
 * @param {string} [props.a] Ruta que abre la tarjeta. Sin ella, la tarjeta no es un enlace.
 * @param {string} [props.origen] Ruta de la lista, con sus filtros: el detalle vuelve a ella.
 */
export function TarjetaNovedad({ novedad, pie = 'area', a, origen }) {
  const pendiente = novedad.estado === 'pendiente'
  const codigo = pendiente ? 'Sin código' : formatearCodigo(novedad.codigo)
  const barra = pendiente
    ? 'bg-estado-pendiente-borde'
    : (COLOR_DE_LA_BARRA[novedad.prioridad] ?? 'bg-gris-300')

  return (
    <li className="relative flex overflow-clip rounded-xl border border-borde bg-superficie has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primario">
      <span className={`w-1 flex-none ${barra}`} />
      <article className="flex min-w-0 flex-1 flex-col gap-2 py-3 pr-3.5 pl-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <h2
            className={
              pendiente
                ? 'text-etiqueta-fuerte text-texto-secundario'
                : 'text-cuerpo-fuerte text-texto'
            }
            translate={pendiente ? undefined : 'no'}
          >
            {/* El enlace cubre toda la tarjeta; su nombre es el código. */}
            {a ? (
              <Link
                to={a}
                state={origen ? { origen } : undefined}
                className="outline-none after:absolute after:inset-0"
              >
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
            {pendiente
              ? registradaEl(novedad.fecha_registro)
              : tiempoTranscurrido(novedad.fecha_registro)}
          </time>
        </p>
      </article>
    </li>
  )
}
