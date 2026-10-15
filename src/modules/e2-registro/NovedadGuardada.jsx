import { useEffect, useRef } from 'react'
import { Link, Navigate, useLocation } from 'react-router'
import { usePendientes } from '../../core/offline/pendientes.js'
import { Aviso } from '../../core/ui/Aviso.jsx'
import { Conexion } from '../../core/ui/Conexion.jsx'
import { Estado } from '../../core/ui/Estado.jsx'
import { Icono } from '../../core/ui/Icono.jsx'
import iconoSinConexion from '../../core/ui/iconos/cloud_off.svg'
import iconoInfo from '../../core/ui/iconos/info.svg'
import { Prioridad } from '../../core/ui/Prioridad.jsx'
import { codigoLocal } from '../../core/utils/codigo.js'
import { formatearFechaHora } from '../../core/utils/fechas.js'

/*
 * Pantalla 07 · Guardada en el dispositivo (RF-21 / CU-21 3 a 5): la constancia local de una
 * novedad que quedó en la cola, con su identificador local y su fecha real. Figma 2:935. Se
 * muestra solo después de que la escritura quedó confirmada (`encolar`).
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

export default function NovedadGuardada() {
  const { state } = useLocation()
  const pendientes = usePendientes()
  const titulo = useRef(/** @type {HTMLHeadingElement | null} */ (null))

  // Quien registró sigue desde aquí, también con el teclado o con lector de pantalla.
  useEffect(() => {
    titulo.current?.focus()
  }, [])

  // La constancia se muestra justo después de guardar; si se abre la ruta directamente,
  // no hay nada que mostrar.
  const pendiente = state?.pendiente
  if (!pendiente) return <Navigate to="/novedades" replace />

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex justify-end px-4 py-2 lg:hidden">
        <Conexion />
      </div>

      <section className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 px-4 pt-8 pb-6 lg:px-8">
        <span className="flex size-22 items-center justify-center rounded-full bg-advertencia-suave text-advertencia">
          <Icono src={iconoSinConexion} tamano={44} />
        </span>
        <h1 ref={titulo} tabIndex={-1} className="text-center text-titulo text-texto outline-none">
          Guardada en este teléfono
        </h1>
        <p className="text-center text-cuerpo text-texto-secundario">
          No hay internet. La novedad quedó guardada y se enviará sola, en el orden en que la
          registraste, cuando vuelva la conexión. El código se asigna al sincronizar.
        </p>

        <dl className="flex w-full flex-col gap-3 rounded-xl bg-superficie p-4 inset-ring inset-ring-borde">
          <Dato etiqueta="Identificador local">
            <span className="text-cuerpo-pequeno" translate="no">
              {codigoLocal(pendiente.id_local)}
            </span>
          </Dato>
          <Dato etiqueta="Registrada en finca">{formatearFechaHora(pendiente.fecha_registro)}</Dato>
          <Dato etiqueta="Prioridad">
            <Prioridad prioridad={pendiente.prioridad} />
          </Dato>
          <Dato etiqueta="Área">{pendiente.area}</Dato>
          <Dato etiqueta="Estado">
            <Estado estado="pendiente" />
          </Dato>
        </dl>

        {/* SDD 6.1.5 lo pide cuando el navegador no concede el almacenamiento persistente; Figma
            lo dibuja siempre, y siempre es cierto (decisión 3). */}
        <Aviso tipo="info" icono={iconoInfo} className="w-full">
          No borres los datos del navegador ni desinstales la app hasta que se sincronice.
        </Aviso>

        <Link
          to="/pendientes"
          className={`${ENLACE_BOTON} bg-primario text-sobre-primario hover:bg-primario-hover`}
        >
          Ver pendientes ({pendientes})
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
