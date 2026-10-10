import { useEffect, useId, useRef } from 'react'

/**
 * Diálogo de confirmación (Figma 09-C, 28-B, 30 y 32): una pregunta que interrumpe para
 * confirmar algo que no se puede deshacer. A diferencia de la `Hoja`, va centrado también en
 * el teléfono.
 *
 * Es un `<dialog>` abierto con `showModal()`: el navegador atrapa el foco, deja inerte el
 * resto de la página, lo cierra con Escape y devuelve el foco a quien lo abrió. El contenido
 * solo existe mientras está abierto, así que cada apertura empieza en blanco.
 *
 * @param {object} props
 * @param {boolean} props.abierto
 * @param {() => void} props.alCerrar Se llama al cerrarlo por cualquier vía (Escape, fondo,
 *   botón «Cancelar» del contenido).
 * @param {import('react').ReactNode} props.titulo La pregunta.
 * @param {import('react').ReactNode} [props.descripcion] Qué pasa si se confirma.
 * @param {import('react').ReactNode} [props.icono] Va sobre el título (un `IconoDeHoja`).
 * @param {import('react').ReactNode} props.children Los campos, si los hay, y los botones.
 */
export function Dialogo({ abierto, alCerrar, titulo, descripcion, icono, children }) {
  const dialogo = useRef(null)
  const idDelTitulo = useId()
  const idDeLaDescripcion = useId()

  useEffect(() => {
    const elemento = dialogo.current
    if (abierto && !elemento.open) elemento.showModal()
    else if (!abierto && elemento.open) elemento.close()
  }, [abierto])

  return (
    // El clic en el fondo es una comodidad del ratón: con el teclado se cierra con Escape o
    // con el botón «Cancelar» del contenido.
    // oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={dialogo}
      aria-labelledby={idDelTitulo}
      aria-describedby={abierto && descripcion ? idDeLaDescripcion : undefined}
      onClose={alCerrar}
      onClick={(evento) => {
        // El fondo (::backdrop) es el propio diálogo; el contenido va en un hijo.
        if (evento.target === evento.currentTarget) alCerrar()
      }}
      className="m-auto max-h-[92dvh] w-[calc(100%-2rem)] max-w-sm overflow-y-auto overscroll-contain rounded-2xl bg-superficie p-0 text-texto backdrop:bg-overlay/50 lg:max-w-md"
    >
      {abierto ? (
        <div className="flex flex-col gap-4 p-6">
          <div className="flex flex-col gap-3">
            {icono}
            <h2 id={idDelTitulo} className="text-subtitulo text-texto">
              {titulo}
            </h2>
            {descripcion ? (
              <p id={idDeLaDescripcion} className="text-cuerpo text-texto-secundario">
                {descripcion}
              </p>
            ) : null}
          </div>
          {children}
        </div>
      ) : null}
    </dialog>
  )
}
