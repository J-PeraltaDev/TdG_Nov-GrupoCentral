import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { useEnLinea } from '../core/conexion/useEnLinea.js'
import { useSesion } from '../core/sesion/ContextoSesion.js'
import { descripcionDelPerfil, iniciales, rutaDeOrigen } from '../core/sesion/roles.js'
import { Conexion } from '../core/ui/Conexion.jsx'
import { Icono } from '../core/ui/Icono.jsx'
import iconoMarca from '../core/ui/iconos/eco.svg'
import iconoSalir from '../core/ui/iconos/logout.svg'
import iconoAvisos from '../core/ui/iconos/notifications.svg'
import iconoBuscar from '../core/ui/iconos/search.svg'
import { Insignia } from './Insignia.jsx'
import { MENU } from './menu.js'
import { useInsignias } from './useInsignias.js'

/*
 * Marco de las pantallas con sesión (SDD 5.2, «Navegación por rol»):
 *   teléfono    barra superior + contenido + barra inferior de cuatro opciones;
 *   escritorio  barra lateral con el menú del rol + barra superior con el buscador por
 *               código, el indicador de conexión, los avisos y la cuenta.
 * Figma: 2:43 y 2:137 (teléfono), 3:588 y 3:616 (escritorio).
 */

function Avatar({ nombre }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-9 flex-none items-center justify-center rounded-full bg-primario-contenedor text-auxiliar-fuerte text-primario"
    >
      {iniciales(nombre)}
    </span>
  )
}

function Campana() {
  return (
    <Link
      to="/avisos"
      aria-label="Avisos"
      className="flex size-12 flex-none items-center justify-center rounded-control text-texto lg:size-10"
    >
      <Icono src={iconoAvisos} tamano={24} />
    </Link>
  )
}

/** Lo que dice la barra superior del teléfono en cada pantalla. */
function titulosDelTelefono(perfil, ruta) {
  // La bandeja se presenta con el nombre del área (Figma 3:302).
  if (ruta === '/bandeja' && perfil.area) {
    return { titulo: `Bandeja · ${perfil.area.nombre}`, subtitulo: null }
  }
  // El reportante ve su finca y su razón social; los demás roles, su nombre y su rol.
  return {
    titulo: perfil.finca?.nombre ?? perfil.nombre,
    subtitulo: perfil.finca?.razon_social?.nombre ?? descripcionDelPerfil(perfil),
  }
}

function BarraSuperiorDelTelefono({ perfil, enLinea, ruta }) {
  const { titulo, subtitulo } = titulosDelTelefono(perfil, ruta)

  return (
    <header className="sticky top-0 z-10 flex h-15 items-center gap-1 border-b border-borde bg-superficie pr-1 pl-4 lg:hidden">
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Un título de una sola línea baja a 16 px en los teléfonos de menos de 390 px:
            a 360 px «Bandeja · Mantenimiento» no cabe junto a la conexión y la campana. */}
        <p
          className={`truncate text-texto ${
            subtitulo ? 'text-subtitulo' : 'text-cuerpo-fuerte min-[390px]:text-subtitulo'
          }`}
        >
          {titulo}
        </p>
        {subtitulo ? (
          <p className="truncate text-auxiliar text-texto-secundario">{subtitulo}</p>
        ) : null}
      </div>
      <Conexion estado={enLinea ? 'en_linea' : 'sin_conexion'} className="flex-none" />
      <Campana />
    </header>
  )
}

function BarraSuperiorDelEscritorio({ perfil, enLinea }) {
  return (
    <header className="sticky top-0 z-10 hidden items-center gap-3 border-b border-borde bg-superficie px-8 py-3 lg:flex">
      {/* El buscador por código llega con el historial (RF-19, Sprint 5). */}
      <label className="flex w-[22.5rem] items-center gap-2 rounded-control bg-fondo px-3.5 py-2.5 text-texto-secundario inset-ring inset-ring-borde">
        <Icono src={iconoBuscar} tamano={20} />
        <span className="sr-only">Buscar por código</span>
        <input
          type="search"
          name="codigo"
          disabled
          placeholder="Buscar por código (NOV-…)"
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-cuerpo-pequeno outline-none placeholder:text-texto-secundario"
        />
      </label>
      <span className="flex-1" />
      <Conexion estado={enLinea ? 'en_linea' : 'sin_conexion'} />
      <Campana />
      <Link to="/cuenta" aria-label={`Cuenta de ${perfil.nombre}`} className="rounded-full">
        <Avatar nombre={perfil.nombre} />
      </Link>
    </header>
  )
}

function BarraLateral({ perfil, items, insignias, origen, alSalir }) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 flex-none flex-col gap-1 border-r border-borde bg-superficie px-4 py-6 lg:flex">
      <div className="flex items-center gap-2.5 px-2 pb-5">
        <span className="flex size-9 items-center justify-center rounded-control bg-primario text-sobre-primario">
          <Icono src={iconoMarca} tamano={22} />
        </span>
        <p className="flex flex-col">
          <span className="text-cuerpo-fuerte text-texto">Novedades</span>
          <span className="text-auxiliar text-texto-secundario">Grupo Central</span>
        </p>
      </div>

      <nav aria-label="Principal" className="flex flex-col gap-1">
        {items.map(({ ruta, etiqueta, icono }) => (
          <NavLink
            key={ruta}
            to={ruta}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-control px-3 py-2.5 ${
                isActive || ruta === origen
                  ? 'bg-primario-contenedor text-etiqueta-fuerte text-primario'
                  : 'text-etiqueta text-texto hover:bg-gris-100'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icono
                  src={icono}
                  tamano={22}
                  className={
                    isActive || ruta === origen ? 'text-primario' : 'text-texto-secundario'
                  }
                />
                <span className="min-w-0 flex-1">{etiqueta}</span>
                <Insignia cantidad={insignias[ruta]} />
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <span className="flex-1" />

      <div className="flex items-center gap-2.5 border-t border-borde px-2 pt-3">
        <Avatar nombre={perfil.nombre} />
        <p className="flex min-w-0 flex-1 flex-col">
          <span className="text-etiqueta-fuerte text-texto">{perfil.nombre}</span>
          <span className="text-auxiliar text-texto-secundario">
            {descripcionDelPerfil(perfil)}
          </span>
        </p>
        <button
          type="button"
          onClick={alSalir}
          aria-label="Cerrar sesión"
          className="flex size-10 flex-none cursor-pointer items-center justify-center rounded-control text-texto-secundario hover:bg-gris-100"
        >
          <Icono src={iconoSalir} tamano={24} />
        </button>
      </div>
    </aside>
  )
}

function NavegacionInferior({ items, origen }) {
  return (
    <nav
      aria-label="Principal"
      className="sticky bottom-0 z-10 flex items-start border-t border-borde bg-superficie px-2 pt-2 pb-[max(1.25rem,env(safe-area-inset-bottom))] group-has-[[data-barra-de-acciones]]/marco:hidden lg:hidden"
    >
      {items.map(({ ruta, etiqueta, corta, icono }) => (
        <NavLink
          key={ruta}
          to={ruta}
          className="flex min-h-13 min-w-0 flex-1 flex-col items-center gap-1"
        >
          {({ isActive }) => (
            <>
              <span
                className={`flex items-center rounded-2xl px-4 py-1 ${
                  isActive || ruta === origen
                    ? 'bg-primario-contenedor text-primario'
                    : 'text-texto-secundario'
                }`}
              >
                <Icono src={icono} tamano={24} />
              </span>
              <span
                className={
                  isActive || ruta === origen
                    ? 'text-auxiliar-fuerte text-primario'
                    : 'text-auxiliar text-texto-secundario'
                }
              >
                {corta ?? etiqueta}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

/**
 * Layout de las rutas con sesión. Va dentro de `RequiereSesion`.
 *
 * @param {object} props
 * @param {boolean} [props.enfocado] Pantallas de una sola tarea (05 y 06): en el teléfono no
 *   llevan la barra superior ni la inferior; cada una pone su propia cabecera.
 * @param {boolean} [props.sinBarraSuperior] Pantallas que en el teléfono traen su propia barra
 *   superior, con «volver», pero conservan la navegación inferior (el detalle, 13 y 22-B).
 */
export default function Marco({ enfocado = false, sinBarraSuperior = false }) {
  const { perfil } = useSesion()
  const navegar = useNavigate()
  const enLinea = useEnLinea()
  const { pathname: ruta, state } = useLocation()
  const items = MENU[perfil.rol_id] ?? []
  const insignias = useInsignias(perfil.rol_id)
  // En el detalle de una novedad, el menú deja marcada la pantalla desde la que se abrió.
  const origen = ruta.startsWith('/novedades/')
    ? rutaDeOrigen(state, perfil.rol_id).split('?')[0]
    : null

  return (
    // Cuando una pantalla pinta su barra de acciones ([data-barra-de-acciones]), esta ocupa
    // el lugar de la navegación inferior del teléfono.
    <div className="group/marco flex min-h-dvh flex-col lg:flex-row">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-control focus:bg-superficie focus:px-4 focus:py-3 focus:text-etiqueta-fuerte focus:text-primario"
      >
        Saltar al contenido
      </a>

      <BarraLateral
        perfil={perfil}
        items={items.filter((item) => !item.soloTelefono)}
        insignias={insignias}
        origen={origen}
        alSalir={() => navegar('/cuenta')}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {enfocado || sinBarraSuperior ? null : (
          <BarraSuperiorDelTelefono perfil={perfil} enLinea={enLinea} ruta={ruta} />
        )}
        <BarraSuperiorDelEscritorio perfil={perfil} enLinea={enLinea} />

        <main id="contenido" tabIndex={-1} className="flex flex-1 flex-col outline-none">
          {/* «Cuenta» pinta en el teléfono las pantallas que aquí solo caben en el
              escritorio, con su insignia. */}
          <Outlet context={{ insignias }} />
        </main>

        {enfocado ? null : (
          <NavegacionInferior
            items={items.filter((item) => !item.soloEscritorio)}
            origen={origen}
          />
        )}
      </div>
    </div>
  )
}
