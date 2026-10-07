import { BrowserRouter } from 'react-router'
import { AvisoNuevaVersion } from './AvisoNuevaVersion.jsx'
import { Rutas } from './Rutas.jsx'

export function App() {
  return (
    <BrowserRouter>
      <Rutas />
      <AvisoNuevaVersion />
    </BrowserRouter>
  )
}
