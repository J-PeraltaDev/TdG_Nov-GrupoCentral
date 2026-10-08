import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router'
import { useEnLinea } from '../../core/conexion/useEnLinea.js'
import { useSesion } from '../../core/sesion/ContextoSesion.js'
import { Boton } from '../../core/ui/Boton.jsx'
import { Conexion } from '../../core/ui/Conexion.jsx'
import { Estado } from '../../core/ui/Estado.jsx'
import { Icono } from '../../core/ui/Icono.jsx'
import iconoRecibida from '../../core/ui/iconos/check.svg'
import iconoCopiar from '../../core/ui/iconos/content_copy.svg'
import { Prioridad } from '../../core/ui/Prioridad.jsx'
import { formatearCodigo } from '../../core/utils/codigo.js'
import { formatearFechaHora, semanaDelAnio } from '../../core/utils/fechas.js'

/*
 * Pantalla 06 · Novedad recibida (RF-06, RF-07, CU-06): la constancia con el código, la
 * fecha real de registro y el estado. Figma 2:887.
 */

const ENLACE_BOTON =
  'inline-flex h-12 w-full items-center justify-center gap-2 rounded-control px-5 text-cuerpo-fuerte whitespace-nowrap lg:h-10 lg:px-4 lg:text-etiqueta-fuerte'

function Dato({ etiqueta, children }) {
  return (
    <div className="flex items-start gap-3">
      <dt className="w-32 flex-none text-cuerpo-pequeno text-texto-secundario">{etiqueta}</dt>
      <dd className="min-w-0 flex-1 text-etiqueta-fuerte text-texto">{children}</dd>
    </div>
  )
}

export default function NovedadRecibida() {
  const { perfil } = useSesion()
  const { state } = useLocation()
  const enLinea = useEnLinea()
  const [copiado, setCopiado] = useState(false)

  // La constancia se muestra justo después de registrar; si se abre la ruta directamente,
  // no hay nada que mostrar.
  const novedad = state?.novedad
  if (!novedad) return <Navigate to="/novedades" replace />

  const codigo = formatearCodigo(novedad.codigo)
  const area = state.area

  async function alCopiar() {
    try {
      await navigator.clipboard.writeText(codigo)
      setCopiado(true)
    } catch {
      setCopiado(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex justify-end px-4 py-2 lg:hidden">
        <Conexion estado={enLinea ? 'en_linea' : 'sin_conexion'} />
      </div>

      <section className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 px-4 pt-10 pb-6 lg:px-8">
        <span className="flex size-22 items-center justify-center rounded-full bg-exito-suave text-exito">
          <Icono src={iconoRecibida} tamano={44} />
        </span>
        <h1 className="text-center text-titulo text-texto">Novedad recibida</h1>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <p className="text-codigo text-texto" translate="no">
            {codigo}
          </p>
          <Boton tipo="secundario" tamano="escritorio" icono={iconoCopiar} onClick={alCopiar}>
            Copiar
          </Boton>
        </div>
        <p role="status" className="sr-only">
          {copiado ? `Código ${codigo} copiado` : ''}
        </p>

        <dl className="flex w-full flex-col gap-3 rounded-xl bg-superficie p-4 inset-ring inset-ring-borde">
          <Dato etiqueta="Finca">{perfil.finca?.nombre ?? ''}</Dato>
          <Dato etiqueta="Registrada">
            {formatearFechaHora(novedad.fecha_registro)} (Sem{' '}
            {semanaDelAnio(novedad.fecha_registro)})
          </Dato>
          <Dato etiqueta="Prioridad">
            <Prioridad prioridad={novedad.prioridad} />
          </Dato>
          <Dato etiqueta="Estado">
            <Estado estado={novedad.estado} />
          </Dato>
          <Dato etiqueta="Área">{area}</Dato>
        </dl>

        <p className="text-center text-cuerpo text-texto-secundario">
          {area || 'El área'} ya la tiene en su bandeja. Te avisaremos cada vez que cambie de
          estado.
        </p>

        <Link
          to={`/novedades/${novedad.id}`}
          state={{ origen: '/novedades' }}
          className={`${ENLACE_BOTON} bg-primario text-sobre-primario hover:bg-primario-hover`}
        >
          Ver novedad
        </Link>
        <Link
          to="/registrar"
          className={`${ENLACE_BOTON} bg-superficie text-texto inset-ring inset-ring-borde`}
        >
          Registrar otra novedad
        </Link>
      </section>
    </div>
  )
}
