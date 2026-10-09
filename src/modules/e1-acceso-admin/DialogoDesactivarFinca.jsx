import { useState } from 'react'
import { traducirError } from '../../core/errores/traducir.js'
import { Aviso } from '../../core/ui/Aviso.jsx'
import { Boton } from '../../core/ui/Boton.jsx'
import { Dialogo } from '../../core/ui/Dialogo.jsx'
import { IconoDeHoja } from '../../core/ui/Hoja.jsx'
import iconoFinca from '../../core/ui/iconos/agriculture.svg'
import iconoDesactivar from '../../core/ui/iconos/block.svg'
import iconoSinConexion from '../../core/ui/iconos/cloud_off.svg'
import iconoError from '../../core/ui/iconos/error.svg'
import iconoAdvertencia from '../../core/ui/iconos/warning.svg'

/**
 * La advertencia de Figma (30), con su singular.
 *
 * @param {number} abiertas
 */
const advertencia = (abiertas) =>
  abiertas === 1
    ? 'Tiene 1 novedad abierta. Seguirá su curso, pero no se podrán registrar novedades nuevas para esta finca.'
    : `Tiene ${abiertas} novedades abiertas. Seguirán su curso, pero no se podrán registrar novedades nuevas para esta finca.`

/**
 * A quiénes deja sin poder registrar.
 *
 * @param {number} reportantes
 */
const quienes = (reportantes) =>
  reportantes === 1
    ? '1 reportante activo dejará de poder registrar.'
    : `${reportantes} reportantes activos dejarán de poder registrar.`

/**
 * El contenido del diálogo. Va aparte porque solo existe mientras el diálogo está abierto:
 * el error de un intento no se queda para la siguiente finca.
 *
 * @param {object} props
 * @param {import('../../core/supabase/repositorios/fincas.js').Finca} props.finca
 * @param {() => void} props.alCerrar
 * @param {() => Promise<void>} props.alConfirmar
 */
function Contenido({ finca, alCerrar, alConfirmar }) {
  const [fallo, setFallo] = useState(
    /** @type {import('../../core/errores/traducir.js').ErrorTraducido | null} */ (null),
  )
  const [enCurso, setEnCurso] = useState(false)

  async function confirmar() {
    setEnCurso(true)
    setFallo(null)
    try {
      await alConfirmar()
    } catch (error) {
      setFallo(traducirError(error))
      setEnCurso(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {finca.novedades_abiertas > 0 ? (
        <Aviso tipo="advertencia" icono={iconoAdvertencia}>
          {advertencia(finca.novedades_abiertas)}
        </Aviso>
      ) : null}
      {finca.reportantes_activos > 0 ? (
        <p className="text-cuerpo-pequeno text-texto-secundario">
          {quienes(finca.reportantes_activos)}
        </p>
      ) : null}

      {fallo ? (
        <Aviso
          tipo={fallo.tipo === 'red' ? 'advertencia' : 'error'}
          icono={fallo.tipo === 'red' ? iconoSinConexion : iconoError}
          role="alert"
        >
          {fallo.mensaje}
        </Aviso>
      ) : null}

      {/* En el teléfono van uno sobre otro, con la acción primero: con su ícono no caben en una
          fila a 360 px. El orden del teclado es el mismo en los dos formatos. */}
      <div className="flex flex-col-reverse gap-1 lg:flex-row lg:justify-end lg:gap-2.5">
        <Boton tipo="secundario" onClick={alCerrar} className="w-full lg:w-auto">
          Cancelar
        </Boton>
        <Boton
          tipo="peligro"
          icono={iconoDesactivar}
          disabled={enCurso}
          onClick={confirmar}
          className="w-full lg:w-auto"
        >
          {enCurso ? 'Desactivando…' : 'Desactivar finca'}
        </Boton>
      </div>
    </div>
  )
}

/**
 * Diálogo de la pantalla 30 · Desactivar una finca (RF-04 / CU-04 3, 3a y 3b, Figma 6:1961).
 * Siempre pide la confirmación; si la finca tiene novedades abiertas, advierte cuántas son y
 * que seguirán su curso.
 *
 * @param {object} props
 * @param {import('../../core/supabase/repositorios/fincas.js').Finca | null} props.finca La
 *   que se va a desactivar; `null` con el diálogo cerrado.
 * @param {() => void} props.alCerrar
 * @param {() => Promise<void>} props.alConfirmar Desactiva y cierra; si falla, lanza el error
 *   y el diálogo lo muestra sin cerrarse.
 */
export function DialogoDesactivarFinca({ finca, alCerrar, alConfirmar }) {
  return (
    <Dialogo
      abierto={Boolean(finca)}
      alCerrar={alCerrar}
      titulo={finca ? `¿Desactivar la finca ${finca.nombre}?` : ''}
      // Con novedades abiertas, la advertencia de Figma dice lo que hay que saber.
      descripcion={
        finca && finca.novedades_abiertas === 0
          ? 'No aparecerá para nuevos registros, pero conserva su historial.'
          : undefined
      }
      icono={<IconoDeHoja src={iconoFinca} className="bg-advertencia-suave text-advertencia" />}
    >
      {finca ? <Contenido finca={finca} alCerrar={alCerrar} alConfirmar={alConfirmar} /> : null}
    </Dialogo>
  )
}
