import { lazy, Suspense, useCallback, useEffect, useId, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { accionesDisponibles } from '../../core/acciones/accionesDisponibles.js'
import { useEnLinea } from '../../core/conexion/useEnLinea.js'
import { traducirError } from '../../core/errores/traducir.js'
import { useSesion } from '../../core/sesion/ContextoSesion.js'
import { ROL, rutaDeOrigen } from '../../core/sesion/roles.js'
import { listarLineaDeTiempo, obtenerNovedad } from '../../core/supabase/repositorios/novedades.js'
import { Aviso } from '../../core/ui/Aviso.jsx'
import { Boton } from '../../core/ui/Boton.jsx'
import { Conexion } from '../../core/ui/Conexion.jsx'
import { Estado } from '../../core/ui/Estado.jsx'
import { Icono } from '../../core/ui/Icono.jsx'
import iconoVolver from '../../core/ui/iconos/arrow_back.svg'
import iconoSinConexion from '../../core/ui/iconos/cloud_off.svg'
import iconoError from '../../core/ui/iconos/error.svg'
import iconoSolucion from '../../core/ui/iconos/task_alt.svg'
import { LineaDeTiempo } from '../../core/ui/LineaDeTiempo.jsx'
import { Prioridad } from '../../core/ui/Prioridad.jsx'
import { useEsEscritorio } from '../../core/ui/useEsEscritorio.js'
import { formatearCodigo } from '../../core/utils/codigo.js'
import {
  esMismoDiaEnColombia,
  formatearDuracion,
  formatearFechaCorta,
  formatearFechaHora,
  formatearFechaSinHora,
  formatearFechaYSemana,
  formatearHora,
  tiempoTranscurrido,
} from '../../core/utils/fechas.js'
import { SinPermiso } from './SinPermiso.jsx'

// Las acciones del aprobador van en su propio paquete: los demás roles no lo descargan.
const AccionesDelAprobador = lazy(() => import('../e3-atencion/AccionesDelAprobador.jsx'))

/*
 * Detalle y línea de tiempo de una novedad (RF-18 / CU-18), para los cuatro roles. Figma:
 * 13 (3:764) y 14 (3:965) en el teléfono, 22 (4:2093) en el escritorio y 09 (2:1118) para la
 * novedad resuelta. Fuera del alcance del usuario, o si no existe, la pantalla 22-B.
 *
 * Lo que se ve lo decide la base de datos (RNF-11). Las acciones salen del mapa de acciones
 * (Tabla 35) y cada rol trae las suyas; las evidencias y la consulta sin conexión llegan en
 * el Sprint 4.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Texto del enlace de regreso según la pantalla de origen. */
const VOLVER = {
  '/novedades': 'Volver a mis novedades',
  '/bandeja': 'Volver a la bandeja',
  '/escaladas': 'Volver a las escaladas',
  '/historial': 'Volver al historial',
  '/panel': 'Volver al panel',
}

/** Mientras está en manos del área, el detalle dice hace cuánto se registró y quién la tomó. */
const EN_MANOS_DEL_AREA = ['asignada', 'en_atencion', 'escalada', 'aprobada']

const COLOR_DEL_AREA = {
  Mantenimiento: 'text-area-mantenimiento',
  Sistemas: 'text-area-sistemas',
}

const TARJETA = 'rounded-xl border border-borde bg-superficie'

function Etiqueta({ children, className = 'text-texto-secundario' }) {
  return (
    <span
      className={`rounded-md bg-gris-100 px-2 py-0.5 text-auxiliar-fuerte whitespace-nowrap ${className}`}
    >
      {children}
    </span>
  )
}

/** Estado, prioridad, área y finca: lo que identifica a la novedad de un vistazo. */
function Etiquetas({ novedad }) {
  return (
    <>
      <Estado estado={novedad.estado} />
      <Prioridad prioridad={novedad.prioridad} />
      <Etiqueta className={COLOR_DEL_AREA[novedad.area] ?? 'text-texto-secundario'}>
        {novedad.area}
      </Etiqueta>
      {/* Figma escribe «Finca Juanca»; si el nombre ya empieza por «Finca», no se repite. */}
      <Etiqueta>
        {/^finca\b/i.test(novedad.finca) ? novedad.finca : `Finca ${novedad.finca}`}
      </Etiqueta>
    </>
  )
}

/** «Registrada hace 3 h · Tomada por Jhon Fredy Mosquera, 7:15 a. m.», o `null`. */
function seguimiento(novedad, transiciones) {
  if (!EN_MANOS_DEL_AREA.includes(novedad.estado)) return null
  const registrada = `Registrada ${tiempoTranscurrido(novedad.fecha_registro)}`
  if (novedad.estado !== 'en_atencion') return registrada
  // Quien la tomó: la última vez que pasó de asignada a en atención (SDD 6.1.3).
  const toma = transiciones.find(
    ({ estado_anterior, estado_nuevo }) =>
      estado_anterior === 'asignada' && estado_nuevo === 'en_atencion',
  )
  if (!toma?.usuario) return registrada
  const cuando = esMismoDiaEnColombia(toma.fecha_hora)
    ? formatearHora(toma.fecha_hora)
    : formatearFechaCorta(toma.fecha_hora)
  return `${registrada} · Tomada por ${toma.usuario.nombre}, ${cuando}`
}

/** La transición que dejó la novedad resuelta: quién registró la solución y cuándo. */
const resolucion = (transiciones) =>
  transiciones.find(({ estado_nuevo }) => estado_nuevo === 'resuelta') ?? null

function Seccion({ titulo, className = '', children }) {
  const id = useId()
  return (
    <section aria-labelledby={id} className={className}>
      <h2 id={id} className="text-etiqueta-fuerte text-texto">
        {titulo}
      </h2>
      {children}
    </section>
  )
}

/** Dato en una fila: nombre a la izquierda y valor a la derecha (teléfono). */
function DatoEnFila({ nombre, fuerte = false, children }) {
  return (
    <div className="flex items-start gap-3">
      <dt className="w-32 flex-none text-cuerpo-pequeno text-texto-secundario">{nombre}</dt>
      <dd
        className={`min-w-0 flex-1 break-words text-texto ${fuerte ? 'text-etiqueta-fuerte' : 'text-cuerpo-pequeno'}`}
      >
        {children}
      </dd>
    </div>
  )
}

/** Dato en una celda: nombre arriba y valor abajo (escritorio). */
function DatoEnCelda({ nombre, children }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-auxiliar text-texto-secundario">{nombre}</dt>
      <dd className="text-etiqueta-fuerte break-words text-texto">{children}</dd>
    </div>
  )
}

function Telefono({ novedad, transiciones }) {
  const resuelta = novedad.solucion ? resolucion(transiciones) : null
  const linea = seguimiento(novedad, transiciones)

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-6">
      <div
        role="group"
        aria-label="Datos de la novedad"
        className="flex flex-wrap items-center gap-1.5"
      >
        <Etiquetas novedad={novedad} />
      </div>
      {linea ? <p className="text-auxiliar text-texto-secundario">{linea}</p> : null}

      {novedad.solucion ? (
        <section
          aria-labelledby="detalle-solucion"
          className="flex flex-col gap-2.5 rounded-xl bg-exito-suave p-4"
        >
          <h2
            id="detalle-solucion"
            className="flex items-center gap-2 text-etiqueta-fuerte text-texto"
          >
            <Icono src={iconoSolucion} tamano={20} className="text-exito" />
            Solución registrada por {novedad.area}
          </h2>
          <p className="text-cuerpo break-words text-texto">{novedad.solucion}</p>
          <dl className="flex flex-col gap-2.5">
            <DatoEnFila nombre="Tipo de falla" fuerte>
              {novedad.tipo_falla}
            </DatoEnFila>
            <DatoEnFila nombre="Fecha de ejecución" fuerte>
              {formatearFechaSinHora(novedad.fecha_ejecucion)}
            </DatoEnFila>
            {resuelta?.usuario ? (
              <DatoEnFila nombre="Registró" fuerte>
                {resuelta.usuario.nombre}
              </DatoEnFila>
            ) : null}
          </dl>
        </section>
      ) : null}

      <Seccion titulo="Descripción" className={`flex flex-col gap-2.5 p-4 ${TARJETA}`}>
        <p className="text-cuerpo break-words text-texto">{novedad.descripcion}</p>
        <dl className="flex flex-col gap-2.5">
          <DatoEnFila nombre="Reportada por">
            {novedad.reportante} (Reportante · {novedad.finca})
          </DatoEnFila>
          <DatoEnFila nombre="Registrada en finca">
            {formatearFechaYSemana(novedad.fecha_registro)}
          </DatoEnFila>
          <DatoEnFila nombre="Sincronizada">
            {formatearFechaHora(novedad.fecha_sincronizacion)}
          </DatoEnFila>
        </dl>
      </Seccion>

      <Seccion titulo="Línea de tiempo" className={`flex flex-col gap-3 px-4 pt-4 pb-1 ${TARJETA}`}>
        <LineaDeTiempo transiciones={transiciones} />
      </Seccion>
    </div>
  )
}

function Escritorio({ novedad, transiciones, acciones }) {
  const resuelta = novedad.solucion ? resolucion(transiciones) : null
  const linea = seguimiento(novedad, transiciones)

  return (
    <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className={`flex flex-col gap-2.5 p-5 ${TARJETA}`}>
          <div
            role="group"
            aria-label="Datos de la novedad"
            className="flex flex-wrap items-center gap-x-2.5 gap-y-2"
          >
            <h1 className="text-display text-texto" translate="no">
              {formatearCodigo(novedad.codigo)}
            </h1>
            <Etiquetas novedad={novedad} />
          </div>
          <p className="text-cuerpo-pequeno text-texto-secundario">{novedad.razon_social}</p>
          {linea ? <p className="text-auxiliar text-texto-secundario">{linea}</p> : null}
          {acciones}
        </div>

        <dl className={`grid grid-cols-2 gap-x-5 gap-y-4 p-5 ${TARJETA}`}>
          <DatoEnCelda nombre="Reportada por">{novedad.reportante}</DatoEnCelda>
          <DatoEnCelda nombre="Registrada en finca">
            {formatearFechaYSemana(novedad.fecha_registro)}
          </DatoEnCelda>
          <DatoEnCelda nombre="Sincronizada">
            {formatearFechaHora(novedad.fecha_sincronizacion)}
          </DatoEnCelda>
          {novedad.solucion ? (
            <>
              {resuelta ? (
                <DatoEnCelda nombre="Tiempo hasta resolver">
                  {formatearDuracion(novedad.fecha_registro, resuelta.fecha_hora)}
                </DatoEnCelda>
              ) : null}
              <DatoEnCelda nombre="Tipo de falla">{novedad.tipo_falla}</DatoEnCelda>
              <DatoEnCelda nombre="Fecha de ejecución">
                {formatearFechaSinHora(novedad.fecha_ejecucion)}
              </DatoEnCelda>
            </>
          ) : null}
        </dl>

        <Seccion titulo="Descripción" className={`flex flex-col gap-2 p-5 ${TARJETA}`}>
          <p className="text-cuerpo break-words text-texto">{novedad.descripcion}</p>
        </Seccion>

        {novedad.solucion ? (
          <section
            aria-labelledby="detalle-solucion"
            className="flex flex-col gap-2 rounded-xl bg-exito-suave p-5"
          >
            <h2
              id="detalle-solucion"
              className="flex items-center gap-2 text-etiqueta-fuerte text-texto"
            >
              <Icono src={iconoSolucion} tamano={20} className="text-exito" />
              Solución aplicada
            </h2>
            <p className="text-cuerpo break-words text-texto">{novedad.solucion}</p>
          </section>
        ) : null}
      </div>

      <Seccion
        titulo="Línea de tiempo"
        className={`flex flex-col gap-3 px-4 pt-4 xl:w-[400px] xl:flex-none ${TARJETA}`}
      >
        <LineaDeTiempo transiciones={transiciones} conPie />
      </Seccion>
    </div>
  )
}

export default function DetalleNovedad() {
  const { id } = useParams()
  const { state } = useLocation()
  const navegar = useNavigate()
  const { perfil } = useSesion()
  const enLinea = useEnLinea()
  const esEscritorio = useEsEscritorio()

  const idValido = UUID.test(id ?? '')
  const [intento, setIntento] = useState(0)
  // El resultado lleva la novedad que lo produjo: mientras no sea la de la dirección, el
  // detalle está cargando. Al recargar la misma novedad (después de una acción) se conserva lo
  // que ya se ve hasta que llegue lo nuevo.
  const [resultado, setResultado] = useState({
    id: '',
    novedad: null,
    transiciones: [],
    fallo: null,
  })
  const consulta = `${id}:${intento}`

  // La novedad y su historial no dependen entre sí: se piden en paralelo.
  useEffect(() => {
    // Un `id` que no es un uuid no puede existir: no se consulta el servidor.
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

  const recargar = useCallback(() => setIntento((n) => n + 1), [])

  const cargando = idValido && resultado.id !== id
  const { novedad, transiciones, fallo } = cargando
    ? { novedad: null, transiciones: [], fallo: null }
    : resultado
  const sinPermiso = !cargando && !fallo && !novedad

  // Cuando una acción cambia el estado, el botón que tenía el foco puede desaparecer (ya no hay
  // nada que tomar). El foco no se queda en la nada: pasa al contenido de la página, y quien
  // navega con el teclado o con lector de pantalla retoma desde ahí.
  const raiz = useRef(/** @type {HTMLDivElement | null} */ (null))
  const estado = novedad?.estado
  const estadoAnterior = useRef(estado)
  useEffect(() => {
    const cambio = Boolean(estadoAnterior.current && estado && estadoAnterior.current !== estado)
    estadoAnterior.current = estado
    if (cambio && document.activeElement === document.body) raiz.current?.closest('main')?.focus()
  }, [estado])

  const origen = rutaDeOrigen(state, perfil.rol_id)
  const textoDeVolver = VOLVER[origen.split('?')[0]] ?? 'Volver'
  // Cuando el aprobador reasigna la novedad, deja de estar en su alcance: vuelve a su bandeja
  // (la misma pestaña y filtro, si venía de ahí), que muestra el aviso.
  const volverALaBandeja = (/** @type {string} */ mensaje) =>
    navegar(origen.split('?')[0] === '/bandeja' ? origen : '/bandeja', {
      state: { aviso: mensaje },
    })
  const codigo = novedad ? formatearCodigo(novedad.codigo) : null

  const acciones =
    novedad && perfil.rol_id === ROL.APROBADOR_AREA ? (
      <Suspense fallback={null}>
        <AccionesDelAprobador
          novedad={novedad}
          acciones={accionesDisponibles(perfil, novedad)}
          alCambiar={recargar}
          alSalir={volverALaBandeja}
          esEscritorio={esEscritorio}
        />
      </Suspense>
    ) : null
  // En el teléfono el título de la página va en la barra superior. Sin novedad que mostrar,
  // el título lo pone el contenido (22-B) y la barra solo dice «Novedad».
  const TituloDeLaBarra = codigo ? 'h1' : 'p'

  return (
    <div ref={raiz} className="flex flex-1 flex-col">
      {/* En el teléfono el detalle trae su propia barra superior (Figma 3:771); en el
          escritorio, la conexión ya está en la barra del marco. */}
      {esEscritorio ? null : (
        <header className="sticky top-0 z-10 flex h-15 items-center gap-1 border-b border-borde bg-superficie pr-2 pl-1">
          <Link
            to={origen}
            aria-label={sinPermiso ? 'Volver' : textoDeVolver}
            className="flex size-12 flex-none items-center justify-center rounded-control text-texto"
          >
            <Icono src={iconoVolver} tamano={24} />
          </Link>
          <TituloDeLaBarra
            className="min-w-0 flex-1 truncate text-subtitulo text-texto"
            translate={codigo ? 'no' : undefined}
            aria-hidden={codigo ? undefined : true}
          >
            {codigo ?? 'Novedad'}
          </TituloDeLaBarra>
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
              <Boton tipo="texto" tamano="escritorio" onClick={recargar}>
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
        esEscritorio ? (
          <div className="flex flex-col gap-6 px-8 pt-8 pb-12">
            <Link
              to={origen}
              className="flex items-center gap-1.5 self-start text-etiqueta-fuerte text-primario"
            >
              <Icono src={iconoVolver} tamano={18} />
              {textoDeVolver}
            </Link>
            <Escritorio novedad={novedad} transiciones={transiciones} acciones={acciones} />
          </div>
        ) : (
          <>
            <Telefono novedad={novedad} transiciones={transiciones} />
            {acciones}
          </>
        )
      ) : null}
    </div>
  )
}
