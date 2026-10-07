import { BrowserRouter } from 'react-router'
import { ProveedorSesion } from '../core/sesion/ProveedorSesion.jsx'
import { AvisoNuevaVersion } from './AvisoNuevaVersion.jsx'
import { Rutas } from './Rutas.jsx'

export function App() {
  return (
    <BrowserRouter>
      <ProveedorSesion>
        <Rutas />
        <AvisoNuevaVersion />
      </ProveedorSesion>
    </BrowserRouter>
  )
}
