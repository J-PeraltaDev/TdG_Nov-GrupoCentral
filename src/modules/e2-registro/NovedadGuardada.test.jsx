import { screen, within } from '@testing-library/react'
import { Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { pintarConSesion } from '../../pruebas/sesionDePrueba.jsx'
import NovedadGuardada from './NovedadGuardada.jsx'

vi.mock('../../core/offline/pendientes.js', () => ({ usePendientes: () => 2 }))

const PENDIENTE = {
  id_local: '7f3a2c10-0000-4000-8000-000000000001',
  fecha_registro: '2026-09-24T11:52:00.000Z',
  descripcion: 'El rodillo del cable vía del lote 5 está suelto.',
  prioridad: 'normal',
  area_id: 'area-m',
  area: 'Mantenimiento',
  envio: 'pendiente',
}

function abrir(state) {
  return pintarConSesion(
    <Routes>
      <Route path="/registrar/guardada" element={<NovedadGuardada />} />
      <Route path="/novedades" element={<h1>Mis novedades</h1>} />
    </Routes>,
    { ruta: { pathname: '/registrar/guardada', state }, rol: 'reportante' },
  )
}

describe('Pantalla 07 · Guardada en el dispositivo (RF-21 / CU-21 3 y 4)', () => {
  it('RF-21 / CU-21 4: dice que quedó guardada y que se enviará sola, con los textos de Figma', () => {
    abrir({ pendiente: PENDIENTE })

    expect(
      screen.getByRole('heading', { level: 1, name: 'Guardada en este teléfono' }),
    ).toHaveFocus()
    expect(
      screen.getByText(
        'No hay internet. La novedad quedó guardada y se enviará sola, en el orden en que la registraste, cuando vuelva la conexión. El código se asigna al sincronizar.',
      ),
    ).toBeVisible()
    expect(
      screen.getByText(
        'No borres los datos del navegador ni desinstales la app hasta que se sincronice.',
      ),
    ).toBeVisible()
  })

  it('RF-21 / CU-21 3: muestra el identificador local, la fecha real y el estado pendiente', () => {
    abrir({ pendiente: PENDIENTE })

    const resumen = screen.getByText('Identificador local').closest('dl')
    const dato = (etiqueta) => within(resumen).getByText(etiqueta).nextElementSibling
    expect(dato('Identificador local')).toHaveTextContent('LOC-7F3A')
    expect(dato('Registrada en finca')).toHaveTextContent('24 sep 2026, 6:52 a. m.')
    expect(dato('Prioridad')).toHaveTextContent('Normal')
    expect(dato('Área')).toHaveTextContent('Mantenimiento')
    expect(dato('Estado')).toHaveTextContent('Pendiente de sincronizar')
  })

  it('RF-23: lleva a las pendientes, con cuántas hay, y deja registrar otra', () => {
    abrir({ pendiente: PENDIENTE })

    expect(screen.getByRole('link', { name: 'Ver pendientes (2)' })).toHaveAttribute(
      'href',
      '/pendientes',
    )
    expect(screen.getByRole('link', { name: 'Registrar otra novedad' })).toHaveAttribute(
      'href',
      '/registrar',
    )
  })

  it('si se abre la ruta directamente, no hay constancia que mostrar', () => {
    abrir(undefined)

    expect(screen.getByRole('heading', { name: 'Mis novedades' })).toBeVisible()
  })
})
