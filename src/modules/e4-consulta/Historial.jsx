import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import { useEnLinea } from '../../core/conexion/useEnLinea.js'
import { traducirError } from '../../core/errores/traducir.js'
import { useSesion } from '../../core/sesion/ContextoSesion.js'
import { ROL } from '../../core/sesion/roles.js'
import {
  listarHistorial,
  listarOpcionesDelHistorial,
} from '../../core/supabase/repositorios/historial.js'
import { NOVEDADES_POR_PAGINA } from '../../core/supabase/repositorios/novedades.js'
import { Aviso } from '../../core/ui/Aviso.jsx'
import { Boton } from '../../core/ui/Boton.jsx'
import { Estado } from '../../core/ui/Estado.jsx'
import { EtiquetaDeArea } from '../../core/ui/EtiquetasDeNovedad.jsx'
import { Icono } from '../../core/ui/Icono.jsx'
import iconoSinConexion from '../../core/ui/iconos/cloud_off.svg'
import iconoError from '../../core/ui/iconos/error.svg'
import iconoInformacion from '../../core/ui/iconos/info.svg'
import iconoSinResultados from '../../core/ui/iconos/search_off.svg'
import { Paginacion } from '../../core/ui/Paginacion.jsx'
import { Prioridad } from '../../core/ui/Prioridad.jsx'
import { TarjetaNovedad } from '../../core/ui/TarjetaNovedad.jsx'
import { useEsEscritorio } from '../../core/ui/useEsEscritorio.js'
import { formatearCodigo } from '../../core/utils/codigo.js'
import { formatearDia, formatearDuracion, formatearFechaDeLista } from '../../core/utils/fechas.js'
import { FiltrosDelHistorial } from './FiltrosDelHistorial.jsx'
import { escribirFiltros, leerFiltros, SIN_FILTROS } from './filtrosDelHistorial.js'

/*
 * Pantallas 21, 21-B, 21-C y 21-D · Historial de novedades (RF-19, CU-19; Figma 4:1189, 4:1523,
 * 4:1862 y 4:1973). Todas las novedades del alcance del rol, filtradas, de la más reciente a la
 * más antigua. Requiere conexión: sin red no se pide ni se guarda nada (decisión 13 del plan).
 */

const SIN_OPCIONES = { fincas: [], areas: [], tipos: [] }

const ENCABEZADO = 'px-2 py-2.5 text-left align-bottom text-auxiliar-fuerte text-texto-secundario'
const CELDA = 'px-2 py-2.5 align-middle text-cuerpo-pequeno text-texto tabular-nums'

const cuantas = (total) =>
  total === 1 ? '1 novedad' : `${total.toLocaleString('es-CO')} novedades`

/** Una celda sin dato: «—» a la vista y, para el lector de pantalla, qué falta. */
function SinDato({ texto }) {
  return (
    <>
      <span aria-hidden="true">—</span>
      <span className="sr-only">{texto}</span>
    </>
  )
}

/** La tabla de 21. Tocar una fila abre el detalle; el código es el enlace para el teclado. */
function TablaDelHistorial({ novedades, origen }) {
  const navegar = useNavigate()
  const abrir = (novedad) => navegar(`/novedades/${novedad.id}`, { state: { origen } })

  return (
    <div className="overflow-x-auto rounded-xl border border-borde bg-superficie">
      <table className="w-full border-collapse">
        <caption className="sr-only">Historial de novedades</caption>
        <thead className="bg-gris-100">
          <tr>
            <th scope="col" className={`${ENCABEZADO} pl-5`}>
              Código
            </th>
            <th scope="col" className={ENCABEZADO}>
              Registrada en finca
            </th>
            <th scope="col" className={ENCABEZADO}>
              Finca
            </th>
            <th scope="col" className={ENCABEZADO}>
              Área
            </th>
            <th scope="col" className={ENCABEZADO}>
              Prioridad
            </th>
            <th scope="col" className={ENCABEZADO}>
              Estado
            </th>
            <th scope="col" className={ENCABEZADO}>
              Tipo de falla
            </th>
            <th scope="col" className={`${ENCABEZADO} w-24`}>
              Tiempo hasta resolver
            </th>
            <th scope="col" className={`${ENCABEZADO} pr-5`}>
              Reportada por
            </th>
          </tr>
        </thead>
        <tbody>
          {novedades.map((novedad) => (
            <tr
              key={novedad.id}
              onClick={(evento) => {
                // El enlace del código ya navega.
                if (!(evento.target instanceof Element && evento.target.closest('a'))) {
                  abrir(novedad)
                }
              }}
              className="cursor-pointer border-b border-borde last:border-b-0 hover:bg-gris-100"
            >
              <td className={`${CELDA} pl-5 whitespace-nowrap`}>
                <Link
                  to={`/novedades/${novedad.id}`}
                  state={{ origen }}
                  className="rounded-sm text-etiqueta-fuerte text-texto"
                  translate="no"
                >
                  {formatearCodigo(novedad.codigo)}
                </Link>
              </td>
              <td className={`${CELDA} whitespace-nowrap`}>
                <time dateTime={novedad.fecha_registro}>
                  {formatearFechaDeLista(novedad.fecha_registro)}
                </time>
              </td>
              <td className={CELDA}>{novedad.finca}</td>
              <td className={CELDA}>
                <EtiquetaDeArea area={novedad.area} />
              </td>
              <td className={CELDA}>
                <Prioridad prioridad={novedad.prioridad} />
              </td>
              <td className={CELDA}>
                <Estado estado={novedad.estado} />
              </td>
              <td className={CELDA}>
                {novedad.tipo_falla ?? <SinDato texto="Sin tipo de falla" />}
              </td>
              <td className={`${CELDA} whitespace-nowrap`}>
                {/* Desde el registro hasta la última solución (decisión 6). */}
                {novedad.resuelta_en ? (
                  formatearDuracion(novedad.fecha_registro, novedad.resuelta_en)
                ) : (
                  <SinDato texto="Sin resolver" />
                )}
              </td>
              <td className={`${CELDA} pr-5`}>{novedad.reportante}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Las tarjetas de 21-D: el tipo de falla y quién la reportó en lugar de la descripción. */
function TarjetasDelHistorial({ novedades, origen }) {
  return (
    <ul aria-label="Historial de novedades" className="flex flex-col gap-2.5">
      {novedades.map((novedad) => (
        <TarjetaNovedad
          key={novedad.id}
          novedad={novedad}
          pie="finca"
          a={`/novedades/${novedad.id}`}
          origen={origen}
          texto={[
            novedad.tipo_falla ? `Tipo de falla: ${novedad.tipo_falla}` : null,
            `Reportada por ${novedad.reportante}`,
          ]
            .filter(Boolean)
            .join(' · ')}
          cuando={formatearDia(novedad.fecha_registro)}
        />
      ))}
    </ul>
  )
}

/** 21-C: ningún resultado. Sin filtros puestos, todavía no hay novedades. */
function SinResultados({ conFiltros, alLimpiar }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-borde bg-superficie px-6 py-12 text-center lg:py-14">
      <span className="flex size-[72px] items-center justify-center rounded-full bg-gris-100 text-texto-secundario">
        <Icono src={iconoSinResultados} tamano={36} />
      </span>
      <p role="status" className="text-subtitulo text-texto">
        {conFiltros ? 'Ninguna novedad cumple estos filtros' : 'Todavía no hay novedades.'}
      </p>
      {conFiltros ? (
        <Boton tipo="secundario" onClick={alLimpiar}>
          Limpiar filtros
        </Boton>
      ) : null}
    </div>
  )
}

export default function Historial() {
  const { perfil } = useSesion()
  const enLinea = useEnLinea()
  const esEscritorio = useEsEscritorio()
  const { pathname, search } = useLocation()
  const [parametros, setParametros] = useSearchParams()
  const esAprobador = perfil.rol_id === ROL.APROBADOR_AREA
  const leidos = leerFiltros(parametros)
  // El aprobador no filtra por área: las políticas ya le dan solo la suya (decisión 9).
  const { pagina, ...filtro } = esAprobador ? { ...leidos, area: null } : leidos
  const consulta = escribirFiltros({ ...filtro, pagina })
  const conFiltros = escribirFiltros(filtro) !== ''
  // El detalle vuelve a esta misma página, con sus filtros.
  const origen = `${pathname}${search}`

  const [opciones, setOpciones] = useState(SIN_OPCIONES)
  const [resultado, setResultado] = useState(null)
  const [fallo, setFallo] = useState(null)
  const [intento, setIntento] = useState(0)
  const inicioDeLaLista = useRef(null)

  useEffect(() => {
    if (!enLinea) return undefined
    let vigente = true
    // Sin las opciones, los filtros siguen sirviendo con «Todas»; la lista dice si hay un error.
    listarOpcionesDelHistorial().then(
      (lista) => vigente && setOpciones(lista),
      () => {},
    )
    return () => {
      vigente = false
    }
  }, [enLinea, intento])

  useEffect(() => {
    if (!enLinea) return undefined
    let vigente = true
    const { pagina: paginaPedida, ...filtroPedido } = leerFiltros(new URLSearchParams(consulta))
    listarHistorial(filtroPedido, paginaPedida).then(
      (respuesta) => {
        if (!vigente) return
        // Una página que ya no existe (una dirección vieja): la primera, sin otra entrada.
        if (respuesta.novedades.length === 0 && paginaPedida > 0) {
          setParametros(escribirFiltros(filtroPedido), { replace: true })
          return
        }
        setResultado({ consulta, ...respuesta })
        setFallo(null)
      },
      (error) => {
        if (vigente) {
          setFallo({
            ...traducirError(error),
            consulta,
            reintentar: () => setIntento((n) => n + 1),
          })
        }
      },
    )
    return () => {
      vigente = false
    }
  }, [consulta, enLinea, intento, setParametros])

  // Los mismos filtros no agregan otra entrada al historial del navegador.
  const aplicar = (nuevo) => {
    if (escribirFiltros(nuevo) !== consulta) setParametros(escribirFiltros(nuevo))
  }
  const cambiarDePagina = (nueva) => {
    aplicar({ ...filtro, pagina: nueva })
    inicioDeLaLista.current?.scrollIntoView?.({ block: 'start' })
  }

  const vigente = resultado?.consulta === consulta ? resultado : null
  // El error es de una consulta: con otros filtros, no se muestra mientras llega la nueva.
  const falloVigente = fallo?.consulta === consulta ? fallo : null
  const novedades = vigente?.novedades ?? []
  const ultima = Math.max(0, Math.ceil((vigente?.total ?? 0) / NOVEDADES_POR_PAGINA) - 1)

  return (
    <section className="flex flex-1 flex-col gap-4 px-4 pt-4 pb-24 lg:gap-6 lg:px-8 lg:py-8">
      <div className="flex flex-col gap-1">
        <h1 className="sr-only text-titulo text-texto lg:not-sr-only">Historial de novedades</h1>
        <p className="hidden text-cuerpo text-texto-secundario lg:block">
          Todas las novedades, filtradas según tu rol.
        </p>
      </div>

      {!enLinea ? (
        <Aviso tipo="advertencia" icono={iconoSinConexion} titulo="Sin conexión">
          El historial necesita conexión. Ábrelo cuando tengas internet.
        </Aviso>
      ) : null}

      {/* Con otros filtros en la dirección (un chip quitado), el formulario vuelve a empezar. */}
      <FiltrosDelHistorial
        key={escribirFiltros(filtro)}
        filtro={filtro}
        opciones={opciones}
        conArea={!esAprobador}
        deshabilitado={!enLinea}
        alAplicar={aplicar}
        resumen={
          enLinea && vigente ? (
            <p className="text-etiqueta-fuerte text-texto">{cuantas(vigente.total)}</p>
          ) : null
        }
      />

      {enLinea && falloVigente ? (
        <Aviso
          tipo={falloVigente.tipo === 'red' ? 'advertencia' : 'error'}
          icono={falloVigente.tipo === 'red' ? iconoSinConexion : iconoError}
          role="alert"
          accion={
            <Boton tipo="texto" tamano="escritorio" onClick={falloVigente.reintentar}>
              Reintentar
            </Boton>
          }
        >
          {falloVigente.mensaje}
        </Aviso>
      ) : null}

      {enLinea && !falloVigente && !vigente ? (
        <p role="status" className="py-6 text-center text-cuerpo-pequeno text-texto-secundario">
          Cargando…
        </p>
      ) : null}

      {enLinea && !falloVigente && vigente && novedades.length === 0 ? (
        <SinResultados conFiltros={conFiltros} alLimpiar={() => aplicar(SIN_FILTROS)} />
      ) : null}

      {enLinea && !falloVigente && novedades.length > 0 ? (
        <div ref={inicioDeLaLista} className="flex scroll-mt-20 flex-col gap-4">
          {esEscritorio ? (
            <>
              <p role="status" className="flex flex-wrap items-baseline gap-x-3">
                <span className="text-etiqueta-fuerte text-texto">{cuantas(vigente.total)}</span>
                <span className="text-cuerpo-pequeno text-texto-secundario">
                  de la más reciente a la más antigua
                </span>
              </p>
              <TablaDelHistorial novedades={novedades} origen={origen} />
            </>
          ) : (
            <TarjetasDelHistorial novedades={novedades} origen={origen} />
          )}
          {ultima > 0 ? (
            <Paginacion
              pagina={pagina}
              ultima={ultima}
              desde={pagina * NOVEDADES_POR_PAGINA}
              visibles={novedades.length}
              total={vigente.total}
              numeros
              alCambiar={cambiarDePagina}
            />
          ) : null}
        </div>
      ) : null}

      {/* 21-D: el aprobador no exporta (CU-20 1a); la nota lo explica, en los dos tamaños. */}
      {esAprobador ? (
        <p className="flex items-start gap-2 rounded-[10px] bg-gris-100 px-3.5 py-3 text-cuerpo-pequeno text-texto">
          <Icono src={iconoInformacion} tamano={20} className="flex-none text-texto-secundario" />
          La exportación a CSV solo está disponible para el administrador y el director de
          agricultura.
        </p>
      ) : null}
    </section>
  )
}
