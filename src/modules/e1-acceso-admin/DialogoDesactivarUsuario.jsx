import { useState } from 'react'
import { traducirError } from '../../core/errores/traducir.js'
import { Aviso } from '../../core/ui/Aviso.jsx'
import { Boton } from '../../core/ui/Boton.jsx'
import { Dialogo } from '../../core/ui/Dialogo.jsx'
import { IconoDeHoja } from '../../core/ui/Hoja.jsx'
import iconoSinConexion from '../../core/ui/iconos/cloud_off.svg'
import iconoError from '../../core/ui/iconos/error.svg'
import iconoDesactivar from '../../core/ui/iconos/person_off.svg'
import iconoAdvertencia from '../../core/ui/iconos/warning.svg'

/**
 * El contenido del diálogo. Va aparte porque solo existe mientras el diálogo está abierto: el
 * error de un intento no se queda para el siguiente usuario.
 *
 * @param {object} props
 * @param {string | null} props.advertencia
 * @param {() => void} props.alCerrar
 * @param {() => Promise<void>} props.alConfirmar
 */
function Contenido({ advertencia, alCerrar, alConfirmar }) {
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
      {advertencia ? (
        <Aviso tipo="advertencia" icono={iconoAdvertencia}>
          {advertencia}
        </Aviso>
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

      <div className="flex gap-2.5 lg:justify-end">
        <Boton tipo="secundario" onClick={alCerrar} className="min-w-0 flex-1 lg:flex-none">
          Cancelar
        </Boton>
        <Boton
          tipo="peligro"
          icono={iconoDesactivar}
          disabled={enCurso}
          onClick={confirmar}
          className="min-w-0 flex-1 lg:flex-none"
        >
          {enCurso ? 'Desactivando…' : 'Desactivar'}
        </Boton>
      </div>
    </div>
  )
}

/**
 * Diálogo 28-B · Desactivar un usuario (RF-03 / CU-03 3a, Figma 6:1098). El usuario deja de
 * poder ingresar; sus novedades y su historial se conservan.
 *
 * @param {object} props
 * @param {{ nombre: string } | null} props.usuario El que se va a desactivar; `null` con el
 *   diálogo cerrado.
 * @param {string | null} [props.advertencia] Si deja su área o su finca sin nadie.
 * @param {() => void} props.alCerrar
 * @param {() => Promise<void>} props.alConfirmar Desactiva y cierra; si falla, lanza el error
 *   y el diálogo lo muestra sin cerrarse.
 */
export function DialogoDesactivarUsuario({ usuario, advertencia = null, alCerrar, alConfirmar }) {
  return (
    <Dialogo
      abierto={Boolean(usuario)}
      alCerrar={alCerrar}
      titulo={usuario ? `¿Desactivar a ${usuario.nombre}?` : ''}
      descripcion="No podrá ingresar a la plataforma. Sus novedades y su historial se conservan."
      icono={<IconoDeHoja src={iconoDesactivar} className="bg-error-suave text-error" />}
    >
      <Contenido advertencia={advertencia} alCerrar={alCerrar} alConfirmar={alConfirmar} />
    </Dialogo>
  )
}
