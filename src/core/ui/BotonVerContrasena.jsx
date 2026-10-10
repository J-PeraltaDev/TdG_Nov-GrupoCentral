import { Icono } from './Icono.jsx'
import iconoVer from './iconos/visibility.svg'
import iconoOcultar from './iconos/visibility_off.svg'

/**
 * El ojo que muestra u oculta lo escrito en un campo de contraseña (Figma 01 y 03). Va en la
 * `accion` de un `CampoTexto`: el ícono mide 20 px y su área táctil, 48 px.
 *
 * @param {object} props
 * @param {boolean} props.visible Si la contraseña se está mostrando.
 * @param {(visible: boolean) => void} props.alCambiar
 */
export function BotonVerContrasena({ visible, alCambiar }) {
  return (
    <button
      type="button"
      onClick={() => alCambiar(!visible)}
      aria-label={visible ? 'Ocultar la contraseña' : 'Mostrar la contraseña'}
      aria-pressed={visible}
      className="-my-3.5 -mr-3.5 flex size-12 flex-none cursor-pointer items-center justify-center rounded-control text-texto-secundario"
    >
      <Icono src={visible ? iconoOcultar : iconoVer} tamano={20} />
    </button>
  )
}
