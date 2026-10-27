import { useEffect, useRef, useState } from 'react'
import { Icono } from '../../core/ui/Icono.jsx'
import iconoAnterior from '../../core/ui/iconos/chevron_left.svg'
import iconoSiguiente from '../../core/ui/iconos/chevron_right.svg'
import iconoCerrar from '../../core/ui/iconos/close.svg'
import iconoAmpliar from '../../core/ui/iconos/zoom_in.svg'
import iconoReducir from '../../core/ui/iconos/zoom_out.svg'

const BOTON =
  'flex size-12 flex-none cursor-pointer items-center justify-center rounded-full text-sobre-primario hover:bg-sobre-primario/10'

/**
 * Visor de las fotos de una novedad (cambio 41): la foto a toda la pantalla, sin salir de la
 * aplicación, con «anterior», «siguiente» (también con las flechas del teclado) y el zoom (el
 * botón o un toque en la foto; en el teléfono, además, pellizcar). Antes la foto se abría en otra
 * pestaña con su URL firmada a la vista.
 *
 * Es un `<dialog>` abierto con `showModal()`, como `Dialogo`: atrapa el foco, se cierra con
 * Escape y devuelve el foco a la miniatura.
 *
 * @param {object} props
 * @param {{ id: string, url: string | null }[]} props.fotos
 * @param {number | null} props.indice La que se ve; `null`, cerrado.
 * @param {(indice: number) => void} props.alCambiar
 * @param {() => void} props.alCerrar
 * @param {(indice: number) => string} props.nombre «Foto 1 de NOV-0145».
 */
export function VisorDeFotos({ fotos, indice, alCambiar, alCerrar, nombre }) {
  const dialogo = useRef(/** @type {HTMLDialogElement | null} */ (null))
  // Cada foto empieza ajustada a la pantalla: el zoom es de la foto, no del visor.
  const [ampliada, setAmpliada] = useState(/** @type {string | null} */ (null))
  const abierto = indice !== null
  const foto = abierto ? fotos[indice] : null

  useEffect(() => {
    const elemento = dialogo.current
    if (abierto && !elemento.open) elemento.showModal()
    else if (!abierto && elemento.open) elemento.close()
  }, [abierto])

  const esAmpliada = foto !== null && ampliada === foto.id
  // Da la vuelta: así ningún botón se deshabilita con el foco encima (lo perdería el diálogo).
  const anterior = () => alCambiar((indice - 1 + fotos.length) % fotos.length)
  const siguiente = () => alCambiar((indice + 1) % fotos.length)

  /** @param {import('react').KeyboardEvent} evento */
  function alTeclear(evento) {
    // Ampliada, las flechas desplazan la foto.
    if (esAmpliada || fotos.length < 2) return
    if (evento.key === 'ArrowLeft') anterior()
    else if (evento.key === 'ArrowRight') siguiente()
  }

  return (
    // Las flechas del teclado son atajos: los botones hacen lo mismo y reciben el foco.
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={dialogo}
      aria-label={foto ? nombre(indice) : undefined}
      onClose={alCerrar}
      onKeyDown={alTeclear}
      className="m-0 h-dvh max-h-none w-full max-w-full bg-overlay p-0 text-sobre-primario backdrop:bg-overlay"
    >
      {foto ? (
        <div className="flex size-full flex-col">
          <div className="flex flex-none items-center gap-1 py-1 pr-1 pl-4">
            <p aria-live="polite" className="min-w-0 flex-1 truncate text-etiqueta-fuerte">
              {fotos.length > 1 ? `Foto ${indice + 1} de ${fotos.length}` : nombre(indice)}
            </p>
            {foto.url ? (
              <button
                type="button"
                aria-pressed={esAmpliada}
                aria-label="Ampliar"
                title="Ampliar"
                onClick={() => setAmpliada(esAmpliada ? null : foto.id)}
                className={BOTON}
              >
                <Icono src={esAmpliada ? iconoReducir : iconoAmpliar} tamano={24} />
              </button>
            ) : null}
            <button
              type="button"
              aria-label="Cerrar"
              title="Cerrar"
              onClick={alCerrar}
              className={BOTON}
            >
              <Icono src={iconoCerrar} tamano={24} />
            </button>
          </div>

          <div className="relative min-h-0 flex-1">
            {/* Ampliada se desplaza: con el teclado también, por eso recibe el foco. */}
            <div
              role={esAmpliada ? 'region' : undefined}
              aria-label={esAmpliada ? 'Foto ampliada' : undefined}
              tabIndex={esAmpliada ? 0 : undefined}
              className={`size-full overflow-auto overscroll-contain outline-primario focus-visible:outline-2 focus-visible:-outline-offset-2 ${
                esAmpliada ? '' : 'flex items-center justify-center'
              }`}
            >
              {foto.url ? (
                // El zoom también con un toque en la foto: el botón de arriba es el del teclado.
                // oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
                <img
                  src={foto.url}
                  alt={nombre(indice)}
                  onClick={() => setAmpliada(esAmpliada ? null : foto.id)}
                  className={
                    esAmpliada
                      ? 'max-w-none w-[200%] cursor-zoom-out lg:w-auto'
                      : 'max-h-full max-w-full cursor-zoom-in object-contain'
                  }
                />
              ) : (
                <p className="px-6 text-center text-cuerpo">La foto necesita conexión.</p>
              )}
            </div>

            {fotos.length > 1 ? (
              <>
                <button
                  type="button"
                  aria-label="Foto anterior"
                  title="Foto anterior"
                  onClick={anterior}
                  className={`${BOTON} absolute top-1/2 left-2 -translate-y-1/2 bg-overlay/60`}
                >
                  <Icono src={iconoAnterior} tamano={28} />
                </button>
                <button
                  type="button"
                  aria-label="Foto siguiente"
                  title="Foto siguiente"
                  onClick={siguiente}
                  className={`${BOTON} absolute top-1/2 right-2 -translate-y-1/2 bg-overlay/60`}
                >
                  <Icono src={iconoSiguiente} tamano={28} />
                </button>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </dialog>
  )
}
