import { useId } from 'react'
import { Icono } from './Icono.jsx'
import iconoError from './iconos/error.svg'

/**
 * Campo de varias líneas con etiqueta, ayuda y contador (Figma: «Campo» con su «Caja» y su
 * «Ayuda», como el motivo de la hoja 16). El borde va como sombra interior para que el campo
 * mida lo mismo en reposo, con foco y con error.
 *
 * Es un campo controlado: `value` siempre es un texto.
 *
 * @param {object} props
 * @param {string} props.etiqueta
 * @param {string} props.value
 * @param {boolean} [props.obligatorio] Agrega el asterisco y marca el campo como requerido.
 * @param {number} [props.maximo] Máximo de caracteres; muestra el contador «45/500».
 * @param {string} [props.ayuda] Texto de apoyo bajo el campo.
 * @param {string | null} [props.error] Mensaje de error; reemplaza a la ayuda.
 * @param {import('react').Ref<HTMLTextAreaElement>} [props.ref]
 * @param {string} [props.className]
 * @param {import('react').TextareaHTMLAttributes<HTMLTextAreaElement>} [props.resto]
 */
export function AreaDeTexto({
  etiqueta,
  value,
  obligatorio = false,
  maximo,
  ayuda,
  error = null,
  ref,
  className = '',
  ...resto
}) {
  const id = useId()
  const idDeAyuda = `${id}-ayuda`
  const idDeError = `${id}-error`
  const descritoPor = error ? idDeError : ayuda ? idDeAyuda : undefined

  return (
    <div className={`flex w-full flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-etiqueta text-texto">
        {etiqueta}
        {obligatorio ? (
          <span aria-hidden="true" className="ml-1 text-error">
            *
          </span>
        ) : null}
      </label>
      <textarea
        rows={2}
        {...resto}
        ref={ref}
        id={id}
        value={value}
        required={obligatorio || undefined}
        maxLength={maximo}
        aria-invalid={error ? true : undefined}
        aria-describedby={descritoPor}
        className={`block min-h-18 w-full resize-y rounded-control bg-superficie px-[15px] py-[13px] text-cuerpo text-texto placeholder:text-texto-secundario ${
          error
            ? 'inset-ring-2 inset-ring-error'
            : 'inset-ring inset-ring-borde focus-visible:inset-ring-2 focus-visible:inset-ring-primario focus-visible:outline-none'
        }`}
      />
      {error || ayuda || maximo ? (
        <p className="flex items-start gap-2 text-auxiliar text-texto-secundario">
          {error ? (
            <span id={idDeError} className="flex min-w-0 flex-1 items-start gap-1 text-error">
              <Icono src={iconoError} tamano={16} className="flex-none" />
              {error}
            </span>
          ) : (
            <span id={idDeAyuda} className="min-w-0 flex-1">
              {ayuda}
            </span>
          )}
          {maximo ? (
            <span className="flex-none">
              <span className="sr-only">Caracteres: </span>
              {value.length}/{maximo}
            </span>
          ) : null}
        </p>
      ) : null}
    </div>
  )
}
