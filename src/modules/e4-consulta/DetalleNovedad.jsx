import { lazy, Suspense, useCallback, useEffect, useId, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { ACCION, accionesDisponibles } from '../../core/acciones/accionesDisponibles.js'
import { useEnLinea } from '../../core/conexion/useEnLinea.js'
import { traducirError } from '../../core/errores/traducir.js'
import { useSesion } from '../../core/sesion/ContextoSesion.js'
import { firmaDe, ROL, rutaDeOrigen } from '../../core/sesion/roles.js'
import { listarLineaDeTiempo, obtenerNovedad } from '../../core/supabase/repositorios/novedades.js'
import { Aviso } from '../../core/ui/Aviso.jsx'
import { Boton } from '../../core/ui/Boton.jsx'
import { Conexion } from '../../core/ui/Conexion.jsx'
import { EtiquetasDeNovedad } from '../../core/ui/EtiquetasDeNovedad.jsx'
import { Icono } from '../../core/ui/Icono.jsx'
import iconoVolver from '../../core/ui/iconos/arrow_back.svg'
import iconoSinConexion from '../../core/ui/iconos/cloud_off.svg'
import iconoError from '../../core/ui/iconos/error.svg'
import iconoSolucion from '../../core/ui/iconos/task_alt.svg'
import { LineaDeTiempo } from '../../core/ui/LineaDeTiempo.jsx'
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
import { JustificacionDelEscalamiento } from '../e3-atencion/JustificacionDelEscalamiento.jsx'
import { SinPermiso } from './SinPermiso.jsx'

// Las acciones de cada rol van en su propio paquete: los demás roles no lo descargan.
const AccionesDelAprobador = lazy(() => import('../e3-atencion/AccionesDelAprobador.jsx'))
const AccionesDelReportante = lazy(() => import('../e3-atencion/AccionesDelReportante.jsx'))
const DecisionDelDirector = lazy(() => import('../e3-atencion/DecisionDelDirector.jsx'))

/*
 * Detalle y línea de tiempo de una novedad (RF-18 / CU-18), para los cuatro roles. Figma:
 * 13 (3:764) y 14 (3:965) en el teléfono, 22 (4:2093) en el escritorio y 09 (2:1118) para la
 * novedad resuelta. Fuera del alcance del usuario, o si no existe, la pantalla 22-B.
 *
 * Para el director, una novedad escalada es la pantalla 20 (4:705; 20-C, 4:1054, en el
 * teléfono): el mismo detalle con la justificación del escalamiento arriba y su decisión
 * (RF-13 / CU-13). Para el reportante, una resuelta de su finca trae las acciones de la
 * pantalla 09: confirmar el cierre o indicar que la falla persiste (RF-15 / CU-15).
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
  '/usuarios': 'Volver a usuarios',
}

/** Mientras está en manos del área, el detalle dice hace cuánto se registró y quién la tomó. */
const EN_MANOS_DEL_AREA = ['asignada', 'en_atencion', 'escalada', 'aprobada']

/** La sección a la que lleva «Ver historial» desde la lista de escaladas (pantalla 19). */
const ID_DE_LA_LINEA = 'linea-de-tiempo'

const TARJETA = 'rounded-xl border border-borde bg-superficie'

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

/**
 * @param {object} props
 * @param {string} props.titulo
 * @param {string} [props.id] Para llegar a la sección por la dirección (`#linea-de-tiempo`):
 *   con él, la sección puede recibir el foco.
 * @param {string} [props.className]
 * @param {import('react').ReactNode} props.children
 */
function Seccion({ titulo, id, className = '', children }) {
  const idDelTitulo = useId()
  return (
    <section
      id={id}
      tabIndex={id ? -1 : undefined}
      aria-labelledby={idDelTitulo}
      className={`${id ? 'scroll-mt-20 outline-none' : ''} ${className}`}
    >
      <h2 id={idDelTitulo} className="text-etiqueta-fuerte text-texto">
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

/**
 * La justificación con que el área escaló, quién lo hizo y cuándo (pantallas 20 y 20-C). Es
 * lo primero que lee el director antes de decidir.
 */
function Justificacion({ escalamiento }) {
  if (!escalamiento?.observacion) return null
  return (
    <JustificacionDelEscalamiento
      seccion
      texto={escalamiento.observacion}
      pie={[firmaDe(escalamiento.usuario), formatearFechaCorta(escalamiento.fecha_hora)]
        .filter(Boolean)
        .join(' · ')}
    />
  )
}

/**
 * @param {object} props
 * @param {object} props.novedad
 * @param {import('../../core/ui/LineaDeTiempo.jsx').Transicion[]} props.transiciones
 * @param {boolean} props.decide Quien la abre es el director y debe decidir (pantalla 20-C).
 * @param {import('../../core/ui/LineaDeTiempo.jsx').Transicion | null} props.escalamiento
 */
function Telefono({ novedad, transiciones, decide, escalamiento }) {
  const resuelta = novedad.solucion ? resolucion(transiciones) : null
  const linea = seguimiento(novedad, transiciones)

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-6">
      <Justificacion escalamiento={escalamiento} />
      <div
        role="group"
        aria-label="Datos de la novedad"
        className="flex flex-wrap items-center gap-1.5"
      >
        <EtiquetasDeNovedad novedad={novedad} />
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

      <Seccion
        titulo={decide ? 'Descripción del reporte' : 'Descripción'}
        className={`flex flex-col gap-2.5 p-4 ${TARJETA}`}
      >
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

      <Seccion
        titulo="Línea de tiempo"
        id={ID_DE_LA_LINEA}
        className={`flex flex-col gap-3 px-4 pt-4 pb-1 ${TARJETA}`}
      >
        <LineaDeTiempo transiciones={transiciones} />
      </Seccion>
    </div>
  )
}

/**
 * @param {object} props
 * @param {object} props.novedad
 * @param {import('../../core/ui/LineaDeTiempo.jsx').Transicion[]} props.transiciones
 * @param {import('react').ReactNode} props.acciones Las del aprobador, bajo el encabezado.
 * @param {import('react').ReactNode} props.panel La decisión del director, a la derecha.
 * @param {boolean} props.decide Quien la abre es el director y debe decidir (pantalla 20):
 *   el panel ocupa la columna derecha y la línea de tiempo pasa bajo el contenido.
 * @param {import('../../core/ui/LineaDeTiempo.jsx').Transicion | null} props.escalamiento
 */
function Escritorio({ novedad, transiciones, acciones, panel, decide, escalamiento }) {
  const resuelta = novedad.solucion ? resolucion(transiciones) : null
  const linea = seguimiento(novedad, transiciones)
  const lineaDeTiempo = (
    <Seccion
      titulo="Línea de tiempo"
      id={ID_DE_LA_LINEA}
      className={`flex min-w-0 flex-col gap-3 px-4 pt-4 ${TARJETA} ${decide ? 'xl:col-start-1' : ''}`}
    >
      <LineaDeTiempo transiciones={transiciones} conPie />
    </Seccion>
  )

  return (
    // Con menos ancho que `xl` todo va en una columna: el contenido, la decisión y la línea
    // de tiempo, en ese orden.
    <div className="grid gap-x-6 gap-y-4 xl:grid-cols-[minmax(0,1fr)_400px] xl:items-start">
      <div className="flex min-w-0 flex-col gap-4 xl:col-start-1">
        <div className={`flex flex-col gap-2.5 p-5 ${TARJETA}`}>
          <div
            role="group"
            aria-label="Datos de la novedad"
            className="flex flex-wrap items-center gap-x-2.5 gap-y-2"
          >
            <h1 className="text-display text-texto" translate="no">
              {formatearCodigo(novedad.codigo)}
            </h1>
            <EtiquetasDeNovedad novedad={novedad} />
          </div>
          <p className="text-cuerpo-pequeno text-texto-secundario">{novedad.razon_social}</p>
          {linea ? <p className="text-auxiliar text-texto-secundario">{linea}</p> : null}
          {acciones}
        </div>

        <Justificacion escalamiento={escalamiento} />

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

        <Seccion
          titulo={decide ? 'Descripción del reporte' : 'Descripción'}
          className={`flex flex-col gap-2 p-5 ${TARJETA}`}
        >
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

      {/* El panel va siempre primero en esta columna: después de decidir desaparece, pero el
          aviso que deja no se vuelve a montar. */}
      <div
        className={`flex min-w-0 flex-col gap-4 xl:col-start-2 ${decide ? 'xl:row-span-2' : ''}`}
      >
        {panel}
        {decide ? null : lineaDeTiempo}
      </div>
      {decide ? lineaDeTiempo : null}
    </div>
  )
}

export default function DetalleNovedad() {
  const { id } = useParams()
  const { state, hash } = useLocation()
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
    // Sin desplazar la página: la persona sigue viendo lo que acaba de cambiar.
    if (cambio && document.activeElement === document.body) {
      raiz.current?.closest('main')?.focus({ preventScroll: true })
    }
  }, [estado])

  // «Ver historial» (pantalla 19) abre el detalle en la línea de tiempo: se lleva a la vista
  // y recibe el foco, para que el teclado y el lector de pantalla sigan desde ahí.
  const hayNovedad = Boolean(novedad)
  useEffect(() => {
    if (!hayNovedad || hash !== `#${ID_DE_LA_LINEA}`) return
    const linea = document.getElementById(ID_DE_LA_LINEA)
    linea?.scrollIntoView?.({ block: 'start' })
    linea?.focus({ preventScroll: true })
  }, [hayNovedad, hash])

  const origen = rutaDeOrigen(state, perfil.rol_id)
  const textoDeVolver = VOLVER[origen.split('?')[0]] ?? 'Volver'
  // Cuando el aprobador reasigna la novedad, deja de estar en su alcance: vuelve a su bandeja
  // (la misma pestaña y filtro, si venía de ahí), que muestra el aviso.
  const volverALaBandeja = (/** @type {string} */ mensaje) =>
    navegar(origen.split('?')[0] === '/bandeja' ? origen : '/bandeja', {
      state: { aviso: mensaje },
    })
  // El aviso con que se vuelve de registrar la solución (pantalla 18). Vive en el estado de la
  // navegación: al cumplir su tiempo se quita de ahí, para que no reaparezca al recargar.
  const avisoDeLlegada =
    typeof state?.aviso === 'string'
      ? { tipo: state.avisoDeError ? 'error' : 'exito', mensaje: state.aviso }
      : null
  const quitarAvisoDeLlegada = () =>
    navegar('.', { replace: true, state: { origen: state?.origen } })
  const codigo = novedad ? formatearCodigo(novedad.codigo) : null

  const disponibles = accionesDisponibles(perfil, novedad)
  const acciones =
    novedad && perfil.rol_id === ROL.APROBADOR_AREA ? (
      <Suspense fallback={null}>
        <AccionesDelAprobador
          novedad={novedad}
          acciones={disponibles}
          alCambiar={recargar}
          alSalir={volverALaBandeja}
          avisoDeLlegada={avisoDeLlegada}
          alQuitarAvisoDeLlegada={quitarAvisoDeLlegada}
          esEscritorio={esEscritorio}
        />
      </Suspense>
    ) : novedad && perfil.rol_id === ROL.REPORTANTE ? (
      // La finca responde a una novedad resuelta (RF-15). Sigue montado después, para mostrar
      // el aviso de lo que acaba de hacer.
      <Suspense fallback={null}>
        <AccionesDelReportante
          key={novedad.id}
          novedad={novedad}
          acciones={disponibles}
          alCambiar={recargar}
          esEscritorio={esEscritorio}
        />
      </Suspense>
    ) : null

  // El director decide sobre las escaladas (Tabla 35). Después de decidir ya no hay nada que
  // elegir, pero el componente sigue montado para mostrar el aviso de lo que hizo.
  const esDirector = perfil.rol_id === ROL.DIRECTOR_AGRICULTURA
  const decide = esDirector && disponibles.includes(ACCION.APROBAR)
  // La justificación vigente: la de la última vez que se escaló (el historial llega de la
  // transición más reciente a la más antigua).
  const escalamiento = decide
    ? (transiciones.find(({ estado_nuevo }) => estado_nuevo === 'escalada') ?? null)
    : null
  const decision =
    novedad && esDirector ? (
      <Suspense fallback={null}>
        <DecisionDelDirector
          key={novedad.id}
          novedad={novedad}
          puedeDecidir={decide}
          alCambiar={recargar}
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
            <Escritorio
              novedad={novedad}
              transiciones={transiciones}
              acciones={acciones}
              panel={decision}
              decide={decide}
              escalamiento={escalamiento}
            />
          </div>
        ) : (
          <>
            <Telefono
              novedad={novedad}
              transiciones={transiciones}
              decide={decide}
              escalamiento={escalamiento}
            />
            {acciones}
            {decision}
          </>
        )
      ) : null}
    </div>
  )
}
