import { Icono } from './Icono.jsx'
import iconoDesplegar from './iconos/expand_more.svg'

/**
 * Filtro de una lista (Figma: «Razón social: Todas» y «Estado: Activas» en 30; «Rol» y
 * «Estado» en 28). Es el `<select>` del navegador con la forma de la pastilla de Figma; el
 * texto de cada opción dice qué filtra, porque no lleva etiqueta visible.
 *
 * @param {object} props
 * @param {string} props.nombre Nombre accesible, p. ej. «Estado».
 * @param {{ valor: string, nombre: string }[]} props.opciones
 * @param {string} props.value
 * @param {(valor: string) => void} props.alCambiar
 * @param {string} [props.icono] URL de un SVG de `iconos/`.
 * @param {string} [props.className]
 */
export function Filtro({ nombre, opciones, value, alCambiar, icono, className = '' }) {
  return (
    <div className={`relative min-w-0 ${className}`}>
      {icono ? (
        <Icono
          src={icono}
          tamano={18}
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-texto-secundario"
        />
      ) : null}
      <select
        aria-label={nombre}
        autoComplete="off"
        value={value}
        onChange={(evento) => alCambiar(evento.target.value)}
        className={`h-12 w-full cursor-pointer appearance-none truncate rounded-control bg-superficie pr-10 text-cuerpo-pequeno text-texto inset-ring inset-ring-borde lg:h-10 lg:w-auto lg:max-w-72 ${
          icono ? 'pl-[38px]' : 'pl-3'
        }`}
      >
        {opciones.map((opcion) => (
          <option key={opcion.valor} value={opcion.valor}>
            {opcion.nombre}
          </option>
        ))}
      </select>
      <Icono
        src={iconoDesplegar}
        tamano={20}
        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-texto-secundario"
      />
    </div>
  )
}
