import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { traducirError } from '../../core/errores/traducir.js'
import { vigilarPermiso } from '../../core/sesion/perfilVigente.js'
import {
  corregirTipoFalla,
  listarTiposActivos,
} from '../../core/supabase/repositorios/tiposFalla.js'
import { Aviso } from '../../core/ui/Aviso.jsx'
import { AvisoTemporal } from '../../core/ui/AvisoTemporal.jsx'
import { Boton } from '../../core/ui/Boton.jsx'
import { CampoDeSeleccion } from '../../core/ui/CampoDeSeleccion.jsx'
import { Dialogo } from '../../core/ui/Dialogo.jsx'
import iconoTipo from '../../core/ui/iconos/category.svg'
import iconoCorregir from '../../core/ui/iconos/check.svg'
import iconoSinConexion from '../../core/ui/iconos/cloud_off.svg'
import iconoError from '../../core/ui/iconos/error.svg'
import { AVISO_SUELTO } from '../../core/ui/posicionDelAviso.js'

/**
 * @param {object} props
 * @param {{ id: string, tipo_falla: string }} props.novedad
 * @param {() => void} props.alCerrar
 * @param {() => void} props.alCorregir
 */
function Formulario({ novedad, alCerrar, alCorregir }) {
  const campo = useRef(/** @type {HTMLSelectElement | null} */ (null))
  const [tipos, setTipos] = useState(/** @type {{ id: string, nombre: string }[] | null} */ (null))
  const [intento, setIntento] = useState(0)
  const [tipoId, setTipoId] = useState('')
  const [falta, setFalta] = useState(false)
  const [fallo, setFallo] = useState(
    /** @type {import('../../core/errores/traducir.js').ErrorTraducido | null} */ (null),
  )
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    let vigente = true
    listarTiposActivos()
      .then((activos) => {
        if (vigente) setTipos(activos)
      })
      .catch((error) => {
        if (vigente) setFallo(traducirError(error))
      })
    return () => {
      vigente = false
    }
  }, [intento])

  // El campo está deshabilitado mientras carga, así que el diálogo abre con el foco en
  // «Cancelar»: cuando llega la lista, el foco pasa a lo que hay que elegir.
  useEffect(() => {
    if (tipos) campo.current?.focus()
  }, [tipos])

  /** @param {{ preventDefault: () => void }} evento */
  async function enviar(evento) {
    evento.preventDefault()
    if (guardando || !tipos) return
    if (tipoId === '') {
      setFalta(true)
      return campo.current?.focus()
    }
    setGuardando(true)
    setFallo(null)
    try {
      await vigilarPermiso(() => corregirTipoFalla(novedad.id, tipoId))
      alCorregir()
    } catch (error) {
      const traducido = traducirError(error)
      // El tipo dejó de estar activo mientras tanto: la lista al día ya no lo ofrece.
      if (traducido.codigo === 'TIPO_FALLA_INVALIDO') {
        setTipoId('')
        setIntento((n) => n + 1)
      }
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
          accion={
            tipos ? null : (
              <Boton
                tipo="texto"
                tamano="escritorio"
                onClick={() => {
                  setFallo(null)
                  setIntento((n) => n + 1)
                }}
              >
                Reintentar
              </Boton>
            )
          }
        >
          {fallo.mensaje}
        </Aviso>
      ) : null}

      <CampoDeSeleccion
        ref={campo}
        etiqueta="Tipo correcto"
        name="tipo"
        icono={iconoTipo}
        vacio={tipos ? 'Elige el tipo correcto' : fallo ? 'Sin la lista de tipos' : 'Cargando…'}
        disabled={!tipos}
        opciones={(tipos ?? [])
          .filter(({ nombre }) => nombre !== novedad.tipo_falla)
          .map(({ id, nombre }) => ({ valor: id, nombre }))}
        value={tipoId}
        error={falta ? 'Elige el tipo correcto.' : null}
        onChange={(evento) => {
          setTipoId(evento.target.value)
          setFalta(false)
        }}
      />

      <div className="flex flex-col-reverse gap-1 lg:flex-row lg:justify-end lg:gap-2.5">
        <Boton tipo="secundario" onClick={alCerrar} className="w-full lg:w-auto">
          Cancelar
        </Boton>
        <Boton
          type="submit"
          icono={iconoCorregir}
          disabled={guardando || !tipos}
          className="w-full lg:w-auto"
        >
          {guardando ? 'Corrigiendo…' : 'Corregir'}
        </Boton>
      </div>
    </form>
  )
}

/**
 * «Corregir tipo» del detalle (22, Figma 4:2093) y su diálogo, que Figma no dibuja (decisión
 * 53): el administrador cambia el tipo de falla de una novedad cerrada por otro activo, sin
 * cambiar su estado (RF-32 / CU-32 1a). Queda en la línea de tiempo. Solo lo descarga el
 * administrador.
 *
 * @param {object} props
 * @param {{ id: string, tipo_falla: string }} props.novedad Cerrada.
 * @param {() => void} props.alCorregir Recarga el detalle.
 */
export default function CorregirTipo({ novedad, alCorregir }) {
  const [abierto, setAbierto] = useState(false)
  const [corregido, setCorregido] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        // 48 px de área táctil sin cambiar la línea del dato.
        className="relative mt-1 block cursor-pointer rounded-control text-etiqueta-fuerte text-primario after:absolute after:inset-x-0 after:-inset-y-3.5 lg:mt-0 lg:ml-3 lg:inline"
      >
        Corregir tipo
      </button>
      {/* Fuera del dato que lo abre: el diálogo no hereda su tipografía. */}
      {createPortal(
        <>
          <Dialogo
            abierto={abierto}
            alCerrar={() => setAbierto(false)}
            titulo="Corregir tipo de falla"
            descripcion={`Tipo actual: ${novedad.tipo_falla}`}
          >
            {abierto ? (
              <Formulario
                novedad={novedad}
                alCerrar={() => setAbierto(false)}
                alCorregir={() => {
                  setAbierto(false)
                  setCorregido(true)
                  alCorregir()
                }}
              />
            ) : null}
          </Dialogo>
          {corregido ? (
            <AvisoTemporal
              tipo="exito"
              alTerminar={() => setCorregido(false)}
              className={AVISO_SUELTO}
            >
              Tipo de falla corregido.
            </AvisoTemporal>
          ) : null}
        </>,
        document.body,
      )}
    </>
  )
}
