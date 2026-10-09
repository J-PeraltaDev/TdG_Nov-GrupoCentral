import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { ACCION } from '../../core/acciones/accionesDisponibles.js'
import {
  escalarNovedad,
  reasignarNovedad,
  rechazarNovedad,
  tomarNovedad,
} from '../../core/supabase/repositorios/novedades.js'
import { AvisoTemporal } from '../../core/ui/AvisoTemporal.jsx'
import { Boton } from '../../core/ui/Boton.jsx'
import { Icono } from '../../core/ui/Icono.jsx'
import iconoEscalar from '../../core/ui/iconos/arrow_circle_up.svg'
import iconoTomar from '../../core/ui/iconos/back_hand.svg'
import iconoRechazar from '../../core/ui/iconos/block.svg'
import iconoReasignar from '../../core/ui/iconos/swap_horiz.svg'
import iconoResolver from '../../core/ui/iconos/task_alt.svg'
import { HojaEscalar } from './HojaEscalar.jsx'
import { HojaReasignar } from './HojaReasignar.jsx'
import { HojaRechazar } from './HojaRechazar.jsx'
import { AVISO_SUELTO } from '../../core/ui/posicionDelAviso.js'
import { useAccion } from './useAccion.js'

/*
 * Acciones del aprobador de área en el detalle de una novedad (RF-10 a RF-17). Figma: barra de
 * acciones de 13 (3:842) y 14 (3:1262), aviso de 13-B y de 14-C (3:1276), hojas 15 (3:1356),
 * 16 (3:1468) y 17 (3:1586). «Registrar solución» no es una hoja: abre la pantalla 18.
 *
 * El mapa de acciones dice qué permite la Tabla 35; aquí se pintan las que ya tienen su
 * manejador. Se carga bajo demanda y solo para el aprobador: los demás roles no la descargan.
 */

/** Acciones que este módulo ya sabe ejecutar. Las demás llegan con su historia. */
const CONSTRUIDAS = [
  ACCION.TOMAR,
  ACCION.REGISTRAR_SOLUCION,
  ACCION.ESCALAR,
  ACCION.REASIGNAR,
  ACCION.RECHAZAR,
]

// Un enlace con la forma del botón primario: lleva a otra pantalla, no ejecuta nada aquí.
const ENLACE_PRINCIPAL =
  'inline-flex h-12 w-full items-center justify-center gap-2 rounded-control bg-primario px-5 text-cuerpo-fuerte whitespace-nowrap text-sobre-primario hover:bg-primario-hover lg:h-10 lg:w-auto lg:px-4 lg:text-etiqueta-fuerte'

/**
 * @param {object} props
 * @param {{ id: string, estado: string, codigo: number, finca: string, prioridad: string, area_id: string, area: string }} props.novedad
 * @param {readonly string[]} props.acciones Las de `accionesDisponibles` para este usuario.
 * @param {() => void} props.alCambiar Recarga el detalle después de una acción.
 * @param {(mensaje: string) => void} props.alSalir La acción sacó la novedad del alcance del
 *   usuario (la reasignó): el detalle ya no se puede recargar y hay que volver a la bandeja,
 *   que muestra el mensaje.
 * @param {{ tipo: 'exito' | 'error', mensaje: string } | null} [props.avisoDeLlegada] El aviso
 *   con que se vuelve de registrar la solución; lo reemplaza el de la siguiente acción.
 * @param {() => void} [props.alQuitarAvisoDeLlegada]
 * @param {boolean} props.esEscritorio En el escritorio son botones bajo el encabezado; en el
 *   teléfono, una barra fija abajo que reemplaza a la navegación.
 */
export default function AccionesDelAprobador({
  novedad,
  acciones,
  alCambiar,
  alSalir,
  avisoDeLlegada = null,
  alQuitarAvisoDeLlegada,
  esEscritorio,
}) {
  const { state } = useLocation()
  const { ejecutar, enCurso, aviso, cerrarAviso } = useAccion({
    estado: novedad.estado,
    alCambiar,
  })
  // La hoja abierta, si hay alguna: cada acción que pide un texto tiene la suya.
  const [hoja, setHoja] = useState(/** @type {string | null} */ (null))
  // La última acción que se lanzó: su botón es el que dice que está en curso.
  const [lanzada, setLanzada] = useState(/** @type {string | null} */ (null))
  const puede = (accion) => CONSTRUIDAS.includes(accion) && acciones.includes(accion)
  const cerrarHoja = () => setHoja(null)

  /**
   * Ejecuta la acción de una hoja. Con cualquier resultado la hoja se cierra y el aviso va en
   * el detalle (un aviso fuera de un diálogo modal no se ve ni se anuncia), salvo que falte un
   * dato: ese se corrige en la misma hoja.
   */
  async function confirmar(nombre, accion, { exito, alTerminar }) {
    setLanzada(nombre)
    const resultado = await ejecutar(accion, {
      exito,
      alTerminar,
      codigosPropios: ['DATO_OBLIGATORIO'],
    })
    if (resultado.ok || resultado.fallo.codigo !== 'DATO_OBLIGATORIO') cerrarHoja()
    return resultado
  }

  // Como en Figma: la acción principal y «Escalar al director» a todo el ancho y, debajo, las
  // que comparten fila.
  const principal = puede(ACCION.TOMAR) ? (
    <Boton
      icono={iconoTomar}
      disabled={enCurso}
      onClick={() => {
        setLanzada(ACCION.TOMAR)
        ejecutar(() => tomarNovedad(novedad.id), { exito: 'Novedad tomada. Ya está En atención.' })
      }}
      className="w-full lg:w-auto"
    >
      {enCurso && lanzada === ACCION.TOMAR ? 'Tomando…' : 'Tomar para atención'}
    </Boton>
  ) : puede(ACCION.REGISTRAR_SOLUCION) ? (
    // La pantalla 18 vuelve a este detalle, que recuerda de qué lista se abrió.
    <Link
      to={`/novedades/${novedad.id}/solucion`}
      state={{ origen: state?.origen }}
      className={ENLACE_PRINCIPAL}
    >
      <Icono src={iconoResolver} tamano={20} />
      Registrar solución
    </Link>
  ) : null

  const escalar = puede(ACCION.ESCALAR) ? (
    <Boton
      tipo="secundario"
      icono={iconoEscalar}
      disabled={enCurso}
      onClick={() => setHoja(ACCION.ESCALAR)}
      className="w-full lg:w-auto"
    >
      Escalar al director
    </Boton>
  ) : null

  const reasignar = puede(ACCION.REASIGNAR) ? (
    <Boton
      tipo="secundario"
      icono={iconoReasignar}
      disabled={enCurso}
      onClick={() => setHoja(ACCION.REASIGNAR)}
      className="min-w-0 flex-1 lg:flex-none"
    >
      Reasignar
    </Boton>
  ) : null

  const rechazar = puede(ACCION.RECHAZAR) ? (
    <Boton
      tipo="secundario-peligro"
      icono={iconoRechazar}
      disabled={enCurso}
      onClick={() => setHoja(ACCION.RECHAZAR)}
      className="min-w-0 flex-1 lg:flex-none"
    >
      Rechazar
    </Boton>
  ) : null

  const botones =
    principal || escalar || reasignar || rechazar ? (
      <>
        {principal}
        {escalar}
        {reasignar || rechazar ? (
          <div className="flex gap-2.5 lg:contents">
            {reasignar}
            {rechazar}
          </div>
        ) : null}
      </>
    ) : null

  const hojas = (
    <>
      <HojaEscalar
        abierta={hoja === ACCION.ESCALAR}
        novedad={novedad}
        alCerrar={cerrarHoja}
        alConfirmar={(justificacion) =>
          confirmar(ACCION.ESCALAR, () => escalarNovedad(novedad.id, justificacion), {
            exito: 'Novedad escalada. Queda en espera del director.',
          })
        }
        enCurso={enCurso && lanzada === ACCION.ESCALAR}
      />
      <HojaReasignar
        abierta={hoja === ACCION.REASIGNAR}
        novedad={novedad}
        alCerrar={cerrarHoja}
        alConfirmar={(destino, motivo) =>
          // La novedad sale del alcance de esta persona: no se recarga el detalle (daría «No
          // puedes ver esta novedad»), se vuelve a la bandeja.
          confirmar(ACCION.REASIGNAR, () => reasignarNovedad(novedad.id, destino.id, motivo), {
            alTerminar: () => alSalir(`Novedad reasignada a ${destino.nombre}.`),
          })
        }
        enCurso={enCurso && lanzada === ACCION.REASIGNAR}
      />
      <HojaRechazar
        abierta={hoja === ACCION.RECHAZAR}
        alCerrar={cerrarHoja}
        alConfirmar={(motivo) =>
          confirmar(ACCION.RECHAZAR, () => rechazarNovedad(novedad.id, motivo), {
            exito: 'Novedad rechazada. La finca verá el motivo.',
          })
        }
        enCurso={enCurso && lanzada === ACCION.RECHAZAR}
      />
    </>
  )

  // El aviso de una acción hecha aquí va primero; si no hay, el que se trajo al llegar.
  const visible = aviso ?? avisoDeLlegada
  const avisoTemporal = (className) =>
    visible ? (
      <AvisoTemporal
        tipo={visible.tipo}
        accion={aviso?.reintentar ? { texto: 'Reintentar', alPulsar: aviso.reintentar } : undefined}
        alTerminar={aviso ? cerrarAviso : alQuitarAvisoDeLlegada}
        className={className}
      >
        {visible.mensaje}
      </AvisoTemporal>
    ) : null

  if (esEscritorio) {
    return (
      <>
        {botones ? <div className="flex flex-wrap gap-2.5">{botones}</div> : null}
        {avisoTemporal(AVISO_SUELTO)}
        {hojas}
      </>
    )
  }

  // El mismo contenedor con o sin barra: así el aviso no se vuelve a montar (ni a anunciar)
  // cuando la novedad cambia de estado y se quedan sin acciones. Sin acciones no hay barra y
  // el aviso (por ejemplo, el de «novedad rechazada») va suelto.
  return (
    <>
      <div
        data-barra-de-acciones={botones ? '' : undefined}
        className={
          botones
            ? 'sticky bottom-0 z-10 mt-auto flex flex-col gap-2.5 border-t border-borde bg-superficie px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] drop-shadow-[0_-4px_6px_rgb(0_0_0/0.06)]'
            : undefined
        }
      >
        {avisoTemporal(botones ? 'absolute inset-x-4 bottom-full mb-4' : AVISO_SUELTO)}
        {botones}
      </div>
      {hojas}
    </>
  )
}
