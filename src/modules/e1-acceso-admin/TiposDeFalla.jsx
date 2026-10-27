import { useEffect, useId, useState } from 'react'
import { traducirError } from '../../core/errores/traducir.js'
import { vigilarPermiso } from '../../core/sesion/perfilVigente.js'
import {
  desactivarTipoFalla,
  fusionarTiposFalla,
  listarCambios,
  listarCatalogo,
  reactivarTipoFalla,
  renombrarTipoFalla,
} from '../../core/supabase/repositorios/tiposFalla.js'
import { Aviso } from '../../core/ui/Aviso.jsx'
import { AvisoTemporal } from '../../core/ui/AvisoTemporal.jsx'
import { Boton } from '../../core/ui/Boton.jsx'
import { Etiqueta } from '../../core/ui/EtiquetasDeNovedad.jsx'
import iconoSinConexion from '../../core/ui/iconos/cloud_off.svg'
import iconoError from '../../core/ui/iconos/error.svg'
import { AVISO_SUELTO } from '../../core/ui/posicionDelAviso.js'
import { useEsEscritorio } from '../../core/ui/useEsEscritorio.js'
import { formatearFechaSinHora, hoyEnColombia } from '../../core/utils/fechas.js'
import { cuantasNovedades } from '../../core/utils/texto.js'
import { NOMBRE_DE_ACCION, ordenarCatalogo, textoDelCambio } from './catalogoDeTipos.js'
import { DialogoDesactivarTipo } from './DialogoDesactivarTipo.jsx'
import { DialogoFusionarTipos } from './DialogoFusionarTipos.jsx'
import { DialogoRenombrarTipo } from './DialogoRenombrarTipo.jsx'

/*
 * Pantalla 31 · Tipos de falla (RF-32 / CU-32). Figma 6:2438, 31-B 6:2734 y 31-C 6:3019. El
 * administrador renombra, fusiona, desactiva y reactiva (cambio 39) los tipos que crean las áreas
 * al resolver, para que el indicador de fallas recurrentes agrupe bien. Abajo, el registro de
 * cambios.
 *
 * Figma la dibuja solo en el escritorio; en el teléfono se llega desde «Cuenta» (cambio 16) y
 * la tabla pasa a tarjetas (decisión 64).
 */

/** @typedef {import('../../core/supabase/repositorios/tiposFalla.js').TipoDelCatalogo} TipoDelCatalogo */
/** @typedef {import('../../core/supabase/repositorios/tiposFalla.js').CambioDelCatalogo} CambioDelCatalogo */
/** @typedef {'renombrar' | 'fusionar' | 'desactivar' | 'reactivar'} Accion */

/** Las de un tipo activo. */
const ACCIONES = /** @type {Accion[]} */ (['renombrar', 'fusionar', 'desactivar'])

const ENCABEZADO = 'py-2.5 text-left text-auxiliar-fuerte text-texto-secundario'
const CELDA = 'py-2.5 align-middle text-cuerpo-pequeno text-texto'
const TARJETA = 'overflow-clip rounded-xl border border-borde bg-superficie'

/** «14 abr 2026»: el día de Colombia, siempre con el año, como 31. */
const dia = (/** @type {string} */ fecha) => formatearFechaSinHora(hoyEnColombia(fecha))

function EstadoDelTipo({ activo }) {
  return activo ? (
    <span className="rounded-md bg-exito-suave px-2 py-0.5 text-auxiliar-fuerte whitespace-nowrap text-exito">
      Activo
    </span>
  ) : (
    <Etiqueta>Inactivo</Etiqueta>
  )
}

const ENLACE =
  'min-h-12 cursor-pointer rounded-control px-2 text-etiqueta-fuerte whitespace-nowrap text-primario enabled:hover:underline disabled:cursor-not-allowed disabled:text-deshabilitado lg:min-h-0 lg:px-0.5'

/**
 * Renombrar, Fusionar y Desactivar, como enlaces de texto. Un tipo inactivo (desactivado: los
 * fusionados no están en la lista) solo se reactiva (cambio 39), sin confirmación: no afecta a
 * nadie y se deshace desactivándolo.
 *
 * @param {object} props
 * @param {TipoDelCatalogo} props.tipo
 * @param {(accion: Accion) => void} props.alElegir
 * @param {boolean} props.ocupado Se está reactivando.
 */
function Acciones({ tipo, alElegir, ocupado }) {
  return (
    <div className="-mx-2 flex flex-wrap items-center lg:mx-0 lg:flex-nowrap lg:gap-1.5">
      {tipo.activo ? (
        ACCIONES.map((accion) => (
          <button
            key={accion}
            type="button"
            aria-label={`${NOMBRE_DE_ACCION[accion]} ${tipo.nombre}`}
            onClick={() => alElegir(accion)}
            className={ENLACE}
          >
            {NOMBRE_DE_ACCION[accion]}
          </button>
        ))
      ) : (
        <button
          type="button"
          disabled={ocupado}
          aria-label={`Reactivar ${tipo.nombre}`}
          onClick={() => alElegir('reactivar')}
          className={ENLACE}
        >
          {ocupado ? 'Reactivando…' : 'Reactivar'}
        </button>
      )}
    </div>
  )
}

/**
 * @param {object} props
 * @param {TipoDelCatalogo[]} props.lista
 * @param {string | undefined} props.marcado El del diálogo abierto, con fondo (31).
 * @param {(tipo: TipoDelCatalogo, accion: Accion) => void} props.alElegir
 * @param {string | null} props.reactivando
 */
function TablaDeTipos({ lista, marcado, alElegir, reactivando }) {
  return (
    <div className={`relative overflow-x-auto ${TARJETA}`}>
      <table className="w-full min-w-[56rem] border-collapse">
        <caption className="sr-only">Tipos de falla</caption>
        <thead className="bg-gris-100">
          <tr>
            <th scope="col" className={`${ENCABEZADO} w-full pr-2 pl-5`}>
              Tipo de falla
            </th>
            <th scope="col" className={`${ENCABEZADO} px-2 whitespace-nowrap`}>
              Novedades asociadas
            </th>
            <th scope="col" className={`${ENCABEZADO} px-2 whitespace-nowrap`}>
              Creado por
            </th>
            <th scope="col" className={`${ENCABEZADO} px-2 whitespace-nowrap`}>
              Creado el
            </th>
            <th scope="col" className={`${ENCABEZADO} px-2 whitespace-nowrap`}>
              Estado
            </th>
            <th scope="col" className={`${ENCABEZADO} pr-5 pl-2 whitespace-nowrap`}>
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {lista.map((tipo) => (
            <tr
              key={tipo.id}
              className={`border-b border-borde last:border-b-0 ${tipo.id === marcado ? 'bg-gris-100' : ''}`}
            >
              <th
                scope="row"
                className={`${CELDA} max-w-0 truncate pr-2 pl-5 text-left text-etiqueta-fuerte`}
                title={tipo.nombre}
              >
                {tipo.nombre}
              </th>
              <td className={`${CELDA} px-2 tabular-nums`}>{tipo.novedades}</td>
              <td className={`${CELDA} px-2 whitespace-nowrap`}>{tipo.creado_por ?? '—'}</td>
              <td className={`${CELDA} px-2 whitespace-nowrap`}>{dia(tipo.creado_en)}</td>
              <td className={`${CELDA} px-2`}>
                <EstadoDelTipo activo={tipo.activo} />
              </td>
              <td className={`${CELDA} pr-5 pl-2`}>
                <Acciones
                  tipo={tipo}
                  ocupado={reactivando === tipo.id}
                  alElegir={(accion) => alElegir(tipo, accion)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** En el teléfono, cada tipo es una tarjeta. */
function TarjetaDeTipo({ tipo, alElegir, ocupado }) {
  const idDelTitulo = useId()
  return (
    <li>
      <article
        aria-labelledby={idDelTitulo}
        className="flex flex-col gap-1.5 rounded-xl border border-borde bg-superficie px-4 pt-3 pb-1"
      >
        <div className="flex flex-wrap items-center gap-2">
          <h2 id={idDelTitulo} className="text-cuerpo-fuerte break-words text-texto">
            {tipo.nombre}
          </h2>
          <EstadoDelTipo activo={tipo.activo} />
        </div>
        <p className="text-auxiliar text-texto-secundario">
          {cuantasNovedades(tipo.novedades)} · Creado por {tipo.creado_por ?? '—'} el{' '}
          <span className="whitespace-nowrap">{dia(tipo.creado_en)}</span>
        </p>
        <Acciones tipo={tipo} ocupado={ocupado} alElegir={(accion) => alElegir(tipo, accion)} />
      </article>
    </li>
  )
}

/**
 * El registro de cambios: fecha, usuario, acción y cambio (decisión 52).
 *
 * @param {object} props
 * @param {CambioDelCatalogo[]} props.cambios
 * @param {TipoDelCatalogo[]} props.tipos
 * @param {boolean} props.esEscritorio
 */
function RegistroDeCambios({ cambios, tipos, esEscritorio }) {
  const idDelTitulo = useId()
  const texto = (/** @type {CambioDelCatalogo} */ cambio) => textoDelCambio(cambio, tipos, cambios)

  return (
    <section aria-labelledby={idDelTitulo} className="flex flex-col gap-3 lg:gap-6">
      <h2 id={idDelTitulo} className="text-subtitulo text-texto">
        Registro de cambios
      </h2>
      {cambios.length === 0 ? (
        <p className="text-cuerpo-pequeno text-texto-secundario">
          Todavía no hay cambios en el catálogo.
        </p>
      ) : esEscritorio ? (
        <div className={`relative overflow-x-auto ${TARJETA}`}>
          <table aria-labelledby={idDelTitulo} className="w-full min-w-[48rem] border-collapse">
            <thead className="bg-gris-100">
              <tr>
                <th scope="col" className={`${ENCABEZADO} w-[150px] pr-2 pl-5`}>
                  Fecha
                </th>
                <th scope="col" className={`${ENCABEZADO} w-[190px] px-2`}>
                  Usuario
                </th>
                <th scope="col" className={`${ENCABEZADO} w-[150px] px-2`}>
                  Acción
                </th>
                <th scope="col" className={`${ENCABEZADO} pr-5 pl-2`}>
                  Cambio
                </th>
              </tr>
            </thead>
            <tbody>
              {cambios.map((cambio) => (
                <tr key={cambio.id} className="border-b border-borde last:border-b-0">
                  <td className={`${CELDA} py-3.5 pr-2 pl-5 whitespace-nowrap`}>
                    {dia(cambio.fecha)}
                  </td>
                  <td className={`${CELDA} px-2 break-words`}>{cambio.usuario ?? '—'}</td>
                  <td className={`${CELDA} px-2`}>
                    <Etiqueta>{NOMBRE_DE_ACCION[cambio.accion]}</Etiqueta>
                  </td>
                  <td className={`${CELDA} pr-5 pl-2 break-words`}>{texto(cambio)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ul aria-labelledby={idDelTitulo} className="flex flex-col gap-2.5">
          {cambios.map((cambio) => (
            <li
              key={cambio.id}
              className="flex flex-col gap-1.5 rounded-xl border border-borde bg-superficie px-4 py-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Etiqueta>{NOMBRE_DE_ACCION[cambio.accion]}</Etiqueta>
                <span className="text-auxiliar text-texto-secundario">
                  {dia(cambio.fecha)} · {cambio.usuario ?? '—'}
                </span>
              </div>
              <p className="text-cuerpo-pequeno break-words text-texto">{texto(cambio)}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default function TiposDeFalla() {
  const esEscritorio = useEsEscritorio()
  const [intento, setIntento] = useState(0)
  const [datos, setDatos] = useState({
    cargados: false,
    tipos: /** @type {TipoDelCatalogo[]} */ ([]),
    cambios: /** @type {CambioDelCatalogo[]} */ ([]),
    fallo: /** @type {import('../../core/errores/traducir.js').ErrorTraducido | null} */ (null),
  })
  /** El diálogo abierto y su tipo; al fusionar desde 31-B, también el destino. */
  const [dialogo, setDialogo] = useState(
    /** @type {{ accion: Accion, tipo: TipoDelCatalogo, destino?: TipoDelCatalogo } | null} */ (
      null
    ),
  )
  const [aviso, setAviso] = useState(
    /** @type {{ tipo: 'exito' | 'error', mensaje: string } | null} */ (null),
  )
  const [reactivando, setReactivando] = useState(/** @type {string | null} */ (null))

  // El catálogo y su registro no dependen entre sí: se piden en paralelo. Al recargar se
  // conserva lo que ya se ve hasta que llegue lo nuevo.
  useEffect(() => {
    let vigente = true
    Promise.all([listarCatalogo(), listarCambios()])
      .then(([tipos, cambios]) => {
        if (vigente) setDatos({ cargados: true, tipos, cambios, fallo: null })
      })
      .catch((error) => {
        if (vigente) setDatos((actuales) => ({ ...actuales, fallo: traducirError(error) }))
      })
    return () => {
      vigente = false
    }
  }, [intento])

  const recargar = () => setIntento((n) => n + 1)
  // Cerrar un diálogo no cierra el que lo reemplazó: «Fusionar en su lugar» cambia de diálogo
  // y el de renombrar avisa su cierre después.
  const cerrar = (/** @type {Accion} */ accion) => () =>
    setDialogo((actual) => (actual?.accion === accion ? null : actual))

  /** Después de un cambio: se cierra el diálogo, se avisa y se trae el catálogo de nuevo. */
  function hecho(/** @type {string} */ mensaje) {
    setDialogo(null)
    setAviso({ tipo: 'exito', mensaje })
    recargar()
  }

  async function reactivar(/** @type {TipoDelCatalogo} */ tipo) {
    setReactivando(tipo.id)
    setAviso(null)
    try {
      await vigilarPermiso(() => reactivarTipoFalla(tipo.id))
      hecho('Tipo de falla reactivado.')
    } catch (error) {
      setAviso({ tipo: 'error', mensaje: traducirError(error).mensaje })
    } finally {
      setReactivando(null)
    }
  }

  const { tipos, cambios, fallo } = datos
  const lista = ordenarCatalogo(tipos, cambios)
  const elegir = (/** @type {TipoDelCatalogo} */ tipo, /** @type {Accion} */ accion) =>
    accion === 'reactivar' ? reactivar(tipo) : setDialogo({ accion, tipo })
  const abierto = (/** @type {Accion} */ accion) =>
    dialogo?.accion === accion ? dialogo.tipo : null

  return (
    <section className="flex w-full flex-1 flex-col gap-3.5 px-4 pt-4 pb-6 lg:gap-6 lg:px-8 lg:pt-8 lg:pb-12">
      <header className="flex flex-col gap-1">
        <h1 className="text-titulo text-texto lg:text-display">Tipos de falla</h1>
        <p className="text-cuerpo-pequeno text-texto-secundario lg:text-cuerpo">
          Depura el catálogo para que el indicador de fallas recurrentes agrupe bien. Los tipos
          nuevos los crean las áreas al registrar soluciones.
        </p>
      </header>

      {!datos.cargados && !fallo ? (
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

      {datos.cargados ? (
        <>
          {lista.length === 0 ? (
            <p className="py-10 text-center text-cuerpo text-texto-secundario">
              Todavía no hay tipos de falla. Los crean las áreas al registrar soluciones.
            </p>
          ) : esEscritorio ? (
            <TablaDeTipos
              lista={lista}
              marcado={dialogo?.tipo.id}
              alElegir={elegir}
              reactivando={reactivando}
            />
          ) : (
            <ul aria-label="Tipos de falla" className="flex flex-col gap-2.5">
              {lista.map((tipo) => (
                <TarjetaDeTipo
                  key={tipo.id}
                  tipo={tipo}
                  alElegir={elegir}
                  ocupado={reactivando === tipo.id}
                />
              ))}
            </ul>
          )}
          <RegistroDeCambios cambios={cambios} tipos={tipos} esEscritorio={esEscritorio} />
        </>
      ) : null}

      {aviso ? (
        <AvisoTemporal tipo={aviso.tipo} alTerminar={() => setAviso(null)} className={AVISO_SUELTO}>
          {aviso.mensaje}
        </AvisoTemporal>
      ) : null}

      <DialogoRenombrarTipo
        tipo={abierto('renombrar')}
        tipos={tipos}
        alCerrar={cerrar('renombrar')}
        alRecargar={recargar}
        alRenombrar={async (nombre) => {
          await vigilarPermiso(() => renombrarTipoFalla(dialogo.tipo.id, nombre))
          hecho('Tipo de falla renombrado.')
        }}
        alFusionarEnSuLugar={(destino) =>
          setDialogo({ accion: 'fusionar', tipo: dialogo.tipo, destino })
        }
      />
      <DialogoFusionarTipos
        origen={abierto('fusionar')}
        destino={dialogo?.destino ?? null}
        activos={lista
          .filter(({ activo }) => activo)
          .toSorted((a, b) => a.nombre.localeCompare(b.nombre, 'es'))}
        alCerrar={cerrar('fusionar')}
        alRecargar={recargar}
        alFusionar={async (origenId, destinoId) => {
          await vigilarPermiso(() => fusionarTiposFalla(origenId, destinoId))
          hecho('Tipos de falla fusionados.')
        }}
      />
      <DialogoDesactivarTipo
        tipo={abierto('desactivar')}
        alCerrar={cerrar('desactivar')}
        alConfirmar={async () => {
          await vigilarPermiso(() => desactivarTipoFalla(dialogo.tipo.id))
          hecho('Tipo de falla desactivado.')
        }}
      />
    </section>
  )
}
