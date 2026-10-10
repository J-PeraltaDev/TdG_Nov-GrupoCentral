import { Icono } from './Icono.jsx'

/**
 * Botón de solo ícono (Figma: las acciones de cada fila en 28 y 30, y las flechas de página).
 * Como no lleva texto, su nombre dice qué hace y sobre qué: «Editar Altamira», no «Editar».
 * Mide 48 px en el teléfono y 40 px en el escritorio.
 *
 * @param {object} props
 * @param {string} props.icono URL de un SVG de `iconos/`.
 * @param {string} props.nombre Nombre accesible; también sale al pasar el ratón.
 * @param {string} [props.color] Color del ícono, p. ej. `text-error`.
 * @param {string} [props.className]
 * @param {import('react').ButtonHTMLAttributes<HTMLButtonElement>} [props.resto]
 */
export function BotonDeIcono({ icono, nombre, color = 'text-texto', className = '', ...resto }) {
  return (
    <button
      type="button"
      aria-label={nombre}
      title={nombre}
      {...resto}
      className={`flex size-12 flex-none cursor-pointer items-center justify-center rounded-control hover:bg-gris-100 disabled:cursor-not-allowed disabled:text-deshabilitado disabled:hover:bg-transparent lg:size-10 ${color} ${className}`}
    >
      <Icono src={icono} tamano={20} />
    </button>
  )
}
