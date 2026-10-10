import { useId, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useEnLinea } from '../../core/conexion/useEnLinea.js'
import { traducirError } from '../../core/errores/traducir.js'
import { restablecerContrasena } from '../../core/supabase/repositorios/recuperacion.js'
import { Aviso } from '../../core/ui/Aviso.jsx'
import { Boton } from '../../core/ui/Boton.jsx'
import { BotonVerContrasena } from '../../core/ui/BotonVerContrasena.jsx'
import { CampoTexto } from '../../core/ui/CampoTexto.jsx'
import { ErrorDeCampo } from '../../core/ui/ErrorDeCampo.jsx'
import { Icono } from '../../core/ui/Icono.jsx'
import iconoCumplida from '../../core/ui/iconos/check_circle.svg'
import iconoSinConexion from '../../core/ui/iconos/cloud_off.svg'
import iconoError from '../../core/ui/iconos/error.svg'
import iconoCandado from '../../core/ui/iconos/lock.svg'
import iconoCorreo from '../../core/ui/iconos/mail.svg'
import iconoPendiente from '../../core/ui/iconos/radio_button_unchecked.svg'
import iconoVencido from '../../core/ui/iconos/timer_off.svg'
import { CONTRASENA_MAX_CARACTERES, reglasDeContrasena } from '../../core/utils/contrasena.js'
import { esCorreoValido } from '../../core/utils/correo.js'
import { CampoCodigo } from './CampoCodigo.jsx'
import { DIGITOS_DEL_CODIGO } from './codigoTemporal.js'
import { PantallaDeAcceso } from './PantallaDeAcceso.jsx'

/*
 * Pantallas 03 · Crear contraseña nueva y 03-B · Código vencido (RF-02 / CU-02, pasos 8 a 10 y
 * alternos 9a y 9b). Figma 1:672 y 1:735.
 *
 * La persona escribe el código que le entregó el administrador y su contraseña nueva. La
 * validez la da el código: la pantalla no tiene sesión. Nada de lo que se escribe aquí se
 * guarda en el navegador ni va en la dirección; el correo llega de la pantalla anterior por el
 * estado de la navegación.
 */

/** Lo que dice cada campo cuando falta o no sirve. */
const FALTA = {
  correo: 'Escribe un correo válido.',
  codigo: 'Escribe los seis dígitos del código.',
  contrasena: 'Usa mínimo 8 caracteres, con al menos una letra y un número.',
  confirmacion: 'Las contraseñas no coinciden.',
}

/** CU-02 9b: un código mal escrito se puede corregir (decisión 45 del plan del Sprint 3). */
const CODIGO_INVALIDO = 'El código no es válido. Revísalo; si sigue sin servir, pide uno nuevo.'

/** El orden de los campos en el formulario: el foco va al primero que tenga un error. */
const ORDEN = ['correo', 'codigo', 'contrasena', 'confirmacion']

/** Los campos de esta pantalla que rechazó la función. */
function rechazados(error) {
  return (error?.campos ?? []).filter((campo) => campo in FALTA)
}

/** Una de las dos reglas visibles: dice si se cumple con el ícono y con texto, no solo con color. */
function Regla({ cumplida, children }) {
  return (
    <li className="flex items-center gap-1.5 text-cuerpo-pequeno text-texto">
      <Icono
        src={cumplida ? iconoCumplida : iconoPendiente}
        tamano={18}
        className={`flex-none ${cumplida ? 'text-exito' : 'text-texto-secundario'}`}
      />
      <span>
        {children}
        <span className="sr-only">: {cumplida ? 'cumplida' : 'pendiente'}</span>
      </span>
    </li>
  )
}

export default function CrearContrasena() {
  const { state } = useLocation()
  const navegar = useNavigate()
  const enLinea = useEnLinea()
  const ids = {
    correo: useId(),
    codigo: useId(),
    contrasena: useId(),
    confirmacion: useId(),
    reglas: useId(),
    vencido: useId(),
    sinConexion: useId(),
  }
  const campoCorreo = useRef(null)
  const campoCodigo = useRef(null)
  const campoContrasena = useRef(null)
  const campoConfirmacion = useRef(null)
  const [correo, setCorreo] = useState(typeof state?.correo === 'string' ? state.correo : '')
  const [codigo, setCodigo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [visible, setVisible] = useState(false)
  const [errores, setErrores] = useState(/** @type {Record<string, string>} */ ({}))
  /** 03-B: el servidor dijo que el código venció o ya se usó. */
  const [vencido, setVencido] = useState(false)
  const [fallo, setFallo] = useState(
    /** @type {{ deRed: boolean, mensaje: string } | null} */ (null),
  )
  const [guardando, setGuardando] = useState(false)

  const reglas = reglasDeContrasena(contrasena)

  /** Cambia un campo y le quita su error: ya lo está corrigiendo. */
  const escribir = (campo, cambiar) => (valor) => {
    cambiar(valor)
    setErrores((actuales) => {
      if (!(campo in actuales)) return actuales
      const resto = { ...actuales }
      delete resto[campo]
      return resto
    })
  }

  /** Señala los campos con error y deja el foco en el primero. */
  function senalar(nuevos) {
    setErrores(nuevos)
    const campos = {
      correo: campoCorreo,
      codigo: campoCodigo,
      contrasena: campoContrasena,
      confirmacion: campoConfirmacion,
    }
    const primero = ORDEN.find((campo) => campo in nuevos)
    if (primero) campos[primero].current?.focus()
  }

  function revisar() {
    /** @type {Record<string, string>} */
    const nuevos = {}
    if (!esCorreoValido(correo)) nuevos.correo = FALTA.correo
    if (codigo.length !== DIGITOS_DEL_CODIGO) nuevos.codigo = FALTA.codigo
    if (!reglas.longitud || !reglas.letraYNumero) nuevos.contrasena = FALTA.contrasena
    else if (contrasena.length > CONTRASENA_MAX_CARACTERES) {
      nuevos.contrasena = `Usa máximo ${CONTRASENA_MAX_CARACTERES} caracteres.`
    }
    if (confirmacion !== contrasena) nuevos.confirmacion = FALTA.confirmacion
    return nuevos
  }

  async function alGuardar(evento) {
    evento.preventDefault()
    const nuevos = revisar()
    if (Object.keys(nuevos).length > 0) {
      senalar(nuevos)
      return
    }

    // Lo que haya dicho el servidor del intento anterior ya no aplica.
    setGuardando(true)
    setErrores({})
    setFallo(null)
    setVencido(false)
    try {
      await restablecerContrasena({ correo: correo.trim(), codigo, contrasena })
      // 01-E: el ingreso confirma que la contraseña quedó actualizada.
      navegar('/ingresar', { replace: true, state: { contrasenaActualizada: true } })
    } catch (error) {
      setGuardando(false)
      const codigoDelError = String(error?.message ?? '')
      if (codigoDelError === 'CODIGO_VENCIDO') {
        // 9a: venció, ya se usó o agotó sus intentos. Hay que pedir otro.
        setVencido(true)
      } else if (codigoDelError === 'CODIGO_INVALIDO') {
        // 9b: sigue en la pantalla y puede corregirlo.
        senalar({ codigo: CODIGO_INVALIDO })
      } else if (codigoDelError === 'DATO_OBLIGATORIO' && rechazados(error).length > 0) {
        senalar(Object.fromEntries(rechazados(error).map((campo) => [campo, FALTA[campo]])))
      } else {
        const { tipo, mensaje } = traducirError(error)
        setFallo(
          tipo === 'red'
            ? { deRed: true, mensaje }
            : {
                deRed: false,
                // El código se gasta antes de cambiar la contraseña: pudo quedar usado.
                mensaje:
                  'No pudimos guardar la contraseña. Intenta de nuevo; si el código deja de servir, pide uno nuevo.',
              },
        )
      }
    }
  }

  const descripcionDeLaContrasena = errores.contrasena
    ? `${ids.reglas} ${ids.contrasena}`
    : ids.reglas

  return (
    <PantallaDeAcceso
      titulo="Crear contraseña nueva"
      volver={{
        a: '/recuperar',
        texto: 'Volver a recuperar contraseña',
        estado: { correo: correo.trim() },
      }}
    >
      <form onSubmit={alGuardar} noValidate className="flex flex-col gap-5">
        {vencido ? (
          <Aviso tipo="error" icono={iconoVencido} role="alert" id={ids.vencido}>
            El código venció. Pide uno nuevo al administrador.
            <span className="mt-2 block">
              <Boton
                tipo="secundario"
                tamano="movil"
                onClick={() => navegar('/recuperar', { state: { correo: correo.trim() } })}
              >
                Solicitar otro código
              </Boton>
            </span>
          </Aviso>
        ) : null}
        {!enLinea ? (
          <Aviso
            tipo="advertencia"
            icono={iconoSinConexion}
            titulo="Sin conexión"
            id={ids.sinConexion}
          >
            Necesitas internet para guardar la contraseña.
          </Aviso>
        ) : null}
        {fallo ? (
          <Aviso
            tipo={fallo.deRed ? 'advertencia' : 'error'}
            icono={fallo.deRed ? iconoSinConexion : iconoError}
            role="alert"
          >
            {fallo.mensaje}
          </Aviso>
        ) : null}

        <div className="flex flex-col gap-1.5">
          <CampoTexto
            ref={campoCorreo}
            etiqueta="Correo"
            icono={iconoCorreo}
            name="correo"
            type="email"
            inputMode="email"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            value={correo}
            onChange={(evento) => escribir('correo', setCorreo)(evento.target.value)}
            conError={'correo' in errores}
            descritoPor={errores.correo ? ids.correo : undefined}
          />
          {errores.correo ? <ErrorDeCampo id={ids.correo}>{errores.correo}</ErrorDeCampo> : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <CampoCodigo
            ref={campoCodigo}
            etiqueta="Código temporal"
            valor={codigo}
            alCambiar={(valor) => {
              escribir('codigo', setCodigo)(valor)
              // Con otro código, lo que dijo el servidor del anterior ya no aplica.
              setVencido(false)
            }}
            conError={'codigo' in errores || vencido}
            descritoPor={errores.codigo ? ids.codigo : vencido ? ids.vencido : undefined}
          />
          {errores.codigo ? <ErrorDeCampo id={ids.codigo}>{errores.codigo}</ErrorDeCampo> : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <CampoTexto
            ref={campoContrasena}
            etiqueta="Contraseña nueva"
            icono={iconoCandado}
            name="contrasena"
            type={visible ? 'text' : 'password'}
            autoComplete="new-password"
            value={contrasena}
            onChange={(evento) => escribir('contrasena', setContrasena)(evento.target.value)}
            conError={'contrasena' in errores}
            descritoPor={descripcionDeLaContrasena}
            accion={<BotonVerContrasena visible={visible} alCambiar={setVisible} />}
          />
          {errores.contrasena ? (
            <ErrorDeCampo id={ids.contrasena}>{errores.contrasena}</ErrorDeCampo>
          ) : null}
        </div>

        <ul
          id={ids.reglas}
          aria-label="Requisitos de la contraseña"
          className="flex flex-col gap-1.5"
        >
          <Regla cumplida={reglas.longitud}>Mínimo 8 caracteres</Regla>
          <Regla cumplida={reglas.letraYNumero}>Al menos una letra y un número</Regla>
        </ul>

        <div className="flex flex-col gap-1.5">
          <CampoTexto
            ref={campoConfirmacion}
            etiqueta="Confirmar contraseña"
            icono={iconoCandado}
            name="confirmacion"
            type={visible ? 'text' : 'password'}
            autoComplete="new-password"
            value={confirmacion}
            onChange={(evento) => escribir('confirmacion', setConfirmacion)(evento.target.value)}
            conError={'confirmacion' in errores}
            descritoPor={errores.confirmacion ? ids.confirmacion : undefined}
          />
          {errores.confirmacion ? (
            <ErrorDeCampo id={ids.confirmacion}>{errores.confirmacion}</ErrorDeCampo>
          ) : null}
        </div>

        <Boton
          type="submit"
          tamano="movil"
          className="w-full"
          disabled={!enLinea || guardando}
          aria-describedby={!enLinea ? ids.sinConexion : undefined}
        >
          {guardando ? 'Guardando…' : 'Guardar contraseña'}
        </Boton>
        <p className="-mt-1 text-center text-auxiliar text-texto-secundario">
          El código solo sirve una vez.
        </p>
      </form>
    </PantallaDeAcceso>
  )
}
