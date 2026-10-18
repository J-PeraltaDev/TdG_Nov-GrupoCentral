import { Icono } from '../../core/ui/Icono.jsx'
import iconoSinFechas from '../../core/ui/iconos/event_busy.svg'

/**
 * 25-B (CU-28 2a) y 26 sin datos (CU-29 2a): el período elegido no tiene novedades.
 *
 * @param {object} props
 * @param {string} [props.titulo]
 */
export function SinNovedadesEnElPeriodo({
  titulo = 'No hay novedades registradas en este período',
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-borde bg-superficie px-6 py-12 text-center lg:py-16">
      <span className="mb-2 flex size-[72px] items-center justify-center rounded-full bg-gris-100 text-texto-secundario">
        <Icono src={iconoSinFechas} tamano={36} />
      </span>
      <p role="status" className="text-subtitulo text-texto">
        {titulo}
      </p>
      <p className="text-cuerpo text-texto-secundario">Elige otro período.</p>
    </div>
  )
}
