import { useState } from 'react'
import { traducirError } from '../../core/errores/traducir.js'
import { Aviso } from '../../core/ui/Aviso.jsx'
import { Boton } from '../../core/ui/Boton.jsx'
import { Dialogo } from '../../core/ui/Dialogo.jsx'
import { IconoDeHoja } from '../../core/ui/Hoja.jsx'
import iconoDesactivar from '../../core/ui/iconos/block.svg'
import iconoTipo from '../../core/ui/iconos/category.svg'
import iconoSinConexion from '../../core/ui/iconos/cloud_off.svg'
import iconoError from '../../core/ui/iconos/error.svg'
import { avisoDeDesactivar } from './catalogoDeTipos.js'

/**
 * @param {object} props
 * @param {() => void} props.alCerrar
 * @param {() => Promise<void>} props.alConfirmar
 */
function Botones({ alCerrar, alConfirmar }) {
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
      {fallo ? (
        <Aviso
          tipo={fallo.tipo === 'red' ? 'advertencia' : 'error'}
          icono={fallo.tipo === 'red' ? iconoSinConexion : iconoError}
          role="alert"
        >
          {fallo.mensaje}
        </Aviso>
      ) : null}
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
          {enCurso ? 'Desactivando…' : 'Desactivar'}
        </Boton>
      </div>
    </div>
  )
}

/**
 * Desactivar un tipo de falla (RF-32; sin dibujo en Figma, textos de la decisión 52): sale de
 * las sugerencias y sus novedades lo conservan. No se reactiva (decisión 51).
 *
 * @param {object} props
 * @param {import('../../core/supabase/repositorios/tiposFalla.js').TipoDelCatalogo | null} props.tipo
 *   `null` con el diálogo cerrado.
 * @param {() => void} props.alCerrar
 * @param {() => Promise<void>} props.alConfirmar Desactiva y cierra; si falla, lanza el error
 *   y el diálogo lo muestra sin cerrarse.
 */
export function DialogoDesactivarTipo({ tipo, alCerrar, alConfirmar }) {
  return (
    <Dialogo
      abierto={Boolean(tipo)}
      alCerrar={alCerrar}
      titulo="Desactivar tipo de falla"
      ancho="lg:max-w-[520px]"
      descripcion={tipo ? avisoDeDesactivar(tipo) : undefined}
      icono={<IconoDeHoja src={iconoTipo} className="bg-advertencia-suave text-advertencia" />}
    >
      {tipo ? <Botones alCerrar={alCerrar} alConfirmar={alConfirmar} /> : null}
    </Dialogo>
  )
}
