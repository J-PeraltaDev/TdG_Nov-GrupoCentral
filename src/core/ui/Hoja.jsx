import { useEffect, useId, useRef } from 'react'
import { Icono } from './Icono.jsx'

/**
 * Ícono del título de una hoja: un círculo de 40 px con el color de la acción (Figma 3:1472).
 *
 * @param {object} props
 * @param {string} props.src URL de un SVG de `iconos/`.
 * @param {string} props.className Colores del círculo y del ícono, p. ej. `bg-error-suave
 *   text-error`.
 */
export function IconoDeHoja({ src, className }) {
  return (
    <span
      className={`flex size-10 flex-none items-center justify-center rounded-full ${className}`}
    >
      <Icono src={src} tamano={20} />
    </span>
  )
}

/**
 * Hoja inferior (Figma 15, 16 y 17): una decisión que interrumpe la ruta ordinaria del caso y
 * exige un texto antes de confirmar. En el escritorio es un diálogo centrado con el mismo
 * contenido.
 *
 * Es un `<dialog>` abierto con `showModal()`: el navegador atrapa el foco, deja inerte el
 * resto de la página, la cierra con Escape y devuelve el foco a quien la abrió. El contenido
 * solo existe mientras está abierta, así que cada apertura empieza en blanco.
 *
 * @param {object} props
 * @param {boolean} props.abierta
 * @param {() => void} props.alCerrar Se llama al cerrarla por cualquier vía (Escape, fondo,
 *   botón «Cancelar» del contenido).
 * @param {import('react').ReactNode} props.titulo
 * @param {import('react').ReactNode} [props.icono] Va antes del título.
 * @param {import('react').ReactNode} props.children
 */
export function Hoja({ abierta, alCerrar, titulo, icono, children }) {
  const dialogo = useRef(null)
  const idDelTitulo = useId()

  useEffect(() => {
    const elemento = dialogo.current
    if (abierta && !elemento.open) elemento.showModal()
    else if (!abierta && elemento.open) elemento.close()
  }, [abierta])

  return (
    // El clic en el fondo es una comodidad del ratón: con el teclado se cierra con Escape o
    // con el botón «Cancelar» del contenido.
    // oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={dialogo}
      aria-labelledby={idDelTitulo}
      onClose={alCerrar}
      onClick={(evento) => {
        // El fondo (::backdrop) es el propio diálogo; el contenido va en un hijo.
        if (evento.target === evento.currentTarget) alCerrar()
      }}
      className="m-0 mt-auto max-h-[92dvh] w-full max-w-full overflow-y-auto overscroll-contain rounded-t-[20px] bg-superficie p-0 text-texto backdrop:bg-overlay/50 lg:m-auto lg:max-w-md lg:rounded-2xl"
    >
      {abierta ? (
        <div className="flex flex-col gap-4 px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] lg:p-6">
          <span
            aria-hidden="true"
            className="h-1 w-10 self-center rounded-full bg-gris-300 lg:hidden"
          />
          <h2 id={idDelTitulo} className="flex items-center gap-3 text-subtitulo text-texto">
            {icono}
            {titulo}
          </h2>
          {children}
        </div>
      ) : null}
    </dialog>
  )
}
