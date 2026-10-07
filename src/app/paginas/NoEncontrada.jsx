import { Link } from 'react-router'

export function NoEncontrada() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 p-6">
      <h1 className="text-titulo">No encontramos esta página</h1>
      <p className="text-cuerpo text-texto-secundario">Revisa la dirección o vuelve al inicio.</p>
      <p>
        <Link
          to="/"
          className="inline-flex min-h-12 items-center text-etiqueta-fuerte text-primario underline hover:text-primario-hover"
        >
          Ir al inicio
        </Link>
      </p>
    </main>
  )
}
