import { useState } from 'react'
import { ACCION } from '../../core/acciones/accionesDisponibles.js'
import {
  confirmarResolucion,
  reportarFallaPersiste,
} from '../../core/supabase/repositorios/novedades.js'
import { AvisoTemporal } from '../../core/ui/AvisoTemporal.jsx'
import { Boton } from '../../core/ui/Boton.jsx'
import { DialogoConfirmarCierre } from './DialogoConfirmarCierre.jsx'
import { HojaFallaPersiste } from './HojaFallaPersiste.jsx'
import { AVISO_SUELTO } from './posicionDelAviso.js'
import { useAccion } from './useAccion.js'

/*
 * Acciones del reportante sobre una novedad resuelta de su finca (RF-15 / CU-15). Figma: la
 * barra de 09 (2:1118), la hoja 09-B (2:1243) y el diálogo 09-C (2:1365).
 *
 * Confirmar el cierre la deja cerrada, que es definitivo; «la falla persiste» la devuelve al
 * área. El mapa de acciones dice qué permite la Tabla 35; «Adjuntar foto» llega en el
 * Sprint 4. Se carga bajo demanda y solo para el reportante.
 */

/**
 * @param {object} props
 * @param {{ id: string, estado: string, area: string }} props.novedad
 * @param {readonly string[]} props.acciones Las de `accionesDisponibles` para este usuario.
 * @param {() => void} props.alCambiar Recarga el detalle después de una acción.
 * @param {boolean} props.esEscritorio En el escritorio son botones bajo el encabezado; en el
 *   teléfono, una barra fija abajo que reemplaza a la navegación.
 */
export default function AccionesDelReportante({ novedad, acciones, alCambiar, esEscritorio }) {
  const { ejecutar, enCurso, aviso, cerrarAviso } = useAccion({
    estado: novedad.estado,
    alCambiar,
  })
  // Lo que está abierto, si hay algo: el diálogo de confirmar o la hoja de la falla.
  const [abierta, setAbierta] = useState(/** @type {string | null} */ (null))
  const cerrar = () => setAbierta(null)
  const puedeConfirmar = acciones.includes(ACCION.CONFIRMAR_CIERRE)
  const puedeDevolver = acciones.includes(ACCION.FALLA_PERSISTE)

  /**
   * Con cualquier resultado lo abierto se cierra y el aviso va en el detalle (un aviso fuera
   * de un diálogo modal no se ve ni se anuncia), salvo que el servidor no acepte el texto:
   * eso se corrige ahí mismo.
   */
  async function confirmar(accion, exito) {
    const resultado = await ejecutar(accion, { exito, codigosPropios: ['DATO_OBLIGATORIO'] })
    if (resultado.ok || resultado.fallo.codigo !== 'DATO_OBLIGATORIO') cerrar()
    return resultado
  }

  // El mismo orden en los dos formatos, que es el de Figma y el del teclado.
  const botones =
    puedeConfirmar || puedeDevolver ? (
      <>
        {puedeDevolver ? (
          <Boton
            tipo="secundario"
            disabled={enCurso}
            onClick={() => setAbierta(ACCION.FALLA_PERSISTE)}
            className="min-w-0 flex-1 lg:flex-none"
          >
            La falla persiste
          </Boton>
        ) : null}
        {puedeConfirmar ? (
          <Boton
            disabled={enCurso}
            onClick={() => setAbierta(ACCION.CONFIRMAR_CIERRE)}
            className="min-w-0 flex-1 lg:flex-none"
          >
            Confirmar cierre
          </Boton>
        ) : null}
      </>
    ) : null

  const dialogos = botones ? (
    <>
      <DialogoConfirmarCierre
        abierto={abierta === ACCION.CONFIRMAR_CIERRE}
        alCerrar={cerrar}
        alConfirmar={(observacion) =>
          confirmar(
            () => confirmarResolucion(novedad.id, observacion),
            'Cierre confirmado. La novedad queda Cerrada.',
          )
        }
        enCurso={enCurso}
      />
      <HojaFallaPersiste
        abierta={abierta === ACCION.FALLA_PERSISTE}
        novedad={novedad}
        alCerrar={cerrar}
        alConfirmar={(observacion) =>
          confirmar(
            () => reportarFallaPersiste(novedad.id, observacion),
            `Novedad devuelta a ${novedad.area}. Vuelve a estar En atención.`,
          )
        }
        enCurso={enCurso}
      />
    </>
  ) : null

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
        {dialogos}
      </>
    )
  }

  // El mismo contenedor con o sin barra: así el aviso no se vuelve a montar (ni a anunciar)
  // cuando la novedad deja de estar resuelta. Sin barra, el aviso va suelto.
  return (
    <>
      <div
        data-barra-de-acciones={botones ? '' : undefined}
        className={
          botones
            ? 'sticky bottom-0 z-10 mt-auto flex gap-2.5 border-t border-borde bg-superficie px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] drop-shadow-[0_-4px_6px_rgb(0_0_0/0.06)]'
            : undefined
        }
      >
        {avisoTemporal(botones ? 'absolute inset-x-4 bottom-full mb-4' : AVISO_SUELTO)}
        {botones}
      </div>
      {dialogos}
    </>
  )
}
