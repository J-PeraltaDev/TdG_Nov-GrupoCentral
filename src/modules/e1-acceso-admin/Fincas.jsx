import { useEffect, useId, useState } from 'react'
import { traducirError } from '../../core/errores/traducir.js'
import { vigilarPermiso } from '../../core/sesion/perfilVigente.js'
import {
  actualizarFinca,
  crearFinca,
  listarFincasConConteos,
  listarRazonesSociales,
} from '../../core/supabase/repositorios/fincas.js'
import { Aviso } from '../../core/ui/Aviso.jsx'
import { AvisoTemporal } from '../../core/ui/AvisoTemporal.jsx'
import { Boton } from '../../core/ui/Boton.jsx'
import { BotonDeIcono } from '../../core/ui/BotonDeIcono.jsx'
import { CampoDeBusqueda } from '../../core/ui/CampoDeBusqueda.jsx'
import { Filtro } from '../../core/ui/Filtro.jsx'
import iconoNueva from '../../core/ui/iconos/add.svg'
import iconoDesactivar from '../../core/ui/iconos/block.svg'
import iconoReactivar from '../../core/ui/iconos/check_circle.svg'
import iconoSinConexion from '../../core/ui/iconos/cloud_off.svg'
import iconoRazonSocial from '../../core/ui/iconos/domain.svg'
import iconoEditar from '../../core/ui/iconos/edit.svg'
import iconoError from '../../core/ui/iconos/error.svg'
import iconoEstado from '../../core/ui/iconos/toggle_on.svg'
import { Paginacion } from '../../core/ui/Paginacion.jsx'
import { AVISO_SUELTO } from '../../core/ui/posicionDelAviso.js'
import { useEsEscritorio } from '../../core/ui/useEsEscritorio.js'
import { paginar } from '../../core/utils/paginar.js'
import { sinTildes } from '../../core/utils/texto.js'
import { DialogoDesactivarFinca } from './DialogoDesactivarFinca.jsx'
import { DialogoFinca } from './DialogoFinca.jsx'

/*
 * Pantalla 30 · Fincas (RF-04 / CU-04). Figma 6:1961 y 6:2194. El administrador crea, edita,
 * desactiva y reactiva las fincas; una finca no se borra.
 *
 * Son decenas de filas: se traen todas y la búsqueda, los filtros y las páginas se resuelven
 * aquí. En el teléfono la tabla pasa a tarjetas (SDD 6.1.11).
 */

/** @typedef {import('../../core/supabase/repositorios/fincas.js').Finca} Finca */

/** Como las demás listas de la aplicación. */
const FINCAS_POR_PAGINA = 20

const ESTADOS = [
  { valor: 'activas', nombre: 'Estado: Activas' },
  { valor: 'inactivas', nombre: 'Estado: Inactivas' },
  { valor: 'todas', nombre: 'Estado: Todas' },
]

const ENCABEZADO = 'py-2.5 text-left text-auxiliar-fuerte text-texto-secundario'
const CELDA = 'py-3 align-middle text-cuerpo-pequeno text-texto'

const plural = (cantidad, uno, varios) => `${cantidad} ${cantidad === 1 ? uno : varios}`

function EstadoDeLaFinca({ activo }) {
  return (
    <span
      className={`rounded-md px-2 py-0.5 text-auxiliar-fuerte whitespace-nowrap ${
        activo ? 'bg-exito-suave text-exito' : 'bg-gris-100 text-texto-secundario'
      }`}
    >
      {activo ? 'Activa' : 'Inactiva'}
    </span>
  )
}

/** Editar y desactivar (o reactivar) una finca. */
function Acciones({ finca, alEditar, alDesactivar, alReactivar, ocupada }) {
  return (
    <div className="flex items-center">
      <BotonDeIcono icono={iconoEditar} nombre={`Editar ${finca.nombre}`} onClick={alEditar} />
      {finca.activo ? (
        <BotonDeIcono
          icono={iconoDesactivar}
          nombre={`Desactivar ${finca.nombre}`}
          color="text-error"
          onClick={alDesactivar}
        />
      ) : (
        <BotonDeIcono
          icono={iconoReactivar}
          nombre={`Reactivar ${finca.nombre}`}
          color="text-exito"
          disabled={ocupada}
          onClick={alReactivar}
        />
      )}
    </div>
  )
}

function Tarjeta({ finca, acciones }) {
  const idDelTitulo = useId()
  return (
    <li>
      <article
        aria-labelledby={idDelTitulo}
        className="flex items-start gap-2 rounded-xl border border-borde bg-superficie py-3 pr-1.5 pl-4"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 py-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id={idDelTitulo} className="text-cuerpo-fuerte break-words text-texto">
              {finca.nombre}
            </h2>
            <EstadoDeLaFinca activo={finca.activo} />
          </div>
          <p className="text-cuerpo-pequeno break-words text-texto-secundario">
            {finca.razon_social}
          </p>
          <p className="flex flex-wrap gap-x-3 gap-y-1 text-auxiliar text-texto-secundario">
            <span>{plural(finca.novedades_abiertas, 'novedad abierta', 'novedades abiertas')}</span>
            <span>{plural(finca.reportantes_activos, 'reportante', 'reportantes')}</span>
          </p>
        </div>
        {acciones}
      </article>
    </li>
  )
}

export default function Fincas() {
  const esEscritorio = useEsEscritorio()
  const [intento, setIntento] = useState(0)
  const [datos, setDatos] = useState({
    cargados: false,
    fincas: /** @type {Finca[]} */ ([]),
    razones: /** @type {{ id: string, nombre: string }[]} */ ([]),
    fallo: /** @type {import('../../core/errores/traducir.js').ErrorTraducido | null} */ (null),
  })
  const [busqueda, setBusqueda] = useState('')
  const [razonId, setRazonId] = useState('')
  const [estado, setEstado] = useState('activas')
  const [pagina, setPagina] = useState(0)
  /** El diálogo abierto: una finca nueva, una que se edita o una que se va a desactivar. */
  const [dialogo, setDialogo] = useState(
    /** @type {{ tipo: 'nueva' | 'editar' | 'desactivar', finca: Finca | null } | null} */ (null),
  )
  const [aviso, setAviso] = useState(
    /** @type {{ tipo: 'exito' | 'error', mensaje: string } | null} */ (null),
  )
  const [reactivando, setReactivando] = useState(/** @type {string | null} */ (null))

  // Las fincas y las razones sociales no dependen entre sí: se piden en paralelo. Al recargar
  // después de un cambio se conserva lo que ya se ve hasta que llegue lo nuevo.
  useEffect(() => {
    let vigente = true
    Promise.all([listarFincasConConteos(), listarRazonesSociales()])
      .then(([fincas, razones]) => {
        if (vigente) setDatos({ cargados: true, fincas, razones, fallo: null })
      })
      .catch((error) => {
        if (vigente) setDatos((actuales) => ({ ...actuales, fallo: traducirError(error) }))
      })
    return () => {
      vigente = false
    }
  }, [intento])

  const recargar = () => setIntento((n) => n + 1)
  const cerrarDialogo = () => setDialogo(null)
  /** Cambia un filtro y vuelve a la primera página. */
  const filtrar = (cambiar) => (valor) => {
    cambiar(valor)
    setPagina(0)
  }

  /** Después de un cambio: se cierra el diálogo, se avisa y se trae la lista de nuevo. */
  function hecho(mensaje) {
    cerrarDialogo()
    setAviso({ tipo: 'exito', mensaje })
    recargar()
  }

  /** @type {import('./DialogoFinca.jsx').AlGuardarFinca} */
  async function guardar({ nombre, razonSocialId }) {
    if (dialogo?.finca) {
      await vigilarPermiso(() => actualizarFinca(dialogo.finca.id, { nombre, razonSocialId }))
      hecho('Finca actualizada.')
    } else {
      await vigilarPermiso(() => crearFinca({ nombre, razonSocialId }))
      hecho('Finca creada.')
    }
  }

  async function desactivar() {
    await vigilarPermiso(() => actualizarFinca(dialogo.finca.id, { activo: false }))
    hecho('Finca desactivada.')
  }

  /** Reactivar no pide confirmación: no afecta a nadie y se deshace desactivando. */
  async function reactivar(finca) {
    setReactivando(finca.id)
    setAviso(null)
    try {
      await vigilarPermiso(() => actualizarFinca(finca.id, { activo: true }))
      hecho('Finca reactivada.')
    } catch (error) {
      setAviso({ tipo: 'error', mensaje: traducirError(error).mensaje })
    } finally {
      setReactivando(null)
    }
  }

  const { fincas, razones, fallo } = datos
  const cargando = !datos.cargados && !fallo
  const buscada = sinTildes(busqueda)
  const coinciden = fincas.filter(
    (finca) =>
      (estado === 'todas' || finca.activo === (estado === 'activas')) &&
      (razonId === '' || finca.razon_social_id === razonId) &&
      sinTildes(finca.nombre).includes(buscada),
  )
  const paginas = paginar(coinciden, pagina, FINCAS_POR_PAGINA)
  const { visibles } = paginas

  const acciones = (finca) => (
    <Acciones
      finca={finca}
      ocupada={reactivando === finca.id}
      alEditar={() => setDialogo({ tipo: 'editar', finca })}
      alDesactivar={() => setDialogo({ tipo: 'desactivar', finca })}
      alReactivar={() => reactivar(finca)}
    />
  )

  return (
    <section className="flex w-full flex-1 flex-col gap-3.5 px-4 pt-4 pb-6 lg:gap-6 lg:px-8 lg:pt-8 lg:pb-12">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-titulo text-texto lg:text-display">Fincas</h1>
          <p className="text-cuerpo-pequeno text-texto-secundario lg:text-cuerpo">
            Una finca desactivada no aparece para nuevos registros, pero conserva su historial.
          </p>
        </div>
        <Boton
          icono={iconoNueva}
          onClick={() => setDialogo({ tipo: 'nueva', finca: null })}
          disabled={!datos.cargados}
          className="flex-none"
        >
          Nueva finca
        </Boton>
      </header>

      <div role="search" className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-3">
        <CampoDeBusqueda nombre="Buscar finca" value={busqueda} alCambiar={filtrar(setBusqueda)} />
        <Filtro
          nombre="Razón social"
          icono={iconoRazonSocial}
          value={razonId}
          alCambiar={filtrar(setRazonId)}
          opciones={[
            { valor: '', nombre: 'Razón social: Todas' },
            ...razones.map((razon) => ({ valor: razon.id, nombre: razon.nombre })),
          ]}
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
          No hay fincas que coincidan.
        </p>
      ) : null}

      {visibles.length > 0 ? (
        esEscritorio ? (
          <div className="overflow-clip rounded-xl border border-borde bg-superficie">
            <table className="w-full border-collapse">
              <caption className="sr-only">Fincas</caption>
              <thead className="bg-gris-100">
                <tr>
                  <th scope="col" className={`${ENCABEZADO} pr-2 pl-5`}>
                    Finca
                  </th>
                  <th scope="col" className={`${ENCABEZADO} px-2`}>
                    Razón social
                  </th>
                  <th scope="col" className={`${ENCABEZADO} px-2`}>
                    Novedades abiertas
                  </th>
                  <th scope="col" className={`${ENCABEZADO} px-2`}>
                    Reportantes asignados
                  </th>
                  <th scope="col" className={`${ENCABEZADO} px-2`}>
                    Estado
                  </th>
                  <th scope="col" className={`${ENCABEZADO} pr-5 pl-2`}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((finca) => (
                  <tr key={finca.id} className="border-b border-borde last:border-b-0">
                    <th
                      scope="row"
                      className={`${CELDA} pr-2 pl-5 text-left text-etiqueta-fuerte break-words`}
                    >
                      {finca.nombre}
                    </th>
                    <td className={`${CELDA} px-2 break-words`}>{finca.razon_social}</td>
                    <td className={`${CELDA} px-2 tabular-nums`}>{finca.novedades_abiertas}</td>
                    <td className={`${CELDA} px-2 tabular-nums`}>{finca.reportantes_activos}</td>
                    <td className={`${CELDA} px-2`}>
                      <EstadoDeLaFinca activo={finca.activo} />
                    </td>
                    <td className={`${CELDA} pr-3 pl-0`}>{acciones(finca)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <ul aria-label="Fincas" className="flex flex-col gap-2.5">
            {visibles.map((finca) => (
              <Tarjeta key={finca.id} finca={finca} acciones={acciones(finca)} />
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
          singular="finca"
          plural="fincas"
          alCambiar={setPagina}
        />
      ) : null}

      {aviso ? (
        <AvisoTemporal tipo={aviso.tipo} alTerminar={() => setAviso(null)} className={AVISO_SUELTO}>
          {aviso.mensaje}
        </AvisoTemporal>
      ) : null}

      <DialogoFinca
        abierto={dialogo?.tipo === 'nueva' || dialogo?.tipo === 'editar'}
        finca={dialogo?.tipo === 'editar' ? dialogo.finca : null}
        razones={razones}
        fincas={fincas}
        alCerrar={cerrarDialogo}
        alGuardar={guardar}
      />
      <DialogoDesactivarFinca
        finca={dialogo?.tipo === 'desactivar' ? dialogo.finca : null}
        alCerrar={cerrarDialogo}
        alConfirmar={desactivar}
      />
    </section>
  )
}
