import { useState } from 'react'
import { OBSERVACION_MAX_CARACTERES } from '../../core/config/parametros.js'
import { AreaDeTexto } from '../../core/ui/AreaDeTexto.jsx'
import { Boton } from '../../core/ui/Boton.jsx'
import { Hoja, IconoDeHoja } from '../../core/ui/Hoja.jsx'
import iconoRechazar from '../../core/ui/iconos/block.svg'
import {
  alternarMotivoFrecuente,
  MOTIVOS_FRECUENTES,
  motivoFrecuenteDe,
} from './motivosDeRechazo.js'

/**
 * @typedef {(motivo: string) => Promise<{ ok: boolean, fallo?: { codigo: string | null, mensaje: string } }>} AlConfirmar
 */

/**
 * El contenido de la hoja. Va aparte porque solo existe mientras la hoja está abierta: cada
 * vez que se abre, el motivo empieza en blanco.
 *
 * @param {object} props
 * @param {() => void} props.alCerrar
 * @param {AlConfirmar} props.alConfirmar
 * @param {boolean} props.enCurso
 */
function Formulario({ alCerrar, alConfirmar, enCurso }) {
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState(/** @type {string | null} */ (null))
  const frecuente = motivoFrecuenteDe(motivo)
  const sinMotivo = motivo.trim() === ''

  async function confirmar(evento) {
    evento.preventDefault()
    if (sinMotivo || enCurso) return
    const resultado = await alConfirmar(motivo.trim())
    // El único error que se corrige aquí: los demás cierran la hoja y van en el detalle.
    if (!resultado.ok && resultado.fallo?.codigo === 'DATO_OBLIGATORIO') {
      setError(resultado.fallo.mensaje)
    }
  }

  return (
    <form noValidate onSubmit={confirmar} className="flex flex-col gap-4">
      <p className="text-cuerpo-pequeno text-texto-secundario">
        La novedad se cerrará como Rechazada y la finca verá el motivo. Esta acción no se puede
        deshacer.
      </p>

      {/* La pastilla mide 32 px, como en Figma; el botón que la contiene da los 48 px de área
          táctil del teléfono, y el margen negativo conserva la separación con lo de arriba y
          lo de abajo. Si el texto no cabe en el ancho (360 px), pasa a dos líneas. */}
      <div
        role="group"
        aria-label="Motivos frecuentes"
        className="-my-2 flex flex-wrap gap-x-2 lg:my-0 lg:gap-y-2"
      >
        {MOTIVOS_FRECUENTES.map((opcion) => (
          <button
            key={opcion}
            type="button"
            aria-pressed={opcion === frecuente}
            onClick={() => {
              setMotivo(alternarMotivoFrecuente(motivo, opcion))
              setError(null)
            }}
            className="flex min-h-12 max-w-full cursor-pointer items-center rounded-2xl text-left lg:min-h-0"
          >
            <span
              className={`rounded-2xl px-3 py-1.5 text-etiqueta inset-ring ${
                opcion === frecuente
                  ? 'bg-primario-contenedor text-primario inset-ring-primario'
                  : 'bg-superficie text-texto inset-ring-borde'
              }`}
            >
              {opcion}
            </span>
          </button>
        ))}
      </div>

      <AreaDeTexto
        etiqueta="Motivo del rechazo"
        obligatorio
        maximo={OBSERVACION_MAX_CARACTERES}
        value={motivo}
        error={error}
        onChange={(evento) => {
          setMotivo(evento.target.value)
          setError(null)
        }}
      />

      <div className="flex flex-col lg:flex-row-reverse lg:justify-start lg:gap-2.5">
        <Boton
          type="submit"
          tipo="peligro"
          icono={iconoRechazar}
          disabled={sinMotivo || enCurso}
          className="w-full lg:w-auto"
        >
          {enCurso ? 'Rechazando…' : 'Rechazar novedad'}
        </Boton>
        <Boton tipo="texto" onClick={alCerrar} className="w-full lg:w-auto">
          Cancelar
        </Boton>
      </div>
    </form>
  )
}

/**
 * Hoja 16 · Rechazar novedad (RF-11 / CU-11, Figma 3:1468). Pide el motivo, que es obligatorio
 * (CU-11 3a), con tres motivos frecuentes como accesos rápidos, y advierte que el rechazo no
 * se puede deshacer.
 *
 * @param {object} props
 * @param {boolean} props.abierta
 * @param {() => void} props.alCerrar
 * @param {AlConfirmar} props.alConfirmar Recibe el motivo sin espacios sobrantes.
 * @param {boolean} props.enCurso La acción se está ejecutando.
 */
export function HojaRechazar({ abierta, alCerrar, alConfirmar, enCurso }) {
  return (
    <Hoja
      abierta={abierta}
      alCerrar={alCerrar}
      titulo="Rechazar novedad"
      icono={<IconoDeHoja src={iconoRechazar} className="bg-error-suave text-error" />}
    >
      <Formulario alCerrar={alCerrar} alConfirmar={alConfirmar} enCurso={enCurso} />
    </Hoja>
  )
}
