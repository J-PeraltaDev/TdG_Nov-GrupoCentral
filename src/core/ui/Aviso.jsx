import { Icono } from './Icono.jsx'

/** @typedef {'neutro' | 'error' | 'advertencia' | 'info' | 'exito'} TipoAviso */

/** @type {Record<TipoAviso, { fondo: string, icono: string }>} */
const TIPOS = {
  neutro: { fondo: 'bg-gris-100', icono: 'text-texto-secundario' },
  error: { fondo: 'bg-error-suave', icono: 'text-error' },
  advertencia: { fondo: 'bg-advertencia-suave', icono: 'text-advertencia' },
  info: { fondo: 'bg-info-suave', icono: 'text-info' },
  exito: { fondo: 'bg-exito-suave', icono: 'text-exito' },
}

/**
 * Aviso dentro de una pantalla (Figma: «Aviso neutro», «Aviso error» y «Aviso advertencia»).
 * El tipo nunca se comunica solo con el color: siempre lleva ícono y texto.
 *
 * @param {object} props
 * @param {TipoAviso} [props.tipo]
 * @param {string} props.icono URL de un SVG de `iconos/`.
 * @param {string} [props.titulo]
 * @param {import('react').ReactNode} props.children
 * @param {import('react').ReactNode} [props.accion] Botón o enlace a la derecha.
 * @param {'alert' | 'status'} [props.role] `alert` para los errores que aparecen tras una acción.
 * @param {string} [props.id]
 * @param {string} [props.className]
 */
export function Aviso({
  tipo = 'neutro',
  icono,
  titulo,
  children,
  accion,
  role,
  id,
  className = '',
}) {
  const { fondo, icono: colorDelIcono } = TIPOS[tipo]

  return (
    <div
      id={id}
      role={role}
      data-aviso={tipo}
      className={`flex items-start gap-2.5 rounded-control px-3.5 py-3 ${fondo} ${className}`}
    >
      <Icono src={icono} tamano={20} className={colorDelIcono} />
      <div className="flex min-w-0 flex-1 flex-col gap-2 text-cuerpo-pequeno text-texto">
        {titulo ? <p className="text-etiqueta-fuerte">{titulo}</p> : null}
        <p>{children}</p>
      </div>
      {accion}
    </div>
  )
}
