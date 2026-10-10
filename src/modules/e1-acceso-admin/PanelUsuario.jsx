import { useId, useRef, useState } from 'react'
import { traducirError } from '../../core/errores/traducir.js'
import { nombreCompletoDeRol, ROL } from '../../core/sesion/roles.js'
import { Aviso } from '../../core/ui/Aviso.jsx'
import { Boton } from '../../core/ui/Boton.jsx'
import { CampoDeSeleccion } from '../../core/ui/CampoDeSeleccion.jsx'
import { CampoTexto } from '../../core/ui/CampoTexto.jsx'
import { ErrorDeCampo } from '../../core/ui/ErrorDeCampo.jsx'
import { Icono } from '../../core/ui/Icono.jsx'
import iconoFinca from '../../core/ui/iconos/agriculture.svg'
import iconoGenerar from '../../core/ui/iconos/autorenew.svg'
import iconoGuardar from '../../core/ui/iconos/check.svg'
import iconoSinConexion from '../../core/ui/iconos/cloud_off.svg'
import iconoError from '../../core/ui/iconos/error.svg'
import iconoContrasena from '../../core/ui/iconos/key.svg'
import iconoCorreo from '../../core/ui/iconos/mail.svg'
import iconoMarcado from '../../core/ui/iconos/radio_button_checked.svg'
import iconoSinMarcar from '../../core/ui/iconos/radio_button_unchecked.svg'
import iconoAdvertencia from '../../core/ui/iconos/warning.svg'
import { Panel } from '../../core/ui/Panel.jsx'
import { PRESENTACION_DEL_AREA } from '../../core/ui/presentacionDelArea.js'
import { esContrasenaValida } from '../../core/utils/contrasena.js'
import { advertenciaDeAlcance } from './advertenciaDeAlcance.js'
import { generarContrasena } from './generarContrasena.js'

/*
 * Pantallas 29 y 29-B · Nuevo usuario y editar usuario (RF-03 / CU-03 4 a 6). Figma 6:1343 y
 * 6:1651. El rol decide qué más se pregunta: la finca del reportante o el área del aprobador.
 *
 * La contraseña inicial vive solo en este formulario: no se guarda en el navegador ni se
 * registra, y desaparece al cerrarlo. Editar no la muestra: cambiarla es otro caso de uso
 * (RF-02). El correo tampoco se edita.
 */

/**
 * @typedef {import('../../core/supabase/repositorios/usuarios.js').Usuario} Usuario
 * @typedef {(datos: Record<string, any>) => Promise<void>} AlGuardarUsuario
 */

/** Los cuatro roles con el texto de Figma. */
const ROLES = [
  { id: ROL.REPORTANTE, descripcion: 'Registra novedades de su finca y confirma el cierre' },
  { id: ROL.APROBADOR_AREA, descripcion: 'Atiende las novedades de Mantenimiento o de Sistemas' },
  { id: ROL.DIRECTOR_AGRICULTURA, descripcion: 'Aprueba o rechaza las novedades escaladas' },
  { id: ROL.ADMINISTRADOR, descripcion: 'Gestiona usuarios, fincas y tipos de falla' },
]

/** Lo que dice cada campo cuando falta o no sirve (CU-03 6b). */
const FALTA = {
  nombre: 'Escribe el nombre completo.',
  correo: 'Escribe un correo válido.',
  contrasena_inicial: 'Usa mínimo 8 caracteres, con al menos una letra y un número.',
  rol_id: 'Elige el rol.',
  finca_id: 'Elige la finca.',
  area_id: 'Elige el área.',
}

/** Cuando lo rechaza el servidor: la finca y el área salen de la lista, así que el problema es
 * que dejaron de estar activas. */
const RECHAZO = { ...FALTA, finca_id: 'Elige una finca activa.', area_id: 'Elige un área activa.' }

/** El orden de los campos en el formulario: el foco va al primero que tenga un error. */
const ORDEN = ['nombre', 'correo', 'contrasena_inicial', 'rol_id', 'finca_id', 'area_id']

/** El texto de Figma (29) bajo el correo; el mismo caso que traduce `CORREO_EXISTENTE`. */
const CORREO_REGISTRADO = 'Este correo ya está registrado'
const PROPIO = 'No puedes cambiar tu propio rol ni desactivar tu cuenta.'

/** La misma forma mínima que revisa la función: algo, una arroba y un dominio con punto. */
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const TARJETA_DE_ROL =
  'flex flex-col gap-0.5 rounded-control px-3.5 py-3 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primario'

/** El objeto sin esas claves. */
function sin(objeto, ...claves) {
  const copia = { ...objeto }
  for (const clave of claves) delete copia[clave]
  return copia
}

function Ayuda({ id, children }) {
  return (
    <p id={id} className="text-auxiliar text-texto-secundario">
      {children}
    </p>
  )
}

/**
 * El contenido del panel. Va aparte porque solo existe mientras el panel está abierto: cada
 * vez que se abre empieza con los datos del usuario, o en blanco.
 *
 * @param {object} props
 * @param {Usuario | null} props.usuario El que se edita; `null` para uno nuevo.
 * @param {string} props.yoId Quien está usando la pantalla.
 * @param {Usuario[]} props.usuarios Todos, para advertir si el cambio deja un alcance sin nadie.
 * @param {{ id: string, nombre: string, activo: boolean, razon_social: string, novedades_abiertas: number }[]} props.fincas
 * @param {{ id: string, nombre: string }[]} props.areas
 * @param {() => void} props.alCerrar
 * @param {AlGuardarUsuario} props.alGuardar
 */
function Formulario({ usuario, yoId, usuarios, fincas, areas, alCerrar, alGuardar }) {
  const id = useId()
  const campos = useRef(/** @type {Record<string, HTMLElement | null>} */ ({}))
  const anotar = (campo) => (elemento) => {
    campos.current[campo] = elemento
  }

  const [nombre, setNombre] = useState(usuario?.nombre ?? '')
  const [correo, setCorreo] = useState(usuario?.correo ?? '')
  const [contrasena, setContrasena] = useState('')
  const [rolId, setRolId] = useState(/** @type {number | null} */ (usuario?.rol_id ?? null))
  const [fincaId, setFincaId] = useState(usuario?.finca_id ?? '')
  const [areaId, setAreaId] = useState(usuario?.area_id ?? '')
  const [activo, setActivo] = useState(usuario?.activo ?? true)
  const [errores, setErrores] = useState(/** @type {Record<string, string>} */ ({}))
  const [fallo, setFallo] = useState(/** @type {{ tipo: string, mensaje: string } | null} */ (null))
  const [guardando, setGuardando] = useState(false)

  const esNuevo = !usuario
  // Nadie se cambia el rol ni se desactiva a sí mismo: así siempre queda un administrador.
  const esPropio = usuario?.id === yoId
  const pideFinca = rolId === ROL.REPORTANTE
  const pideArea = rolId === ROL.APROBADOR_AREA

  // Las fincas activas y, al editar, la del usuario aunque ya no lo esté: si no, el campo
  // quedaría vacío sin que nadie lo hubiera cambiado.
  const opcionesDeFinca = fincas
    .filter((finca) => finca.activo || finca.id === usuario?.finca_id)
    .map((finca) => ({
      valor: finca.id,
      nombre: `${finca.nombre} · ${finca.razon_social}${finca.activo ? '' : ' (inactiva)'}`,
    }))

  // Lo que el cambio le quita al trabajo en curso (decisión 15b): solo importa si deja de
  // atender el alcance que tiene hoy.
  const dejaSuAlcance =
    Boolean(usuario) &&
    (!activo ||
      rolId !== usuario.rol_id ||
      fincaId !== (usuario.finca_id ?? '') ||
      areaId !== (usuario.area_id ?? ''))
  const advertencia = dejaSuAlcance
    ? advertenciaDeAlcance(usuario, usuarios, { fincas, areas })
    : null

  const quitarError = (campo) =>
    setErrores((actuales) => (campo in actuales ? sin(actuales, campo) : actuales))

  /** @param {number} nuevo */
  function elegirRol(nuevo) {
    setRolId(nuevo)
    // Cada rol tiene su alcance: el del anterior no sirve. Si vuelve al rol que ya tenía,
    // recupera el suyo.
    const esElSuyo = usuario?.rol_id === nuevo
    setFincaId(nuevo === ROL.REPORTANTE && esElSuyo ? (usuario.finca_id ?? '') : '')
    setAreaId(nuevo === ROL.APROBADOR_AREA && esElSuyo ? (usuario.area_id ?? '') : '')
    setErrores((actuales) => sin(actuales, 'rol_id', 'finca_id', 'area_id'))
  }

  /** Lo que falta o no sirve, antes de preguntarle al servidor. */
  function validar() {
    /** @type {Record<string, string>} */
    const faltas = {}
    if (nombre.trim() === '') faltas.nombre = FALTA.nombre
    if (esNuevo && !CORREO.test(correo.trim())) faltas.correo = FALTA.correo
    if (esNuevo && !esContrasenaValida(contrasena)) {
      faltas.contrasena_inicial = FALTA.contrasena_inicial
    }
    if (rolId === null) faltas.rol_id = FALTA.rol_id
    if (pideFinca && fincaId === '') faltas.finca_id = FALTA.finca_id
    if (pideArea && areaId === '') faltas.area_id = FALTA.area_id
    return faltas
  }

  /** Muestra los errores y lleva el foco al primer campo que tenga uno. */
  function senalar(faltas) {
    setErrores(faltas)
    const primero = ORDEN.find((campo) => campo in faltas)
    if (primero) campos.current[primero]?.focus()
  }

  /** @param {{ preventDefault: () => void }} evento */
  async function guardar(evento) {
    evento.preventDefault()
    if (guardando) return
    setFallo(null)
    const faltas = validar()
    if (Object.keys(faltas).length > 0) return senalar(faltas)
    setErrores({})

    const comunes = {
      nombre: nombre.trim().replace(/\s+/g, ' '),
      rol_id: rolId,
      finca_id: pideFinca ? fincaId : null,
      area_id: pideArea ? areaId : null,
      activo,
    }
    setGuardando(true)
    try {
      await alGuardar(
        esNuevo
          ? { ...comunes, correo: correo.trim().toLowerCase(), contrasena_inicial: contrasena }
          : comunes,
      )
    } catch (error) {
      const traducido = traducirError(error)
      const rechazados = /** @type {any} */ (error?.campos ?? []).filter(
        (campo) => campo in RECHAZO,
      )
      if (traducido.codigo === 'CORREO_EXISTENTE') {
        // CU-03 6a.
        senalar({ correo: CORREO_REGISTRADO })
      } else if (traducido.codigo === 'DATO_OBLIGATORIO' && rechazados.length > 0) {
        // CU-03 6b: uno por uno.
        senalar(Object.fromEntries(rechazados.map((campo) => [campo, RECHAZO[campo]])))
      } else if (traducido.codigo === 'SIN_PERMISO' && rechazados.length > 0) {
        setFallo({ tipo: 'negocio', mensaje: PROPIO })
      } else {
        setFallo(traducido)
      }
      setGuardando(false)
    }
  }

  return (
    <form noValidate onSubmit={guardar} className="flex flex-1 flex-col gap-4">
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
          ref={anotar('nombre')}
          etiqueta="Nombre completo"
          obligatorio
          name="nombre"
          autoComplete="off"
          maxLength={120}
          value={nombre}
          conError={Boolean(errores.nombre)}
          descritoPor={errores.nombre ? `${id}-nombre` : undefined}
          onChange={(evento) => {
            setNombre(evento.target.value)
            quitarError('nombre')
          }}
        />
        {errores.nombre ? <ErrorDeCampo id={`${id}-nombre`}>{errores.nombre}</ErrorDeCampo> : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <CampoTexto
          ref={anotar('correo')}
          etiqueta="Correo de la plataforma"
          obligatorio
          icono={iconoCorreo}
          type="email"
          name="correo"
          inputMode="email"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          // El correo identifica la cuenta: no se edita (SDD 6.1.10).
          readOnly={!esNuevo}
          value={correo}
          conError={Boolean(errores.correo)}
          descritoPor={`${id}-correo`}
          onChange={(evento) => {
            setCorreo(evento.target.value)
            quitarError('correo')
          }}
        />
        {errores.correo ? (
          <ErrorDeCampo id={`${id}-correo`}>{errores.correo}</ErrorDeCampo>
        ) : (
          <Ayuda id={`${id}-correo`}>
            {esNuevo
              ? 'Correo exclusivo de la plataforma; no recibe mensajes'
              : 'El correo no se puede cambiar.'}
          </Ayuda>
        )}
      </div>

      {esNuevo ? (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-end gap-2">
            <CampoTexto
              ref={anotar('contrasena_inicial')}
              etiqueta="Contraseña inicial"
              obligatorio
              icono={iconoContrasena}
              // A la vista: el administrador tiene que leerla para entregarla.
              type="text"
              name="contrasena_inicial"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={72}
              value={contrasena}
              conError={Boolean(errores.contrasena_inicial)}
              descritoPor={`${id}-contrasena`}
              onChange={(evento) => {
                setContrasena(evento.target.value)
                quitarError('contrasena_inicial')
              }}
              className="min-w-0 flex-1"
            />
            <Boton
              tipo="secundario"
              tamano="movil"
              icono={iconoGenerar}
              onClick={() => {
                setContrasena(generarContrasena())
                quitarError('contrasena_inicial')
              }}
              className="flex-none"
            >
              Generar
            </Boton>
          </div>
          {errores.contrasena_inicial ? (
            <ErrorDeCampo id={`${id}-contrasena`}>{errores.contrasena_inicial}</ErrorDeCampo>
          ) : (
            <Ayuda id={`${id}-contrasena`}>Entrégala al usuario; podrá cambiarla después</Ayuda>
          )}
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <p id={`${id}-rol`} className="text-etiqueta text-texto">
          Rol
          <span aria-hidden="true" className="ml-1 text-error">
            *
          </span>
        </p>
        <div
          role="radiogroup"
          aria-labelledby={`${id}-rol`}
          aria-required="true"
          aria-describedby={errores.rol_id ? `${id}-rol-error` : undefined}
          className="flex flex-col gap-2"
        >
          {ROLES.map((opcion, indice) => {
            const marcado = rolId === opcion.id
            return (
              <label
                key={opcion.id}
                className={`${TARJETA_DE_ROL} ${esPropio ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${
                  marcado
                    ? 'bg-primario-contenedor inset-ring-2 inset-ring-primario'
                    : `bg-superficie inset-ring ${errores.rol_id ? 'inset-ring-error' : 'inset-ring-borde'}`
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <input
                    ref={indice === 0 ? anotar('rol_id') : undefined}
                    type="radio"
                    name={`${id}-rol`}
                    value={opcion.id}
                    checked={marcado}
                    disabled={esPropio}
                    onChange={() => elegirRol(opcion.id)}
                    aria-labelledby={`${id}-rol-${opcion.id}`}
                    aria-describedby={`${id}-rol-${opcion.id}-descripcion`}
                    className="sr-only"
                  />
                  <Icono
                    src={marcado ? iconoMarcado : iconoSinMarcar}
                    tamano={20}
                    className={`flex-none ${marcado ? 'text-primario' : 'text-texto-secundario'}`}
                  />
                  <span id={`${id}-rol-${opcion.id}`} className="text-etiqueta-fuerte text-texto">
                    {nombreCompletoDeRol(opcion.id)}
                  </span>
                </span>
                <span
                  id={`${id}-rol-${opcion.id}-descripcion`}
                  className="pl-[30px] text-auxiliar text-texto-secundario"
                >
                  {opcion.descripcion}
                </span>
              </label>
            )
          })}
        </div>
        {errores.rol_id ? (
          <ErrorDeCampo id={`${id}-rol-error`}>{errores.rol_id}</ErrorDeCampo>
        ) : null}
        {esPropio ? <Ayuda>{PROPIO}</Ayuda> : null}
      </div>

      {pideFinca ? (
        <CampoDeSeleccion
          ref={anotar('finca_id')}
          etiqueta="Finca asignada"
          obligatorio
          name="finca_id"
          icono={iconoFinca}
          vacio="Elige la finca"
          opciones={opcionesDeFinca}
          value={fincaId}
          error={errores.finca_id}
          onChange={(evento) => {
            setFincaId(evento.target.value)
            quitarError('finca_id')
          }}
        />
      ) : null}

      {pideArea ? (
        <div className="flex flex-col gap-2">
          <p id={`${id}-area`} className="text-etiqueta text-texto">
            Área
            <span aria-hidden="true" className="ml-1 text-error">
              *
            </span>
          </p>
          <div
            role="radiogroup"
            aria-labelledby={`${id}-area`}
            aria-required="true"
            aria-describedby={errores.area_id ? `${id}-area-error` : undefined}
            className={`flex gap-1 rounded-control bg-gris-100 p-1 ${errores.area_id ? 'inset-ring-2 inset-ring-error' : ''}`}
          >
            {areas.map((area, indice) => {
              const marcada = areaId === area.id
              const presentacion = PRESENTACION_DEL_AREA[area.nombre]
              return (
                <label
                  key={area.id}
                  className={`flex min-h-11 min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-2 text-etiqueta has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primario ${
                    marcada
                      ? 'bg-superficie text-etiqueta-fuerte text-texto shadow-[0_1px_2px_rgb(15_20_18/0.12)]'
                      : 'text-texto-secundario'
                  }`}
                >
                  <input
                    ref={indice === 0 ? anotar('area_id') : undefined}
                    type="radio"
                    name={`${id}-area`}
                    value={area.id}
                    checked={marcada}
                    onChange={() => {
                      setAreaId(area.id)
                      quitarError('area_id')
                    }}
                    className="sr-only"
                  />
                  {presentacion ? (
                    <Icono src={presentacion.icono} tamano={18} className="flex-none" />
                  ) : null}
                  <span className="truncate">{area.nombre}</span>
                </label>
              )
            })}
          </div>
          {errores.area_id ? (
            <ErrorDeCampo id={`${id}-area-error`}>{errores.area_id}</ErrorDeCampo>
          ) : null}
        </div>
      ) : null}

      <label
        className={`flex min-h-12 items-center justify-between gap-3 ${esPropio ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
      >
        <span className="text-etiqueta text-texto">Usuario activo</span>
        <input
          type="checkbox"
          role="switch"
          aria-checked={activo}
          name="activo"
          checked={activo}
          disabled={esPropio}
          onChange={(evento) => setActivo(evento.target.checked)}
          className="peer sr-only"
        />
        {/* El interruptor de Figma: la posición del círculo lo dice, no solo el color. */}
        <span
          aria-hidden="true"
          className="relative h-6 w-11 flex-none rounded-full bg-gris-300 peer-checked:bg-primario peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primario after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-superficie after:transition-transform peer-checked:after:translate-x-5"
        />
      </label>

      {advertencia ? (
        <Aviso tipo="advertencia" icono={iconoAdvertencia} role="status">
          {advertencia}
        </Aviso>
      ) : null}

      {/* En el teléfono van uno sobre otro, con la acción primero: con su ícono no caben en una
          fila a 360 px. El orden del teclado es el mismo en los dos formatos. */}
      <div className="mt-auto flex flex-col-reverse gap-1 pt-2 lg:flex-row lg:justify-end lg:gap-2.5">
        <Boton tipo="secundario" onClick={alCerrar} className="w-full lg:w-auto">
          Cancelar
        </Boton>
        <Boton type="submit" icono={iconoGuardar} disabled={guardando} className="w-full lg:w-auto">
          {guardando ? 'Guardando…' : 'Guardar usuario'}
        </Boton>
      </div>
    </form>
  )
}

/**
 * Panel de las pantallas 29 y 29-B.
 *
 * @param {object} props
 * @param {boolean} props.abierto
 * @param {Usuario | null} props.usuario El que se edita; `null` para uno nuevo.
 * @param {string} props.yoId Quien está usando la pantalla.
 * @param {Usuario[]} props.usuarios
 * @param {{ id: string, nombre: string, activo: boolean, razon_social: string, novedades_abiertas: number }[]} props.fincas
 * @param {{ id: string, nombre: string }[]} props.areas
 * @param {() => void} props.alCerrar
 * @param {AlGuardarUsuario} props.alGuardar Guarda y cierra; si falla, lanza el error y el
 *   panel lo muestra sin cerrarse.
 */
export function PanelUsuario({ abierto, usuario, alCerrar, ...resto }) {
  return (
    <Panel
      abierto={abierto}
      alCerrar={alCerrar}
      titulo={usuario ? 'Editar usuario' : 'Nuevo usuario'}
    >
      <Formulario usuario={usuario} alCerrar={alCerrar} {...resto} />
    </Panel>
  )
}
