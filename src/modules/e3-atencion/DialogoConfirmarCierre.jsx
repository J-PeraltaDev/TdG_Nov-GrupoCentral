import { useState } from 'react'
import { OBSERVACION_MAX_CARACTERES } from '../../core/config/parametros.js'
import { AreaDeTexto } from '../../core/ui/AreaDeTexto.jsx'
import { Boton } from '../../core/ui/Boton.jsx'
import { Dialogo } from '../../core/ui/Dialogo.jsx'
import { IconoDeHoja } from '../../core/ui/Hoja.jsx'
import iconoResuelta from '../../core/ui/iconos/task_alt.svg'

/**
 * @typedef {(observacion: string | null) => Promise<{ ok: boolean, fallo?: { codigo: string | null, mensaje: string } }>} AlConfirmarCierre
 */

/**
 * El contenido del diálogo. Va aparte porque solo existe mientras el diálogo está abierto:
 * cada vez que se abre, la observación empieza en blanco.
 *
 * @param {object} props
 * @param {() => void} props.alCerrar
 * @param {AlConfirmarCierre} props.alConfirmar
 * @param {boolean} props.enCurso
 */
function Formulario({ alCerrar, alConfirmar, enCurso }) {
  const [observacion, setObservacion] = useState('')
  const [error, setError] = useState(/** @type {string | null} */ (null))

  /** @param {{ preventDefault: () => void }} evento */
  async function confirmar(evento) {
    evento.preventDefault()
    if (enCurso) return
    const resultado = await alConfirmar(observacion.trim() || null)
    // El único error que se corrige aquí: los demás cierran el diálogo y van en el detalle.
    if (!resultado.ok && resultado.fallo?.codigo === 'DATO_OBLIGATORIO') {
      setError(resultado.fallo.mensaje)
    }
  }

  return (
    <form noValidate onSubmit={confirmar} className="flex flex-col gap-4">
      {/* CU-15 3: «si lo desea, escribe una observación». Figma no dibuja el campo. */}
      <AreaDeTexto
        etiqueta="Observación (opcional)"
        maximo={OBSERVACION_MAX_CARACTERES}
        value={observacion}
        error={error}
        onChange={(evento) => {
          setObservacion(evento.target.value)
          setError(null)
        }}
      />

      <div className="flex gap-2.5">
        <Boton tipo="secundario" onClick={alCerrar} className="min-w-0 flex-1">
          Cancelar
        </Boton>
        <Boton type="submit" disabled={enCurso} className="min-w-0 flex-1">
          {enCurso ? 'Cerrando…' : 'Sí, cerrar'}
        </Boton>
      </div>
    </form>
  )
}

/**
 * Diálogo 09-C · Confirmar el cierre (RF-15 / CU-15 3, Figma 2:1365). Cerrar es definitivo:
 * por eso se pregunta antes. La observación es opcional.
 *
 * @param {object} props
 * @param {boolean} props.abierto
 * @param {() => void} props.alCerrar
 * @param {AlConfirmarCierre} props.alConfirmar Recibe la observación sin espacios sobrantes, o
 *   nulo si no se escribió.
 * @param {boolean} props.enCurso La acción se está ejecutando.
 */
export function DialogoConfirmarCierre({ abierto, alCerrar, alConfirmar, enCurso }) {
  return (
    <Dialogo
      abierto={abierto}
      alCerrar={alCerrar}
      titulo="¿Confirmas que la novedad quedó resuelta?"
      descripcion="Al cerrarla ya no admite más cambios."
      icono={<IconoDeHoja src={iconoResuelta} className="bg-exito-suave text-exito" />}
    >
      <Formulario alCerrar={alCerrar} alConfirmar={alConfirmar} enCurso={enCurso} />
    </Dialogo>
  )
}
