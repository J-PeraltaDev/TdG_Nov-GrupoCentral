import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes, useLocation } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buscarPorCodigo } from '../core/supabase/repositorios/historial.js'
import { pintarConSesion } from '../pruebas/sesionDePrueba.jsx'
import { BuscadorPorCodigo } from './BuscadorPorCodigo.jsx'

vi.mock('../core/supabase/repositorios/historial.js', () => ({ buscarPorCodigo: vi.fn() }))

function Detalle() {
  const { pathname, state } = useLocation()
  return (
    <p>
      Detalle {pathname} desde {state?.origen}
    </p>
  )
}

function abrir() {
  pintarConSesion(
    <>
      <BuscadorPorCodigo />
      <Routes>
        <Route path="/bandeja" element={<p>Bandeja</p>} />
        <Route path="/novedades/:id" element={<Detalle />} />
      </Routes>
    </>,
    { ruta: '/bandeja?pestana=en_atencion', rol: 'reportante' },
  )
  return screen.getByRole('searchbox', { name: 'Buscar por código' })
}

beforeEach(() => {
  vi.mocked(buscarPorCodigo).mockReset()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Buscador por código (RF-19; plan del Sprint 5, decisión 15)', () => {
  it('RF-19: «nov 153» abre el detalle, que vuelve a la pantalla donde se buscó', async () => {
    vi.mocked(buscarPorCodigo).mockResolvedValue('n-153')
    const campo = abrir()

    await userEvent.type(campo, 'nov 153{Enter}')

    expect(buscarPorCodigo).toHaveBeenCalledExactlyOnceWith(153)
    expect(
      await screen.findByText('Detalle /novedades/n-153 desde /bandeja?pestana=en_atencion'),
    ).toBeVisible()
    expect(campo).toHaveValue('')
  })

  it('RF-19 / RNF-11: si no está o no se puede ver, el mismo mensaje', async () => {
    vi.mocked(buscarPorCodigo).mockResolvedValue(null)
    const campo = abrir()

    await userEvent.type(campo, '153{Enter}')

    expect(
      await screen.findByText('No encontramos NOV-0153 entre las novedades que puedes ver.'),
    ).toBeVisible()
    expect(campo).toHaveAccessibleDescription(
      'No encontramos NOV-0153 entre las novedades que puedes ver.',
    )
    expect(screen.getByText('Bandeja')).toBeVisible()
  })

  it('RF-19: sin dígitos no busca y explica qué escribir; al escribir, el mensaje se va', async () => {
    const campo = abrir()

    await userEvent.type(campo, 'biométrico{Enter}')

    expect(screen.getByText('Escribe un código como NOV-0153.')).toBeVisible()
    expect(buscarPorCodigo).not.toHaveBeenCalled()

    await userEvent.type(campo, '1')
    expect(screen.queryByText('Escribe un código como NOV-0153.')).toBeNull()
  })

  it('RF-19 (decisión 15): sin conexión no busca', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    const campo = abrir()

    await userEvent.type(campo, 'NOV-0153{Enter}')

    expect(screen.getByText('Buscar por código necesita conexión.')).toBeVisible()
    expect(buscarPorCodigo).not.toHaveBeenCalled()
  })

  it('RF-19: si la red falla al buscar, lo mismo', async () => {
    vi.mocked(buscarPorCodigo).mockRejectedValue(new TypeError('Failed to fetch'))
    const campo = abrir()

    await userEvent.type(campo, 'NOV-0153{Enter}')

    expect(await screen.findByText('Buscar por código necesita conexión.')).toBeVisible()
  })
})
