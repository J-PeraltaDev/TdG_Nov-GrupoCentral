import { useId, useRef, useState } from 'react'
import { RAZON_SOCIAL_NOMBRE_MAX_CARACTERES } from '../../core/config/parametros.js'
import { traducirError } from '../../core/errores/traducir.js'
import { Aviso } from '../../core/ui/Aviso.jsx'
import { Boton } from '../../core/ui/Boton.jsx'
import { CampoTexto } from '../../core/ui/CampoTexto.jsx'
import { Dialogo } from '../../core/ui/Dialogo.jsx'
import { ErrorDeCampo } from '../../core/ui/ErrorDeCampo.jsx'
import iconoGuardar from '../../core/ui/iconos/check.svg'
import iconoSinConexion from '../../core/ui/iconos/cloud_off.svg'
import iconoError from '../../core/ui/iconos/error.svg'
import { sinTildes } from '../../core/utils/texto.js'

/** @typedef {import('../../core/supabase/repositorios/fincas.js').RazonSocial} RazonSocial */

/** El mismo texto que traduce `RAZON_SOCIAL_EXISTENTE`. */
const YA_EXISTE = 'Ya existe una razón social con ese nombre'

/**
 * El contenido del diálogo: solo existe mientras está abierto, así que cada apertura empieza
 * con el nombre de la razón social (o en blanco).
 *
 * @param {object} props
 * @param {RazonSocial | null} props.razon La que se renombra; `null` para una nueva.
 * @param {RazonSocial[]} props.razones Todas, para avisar del nombre repetido antes de guardar.
 * @param {() => void} props.alCerrar
 * @param {(nombre: string) => Promise<void>} props.alGuardar
 */
function Formulario({ razon, razones, alCerrar, alGuardar }) {
  const idDeError = useId()
  const campo = useRef(/** @type {HTMLInputElement | null} */ (null))
  const [nombre, setNombre] = useState(razon?.nombre ?? '')
  const [error, setError] = useState(/** @type {string | null} */ (null))
  const [fallo, setFallo] = useState(
    /** @type {import('../../core/errores/traducir.js').ErrorTraducido | null} */ (null),
  )
  const [guardando, setGuardando] = useState(false)

  /** @param {{ preventDefault: () => void }} evento */
  async function guardar(evento) {
    evento.preventDefault()
    if (guardando) return
    setFallo(null)
    // Como en las fincas: la restricción distingue mayúsculas y tildes; aquí se comparan como
    // las lee una persona, y la restricción queda de garantía.
    const faltante = nombre.trim() === '' ? 'Escribe el nombre de la razón social.' : null
    const repetida = razones.some(
      (otra) => otra.id !== razon?.id && sinTildes(otra.nombre) === sinTildes(nombre),
    )
    const problema = faltante ?? (repetida ? YA_EXISTE : null)
    setError(problema)
    if (problema) return campo.current?.focus()

    setGuardando(true)
    try {
      await alGuardar(nombre.trim())
    } catch (causa) {
      const traducido = traducirError(causa)
      if (traducido.codigo === 'RAZON_SOCIAL_EXISTENTE') {
        setError(traducido.mensaje)
        campo.current?.focus()
      } else {
        setFallo(traducido)
      }
      setGuardando(false)
    }
  }

  return (
    <form noValidate onSubmit={guardar} className="flex flex-col gap-4">
      {fallo ? (
        <Aviso
          tipo={fallo.tipo === 'red' ? 'advertencia' : 'error'}
          icono={fallo.tipo === 'red' ? iconoSinConexion : iconoError}
          role="alert"
        >
          {fallo.mensaje}
        </Aviso>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <CampoTexto
          ref={campo}
          etiqueta="Nombre de la razón social"
          obligatorio
          name="nombre"
          autoComplete="off"
          maxLength={RAZON_SOCIAL_NOMBRE_MAX_CARACTERES}
          value={nombre}
          conError={Boolean(error)}
          descritoPor={error ? idDeError : undefined}
          onChange={(evento) => {
            setNombre(evento.target.value)
            setError(null)
          }}
        />
        {error ? <ErrorDeCampo id={idDeError}>{error}</ErrorDeCampo> : null}
      </div>

      <div className="flex flex-col-reverse gap-1 lg:flex-row lg:justify-end lg:gap-2.5">
        <Boton tipo="secundario" onClick={alCerrar} className="w-full lg:w-auto">
          Cancelar
        </Boton>
        <Boton type="submit" icono={iconoGuardar} disabled={guardando} className="w-full lg:w-auto">
          {guardando ? 'Guardando…' : 'Guardar'}
        </Boton>
      </div>
    </form>
  )
}

/**
 * Nueva razón social y renombrar una razón social (cambio 40; sin dibujo en Figma, como 30-B).
 * El nombre no se puede repetir.
 *
 * @param {object} props
 * @param {boolean} props.abierto
 * @param {RazonSocial | null} props.razon
 * @param {RazonSocial[]} props.razones
 * @param {() => void} props.alCerrar
 * @param {(nombre: string) => Promise<void>} props.alGuardar Guarda y cierra; si falla, lanza el
 *   error y el diálogo lo muestra sin cerrarse.
 */
export function DialogoRazonSocial({ abierto, razon, razones, alCerrar, alGuardar }) {
  return (
    <Dialogo
      abierto={abierto}
      alCerrar={alCerrar}
      titulo={razon ? 'Renombrar razón social' : 'Nueva razón social'}
    >
      <Formulario razon={razon} razones={razones} alCerrar={alCerrar} alGuardar={alGuardar} />
    </Dialogo>
  )
}
