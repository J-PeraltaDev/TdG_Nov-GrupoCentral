import { useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { Cargando } from '../../app/Cargando.jsx'
import { useEnLinea } from '../../core/conexion/useEnLinea.js'
import { useSesion } from '../../core/sesion/ContextoSesion.js'
import { rutaDeInicio } from '../../core/sesion/roles.js'
import { Aviso } from '../../core/ui/Aviso.jsx'
import { Boton } from '../../core/ui/Boton.jsx'
import { CampoTexto } from '../../core/ui/CampoTexto.jsx'
import { Icono } from '../../core/ui/Icono.jsx'
import iconoSinConexion from '../../core/ui/iconos/cloud_off.svg'
import iconoMarca from '../../core/ui/iconos/eco.svg'
import iconoError from '../../core/ui/iconos/error.svg'
import iconoCandado from '../../core/ui/iconos/lock.svg'
import iconoCorreo from '../../core/ui/iconos/mail.svg'
import iconoVer from '../../core/ui/iconos/visibility.svg'
import iconoOcultar from '../../core/ui/iconos/visibility_off.svg'
import { InvitacionAInstalar } from './InvitacionAInstalar.jsx'

const ID_DEL_AVISO = 'aviso-de-ingreso'

/**
 * Pantalla 01 · Iniciar sesión (RF-01, CU-01), con sus variantes:
 *   01-B credenciales incorrectas · 01-C usuario desactivado · 01-D sin conexión en el
 *   primer ingreso. La 01-E (contraseña actualizada) llega con RF-02 en el Sprint 3.
 */
export function Ingreso() {
  const { fase, perfil, ingresar, motivoDeSalida } = useSesion()
  const navegar = useNavigate()
  const enLinea = useEnLinea()
  /** @type {[import('../../core/sesion/sesion.js').MotivoDeRechazo | null, Function]} */
  const [rechazo, setRechazo] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [contrasenaVisible, setContrasenaVisible] = useState(false)
  const campoContrasena = useRef(null)

  // Mientras se recupera la sesión guardada no se muestra el formulario.
  if (fase === 'cargando') return <Cargando />
  // Quien ya tiene sesión no vuelve a ver el ingreso.
  if (fase === 'con_sesion') return <Navigate to={rutaDeInicio(perfil.rol_id)} replace />

  // Lo último que pasó: el resultado del intento de ingreso o, antes de intentar, el motivo
  // con que se cerró la sesión (un administrador desactivó al usuario mientras la tenía abierta).
  const motivo = rechazo ?? motivoDeSalida ?? null

  // 01-D: el primer ingreso en un dispositivo necesita conexión (CU-01 2a).
  const sinConexion = !enLinea || motivo === 'sin_conexion'

  async function alEnviar(evento) {
    evento.preventDefault()
    const datos = new FormData(evento.currentTarget)
    setEnviando(true)
    const resultado = await ingresar(String(datos.get('correo')), String(datos.get('contrasena')))
    setEnviando(false)

    if (resultado.ok) {
      navegar(rutaDeInicio(resultado.perfil.rol_id), { replace: true })
      return
    }
    setRechazo(resultado.motivo)
    if (resultado.motivo === 'credenciales') campoContrasena.current?.focus()
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[26rem] flex-col gap-6 px-4 pt-10 pb-6">
      <header className="flex flex-col items-center gap-3 text-center">
        <span className="flex size-16 items-center justify-center rounded-[18px] bg-primario text-sobre-primario">
          <Icono src={iconoMarca} tamano={36} />
        </span>
        <h1 className="text-titulo text-texto">Novedades · Grupo Central</h1>
        <p className="text-cuerpo text-texto-secundario">
          Reporta y sigue las novedades de tu finca
        </p>
      </header>

      {sinConexion ? (
        <Aviso tipo="advertencia" icono={iconoSinConexion} titulo="Sin conexión" role="status">
          El primer ingreso en este teléfono necesita internet; después podrás registrar novedades
          sin conexión.
        </Aviso>
      ) : null}

      <form
        onSubmit={alEnviar}
        className="flex flex-col gap-4 rounded-2xl bg-superficie p-5 inset-ring inset-ring-borde"
      >
        {motivo === 'credenciales' ? (
          <Aviso tipo="error" icono={iconoError} role="alert" id={ID_DEL_AVISO}>
            Correo o contraseña incorrectos. Revisa los datos e intenta de nuevo.
          </Aviso>
        ) : null}
        {motivo === 'desactivado' ? (
          <Aviso icono={iconoCandado} role="alert" id={ID_DEL_AVISO}>
            Tu usuario está desactivado. Si crees que es un error, comunícate con un administrador.
          </Aviso>
        ) : null}
        {motivo === 'error' ? (
          <Aviso tipo="error" icono={iconoError} role="alert" id={ID_DEL_AVISO}>
            No pudimos iniciar tu sesión. Intenta de nuevo en un momento.
          </Aviso>
        ) : null}

        <CampoTexto
          etiqueta="Correo"
          icono={iconoCorreo}
          name="correo"
          type="email"
          inputMode="email"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
        />
        <CampoTexto
          ref={campoContrasena}
          etiqueta="Contraseña"
          icono={iconoCandado}
          name="contrasena"
          type={contrasenaVisible ? 'text' : 'password'}
          autoComplete="current-password"
          required
          conError={rechazo === 'credenciales'}
          descritoPor={rechazo === 'credenciales' ? ID_DEL_AVISO : undefined}
          accion={
            <button
              type="button"
              onClick={() => setContrasenaVisible((visible) => !visible)}
              aria-label={contrasenaVisible ? 'Ocultar la contraseña' : 'Mostrar la contraseña'}
              aria-pressed={contrasenaVisible}
              className="-my-3.5 -mr-3.5 flex size-12 flex-none cursor-pointer items-center justify-center rounded-control text-texto-secundario"
            >
              <Icono src={contrasenaVisible ? iconoOcultar : iconoVer} tamano={20} />
            </button>
          }
        />

        <Boton
          type="submit"
          tamano="movil"
          className="w-full"
          disabled={sinConexion || enviando}
          icono={sinConexion ? iconoCandado : undefined}
        >
          {enviando ? 'Ingresando…' : 'Ingresar'}
        </Boton>

        <p className="text-center">
          <Link
            to="/recuperar"
            className="-my-3.5 inline-flex min-h-12 items-center text-etiqueta-fuerte text-primario hover:text-primario-hover"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </p>
      </form>

      <InvitacionAInstalar />

      <footer className="flex flex-col items-center gap-0.5 text-center text-auxiliar text-texto-secundario">
        <p>Tus datos se tratan conforme a la Ley 1581 de 2012</p>
        <Link
          to="/tratamiento-de-datos"
          className="inline-flex min-h-6 items-center text-auxiliar-fuerte text-primario hover:text-primario-hover"
        >
          Política de tratamiento de datos
        </Link>
      </footer>
    </main>
  )
}
