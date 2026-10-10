import { useId } from 'react'
import { ErrorDeCampo } from './ErrorDeCampo.jsx'
import { Icono } from './Icono.jsx'
import iconoDesplegar from './iconos/expand_more.svg'

/**
 * Lista desplegable con etiqueta (Figma: «Campo» con su «Caja» y el ícono de desplegar, como
 * «Razón social» en 30-B). Es el `<select>` del navegador: en el teléfono abre el selector
 * del sistema. Mide lo mismo que `CampoTexto`.
 *
 * @param {object} props
 * @param {string} props.etiqueta
 * @param {{ valor: string, nombre: string }[]} props.opciones
 * @param {string} props.value `''` mientras no se ha elegido.
 * @param {string} [props.vacio] Texto de la opción sin valor, p. ej. «Elige la razón social».
 * @param {boolean} [props.obligatorio] Agrega el asterisco y marca el campo como requerido.
 * @param {string} [props.icono] URL de un SVG de `iconos/`, a la izquierda.
 * @param {string | null} [props.error] Mensaje de error, bajo el campo.
 * @param {import('react').Ref<HTMLSelectElement>} [props.ref]
 * @param {string} [props.className]
 * @param {import('react').SelectHTMLAttributes<HTMLSelectElement>} [props.resto]
 */
export function CampoDeSeleccion({
  etiqueta,
  opciones,
  value,
  vacio = 'Elige una opción',
  obligatorio = false,
  icono,
  error = null,
  ref,
  className = '',
  ...resto
}) {
  const id = useId()
  const idDeError = `${id}-error`

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
      <div className="relative">
        {icono ? (
          <Icono
            src={icono}
            tamano={20}
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-texto-secundario"
          />
        ) : null}
        <select
          {...resto}
          ref={ref}
          id={id}
          value={value}
          required={obligatorio || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? idDeError : undefined}
          className={`h-[50px] w-full cursor-pointer appearance-none truncate rounded-control bg-superficie pr-11 text-cuerpo ${
            icono ? 'pl-[46px]' : 'pl-3.5'
          } ${value === '' ? 'text-texto-secundario' : 'text-texto'} ${
            error
              ? 'inset-ring-2 inset-ring-error'
              : 'inset-ring inset-ring-borde focus-visible:inset-ring-2 focus-visible:inset-ring-primario focus-visible:outline-none'
          }`}
        >
          <option value="">{vacio}</option>
          {opciones.map(({ valor, nombre }) => (
            <option key={valor} value={valor}>
              {nombre}
            </option>
          ))}
        </select>
        <Icono
          src={iconoDesplegar}
          tamano={20}
          className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-texto-secundario"
        />
      </div>
      {error ? <ErrorDeCampo id={idDeError}>{error}</ErrorDeCampo> : null}
    </div>
  )
}
