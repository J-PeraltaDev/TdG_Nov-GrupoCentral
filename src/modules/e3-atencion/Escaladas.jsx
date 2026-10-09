import { useEffect, useId, useState } from 'react'
import { Link } from 'react-router'
import { traducirError } from '../../core/errores/traducir.js'
import { useSesion } from '../../core/sesion/ContextoSesion.js'
import { firmaDe } from '../../core/sesion/roles.js'
import {
  contarDecisionesDelMes,
  listarEscaladas,
  listarEscalamientos,
} from '../../core/supabase/repositorios/novedades.js'
import { Aviso } from '../../core/ui/Aviso.jsx'
import { Boton } from '../../core/ui/Boton.jsx'
import { EtiquetasDeNovedad } from '../../core/ui/EtiquetasDeNovedad.jsx'
import { Icono } from '../../core/ui/Icono.jsx'
import iconoRechazadas from '../../core/ui/iconos/block.svg'
import iconoSinConexion from '../../core/ui/iconos/cloud_off.svg'
import iconoError from '../../core/ui/iconos/error.svg'
import iconoDecidir from '../../core/ui/iconos/gavel.svg'
import iconoEsperan from '../../core/ui/iconos/hourglass_top.svg'
import iconoReloj from '../../core/ui/iconos/schedule.svg'
import iconoAprobadas from '../../core/ui/iconos/verified.svg'
import { formatearCodigo } from '../../core/utils/codigo.js'
import { inicioDelMesEnColombia, tiempoTranscurrido } from '../../core/utils/fechas.js'
import { JustificacionDelEscalamiento } from './JustificacionDelEscalamiento.jsx'

/*
 * Pantalla 19 · Novedades escaladas (RF-13 / CU-13). Figma 4:547. Es el inicio del director de
 * agricultura (SDD, Tabla 10): lo que las áreas escalaron y espera su decisión, con la
 * justificación de cada una.
 *
 * Decidir es abrir la novedad: la pantalla 20 es su detalle. Figma dibuja esta pantalla para
 * el escritorio; en el teléfono son las mismas tarjetas, en una columna.
 */

const ORIGEN = '/escaladas'

// Enlaces con la forma de los botones: llevan a otra pantalla, no ejecutan nada aquí.
const ENLACE =
  'inline-flex h-12 w-full items-center justify-center gap-2 rounded-control px-5 text-cuerpo-fuerte whitespace-nowrap lg:h-10 lg:w-auto lg:px-4 lg:text-etiqueta-fuerte'
const ENLACE_PRINCIPAL = `${ENLACE} bg-primario text-sobre-primario hover:bg-primario-hover`
const ENLACE_DE_TEXTO = `${ENLACE} text-primario hover:text-primario-hover`

/**
 * «hace 18 h», como lo escribe Figma. Recién escalada, «hace menos de 1 min»: el «ahora» de
 * las demás pantallas no se lee bien después de «Esperando decisión».
 *
 * @param {string} desde
 */
function espera(desde) {
  const tiempo = tiempoTranscurrido(desde)
  return tiempo === 'ahora' ? 'hace menos de 1 min' : tiempo
}

function Contador({ icono, nombre, valor, destacado = false }) {
  return (
    <li className="flex min-w-0 flex-col gap-0.5 rounded-xl border border-borde bg-superficie px-2.5 py-3 lg:gap-1.5 lg:p-5">
      <span className="flex items-center gap-2 text-auxiliar text-texto-secundario lg:text-etiqueta">
        {/* El ícono es un adorno: a 360 px no cabe junto al nombre y solo va en el escritorio. */}
        <span className="hidden flex-none lg:flex">
          <Icono src={icono} tamano={20} />
        </span>
        {nombre}
      </span>
      <span
        className={`text-titulo tabular-nums lg:text-indicador ${destacado ? 'text-estado-escalada-texto' : 'text-texto'}`}
      >
        {valor ?? '–'}
      </span>
    </li>
  )
}

function Escalada({ novedad, escalamiento }) {
  const idDelTitulo = useId()
  const codigo = formatearCodigo(novedad.codigo)
  // Espera desde que se escaló; sin el historial, desde que se registró.
  const desde = escalamiento?.fecha_hora ?? novedad.fecha_registro

  return (
    <li>
      <article
        aria-labelledby={idDelTitulo}
        className="flex flex-col gap-3.5 rounded-xl border border-borde bg-superficie p-4 lg:p-5"
      >
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
          <h2 id={idDelTitulo} className="text-subtitulo text-texto" translate="no">
            {codigo}
          </h2>
          <EtiquetasDeNovedad novedad={novedad} />
          <span className="hidden flex-1 lg:block" />
          <p className="flex w-full items-center gap-1.5 text-cuerpo-pequeno text-texto-secundario lg:w-auto">
            <Icono src={iconoReloj} tamano={16} />
            Esperando decisión {espera(desde)}
          </p>
        </div>

        <p className="text-cuerpo break-words text-texto">{novedad.descripcion}</p>

        {escalamiento?.observacion ? (
          <JustificacionDelEscalamiento
            texto={escalamiento.observacion}
            pie={escalamiento.usuario ? `Escaló: ${firmaDe(escalamiento.usuario)}` : undefined}
          />
        ) : null}

        <div className="flex flex-col-reverse gap-1 lg:flex-row lg:justify-end lg:gap-2">
          <Link
            to={`/novedades/${novedad.id}#linea-de-tiempo`}
            state={{ origen: ORIGEN }}
            aria-label={`Ver historial de ${codigo}`}
            className={ENLACE_DE_TEXTO}
          >
            Ver historial
          </Link>
          <Link
            to={`/novedades/${novedad.id}`}
            state={{ origen: ORIGEN }}
            aria-label={`Revisar y decidir ${codigo}`}
            className={ENLACE_PRINCIPAL}
          >
            <Icono src={iconoDecidir} tamano={20} />
            Revisar y decidir
          </Link>
        </div>
      </article>
    </li>
  )
}

export default function Escaladas() {
  const { perfil } = useSesion()
  const [intento, setIntento] = useState(0)
  const [lista, setLista] = useState({ intento: -1, novedades: [], total: 0, pagina: 0 })
  const [decisiones, setDecisiones] = useState(null)
  const [escalamientos, setEscalamientos] = useState({})
  const [fallo, setFallo] = useState(null)
  const [cargandoMas, setCargandoMas] = useState(false)

  // La lista y los contadores del mes no dependen entre sí: van en paralelo. Si fallan los
  // contadores, la lista sigue sirviendo.
  useEffect(() => {
    let vigente = true
    listarEscaladas()
      .then((pagina) => {
        if (!vigente) return
        setLista({ intento, ...pagina, pagina: 0 })
        setFallo(null)
      })
      .catch((error) => {
        if (!vigente) return
        setLista({ intento, novedades: [], total: 0, pagina: 0 })
        setFallo(traducirError(error))
      })
    contarDecisionesDelMes(perfil.id, inicioDelMesEnColombia())
      .then((conteo) => {
        if (vigente) setDecisiones(conteo)
      })
      .catch(() => {})
    return () => {
      vigente = false
    }
  }, [perfil.id, intento])

  // La justificación de cada novedad está en su historial: se pide para las que se ven.
  const idsVisibles = lista.novedades.map(({ id }) => id).join(',')
  useEffect(() => {
    if (idsVisibles === '') return undefined
    let vigente = true
    listarEscalamientos(idsVisibles.split(','))
      .then((transiciones) => {
        if (!vigente) return
        // Llegan en orden: si una novedad se escaló más de una vez, queda la última.
        setEscalamientos(Object.fromEntries(transiciones.map((t) => [t.novedad_id, t])))
      })
      // Sin el historial la lista sigue sirviendo: solo falta el recuadro.
      .catch(() => {})
    return () => {
      vigente = false
    }
  }, [idsVisibles])

  async function verMas() {
    setCargandoMas(true)
    setFallo(null)
    try {
      const siguiente = lista.pagina + 1
      const pagina = await listarEscaladas({ pagina: siguiente })
      setLista((actual) => ({
        intento: actual.intento,
        novedades: [...actual.novedades, ...pagina.novedades],
        total: pagina.total,
        pagina: siguiente,
      }))
    } catch (error) {
      setFallo(traducirError(error))
    } finally {
      setCargandoMas(false)
    }
  }

  const cargando = lista.intento !== intento
  const hayMas = lista.novedades.length < lista.total
  const vacia = !cargando && !fallo && lista.novedades.length === 0
  // Con la lista a la vista, el reintento es volver a pedir la página que faltó.
  const reintentar = lista.novedades.length > 0 ? verMas : () => setIntento((n) => n + 1)

  return (
    <section className="flex w-full flex-1 flex-col gap-3.5 px-4 pt-4 pb-6 lg:gap-6 lg:px-8 lg:pt-8 lg:pb-12">
      <header className="sr-only lg:not-sr-only lg:flex lg:flex-col lg:gap-1">
        <h1 className="text-display text-texto">Novedades escaladas</h1>
        <p className="text-cuerpo text-texto-secundario">
          Solicitudes de las áreas que necesitan tu autorización
        </p>
      </header>

      <ul aria-label="Resumen de tus decisiones" className="grid grid-cols-3 gap-2 lg:gap-4">
        <Contador
          icono={iconoEsperan}
          nombre="Esperan tu decisión"
          valor={cargando ? null : lista.total}
          destacado
        />
        <Contador
          icono={iconoAprobadas}
          nombre="Aprobadas este mes"
          valor={decisiones?.aprobadas}
        />
        <Contador
          icono={iconoRechazadas}
          nombre="Rechazadas este mes"
          valor={decisiones?.rechazadas}
        />
      </ul>

      {cargando ? (
        <p role="status" className="py-6 text-center text-cuerpo-pequeno text-texto-secundario">
          Cargando…
        </p>
      ) : null}

      {vacia ? (
        <p className="py-10 text-center text-cuerpo text-texto-secundario">
          No hay novedades esperando tu decisión.
        </p>
      ) : null}

      {!cargando && lista.novedades.length > 0 ? (
        <ul aria-label="Novedades escaladas" className="flex flex-col gap-2.5 lg:gap-6">
          {lista.novedades.map((novedad) => (
            <Escalada key={novedad.id} novedad={novedad} escalamiento={escalamientos[novedad.id]} />
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
    </section>
  )
}
