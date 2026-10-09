import { Link } from 'react-router'
import { Estado } from '../../core/ui/Estado.jsx'
import { Prioridad } from '../../core/ui/Prioridad.jsx'
import { formatearCodigo } from '../../core/utils/codigo.js'
import { formatearFechaCorta } from '../../core/utils/fechas.js'

/** `id` del panel: la fila elegida de la tabla lo referencia con `aria-controls`. */
export const ID_DE_LA_VISTA_PREVIA = 'bandeja-vista-previa'

function Dato({ nombre, children }) {
  return (
    <div className="flex gap-3">
      <dt className="w-[90px] flex-none text-cuerpo-pequeno text-texto-secundario">{nombre}</dt>
      <dd className="min-w-0 flex-1 text-etiqueta-fuerte break-words text-texto">{children}</dd>
    </div>
  )
}

/**
 * Panel lateral de la bandeja del escritorio (Figma 3:734): lo esencial de la novedad elegida
 * en la tabla, sin salir de la bandeja. Si la novedad se escaló, muestra la justificación; si
 * el director ya la aprobó, también su decisión (RF-12, RF-13).
 *
 * @param {object} props
 * @param {object} props.novedad Fila de la bandeja.
 * @param {import('./reglasDeBandeja.js').ResumenDeTransiciones} [props.resumen]
 */
export function VistaPrevia({ novedad, resumen }) {
  const codigo = formatearCodigo(novedad.codigo)
  const justificacion = ['escalada', 'aprobada'].includes(novedad.estado)
    ? resumen?.justificacion
    : null
  const decision = novedad.estado === 'aprobada' ? resumen?.decision : null

  return (
    <aside
      id={ID_DE_LA_VISTA_PREVIA}
      aria-label={`Vista previa de ${codigo}`}
      className="flex w-full flex-col gap-3.5 rounded-xl border border-borde bg-superficie p-5 xl:w-[300px] xl:flex-none min-[90rem]:w-[340px]"
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <h2 className="text-subtitulo text-texto" translate="no">
          {codigo}
        </h2>
        <Estado estado={novedad.estado} />
        <Prioridad prioridad={novedad.prioridad} />
      </div>

      <dl className="flex flex-col gap-3.5">
        <Dato nombre="Finca">{novedad.finca}</Dato>
        <Dato nombre="Área">{novedad.area}</Dato>
      </dl>

      <p className="text-cuerpo-pequeno break-words text-texto">{novedad.descripcion}</p>

      {justificacion ? (
        <div className="flex flex-col gap-1 rounded-control bg-estado-escalada-fondo p-3">
          <p className="text-auxiliar-fuerte text-estado-escalada-texto">
            Justificación del escalamiento
          </p>
          <p className="text-cuerpo-pequeno break-words text-texto">{justificacion}</p>
        </div>
      ) : null}

      {decision ? (
        <div className="flex flex-col gap-1 rounded-control bg-estado-aprobada-fondo p-3">
          <p className="text-auxiliar-fuerte text-estado-aprobada-texto">Decisión del director</p>
          {decision.observacion ? (
            <p className="text-cuerpo-pequeno break-words text-texto">{decision.observacion}</p>
          ) : null}
          <p className="text-auxiliar text-texto-secundario">
            {[decision.usuario, formatearFechaCorta(decision.fecha_hora)]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
      ) : null}

      <Link
        to={`/novedades/${novedad.id}`}
        className="flex h-10 items-center justify-center rounded-control px-4 text-etiqueta-fuerte text-primario"
      >
        Ver detalle completo
      </Link>
    </aside>
  )
}
