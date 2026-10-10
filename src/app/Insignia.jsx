/**
 * Insignia de un elemento del menú (Figma 6:3343): cuántas solicitudes de recuperación esperan
 * un código. El número solo no dice de qué es: un lector de pantalla oye «2 solicitudes
 * pendientes» junto al nombre de la pantalla. Sin nada que contar, no se pinta.
 *
 * @param {object} props
 * @param {number | undefined} props.cantidad
 */
export function Insignia({ cantidad }) {
  if (!(cantidad > 0)) return null
  return (
    <span className="flex h-[18px] min-w-5 flex-none items-center justify-center rounded-full bg-error px-1.5 text-auxiliar-fuerte text-sobre-primario">
      <span aria-hidden="true">{cantidad > 99 ? '99+' : cantidad}</span>
      <span className="sr-only">
        , {cantidad === 1 ? '1 solicitud pendiente' : `${cantidad} solicitudes pendientes`}
      </span>
    </span>
  )
}
