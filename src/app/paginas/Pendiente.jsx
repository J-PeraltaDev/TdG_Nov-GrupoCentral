import { Link } from 'react-router'

/**
 * Marcador de una pantalla que todavía no se construye: dice en qué sprint llega.
 *
 * @param {object} props
 * @param {string} props.titulo
 * @param {string} props.sprint Por ejemplo, «Sprint 2».
 * @param {string} [props.detalle]
 * @param {{ a: string, texto: string }} [props.salida] Enlace para seguir.
 */
export function Pendiente({ titulo, sprint, detalle, salida }) {
  return (
    <section className="mx-auto flex w-full max-w-xl flex-col gap-3 p-4 lg:p-8">
      <h1 className="text-titulo text-texto">{titulo}</h1>
      <p className="text-cuerpo text-texto-secundario">
        Esta pantalla llega en el {sprint}.{detalle ? ` ${detalle}` : ''}
      </p>
      {salida ? (
        <p>
          <Link
            to={salida.a}
            className="inline-flex min-h-12 items-center text-etiqueta-fuerte text-primario underline hover:text-primario-hover"
          >
            {salida.texto}
          </Link>
        </p>
      ) : null}
    </section>
  )
}
