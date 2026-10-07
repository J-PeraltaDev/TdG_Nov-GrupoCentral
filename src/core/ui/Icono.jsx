/**
 * Ícono decorativo a partir de un SVG local de `src/core/ui/iconos/`.
 * Toma el color del texto que lo rodea; el significado lo da siempre la etiqueta vecina,
 * por eso va con `aria-hidden`.
 *
 * @param {object} props
 * @param {string} props.src URL del SVG (import del archivo).
 * @param {number} [props.tamano] Lado en px.
 * @param {string} [props.className]
 */
export function Icono({ src, tamano = 20, className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={`icono ${className}`}
      style={{ '--icono-src': `url("${src}")`, width: tamano, height: tamano }}
    />
  )
}
