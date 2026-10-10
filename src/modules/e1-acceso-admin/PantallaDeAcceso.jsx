import { Link } from 'react-router'
import { useEnLinea } from '../../core/conexion/useEnLinea.js'
import { Conexion } from '../../core/ui/Conexion.jsx'
import { Icono } from '../../core/ui/Icono.jsx'
import iconoVolver from '../../core/ui/iconos/arrow_back.svg'

/**
 * Marco de las pantallas de recuperación, que no tienen sesión (Figma 02, 02-B, 03 y 03-B):
 * la barra superior con «volver», el título y el indicador de conexión, y el contenido en una
 * columna. Figma solo las dibuja en el teléfono: en el escritorio queda la misma columna
 * centrada del ingreso.
 *
 * @param {object} props
 * @param {string} props.titulo
 * @param {{ a: string, texto: string, estado?: object }} props.volver A dónde lleva la flecha.
 * @param {import('react').ReactNode} props.children
 */
export function PantallaDeAcceso({ titulo, volver, children }) {
  const enLinea = useEnLinea()

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 border-b border-borde bg-superficie">
        <div className="mx-auto flex h-15 w-full max-w-[26rem] items-center gap-1 pr-2 pl-1">
          <Link
            to={volver.a}
            state={volver.estado}
            aria-label={volver.texto}
            className="flex size-12 flex-none items-center justify-center rounded-control text-texto"
          >
            <Icono src={iconoVolver} tamano={24} />
          </Link>
          <h1 className="min-w-0 flex-1 truncate text-subtitulo text-texto">{titulo}</h1>
          <Conexion estado={enLinea ? 'en_linea' : 'sin_conexion'} className="flex-none" />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[26rem] flex-1 flex-col gap-5 px-4 pt-6 pb-8">
        {children}
      </main>
    </div>
  )
}
