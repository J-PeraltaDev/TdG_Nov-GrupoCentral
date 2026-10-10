import { useEffect, useRef } from 'react'
import { Navigate, Outlet, useNavigate } from 'react-router'
import { useSesion } from '../core/sesion/ContextoSesion.js'
import { rutaDeInicio } from '../core/sesion/roles.js'
import { Cargando } from './Cargando.jsx'

/**
 * Deja pasar solo con sesión; sin ella, lleva al ingreso (RNF-10).
 *
 * Si con la sesión abierta le cambian el rol, la finca o el área (RF-03), lo lleva a su
 * pantalla de inicio y vuelve a montar las pantallas: lo que tenían cargado era del alcance
 * anterior.
 */
export function RequiereSesion() {
  const { fase, perfil } = useSesion()
  const navegar = useNavigate()
  const alcance = perfil ? `${perfil.rol_id}:${perfil.finca_id}:${perfil.area_id}` : null
  const anterior = useRef(alcance)

  useEffect(() => {
    const cambio = anterior.current !== null && alcance !== null && anterior.current !== alcance
    anterior.current = alcance
    if (cambio) navegar(rutaDeInicio(perfil.rol_id), { replace: true })
    // Solo importa el cambio del alcance: `navegar` y `perfil` no lo disparan.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [alcance])

  if (fase === 'cargando') return <Cargando />
  if (fase === 'sin_sesion') return <Navigate to="/ingresar" replace />
  return <Outlet key={alcance} />
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
