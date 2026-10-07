import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router'
import { Cargando } from './Cargando.jsx'
import { Inicio } from './paginas/Inicio.jsx'
import { NoEncontrada } from './paginas/NoEncontrada.jsx'

// Página de componentes: solo existe en desarrollo. En el build de producción esta
// condición es falsa y el módulo ni siquiera se empaqueta.
const Componentes = import.meta.env.DEV ? lazy(() => import('../dev/Componentes.jsx')) : null

/**
 * Rutas de la aplicación.
 *
 * Sprint 0: solo la app de prueba. Desde el Sprint 1 aquí van el ingreso, el guardián de rol
 * y las rutas de cada rol, cargadas bajo demanda con `React.lazy` (SDD 6.1.11, RNF-05).
 *
 * Se usa la API declarativa de React Router (BrowserRouter y Routes) y no la de datos
 * (createBrowserRouter): pesa unos 17 KB comprimidos menos en la ruta de ingreso.
 */
export function Rutas() {
  return (
    <Suspense fallback={<Cargando />}>
      <Routes>
        <Route path="/" element={<Inicio />} />
        {Componentes ? <Route path="/_dev/componentes" element={<Componentes />} /> : null}
        <Route path="*" element={<NoEncontrada />} />
      </Routes>
    </Suspense>
  )
}
