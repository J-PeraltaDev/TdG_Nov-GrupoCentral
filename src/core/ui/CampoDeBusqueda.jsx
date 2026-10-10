import { Icono } from './Icono.jsx'
import iconoBuscar from './iconos/search.svg'

/**
 * Campo de búsqueda de una lista (Figma: «Buscar finca» en 30 y «Buscar por nombre o correo»
 * en 28). No lleva etiqueta visible: su nombre es el mismo texto de ayuda.
 *
 * @param {object} props
 * @param {string} props.nombre Nombre accesible y texto de ayuda.
 * @param {string} props.value
 * @param {(texto: string) => void} props.alCambiar
 * @param {string} [props.className]
 */
export function CampoDeBusqueda({ nombre, value, alCambiar, className = '' }) {
  return (
    <div
      className={`flex h-12 items-center gap-2 rounded-control bg-superficie px-3.5 inset-ring inset-ring-borde focus-within:inset-ring-2 focus-within:inset-ring-primario lg:h-10 lg:w-80 ${className}`}
    >
      <Icono src={iconoBuscar} tamano={20} className="flex-none text-texto-secundario" />
      <input
        type="search"
        name="buscar"
        aria-label={nombre}
        placeholder={nombre}
        autoComplete="off"
        value={value}
        onChange={(evento) => alCambiar(evento.target.value)}
        className="min-w-0 flex-1 bg-transparent text-cuerpo-pequeno text-texto outline-none placeholder:text-texto-secundario"
      />
    </div>
  )
}
