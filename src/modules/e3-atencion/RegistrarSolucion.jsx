import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router'
import { ACCION, accionesDisponibles } from '../../core/acciones/accionesDisponibles.js'
import { OBSERVACION_MAX_CARACTERES } from '../../core/config/parametros.js'
import { useEnLinea } from '../../core/conexion/useEnLinea.js'
import { traducirError } from '../../core/errores/traducir.js'
import { useSesion } from '../../core/sesion/ContextoSesion.js'
import {
  listarLineaDeTiempo,
  obtenerNovedad,
  registrarSolucion,
} from '../../core/supabase/repositorios/novedades.js'
import { AreaDeTexto } from '../../core/ui/AreaDeTexto.jsx'
import { Aviso } from '../../core/ui/Aviso.jsx'
import { AvisoTemporal } from '../../core/ui/AvisoTemporal.jsx'
import { Boton } from '../../core/ui/Boton.jsx'
import { CampoTexto } from '../../core/ui/CampoTexto.jsx'
import { Conexion } from '../../core/ui/Conexion.jsx'
import { Icono } from '../../core/ui/Icono.jsx'
import { useEsEscritorio } from '../../core/ui/useEsEscritorio.js'
import iconoFecha from '../../core/ui/iconos/calendar_today.svg'
import iconoCerrar from '../../core/ui/iconos/close.svg'
import iconoSinConexion from '../../core/ui/iconos/cloud_off.svg'
import iconoError from '../../core/ui/iconos/error.svg'
import iconoDesplegar from '../../core/ui/iconos/expand_more.svg'
import iconoResolver from '../../core/ui/iconos/task_alt.svg'
import iconoAprobada from '../../core/ui/iconos/verified.svg'
import { formatearCodigo } from '../../core/utils/codigo.js'
import {
  formatearFechaCorta,
  formatearFechaSinHora,
  hoyEnColombia,
} from '../../core/utils/fechas.js'
import { SinPermiso } from '../e4-consulta/SinPermiso.jsx'
import { SelectorDeTipoDeFalla } from './SelectorDeTipoDeFalla.jsx'
import { useAccion } from './useAccion.js'

/*
 * Pantalla 18 · Registrar solución y tipo de falla, 18-B · Fecha posterior a hoy y 18-C ·
 * Novedad aprobada por el director (RF-14 / CU-14). Figma 3:1619, 3:1685 y 3:1754.
 *
 * Es una pantalla de una sola tarea, como el registro: en el teléfono va sin las barras de
 * navegación. Al terminar vuelve al detalle, que muestra la novedad ya resuelta.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** La fecha de ejecución no puede pasar de hoy (CU-14 6a, pantalla 18-B). */
const fechaPosterior = (hoy) =>
  `La fecha de ejecución no puede ser posterior a hoy (${formatearFechaSinHora(hoy)})`

/**
 * La decisión del director, cuando la novedad viene de un escalamiento aprobado (18-C): es la
 * última transición de escalada a aprobada.
 */
function aprobacionDe(transiciones) {
  return (
    transiciones.find(
      (transicion) =>
        transicion.estado_anterior === 'escalada' && transicion.estado_nuevo === 'aprobada',
    ) ?? null
  )
}

function ErrorDeCampo({ id, children }) {
  return (
    <p id={id} className="flex items-start gap-1 text-auxiliar text-error">
      <Icono src={iconoError} tamano={16} className="flex-none" />
      {children}
    </p>
  )
}

/** La descripción de la novedad, recogida en dos líneas para no alejar el formulario. */
function Resumen({ descripcion }) {
  const [desplegado, setDesplegado] = useState(false)
  return (
    <button
      type="button"
      aria-expanded={desplegado}
      onClick={() => setDesplegado((antes) => !antes)}
      className="flex w-full cursor-pointer items-center gap-2.5 rounded-control bg-gris-100 p-3 text-left text-cuerpo-pequeno text-texto"
    >
      <span className={`min-w-0 flex-1 break-words ${desplegado ? '' : 'line-clamp-2'}`}>
        <span className="sr-only">Descripción de la novedad: </span>
        {descripcion}
      </span>
      <Icono
        src={iconoDesplegar}
        tamano={20}
        className={`flex-none text-texto-secundario ${desplegado ? 'rotate-180' : ''}`}
      />
    </button>
  )
}

/**
 * El formulario. Va aparte para que sus datos existan solo cuando ya se sabe que la novedad
 * admite registrar la solución.
 */
function Formulario({ novedad, aprobacion, detalle, estadoDeNavegacion, esEscritorio }) {
  const navegar = useNavigate()
  const hoy = hoyEnColombia()
  const idDeAyudaDeFecha = useId()
  const campoSolucion = useRef(/** @type {HTMLTextAreaElement | null} */ (null))
  const campoFecha = useRef(/** @type {HTMLInputElement | null} */ (null))
  const campoTipo = useRef(/** @type {HTMLElement | null} */ (null))

  const [solucion, setSolucion] = useState('')
  const [fecha, setFecha] = useState(hoy)
  const [tipo, setTipo] = useState(
    /** @type {import('./SelectorDeTipoDeFalla.jsx').TipoElegido | null} */ (null),
  )
  const [errores, setErrores] = useState(
    /** @type {{ solucion?: string, fecha?: string, tipo?: string, general?: string }} */ ({}),
  )
  const quitarError = (campo) =>
    setErrores((antes) => (antes[campo] ? { ...antes, [campo]: undefined } : antes))

  // Los errores de la red y del permiso van en un aviso temporal, como en el detalle (14-C).
  const { ejecutar, enCurso, aviso, cerrarAviso } = useAccion({
    estado: novedad.estado,
    alCambiar: () => {},
  })

  async function alEnviar(evento) {
    evento.preventDefault()
    if (enCurso) return

    // CU-14 6a: se señala lo que falta y la fecha que no puede ser.
    const faltantes = {
      solucion: solucion.trim() === '' ? 'Describe qué se hizo.' : undefined,
      fecha:
        fecha === ''
          ? 'Indica la fecha de ejecución.'
          : fecha > hoy
            ? fechaPosterior(hoy)
            : undefined,
      tipo: tipo ? undefined : 'Elige un tipo de falla o crea uno nuevo.',
    }
    setErrores(faltantes)
    if (faltantes.solucion) return campoSolucion.current?.focus()
    if (faltantes.fecha) return campoFecha.current?.focus()
    if (faltantes.tipo) return campoTipo.current?.focus()

    const { ok, fallo } = await ejecutar(
      () =>
        registrarSolucion(novedad.id, {
          solucion: solucion.trim(),
          fecha_ejecucion: fecha,
          tipo_falla_id: tipo.id,
          tipo_falla_nombre: tipo.id ? null : tipo.nombre,
        }),
      {
        codigosPropios: [
          'DATO_OBLIGATORIO',
          'FECHA_INVALIDA',
          'TIPO_FALLA_INVALIDO',
          'TRANSICION_INVALIDA',
        ],
        // La novedad queda resuelta: se vuelve al detalle, que lo confirma.
        alTerminar: () =>
          navegar(detalle, {
            replace: true,
            state: {
              ...estadoDeNavegacion,
              aviso: 'Solución registrada. La finca debe confirmar el cierre.',
            },
          }),
      },
    )
    if (ok) return undefined

    if (fallo.codigo === 'FECHA_INVALIDA') {
      // El servidor y el dispositivo llegan al mismo estado (18-B).
      setErrores({ fecha: fechaPosterior(hoy) })
      campoFecha.current?.focus()
    } else if (fallo.codigo === 'TIPO_FALLA_INVALIDO') {
      setTipo(null)
      setErrores({ tipo: fallo.mensaje })
    } else if (fallo.codigo === 'DATO_OBLIGATORIO') {
      setErrores({ general: fallo.mensaje })
    } else if (fallo.codigo === 'TRANSICION_INVALIDA') {
      // Otra persona ya actuó sobre la novedad: el detalle muestra cómo quedó.
      navegar(detalle, {
        replace: true,
        state: { ...estadoDeNavegacion, aviso: fallo.mensaje, avisoDeError: true },
      })
    }
    return undefined
  }

  return (
    <form noValidate onSubmit={alEnviar} className="mx-auto flex w-full max-w-xl flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-[18px] px-4 pt-4 pb-6 lg:px-8 lg:pt-8">
        {esEscritorio ? (
          <div className="flex flex-col gap-1">
            <h1 className="text-titulo text-texto">Registrar solución</h1>
            <p className="text-cuerpo-pequeno text-texto-secundario">
              <span translate="no">{formatearCodigo(novedad.codigo)}</span> · {novedad.finca}
            </p>
          </div>
        ) : null}

        {errores.general ? (
          <Aviso tipo="error" icono={iconoError} role="alert">
            {errores.general}
          </Aviso>
        ) : null}

        {aprobacion ? (
          <section
            aria-label="Aprobación del director"
            className="flex items-start gap-2.5 rounded-xl bg-estado-aprobada-fondo p-3.5"
          >
            <Icono
              src={iconoAprobada}
              tamano={22}
              className="flex-none text-estado-aprobada-texto"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="text-etiqueta-fuerte text-texto">
                Aprobada por el director de agricultura
              </p>
              <p className="text-auxiliar text-texto-secundario">
                {[aprobacion.usuario?.nombre, formatearFechaCorta(aprobacion.fecha_hora)]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              {aprobacion.observacion ? (
                <p className="text-cuerpo-pequeno break-words text-texto">
                  «{aprobacion.observacion}»
                </p>
              ) : null}
            </div>
          </section>
        ) : null}

        <Resumen descripcion={novedad.descripcion} />

        <AreaDeTexto
          ref={campoSolucion}
          etiqueta="¿Qué se hizo?"
          obligatorio
          rows={3}
          maximo={OBSERVACION_MAX_CARACTERES}
          value={solucion}
          error={errores.solucion ?? null}
          onChange={(evento) => {
            setSolucion(evento.target.value)
            if (evento.target.value.trim() !== '') quitarError('solucion')
          }}
        />

        <div className="flex flex-col gap-1.5">
          <CampoTexto
            ref={campoFecha}
            etiqueta="Fecha de ejecución"
            obligatorio
            type="date"
            icono={iconoFecha}
            max={hoy}
            value={fecha}
            conError={Boolean(errores.fecha)}
            descritoPor={idDeAyudaDeFecha}
            onChange={(evento) => {
              setFecha(evento.target.value)
              quitarError('fecha')
            }}
          />
          {errores.fecha ? (
            <ErrorDeCampo id={idDeAyudaDeFecha}>{errores.fecha}</ErrorDeCampo>
          ) : (
            <p id={idDeAyudaDeFecha} className="text-auxiliar text-texto-secundario">
              No puede ser posterior a hoy
            </p>
          )}
        </div>

        <SelectorDeTipoDeFalla
          ref={campoTipo}
          valor={tipo}
          error={errores.tipo ?? null}
          alCambiar={(valor) => {
            setTipo(valor)
            quitarError('tipo')
          }}
        />
      </div>

      {/* En el teléfono la barra de acciones queda fija abajo; en el escritorio cierra el
          formulario. */}
      <div className="sticky bottom-0 flex flex-col gap-2.5 border-t border-borde bg-superficie px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_-4px_6px_rgb(0_0_0/0.06)] lg:static lg:border-t-0 lg:bg-transparent lg:px-8 lg:pt-0 lg:pb-8 lg:shadow-none">
        {aviso ? (
          <AvisoTemporal
            tipo={aviso.tipo}
            accion={
              aviso.reintentar ? { texto: 'Reintentar', alPulsar: aviso.reintentar } : undefined
            }
            alTerminar={cerrarAviso}
            className="absolute inset-x-4 bottom-full mb-4 lg:static lg:mb-0"
          >
            {aviso.mensaje}
          </AvisoTemporal>
        ) : null}
        <p className="text-center text-auxiliar text-texto-secundario lg:text-left">
          La finca deberá confirmar el cierre
        </p>
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
          <Boton
            type="submit"
            icono={iconoResolver}
            disabled={enCurso}
            className="w-full lg:w-auto"
          >
            {enCurso ? 'Guardando…' : 'Marcar como resuelta'}
          </Boton>
          {esEscritorio ? (
            <Link
              to={detalle}
              state={estadoDeNavegacion}
              className="inline-flex h-10 items-center rounded-control px-4 text-etiqueta-fuerte text-primario"
            >
              Cancelar
            </Link>
          ) : null}
        </div>
      </div>
    </form>
  )
}

export default function RegistrarSolucion() {
  const { id } = useParams()
  const { state } = useLocation()
  const { perfil } = useSesion()
  const enLinea = useEnLinea()
  const esEscritorio = useEsEscritorio()

  const idValido = UUID.test(id ?? '')
  const [intento, setIntento] = useState(0)
  const [resultado, setResultado] = useState({
    id: '',
    novedad: null,
    transiciones: [],
    fallo: null,
  })
  const consulta = `${id}:${intento}`

  // La novedad y su historial (por la decisión del director, 18-C) se piden en paralelo.
  useEffect(() => {
    if (!idValido) return undefined
    let vigente = true
    Promise.all([obtenerNovedad(id), listarLineaDeTiempo(id)])
      .then(([novedad, transiciones]) => {
        if (vigente) setResultado({ id, novedad, transiciones, fallo: null })
      })
      .catch((error) => {
        if (vigente) {
          setResultado({ id, novedad: null, transiciones: [], fallo: traducirError(error) })
        }
      })
    return () => {
      vigente = false
    }
  }, [id, idValido, consulta])

  const reintentar = useCallback(() => setIntento((n) => n + 1), [])

  const cargando = idValido && resultado.id !== id
  const { novedad, transiciones, fallo } = cargando
    ? { novedad: null, transiciones: [], fallo: null }
    : resultado
  const sinPermiso = !cargando && !fallo && !novedad

  // Lo que llegó del detalle (la pantalla de origen) se devuelve tal cual al volver.
  const detalle = `/novedades/${id}`
  const estadoDeNavegacion = state && typeof state === 'object' ? { origen: state.origen } : null

  // Si la novedad ya no admite la solución (otra persona la resolvió, o nunca se tomó), aquí
  // no hay nada que hacer: el detalle muestra cómo está.
  if (novedad && !accionesDisponibles(perfil, novedad).includes(ACCION.REGISTRAR_SOLUCION)) {
    return <Navigate to={detalle} replace state={estadoDeNavegacion} />
  }

  // En el teléfono el título de la página va en la barra superior. Sin novedad que mostrar,
  // el título lo pone el contenido (22-B).
  const TituloDeLaBarra = novedad ? 'h1' : 'p'

  return (
    <div className="flex flex-1 flex-col">
      {esEscritorio ? null : (
        <header className="sticky top-0 z-10 flex min-h-15 items-center gap-1 border-b border-borde bg-superficie py-2 pr-2 pl-1">
          <Link
            to={detalle}
            state={estadoDeNavegacion}
            aria-label="Cerrar sin registrar la solución"
            className="flex size-12 flex-none items-center justify-center rounded-control text-texto"
          >
            <Icono src={iconoCerrar} tamano={24} />
          </Link>
          <div className="flex min-w-0 flex-1 flex-col">
            <TituloDeLaBarra
              className="truncate text-subtitulo text-texto"
              aria-hidden={novedad ? undefined : true}
            >
              Registrar solución
            </TituloDeLaBarra>
            {novedad ? (
              <p className="truncate text-auxiliar text-texto-secundario">
                <span translate="no">{formatearCodigo(novedad.codigo)}</span> · {novedad.finca}
              </p>
            ) : null}
          </div>
          <Conexion estado={enLinea ? 'en_linea' : 'sin_conexion'} className="flex-none" />
        </header>
      )}

      {cargando ? (
        <p role="status" className="py-10 text-center text-cuerpo-pequeno text-texto-secundario">
          Cargando…
        </p>
      ) : null}

      {fallo ? (
        <div className="p-4 lg:p-8">
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
        </div>
      ) : null}

      {sinPermiso ? <SinPermiso rolId={perfil.rol_id} /> : null}

      {novedad ? (
        <Formulario
          novedad={novedad}
          aprobacion={novedad.estado === 'aprobada' ? aprobacionDe(transiciones) : null}
          detalle={detalle}
          estadoDeNavegacion={estadoDeNavegacion}
          esEscritorio={esEscritorio}
        />
      ) : null}
    </div>
  )
}
