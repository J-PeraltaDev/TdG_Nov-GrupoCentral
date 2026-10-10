import { useEffect, useId, useState } from 'react'
import { traducirError } from '../../core/errores/traducir.js'
import { vigilarPermiso } from '../../core/sesion/perfilVigente.js'
import { useSesion } from '../../core/sesion/ContextoSesion.js'
import { iniciales, nombreCompletoDeRol, ROL } from '../../core/sesion/roles.js'
import { listarAreas } from '../../core/supabase/repositorios/catalogos.js'
import { listarFincasConConteos } from '../../core/supabase/repositorios/fincas.js'
import {
  activarUsuario,
  actualizarUsuario,
  crearUsuario,
  desactivarUsuario,
  listarUsuarios,
} from '../../core/supabase/repositorios/usuarios.js'
import { Aviso } from '../../core/ui/Aviso.jsx'
import { AvisoTemporal } from '../../core/ui/AvisoTemporal.jsx'
import { Boton } from '../../core/ui/Boton.jsx'
import { BotonDeIcono } from '../../core/ui/BotonDeIcono.jsx'
import { CampoDeBusqueda } from '../../core/ui/CampoDeBusqueda.jsx'
import { Filtro } from '../../core/ui/Filtro.jsx'
import iconoRol from '../../core/ui/iconos/badge.svg'
import iconoSinConexion from '../../core/ui/iconos/cloud_off.svg'
import iconoEditar from '../../core/ui/iconos/edit.svg'
import iconoError from '../../core/ui/iconos/error.svg'
import iconoReactivar from '../../core/ui/iconos/how_to_reg.svg'
import iconoNuevo from '../../core/ui/iconos/person_add.svg'
import iconoDesactivar from '../../core/ui/iconos/person_off.svg'
import iconoEstado from '../../core/ui/iconos/toggle_on.svg'
import { Paginacion } from '../../core/ui/Paginacion.jsx'
import { AVISO_SUELTO } from '../../core/ui/posicionDelAviso.js'
import { useEsEscritorio } from '../../core/ui/useEsEscritorio.js'
import { formatearUltimoIngreso } from '../../core/utils/fechas.js'
import { paginar } from '../../core/utils/paginar.js'
import { sinTildes } from '../../core/utils/texto.js'
import { advertenciaDeAlcance } from './advertenciaDeAlcance.js'
import { DialogoDesactivarUsuario } from './DialogoDesactivarUsuario.jsx'
import { PanelUsuario } from './PanelUsuario.jsx'

/*
 * Pantalla 28 · Usuarios (RF-03 / CU-03). Figma 6:867 y 6:1098. El administrador crea las
 * cuentas, les asigna el rol y la finca o el área, y las desactiva o reactiva; un usuario no
 * se borra.
 *
 * La lista sale de `listar_usuarios`, que es la que puede entregar el correo (ADR 0010), y las
 * escrituras pasan por la Edge Function `gestionar-usuario`. Son decenas de filas: llegan en
 * una sola consulta y la búsqueda, los filtros y las páginas se resuelven aquí. En el teléfono
 * la tabla pasa a tarjetas (SDD 6.1.11).
 */

/** @typedef {import('../../core/supabase/repositorios/usuarios.js').Usuario} Usuario */

/** Como las demás listas de la aplicación. */
const USUARIOS_POR_PAGINA = 20

const ROLES = [
  { valor: '', nombre: 'Rol: Todos' },
  ...Object.values(ROL).map((id) => ({ valor: String(id), nombre: nombreCompletoDeRol(id) })),
]

const ESTADOS = [
  { valor: 'todos', nombre: 'Estado: Todos' },
  { valor: 'activos', nombre: 'Estado: Activos' },
  { valor: 'inactivos', nombre: 'Estado: Inactivos' },
]

const ENCABEZADO = 'py-2.5 text-left text-auxiliar-fuerte text-texto-secundario'
const CELDA = 'py-3 align-middle text-cuerpo-pequeno text-texto'
const ETIQUETA = 'rounded-md px-2 py-0.5 text-auxiliar-fuerte whitespace-nowrap'

const NO_DESACTIVARSE = 'No puedes desactivar tu propia cuenta.'

function EstadoDelUsuario({ activo }) {
  return (
    <span
      className={`${ETIQUETA} ${activo ? 'bg-exito-suave text-exito' : 'bg-gris-100 text-texto-secundario'}`}
    >
      {activo ? 'Activo' : 'Inactivo'}
    </span>
  )
}

function EtiquetaDeRol({ rolId }) {
  return (
    <span className={`${ETIQUETA} bg-gris-100 text-texto-secundario`}>
      {nombreCompletoDeRol(rolId)}
    </span>
  )
}

function TuCuenta() {
  return <span className={`${ETIQUETA} bg-primario-contenedor text-primario`}>Tu cuenta</span>
}

/** Editar y desactivar (o reactivar) un usuario. */
function Acciones({ usuario, esPropio, ocupado, alEditar, alDesactivar, alReactivar }) {
  const idDeLaExplicacion = useId()
  return (
    <div className="flex items-center">
      <BotonDeIcono icono={iconoEditar} nombre={`Editar ${usuario.nombre}`} onClick={alEditar} />
      {usuario.activo ? (
        <>
          <BotonDeIcono
            icono={iconoDesactivar}
            nombre={`Desactivar ${usuario.nombre}`}
            color="text-error"
            // Nadie se desactiva a sí mismo: así siempre queda un administrador activo.
            disabled={esPropio}
            aria-describedby={esPropio ? idDeLaExplicacion : undefined}
            title={esPropio ? NO_DESACTIVARSE : undefined}
            onClick={alDesactivar}
          />
          {esPropio ? (
            <span id={idDeLaExplicacion} className="sr-only">
              {NO_DESACTIVARSE}
            </span>
          ) : null}
        </>
      ) : (
        <BotonDeIcono
          icono={iconoReactivar}
          nombre={`Reactivar ${usuario.nombre}`}
          color="text-exito"
          disabled={ocupado}
          onClick={alReactivar}
        />
      )}
    </div>
  )
}

function Tarjeta({ usuario, alcance, esPropio, acciones }) {
  const idDelTitulo = useId()
  const rol = nombreCompletoDeRol(usuario.rol_id)
  return (
    <li>
      <article
        aria-labelledby={idDelTitulo}
        className="flex items-start gap-2 rounded-xl border border-borde bg-superficie py-3 pr-1.5 pl-4"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 py-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id={idDelTitulo} className="text-cuerpo-fuerte break-words text-texto">
              {usuario.nombre}
            </h2>
            <EstadoDelUsuario activo={usuario.activo} />
            {esPropio ? <TuCuenta /> : null}
          </div>
          <p className="text-cuerpo-pequeno break-all text-texto-secundario">{usuario.correo}</p>
          <p className="text-cuerpo-pequeno text-texto">{alcance ? `${rol} · ${alcance}` : rol}</p>
          <p className="text-auxiliar text-texto-secundario">
            Último ingreso: {formatearUltimoIngreso(usuario.ultimo_ingreso)}
          </p>
        </div>
        {acciones}
      </article>
    </li>
  )
}

export default function Usuarios() {
  const { perfil } = useSesion()
  const esEscritorio = useEsEscritorio()
  const [intento, setIntento] = useState(0)
  const [datos, setDatos] = useState({
    cargados: false,
    usuarios: /** @type {Usuario[]} */ ([]),
    fincas: /** @type {any[]} */ ([]),
    areas: /** @type {{ id: string, nombre: string }[]} */ ([]),
    fallo: /** @type {import('../../core/errores/traducir.js').ErrorTraducido | null} */ (null),
  })
  const [busqueda, setBusqueda] = useState('')
  const [rol, setRol] = useState('')
  const [estado, setEstado] = useState('todos')
  const [pagina, setPagina] = useState(0)
  /** Lo que está abierto: el panel (uno nuevo o uno que se edita) o el diálogo de desactivar. */
  const [abierto, setAbierto] = useState(
    /** @type {{ tipo: 'nuevo' | 'editar' | 'desactivar', usuario: Usuario | null } | null} */ (
      null
    ),
  )
  const [aviso, setAviso] = useState(
    /** @type {{ tipo: 'exito' | 'error', mensaje: string } | null} */ (null),
  )
  const [reactivando, setReactivando] = useState(/** @type {string | null} */ (null))

  // Los usuarios, las fincas y las áreas no dependen entre sí: se piden en paralelo. Al
  // recargar después de un cambio se conserva lo que ya se ve hasta que llegue lo nuevo.
  useEffect(() => {
    let vigente = true
    // Si ya no es administrador, la lista responde SIN_PERMISO: el perfil se relee.
    Promise.all([vigilarPermiso(listarUsuarios), listarFincasConConteos(), listarAreas()])
      .then(([usuarios, fincas, areas]) => {
        if (vigente) setDatos({ cargados: true, usuarios, fincas, areas, fallo: null })
      })
      .catch((error) => {
        if (vigente) setDatos((actuales) => ({ ...actuales, fallo: traducirError(error) }))
      })
    return () => {
      vigente = false
    }
  }, [intento])

  const recargar = () => setIntento((n) => n + 1)
  const cerrar = () => setAbierto(null)
  /** Cambia un filtro y vuelve a la primera página. */
  const filtrar = (cambiar) => (valor) => {
    cambiar(valor)
    setPagina(0)
  }

  /** Después de un cambio: se cierra lo abierto, se avisa y se trae la lista de nuevo. */
  function hecho(mensaje) {
    cerrar()
    setAviso({ tipo: 'exito', mensaje })
    recargar()
  }

  /** @type {import('./PanelUsuario.jsx').AlGuardarUsuario} */
  async function guardar(cambios) {
    if (abierto?.usuario) {
      await vigilarPermiso(() => actualizarUsuario(abierto.usuario.id, cambios))
      hecho('Usuario actualizado.')
    } else {
      await vigilarPermiso(() => crearUsuario(cambios))
      // La contraseña inicial solo se vio en el formulario, que ya se cerró.
      hecho('Usuario creado. Entrégale su contraseña inicial.')
    }
  }

  async function desactivar() {
    await vigilarPermiso(() => desactivarUsuario(abierto.usuario.id))
    hecho('Usuario desactivado.')
  }

  /** Reactivar no pide confirmación: se deshace desactivando. */
  async function reactivar(usuario) {
    setReactivando(usuario.id)
    setAviso(null)
    try {
      await vigilarPermiso(() => activarUsuario(usuario.id))
      hecho('Usuario reactivado.')
    } catch (error) {
      setAviso({ tipo: 'error', mensaje: traducirError(error).mensaje })
    } finally {
      setReactivando(null)
    }
  }

  const { usuarios, fincas, areas, fallo } = datos
  const cargando = !datos.cargados && !fallo

  /** «Finca Altamira», «Mantenimiento» o nada, según el rol. */
  function alcanceDe(usuario) {
    if (usuario.finca_id) {
      const nombre = fincas.find(({ id }) => id === usuario.finca_id)?.nombre
      // Como en el detalle: «Finca» va antes del nombre, salvo que el nombre ya empiece así.
      return nombre ? (/^finca\b/i.test(nombre) ? nombre : `Finca ${nombre}`) : null
    }
    if (usuario.area_id) return areas.find(({ id }) => id === usuario.area_id)?.nombre ?? null
    return null
  }

  const buscada = sinTildes(busqueda)
  const coinciden = usuarios.filter(
    (usuario) =>
      (estado === 'todos' || usuario.activo === (estado === 'activos')) &&
      (rol === '' || String(usuario.rol_id) === rol) &&
      (sinTildes(usuario.nombre).includes(buscada) || sinTildes(usuario.correo).includes(buscada)),
  )
  const paginas = paginar(coinciden, pagina, USUARIOS_POR_PAGINA)
  const { visibles } = paginas

  const acciones = (usuario) => (
    <Acciones
      usuario={usuario}
      esPropio={usuario.id === perfil.id}
      ocupado={reactivando === usuario.id}
      alEditar={() => setAbierto({ tipo: 'editar', usuario })}
      alDesactivar={() => setAbierto({ tipo: 'desactivar', usuario })}
      alReactivar={() => reactivar(usuario)}
    />
  )
  const porDesactivar = abierto?.tipo === 'desactivar' ? abierto.usuario : null

  return (
    <section className="flex w-full flex-1 flex-col gap-3.5 px-4 pt-4 pb-6 lg:gap-6 lg:px-8 lg:pt-8 lg:pb-12">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-titulo text-texto lg:text-display">Usuarios</h1>
          <p className="text-cuerpo-pequeno text-texto-secundario lg:text-cuerpo">
            Crea las cuentas y asigna el rol y la finca o el área. Un usuario desactivado no puede
            ingresar, pero su historial se conserva.
          </p>
        </div>
        <Boton
          icono={iconoNuevo}
          onClick={() => setAbierto({ tipo: 'nuevo', usuario: null })}
          disabled={!datos.cargados}
          className="flex-none"
        >
          Nuevo usuario
        </Boton>
      </header>

      <div role="search" className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-3">
        <CampoDeBusqueda
          nombre="Buscar por nombre o correo"
          value={busqueda}
          alCambiar={filtrar(setBusqueda)}
        />
        <Filtro
          nombre="Rol"
          icono={iconoRol}
          value={rol}
          alCambiar={filtrar(setRol)}
          opciones={ROLES}
        />
        <Filtro
          nombre="Estado"
          icono={iconoEstado}
          value={estado}
          alCambiar={filtrar(setEstado)}
          opciones={ESTADOS}
        />
      </div>

      {cargando ? (
        <p role="status" className="py-6 text-center text-cuerpo-pequeno text-texto-secundario">
          Cargando…
        </p>
      ) : null}

      {fallo ? (
        <Aviso
          tipo={fallo.tipo === 'red' ? 'advertencia' : 'error'}
          icono={fallo.tipo === 'red' ? iconoSinConexion : iconoError}
          role="alert"
          accion={
            <Boton
              tipo="texto"
              tamano="escritorio"
              onClick={() => {
                setDatos((actuales) => ({ ...actuales, fallo: null }))
                recargar()
              }}
            >
              Reintentar
            </Boton>
          }
        >
          {fallo.mensaje}
        </Aviso>
      ) : null}

      {datos.cargados && coinciden.length === 0 ? (
        <p className="py-10 text-center text-cuerpo text-texto-secundario">
          No hay usuarios que coincidan.
        </p>
      ) : null}

      {visibles.length > 0 ? (
        esEscritorio ? (
          <div className="overflow-x-auto rounded-xl border border-borde bg-superficie">
            <table className="w-full border-collapse">
              <caption className="sr-only">Usuarios</caption>
              <thead className="bg-gris-100">
                <tr>
                  <th scope="col" className={`${ENCABEZADO} pr-2 pl-5`}>
                    Nombre
                  </th>
                  <th scope="col" className={`${ENCABEZADO} px-2`}>
                    Correo
                  </th>
                  <th scope="col" className={`${ENCABEZADO} px-2`}>
                    Rol
                  </th>
                  <th scope="col" className={`${ENCABEZADO} px-2`}>
                    Finca o área
                  </th>
                  <th scope="col" className={`${ENCABEZADO} px-2`}>
                    Estado
                  </th>
                  <th scope="col" className={`${ENCABEZADO} px-2`}>
                    Último ingreso
                  </th>
                  <th scope="col" className={`${ENCABEZADO} pr-5 pl-2`}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((usuario) => (
                  <tr key={usuario.id} className="border-b border-borde last:border-b-0">
                    {/* El nombre va dentro, junto a las iniciales; la regla no mira tan adentro. */}
                    {/* oxlint-disable-next-line jsx-a11y/control-has-associated-label */}
                    <th scope="row" className={`${CELDA} pr-2 pl-5 text-left`}>
                      <span className="flex items-center gap-2.5">
                        <span
                          aria-hidden="true"
                          className="flex size-8 flex-none items-center justify-center rounded-full bg-primario-contenedor text-auxiliar-fuerte text-primario"
                        >
                          {iniciales(usuario.nombre)}
                        </span>
                        <span className="flex min-w-0 flex-col items-start gap-1">
                          <span className="text-etiqueta-fuerte break-words">{usuario.nombre}</span>
                          {usuario.id === perfil.id ? <TuCuenta /> : null}
                        </span>
                      </span>
                    </th>
                    <td className={`${CELDA} px-2 break-all`}>{usuario.correo}</td>
                    <td className={`${CELDA} px-2`}>
                      <EtiquetaDeRol rolId={usuario.rol_id} />
                    </td>
                    <td className={`${CELDA} px-2 break-words`}>{alcanceDe(usuario) ?? '—'}</td>
                    <td className={`${CELDA} px-2`}>
                      <EstadoDelUsuario activo={usuario.activo} />
                    </td>
                    <td className={`${CELDA} px-2 whitespace-nowrap`}>
                      {formatearUltimoIngreso(usuario.ultimo_ingreso)}
                    </td>
                    <td className={`${CELDA} pr-3 pl-0`}>{acciones(usuario)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <ul aria-label="Usuarios" className="flex flex-col gap-2.5">
            {visibles.map((usuario) => (
              <Tarjeta
                key={usuario.id}
                usuario={usuario}
                alcance={alcanceDe(usuario)}
                esPropio={usuario.id === perfil.id}
                acciones={acciones(usuario)}
              />
            ))}
          </ul>
        )
      ) : null}

      {coinciden.length > 0 ? (
        <Paginacion
          pagina={paginas.pagina}
          ultima={paginas.ultima}
          desde={paginas.desde}
          visibles={visibles.length}
          total={coinciden.length}
          singular="usuario"
          plural="usuarios"
          alCambiar={setPagina}
        />
      ) : null}

      {aviso ? (
        <AvisoTemporal tipo={aviso.tipo} alTerminar={() => setAviso(null)} className={AVISO_SUELTO}>
          {aviso.mensaje}
        </AvisoTemporal>
      ) : null}

      <PanelUsuario
        abierto={abierto?.tipo === 'nuevo' || abierto?.tipo === 'editar'}
        usuario={abierto?.tipo === 'editar' ? abierto.usuario : null}
        yoId={perfil.id}
        usuarios={usuarios}
        fincas={fincas}
        areas={areas}
        alCerrar={cerrar}
        alGuardar={guardar}
      />
      <DialogoDesactivarUsuario
        usuario={porDesactivar}
        advertencia={
          porDesactivar ? advertenciaDeAlcance(porDesactivar, usuarios, { fincas, areas }) : null
        }
        alCerrar={cerrar}
        alConfirmar={desactivar}
      />
    </section>
  )
}
