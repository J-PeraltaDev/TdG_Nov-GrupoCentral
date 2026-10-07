import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
// Empieza a escuchar desde ya si el navegador ofrece instalar la aplicación (RNF-03).
import './core/pwa/instalacion.js'
import { App } from './app/App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
