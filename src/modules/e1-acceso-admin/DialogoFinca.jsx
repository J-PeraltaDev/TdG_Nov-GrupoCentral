import { useId, useRef, useState } from 'react'
import { FINCA_NOMBRE_MAX_CARACTERES } from '../../core/config/parametros.js'
import { traducirError } from '../../core/errores/traducir.js'
import { Aviso } from '../../core/ui/Aviso.jsx'
import { Boton } from '../../core/ui/Boton.jsx'
import { CampoDeSeleccion } from '../../core/ui/CampoDeSeleccion.jsx'
import { CampoTexto } from '../../core/ui/CampoTexto.jsx'
import { Dialogo } from '../../core/ui/Dialogo.jsx'
import { ErrorDeCampo } from '../../core/ui/ErrorDeCampo.jsx'
import iconoGuardar from '../../core/ui/iconos/check.svg'
import iconoSinConexion from '../../core/ui/iconos/cloud_off.svg'
import iconoRazonSocial from '../../core/ui/iconos/domain.svg'
import iconoError from '../../core/ui/iconos/error.svg'
import { sinTildes } from '../../core/utils/texto.js'

/** El texto de Figma (30-B) para el nombre repetido; el mismo que traduce `FINCA_EXISTENTE`. */
const YA_EXISTE = 'Ya existe una finca con ese nombre en esta razón social'

/**
 * @typedef {import('../../core/supabase/repositorios/fincas.js').Finca} Finca
 * @typedef {(datos: { nombre: string, razonSocialId: string }) => Promise<void>} AlGuardarFinca
 */

/**
 * El contenido del diálogo. Va aparte porque solo existe mientras el diálogo está abierto:
 * cada vez que se abre, empieza con los datos de la finca (o en blanco).
 *
 * @param {object} props
 * @param {Finca | null} props.finca La que se edita; `null` para una nueva.
 * @param {{ id: string, nombre: string }[]} props.razones
 * @param {Finca[]} props.fincas Todas, para avisar del nombre repetido antes de guardar.
 * @param {() => void} props.alCerrar
 * @param {AlGuardarFinca} props.alGuardar
 */
function Formulario({ finca, razones, fincas, alCerrar, alGuardar }) {
  const idDeError = useId()
  const campoNombre = useRef(/** @type {HTMLInputElement | null} */ (null))
  const campoRazon = useRef(/** @type {HTMLSelectElement | null} */ (null))
  const [nombre, setNombre] = useState(finca?.nombre ?? '')
  const [razonSocialId, setRazonSocialId] = useState(finca?.razon_social_id ?? '')
  const [errores, setErrores] = useState(/** @type {{ nombre?: string, razon?: string }} */ ({}))
  const [fallo, setFallo] = useState(
    /** @type {import('../../core/errores/traducir.js').ErrorTraducido | null} */ (null),
  )
  const [guardando, setGuardando] = useState(false)

  /** Lo que falta o no puede ser, antes de preguntarle al servidor (CU-04 5 y 6a). */
  function validar() {
    /** @type {{ nombre?: string, razon?: string }} */
    const faltas = {}
    if (nombre.trim() === '') faltas.nombre = 'Escribe el nombre de la finca.'
    if (razonSocialId === '') faltas.razon = 'Elige la razón social.'
    // La restricción de la base distingue mayúsculas y tildes («Juanca» y «juanca» serían dos
    // fincas): aquí se comparan como las lee una persona. La restricción sigue siendo la
    // garantía si dos administradores guardan a la vez.
    const repetida =
      !faltas.nombre &&
      !faltas.razon &&
      fincas.some(
        (otra) =>
          otra.id !== finca?.id &&
          otra.razon_social_id === razonSocialId &&
          sinTildes(otra.nombre) === sinTildes(nombre),
      )
    if (repetida) faltas.nombre = YA_EXISTE
    return faltas
  }

  /** @param {{ preventDefault: () => void }} evento */
  async function guardar(evento) {
    evento.preventDefault()
    if (guardando) return
    const faltas = validar()
    setErrores(faltas)
    setFallo(null)
    if (faltas.nombre) return campoNombre.current?.focus()
    if (faltas.razon) return campoRazon.current?.focus()

    setGuardando(true)
    try {
      await alGuardar({ nombre: nombre.trim(), razonSocialId })
    } catch (error) {
      const traducido = traducirError(error)
      if (traducido.codigo === 'FINCA_EXISTENTE') {
        setErrores({ nombre: traducido.mensaje })
        campoNombre.current?.focus()
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
          ref={campoNombre}
          etiqueta="Nombre de la finca"
          obligatorio
          name="nombre"
          autoComplete="off"
          maxLength={FINCA_NOMBRE_MAX_CARACTERES}
          value={nombre}
          conError={Boolean(errores.nombre)}
          descritoPor={errores.nombre ? idDeError : undefined}
          onChange={(evento) => {
            setNombre(evento.target.value)
            setErrores((actuales) => ({ ...actuales, nombre: undefined }))
          }}
        />
        {errores.nombre ? <ErrorDeCampo id={idDeError}>{errores.nombre}</ErrorDeCampo> : null}
      </div>

      <CampoDeSeleccion
        ref={campoRazon}
        etiqueta="Razón social"
        obligatorio
        name="razon_social"
        icono={iconoRazonSocial}
        vacio="Elige la razón social"
        opciones={razones.map((razon) => ({ valor: razon.id, nombre: razon.nombre }))}
        value={razonSocialId}
        error={errores.razon}
        onChange={(evento) => {
          setRazonSocialId(evento.target.value)
          // El nombre repetido depende de la razón social: al cambiarla se vuelve a revisar.
          setErrores({})
        }}
      />

      <div className="flex gap-2.5 lg:justify-end">
        <Boton tipo="secundario" onClick={alCerrar} className="min-w-0 flex-1 lg:flex-none">
          Cancelar
        </Boton>
        <Boton
          type="submit"
          icono={iconoGuardar}
          disabled={guardando}
          className="min-w-0 flex-1 lg:flex-none"
        >
          {guardando ? 'Guardando…' : 'Guardar finca'}
        </Boton>
      </div>
    </form>
  )
}

/**
 * Diálogo 30-B · Nueva finca y editar finca (RF-04 / CU-04 4 a 6, Figma 6:2194). Pide el
 * nombre y la razón social, y no deja repetir un nombre dentro de la misma razón social
 * (CU-04 6a).
 *
 * @param {object} props
 * @param {boolean} props.abierto
 * @param {Finca | null} props.finca La que se edita; `null` para una nueva.
 * @param {{ id: string, nombre: string }[]} props.razones Razones sociales activas.
 * @param {Finca[]} props.fincas
 * @param {() => void} props.alCerrar
 * @param {AlGuardarFinca} props.alGuardar Guarda y cierra; si falla, lanza el error y el
 *   diálogo lo muestra sin cerrarse.
 */
export function DialogoFinca({ abierto, finca, razones, fincas, alCerrar, alGuardar }) {
  return (
    <Dialogo abierto={abierto} alCerrar={alCerrar} titulo={finca ? 'Editar finca' : 'Nueva finca'}>
      <Formulario
        finca={finca}
        razones={razones}
        fincas={fincas}
        alCerrar={alCerrar}
        alGuardar={alGuardar}
      />
    </Dialogo>
  )
}
