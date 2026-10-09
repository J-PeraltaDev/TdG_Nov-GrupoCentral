import { useState } from 'react'
import { AreaDeTexto } from '../core/ui/AreaDeTexto.jsx'
import { AvisoTemporal } from '../core/ui/AvisoTemporal.jsx'
import { Boton } from '../core/ui/Boton.jsx'
import { Conexion } from '../core/ui/Conexion.jsx'
import { Dialogo } from '../core/ui/Dialogo.jsx'
import { Estado } from '../core/ui/Estado.jsx'
import { Hoja } from '../core/ui/Hoja.jsx'
import { Pestanas } from '../core/ui/Pestanas.jsx'
import { Prioridad } from '../core/ui/Prioridad.jsx'

/*
 * Página de desarrollo (/_dev/componentes): las 28 variantes de los componentes base, en el
 * mismo orden que la sección «00 · Sistema de diseño» de Figma (nodo 1:63), para compararlas
 * a 360 × 800 y a 1280 × 800. Debajo, los componentes que agregaron los Sprints 2 y 3 a partir
 * de las pantallas. No se publica: solo existe con `npm run dev`.
 */

const PESTANAS = [
  { id: 'por_atender', nombre: 'Por atender' },
  { id: 'en_atencion', nombre: 'En atención' },
  { id: 'en_espera', nombre: 'En espera' },
]

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
  const [pestana, setPestana] = useState(PESTANAS[0].id)
  const [hojaAbierta, setHojaAbierta] = useState(false)
  const [dialogoAbierto, setDialogoAbierto] = useState(false)
  const [motivo, setMotivo] = useState('Duplicada: ya está en atención como NOV-0149.')

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

      <Seccion titulo="Pestañas" nodo="3:329 y 3:636">
        <div
          id="dev-panel"
          role="tabpanel"
          className="flex flex-col gap-4 rounded-control bg-superficie p-4"
        >
          <Pestanas
            etiqueta="Segmentada (teléfono)"
            pestanas={PESTANAS}
            elegida={pestana}
            alElegir={setPestana}
            idDelPanel="dev-panel"
          />
          <Pestanas
            etiqueta="Subrayada (escritorio)"
            variante="subrayada"
            pestanas={PESTANAS}
            elegida={pestana}
            alElegir={setPestana}
            idDelPanel="dev-panel"
            className="self-start"
          />
        </div>
      </Seccion>

      <Seccion titulo="Área de texto" nodo="3:1483">
        <div className="grid gap-4 rounded-control bg-superficie p-4 lg:grid-cols-2">
          <AreaDeTexto
            etiqueta="Motivo del rechazo"
            obligatorio
            maximo={500}
            value={motivo}
            onChange={(evento) => setMotivo(evento.target.value)}
          />
          <AreaDeTexto
            etiqueta="Con error"
            obligatorio
            maximo={500}
            value=""
            error="Falta un dato obligatorio. Revisa los campos e intenta de nuevo."
            onChange={() => {}}
          />
        </div>
      </Seccion>

      <Seccion titulo="Aviso temporal" nodo="3:1276">
        <div className="flex flex-col gap-3 rounded-control bg-superficie p-4">
          <AvisoTemporal>Novedad tomada. Ya está En atención.</AvisoTemporal>
          <AvisoTemporal tipo="error" accion={{ texto: 'Reintentar', alPulsar: () => {} }}>
            No se aplicó: se perdió la conexión. La novedad sigue En atención.
          </AvisoTemporal>
        </div>
      </Seccion>

      <Seccion titulo="Hoja" nodo="3:1387">
        <div className="flex rounded-control bg-superficie p-4">
          <Boton tipo="secundario" onClick={() => setHojaAbierta(true)}>
            Abrir la hoja
          </Boton>
          <Hoja
            abierta={hojaAbierta}
            alCerrar={() => setHojaAbierta(false)}
            titulo="Título de la hoja"
          >
            <p className="text-cuerpo-pequeno text-texto-secundario">
              En el teléfono sale desde abajo; en el escritorio es un diálogo centrado. Se cierra
              con Escape, tocando el fondo o con su botón.
            </p>
            <Boton tipo="texto" onClick={() => setHojaAbierta(false)}>
              Cancelar
            </Boton>
          </Hoja>
        </div>
      </Seccion>

      <Seccion titulo="Diálogo" nodo="2:1365">
        <div className="flex rounded-control bg-superficie p-4">
          <Boton tipo="secundario" onClick={() => setDialogoAbierto(true)}>
            Abrir el diálogo
          </Boton>
          <Dialogo
            abierto={dialogoAbierto}
            alCerrar={() => setDialogoAbierto(false)}
            titulo="¿Título del diálogo?"
            descripcion="Va centrado en el teléfono y en el escritorio. Se cierra con Escape, tocando el fondo o con su botón."
          >
            <div className="flex gap-2.5">
              <Boton
                tipo="secundario"
                onClick={() => setDialogoAbierto(false)}
                className="min-w-0 flex-1"
              >
                Cancelar
              </Boton>
              <Boton onClick={() => setDialogoAbierto(false)} className="min-w-0 flex-1">
                Confirmar
              </Boton>
            </div>
          </Dialogo>
        </div>
      </Seccion>
    </main>
  )
}
