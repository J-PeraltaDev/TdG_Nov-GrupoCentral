import { useId, useState } from 'react'
import { OBSERVACION_MAX_CARACTERES } from '../../core/config/parametros.js'
import { decidirEscalamiento } from '../../core/supabase/repositorios/novedades.js'
import { AreaDeTexto } from '../../core/ui/AreaDeTexto.jsx'
import { AvisoTemporal } from '../../core/ui/AvisoTemporal.jsx'
import { Boton } from '../../core/ui/Boton.jsx'
import { Hoja, IconoDeHoja } from '../../core/ui/Hoja.jsx'
import { Icono } from '../../core/ui/Icono.jsx'
import iconoRechazar from '../../core/ui/iconos/block.svg'
import iconoConfirmar from '../../core/ui/iconos/gavel.svg'
import iconoBloqueado from '../../core/ui/iconos/lock.svg'
import iconoMarcado from '../../core/ui/iconos/radio_button_checked.svg'
import iconoSinMarcar from '../../core/ui/iconos/radio_button_unchecked.svg'
import iconoAprobar from '../../core/ui/iconos/verified.svg'
import { Prioridad } from '../../core/ui/Prioridad.jsx'
import { formatearCodigo } from '../../core/utils/codigo.js'
import { BotonesDeHoja } from './BotonesDeHoja.jsx'
import { AVISO_SUELTO } from '../../core/ui/posicionDelAviso.js'
import { useAccion } from './useAccion.js'

/*
 * La decisión del director de agricultura sobre una novedad escalada (RF-13 / CU-13). Figma:
 * el panel «Tu decisión» de 20 (4:705) y 20-B (4:878) en el escritorio y, en el teléfono, la
 * barra de 20-C (4:1054), donde cada botón abre una hoja con la observación.
 *
 * Aprobar la devuelve al área para que ejecute la solución; rechazar la cierra. La
 * observación es opcional al aprobar y obligatoria al rechazar (CU-13 5a). Se carga bajo
 * demanda y solo para el director: los demás roles no la descargan.
 */

/** @typedef {'aprobar' | 'rechazar'} Eleccion */

/** @type {Record<Eleccion, { titulo: string, icono: string, color: string, elegida: string, circulo: string, ayuda: string, consecuencia: (novedad: { area: string }) => string, exito: (novedad: { area: string }) => string }>} */
const OPCIONES = {
  aprobar: {
    titulo: 'Aprobar',
    icono: iconoAprobar,
    color: 'text-estado-aprobada-texto',
    elegida: 'bg-estado-aprobada-fondo inset-ring-estado-aprobada-texto',
    circulo: 'bg-estado-aprobada-fondo text-estado-aprobada-texto',
    ayuda: 'Opcional al aprobar',
    consecuencia: ({ area }) => `Vuelve a ${area} para ejecutar la solución`,
    exito: ({ area }) => `Novedad aprobada. Vuelve a ${area} para ejecutar la solución.`,
  },
  rechazar: {
    titulo: 'Rechazar',
    icono: iconoRechazar,
    color: 'text-estado-rechazada-texto',
    elegida: 'bg-estado-rechazada-fondo inset-ring-estado-rechazada-texto',
    circulo: 'bg-estado-rechazada-fondo text-estado-rechazada-texto',
    ayuda: 'Obligatoria al rechazar',
    consecuencia: () => 'La novedad se cierra como Rechazada',
    exito: () => 'Novedad rechazada. El área y la finca verán tu observación.',
  },
}

/** @type {Eleccion[]} */
const ELECCIONES = ['aprobar', 'rechazar']

/** A quién se avisa. «Finca Juanca» y «Juanca» se leen igual: «la finca Juanca». */
const nota = ({ area, finca }) =>
  `Se avisará a ${area} y a la finca ${finca.replace(/^finca\s+/i, '')}. La decisión queda en el historial y no se puede editar.`

/**
 * @typedef {(aprobar: boolean, observacion: string | null) => Promise<{ ok: boolean, fallo?: { codigo: string | null, mensaje: string } }>} AlDecidir
 */

/**
 * La elección, la observación y su envío. Lo comparten el panel y las hojas: sin elección no
 * se confirma, y para rechazar hace falta la observación. Lo que se envía va sin espacios
 * sobrantes; una observación vacía va nula.
 *
 * @param {object} opciones
 * @param {AlDecidir} opciones.alDecidir
 * @param {boolean} opciones.enCurso La decisión se está enviando.
 * @param {Eleccion | null} [opciones.inicial] En una hoja la elección ya viene hecha.
 */
function useDecision({ alDecidir, enCurso, inicial = null }) {
  const [eleccion, setEleccion] = useState(inicial)
  const [observacion, setObservacion] = useState('')
  // Lo que respondió el servidor sobre la observación (demasiado larga, por ejemplo).
  const [error, setError] = useState(/** @type {string | null} */ (null))
  const falta = eleccion === 'rechazar' && observacion.trim() === ''
  const bloqueado = eleccion === null || falta || enCurso

  /** @param {{ preventDefault: () => void }} evento */
  async function confirmar(evento) {
    evento.preventDefault()
    if (bloqueado) return
    const resultado = await alDecidir(eleccion === 'aprobar', observacion.trim() || null)
    // El único error que se corrige en el campo: los demás van en el aviso del detalle.
    if (!resultado.ok && resultado.fallo?.codigo === 'DATO_OBLIGATORIO') {
      setError(resultado.fallo.mensaje)
    }
  }

  return {
    eleccion,
    /** @param {Eleccion} nueva */
    elegir(nueva) {
      setEleccion(nueva)
      setError(null)
    },
    observacion,
    /** @param {string} texto */
    escribir(texto) {
      setObservacion(texto)
      setError(null)
    },
    error,
    falta,
    bloqueado,
    confirmar,
  }
}

/** Una de las dos opciones del panel: un botón de radio con la forma de una tarjeta. */
function Opcion({ valor, grupo, marcada, alElegir, novedad }) {
  const id = useId()
  const { titulo, icono, color, elegida, consecuencia } = OPCIONES[valor]

  return (
    <label
      className={`flex cursor-pointer flex-col gap-1.5 rounded-xl p-4 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primario ${
        marcada ? `inset-ring-2 ${elegida}` : 'bg-superficie inset-ring inset-ring-borde'
      }`}
    >
      <span className="flex items-center gap-2">
        <Icono src={icono} tamano={22} className={`flex-none ${color}`} />
        <span id={`${id}-titulo`} className="min-w-0 flex-1 text-cuerpo-fuerte text-texto">
          {titulo}
        </span>
        <input
          type="radio"
          name={grupo}
          value={valor}
          checked={marcada}
          onChange={() => alElegir(valor)}
          aria-labelledby={`${id}-titulo`}
          aria-describedby={`${id}-consecuencia`}
          className="sr-only"
        />
        <Icono
          src={marcada ? iconoMarcado : iconoSinMarcar}
          tamano={22}
          className={`flex-none ${marcada ? color : 'text-texto-secundario'}`}
        />
      </span>
      <span id={`${id}-consecuencia`} className="text-cuerpo-pequeno text-texto-secundario">
        {consecuencia(novedad)}
      </span>
    </label>
  )
}

/**
 * Panel «Tu decisión» del escritorio (20 y 20-B).
 *
 * @param {object} props
 * @param {{ area: string, finca: string }} props.novedad
 * @param {AlDecidir} props.alDecidir
 * @param {boolean} props.enCurso
 */
function Panel({ novedad, alDecidir, enCurso }) {
  const idDelTitulo = useId()
  const grupo = useId()
  const { eleccion, elegir, observacion, escribir, error, falta, bloqueado, confirmar } =
    useDecision({ alDecidir, enCurso })

  return (
    <section
      aria-labelledby={idDelTitulo}
      className="flex flex-col gap-4 rounded-xl border border-borde bg-superficie p-5"
    >
      <h2 id={idDelTitulo} className="text-subtitulo text-texto">
        Tu decisión
      </h2>
      <form noValidate onSubmit={confirmar} className="flex flex-col gap-4">
        <div role="radiogroup" aria-labelledby={idDelTitulo} className="flex flex-col gap-4">
          {ELECCIONES.map((valor) => (
            <Opcion
              key={valor}
              valor={valor}
              grupo={grupo}
              marcada={eleccion === valor}
              alElegir={elegir}
              novedad={novedad}
            />
          ))}
        </div>

        <AreaDeTexto
          etiqueta="Observación"
          rows={3}
          maximo={OBSERVACION_MAX_CARACTERES}
          placeholder="Escribe la observación"
          ayuda="Opcional al aprobar, obligatoria al rechazar"
          aria-required={eleccion === 'rechazar' || undefined}
          value={observacion}
          // 20-B: con «Rechazar» elegido, el campo dice qué falta para poder confirmar.
          error={error ?? (falta ? 'Escribe la observación para rechazar' : null)}
          onChange={(evento) => escribir(evento.target.value)}
        />

        <Boton
          type="submit"
          icono={bloqueado && !enCurso ? iconoBloqueado : iconoConfirmar}
          disabled={bloqueado}
          className="w-full"
        >
          {enCurso ? 'Confirmando…' : 'Confirmar decisión'}
        </Boton>

        <p className="text-auxiliar text-texto-secundario">{nota(novedad)}</p>
      </form>
    </section>
  )
}

/**
 * El contenido de una hoja del teléfono (20-C). Va aparte porque solo existe mientras la hoja
 * está abierta: cada vez que se abre, la observación empieza en blanco.
 *
 * @param {object} props
 * @param {Eleccion} props.eleccion
 * @param {{ codigo: number, area: string, finca: string, prioridad: string }} props.novedad
 * @param {() => void} props.alCerrar
 * @param {AlDecidir} props.alDecidir
 * @param {boolean} props.enCurso
 */
function FormularioDeHoja({ eleccion, novedad, alCerrar, alDecidir, enCurso }) {
  const { ayuda, consecuencia } = OPCIONES[eleccion]
  const rechaza = eleccion === 'rechazar'
  const { observacion, escribir, error, bloqueado, confirmar } = useDecision({
    alDecidir,
    enCurso,
    inicial: eleccion,
  })

  return (
    <form noValidate onSubmit={confirmar} className="flex flex-col gap-4">
      <p className="text-cuerpo-pequeno text-texto-secundario">{consecuencia(novedad)}.</p>

      {/* La novedad sobre la que se decide, para confirmar que es esa (como en la hoja 15). */}
      <p className="flex flex-wrap items-center gap-2 rounded-control bg-gris-100 p-2.5 text-etiqueta-fuerte text-texto">
        <span>
          <span translate="no">{formatearCodigo(novedad.codigo)}</span> · {novedad.finca}
        </span>
        <Prioridad prioridad={novedad.prioridad} />
      </p>

      <AreaDeTexto
        etiqueta="Observación"
        obligatorio={rechaza}
        rows={3}
        maximo={OBSERVACION_MAX_CARACTERES}
        placeholder="Escribe la observación"
        ayuda={ayuda}
        value={observacion}
        error={error}
        onChange={(evento) => escribir(evento.target.value)}
      />

      <BotonesDeHoja
        tipo={rechaza ? 'peligro' : 'primario'}
        icono={iconoConfirmar}
        texto="Confirmar decisión"
        textoEnCurso="Confirmando…"
        enCurso={enCurso}
        deshabilitado={bloqueado}
        alCancelar={alCerrar}
      />

      <p className="text-center text-auxiliar text-texto-secundario">{nota(novedad)}</p>
    </form>
  )
}

/**
 * @param {object} props
 * @param {{ id: string, estado: string, codigo: number, area: string, finca: string, prioridad: string }} props.novedad
 * @param {boolean} props.puedeDecidir El mapa de acciones (Tabla 35) le permite decidir: es el
 *   director y la novedad está escalada. Cuando deja de poder, solo queda el aviso de lo que
 *   acaba de hacer.
 * @param {() => void} props.alCambiar Recarga el detalle después de la decisión.
 * @param {boolean} props.esEscritorio En el escritorio es el panel «Tu decisión»; en el
 *   teléfono, una barra fija abajo que reemplaza a la navegación.
 */
export default function DecisionDelDirector({ novedad, puedeDecidir, alCambiar, esEscritorio }) {
  const { ejecutar, enCurso, aviso, cerrarAviso } = useAccion({
    estado: novedad.estado,
    alCambiar,
  })
  // La hoja abierta en el teléfono, si hay alguna.
  const [hoja, setHoja] = useState(/** @type {Eleccion | null} */ (null))
  const cerrarHoja = () => setHoja(null)

  /** @type {AlDecidir} */
  const decidir = (aprobar, observacion) =>
    ejecutar(() => decidirEscalamiento(novedad.id, aprobar, observacion), {
      exito: OPCIONES[aprobar ? 'aprobar' : 'rechazar'].exito(novedad),
      codigosPropios: ['DATO_OBLIGATORIO'],
    })

  /**
   * Con cualquier resultado la hoja se cierra y el aviso va en el detalle (un aviso fuera de
   * un diálogo modal no se ve ni se anuncia), salvo que el servidor no acepte la observación:
   * eso se corrige en la misma hoja.
   *
   * @type {AlDecidir}
   */
  async function decidirEnLaHoja(aprobar, observacion) {
    const resultado = await decidir(aprobar, observacion)
    if (resultado.ok || resultado.fallo?.codigo !== 'DATO_OBLIGATORIO') cerrarHoja()
    return resultado
  }

  const avisoTemporal = (className) =>
    aviso ? (
      <AvisoTemporal
        tipo={aviso.tipo}
        accion={aviso.reintentar ? { texto: 'Reintentar', alPulsar: aviso.reintentar } : undefined}
        alTerminar={cerrarAviso}
        className={className}
      >
        {aviso.mensaje}
      </AvisoTemporal>
    ) : null

  if (esEscritorio) {
    return (
      <>
        {puedeDecidir ? <Panel novedad={novedad} alDecidir={decidir} enCurso={enCurso} /> : null}
        {avisoTemporal(AVISO_SUELTO)}
      </>
    )
  }

  // El mismo contenedor con o sin barra: así el aviso no se vuelve a montar (ni a anunciar)
  // cuando la novedad deja de estar escalada. Sin barra, el aviso va suelto.
  return (
    <>
      <div
        data-barra-de-acciones={puedeDecidir ? '' : undefined}
        className={
          puedeDecidir
            ? 'sticky bottom-0 z-10 mt-auto flex gap-2.5 border-t border-borde bg-superficie px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] drop-shadow-[0_-4px_6px_rgb(0_0_0/0.06)]'
            : undefined
        }
      >
        {avisoTemporal(puedeDecidir ? 'absolute inset-x-4 bottom-full mb-4' : AVISO_SUELTO)}
        {puedeDecidir ? (
          <>
            <Boton
              tipo="secundario-peligro"
              icono={iconoRechazar}
              disabled={enCurso}
              onClick={() => setHoja('rechazar')}
              className="min-w-0 flex-1"
            >
              Rechazar
            </Boton>
            <Boton
              icono={iconoAprobar}
              disabled={enCurso}
              onClick={() => setHoja('aprobar')}
              className="min-w-0 flex-1"
            >
              Aprobar
            </Boton>
          </>
        ) : null}
      </div>

      {puedeDecidir
        ? ELECCIONES.map((eleccion) => (
            <Hoja
              key={eleccion}
              abierta={hoja === eleccion}
              alCerrar={cerrarHoja}
              titulo={OPCIONES[eleccion].titulo}
              icono={
                <IconoDeHoja
                  src={OPCIONES[eleccion].icono}
                  className={OPCIONES[eleccion].circulo}
                />
              }
            >
              <FormularioDeHoja
                eleccion={eleccion}
                novedad={novedad}
                alCerrar={cerrarHoja}
                alDecidir={decidirEnLaHoja}
                enCurso={enCurso}
              />
            </Hoja>
          ))
        : null}
    </>
  )
}
