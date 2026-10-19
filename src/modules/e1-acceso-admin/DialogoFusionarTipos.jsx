import { useRef, useState } from 'react'
import { traducirError } from '../../core/errores/traducir.js'
import { Aviso } from '../../core/ui/Aviso.jsx'
import { Boton } from '../../core/ui/Boton.jsx'
import { CampoDeSeleccion } from '../../core/ui/CampoDeSeleccion.jsx'
import { Dialogo } from '../../core/ui/Dialogo.jsx'
import { Icono } from '../../core/ui/Icono.jsx'
import iconoHacia from '../../core/ui/iconos/arrow_downward.svg'
import iconoTipo from '../../core/ui/iconos/category.svg'
import iconoSinConexion from '../../core/ui/iconos/cloud_off.svg'
import iconoError from '../../core/ui/iconos/error.svg'
import iconoFusionar from '../../core/ui/iconos/merge.svg'
import { avisoDeFusion, opcionDeTipo } from './catalogoDeTipos.js'

/** @typedef {import('../../core/supabase/repositorios/tiposFalla.js').TipoDelCatalogo} TipoDelCatalogo */

/** El texto de Figma (31-C), sin punto, bajo el campo. */
const DISTINTOS = 'El tipo de origen y el de destino deben ser distintos'

/**
 * @param {object} props
 * @param {TipoDelCatalogo} props.origen
 * @param {TipoDelCatalogo | null} props.destino Ya elegido si viene de 31-B.
 * @param {TipoDelCatalogo[]} props.activos Los que se pueden elegir.
 * @param {() => void} props.alCerrar
 * @param {(origenId: string, destinoId: string) => Promise<void>} props.alFusionar
 * @param {() => void} props.alRecargar
 */
function Formulario({ origen, destino, activos, alCerrar, alFusionar, alRecargar }) {
  const campoOrigen = useRef(/** @type {HTMLSelectElement | null} */ (null))
  const campoDestino = useRef(/** @type {HTMLSelectElement | null} */ (null))
  const [elegidos, setElegidos] = useState({ origen: origen.id, destino: destino?.id ?? '' })
  const [intentado, setIntentado] = useState(false)
  const [fallo, setFallo] = useState(
    /** @type {import('../../core/errores/traducir.js').ErrorTraducido | null} */ (null),
  )
  const [guardando, setGuardando] = useState(false)

  const elegidoOrigen = activos.find(({ id }) => id === elegidos.origen)
  const elegidoDestino = activos.find(({ id }) => id === elegidos.destino)
  const origenId = elegidoOrigen?.id ?? ''
  const destinoId = elegidoDestino?.id ?? ''
  const iguales = origenId !== '' && origenId === destinoId
  const opciones = activos.map((tipo) => ({ valor: tipo.id, nombre: opcionDeTipo(tipo) }))

  /** @param {{ preventDefault: () => void }} evento */
  async function enviar(evento) {
    evento.preventDefault()
    if (guardando || iguales) return
    setIntentado(true)
    if (origenId === '') return campoOrigen.current?.focus()
    if (destinoId === '') return campoDestino.current?.focus()

    setGuardando(true)
    setFallo(null)
    try {
      await alFusionar(origenId, destinoId)
    } catch (excepcion) {
      const traducido = traducirError(excepcion)
      // Uno de los dos dejó de estar activo mientras tanto: la lista al día muestra lo que queda.
      if (traducido.codigo === 'TIPO_FALLA_INVALIDO') alRecargar()
      setFallo(traducido)
      setGuardando(false)
    }
  }

  return (
    <form noValidate onSubmit={enviar} className="flex flex-col gap-4">
      {fallo ? (
        <Aviso
          tipo={fallo.tipo === 'red' ? 'advertencia' : 'error'}
          icono={fallo.tipo === 'red' ? iconoSinConexion : iconoError}
          role="alert"
        >
          {fallo.mensaje}
        </Aviso>
      ) : null}

      <CampoDeSeleccion
        ref={campoOrigen}
        etiqueta="Tipo de origen"
        name="origen"
        icono={iconoTipo}
        vacio="Elige el tipo de origen"
        opciones={opciones}
        value={origenId}
        error={intentado && origenId === '' ? 'Elige el tipo de origen.' : null}
        onChange={(evento) => setElegidos({ ...elegidos, origen: evento.target.value })}
      />
      <Icono src={iconoHacia} tamano={24} className="self-center text-texto-secundario" />
      <CampoDeSeleccion
        ref={campoDestino}
        etiqueta="Tipo de destino"
        name="destino"
        icono={iconoTipo}
        vacio="Elige el tipo de destino"
        opciones={opciones}
        value={destinoId}
        error={
          iguales ? DISTINTOS : intentado && destinoId === '' ? 'Elige el tipo de destino.' : null
        }
        onChange={(evento) => setElegidos({ ...elegidos, destino: evento.target.value })}
      />

      <div aria-live="polite">
        {elegidoOrigen && elegidoDestino && !iguales ? (
          <Aviso tipo="info" icono={iconoFusionar}>
            {avisoDeFusion(elegidoOrigen, elegidoDestino)}
          </Aviso>
        ) : null}
      </div>

      <div className="flex flex-col-reverse gap-1 lg:flex-row lg:justify-end lg:gap-2.5">
        <Boton tipo="secundario" onClick={alCerrar} className="w-full lg:w-auto">
          Cancelar
        </Boton>
        <Boton
          type="submit"
          icono={iconoFusionar}
          noDisponible={iguales}
          disabled={guardando}
          className="w-full lg:w-auto"
        >
          {guardando ? 'Fusionando…' : 'Fusionar'}
        </Boton>
      </div>
    </form>
  )
}

/**
 * Fusionar dos tipos de falla y 31-C (RF-32 / CU-32 4 y 4a, Figma 6:2438 y 6:3019): las
 * novedades del origen pasan al destino y el origen sale de la lista.
 *
 * @param {object} props
 * @param {TipoDelCatalogo | null} props.origen `null` con el diálogo cerrado.
 * @param {TipoDelCatalogo | null} props.destino
 * @param {TipoDelCatalogo[]} props.activos
 * @param {() => void} props.alCerrar
 * @param {(origenId: string, destinoId: string) => Promise<void>} props.alFusionar Fusiona y
 *   cierra; si falla, lanza el error y el diálogo lo muestra sin cerrarse.
 * @param {() => void} props.alRecargar
 */
export function DialogoFusionarTipos({ origen, ...props }) {
  return (
    <Dialogo
      abierto={Boolean(origen)}
      alCerrar={props.alCerrar}
      titulo="Fusionar tipos de falla"
      ancho="lg:max-w-[520px]"
    >
      {origen ? <Formulario origen={origen} {...props} /> : null}
    </Dialogo>
  )
}
