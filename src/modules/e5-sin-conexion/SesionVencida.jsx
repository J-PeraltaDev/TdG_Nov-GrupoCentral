import { useNavigate } from 'react-router'
import { useSesion } from '../../core/sesion/ContextoSesion.js'
import { Boton } from '../../core/ui/Boton.jsx'
import { Icono } from '../../core/ui/Icono.jsx'
import iconoSesion from '../../core/ui/iconos/lock.svg'

/**
 * 08-B · La sesión venció durante la sincronización (RF-22 / CU-22 3a, Figma 2:1048). Las
 * pendientes siguen en el dispositivo: «Ingresar» cierra la sesión local, que ya no sirve, y lleva
 * al ingreso; al volver a ingresar, la sincronización sigue sola.
 *
 * @param {object} props
 * @param {number} props.cantidad Pendientes del usuario.
 */
export function SesionVencida({ cantidad }) {
  const { salir } = useSesion()
  const navegar = useNavigate()

  async function alIngresar() {
    await salir()
    navegar('/ingresar', { replace: true })
  }

  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-control bg-advertencia-suave px-3.5 py-3"
    >
      <Icono src={iconoSesion} tamano={20} className="text-advertencia" />
      <div className="flex min-w-0 flex-1 flex-col items-start gap-2 text-cuerpo-pequeno text-texto">
        <p className="text-etiqueta-fuerte">Tu sesión venció</p>
        <p>
          {cantidad === 1
            ? 'Ingresa de nuevo para enviar la novedad pendiente; sigue guardada en este teléfono.'
            : `Ingresa de nuevo para enviar las ${cantidad} novedades pendientes; siguen guardadas en este teléfono.`}
        </p>
        <Boton onClick={alIngresar}>Ingresar</Boton>
      </div>
    </div>
  )
}
