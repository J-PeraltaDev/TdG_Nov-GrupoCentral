import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ContextoSesion } from '../../core/sesion/ContextoSesion.js'
import { PERFILES } from '../../pruebas/sesionDePrueba.jsx'
import NovedadRecibida from './NovedadRecibida.jsx'

const NOVEDAD = {
  id: 'n-153',
  codigo: 153,
  estado: 'asignada',
  prioridad: 'critico',
  area_id: 'area-m',
  // 24 sep 2026, 7:40 a. m. en Colombia (UTC−5); semana ISO 39.
  fecha_registro: '2026-09-24T12:40:00.000Z',
}

function abrir(state = { novedad: NOVEDAD, area: 'Mantenimiento' }) {
  const sesion = {
    fase: 'con_sesion',
    perfil: PERFILES.reportante,
    ingresar: vi.fn(),
    salir: vi.fn(),
  }
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/registrar/recibida', state }]}>
      <ContextoSesion value={sesion}>
        <Routes>
          <Route path="/registrar/recibida" element={<NovedadRecibida />} />
          <Route path="/registrar" element={<h1>Registrar novedad</h1>} />
          <Route path="/novedades" element={<h1>Mis novedades</h1>} />
        </Routes>
      </ContextoSesion>
    </MemoryRouter>,
  )
}

/** Valor de una fila de la constancia, por su etiqueta. */
function dato(etiqueta) {
  return within(screen.getByText(etiqueta, { selector: 'dt' }).parentElement).getByRole(
    'definition',
  )
}

describe('Pantalla 06 · Novedad recibida (RF-06 / CU-06)', () => {
  afterEach(() => {
    delete navigator.clipboard
  })

  it('RF-06 / CU-06 2: confirma la recepción con el código consecutivo', () => {
    abrir()

    expect(screen.getByRole('heading', { level: 1, name: 'Novedad recibida' })).toBeVisible()
    expect(screen.getByText('NOV-0153')).toBeVisible()
  })

  it('RF-06 / RNF-09: muestra la finca, la fecha real de registro con su semana, la prioridad, el estado y el área', () => {
    abrir()

    expect(dato('Finca')).toHaveTextContent('Finca de prueba 01')
    expect(dato('Registrada')).toHaveTextContent('24 sep 2026, 7:40 a. m. (Sem 39)')
    expect(dato('Prioridad')).toHaveTextContent('Crítico')
    expect(dato('Estado')).toHaveTextContent('Asignada')
    expect(dato('Área')).toHaveTextContent('Mantenimiento')
  })

  it('RF-07 / CU-07: informa que el área ya la tiene en su bandeja', () => {
    abrir()

    expect(
      screen.getByText(
        'Mantenimiento ya la tiene en su bandeja. Te avisaremos cada vez que cambie de estado.',
      ),
    ).toBeVisible()
  })

  it('RF-06: copia el código y lo anuncia', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    abrir()

    await userEvent.click(screen.getByRole('button', { name: 'Copiar' }))

    expect(writeText).toHaveBeenCalledWith('NOV-0153')
    expect(await screen.findByText('Código NOV-0153 copiado')).toBeInTheDocument()
  })

  it('ofrece ver la novedad y registrar otra', () => {
    abrir()

    expect(screen.getByRole('link', { name: 'Ver novedad' })).toHaveAttribute('href', '/novedades')
    expect(screen.getByRole('link', { name: 'Registrar otra novedad' })).toHaveAttribute(
      'href',
      '/registrar',
    )
  })

  it('si se abre sin una novedad recién registrada, vuelve a Mis novedades', () => {
    abrir(null)

    expect(screen.getByRole('heading', { level: 1, name: 'Mis novedades' })).toBeVisible()
  })
})
