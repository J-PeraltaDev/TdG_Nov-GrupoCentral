import { useRegisterSW } from 'virtual:pwa-register/react'
import { Boton } from '../core/ui/Boton.jsx'

const UNA_HORA = 60 * 60 * 1000

/** Con la app abierta por horas, busca cada tanto si se publicó una versión nueva. */
function revisarCadaHora(_url, registro) {
  if (!registro) return
  setInterval(() => {
    if (navigator.onLine) registro.update().catch(() => {})
  }, UNA_HORA)
}

/**
 * Registra el service worker (C-04) y avisa cuando hay una versión nueva publicada.
 * La versión nueva solo se activa cuando la persona pulsa «Actualizar»
 * (`registerType: 'prompt'`), para no recargar la app en medio de un registro.
 */
export function AvisoNuevaVersion() {
  const {
    needRefresh: [hayVersionNueva, setHayVersionNueva],
    updateServiceWorker,
  } = useRegisterSW({ onRegisteredSW: revisarCadaHora })

  return (
    <div role="status">
      {hayVersionNueva ? (
        <div className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-md flex-col gap-3 rounded-control bg-superficie p-4 shadow-lg inset-ring inset-ring-borde">
          <p className="text-cuerpo-pequeno text-texto">
            Hay una versión nueva de la aplicación. Actualiza para usarla.
          </p>
          <div className="flex justify-end gap-2">
            <Boton tipo="texto" onClick={() => setHayVersionNueva(false)}>
              Ahora no
            </Boton>
            <Boton onClick={() => updateServiceWorker(true)}>Actualizar</Boton>
          </div>
        </div>
      ) : null}
    </div>
  )
}
