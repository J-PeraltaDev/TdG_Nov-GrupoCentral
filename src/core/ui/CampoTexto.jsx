import { useId } from 'react'
import { Icono } from './Icono.jsx'

/**
 * Campo de texto con etiqueta (Figma: «Campo» con su «Caja»). El borde va como sombra
 * interior para que el campo mida lo mismo en reposo, con foco y con error.
 *
 * @param {object} props
 * @param {string} props.etiqueta
 * @param {string} [props.icono] URL de un SVG de `iconos/`, a la izquierda.
 * @param {boolean} [props.conError] Marca el campo como inválido.
 * @param {string} [props.descritoPor] `id` del mensaje que explica el error.
 * @param {import('react').ReactNode} [props.accion] Botón a la derecha, dentro de la caja.
 * @param {import('react').Ref<HTMLInputElement>} [props.ref]
 * @param {string} [props.className]
 * @param {import('react').InputHTMLAttributes<HTMLInputElement>} [props.resto]
 */
export function CampoTexto({
  etiqueta,
  icono,
  conError = false,
  descritoPor,
  accion,
  ref,
  className = '',
  ...resto
}) {
  const id = useId()

  return (
    <div className={`flex w-full flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-etiqueta text-texto">
        {etiqueta}
      </label>
      <div
        className={`flex items-center gap-2 rounded-control bg-superficie px-3.5 py-[13px] ${
          conError
            ? // El error se sigue viendo con el foco: el foco va como contorno exterior.
              'inset-ring-2 inset-ring-error focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primario'
            : 'inset-ring inset-ring-borde focus-within:inset-ring-2 focus-within:inset-ring-primario'
        }`}
      >
        {icono ? <Icono src={icono} tamano={20} className="text-texto-secundario" /> : null}
        <input
          {...resto}
          ref={ref}
          id={id}
          aria-invalid={conError || undefined}
          aria-describedby={descritoPor}
          className="min-w-0 flex-1 bg-transparent text-cuerpo text-texto outline-none placeholder:text-texto-secundario"
        />
        {accion}
      </div>
    </div>
  )
}
