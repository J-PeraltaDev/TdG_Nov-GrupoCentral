import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router'
import { ROL } from '../core/sesion/roles.js'
import { Ingreso } from '../modules/e1-acceso-admin/Ingreso.jsx'
import { Cargando } from './Cargando.jsx'
import { GuardianDeRol, IrAlInicio, RequiereSesion } from './guardianes.jsx'
import { Cuenta } from './paginas/Cuenta.jsx'
import { NoEncontrada } from './paginas/NoEncontrada.jsx'
import { Pendiente } from './paginas/Pendiente.jsx'

// El ingreso va en el paquete inicial; todo lo que necesita sesión se carga bajo demanda
// (RNF-05). Las pantallas de cada rol van en su propio paquete, con `React.lazy`.
const Marco = lazy(() => import('./Marco.jsx'))

// Página de componentes: solo existe en desarrollo. En el build de producción esta
// condición es falsa y el módulo ni siquiera se empaqueta.
const Componentes = import.meta.env.DEV ? lazy(() => import('../dev/Componentes.jsx')) : null

const VOLVER_AL_INGRESO = { a: '/ingresar', texto: 'Volver al ingreso' }

/**
 * Rutas de la aplicación (SDD 6.1.11). Se usa la API declarativa de React Router
 * (ADR 0007). Cada rol tiene su conjunto de rutas y un guardián que lo verifica.
 */
export function Rutas() {
  return (
    <Suspense fallback={<Cargando />}>
      <Routes>
        <Route path="/" element={<IrAlInicio />} />
        <Route path="/ingresar" element={<Ingreso />} />
        <Route
          path="/recuperar"
          element={
            <Pendiente
              titulo="Recuperar contraseña"
              sprint="Sprint 3"
              detalle="Mientras tanto, pídele ayuda a un administrador."
              salida={VOLVER_AL_INGRESO}
            />
          }
        />
        <Route
          path="/tratamiento-de-datos"
          element={
            <Pendiente
              titulo="Política de tratamiento de datos"
              sprint="Sprint 3"
              detalle="El texto de la política lo define la empresa, conforme a la Ley 1581 de 2012."
              salida={VOLVER_AL_INGRESO}
            />
          }
        />

        <Route element={<RequiereSesion />}>
          <Route element={<Marco />}>
            <Route element={<GuardianDeRol roles={[ROL.REPORTANTE]} />}>
              <Route
                path="/novedades"
                element={<Pendiente titulo="Mis novedades" sprint="Sprint 1" />}
              />
              <Route
                path="/registrar"
                element={<Pendiente titulo="Registrar novedad" sprint="Sprint 1" />}
              />
            </Route>

            <Route element={<GuardianDeRol roles={[ROL.APROBADOR_AREA]} />}>
              <Route
                path="/bandeja"
                element={<Pendiente titulo="Bandeja del área" sprint="Sprint 2" />}
              />
            </Route>

            <Route element={<GuardianDeRol roles={[ROL.DIRECTOR_AGRICULTURA]} />}>
              <Route
                path="/escaladas"
                element={<Pendiente titulo="Novedades escaladas" sprint="Sprint 3" />}
              />
            </Route>

            <Route
              element={<GuardianDeRol roles={[ROL.DIRECTOR_AGRICULTURA, ROL.ADMINISTRADOR]} />}
            >
              <Route
                path="/panel"
                element={<Pendiente titulo="Panel de reportes" sprint="Sprint 5" />}
              />
            </Route>

            <Route
              element={
                <GuardianDeRol
                  roles={[ROL.APROBADOR_AREA, ROL.DIRECTOR_AGRICULTURA, ROL.ADMINISTRADOR]}
                />
              }
            >
              <Route
                path="/historial"
                element={<Pendiente titulo="Historial" sprint="Sprint 5" />}
              />
            </Route>

            <Route element={<GuardianDeRol roles={[ROL.ADMINISTRADOR]} />}>
              <Route path="/usuarios" element={<Pendiente titulo="Usuarios" sprint="Sprint 3" />} />
              <Route path="/fincas" element={<Pendiente titulo="Fincas" sprint="Sprint 3" />} />
              <Route
                path="/tipos-de-falla"
                element={<Pendiente titulo="Tipos de falla" sprint="Sprint 5" />}
              />
              <Route
                path="/recuperacion"
                element={<Pendiente titulo="Recuperación de contraseñas" sprint="Sprint 3" />}
              />
            </Route>

            <Route path="/avisos" element={<Pendiente titulo="Avisos" sprint="Sprint 5" />} />
            <Route path="/cuenta" element={<Cuenta />} />
          </Route>
        </Route>

        {Componentes ? <Route path="/_dev/componentes" element={<Componentes />} /> : null}
        <Route path="*" element={<NoEncontrada />} />
      </Routes>
    </Suspense>
  )
}
