import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { DESCRIPCION_MAX_CARACTERES } from '../../core/config/parametros.js'
import { useEnLinea } from '../../core/conexion/useEnLinea.js'
import { useSesion } from '../../core/sesion/ContextoSesion.js'
import { listarAreas } from '../../core/supabase/repositorios/catalogos.js'
import { Aviso } from '../../core/ui/Aviso.jsx'
import { Boton } from '../../core/ui/Boton.jsx'
import { Conexion } from '../../core/ui/Conexion.jsx'
import { Icono } from '../../core/ui/Icono.jsx'
import iconoFinca from '../../core/ui/iconos/agriculture.svg'
import iconoElegida from '../../core/ui/iconos/check_circle.svg'
import iconoCerrar from '../../core/ui/iconos/close.svg'
import iconoSinConexion from '../../core/ui/iconos/cloud_off.svg'
import iconoMantenimiento from '../../core/ui/iconos/construction.svg'
import iconoError from '../../core/ui/iconos/error.svg'
import iconoBloqueado from '../../core/ui/iconos/lock.svg'
import iconoMarcado from '../../core/ui/iconos/radio_button_checked.svg'
import iconoSinMarcar from '../../core/ui/iconos/radio_button_unchecked.svg'
import iconoSistemas from '../../core/ui/iconos/router.svg'
import iconoEnviar from '../../core/ui/iconos/send.svg'
import { Prioridad } from '../../core/ui/Prioridad.jsx'
import { crearBorrador, enviarNovedad } from './enviarNovedad.js'
import { resumenDeFaltantes, validarNovedad } from './validarNovedad.js'

/*
 * Pantalla 05 · Registrar novedad y 05-C · Campos obligatorios faltantes (RF-05, CU-05).
 * Figma 2:423 y 2:657. La fotografía (RF-08) y el registro sin conexión (05-B, RF-21) llegan
 * en el Sprint 4.
 */

/** Las cuatro prioridades con su criterio: ayudan a elegir sin tener que recordar. */
const PRIORIDADES = [
  {
    valor: 'critico',
    criterio: 'Detiene la operación o el ingreso del personal',
    elegida: 'bg-error-suave inset-ring-prioridad-critico',
    marca: 'text-prioridad-critico',
  },
  {
    valor: 'alto',
    criterio: 'Afecta la operación, pero se puede seguir trabajando',
    elegida: 'bg-advertencia-suave inset-ring-prioridad-alto',
    marca: 'text-prioridad-alto',
  },
  {
    valor: 'normal',
    criterio: 'Se puede programar en los próximos días',
    elegida: 'bg-info-suave inset-ring-prioridad-normal',
    marca: 'text-prioridad-normal',
  },
  {
    valor: 'bajo',
    criterio: 'Daño menor o mejora',
    elegida: 'bg-gris-100 inset-ring-prioridad-bajo',
    marca: 'text-prioridad-bajo',
  },
]

/** Qué atiende cada área. Las áreas vienen del catálogo; esto es solo su presentación. */
const PRESENTACION_DEL_AREA = {
  Mantenimiento: {
    icono: iconoMantenimiento,
    colores: 'bg-advertencia-suave text-area-mantenimiento',
    atiende: 'Infraestructura, puentes, bombas, equipos y herramientas',
  },
  Sistemas: {
    icono: iconoSistemas,
    colores: 'bg-info-suave text-area-sistemas',
    atiende: 'Internet, biométricos, torniquetes y equipos de cómputo',
  },
}

// El botón de opción real queda oculto a la vista; el foco se dibuja en la tarjeta.
const TARJETA =
  'relative flex cursor-pointer flex-col rounded-xl has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primario'

function Obligatorio() {
  return (
    <span aria-hidden="true" className="ml-1 text-error">
      *
    </span>
  )
}

function ErrorDeCampo({ id, className = '', children }) {
  return (
    <p id={id} className={`flex items-start gap-1 text-auxiliar text-error ${className}`}>
      <Icono src={iconoError} tamano={16} />
      {children}
    </p>
  )
}

export default function RegistrarNovedad() {
  const { perfil } = useSesion()
  const navegar = useNavigate()
  const enLinea = useEnLinea()

  /** @type {[{ id: string, nombre: string }[] | null, Function]} `null` mientras cargan. */
  const [areas, setAreas] = useState(null)
  const [sinAreas, setSinAreas] = useState(false)
  const [intentoDeAreas, setIntentoDeAreas] = useState(0)

  const [descripcion, setDescripcion] = useState('')
  const [prioridad, setPrioridad] = useState('')
  const [areaId, setAreaId] = useState('')
  /** @type {[ReturnType<typeof validarNovedad>, Function]} */
  const [errores, setErrores] = useState({})
  /** @type {[import('../../core/errores/traducir.js').ErrorTraducido | null, Function]} */
  const [fallo, setFallo] = useState(null)
  const [enviando, setEnviando] = useState(false)

  // El identificador local y la fecha real de registro se fijan antes del primer envío y se
  // conservan en los reintentos (RNF-08, RNF-09).
  const borrador = useRef(null)

  useEffect(() => {
    let vigente = true
    listarAreas()
      .then((lista) => {
        if (!vigente) return
        setAreas(lista)
        setSinAreas(false)
      })
      .catch(() => vigente && setSinAreas(true))
    return () => {
      vigente = false
    }
  }, [intentoDeAreas])

  const faltantes = Object.keys(errores).length

  /** Al corregir un campo se le quita la señal de error, sin esperar al siguiente envío. */
  function quitarError(campo) {
    setErrores((actuales) => {
      if (!actuales[campo]) return actuales
      const resto = { ...actuales }
      delete resto[campo]
      return resto
    })
  }

  async function alEnviar(evento) {
    evento.preventDefault()
    const formulario = evento.currentTarget
    const encontrados = validarNovedad({ descripcion, prioridad, areaId })
    setErrores(encontrados)
    setFallo(null)

    if (Object.keys(encontrados).length > 0) {
      // CU-05 4a: señala los campos y lleva el foco al primero que falta.
      const campo = encontrados.descripcion
        ? 'descripcion'
        : encontrados.prioridad
          ? 'prioridad'
          : 'area'
      formulario.querySelector(`[name="${campo}"]`)?.focus()
      return
    }

    borrador.current = {
      ...(borrador.current ?? crearBorrador({ descripcion, prioridad, areaId })),
      descripcion: descripcion.trim(),
      prioridad,
      area_id: areaId,
    }

    setEnviando(true)
    const resultado = await enviarNovedad(borrador.current)
    setEnviando(false)

    if (resultado.ok) {
      const area = areas?.find((a) => a.id === resultado.novedad.area_id)
      navegar('/registrar/recibida', {
        replace: true,
        state: { novedad: resultado.novedad, area: area?.nombre ?? '' },
      })
      return
    }
    // Error de negocio o de red: se informa y el formulario conserva lo escrito.
    setFallo(resultado)
  }

  const finca = perfil.finca
    ? [perfil.finca.nombre, perfil.finca.razon_social?.nombre].filter(Boolean).join(' · ')
    : 'Sin finca asignada'

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 flex h-15 items-center border-b border-borde bg-superficie pr-2 lg:hidden">
        <Link
          to="/novedades"
          aria-label="Cerrar sin registrar"
          className="flex size-12 flex-none items-center justify-center rounded-control text-texto"
        >
          <Icono src={iconoCerrar} tamano={24} />
        </Link>
        <p aria-hidden="true" className="min-w-0 flex-1 truncate text-subtitulo text-texto">
          Registrar novedad
        </p>
        <Conexion estado={enLinea ? 'en_linea' : 'sin_conexion'} className="flex-none" />
      </header>

      <form noValidate onSubmit={alEnviar} className="mx-auto flex w-full max-w-xl flex-1 flex-col">
        <div className="flex flex-1 flex-col gap-5 px-4 pt-4 pb-6 lg:px-8 lg:pt-8">
          <h1 className="sr-only text-titulo text-texto lg:not-sr-only">Registrar novedad</h1>

          {faltantes > 0 ? (
            <Aviso tipo="error" icono={iconoError} role="alert">
              {resumenDeFaltantes(faltantes)}
            </Aviso>
          ) : null}

          {fallo?.tipo === 'red' ? (
            <Aviso
              tipo="advertencia"
              icono={iconoSinConexion}
              titulo="La novedad no se envió"
              role="alert"
            >
              {fallo.mensaje} Lo que escribiste sigue aquí.
            </Aviso>
          ) : null}
          {fallo && fallo.tipo !== 'red' ? (
            <Aviso tipo="error" icono={iconoError} role="alert">
              {fallo.mensaje}
            </Aviso>
          ) : null}

          {/* Finca: precargada y bloqueada. El servidor usa siempre la del reportante. */}
          <div className="flex flex-col gap-1.5">
            <p id="etiqueta-finca" className="text-etiqueta text-texto">
              Finca
            </p>
            <p
              aria-labelledby="etiqueta-finca"
              className="flex items-center gap-2 rounded-control bg-gris-100 px-[15px] py-[13px] text-cuerpo text-texto inset-ring inset-ring-borde"
            >
              <Icono src={iconoFinca} tamano={20} className="text-texto-secundario" />
              <span className="min-w-0 flex-1">{finca}</span>
              <Icono src={iconoBloqueado} tamano={18} className="text-texto-secundario" />
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="descripcion" className="text-etiqueta text-texto">
              ¿Qué está pasando?
              <Obligatorio />
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              rows={2}
              required
              maxLength={DESCRIPCION_MAX_CARACTERES}
              value={descripcion}
              onChange={(evento) => {
                setDescripcion(evento.target.value)
                if (evento.target.value.trim() !== '') quitarError('descripcion')
              }}
              placeholder="Describe la novedad"
              aria-invalid={errores.descripcion ? true : undefined}
              aria-describedby={errores.descripcion ? 'error-descripcion' : 'ayuda-descripcion'}
              className={`block min-h-24 w-full resize-y rounded-control bg-superficie px-[15px] py-[13px] text-cuerpo text-texto placeholder:text-texto-secundario ${
                errores.descripcion
                  ? 'inset-ring-2 inset-ring-error'
                  : 'inset-ring inset-ring-borde focus-visible:inset-ring-2 focus-visible:inset-ring-primario focus-visible:outline-none'
              }`}
            />
            {errores.descripcion ? (
              <ErrorDeCampo id="error-descripcion">{errores.descripcion}</ErrorDeCampo>
            ) : (
              <p className="flex items-start gap-2 text-auxiliar text-texto-secundario">
                <span id="ayuda-descripcion" className="min-w-0 flex-1">
                  Describe lo que ves: qué equipo o lugar, dónde está y desde cuándo.
                </span>
                <span className="flex-none">
                  <span className="sr-only">Caracteres: </span>
                  {descripcion.length}/{DESCRIPCION_MAX_CARACTERES}
                </span>
              </p>
            )}
          </div>

          <fieldset
            className="min-w-0"
            aria-describedby={errores.prioridad ? 'error-prioridad' : undefined}
          >
            <legend className="mb-2 text-etiqueta text-texto">
              Prioridad
              <Obligatorio />
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {PRIORIDADES.map(({ valor, criterio, elegida, marca }) => {
                const marcada = prioridad === valor
                return (
                  <label
                    key={valor}
                    className={`${TARJETA} gap-1.5 p-[13px] ${
                      marcada
                        ? `inset-ring-2 ${elegida}`
                        : `bg-superficie inset-ring ${errores.prioridad ? 'inset-ring-error' : 'inset-ring-borde'}`
                    }`}
                  >
                    <input
                      type="radio"
                      name="prioridad"
                      value={valor}
                      required
                      checked={marcada}
                      onChange={() => {
                        setPrioridad(valor)
                        quitarError('prioridad')
                      }}
                      className="sr-only"
                    />
                    <span className="flex items-center justify-between gap-1.5">
                      <Prioridad prioridad={valor} />
                      <Icono
                        src={marcada ? iconoMarcado : iconoSinMarcar}
                        tamano={20}
                        className={marcada ? marca : 'text-texto-secundario'}
                      />
                    </span>
                    <span className="text-auxiliar text-texto-secundario">{criterio}</span>
                  </label>
                )
              })}
            </div>
            {errores.prioridad ? (
              <ErrorDeCampo id="error-prioridad" className="mt-2">
                {errores.prioridad}
              </ErrorDeCampo>
            ) : null}
          </fieldset>

          <fieldset className="min-w-0" aria-describedby={errores.area ? 'error-area' : undefined}>
            <legend className="mb-2 text-etiqueta text-texto">
              Área que debe atenderla
              <Obligatorio />
            </legend>
            {sinAreas ? (
              <Aviso
                tipo="advertencia"
                icono={iconoSinConexion}
                accion={
                  <Boton
                    tipo="texto"
                    tamano="escritorio"
                    onClick={() => setIntentoDeAreas((n) => n + 1)}
                  >
                    Reintentar
                  </Boton>
                }
              >
                No pudimos cargar las áreas. Revisa tu conexión.
              </Aviso>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {(areas ?? []).map((area) => {
                  const marcada = areaId === area.id
                  const presentacion = PRESENTACION_DEL_AREA[area.nombre]
                  return (
                    <label
                      key={area.id}
                      className={`${TARJETA} gap-2 p-[15px] ${
                        marcada
                          ? 'bg-primario-contenedor inset-ring-2 inset-ring-primario'
                          : `bg-superficie inset-ring ${errores.area ? 'inset-ring-error' : 'inset-ring-borde'}`
                      }`}
                    >
                      <input
                        type="radio"
                        name="area"
                        value={area.id}
                        required
                        checked={marcada}
                        onChange={() => {
                          setAreaId(area.id)
                          quitarError('area')
                        }}
                        className="sr-only"
                      />
                      <span className="flex items-center justify-between gap-1.5">
                        <span
                          className={`flex size-9 items-center justify-center rounded-full ${presentacion?.colores ?? 'bg-gris-100 text-texto-secundario'}`}
                        >
                          {presentacion ? <Icono src={presentacion.icono} tamano={18} /> : null}
                        </span>
                        <Icono
                          src={marcada ? iconoElegida : iconoSinMarcar}
                          tamano={20}
                          className={marcada ? 'text-primario' : 'text-texto-secundario'}
                        />
                      </span>
                      <span className="text-cuerpo-fuerte text-texto">{area.nombre}</span>
                      {presentacion ? (
                        <span className="text-auxiliar text-texto-secundario">
                          {presentacion.atiende}
                        </span>
                      ) : null}
                    </label>
                  )
                })}
              </div>
            )}
            {errores.area ? (
              <ErrorDeCampo id="error-area" className="mt-2">
                {errores.area}
              </ErrorDeCampo>
            ) : null}
          </fieldset>
        </div>

        {/* En el teléfono la barra de acciones queda fija abajo; en el escritorio cierra el
            formulario. */}
        <div className="sticky bottom-0 flex flex-col gap-2.5 border-t border-borde bg-superficie px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_-4px_6px_rgb(0_0_0/0.06)] lg:static lg:border-t-0 lg:bg-transparent lg:px-8 lg:pt-0 lg:pb-8 lg:shadow-none">
          <p className="text-center text-auxiliar text-texto-secundario">
            Se registrará con la fecha y hora actual y tu usuario
          </p>
          <Boton type="submit" icono={iconoEnviar} disabled={enviando} className="w-full">
            {enviando ? 'Enviando…' : 'Enviar novedad'}
          </Boton>
        </div>
      </form>
    </div>
  )
}
