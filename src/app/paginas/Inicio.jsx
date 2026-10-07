import { Link } from 'react-router'
import { useEnLinea } from '../../core/conexion/useEnLinea.js'
import { Conexion } from '../../core/ui/Conexion.jsx'

const hayVariablesDeSupabase = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
)

/**
 * App de prueba del Sprint 0: confirma que el despliegue, los tokens, la PWA y las variables
 * de entorno funcionan. En el Sprint 1 la reemplaza el ingreso (pantalla 01).
 */
export function Inicio() {
  const enLinea = useEnLinea()

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 p-6">
      <header className="flex items-center justify-between gap-4">
        <p className="text-etiqueta-fuerte text-primario">Grupo Central</p>
        <Conexion estado={enLinea ? 'en_linea' : 'sin_conexion'} />
      </header>

      <section className="flex flex-col gap-2">
        <h1 className="text-display">Novedades</h1>
        <p className="text-cuerpo text-texto-secundario">
          Estamos construyendo la aplicación. El ingreso llega en el Sprint 1.
        </p>
      </section>

      <section
        aria-labelledby="titulo-entorno"
        className="flex flex-col gap-3 rounded-control bg-superficie p-4 inset-ring inset-ring-borde"
      >
        <h2 id="titulo-entorno" className="text-subtitulo">
          Entorno
        </h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-cuerpo-pequeno">
          <dt className="text-texto-secundario">Sprint</dt>
          <dd>0 · Entorno listo para construir</dd>
          <dt className="text-texto-secundario">Modo</dt>
          <dd>{import.meta.env.MODE}</dd>
          <dt className="text-texto-secundario">Supabase</dt>
          <dd>{hayVariablesDeSupabase ? 'Variables configuradas' : 'Faltan las variables'}</dd>
        </dl>
      </section>

      {import.meta.env.DEV ? (
        <p>
          <Link
            to="/_dev/componentes"
            className="inline-flex min-h-12 items-center text-etiqueta-fuerte text-primario underline hover:text-primario-hover"
          >
            Ver los componentes base
          </Link>
        </p>
      ) : null}
    </main>
  )
}
