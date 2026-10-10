import { useId, useState } from 'react'
import { DIGITOS_DEL_CODIGO, soloDigitos } from './codigoTemporal.js'

const POSICIONES = Array.from({ length: DIGITOS_DEL_CODIGO }, (_, posicion) => posicion)

/**
 * Campo del código temporal (Figma 03 y 03-B: «Campo Código», seis casillas).
 *
 * Es un solo campo de texto con el aspecto de seis casillas, no seis campos: así se puede
 * pegar el código completo, el teclado del teléfono lo ofrece si llegó por un mensaje, y un
 * lector de pantalla anuncia un campo con su etiqueta en lugar de seis sin nombre. El campo
 * real cubre las casillas y es transparente; las casillas solo pintan lo escrito.
 *
 * @param {object} props
 * @param {string} props.etiqueta
 * @param {string} props.valor Solo dígitos.
 * @param {(valor: string) => void} props.alCambiar
 * @param {boolean} [props.conError]
 * @param {string} [props.descritoPor] `id` del mensaje que explica el error.
 * @param {import('react').Ref<HTMLInputElement>} [props.ref]
 */
export function CampoCodigo({ etiqueta, valor, alCambiar, conError = false, descritoPor, ref }) {
  const id = useId()
  const [conFoco, setConFoco] = useState(false)
  // La casilla donde cae el siguiente dígito; con las seis llenas, la última.
  const activa = Math.min(valor.length, DIGITOS_DEL_CODIGO - 1)

  /** El cursor no se ve: se deja siempre al final, que es donde se escribe y se borra. */
  function alFinal(evento) {
    const campo = evento.currentTarget
    const fin = campo.value.length
    if (campo.selectionStart !== fin || campo.selectionEnd !== fin) {
      campo.setSelectionRange(fin, fin)
    }
  }

  return (
    <div className="flex w-full flex-col gap-1.5">
      <label htmlFor={id} className="text-etiqueta text-texto">
        {etiqueta}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={id}
          name="codigo"
          type="text"
          value={valor}
          onChange={(evento) => alCambiar(soloDigitos(evento.target.value))}
          onFocus={(evento) => {
            setConFoco(true)
            alFinal(evento)
          }}
          onBlur={() => setConFoco(false)}
          onSelect={alFinal}
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="one-time-code"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={conError || undefined}
          aria-describedby={descritoPor}
          // 16 px: con menos, Safari acerca la página al tocar el campo.
          className="absolute inset-0 z-10 size-full cursor-text rounded-control bg-transparent text-cuerpo text-transparent caret-transparent outline-none selection:bg-transparent"
        />
        <div aria-hidden="true" className="grid grid-cols-6 gap-2">
          {POSICIONES.map((posicion) => (
            <span
              key={posicion}
              data-casilla
              className={`flex h-14 items-center justify-center rounded-control bg-superficie text-titulo text-texto ${
                conError ? 'inset-ring-2 inset-ring-error' : 'inset-ring inset-ring-borde'
              } ${
                conFoco && posicion === activa
                  ? conError
                    ? 'outline-2 outline-offset-2 outline-primario'
                    : 'inset-ring-2 inset-ring-primario'
                  : ''
              }`}
            >
              {valor[posicion] ?? ''}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
