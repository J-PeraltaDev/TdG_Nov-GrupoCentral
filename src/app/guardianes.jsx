import { Navigate, Outlet } from 'react-router'
import { useSesion } from '../core/sesion/ContextoSesion.js'
import { rutaDeInicio } from '../core/sesion/roles.js'
import { Cargando } from './Cargando.jsx'

/** Deja pasar solo con sesión; sin ella, lleva al ingreso (RNF-10). */
export function RequiereSesion() {
  const { fase } = useSesion()
  if (fase === 'cargando') return <Cargando />
  if (fase === 'sin_sesion') return <Navigate to="/ingresar" replace />
  return <Outlet />
}

/**
 * Guardián de rol (SDD 6.1.11): si el rol no corresponde a la ruta, redirige a la pantalla
 * de inicio de ese rol. La interfaz solo oculta opciones; el alcance real lo garantiza la
 * base de datos (RNF-11).
 *
 * @param {object} props
 * @param {number[]} props.roles Roles que pueden ver las rutas hijas.
 */
export function GuardianDeRol({ roles }) {
  const { perfil } = useSesion()
  if (!roles.includes(perfil.rol_id)) return <Navigate to={rutaDeInicio(perfil.rol_id)} replace />
  return <Outlet />
}

/** `/`: cada quien va a la pantalla de inicio de su rol (SDD, Tabla 10). */
export function IrAlInicio() {
  const { fase, perfil } = useSesion()
  if (fase === 'cargando') return <Cargando />
  return <Navigate to={fase === 'con_sesion' ? rutaDeInicio(perfil.rol_id) : '/ingresar'} replace />
}
