import { useState } from 'react'
import { ACCION } from '../../core/acciones/accionesDisponibles.js'
import {
  escalarNovedad,
  rechazarNovedad,
  tomarNovedad,
} from '../../core/supabase/repositorios/novedades.js'
import { AvisoTemporal } from '../../core/ui/AvisoTemporal.jsx'
import { Boton } from '../../core/ui/Boton.jsx'
import iconoEscalar from '../../core/ui/iconos/arrow_circle_up.svg'
import iconoTomar from '../../core/ui/iconos/back_hand.svg'
import iconoRechazar from '../../core/ui/iconos/block.svg'
import { HojaEscalar } from './HojaEscalar.jsx'
import { HojaRechazar } from './HojaRechazar.jsx'
import { useAccion } from './useAccion.js'

/*
 * Acciones del aprobador de área en el detalle de una novedad (RF-10 a RF-17). Figma: barra de
 * acciones de 13 (3:842) y 14 (3:1262), aviso de 13-B y de 14-C (3:1276), hojas 15 (3:1356) y
 * 16 (3:1468).
 *
 * El mapa de acciones dice qué permite la Tabla 35; aquí se pintan las que ya tienen su
 * manejador. Se carga bajo demanda y solo para el aprobador: los demás roles no la descargan.
 */

/** Acciones que este módulo ya sabe ejecutar. Las demás llegan con su historia. */
const CONSTRUIDAS = [ACCION.TOMAR, ACCION.ESCALAR, ACCION.RECHAZAR]

// Sobre la navegación inferior del teléfono cuando no hay barra de acciones; en el escritorio,
// abajo a la derecha.
const AVISO_SUELTO =
  'fixed inset-x-4 bottom-[calc(max(1.25rem,env(safe-area-inset-bottom))+4.75rem)] z-20 lg:inset-x-auto lg:right-8 lg:bottom-6 lg:w-96'

/**
 * @param {object} props
 * @param {{ id: string, estado: string, codigo: number, finca: string, prioridad: string }} props.novedad
 * @param {readonly string[]} props.acciones Las de `accionesDisponibles` para este usuario.
 * @param {() => void} props.alCambiar Recarga el detalle después de una acción.
 * @param {boolean} props.esEscritorio En el escritorio son botones bajo el encabezado; en el
 *   teléfono, una barra fija abajo que reemplaza a la navegación.
 */
export default function AccionesDelAprobador({ novedad, acciones, alCambiar, esEscritorio }) {
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
  async function confirmar(nombre, accion, exito) {
    setLanzada(nombre)
    const resultado = await ejecutar(accion, { exito, codigosPropios: ['DATO_OBLIGATORIO'] })
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

  const enFila = puede(ACCION.RECHAZAR) ? (
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
    principal || escalar || enFila ? (
      <>
        {principal}
        {escalar}
        {enFila ? <div className="flex gap-2.5 lg:contents">{enFila}</div> : null}
      </>
    ) : null

  const hojas = (
    <>
      <HojaEscalar
        abierta={hoja === ACCION.ESCALAR}
        novedad={novedad}
        alCerrar={cerrarHoja}
        alConfirmar={(justificacion) =>
          confirmar(
            ACCION.ESCALAR,
            () => escalarNovedad(novedad.id, justificacion),
            'Novedad escalada. Queda en espera del director.',
          )
        }
        enCurso={enCurso && lanzada === ACCION.ESCALAR}
      />
      <HojaRechazar
        abierta={hoja === ACCION.RECHAZAR}
        alCerrar={cerrarHoja}
        alConfirmar={(motivo) =>
          confirmar(
            ACCION.RECHAZAR,
            () => rechazarNovedad(novedad.id, motivo),
            'Novedad rechazada. La finca verá el motivo.',
          )
        }
        enCurso={enCurso && lanzada === ACCION.RECHAZAR}
      />
    </>
  )

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
