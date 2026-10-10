import { useEffect, useId, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { useEnLinea } from '../../core/conexion/useEnLinea.js'
import { traducirError } from '../../core/errores/traducir.js'
import { solicitarRecuperacion } from '../../core/supabase/repositorios/recuperacion.js'
import { Aviso } from '../../core/ui/Aviso.jsx'
import { Boton } from '../../core/ui/Boton.jsx'
import { CampoTexto } from '../../core/ui/CampoTexto.jsx'
import { ErrorDeCampo } from '../../core/ui/ErrorDeCampo.jsx'
import { Icono } from '../../core/ui/Icono.jsx'
import iconoAdministrador from '../../core/ui/iconos/admin_panel_settings.svg'
import iconoSinConexion from '../../core/ui/iconos/cloud_off.svg'
import iconoError from '../../core/ui/iconos/error.svg'
import iconoCorreo from '../../core/ui/iconos/mail.svg'
import iconoEnviada from '../../core/ui/iconos/mark_email_read.svg'
import iconoContrasena from '../../core/ui/iconos/password.svg'
import iconoEnviar from '../../core/ui/iconos/send.svg'
import { esCorreoValido } from '../../core/utils/correo.js'
import { PantallaDeAcceso } from './PantallaDeAcceso.jsx'

/*
 * Pantallas 02 · Recuperar contraseña y 02-B · Solicitud enviada (RF-02 / CU-02, pasos 1 a 4).
 * Figma 1:570 y 1:616.
 *
 * Los correos de la plataforma no reciben mensajes: quien olvidó su contraseña deja una
 * solicitud y un administrador le entrega un código temporal por un medio propio. La pantalla
 * no sabe si el correo existe: el servidor responde igual en todos los casos y 02-B dice
 * siempre lo mismo (CU-02 4a).
 */

const VOLVER = { a: '/ingresar', texto: 'Volver al ingreso' }

const PASOS = [
  { icono: iconoEnviar, texto: 'Envías la solicitud' },
  { icono: iconoAdministrador, texto: 'Un administrador te entrega un código temporal' },
  { icono: iconoContrasena, texto: 'Ingresas el código y tu contraseña nueva' },
]

const ENLACE =
  'inline-flex min-h-12 items-center text-etiqueta-fuerte text-primario hover:text-primario-hover'

function SolicitudEnviada({ correo }) {
  const navegar = useNavigate()
  const titulo = useRef(null)

  // El formulario desapareció: el foco va al resultado, para que un lector de pantalla lo lea.
  useEffect(() => {
    titulo.current?.focus()
  }, [])

  return (
    <div className="flex flex-col items-center gap-5 pt-10 text-center">
      <span className="flex size-20 items-center justify-center rounded-full bg-primario-contenedor text-primario">
        <Icono src={iconoEnviada} tamano={40} />
      </span>
      <h2 ref={titulo} tabIndex={-1} className="text-titulo text-texto outline-none">
        Solicitud enviada
      </h2>
      <p className="text-cuerpo text-texto-secundario">
        Si el correo corresponde a un usuario activo, un administrador te entregará un código
        temporal. El código tiene una vigencia limitada.
      </p>
      <Boton
        tamano="movil"
        className="w-full"
        // El correo viaja en el estado de la navegación, nunca en la dirección.
        onClick={() => navegar('/recuperar/codigo', { state: { correo } })}
      >
        Ingresar código
      </Boton>
      <Link to="/ingresar" className={`-mt-2 ${ENLACE}`}>
        Volver al inicio
      </Link>
    </div>
  )
}

export default function RecuperarContrasena() {
  const { state } = useLocation()
  const enLinea = useEnLinea()
  const idDelError = useId()
  const idSinConexion = useId()
  const idDeLosPasos = useId()
  const campo = useRef(null)
  // Al volver de 03-B («Solicitar otro código») el correo llega puesto.
  const [correo, setCorreo] = useState(typeof state?.correo === 'string' ? state.correo : '')
  const [fase, setFase] = useState(
    /** @type {'formulario' | 'enviando' | 'enviada'} */ ('formulario'),
  )
  const [correoInvalido, setCorreoInvalido] = useState(false)
  const [fallo, setFallo] = useState(
    /** @type {{ deRed: boolean, mensaje: string } | null} */ (null),
  )

  async function alEnviar(evento) {
    evento.preventDefault()
    if (!esCorreoValido(correo)) {
      setCorreoInvalido(true)
      campo.current?.focus()
      return
    }

    setFase('enviando')
    setFallo(null)
    try {
      await solicitarRecuperacion(correo.trim())
      setFase('enviada')
    } catch (error) {
      const { tipo, mensaje } = traducirError(error)
      setFallo(
        tipo === 'red'
          ? { deRed: true, mensaje }
          : {
              deRed: false,
              mensaje: 'No pudimos enviar la solicitud. Intenta de nuevo en un momento.',
            },
      )
      setFase('formulario')
    }
  }

  if (fase === 'enviada') {
    return (
      <PantallaDeAcceso titulo="Recuperar contraseña" volver={VOLVER}>
        <SolicitudEnviada correo={correo.trim()} />
      </PantallaDeAcceso>
    )
  }

  return (
    <PantallaDeAcceso titulo="Recuperar contraseña" volver={VOLVER}>
      <p className="text-cuerpo text-texto-secundario">
        Escribe el correo con el que ingresas. Un administrador recibirá tu solicitud y te entregará
        un código temporal para crear una contraseña nueva.
      </p>

      <form onSubmit={alEnviar} noValidate className="flex flex-col gap-5">
        {!enLinea ? (
          <Aviso
            tipo="advertencia"
            icono={iconoSinConexion}
            titulo="Sin conexión"
            id={idSinConexion}
          >
            Necesitas internet para enviar la solicitud.
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
            ref={campo}
            etiqueta="Correo registrado"
            icono={iconoCorreo}
            name="correo"
            type="email"
            inputMode="email"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            value={correo}
            onChange={(evento) => {
              setCorreo(evento.target.value)
              setCorreoInvalido(false)
            }}
            conError={correoInvalido}
            descritoPor={correoInvalido ? idDelError : undefined}
          />
          {correoInvalido ? (
            <ErrorDeCampo id={idDelError}>Escribe un correo válido.</ErrorDeCampo>
          ) : null}
        </div>

        <Boton
          type="submit"
          tamano="movil"
          className="w-full"
          disabled={!enLinea || fase === 'enviando'}
          aria-describedby={!enLinea ? idSinConexion : undefined}
        >
          {fase === 'enviando' ? 'Enviando…' : 'Enviar solicitud'}
        </Boton>
      </form>

      <section className="flex flex-col gap-3.5 rounded-2xl bg-superficie p-[17px] inset-ring inset-ring-borde">
        <h2 id={idDeLosPasos} className="text-etiqueta-fuerte text-texto">
          Cómo funciona
        </h2>
        <ol aria-labelledby={idDeLosPasos} className="flex flex-col gap-3.5">
          {PASOS.map(({ icono, texto }, posicion) => (
            <li key={texto} className="flex items-center gap-3">
              {/* El número ya lo dice la lista. */}
              <span
                aria-hidden="true"
                className="flex size-7 flex-none items-center justify-center rounded-full bg-primario-contenedor text-auxiliar-fuerte text-primario"
              >
                {posicion + 1}
              </span>
              <Icono src={icono} tamano={20} className="flex-none text-texto-secundario" />
              <span className="min-w-0 flex-1 text-cuerpo-pequeno text-texto">{texto}</span>
            </li>
          ))}
        </ol>
      </section>

      <p className="text-center">
        <Link
          to="/recuperar/codigo"
          state={{ correo: correo.trim() }}
          className={`-my-3.5 ${ENLACE}`}
        >
          Ya tengo un código
        </Link>
      </p>
    </PantallaDeAcceso>
  )
}
