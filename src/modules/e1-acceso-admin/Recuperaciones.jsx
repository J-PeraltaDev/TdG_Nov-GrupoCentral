import { useEffect, useId, useState } from 'react'
import { pedirConteoDeInsignias } from '../../app/insignias.js'
import { traducirError } from '../../core/errores/traducir.js'
import { vigilarPermiso } from '../../core/sesion/perfilVigente.js'
import { iniciales, nombreDeRol } from '../../core/sesion/roles.js'
import { listarAreas } from '../../core/supabase/repositorios/catalogos.js'
import { listarFincasConConteos } from '../../core/supabase/repositorios/fincas.js'
import {
  generarCodigoRecuperacion,
  listarSolicitudes,
} from '../../core/supabase/repositorios/recuperacion.js'
import { listarUsuarios } from '../../core/supabase/repositorios/usuarios.js'
import { Aviso } from '../../core/ui/Aviso.jsx'
import { AvisoTemporal } from '../../core/ui/AvisoTemporal.jsx'
import { Boton } from '../../core/ui/Boton.jsx'
import iconoSinConexion from '../../core/ui/iconos/cloud_off.svg'
import iconoError from '../../core/ui/iconos/error.svg'
import iconoCodigo from '../../core/ui/iconos/key.svg'
import { Paginacion } from '../../core/ui/Paginacion.jsx'
import { Pestanas } from '../../core/ui/Pestanas.jsx'
import { AVISO_SUELTO } from '../../core/ui/posicionDelAviso.js'
import { useEsEscritorio } from '../../core/ui/useEsEscritorio.js'
import { formatearFechaHora, tiempoTranscurrido } from '../../core/utils/fechas.js'
import { paginar } from '../../core/utils/paginar.js'
import { DialogoCodigoTemporal } from './DialogoCodigoTemporal.jsx'
import { estadoDeSolicitud, estaAbierta } from './estadoDeSolicitud.js'

/*
 * Pantalla 32 · Recuperación de contraseñas (RF-02 / CU-02, pasos 5 a 7). Figma 6:3317.
 *
 * Los correos de la plataforma no reciben mensajes: el administrador ve aquí las solicitudes,
 * genera el código temporal de cada una y se lo entrega a la persona por un medio propio. El
 * código solo se ve en el diálogo, una vez; en la base de datos queda su resumen, que ni el
 * administrador puede leer.
 *
 * El correo sale de `listar_usuarios`, que es la que puede entregarlo (ADR 0010). Son pocas
 * filas: llegan en una consulta y las pestañas y las páginas se resuelven aquí. En el teléfono
 * la tabla pasa a tarjetas (SDD 6.1.11).
 */

/** @typedef {import('./estadoDeSolicitud.js').EstadoDeSolicitud} EstadoDeSolicitud */

/** Como las demás listas de la aplicación. */
const SOLICITUDES_POR_PAGINA = 20

/** Cada cuánto se revisa la hora: «hace 12 min» avanza y un código vigente pasa a vencido. */
const RELOJ_MS = 30_000

const ID_DEL_PANEL = 'solicitudes-de-recuperacion'

const ENCABEZADO = 'py-2.5 text-left text-auxiliar-fuerte text-texto-secundario'
const CELDA = 'py-3.5 align-middle text-cuerpo-pequeno text-texto'
const ETIQUETA = 'rounded-md px-2 py-0.5 text-auxiliar-fuerte whitespace-nowrap'

/** Figma solo dibuja «Pendiente»; los otros tres son del SDD (6.1.10). */
/** @type {Record<EstadoDeSolicitud, { nombre: string, clases: string }>} */
const ESTADOS = {
  pendiente: { nombre: 'Pendiente', clases: 'bg-advertencia-suave text-advertencia' },
  codigo_generado: { nombre: 'Código generado', clases: 'bg-info-suave text-info' },
  usada: { nombre: 'Usada', clases: 'bg-exito-suave text-exito' },
  vencida: { nombre: 'Vencida', clases: 'bg-gris-100 text-texto-secundario' },
}

const SIN_SOLICITUDES = {
  pendientes: 'No hay solicitudes pendientes.',
  atendidas: 'Todavía no hay solicitudes atendidas.',
}

function Estado({ estado }) {
  const { nombre, clases } = ESTADOS[estado]
  return <span className={`${ETIQUETA} ${clases}`}>{nombre}</span>
}

/**
 * El correo, con permiso para partirse antes de la arroba: en una columna angosta queda
 * «nombre» y «@dominio», no cortado en cualquier letra.
 */
function Correo({ correo }) {
  const arroba = correo.lastIndexOf('@')
  if (arroba < 1) return correo
  return (
    <>
      {correo.slice(0, arroba)}
      <wbr />
      {correo.slice(arroba)}
    </>
  )
}

/**
 * «Generar código» de una solicitud pendiente, o «Generar otro código» de una que ya tiene uno
 * vigente (el anterior deja de servir). Las atendidas no tienen acción.
 */
function Accion({ fila, generando, alGenerar, className = '' }) {
  if (!estaAbierta(fila.estado)) return <span className="text-texto-secundario">—</span>
  const texto = fila.estado === 'pendiente' ? 'Generar código' : 'Generar otro código'
  return (
    <Boton
      tipo={fila.estado === 'pendiente' ? 'primario' : 'secundario'}
      icono={iconoCodigo}
      // Varias filas tienen el mismo botón: el nombre dice para quién es.
      aria-label={`${texto} para ${fila.nombre}`}
      disabled={generando !== null}
      onClick={() => alGenerar(fila)}
      className={className}
    >
      {generando === fila.id ? 'Generando…' : texto}
    </Boton>
  )
}

function Tarjeta({ fila, ahora, accion }) {
  const idDelTitulo = useId()
  return (
    <li>
      <article
        aria-labelledby={idDelTitulo}
        className="flex flex-col gap-3 rounded-xl border border-borde bg-superficie p-4"
      >
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id={idDelTitulo} className="text-cuerpo-fuerte break-words text-texto">
              {fila.nombre}
            </h2>
            <Estado estado={fila.estado} />
          </div>
          <p className="text-cuerpo-pequeno [overflow-wrap:anywhere] text-texto-secundario">
            <Correo correo={fila.correo} />
          </p>
          <p className="text-cuerpo-pequeno text-texto">{fila.rolYAlcance}</p>
          <p className="text-auxiliar text-texto-secundario">
            Solicitada {tiempoTranscurrido(fila.creada_en, ahora)}
          </p>
        </div>
        {estaAbierta(fila.estado) ? accion : null}
      </article>
    </li>
  )
}

export default function Recuperaciones() {
  const esEscritorio = useEsEscritorio()
  const [intento, setIntento] = useState(0)
  const [datos, setDatos] = useState({
    cargados: false,
    solicitudes: /** @type {import('./estadoDeSolicitud.js').Solicitud[]} */ ([]),
    usuarios: /** @type {import('../../core/supabase/repositorios/usuarios.js').Usuario[]} */ ([]),
    fincas: /** @type {{ id: string, nombre: string }[]} */ ([]),
    areas: /** @type {{ id: string, nombre: string }[]} */ ([]),
    fallo: /** @type {import('../../core/errores/traducir.js').ErrorTraducido | null} */ (null),
  })
  const [pestana, setPestana] = useState(/** @type {'pendientes' | 'atendidas'} */ ('pendientes'))
  const [pagina, setPagina] = useState(0)
  const [ahora, setAhora] = useState(() => Date.now())
  /** La solicitud cuyo código se está generando. */
  const [generando, setGenerando] = useState(/** @type {string | null} */ (null))
  /** El código recién generado: solo existe aquí, mientras el diálogo está abierto. */
  const [generado, setGenerado] = useState(
    /** @type {{ codigo: string, expiraEn: string, nombre: string, correo: string } | null} */ (
      null
    ),
  )
  const [aviso, setAviso] = useState(/** @type {string | null} */ (null))

  // Las solicitudes, los usuarios, las fincas y las áreas no dependen entre sí: se piden en
  // paralelo. Al recargar se conserva lo que ya se ve hasta que llegue lo nuevo.
  useEffect(() => {
    let vigente = true
    // Si ya no es administrador, las listas responden SIN_PERMISO: el perfil se relee.
    Promise.all([
      vigilarPermiso(listarSolicitudes),
      vigilarPermiso(listarUsuarios),
      listarFincasConConteos(),
      listarAreas(),
    ])
      .then(([solicitudes, usuarios, fincas, areas]) => {
        if (!vigente) return
        setDatos({ cargados: true, solicitudes, usuarios, fincas, areas, fallo: null })
        setAhora(Date.now())
        // Lo que se ve aquí es lo que cuenta la insignia del menú.
        pedirConteoDeInsignias()
      })
      .catch((error) => {
        if (vigente) setDatos((actuales) => ({ ...actuales, fallo: traducirError(error) }))
      })
    return () => {
      vigente = false
    }
  }, [intento])

  useEffect(() => {
    const reloj = setInterval(() => setAhora(Date.now()), RELOJ_MS)
    return () => clearInterval(reloj)
  }, [])

  const recargar = () => setIntento((n) => n + 1)

  const { solicitudes, usuarios, fincas, areas, fallo } = datos
  const cargando = !datos.cargados && !fallo

  /** «Reportante · Altamira», «Aprobador · Sistemas» o solo el rol, como en Figma. */
  function rolYAlcance(usuario) {
    const alcance = usuario.finca_id
      ? fincas.find(({ id }) => id === usuario.finca_id)?.nombre
      : areas.find(({ id }) => id === usuario.area_id)?.nombre
    return [nombreDeRol(usuario.rol_id), alcance].filter(Boolean).join(' · ')
  }

  const filas = solicitudes.map((solicitud) => {
    const usuario = usuarios.find(({ id }) => id === solicitud.usuario_id)
    return {
      ...solicitud,
      // Sin su usuario en la lista no hay a quién entregarle un código.
      estado: estadoDeSolicitud(solicitud, ahora, usuario?.activo === true),
      nombre: usuario?.nombre ?? 'Usuario no disponible',
      correo: usuario?.correo ?? '',
      rolYAlcance: usuario ? rolYAlcance(usuario) : '',
    }
  })
  const pendientes = filas.filter((fila) => estaAbierta(fila.estado))
  const atendidas = filas.filter((fila) => !estaAbierta(fila.estado))
  const deLaPestana = pestana === 'pendientes' ? pendientes : atendidas
  const paginas = paginar(deLaPestana, pagina, SOLICITUDES_POR_PAGINA)
  const { visibles } = paginas

  async function generar(fila) {
    setGenerando(fila.id)
    setAviso(null)
    try {
      const { codigo, expira_en: expiraEn } = await vigilarPermiso(() =>
        generarCodigoRecuperacion(fila.id),
      )
      setGenerado({ codigo, expiraEn, nombre: fila.nombre, correo: fila.correo })
      pedirConteoDeInsignias()
    } catch (error) {
      setAviso(traducirError(error).mensaje)
      // La solicitud cambió por debajo (se usó, venció o desactivaron al usuario): se trae
      // la lista de nuevo.
      if (String(error?.message ?? '').trim() === 'SOLICITUD_INVALIDA') recargar()
    } finally {
      setGenerando(null)
    }
  }

  /** «Listo»: el código desaparece de la pantalla y la fila pasa a «Código generado». */
  function cerrarCodigo() {
    // El diálogo avisa dos veces que se cerró (el botón y el evento del navegador).
    if (!generado) return
    setGenerado(null)
    recargar()
  }

  const accion = (fila, className) => (
    <Accion fila={fila} generando={generando} alGenerar={generar} className={className} />
  )

  return (
    <section className="flex w-full flex-1 flex-col gap-3.5 px-4 pt-4 pb-6 lg:gap-6 lg:px-8 lg:pt-8 lg:pb-12">
      <header className="flex flex-col gap-1">
        <h1 className="text-titulo text-texto lg:text-display">Recuperación de contraseñas</h1>
        <p className="text-cuerpo-pequeno text-texto-secundario lg:text-cuerpo">
          Los correos de la plataforma no reciben mensajes. Genera un código temporal y entrégalo a
          la persona en persona o por teléfono.
        </p>
      </header>

      <Pestanas
        etiqueta="Solicitudes"
        variante={esEscritorio ? 'subrayada' : 'segmentada'}
        pestanas={[
          { id: 'pendientes', nombre: `Pendientes (${pendientes.length})` },
          { id: 'atendidas', nombre: 'Atendidas' },
        ]}
        elegida={pestana}
        alElegir={(id) => {
          setPestana(/** @type {'pendientes' | 'atendidas'} */ (id))
          setPagina(0)
        }}
        idDelPanel={ID_DEL_PANEL}
        className={esEscritorio ? 'self-start' : ''}
      />

      <div
        id={ID_DEL_PANEL}
        role="tabpanel"
        aria-labelledby={`${ID_DEL_PANEL}-pestana-${pestana}`}
        className="flex flex-col gap-3.5 lg:gap-6"
      >
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

        {datos.cargados && deLaPestana.length === 0 ? (
          <p className="py-10 text-center text-cuerpo text-texto-secundario">
            {SIN_SOLICITUDES[pestana]}
          </p>
        ) : null}

        {visibles.length > 0 ? (
          esEscritorio ? (
            <div className="overflow-x-auto rounded-xl border border-borde bg-superficie">
              <table className="w-full border-collapse">
                <caption className="sr-only">
                  {pestana === 'pendientes' ? 'Solicitudes pendientes' : 'Solicitudes atendidas'}
                </caption>
                <thead className="bg-gris-100">
                  <tr>
                    <th scope="col" className={`${ENCABEZADO} pr-2 pl-5`}>
                      Usuario
                    </th>
                    <th scope="col" className={`${ENCABEZADO} px-2`}>
                      Correo
                    </th>
                    <th scope="col" className={`${ENCABEZADO} px-2`}>
                      Rol y finca o área
                    </th>
                    <th scope="col" className={`${ENCABEZADO} px-2`}>
                      Solicitada
                    </th>
                    <th scope="col" className={`${ENCABEZADO} px-2`}>
                      Estado
                    </th>
                    <th scope="col" className={`${ENCABEZADO} pr-5 pl-2`}>
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibles.map((fila) => (
                    <tr key={fila.id} className="border-b border-borde last:border-b-0">
                      {/* El nombre va dentro, junto a las iniciales; la regla no mira tan adentro. */}
                      {/* oxlint-disable-next-line jsx-a11y/control-has-associated-label */}
                      <th scope="row" className={`${CELDA} pr-2 pl-5 text-left`}>
                        <span className="flex items-center gap-2.5">
                          <span
                            aria-hidden="true"
                            className="flex size-8 flex-none items-center justify-center rounded-full bg-primario-contenedor text-auxiliar-fuerte text-primario"
                          >
                            {iniciales(fila.nombre)}
                          </span>
                          <span className="min-w-0 text-etiqueta-fuerte break-words">
                            {fila.nombre}
                          </span>
                        </span>
                      </th>
                      <td className={`${CELDA} px-2 [overflow-wrap:anywhere]`}>
                        <Correo correo={fila.correo} />
                      </td>
                      <td className={`${CELDA} px-2 break-words`}>{fila.rolYAlcance}</td>
                      <td
                        className={`${CELDA} px-2 whitespace-nowrap`}
                        title={formatearFechaHora(fila.creada_en)}
                      >
                        {tiempoTranscurrido(fila.creada_en, ahora)}
                      </td>
                      <td className={`${CELDA} px-2`}>
                        <Estado estado={fila.estado} />
                      </td>
                      <td className={`${CELDA} pr-5 pl-2`}>{accion(fila)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <ul
              aria-label={
                pestana === 'pendientes' ? 'Solicitudes pendientes' : 'Solicitudes atendidas'
              }
              className="flex flex-col gap-2.5"
            >
              {visibles.map((fila) => (
                <Tarjeta key={fila.id} fila={fila} ahora={ahora} accion={accion(fila, 'w-full')} />
              ))}
            </ul>
          )
        ) : null}

        {deLaPestana.length > SOLICITUDES_POR_PAGINA ? (
          <Paginacion
            pagina={paginas.pagina}
            ultima={paginas.ultima}
            desde={paginas.desde}
            visibles={visibles.length}
            total={deLaPestana.length}
            singular="solicitud"
            plural="solicitudes"
            alCambiar={setPagina}
          />
        ) : null}
      </div>

      {aviso ? (
        <AvisoTemporal tipo="error" alTerminar={() => setAviso(null)} className={AVISO_SUELTO}>
          {aviso}
        </AvisoTemporal>
      ) : null}

      <DialogoCodigoTemporal generado={generado} alCerrar={cerrarCodigo} />
    </section>
  )
}
