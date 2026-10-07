import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { traducirError } from '../../core/errores/traducir.js'
import { contarNovedades, listarNovedades } from '../../core/supabase/repositorios/novedades.js'
import { Aviso } from '../../core/ui/Aviso.jsx'
import { Boton } from '../../core/ui/Boton.jsx'
import { Estado } from '../../core/ui/Estado.jsx'
import { Icono } from '../../core/ui/Icono.jsx'
import iconoRegistrar from '../../core/ui/iconos/add.svg'
import iconoSinAbiertas from '../../core/ui/iconos/check_circle.svg'
import iconoSinConexion from '../../core/ui/iconos/cloud_off.svg'
import iconoError from '../../core/ui/iconos/error.svg'
import iconoTiempo from '../../core/ui/iconos/schedule.svg'
import iconoPorConfirmar from '../../core/ui/iconos/task_alt.svg'
import { Prioridad } from '../../core/ui/Prioridad.jsx'
import { formatearCodigo } from '../../core/utils/codigo.js'
import { tiempoTranscurrido } from '../../core/utils/fechas.js'

/*
 * Pantalla 04 · Mis novedades y 04-C · Finca sin novedades abiertas (RF-18). Figma 2:36 y
 * 2:291. La base de datos limita la lista a la finca del reportante (RNF-11). El detalle de
 * cada novedad llega en el Sprint 2 y la consulta sin conexión (04-B), en el Sprint 4.
 */

/** Pestañas de Figma: agrupan los estados según lo que el reportante espera de cada caso. */
const PESTANAS = [
  {
    id: 'abiertas',
    nombre: 'Abiertas',
    estados: ['registrada', 'asignada', 'en_atencion', 'escalada', 'aprobada'],
    conConteo: true,
  },
  { id: 'por_confirmar', nombre: 'Por confirmar', estados: ['resuelta'], conConteo: true },
  { id: 'cerradas', nombre: 'Cerradas', estados: ['cerrada'] },
  { id: 'rechazadas', nombre: 'Rechazadas', estados: ['rechazada'] },
]

const COLOR_DE_LA_BARRA = {
  critico: 'bg-prioridad-critico',
  alto: 'bg-prioridad-alto',
  normal: 'bg-prioridad-normal',
  bajo: 'bg-prioridad-bajo',
}

const BOTON_REGISTRAR =
  'h-12 items-center justify-center gap-2 px-5 text-cuerpo-fuerte whitespace-nowrap bg-primario text-sobre-primario hover:bg-primario-hover'

function Tarjeta({ novedad }) {
  return (
    <li className="flex overflow-clip rounded-xl border border-borde bg-superficie">
      <span className={`w-1 flex-none ${COLOR_DE_LA_BARRA[novedad.prioridad] ?? 'bg-gris-300'}`} />
      <article className="flex min-w-0 flex-1 flex-col gap-2 py-3 pr-3.5 pl-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <h2 className="text-cuerpo-fuerte text-texto" translate="no">
            {formatearCodigo(novedad.codigo)}
          </h2>
          <Estado estado={novedad.estado} />
          <Prioridad prioridad={novedad.prioridad} />
        </div>
        <p className="line-clamp-2 text-cuerpo-pequeno break-words text-texto">
          {novedad.descripcion}
        </p>
        <p className="flex items-center gap-1.5 text-auxiliar text-texto-secundario">
          <span className="min-w-0 flex-1 truncate">{novedad.area}</span>
          <Icono src={iconoTiempo} tamano={14} />
          <time dateTime={novedad.fecha_registro}>
            {tiempoTranscurrido(novedad.fecha_registro)}
          </time>
        </p>
      </article>
    </li>
  )
}

function SinAbiertas() {
  return (
    <div className="flex flex-col items-center gap-3 px-4 pt-14 pb-6 text-center">
      <span className="flex size-18 items-center justify-center rounded-full bg-exito-suave text-exito">
        <Icono src={iconoSinAbiertas} tamano={36} />
      </span>
      <p className="text-subtitulo text-texto">Tu finca no tiene novedades abiertas</p>
      <p className="text-cuerpo text-texto-secundario">
        Cuando registres una, aquí verás en qué va.
      </p>
      <Link to="/registrar" className={`${BOTON_REGISTRAR} inline-flex rounded-control`}>
        <Icono src={iconoRegistrar} tamano={20} />
        Registrar novedad
      </Link>
    </div>
  )
}

export default function MisNovedades() {
  // El filtro vive en la URL: se puede volver a él con «atrás» y compartir el enlace.
  const [parametros, setParametros] = useSearchParams()
  const pestana = PESTANAS.find((opcion) => opcion.id === parametros.get('lista')) ?? PESTANAS[0]
  const setPestana = (opcion) =>
    setParametros(opcion === PESTANAS[0] ? {} : { lista: opcion.id }, { replace: true })
  const [intento, setIntento] = useState(0)
  const [conteos, setConteos] = useState({ abiertas: null, por_confirmar: null })
  // Cada resultado lleva la consulta que lo produjo: mientras no coincida con la vigente,
  // la lista está cargando.
  const [lista, setLista] = useState({ consulta: '', novedades: [], total: 0, pagina: 0 })
  const [fallo, setFallo] = useState(null)
  const [cargandoMas, setCargandoMas] = useState(false)

  const consulta = `${pestana.id}:${intento}`

  // Los conteos de los filtros y la primera página no dependen entre sí: van en paralelo.
  useEffect(() => {
    let vigente = true
    Promise.all([
      listarNovedades({ estados: pestana.estados }),
      contarNovedades(PESTANAS[0].estados),
      contarNovedades(PESTANAS[1].estados),
    ])
      .then(([pagina, abiertas, porConfirmar]) => {
        if (!vigente) return
        setConteos({ abiertas, por_confirmar: porConfirmar })
        setLista({ consulta, ...pagina, pagina: 0 })
        setFallo(null)
      })
      .catch((error) => {
        if (!vigente) return
        setLista({ consulta, novedades: [], total: 0, pagina: 0 })
        setFallo(traducirError(error))
      })
    return () => {
      vigente = false
    }
  }, [pestana, consulta])

  async function verMas() {
    setCargandoMas(true)
    setFallo(null)
    try {
      const siguiente = lista.pagina + 1
      const pagina = await listarNovedades({ estados: pestana.estados, pagina: siguiente })
      // Si entre tanto cambió el filtro, esta página ya no corresponde a lo que se ve.
      setLista((actual) =>
        actual.consulta === consulta
          ? {
              consulta,
              novedades: [...actual.novedades, ...pagina.novedades],
              total: pagina.total,
              pagina: siguiente,
            }
          : actual,
      )
    } catch (error) {
      setFallo(traducirError(error))
    } finally {
      setCargandoMas(false)
    }
  }

  const cargando = lista.consulta !== consulta
  const porConfirmar = conteos.por_confirmar ?? 0
  const hayMas = lista.novedades.length < lista.total
  const vacia = !cargando && !fallo && lista.novedades.length === 0
  const sinAbiertas = vacia && pestana.id === 'abiertas'
  // Con la lista a la vista, el reintento es volver a pedir la página que faltó.
  const reintentar = lista.novedades.length > 0 ? verMas : () => setIntento((n) => n + 1)

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-3.5 px-4 pt-4 pb-24 lg:px-8 lg:py-8">
      <div className="flex items-center justify-between gap-3 max-lg:contents">
        <h1 className="sr-only text-titulo text-texto lg:not-sr-only">Mis novedades</h1>
        <Link
          to="/registrar"
          className={`${BOTON_REGISTRAR} hidden rounded-control lg:inline-flex lg:h-10 lg:px-4 lg:text-etiqueta-fuerte`}
        >
          <Icono src={iconoRegistrar} tamano={20} />
          Registrar novedad
        </Link>
      </div>

      {porConfirmar > 0 && pestana.id !== 'por_confirmar' ? (
        <div className="flex items-center gap-3 rounded-xl bg-exito-suave py-2.5 pr-2.5 pl-3.5">
          <Icono src={iconoPorConfirmar} tamano={22} className="text-exito" />
          <p className="min-w-0 flex-1 text-etiqueta-fuerte text-texto">
            {porConfirmar === 1
              ? '1 novedad resuelta espera tu confirmación'
              : `${porConfirmar} novedades resueltas esperan tu confirmación`}
          </p>
          <Boton tipo="secundario" tamano="escritorio" onClick={() => setPestana(PESTANAS[1])}>
            Revisar
          </Boton>
        </div>
      ) : null}

      <div
        role="group"
        aria-label="Filtrar por estado"
        className="-mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0"
      >
        {PESTANAS.map((opcion) => {
          const elegida = opcion.id === pestana.id
          const conteo = opcion.conConteo ? conteos[opcion.id] : null
          return (
            <button
              key={opcion.id}
              type="button"
              aria-pressed={elegida}
              onClick={() => setPestana(opcion)}
              className="group -my-[7px] flex min-h-12 flex-none cursor-pointer items-center outline-none"
            >
              <span
                className={`rounded-full px-[13px] py-[7px] whitespace-nowrap inset-ring group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-primario ${
                  elegida
                    ? 'bg-primario-contenedor text-etiqueta-fuerte text-primario inset-ring-primario'
                    : 'bg-superficie text-etiqueta text-texto inset-ring-borde'
                }`}
              >
                {opcion.nombre}
                {conteo === null ? '' : ` (${conteo})`}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-col gap-2.5">
        {cargando ? (
          <p role="status" className="py-6 text-center text-cuerpo-pequeno text-texto-secundario">
            Cargando…
          </p>
        ) : null}

        {sinAbiertas ? <SinAbiertas /> : null}
        {vacia && !sinAbiertas ? (
          <p className="py-10 text-center text-cuerpo text-texto-secundario">
            No hay novedades en esta lista.
          </p>
        ) : null}

        {!cargando && lista.novedades.length > 0 ? (
          <ul className="flex flex-col gap-2.5">
            {lista.novedades.map((novedad) => (
              <Tarjeta key={novedad.id} novedad={novedad} />
            ))}
          </ul>
        ) : null}

        {!cargando && fallo ? (
          <Aviso
            tipo={fallo.tipo === 'red' ? 'advertencia' : 'error'}
            icono={fallo.tipo === 'red' ? iconoSinConexion : iconoError}
            role="alert"
            accion={
              <Boton tipo="texto" tamano="escritorio" onClick={reintentar}>
                Reintentar
              </Boton>
            }
          >
            {fallo.mensaje}
          </Aviso>
        ) : null}

        {!cargando && !fallo && hayMas ? (
          <Boton tipo="secundario" onClick={verMas} disabled={cargandoMas} className="self-center">
            {cargandoMas ? 'Cargando…' : 'Ver más'}
          </Boton>
        ) : null}
      </div>

      {/* Botón flotante del teléfono; en el escritorio el botón va junto al título. Con la
          lista vacía (04-C) el botón ya está en el centro de la pantalla. */}
      {sinAbiertas ? null : (
        <Link
          to="/registrar"
          className={`${BOTON_REGISTRAR} fixed right-4 bottom-[calc(max(1.25rem,env(safe-area-inset-bottom))+4.8125rem)] z-10 inline-flex rounded-2xl shadow-[0_8px_12px_rgb(15_20_18/0.16)] lg:hidden`}
        >
          <Icono src={iconoRegistrar} tamano={20} />
          Registrar novedad
        </Link>
      )}
    </section>
  )
}
