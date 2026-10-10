import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import { traducirError } from '../../core/errores/traducir.js'
import { useSesion } from '../../core/sesion/ContextoSesion.js'
import { listarFincas } from '../../core/supabase/repositorios/catalogos.js'
import {
  contarBandeja,
  listarBandeja,
  listarTransicionesDeBandeja,
  tomarNovedad,
} from '../../core/supabase/repositorios/novedades.js'
import { Aviso } from '../../core/ui/Aviso.jsx'
import { AvisoTemporal } from '../../core/ui/AvisoTemporal.jsx'
import { Boton } from '../../core/ui/Boton.jsx'
import { Icono } from '../../core/ui/Icono.jsx'
import iconoFinca from '../../core/ui/iconos/agriculture.svg'
import iconoTomar from '../../core/ui/iconos/back_hand.svg'
import iconoEnAtencion from '../../core/ui/iconos/build.svg'
import iconoSinConexion from '../../core/ui/iconos/cloud_off.svg'
import iconoError from '../../core/ui/iconos/error.svg'
import iconoDesplegar from '../../core/ui/iconos/expand_more.svg'
import iconoEnEspera from '../../core/ui/iconos/hourglass_top.svg'
import iconoBandeja from '../../core/ui/iconos/inbox.svg'
import iconoResolver from '../../core/ui/iconos/task_alt.svg'
import { Pestanas } from '../../core/ui/Pestanas.jsx'
import { TarjetaNovedad } from '../../core/ui/TarjetaNovedad.jsx'
import { useEsEscritorio } from '../../core/ui/useEsEscritorio.js'
import { AVISO_SUELTO } from '../../core/ui/posicionDelAviso.js'
import { PESTANAS, resumirTransiciones } from './reglasDeBandeja.js'
import { TablaDeBandeja } from './TablaDeBandeja.jsx'
import { useAccion } from './useAccion.js'
import { VistaPrevia } from './VistaPrevia.jsx'

/*
 * Pantallas 11 · Bandeja del área (teléfono), 11-C · Bandeja vacía y 12 · Bandeja del área
 * (escritorio). RF-09 / CU-09. Figma 3:295, 3:524 y 3:587.
 *
 * La base de datos limita la lista al área del aprobador (RNF-11) y la entrega ya ordenada
 * por prioridad y antigüedad. La bandeja sin conexión (11-B) llega en el Sprint 4.
 */

const ID_DE_LA_LISTA = 'bandeja-lista'

const ICONO_DE_LA_PESTANA = {
  por_atender: iconoBandeja,
  en_atencion: iconoEnAtencion,
  en_espera: iconoEnEspera,
}

function Contadores({ conteos }) {
  return (
    <dl className="flex gap-2">
      {PESTANAS.map(({ id, nombre }) => (
        <div
          key={id}
          className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-xl border border-borde bg-superficie px-2 py-3 min-[390px]:px-3"
        >
          <dt className="flex items-center gap-1 text-auxiliar whitespace-nowrap text-texto-secundario min-[390px]:gap-1.5">
            <Icono src={ICONO_DE_LA_PESTANA[id]} tamano={16} />
            {nombre}
          </dt>
          <dd className="text-titulo text-texto tabular-nums">{conteos?.[id] ?? '–'}</dd>
        </div>
      ))}
    </dl>
  )
}

function FiltroDeFinca({ fincas, valor, alCambiar }) {
  // El control completo es el `select`: toda su superficie lo abre y recibe el foco. Los
  // íconos van encima, sin estorbar el clic.
  return (
    <div className="relative flex-none">
      <Icono
        src={iconoFinca}
        tamano={18}
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-texto-secundario"
      />
      <select
        name="finca"
        aria-label="Filtrar por finca"
        autoComplete="off"
        value={valor ?? ''}
        onChange={(evento) => alCambiar(evento.target.value || null)}
        className="h-[38px] max-w-72 cursor-pointer appearance-none truncate rounded-control bg-superficie pr-10 pl-[38px] text-cuerpo-pequeno text-texto inset-ring inset-ring-borde"
      >
        <option value="">Todas las fincas</option>
        {fincas.map(({ id, nombre }) => (
          <option key={id} value={id}>
            {nombre}
          </option>
        ))}
      </select>
      <Icono
        src={iconoDesplegar}
        tamano={20}
        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-texto-secundario"
      />
    </div>
  )
}

function SinPendientes({ area }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 pt-12 pb-6 text-center">
      <span className="flex size-18 items-center justify-center rounded-full bg-primario-contenedor text-primario">
        <Icono src={iconoBandeja} tamano={36} />
      </span>
      <p className="text-subtitulo text-texto">No hay novedades pendientes en {area}</p>
      <p className="text-cuerpo text-texto-secundario">Te avisaremos cuando llegue una nueva.</p>
    </div>
  )
}

export default function Bandeja() {
  const { perfil } = useSesion()
  const esEscritorio = useEsEscritorio()
  const area = perfil.area?.nombre ?? ''

  // La pestaña y la finca viven en la URL: se vuelve a ellas con «atrás» y se pueden compartir.
  const [parametros, setParametros] = useSearchParams()
  const { pathname, search, state } = useLocation()
  const navegar = useNavigate()
  const origen = pathname + search
  // El aviso con que se llega desde el detalle cuando la novedad salió del alcance (se
  // reasignó). Vive en el estado de la navegación: al cumplir su tiempo se quita de ahí, para
  // que no reaparezca al recargar ni al volver atrás.
  const avisoDeLlegada = typeof state?.aviso === 'string' ? state.aviso : null
  const quitarAvisoDeLlegada = useCallback(
    () => navegar(origen, { replace: true, state: null }),
    [navegar, origen],
  )
  const pestana = PESTANAS.find(({ id }) => id === parametros.get('pestana')) ?? PESTANAS[0]
  // El filtro por finca solo existe en el escritorio (Figma 12).
  const fincaId = esEscritorio ? parametros.get('finca') : null

  function cambiarParametro(nombre, valor) {
    setParametros(
      (actuales) => {
        const nuevos = new URLSearchParams(actuales)
        if (valor) nuevos.set(nombre, valor)
        else nuevos.delete(nombre)
        return nuevos
      },
      { replace: true },
    )
  }

  const [intento, setIntento] = useState(0)
  const [conteos, setConteos] = useState(null)
  // Cada resultado lleva la consulta que lo produjo: mientras no coincida con la vigente,
  // la lista está cargando.
  const [lista, setLista] = useState({ consulta: '', novedades: [], total: 0, pagina: 0 })
  const [fallo, setFallo] = useState(null)
  const [cargandoMas, setCargandoMas] = useState(false)
  const [fincas, setFincas] = useState([])
  const [resumenes, setResumenes] = useState({})
  const [elegidaId, setElegidaId] = useState(null)

  const areaId = perfil.area_id
  const consulta = `${pestana.id}:${fincaId ?? ''}:${intento}`

  // La página y los conteos de las otras dos pestañas no dependen entre sí: van en paralelo.
  // El conteo de la pestaña abierta es el total de su propia página.
  useEffect(() => {
    let vigente = true
    const filtro = { areaId, fincaId }
    const otras = PESTANAS.filter((otra) => otra !== pestana)
    Promise.all([
      listarBandeja({ ...filtro, estados: pestana.estados }),
      ...otras.map((otra) => contarBandeja({ ...filtro, estados: otra.estados })),
    ])
      .then(([pagina, ...cantidades]) => {
        if (!vigente) return
        setConteos({
          [pestana.id]: pagina.total,
          ...Object.fromEntries(otras.map((otra, i) => [otra.id, cantidades[i]])),
        })
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
  }, [areaId, fincaId, pestana, consulta])

  // Solo el escritorio usa el catálogo de fincas (el filtro) y el historial (las notas del
  // estado y la vista previa): el teléfono no los pide (RNF-05).
  useEffect(() => {
    if (!esEscritorio) return undefined
    let vigente = true
    listarFincas()
      .then((todas) => {
        if (vigente) setFincas(todas)
      })
      // Sin el catálogo, el filtro se queda en «Todas las fincas».
      .catch(() => {})
    return () => {
      vigente = false
    }
  }, [esEscritorio])

  const idsVisibles = lista.novedades.map(({ id }) => id).join(',')
  useEffect(() => {
    if (!esEscritorio || idsVisibles === '') return undefined
    let vigente = true
    listarTransicionesDeBandeja(idsVisibles.split(','))
      .then((transiciones) => {
        if (vigente) setResumenes(resumirTransiciones(transiciones))
      })
      // Sin el historial la tabla sigue sirviendo: solo faltan las notas de reasignación.
      .catch(() => {})
    return () => {
      vigente = false
    }
  }, [esEscritorio, idsVisibles])

  async function verMas() {
    setCargandoMas(true)
    setFallo(null)
    try {
      const siguiente = lista.pagina + 1
      const pagina = await listarBandeja({
        areaId,
        fincaId,
        estados: pestana.estados,
        pagina: siguiente,
      })
      // Si entre tanto cambió la pestaña o el filtro, esta página ya no corresponde.
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
  const hayMas = lista.novedades.length < lista.total
  const vacia = !cargando && !fallo && lista.novedades.length === 0
  // 11-C: no queda nada pendiente en el área. Si solo está vacía esta pestaña (o el filtro
  // no deja ver ninguna), no se puede decir que el área no tiene pendientes.
  const sinPendientes = vacia && !fincaId && PESTANAS.every(({ id }) => (conteos?.[id] ?? 0) === 0)
  const elegida = lista.novedades.find(({ id }) => id === elegidaId) ?? lista.novedades[0] ?? null
  // Con la lista a la vista, el reintento es volver a pedir la página que faltó.
  const reintentar = lista.novedades.length > 0 ? verMas : () => setIntento((n) => n + 1)

  // Acción principal de la vista previa (Figma 12): después de ejecutarla se recarga la
  // bandeja, porque la novedad cambia de pestaña.
  const recargar = useCallback(() => setIntento((n) => n + 1), [])
  const { ejecutar, enCurso, aviso, cerrarAviso } = useAccion({
    estado: elegida?.estado,
    alCambiar: recargar,
  })

  const nombreDeLaPestana = ({ id, nombre }) =>
    esEscritorio && conteos ? `${nombre} (${conteos[id]})` : nombre
  const pestanas = PESTANAS.map((opcion) => ({ id: opcion.id, nombre: nombreDeLaPestana(opcion) }))
  const selectorDePestanas = (
    <Pestanas
      etiqueta="Novedades de la bandeja"
      variante={esEscritorio ? 'subrayada' : 'segmentada'}
      pestanas={pestanas}
      elegida={pestana.id}
      alElegir={(id) => cambiarParametro('pestana', id === PESTANAS[0].id ? null : id)}
      idDelPanel={ID_DE_LA_LISTA}
    />
  )

  return (
    <section className="flex w-full flex-1 flex-col gap-3.5 px-4 pt-4 pb-6 lg:gap-6 lg:px-8 lg:pt-8 lg:pb-12">
      <header className="sr-only lg:not-sr-only lg:flex lg:flex-col lg:gap-1">
        <h1 className="text-display text-texto">Bandeja · {area}</h1>
        <p className="text-cuerpo text-texto-secundario">
          Novedades no cerradas de tu área, por prioridad y antigüedad
        </p>
      </header>

      {esEscritorio ? (
        <div className="flex items-end gap-4">
          {selectorDePestanas}
          <span className="flex-1" />
          <FiltroDeFinca
            fincas={fincas}
            valor={fincaId}
            alCambiar={(id) => cambiarParametro('finca', id)}
          />
        </div>
      ) : (
        <>
          <Contadores conteos={conteos} />
          {selectorDePestanas}
          <p className="text-auxiliar text-texto-secundario">
            Por atender: asignadas y aprobadas por el director. En espera: escaladas y resueltas sin
            confirmar.
          </p>
        </>
      )}

      <div
        role="tabpanel"
        id={ID_DE_LA_LISTA}
        aria-labelledby={`${ID_DE_LA_LISTA}-pestana-${pestana.id}`}
        className="flex flex-col gap-2.5 lg:gap-6"
      >
        {cargando ? (
          <p role="status" className="py-6 text-center text-cuerpo-pequeno text-texto-secundario">
            Cargando…
          </p>
        ) : null}

        {sinPendientes ? <SinPendientes area={area} /> : null}
        {vacia && !sinPendientes ? (
          <p className="py-10 text-center text-cuerpo text-texto-secundario">
            No hay novedades en esta lista.
          </p>
        ) : null}

        {!cargando && lista.novedades.length > 0 ? (
          esEscritorio ? (
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
              <TablaDeBandeja
                titulo={pestana.nombre}
                novedades={lista.novedades}
                resumenes={resumenes}
                elegidaId={elegida.id}
                alElegir={setElegidaId}
              />
              <VistaPrevia
                novedad={elegida}
                resumen={resumenes[elegida.id]}
                origen={origen}
                accion={
                  elegida.estado === 'asignada' ? (
                    <Boton
                      tamano="escritorio"
                      icono={iconoTomar}
                      disabled={enCurso}
                      onClick={() =>
                        ejecutar(() => tomarNovedad(elegida.id), {
                          exito: 'Novedad tomada. Ya está En atención.',
                        })
                      }
                    >
                      {enCurso ? 'Tomando…' : 'Tomar para atención'}
                    </Boton>
                  ) : elegida.estado === 'en_atencion' || elegida.estado === 'aprobada' ? (
                    <Link
                      to={`/novedades/${elegida.id}/solucion`}
                      state={{ origen }}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-control bg-primario px-4 text-etiqueta-fuerte whitespace-nowrap text-sobre-primario hover:bg-primario-hover"
                    >
                      <Icono src={iconoResolver} tamano={20} />
                      Registrar solución
                    </Link>
                  ) : null
                }
              />
            </div>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {lista.novedades.map((novedad) => (
                <TarjetaNovedad
                  key={novedad.id}
                  novedad={novedad}
                  pie="finca"
                  a={`/novedades/${novedad.id}`}
                  origen={origen}
                />
              ))}
            </ul>
          )
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

        {aviso ? (
          <AvisoTemporal
            tipo={aviso.tipo}
            accion={
              aviso.reintentar ? { texto: 'Reintentar', alPulsar: aviso.reintentar } : undefined
            }
            alTerminar={cerrarAviso}
            className="fixed right-8 bottom-6 z-20 w-96"
          >
            {aviso.mensaje}
          </AvisoTemporal>
        ) : avisoDeLlegada ? (
          <AvisoTemporal alTerminar={quitarAvisoDeLlegada} className={AVISO_SUELTO}>
            {avisoDeLlegada}
          </AvisoTemporal>
        ) : null}

        {!cargando && !fallo && hayMas ? (
          <Boton tipo="secundario" onClick={verMas} disabled={cargandoMas} className="self-center">
            {cargandoMas ? 'Cargando…' : 'Ver más'}
          </Boton>
        ) : null}
      </div>
    </section>
  )
}
