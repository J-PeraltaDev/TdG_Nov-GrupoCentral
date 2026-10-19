import { useEffect, useId, useRef, useState } from 'react'
import { Boton } from '../../core/ui/Boton.jsx'
import { CampoDeSeleccion } from '../../core/ui/CampoDeSeleccion.jsx'
import { CampoTexto } from '../../core/ui/CampoTexto.jsx'
import { ErrorDeCampo } from '../../core/ui/ErrorDeCampo.jsx'
import { Hoja } from '../../core/ui/Hoja.jsx'
import { Icono } from '../../core/ui/Icono.jsx'
import iconoFecha from '../../core/ui/iconos/calendar_today.svg'
import iconoQuitar from '../../core/ui/iconos/close.svg'
import iconoDesplegar from '../../core/ui/iconos/expand_more.svg'
import iconoFiltros from '../../core/ui/iconos/tune.svg'
import { useEsEscritorio } from '../../core/ui/useEsEscritorio.js'
import { NOMBRE_DE_ESTADO } from '../../core/utils/estados.js'
import {
  chipsDelFiltro,
  quitarFiltro,
  rangoInvertido,
  SIN_FILTROS,
  textoDeEstados,
  textoDelRango,
} from './filtrosDelHistorial.js'

/*
 * Filtros del historial (RF-19; Figma 21, 21-B y 21-D; plan del Sprint 5, decisiones 9 a 11).
 * Lo que se elige es un borrador: «Aplicar filtros» lo lleva a la dirección, y los chips muestran
 * lo que está en la dirección. Un chip se quita con su «×» y «Limpiar» quita todos, de una vez.
 */

/** @typedef {import('./filtrosDelHistorial.js').FiltroDelHistorial} FiltroDelHistorial */

const ERROR_DEL_RANGO = 'La fecha inicial debe ser anterior a la final'

/** Las opciones de una lista, con las inactivas marcadas (decisión 9). */
const opcionesDe = (lista, inactiva) =>
  lista.map(({ id, nombre, activo }) => ({
    valor: id,
    nombre: activo ? nombre : `${nombre} (${inactiva})`,
  }))

/**
 * Un control con el aspecto de los desplegables de 21 que abre lo suyo debajo: las casillas de
 * los estados o las dos fechas del rango (decisión 11). En el escritorio flota sobre la página
 * y se cierra con Escape, con un clic fuera o al salir de él con el teclado (por el clic y no por
 * el foco: WebKit no enfoca los botones al pulsarlos). Dentro de la hoja del teléfono ocupa su
 * lugar y no se cierra solo: si lo hiciera al tocar «Aplicar filtros», la hoja se acortaría bajo
 * el dedo.
 */
function Desplegable({
  etiqueta,
  texto,
  icono,
  error,
  idDelError,
  enHoja,
  className = '',
  children,
}) {
  const [abierto, setAbierto] = useState(false)
  const id = useId()
  const boton = useRef(null)
  const contenedor = useRef(null)

  useEffect(() => {
    if (!abierto || enHoja) return undefined
    const alPulsar = (evento) => {
      if (!contenedor.current?.contains(evento.target)) setAbierto(false)
    }
    document.addEventListener('pointerdown', alPulsar)
    return () => document.removeEventListener('pointerdown', alPulsar)
  }, [abierto, enHoja])

  return (
    // oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- Escape cierra lo que el botón abrió
    <div
      ref={contenedor}
      className={`relative flex flex-col gap-1.5 ${className}`}
      onKeyDown={(evento) => {
        if (evento.key !== 'Escape' || !abierto) return
        // Sin esto, Escape también cerraría la hoja que lo contiene.
        evento.preventDefault()
        evento.stopPropagation()
        setAbierto(false)
        boton.current.focus()
      }}
      onBlur={(evento) => {
        // Solo el teclado: con Tab, el foco pasa a otro elemento de la página.
        const destino = evento.relatedTarget
        if (!enHoja && destino && !evento.currentTarget.contains(destino)) setAbierto(false)
      }}
    >
      <span id={`${id}-etiqueta`} className="text-auxiliar-fuerte text-texto-secundario">
        {etiqueta}
      </span>
      <button
        ref={boton}
        type="button"
        aria-expanded={abierto}
        aria-controls={`${id}-panel`}
        aria-labelledby={`${id}-etiqueta ${id}-texto`}
        aria-describedby={error ? idDelError : undefined}
        onClick={() => setAbierto(!abierto)}
        className={`flex h-12 w-full cursor-pointer items-center gap-2 rounded-control bg-superficie px-3.5 text-cuerpo-pequeno text-texto disabled:cursor-not-allowed disabled:text-deshabilitado lg:h-10 ${
          error
            ? 'inset-ring-2 inset-ring-error'
            : 'inset-ring inset-ring-borde focus-visible:inset-ring-2 focus-visible:inset-ring-primario focus-visible:outline-none'
        }`}
      >
        {icono ? <Icono src={icono} tamano={18} className="text-texto-secundario" /> : null}
        <span id={`${id}-texto`} className="min-w-0 flex-1 truncate text-left">
          {texto}
        </span>
        <Icono src={iconoDesplegar} tamano={20} className="text-texto-secundario" />
      </button>
      {abierto ? (
        <div
          id={`${id}-panel`}
          className="z-20 flex flex-col gap-1 rounded-control bg-superficie p-2 inset-ring inset-ring-borde lg:absolute lg:top-full lg:mt-1 lg:min-w-full lg:drop-shadow-lg"
        >
          {children}
        </div>
      ) : null}
      {/* 21-B aparece mientras se escribe la fecha, sin enviar nada: se anuncia al aparecer. */}
      <div aria-live="polite">
        {error ? <ErrorDeCampo id={idDelError}>{error}</ErrorDeCampo> : null}
      </div>
    </div>
  )
}

/**
 * Los campos de 21 (y de la hoja de 21-D): finca, área (no para el aprobador), estado, rango de
 * fechas y tipo de falla.
 */
function Campos({ borrador, cambiar, opciones, conArea, idDelError, enHoja }) {
  const invertido = rangoInvertido(borrador)
  // En el escritorio, los anchos de Figma 21; en la hoja, todo el ancho.
  const ancho = (clase) => (enHoja ? '' : clase)
  const estados = /** @type {FiltroDelHistorial['estados']} */ (Object.keys(NOMBRE_DE_ESTADO))

  return (
    <>
      <CampoDeSeleccion
        compacto
        etiqueta="Finca"
        vacio="Todas"
        opciones={opcionesDe(opciones.fincas, 'inactiva')}
        value={borrador.finca ?? ''}
        onChange={(evento) => cambiar({ finca: evento.target.value || null })}
        className={ancho('lg:w-[150px]')}
      />
      {conArea ? (
        <CampoDeSeleccion
          compacto
          etiqueta="Área"
          vacio="Todas"
          opciones={opcionesDe(opciones.areas, 'inactiva')}
          value={borrador.area ?? ''}
          onChange={(evento) => cambiar({ area: evento.target.value || null })}
          className={ancho('lg:w-[140px]')}
        />
      ) : null}
      <Desplegable
        etiqueta="Estado"
        texto={textoDeEstados(borrador.estados)}
        enHoja={enHoja}
        className={ancho('lg:w-[180px]')}
      >
        <fieldset className="flex flex-col">
          <legend className="sr-only">Estados</legend>
          {estados.map((estado) => (
            <label
              key={estado}
              className="flex min-h-12 cursor-pointer items-center gap-3 rounded-sm px-2 text-cuerpo-pequeno whitespace-nowrap text-texto hover:bg-gris-100 lg:min-h-9"
            >
              <input
                type="checkbox"
                checked={borrador.estados.includes(estado)}
                onChange={(evento) =>
                  cambiar({
                    // En el orden de la Tabla 28, como los lee la dirección.
                    estados: estados.filter((e) =>
                      e === estado ? evento.target.checked : borrador.estados.includes(e),
                    ),
                  })
                }
                className="size-4 flex-none accent-primario"
              />
              {NOMBRE_DE_ESTADO[estado]}
            </label>
          ))}
        </fieldset>
      </Desplegable>
      <Desplegable
        etiqueta="Rango de fechas"
        texto={textoDelRango(borrador)}
        icono={iconoFecha}
        error={invertido ? ERROR_DEL_RANGO : null}
        idDelError={idDelError}
        enHoja={enHoja}
        className={ancho('lg:w-[260px]')}
      >
        <div className="flex flex-col gap-3 p-1">
          <CampoTexto
            etiqueta="Desde"
            type="date"
            value={borrador.desde ?? ''}
            conError={invertido}
            descritoPor={invertido ? idDelError : undefined}
            onChange={(evento) => cambiar({ desde: evento.target.value || null })}
          />
          <CampoTexto
            etiqueta="Hasta"
            type="date"
            value={borrador.hasta ?? ''}
            conError={invertido}
            descritoPor={invertido ? idDelError : undefined}
            onChange={(evento) => cambiar({ hasta: evento.target.value || null })}
          />
        </div>
      </Desplegable>
      <CampoDeSeleccion
        compacto
        etiqueta="Tipo de falla"
        vacio="Todos"
        opciones={opcionesDe(opciones.tipos, 'inactivo')}
        value={borrador.tipo ?? ''}
        onChange={(evento) => cambiar({ tipo: evento.target.value || null })}
        className={ancho('lg:w-[170px]')}
      />
    </>
  )
}

/** «Aplicar filtros» y «Limpiar». Con 21-B, «Aplicar» queda no disponible, con su candado. */
function BotonesDelFiltro({ invertido, idDelError, alLimpiar }) {
  return (
    <>
      <Boton
        type="submit"
        noDisponible={invertido}
        aria-describedby={invertido ? idDelError : undefined}
      >
        Aplicar filtros
      </Boton>
      <Boton tipo="texto" onClick={alLimpiar}>
        Limpiar
      </Boton>
    </>
  )
}

/** Los filtros puestos (los de la dirección), cada uno con su «×». */
function Chips({ chips, corto, alQuitar }) {
  if (chips.length === 0) return null
  return (
    // 48 px de área táctil sin pisar el chip vecino: en el teléfono los chips se separan más.
    <ul aria-label="Filtros aplicados" className="flex flex-wrap gap-3 lg:gap-2">
      {chips.map((chip) => (
        <li
          key={chip.clave}
          className={`flex items-center gap-1 rounded-full bg-primario-contenedor py-1 pr-1 pl-3 text-primario ${
            corto ? 'text-auxiliar' : 'text-etiqueta'
          }`}
        >
          {corto ? chip.corto : chip.texto}
          <button
            type="button"
            onClick={() => alQuitar(chip.clave)}
            aria-label={`Quitar el filtro ${chip.texto}`}
            className="relative flex size-6 cursor-pointer items-center justify-center rounded-full hover:bg-primario/10 after:absolute after:-inset-3 lg:after:-inset-2"
          >
            <Icono src={iconoQuitar} tamano={16} />
          </button>
        </li>
      ))}
    </ul>
  )
}

/**
 * Los filtros de 21 en el escritorio y de 21-D en el teléfono.
 *
 * @param {object} props
 * @param {FiltroDelHistorial} props.filtro El de la dirección.
 * @param {import('./filtrosDelHistorial.js').OpcionesDelHistorial} props.opciones
 * @param {boolean} props.conArea El aprobador no filtra por área: solo ve la suya (decisión 9).
 * @param {boolean} props.deshabilitado Sin conexión (decisión 13).
 * @param {(filtro: FiltroDelHistorial & { pagina: number }) => void} props.alAplicar
 * @param {import('react').ReactNode} [props.resumen] En el teléfono, junto a «Filtros (3)»: el
 *   número de novedades.
 */
export function FiltrosDelHistorial({
  filtro,
  opciones,
  conArea,
  deshabilitado,
  alAplicar,
  resumen,
}) {
  const esEscritorio = useEsEscritorio()
  const [borrador, setBorrador] = useState(filtro)
  const [hojaAbierta, setHojaAbierta] = useState(false)
  const idDelError = useId()
  const chips = chipsDelFiltro(filtro, opciones)
  const invertido = rangoInvertido(borrador)
  const cambiar = (cambio) => setBorrador((actual) => ({ ...actual, ...cambio }))

  function aplicar(evento) {
    evento.preventDefault()
    if (invertido) return
    alAplicar({ ...borrador, pagina: 0 })
    setHojaAbierta(false)
  }

  function limpiar() {
    setBorrador(SIN_FILTROS)
    alAplicar({ ...SIN_FILTROS, pagina: 0 })
    setHojaAbierta(false)
  }

  const quitar = (clave) => alAplicar(quitarFiltro(filtro, clave))

  if (!esEscritorio) {
    return (
      <fieldset disabled={deshabilitado} className="flex min-w-0 flex-col gap-2.5">
        <legend className="sr-only">Filtros</legend>
        <div className="flex items-center justify-between gap-3">
          <Boton
            tipo="secundario"
            icono={iconoFiltros}
            onClick={() => {
              setBorrador(filtro)
              setHojaAbierta(true)
            }}
          >
            {chips.length > 0 ? `Filtros (${chips.length})` : 'Filtros'}
          </Boton>
          {resumen}
        </div>
        <Chips chips={chips} corto alQuitar={quitar} />
        <Hoja abierta={hojaAbierta} alCerrar={() => setHojaAbierta(false)} titulo="Filtros">
          <form noValidate onSubmit={aplicar} className="flex flex-col gap-4">
            <Campos
              borrador={borrador}
              cambiar={cambiar}
              opciones={opciones}
              conArea={conArea}
              idDelError={idDelError}
              enHoja
            />
            <div className="flex flex-col">
              <BotonesDelFiltro invertido={invertido} idDelError={idDelError} alLimpiar={limpiar} />
            </div>
          </form>
        </Hoja>
      </fieldset>
    )
  }

  return (
    <form
      noValidate
      onSubmit={aplicar}
      aria-label="Filtros"
      className="rounded-xl border border-borde bg-superficie p-4"
    >
      <fieldset disabled={deshabilitado} className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-start gap-3">
          <Campos
            borrador={borrador}
            cambiar={cambiar}
            opciones={opciones}
            conArea={conArea}
            idDelError={idDelError}
          />
          {/* Alineados con los controles, debajo de las etiquetas. */}
          <div className="flex items-center gap-2 pt-[22px]">
            <BotonesDelFiltro invertido={invertido} idDelError={idDelError} alLimpiar={limpiar} />
          </div>
        </div>
        <Chips chips={chips} alQuitar={quitar} />
      </fieldset>
    </form>
  )
}
