import { Icono } from './Icono.jsx'
import iconoError from './iconos/error.svg'

/**
 * Mensaje de error bajo un campo (Figma: «Ayuda» en su variante de error, como en 30-B). El
 * campo lo señala con `aria-describedby`; lleva ícono, no solo color.
 *
 * @param {object} props
 * @param {string} props.id El que referencia el campo.
 * @param {import('react').ReactNode} props.children
 * @param {string} [props.className]
 */
export function ErrorDeCampo({ id, children, className = '' }) {
  return (
    <p id={id} className={`flex items-start gap-1 text-auxiliar text-error ${className}`}>
      <Icono src={iconoError} tamano={16} className="flex-none" />
      {children}
    </p>
  )
}
