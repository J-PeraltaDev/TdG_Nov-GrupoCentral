import { useState, useSyncExternalStore } from 'react'
import {
  esIos,
  estaInstalada,
  instalar,
  sePuedeInstalar,
  suscribirInstalacion,
} from '../../core/pwa/instalacion.js'
import { Aviso } from '../../core/ui/Aviso.jsx'
import iconoInstalar from '../../core/ui/iconos/install_mobile.svg'

/**
 * Invitación a instalar la aplicación (RNF-03 · pantalla 01, «Aviso neutro»). Donde el
 * navegador lo permite abre su diálogo de instalación; en iPhone y iPad muestra cómo
 * agregarla a la pantalla de inicio. No aparece si la aplicación ya está instalada.
 */
export function InvitacionAInstalar() {
  const instalable = useSyncExternalStore(suscribirInstalacion, sePuedeInstalar, () => false)
  const [verPasos, setVerPasos] = useState(false)

  if (estaInstalada()) return null

  const enIos = esIos()
  const accion =
    instalable || enIos ? (
      <button
        type="button"
        onClick={() => (instalable ? instalar() : setVerPasos(true))}
        className="-my-3.5 -mr-2 inline-flex min-h-12 cursor-pointer items-center px-2 text-etiqueta-fuerte text-texto-secundario"
      >
        Instalar
      </button>
    ) : null

  return (
    <div className="flex w-full flex-col gap-2">
      <Aviso icono={iconoInstalar} accion={accion}>
        Instala la app en este teléfono para registrar novedades aunque no haya internet
      </Aviso>
      {verPasos ? (
        <p role="status" className="px-3.5 text-cuerpo-pequeno text-texto-secundario">
          En Safari, toca el botón Compartir y elige «Agregar a inicio».
        </p>
      ) : null}
    </div>
  )
}
