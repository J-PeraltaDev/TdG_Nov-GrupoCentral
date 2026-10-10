import { useEffect, useState } from 'react'
import { OBSERVACION_MAX_CARACTERES } from '../../core/config/parametros.js'
import { listarAreas } from '../../core/supabase/repositorios/catalogos.js'
import { AreaDeTexto } from '../../core/ui/AreaDeTexto.jsx'
import { Aviso } from '../../core/ui/Aviso.jsx'
import { Boton } from '../../core/ui/Boton.jsx'
import { Hoja } from '../../core/ui/Hoja.jsx'
import { Icono } from '../../core/ui/Icono.jsx'
import iconoHacia from '../../core/ui/iconos/arrow_forward.svg'
import iconoSinConexion from '../../core/ui/iconos/cloud_off.svg'
import iconoReasignar from '../../core/ui/iconos/swap_horiz.svg'
import { PRESENTACION_DEL_AREA } from '../../core/ui/presentacionDelArea.js'
import { BotonesDeHoja } from './BotonesDeHoja.jsx'
import { useTextoObligatorio } from './useTextoObligatorio.js'

/**
 * @typedef {{ id: string, nombre: string }} Area
 * @typedef {(destino: Area, motivo: string) => Promise<{ ok: boolean, fallo?: { codigo: string | null, mensaje: string } }>} AlConfirmarReasignacion
 */

const TARJETA = 'flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-xl p-3 text-center'
const ELEGIDA = 'bg-primario-contenedor inset-ring-2 inset-ring-primario'

/**
 * El ícono, el nombre del área y su papel en la reasignación («Área actual» o «Destino»).
 * `atenuada` apaga solo el ícono, que es decorativo: el texto conserva su contraste.
 */
function ContenidoDeArea({
  nombre,
  papel,
  claseDelPapel = 'text-texto-secundario',
  atenuada = false,
}) {
  const presentacion = PRESENTACION_DEL_AREA[nombre]
  return (
    <>
      <span
        className={`flex size-9 items-center justify-center rounded-full ${presentacion?.colores ?? 'bg-gris-100 text-texto-secundario'} ${atenuada ? 'opacity-60' : ''}`}
      >
        {presentacion ? <Icono src={presentacion.icono} tamano={18} /> : null}
      </span>
      <span className="max-w-full text-etiqueta-fuerte break-words text-texto">{nombre}</span>
      {papel ? <span className={`text-auxiliar ${claseDelPapel}`}>{papel}</span> : null}
    </>
  )
}

/**
 * El contenido de la hoja. Va aparte porque solo existe mientras la hoja está abierta: cada
 * vez que se abre, pide las áreas y el motivo empieza en blanco.
 *
 * @param {object} props
 * @param {{ area_id: string, area: string }} props.novedad
 * @param {() => void} props.alCerrar
 * @param {AlConfirmarReasignacion} props.alConfirmar
 * @param {boolean} props.enCurso
 */
function Formulario({ novedad, alCerrar, alConfirmar, enCurso }) {
  // `undefined` mientras cargan; `null` si no se pudieron cargar.
  const [areas, setAreas] = useState(/** @type {Area[] | null | undefined} */ (undefined))
  const [intento, setIntento] = useState(0)
  const [elegidaId, setElegidaId] = useState(/** @type {string | null} */ (null))

  useEffect(() => {
    let vigente = true
    listarAreas()
      .then((lista) => vigente && setAreas(lista))
      .catch(() => vigente && setAreas(null))
    return () => {
      vigente = false
    }
  }, [intento])

  // Las áreas activas del catálogo, menos la que ya tiene la novedad. Con una sola opción
  // (hoy son dos áreas) el destino queda elegido, como lo dibuja Figma.
  const destinos = (areas ?? []).filter((area) => area.id !== novedad.area_id)
  const destino =
    destinos.length === 1 ? destinos[0] : (destinos.find((a) => a.id === elegidaId) ?? null)

  const {
    texto: motivo,
    escribir,
    error,
    bloqueado,
    confirmar,
  } = useTextoObligatorio({
    alConfirmar: (texto) => alConfirmar(/** @type {Area} */ (destino), texto),
    enCurso,
    listo: Boolean(destino),
  })

  return (
    <form noValidate onSubmit={confirmar} className="flex flex-col gap-4">
      {areas === null ? (
        <Aviso
          tipo="advertencia"
          icono={iconoSinConexion}
          role="alert"
          accion={
            <Boton
              tipo="texto"
              tamano="escritorio"
              onClick={() => {
                setAreas(undefined)
                setIntento((n) => n + 1)
              }}
            >
              Reintentar
            </Boton>
          }
        >
          No pudimos cargar las áreas. Revisa tu conexión.
        </Aviso>
      ) : (
        <div className="flex items-center gap-2">
          {/* Figma dibuja esta tarjeta entera al 60 % de opacidad, y con eso «Área actual»
              queda a 2,59:1. Se apagan el fondo y el ícono; el texto va con su color. */}
          <p className={`${TARJETA} bg-gris-100 inset-ring inset-ring-borde`}>
            <ContenidoDeArea nombre={novedad.area} papel="Área actual" atenuada />
          </p>
          <Icono src={iconoHacia} tamano={24} className="flex-none text-texto" />
          <span className="sr-only">pasa a</span>

          {areas === undefined ? (
            <p role="status" className={`${TARJETA} text-cuerpo-pequeno text-texto-secundario`}>
              Cargando…
            </p>
          ) : destinos.length === 0 ? (
            <p className={`${TARJETA} text-cuerpo-pequeno text-texto-secundario`}>
              No hay otra área activa.
            </p>
          ) : destinos.length === 1 ? (
            <p className={`${TARJETA} ${ELEGIDA}`}>
              <ContenidoDeArea
                nombre={destinos[0].nombre}
                papel="Destino"
                claseDelPapel="text-primario"
              />
            </p>
          ) : (
            // Con más de un área posible, la persona elige el destino.
            <fieldset className="flex min-w-0 flex-1 flex-col gap-2">
              <legend className="sr-only">Destino</legend>
              {destinos.map((area) => (
                <label
                  key={area.id}
                  className={`${TARJETA} cursor-pointer has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primario ${
                    area.id === destino?.id ? ELEGIDA : 'bg-superficie inset-ring inset-ring-borde'
                  }`}
                >
                  <input
                    type="radio"
                    name="destino"
                    value={area.id}
                    required
                    checked={area.id === destino?.id}
                    onChange={() => setElegidaId(area.id)}
                    className="sr-only"
                  />
                  <ContenidoDeArea
                    nombre={area.nombre}
                    papel={area.id === destino?.id ? 'Destino' : null}
                    claseDelPapel="text-primario"
                  />
                </label>
              ))}
            </fieldset>
          )}
        </div>
      )}

      <AreaDeTexto
        etiqueta="Motivo de la reasignación"
        obligatorio
        maximo={OBSERVACION_MAX_CARACTERES}
        value={motivo}
        error={error}
        onChange={(evento) => escribir(evento.target.value)}
      />

      {destino ? (
        <p className="text-cuerpo-pequeno text-texto-secundario">
          La novedad pasará a la bandeja de {destino.nombre} como Asignada. Se avisará a{' '}
          {destino.nombre} y a la finca.
        </p>
      ) : null}

      <BotonesDeHoja
        icono={iconoReasignar}
        texto="Reasignar"
        textoEnCurso="Reasignando…"
        enCurso={enCurso}
        deshabilitado={bloqueado}
        alCancelar={alCerrar}
      />
    </form>
  )
}

/**
 * Hoja 17 · Reasignar a otra área (RF-17 / CU-17, Figma 3:1586). Muestra el área actual y la
 * de destino, y pide el motivo, que es obligatorio (CU-17 3a).
 *
 * @param {object} props
 * @param {boolean} props.abierta
 * @param {{ area_id: string, area: string }} props.novedad
 * @param {() => void} props.alCerrar
 * @param {AlConfirmarReasignacion} props.alConfirmar Recibe el área de destino y el motivo sin
 *   espacios sobrantes.
 * @param {boolean} props.enCurso La acción se está ejecutando.
 */
export function HojaReasignar({ abierta, novedad, alCerrar, alConfirmar, enCurso }) {
  return (
    <Hoja abierta={abierta} alCerrar={alCerrar} titulo="Reasignar a otra área">
      <Formulario
        novedad={novedad}
        alCerrar={alCerrar}
        alConfirmar={alConfirmar}
        enCurso={enCurso}
      />
    </Hoja>
  )
}
