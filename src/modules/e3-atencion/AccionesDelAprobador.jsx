import { ACCION } from '../../core/acciones/accionesDisponibles.js'
import { tomarNovedad } from '../../core/supabase/repositorios/novedades.js'
import { AvisoTemporal } from '../../core/ui/AvisoTemporal.jsx'
import { Boton } from '../../core/ui/Boton.jsx'
import iconoTomar from '../../core/ui/iconos/back_hand.svg'
import { useAccion } from './useAccion.js'

/*
 * Acciones del aprobador de área en el detalle de una novedad (RF-10 a RF-17). Figma: barra de
 * acciones de 13 (3:842) y 14 (3:1262), aviso de 13-B y de 14-C (3:1276).
 *
 * El mapa de acciones dice qué permite la Tabla 35; aquí se pintan las que ya tienen su
 * manejador. Se carga bajo demanda y solo para el aprobador: los demás roles no la descargan.
 */

/** Acciones que este módulo ya sabe ejecutar. Las demás llegan con su historia. */
const CONSTRUIDAS = [ACCION.TOMAR]

// Sobre la navegación inferior del teléfono cuando no hay barra de acciones; en el escritorio,
// abajo a la derecha.
const AVISO_SUELTO =
  'fixed inset-x-4 bottom-[calc(max(1.25rem,env(safe-area-inset-bottom))+4.75rem)] z-20 lg:inset-x-auto lg:right-8 lg:bottom-6 lg:w-96'

/**
 * @param {object} props
 * @param {{ id: string, estado: string }} props.novedad
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
  const disponibles = acciones.filter((accion) => CONSTRUIDAS.includes(accion))

  const botones = disponibles.includes(ACCION.TOMAR) ? (
    <Boton
      icono={iconoTomar}
      disabled={enCurso}
      onClick={() =>
        ejecutar(() => tomarNovedad(novedad.id), { exito: 'Novedad tomada. Ya está En atención.' })
      }
      className="w-full lg:w-auto"
    >
      {enCurso ? 'Tomando…' : 'Tomar para atención'}
    </Boton>
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
      </>
    )
  }

  // El mismo contenedor con o sin barra: así el aviso no se vuelve a montar (ni a anunciar)
  // cuando la novedad cambia de estado y se quedan sin acciones. Sin acciones no hay barra y
  // el aviso (por ejemplo, el de «novedad tomada») va suelto.
  return (
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
  )
}
