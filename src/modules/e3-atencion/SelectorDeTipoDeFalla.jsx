import { useEffect, useId, useRef, useState } from 'react'
import { TIPO_FALLA_NOMBRE_MAX_CARACTERES } from '../../core/config/parametros.js'
import { sugerirTiposFalla } from '../../core/supabase/repositorios/tiposFalla.js'
import { Aviso } from '../../core/ui/Aviso.jsx'
import { Icono } from '../../core/ui/Icono.jsx'
import iconoCrear from '../../core/ui/iconos/add.svg'
import iconoTipo from '../../core/ui/iconos/category.svg'
import iconoQuitar from '../../core/ui/iconos/close.svg'
import iconoError from '../../core/ui/iconos/error.svg'
import iconoInfo from '../../core/ui/iconos/info.svg'
import iconoBuscar from '../../core/ui/iconos/search.svg'

/*
 * Tipo de falla con autocompletado (RF-14 / CU-14 3 a 5, Figma 3:1655 y 3:1796). Sigue el
 * patrón «combobox» de ARIA con una lista de opciones: mientras la persona escribe, sugiere
 * los tipos que ya existen, con cuántas novedades tiene cada uno, y ofrece crear uno nuevo
 * solo si no hay uno igual (CU-14 5a). Quien decide de verdad es el servidor, que normaliza
 * el nombre (SDD 6.1.8).
 */

/**
 * @typedef {object} TipoElegido
 * @property {string | null} id `null` si es un tipo nuevo, que se crea al registrar la solución.
 * @property {string} nombre
 * @property {number | null} cantidad Novedades que ya tiene el tipo; `null` si es nuevo.
 */

/** Espera entre la última tecla y la consulta, para no pedir una por letra. */
export const ESPERA_DE_BUSQUEDA_MS = 250

const CAJA =
  'flex items-center gap-2 rounded-control bg-superficie px-[15px] py-[13px] text-cuerpo text-texto'
const ETIQUETA = 'flex-none rounded-md px-2 py-0.5 text-auxiliar-fuerte whitespace-nowrap'

const cuantas = (cantidad) => (cantidad === 1 ? '1 novedad' : `${cantidad} novedades`)
const arreglar = (texto) => texto.trim().replace(/\s+/g, ' ')

/**
 * @param {object} props
 * @param {TipoElegido | null} props.valor
 * @param {(valor: TipoElegido | null) => void} props.alCambiar
 * @param {string | null} [props.error]
 * @param {import('react').Ref<HTMLElement>} [props.ref] El control que recibe el foco: el
 *   campo de búsqueda o, con un tipo elegido, el botón para cambiarlo.
 */
export function SelectorDeTipoDeFalla({ valor, alCambiar, error = null, ref }) {
  const id = useId()
  const idDeLista = `${id}-lista`
  const idDeAyuda = `${id}-ayuda`
  const campo = useRef(/** @type {HTMLInputElement | null} */ (null))
  const [texto, setTexto] = useState('')
  const [abierta, setAbierta] = useState(false)
  const [activa, setActiva] = useState(-1)
  // Las sugerencias llevan el texto que las produjo: mientras no sea el que está escrito, se
  // está buscando.
  const [resultado, setResultado] = useState({ texto: '', sugerencias: [], fallo: false })

  const buscado = arreglar(texto)

  useEffect(() => {
    if (buscado === '') return undefined
    let vigente = true
    const espera = setTimeout(() => {
      sugerirTiposFalla(buscado)
        .then((sugerencias) => {
          if (vigente) setResultado({ texto: buscado, sugerencias, fallo: false })
        })
        .catch(() => {
          if (vigente) setResultado({ texto: buscado, sugerencias: [], fallo: true })
        })
    }, ESPERA_DE_BUSQUEDA_MS)
    return () => {
      vigente = false
      clearTimeout(espera)
    }
  }, [buscado])

  // Tipo elegido (Figma 3:1800): se muestra con su conteo y se puede cambiar.
  if (valor) {
    return (
      <div className="flex flex-col gap-1.5">
        <p id={id} className="text-etiqueta text-texto">
          Tipo de falla
          <span aria-hidden="true" className="ml-1 text-error">
            *
          </span>
        </p>
        <div role="group" aria-labelledby={id} className={`${CAJA} inset-ring inset-ring-borde`}>
          <Icono src={iconoTipo} tamano={20} className="flex-none text-texto-secundario" />
          <span className="min-w-0 flex-1 break-words">{valor.nombre}</span>
          <span className={`${ETIQUETA} bg-gris-100 text-texto-secundario`}>
            {valor.cantidad === null ? 'Tipo nuevo' : cuantas(valor.cantidad)}
          </span>
          <button
            ref={ref}
            type="button"
            aria-label="Cambiar el tipo de falla"
            onClick={() => {
              alCambiar(null)
              setTexto('')
              setAbierta(false)
            }}
            className="relative -my-1 -mr-1.5 flex size-8 flex-none cursor-pointer items-center justify-center rounded-control text-texto-secundario after:absolute after:-inset-2"
          >
            <Icono src={iconoQuitar} tamano={20} />
          </button>
        </div>
        <p className="text-auxiliar text-texto-secundario">
          Este dato alimenta el indicador de fallas recurrentes.
        </p>
      </div>
    )
  }

  const buscando = buscado !== '' && resultado.texto !== buscado
  const sugerencias = buscando || buscado === '' ? [] : resultado.sugerencias
  const exacta = sugerencias.find((sugerencia) => sugerencia.coincidencia_exacta) ?? null
  // La última opción crea el tipo; no se ofrece si ya hay uno igual (CU-14 5a).
  const opciones = [
    ...sugerencias.map((sugerencia) => ({ clase: 'existente', sugerencia })),
    { clase: 'nuevo', deshabilitada: Boolean(exacta) || buscando },
  ]
  const listaVisible = abierta && buscado !== ''
  const idDeOpcion = (indice) => `${id}-opcion-${indice}`

  function elegir(opcion) {
    if (opcion.clase === 'existente') {
      const { id: tipoId, nombre, cantidad_novedades: cantidad } = opcion.sugerencia
      alCambiar({ id: tipoId, nombre, cantidad })
    } else if (!opcion.deshabilitada) {
      alCambiar({ id: null, nombre: buscado, cantidad: null })
    }
  }

  /** Mueve la opción activa saltando la que no se puede elegir. */
  function mover(paso) {
    const elegibles = opciones
      .map((opcion, i) => (opcion.deshabilitada ? -1 : i))
      .filter((i) => i >= 0)
    if (elegibles.length === 0) return
    const posicion = elegibles.indexOf(activa)
    const siguiente =
      posicion === -1
        ? paso > 0
          ? 0
          : elegibles.length - 1
        : (posicion + paso + elegibles.length) % elegibles.length
    setActiva(elegibles[siguiente])
  }

  function alTeclear(evento) {
    if (evento.key === 'ArrowDown' || evento.key === 'ArrowUp') {
      evento.preventDefault()
      if (!listaVisible) setAbierta(true)
      else mover(evento.key === 'ArrowDown' ? 1 : -1)
    } else if (evento.key === 'Enter') {
      // Enter elige la opción activa; nunca envía el formulario desde aquí.
      evento.preventDefault()
      if (listaVisible && activa >= 0 && opciones[activa]) elegir(opciones[activa])
    } else if (evento.key === 'Escape' && listaVisible) {
      evento.preventDefault()
      setAbierta(false)
      setActiva(-1)
    }
  }

  const estadoDeLaBusqueda = buscando
    ? 'Buscando…'
    : resultado.fallo
      ? 'No pudimos buscar los tipos. Revisa tu conexión.'
      : sugerencias.length === 0
        ? 'Ningún tipo coincide. Puedes crear uno nuevo.'
        : sugerencias.length === 1
          ? '1 tipo coincide.'
          : `${sugerencias.length} tipos coinciden.`

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-etiqueta text-texto">
        Tipo de falla
        <span aria-hidden="true" className="ml-1 text-error">
          *
        </span>
      </label>
      <div
        className={`${CAJA} ${
          error
            ? 'inset-ring-2 inset-ring-error focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primario'
            : 'inset-ring inset-ring-borde focus-within:inset-ring-2 focus-within:inset-ring-primario'
        }`}
      >
        <Icono src={iconoBuscar} tamano={20} className="flex-none text-texto-secundario" />
        <input
          ref={(elemento) => {
            campo.current = elemento
            if (typeof ref === 'function') ref(elemento)
            else if (ref) ref.current = elemento
          }}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={listaVisible}
          aria-controls={idDeLista}
          aria-autocomplete="list"
          aria-activedescendant={listaVisible && activa >= 0 ? idDeOpcion(activa) : undefined}
          aria-required="true"
          aria-invalid={error ? true : undefined}
          aria-describedby={idDeAyuda}
          autoComplete="off"
          autoCapitalize="sentences"
          enterKeyHint="search"
          maxLength={TIPO_FALLA_NOMBRE_MAX_CARACTERES}
          placeholder="Escribe para buscar"
          value={texto}
          onChange={(evento) => {
            setTexto(evento.target.value)
            setAbierta(true)
            setActiva(-1)
          }}
          onFocus={() => setAbierta(true)}
          onBlur={() => {
            setAbierta(false)
            setActiva(-1)
          }}
          onKeyDown={alTeclear}
          className="min-w-0 flex-1 bg-transparent text-cuerpo text-texto outline-none placeholder:text-texto-secundario"
        />
        {texto ? (
          <button
            type="button"
            aria-label="Borrar lo escrito"
            // Con el ratón, el campo no pierde el foco.
            onMouseDown={(evento) => evento.preventDefault()}
            onClick={() => {
              setTexto('')
              setActiva(-1)
              campo.current?.focus()
            }}
            className="relative -my-1 -mr-1.5 flex size-8 flex-none cursor-pointer items-center justify-center rounded-control text-texto-secundario after:absolute after:-inset-2"
          >
            <Icono src={iconoQuitar} tamano={20} />
          </button>
        ) : null}
      </div>

      {/* Las sugerencias van debajo del campo, como en Figma: no tapan nada. */}
      <div
        id={idDeLista}
        role="listbox"
        aria-label="Tipos de falla"
        hidden={!listaVisible}
        className="flex flex-col overflow-clip rounded-control bg-superficie shadow-[0_8px_12px_rgb(15_20_18/0.16)] inset-ring inset-ring-borde"
      >
        {opciones.map((opcion, indice) => {
          const esActiva = indice === activa
          const comunes = {
            id: idDeOpcion(indice),
            role: 'option',
            'aria-selected': esActiva,
            // Con el ratón, el campo no pierde el foco antes de elegir.
            onMouseDown: (evento) => evento.preventDefault(),
            onClick: () => elegir(opcion),
          }
          if (opcion.clase === 'existente') {
            const { sugerencia } = opcion
            const coincide = sugerencia.coincidencia_exacta
            return (
              <div
                key={sugerencia.id}
                {...comunes}
                className={`flex min-h-12 cursor-pointer items-center gap-2 border-b border-borde px-3.5 py-3 ${
                  coincide ? 'bg-primario-contenedor' : esActiva ? 'bg-gris-100' : ''
                } ${esActiva ? 'inset-ring-2 inset-ring-primario' : ''}`}
              >
                <Icono
                  src={iconoTipo}
                  tamano={20}
                  className={`flex-none ${coincide ? 'text-primario' : 'text-texto-secundario'}`}
                />
                <span className="min-w-0 flex-1 text-etiqueta-fuerte break-words text-texto">
                  {sugerencia.nombre}
                </span>
                <span className={`${ETIQUETA} bg-gris-100 text-texto-secundario`}>
                  {cuantas(sugerencia.cantidad_novedades)}
                </span>
                {coincide ? (
                  <span className={`${ETIQUETA} bg-superficie text-primario`}>Coincide</span>
                ) : null}
              </div>
            )
          }
          return (
            <div
              key="nuevo"
              {...comunes}
              aria-disabled={opcion.deshabilitada || undefined}
              className={`flex min-h-12 items-center gap-2 px-3.5 py-3 text-cuerpo-pequeno ${
                opcion.deshabilitada ? 'text-deshabilitado' : 'cursor-pointer text-texto'
              } ${esActiva ? 'bg-gris-100 inset-ring-2 inset-ring-primario' : ''}`}
            >
              <Icono src={iconoCrear} tamano={20} className="flex-none" />
              <span className="min-w-0 flex-1 break-words">
                {buscando ? 'Buscando…' : `Crear tipo nuevo «${buscado}»`}
              </span>
            </div>
          )
        })}
      </div>

      {/* Lo que pasa con la búsqueda, para quien no ve la lista. */}
      <p role="status" className="sr-only">
        {listaVisible ? estadoDeLaBusqueda : ''}
      </p>

      {listaVisible && resultado.fallo && !buscando ? (
        <p className="text-auxiliar text-texto-secundario">
          No pudimos buscar los tipos. Revisa tu conexión.
        </p>
      ) : null}

      {exacta && exacta.nombre !== buscado ? (
        <Aviso tipo="info" icono={iconoInfo}>
          Ya existe «{exacta.nombre}». Solo cambia en mayúsculas o tildes, así que se usará el tipo
          existente.
        </Aviso>
      ) : null}

      {error ? (
        <p id={idDeAyuda} className="flex items-start gap-1 text-auxiliar text-error">
          <Icono src={iconoError} tamano={16} className="flex-none" />
          {error}
        </p>
      ) : (
        <p id={idDeAyuda} className="text-auxiliar text-texto-secundario">
          Elige uno de la lista o crea uno nuevo.
        </p>
      )}
    </div>
  )
}
