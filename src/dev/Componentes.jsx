import { Boton } from '../core/ui/Boton.jsx'
import { Conexion } from '../core/ui/Conexion.jsx'
import { Estado } from '../core/ui/Estado.jsx'
import { Prioridad } from '../core/ui/Prioridad.jsx'

/*
 * Página de desarrollo (/_dev/componentes): las 28 variantes de los componentes base, en el
 * mismo orden que la sección «00 · Sistema de diseño» de Figma (nodo 1:63), para compararlas
 * a 360 × 800 y a 1280 × 800. No se publica: solo existe con `npm run dev`.
 */

const ESTADOS = [
  'registrada',
  'asignada',
  'en_atencion',
  'escalada',
  'aprobada',
  'rechazada',
  'resuelta',
  'cerrada',
  'pendiente',
]
const PRIORIDADES = ['critico', 'alto', 'normal', 'bajo']
const CONEXIONES = ['en_linea', 'sin_conexion', 'sincronizando']
const TIPOS_BOTON = [
  ['primario', 'Primario'],
  ['secundario', 'Secundario'],
  ['secundario-peligro', 'Secundario peligro'],
  ['texto', 'Texto'],
  ['peligro', 'Peligro'],
]
const TAMANOS_BOTON = [
  ['movil', 'Móvil · 48 px'],
  ['escritorio', 'Escritorio · 40 px'],
]

function Seccion({ titulo, nodo, children }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-subtitulo">
        {titulo} <span className="text-auxiliar text-texto-secundario">Figma {nodo}</span>
      </h2>
      {children}
    </section>
  )
}

export default function Componentes() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 p-4 lg:p-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-titulo">Componentes base</h1>
        <p className="text-cuerpo-pequeno text-texto-secundario">
          Sistema de diseño · 28 variantes. Solo en desarrollo.
        </p>
      </header>

      <Seccion titulo="Estado" nodo="1:93">
        <div className="flex flex-wrap gap-3 rounded-control bg-superficie p-4">
          {ESTADOS.map((estado) => (
            <Estado key={estado} estado={estado} />
          ))}
        </div>
      </Seccion>

      <Seccion titulo="Prioridad" nodo="1:106">
        <div className="flex flex-wrap gap-3 rounded-control bg-superficie p-4">
          {PRIORIDADES.map((prioridad) => (
            <Prioridad key={prioridad} prioridad={prioridad} />
          ))}
        </div>
      </Seccion>

      <Seccion titulo="Conexión" nodo="1:116">
        <div className="flex flex-wrap gap-3 rounded-control bg-superficie p-4">
          {CONEXIONES.map((estado) => (
            <Conexion key={estado} estado={estado} />
          ))}
        </div>
      </Seccion>

      <Seccion titulo="Botón" nodo="1:153">
        <div className="grid gap-6 rounded-control bg-superficie p-4 sm:grid-cols-2">
          {TAMANOS_BOTON.map(([tamano, nombreTamano]) => (
            <div key={tamano} className="flex flex-col items-start gap-3">
              <h3 className="text-etiqueta text-texto-secundario">{nombreTamano}</h3>
              {TIPOS_BOTON.map(([tipo, nombre]) => (
                <Boton key={tipo} tipo={tipo} tamano={tamano}>
                  {nombre}
                </Boton>
              ))}
              <Boton tamano={tamano} disabled>
                Deshabilitado
              </Boton>
            </div>
          ))}
        </div>
      </Seccion>
    </main>
  )
}
