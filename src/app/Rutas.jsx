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
const MisNovedades = lazy(() => import('../modules/e4-consulta/MisNovedades.jsx'))
const Bandeja = lazy(() => import('../modules/e3-atencion/Bandeja.jsx'))
const Escaladas = lazy(() => import('../modules/e3-atencion/Escaladas.jsx'))
const DetalleNovedad = lazy(() => import('../modules/e4-consulta/DetalleNovedad.jsx'))
const RegistrarSolucion = lazy(() => import('../modules/e3-atencion/RegistrarSolucion.jsx'))
const RegistrarNovedad = lazy(() => import('../modules/e2-registro/RegistrarNovedad.jsx'))
const NovedadRecibida = lazy(() => import('../modules/e2-registro/NovedadRecibida.jsx'))
// Sin sesión, pero fuera de la ruta de ingreso: solo se descarga si alguien la abre.
const TratamientoDeDatos = lazy(() => import('../modules/e1-acceso-admin/TratamientoDeDatos.jsx'))

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
        <Route path="/tratamiento-de-datos" element={<TratamientoDeDatos />} />

        <Route element={<RequiereSesion />}>
          <Route element={<Marco />}>
            <Route element={<GuardianDeRol roles={[ROL.REPORTANTE]} />}>
              <Route path="/novedades" element={<MisNovedades />} />
            </Route>

            <Route element={<GuardianDeRol roles={[ROL.APROBADOR_AREA]} />}>
              <Route path="/bandeja" element={<Bandeja />} />
            </Route>

            <Route element={<GuardianDeRol roles={[ROL.DIRECTOR_AGRICULTURA]} />}>
              <Route path="/escaladas" element={<Escaladas />} />
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

          {/* Detalle de una novedad: lo consultan los cuatro roles, cada uno dentro de su
              alcance (RF-18). En el teléfono trae su propia barra superior. */}
          <Route element={<Marco sinBarraSuperior />}>
            <Route
              element={
                <GuardianDeRol
                  roles={[
                    ROL.REPORTANTE,
                    ROL.APROBADOR_AREA,
                    ROL.DIRECTOR_AGRICULTURA,
                    ROL.ADMINISTRADOR,
                  ]}
                />
              }
            >
              <Route path="/novedades/:id" element={<DetalleNovedad />} />
            </Route>
          </Route>

          {/* Pantallas de una sola tarea: en el teléfono van sin las barras de navegación. */}
          <Route element={<Marco enfocado />}>
            <Route element={<GuardianDeRol roles={[ROL.REPORTANTE]} />}>
              <Route path="/registrar" element={<RegistrarNovedad />} />
              <Route path="/registrar/recibida" element={<NovedadRecibida />} />
            </Route>
            <Route element={<GuardianDeRol roles={[ROL.APROBADOR_AREA]} />}>
              <Route path="/novedades/:id/solucion" element={<RegistrarSolucion />} />
            </Route>
          </Route>
        </Route>

        {Componentes ? <Route path="/_dev/componentes" element={<Componentes />} /> : null}
        <Route path="*" element={<NoEncontrada />} />
      </Routes>
    </Suspense>
  )
}
