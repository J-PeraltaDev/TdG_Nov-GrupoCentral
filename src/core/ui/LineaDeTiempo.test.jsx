import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LineaDeTiempo } from './LineaDeTiempo.jsx'

const REPORTANTE = { nombre: 'Luz Marina Córdoba', rol_id: 1, area: null }
const APROBADOR = { nombre: 'Carlos Mario Restrepo', rol_id: 2, area: 'Mantenimiento' }
const DIRECTOR = { nombre: 'Hernán Darío Úsuga', rol_id: 3, area: null }

const transicion = (id, anterior, nuevo, cambios = {}) => ({
  id,
  estado_anterior: anterior,
  estado_nuevo: nuevo,
  observacion: null,
  fecha_hora: '2026-09-21T11:48:00Z',
  area_anterior: null,
  area_nueva: null,
  usuario: REPORTANTE,
  ...cambios,
})

// De la más reciente a la más antigua, como las entrega el repositorio.
const COMPLETA = [
  transicion(5, 'escalada', 'aprobada', {
    usuario: DIRECTOR,
    fecha_hora: '2026-09-22T13:10:00Z',
    observacion: 'Aprobado. Comprar con el proveedor habitual.',
  }),
  transicion(4, 'en_atencion', 'escalada', {
    usuario: APROBADOR,
    fecha_hora: '2026-09-21T19:30:00Z',
    observacion: 'Se requiere comprar 8 tablones de 3 m; no hay material en bodega.',
  }),
  transicion(3, 'asignada', 'en_atencion', {
    usuario: APROBADOR,
    fecha_hora: '2026-09-21T15:02:00Z',
  }),
  transicion(2, 'registrada', 'asignada', {
    fecha_hora: '2026-09-21T14:15:00Z',
    area_nueva: { nombre: 'Mantenimiento' },
  }),
  transicion(1, null, 'registrada'),
]

const pasos = () => screen.getAllByRole('listitem')

describe('Línea de tiempo (RF-18 / CU-18 4, Figma 3:817 y 4:2212)', () => {
  it('RF-18 / CU-18 4: muestra cada transición en el orden recibido, de la más reciente a la más antigua', () => {
    render(<LineaDeTiempo transiciones={COMPLETA} />)

    expect(pasos()).toHaveLength(5)
    expect(within(pasos()[0]).getByText('Aprobada')).toBeVisible()
    expect(within(pasos()[4]).getByText('Registrada')).toBeVisible()
  })

  it('RF-16 / CU-16 1: cada transición dice de qué estado a qué estado pasó', () => {
    render(<LineaDeTiempo transiciones={COMPLETA} />)

    const tomada = within(pasos()[2])
    expect(tomada.getByText('Asignada')).toBeVisible()
    expect(tomada.getByText('pasa a')).toBeInTheDocument()
    expect(tomada.getByText('En atención')).toBeVisible()
  })

  it('RF-16 / CU-16 1: la creación solo tiene el estado nuevo', () => {
    render(<LineaDeTiempo transiciones={COMPLETA} />)

    const creacion = within(pasos()[4])
    expect(creacion.getByText('Registrada')).toBeVisible()
    expect(creacion.queryByText('pasa a')).not.toBeInTheDocument()
    expect(creacion.getByText('Luz Marina Córdoba · Reportante')).toBeVisible()
    expect(creacion.getByText('21 sep, 6:48 a. m.')).toBeVisible()
  })

  it('RF-07: el enrutamiento se presenta como acción del sistema, con el área', () => {
    render(<LineaDeTiempo transiciones={COMPLETA} />)

    const enrutamiento = within(pasos()[3])
    expect(enrutamiento.getByText('Sistema')).toBeVisible()
    expect(enrutamiento.getByText('21 sep, 9:15 a. m.').parentElement).toHaveTextContent(
      '21 sep, 9:15 a. m. · Área: Mantenimiento',
    )
    expect(enrutamiento.queryByText(/Luz Marina/)).not.toBeInTheDocument()
  })

  it('RF-18 / CU-18 4: el usuario va con su rol y, si lo tiene, su área', () => {
    render(<LineaDeTiempo transiciones={COMPLETA} />)

    expect(
      within(pasos()[2]).getByText('Carlos Mario Restrepo · Aprobador · Mantenimiento'),
    ).toBeVisible()
    expect(
      within(pasos()[0]).getByText('Hernán Darío Úsuga · Director de agricultura'),
    ).toBeVisible()
  })

  it('RF-18 / CU-18 4: la observación va en su recuadro, solo si la hay', () => {
    render(<LineaDeTiempo transiciones={COMPLETA} />)

    expect(
      within(pasos()[1]).getByText(
        'Se requiere comprar 8 tablones de 3 m; no hay material en bodega.',
      ),
    ).toBeVisible()
    expect(within(pasos()[2]).getAllByRole('paragraph')).toHaveLength(3)
    expect(within(pasos()[1]).getAllByRole('paragraph')).toHaveLength(4)
  })

  it('RF-17: una reasignación muestra el área anterior, la nueva y el motivo', () => {
    render(
      <LineaDeTiempo
        transiciones={[
          transicion(3, 'asignada', 'asignada', {
            usuario: { nombre: 'Jhon Fredy Mosquera', rol_id: 2, area: 'Sistemas' },
            fecha_hora: '2026-09-24T12:40:00Z',
            area_anterior: { nombre: 'Sistemas' },
            area_nueva: { nombre: 'Mantenimiento' },
            observacion: 'Es un daño del aire acondicionado; lo atiende Mantenimiento.',
          }),
        ]}
      />,
    )

    const reasignacion = within(pasos()[0])
    expect(reasignacion.getByText('Jhon Fredy Mosquera · Aprobador · Sistemas')).toBeVisible()
    expect(reasignacion.getByText('24 sep, 7:40 a. m.').parentElement).toHaveTextContent(
      '24 sep, 7:40 a. m. · Área: de Sistemas a Mantenimiento',
    )
    expect(
      reasignacion.getByText('Es un daño del aire acondicionado; lo atiende Mantenimiento.'),
    ).toBeVisible()
  })

  it('RNF-12: en el detalle completo aclara que el historial no se puede cambiar', () => {
    const { rerender } = render(<LineaDeTiempo transiciones={COMPLETA} />)
    expect(screen.queryByText('El historial no se puede editar ni borrar.')).not.toBeInTheDocument()

    rerender(<LineaDeTiempo transiciones={COMPLETA} conPie />)
    expect(screen.getByText('El historial no se puede editar ni borrar.')).toBeVisible()
  })

  it('si no se conoce al usuario de una transición, no inventa un nombre', () => {
    render(<LineaDeTiempo transiciones={[transicion(1, null, 'registrada', { usuario: null })]} />)

    expect(pasos()).toHaveLength(1)
    expect(within(pasos()[0]).getByText('21 sep, 6:48 a. m.')).toBeVisible()
  })
})
