import { useId, useRef, useState } from 'react'
import { TIPO_FALLA_NOMBRE_MAX_CARACTERES } from '../../core/config/parametros.js'
import { traducirError } from '../../core/errores/traducir.js'
import { Aviso } from '../../core/ui/Aviso.jsx'
import { Boton } from '../../core/ui/Boton.jsx'
import { CampoTexto } from '../../core/ui/CampoTexto.jsx'
import { Dialogo } from '../../core/ui/Dialogo.jsx'
import { ErrorDeCampo } from '../../core/ui/ErrorDeCampo.jsx'
import iconoSinConexion from '../../core/ui/iconos/cloud_off.svg'
import iconoRenombrar from '../../core/ui/iconos/edit.svg'
import iconoError from '../../core/ui/iconos/error.svg'
import iconoFusionar from '../../core/ui/iconos/merge.svg'
import iconoAdvertencia from '../../core/ui/iconos/warning.svg'
import { nombreRepetido } from './catalogoDeTipos.js'

/** @typedef {import('../../core/supabase/repositorios/tiposFalla.js').TipoDelCatalogo} TipoDelCatalogo */

/**
 * @param {object} props
 * @param {TipoDelCatalogo} props.tipo
 * @param {TipoDelCatalogo[]} props.tipos Todo el catálogo, para ver el nombre repetido.
 * @param {() => void} props.alCerrar
 * @param {(nombre: string) => Promise<void>} props.alRenombrar
 * @param {(destino: TipoDelCatalogo) => void} props.alFusionarEnSuLugar
 * @param {() => void} props.alRecargar
 */
function Formulario({ tipo, tipos, alCerrar, alRenombrar, alFusionarEnSuLugar, alRecargar }) {
  const idDeError = useId()
  const campo = useRef(/** @type {HTMLInputElement | null} */ (null))
  const [nombre, setNombre] = useState(tipo.nombre)
  const [error, setError] = useState(/** @type {string | null} */ (null))
  const [fallo, setFallo] = useState(
    /** @type {import('../../core/errores/traducir.js').ErrorTraducido | null} */ (null),
  )
  const [guardando, setGuardando] = useState(false)

  // 31-B mientras se escribe: si el nombre ya es de otro tipo activo, se propone fusionarlos.
  // Con uno inactivo no se puede (decisión 49).
  const repetido = nombreRepetido(nombre, tipo.id, tipos)
  const fusionable = repetido?.activo ? repetido : null
  const errorDelCampo = repetido
    ? repetido.activo
      ? null
      : `Ya existe «${repetido.nombre}», pero está inactivo. Elige otro nombre.`
    : error

  /** @param {{ preventDefault: () => void }} evento */
  async function enviar(evento) {
    evento.preventDefault()
    if (guardando) return
    if (fusionable) return alFusionarEnSuLugar(fusionable)
    const limpio = nombre.trim().replace(/\s+/g, ' ')
    if (limpio === '') {
      setError('Escribe el nombre nuevo.')
      return campo.current?.focus()
    }
    if (errorDelCampo) return campo.current?.focus()
    if (limpio === tipo.nombre) return alCerrar()

    setGuardando(true)
    setFallo(null)
    try {
      await alRenombrar(limpio)
    } catch (excepcion) {
      const traducido = traducirError(excepcion)
      if (traducido.codigo === 'TIPO_FALLA_DUPLICADO') {
        // Otro tipo tomó el nombre después de cargar la lista: con la lista al día, 31-B.
        setError(traducido.mensaje)
        alRecargar()
      } else {
        setFallo(traducido)
      }
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

      <div className="flex flex-col gap-1.5">
        <CampoTexto
          ref={campo}
          etiqueta="Nombre nuevo"
          name="nombre"
          autoComplete="off"
          maxLength={TIPO_FALLA_NOMBRE_MAX_CARACTERES}
          value={nombre}
          conError={Boolean(errorDelCampo)}
          descritoPor={errorDelCampo ? idDeError : undefined}
          onChange={(evento) => {
            setNombre(evento.target.value)
            setError(null)
          }}
        />
        {errorDelCampo ? <ErrorDeCampo id={idDeError}>{errorDelCampo}</ErrorDeCampo> : null}
      </div>

      <div aria-live="polite">
        {fusionable ? (
          <Aviso tipo="advertencia" icono={iconoAdvertencia}>
            Ya existe «{fusionable.nombre}». ¿Quieres fusionar los dos tipos?
          </Aviso>
        ) : null}
      </div>

      <div className="flex flex-col-reverse gap-1 lg:flex-row lg:justify-end lg:gap-2.5">
        <Boton tipo="secundario" onClick={alCerrar} className="w-full lg:w-auto">
          Cancelar
        </Boton>
        <Boton
          type="submit"
          icono={fusionable ? iconoFusionar : iconoRenombrar}
          disabled={guardando}
          className="w-full lg:w-auto"
        >
          {fusionable ? 'Fusionar en su lugar' : guardando ? 'Renombrando…' : 'Renombrar'}
        </Boton>
      </div>
    </form>
  )
}

/**
 * Renombrar un tipo de falla y 31-B (RF-32 / CU-32 3 y 3a, Figma 6:2734). Si el nombre ya es
 * de otro tipo activo, ofrece fusionarlos en su lugar.
 *
 * @param {object} props
 * @param {TipoDelCatalogo | null} props.tipo El que se renombra; `null` con el diálogo cerrado.
 * @param {TipoDelCatalogo[]} props.tipos
 * @param {() => void} props.alCerrar
 * @param {(nombre: string) => Promise<void>} props.alRenombrar Renombra y cierra; si falla,
 *   lanza el error y el diálogo lo muestra sin cerrarse.
 * @param {(destino: TipoDelCatalogo) => void} props.alFusionarEnSuLugar Abre 31 con los dos.
 * @param {() => void} props.alRecargar Vuelve a pedir el catálogo.
 */
export function DialogoRenombrarTipo({ tipo, ...props }) {
  return (
    <Dialogo
      abierto={Boolean(tipo)}
      alCerrar={props.alCerrar}
      titulo="Renombrar tipo de falla"
      ancho="lg:max-w-[520px]"
    >
      {tipo ? <Formulario tipo={tipo} {...props} /> : null}
    </Dialogo>
  )
}
