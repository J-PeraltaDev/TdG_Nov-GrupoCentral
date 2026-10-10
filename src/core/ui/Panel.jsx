import { useEffect, useId, useRef } from 'react'
import { BotonDeIcono } from './BotonDeIcono.jsx'
import iconoCerrar from './iconos/close.svg'

/**
 * Panel lateral (Figma 29 y 29-B: «Nuevo usuario»): un formulario largo que se abre sobre la
 * lista sin perderla de vista. En el escritorio entra por la derecha, a todo el alto; en el
 * teléfono ocupa la pantalla.
 *
 * Es un `<dialog>` abierto con `showModal()`, como la `Hoja` y el `Dialogo`: el navegador
 * atrapa el foco, deja inerte el resto de la página, lo cierra con Escape y devuelve el foco
 * a quien lo abrió. El contenido solo existe mientras está abierto, así que cada apertura
 * empieza en blanco. A diferencia de ellos, tocar el fondo no lo cierra: un toque fuera no
 * debe costar un formulario a medio llenar.
 *
 * @param {object} props
 * @param {boolean} props.abierto
 * @param {() => void} props.alCerrar Se llama al cerrarlo por cualquier vía (Escape, la equis o
 *   el botón «Cancelar» del contenido).
 * @param {import('react').ReactNode} props.titulo
 * @param {import('react').ReactNode} props.children
 */
export function Panel({ abierto, alCerrar, titulo, children }) {
  const dialogo = useRef(null)
  const idDelTitulo = useId()

  useEffect(() => {
    const elemento = dialogo.current
    if (abierto && !elemento.open) elemento.showModal()
    else if (!abierto && elemento.open) elemento.close()
  }, [abierto])

  return (
    <dialog
      ref={dialogo}
      aria-labelledby={idDelTitulo}
      onClose={alCerrar}
      className="m-0 h-dvh max-h-none w-full max-w-full overflow-y-auto overscroll-contain bg-superficie p-0 text-texto backdrop:bg-overlay/50 lg:ml-auto lg:w-[480px]"
    >
      {abierto ? (
        <div className="flex min-h-full flex-col gap-5 px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] lg:px-6 lg:pt-5 lg:pb-6">
          <div className="flex items-center justify-between gap-3">
            <h2 id={idDelTitulo} className="text-titulo text-texto">
              {titulo}
            </h2>
            <BotonDeIcono
              icono={iconoCerrar}
              nombre="Cerrar"
              onClick={alCerrar}
              className="-mr-2"
            />
          </div>
          {children}
        </div>
      ) : null}
    </dialog>
  )
}
