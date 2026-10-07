import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listarAreas } from '../../core/supabase/repositorios/catalogos.js'
import { registrarNovedad } from '../../core/supabase/repositorios/novedades.js'
import { pintarConSesion } from '../../pruebas/sesionDePrueba.jsx'
import NovedadRecibida from './NovedadRecibida.jsx'
import RegistrarNovedad from './RegistrarNovedad.jsx'

vi.mock('../../core/supabase/repositorios/novedades.js', () => ({
  registrarNovedad: vi.fn(),
}))
vi.mock('../../core/supabase/repositorios/catalogos.js', () => ({
  listarAreas: vi.fn(),
}))

const AREAS = [
  { id: 'area-m', nombre: 'Mantenimiento' },
  { id: 'area-s', nombre: 'Sistemas' },
]

const REGISTRADA = {
  id: 'n-153',
  codigo: 153,
  estado: 'asignada',
  prioridad: 'critico',
  area_id: 'area-m',
  finca_id: 'finca-1',
  descripcion: 'El puente de la entrada se cayó',
  fecha_registro: '2026-09-24T12:40:00.000Z',
}

function abrir(rol = 'reportante') {
  return pintarConSesion(
    <Routes>
      <Route path="/registrar" element={<RegistrarNovedad />} />
      <Route path="/registrar/recibida" element={<NovedadRecibida />} />
      <Route path="/novedades" element={<h1>Mis novedades</h1>} />
    </Routes>,
    { ruta: '/registrar', rol },
  )
}

async function llenar({
  descripcion = 'El puente de la entrada se cayó',
  prioridad = 'Crítico',
  area = 'Mantenimiento',
} = {}) {
  if (descripcion) await userEvent.type(screen.getByLabelText(/¿Qué está pasando\?/), descripcion)
  if (prioridad)
    await userEvent.click(await screen.findByRole('radio', { name: RegExp(prioridad) }))
  if (area) await userEvent.click(await screen.findByRole('radio', { name: RegExp(area) }))
}

const enviar = () => userEvent.click(screen.getByRole('button', { name: 'Enviar novedad' }))

describe('Pantalla 05 · Registrar novedad (RF-05 / CU-05)', () => {
  beforeEach(() => {
    vi.mocked(registrarNovedad).mockReset()
    vi.mocked(listarAreas).mockReset().mockResolvedValue(AREAS)
  })

  it('RF-05 / CU-05 2: la finca del reportante viene precargada y no se puede cambiar', async () => {
    abrir()

    expect(await screen.findByText('Finca de prueba 01 · Razón social de prueba A')).toBeVisible()
    expect(screen.queryByRole('textbox', { name: 'Finca' })).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  it('RF-05 / CU-05 3: ofrece las cuatro prioridades con su criterio y las áreas del catálogo', async () => {
    abrir()

    const prioridades = within(screen.getByRole('group', { name: /Prioridad/ }))
    expect(prioridades.getAllByRole('radio')).toHaveLength(4)
    for (const criterio of [
      'Detiene la operación o el ingreso del personal',
      'Afecta la operación, pero se puede seguir trabajando',
      'Se puede programar en los próximos días',
      'Daño menor o mejora',
    ]) {
      expect(prioridades.getByText(criterio)).toBeVisible()
    }

    const areas = within(screen.getByRole('group', { name: /Área que debe atenderla/ }))
    expect(await areas.findAllByRole('radio')).toHaveLength(2)
    expect(
      areas.getByText('Infraestructura, puentes, bombas, equipos y herramientas'),
    ).toBeVisible()
    expect(areas.getByText('Internet, biométricos, torniquetes y equipos de cómputo')).toBeVisible()
  })

  it('RF-05: cuenta los caracteres de la descripción sobre el máximo de 500', async () => {
    abrir()

    expect(screen.getByText('0/500')).toBeVisible()
    await userEvent.type(screen.getByLabelText(/¿Qué está pasando\?/), 'Bomba')
    expect(screen.getByText('5/500')).toBeVisible()
    expect(screen.getByLabelText(/¿Qué está pasando\?/)).toHaveAttribute('maxlength', '500')
  })

  it('RF-05 / CU-05 4a: sin datos señala los tres campos, lleva el foco al primero y no envía', async () => {
    abrir()
    await screen.findAllByRole('radio', { name: /Mantenimiento|Sistemas/ })

    await enviar()

    expect(screen.getByRole('alert')).toHaveTextContent('Faltan 3 datos obligatorios')
    const descripcion = screen.getByLabelText(/¿Qué está pasando\?/)
    expect(descripcion).toBeInvalid()
    expect(descripcion).toHaveAccessibleDescription('Describe la novedad')
    expect(descripcion).toHaveFocus()
    expect(screen.getByRole('group', { name: /Prioridad/ })).toHaveAccessibleDescription(
      'Elige la prioridad',
    )
    expect(
      screen.getByRole('group', { name: /Área que debe atenderla/ }),
    ).toHaveAccessibleDescription('Elige el área')
    expect(registrarNovedad).not.toHaveBeenCalled()
  })

  it('RF-05 / CU-05 4a: si falta un solo dato lo dice en singular y enfoca ese campo', async () => {
    abrir()
    await llenar({ prioridad: null })

    await enviar()

    expect(screen.getByRole('alert')).toHaveTextContent('Falta 1 dato obligatorio')
    expect(screen.getByRole('radio', { name: /Crítico/ })).toHaveFocus()
    expect(screen.getByLabelText(/¿Qué está pasando\?/)).toHaveValue(
      'El puente de la entrada se cayó',
    )
    expect(registrarNovedad).not.toHaveBeenCalled()
  })

  it('RF-05 / CU-05 4a: al corregir un campo se le quita su señal de error', async () => {
    abrir()
    await screen.findAllByRole('radio', { name: /Mantenimiento|Sistemas/ })
    await enviar()
    expect(screen.getByRole('alert')).toHaveTextContent('Faltan 3 datos obligatorios')

    await userEvent.type(screen.getByLabelText(/¿Qué está pasando\?/), 'Bomba dañada')
    await userEvent.click(screen.getByRole('radio', { name: /Alto/ }))

    expect(screen.getByRole('alert')).toHaveTextContent('Falta 1 dato obligatorio')
    expect(screen.getByLabelText(/¿Qué está pasando\?/)).toBeValid()
    expect(screen.queryByText('Elige la prioridad')).not.toBeInTheDocument()
    expect(screen.getByText('Elige el área')).toBeVisible()
  })

  it('RF-05 / CU-05 4a: al completar lo que faltaba, envía', async () => {
    vi.mocked(registrarNovedad).mockResolvedValue(REGISTRADA)
    abrir()
    await llenar({ area: null })
    await enviar()
    expect(screen.getByRole('alert')).toHaveTextContent('Falta 1 dato obligatorio')

    await userEvent.click(screen.getByRole('radio', { name: /Mantenimiento/ }))
    await enviar()

    expect(registrarNovedad).toHaveBeenCalledTimes(1)
    expect(await screen.findByRole('heading', { level: 1, name: 'Novedad recibida' })).toBeVisible()
  })

  it('RF-05 / CU-05 5 y RF-06 / CU-06: envía los datos con su identificador y su fecha, y muestra la constancia', async () => {
    vi.mocked(registrarNovedad).mockResolvedValue(REGISTRADA)
    abrir()
    await llenar({ descripcion: '  El puente de la entrada se cayó ' })

    const antes = Date.now()
    await enviar()

    expect(await screen.findByRole('heading', { level: 1, name: 'Novedad recibida' })).toBeVisible()
    expect(screen.getByText('NOV-0153')).toBeVisible()

    const [enviado] = vi.mocked(registrarNovedad).mock.calls[0]
    expect(enviado).toMatchObject({
      descripcion: 'El puente de la entrada se cayó',
      prioridad: 'critico',
      area_id: 'area-m',
    })
    expect(enviado.id_local).toMatch(/^[0-9a-f-]{36}$/)
    expect(new Date(enviado.fecha_registro).getTime()).toBeGreaterThanOrEqual(antes - 1000)
    expect(new Date(enviado.fecha_registro).getTime()).toBeLessThanOrEqual(Date.now())
  })

  it('RNF-08 / RNF-09: si la red se corta, conserva lo escrito y reintenta con el mismo identificador y la misma fecha', async () => {
    vi.mocked(registrarNovedad)
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(REGISTRADA)
    abrir()
    await llenar()

    await enviar()

    expect(await screen.findByRole('alert')).toHaveTextContent('La novedad no se envió')
    expect(screen.getByLabelText(/¿Qué está pasando\?/)).toHaveValue(
      'El puente de la entrada se cayó',
    )
    expect(screen.getByRole('radio', { name: /Crítico/ })).toBeChecked()
    expect(screen.getByRole('radio', { name: /Mantenimiento/ })).toBeChecked()

    await enviar()

    expect(await screen.findByText('NOV-0153')).toBeVisible()
    const [[primero], [segundo]] = vi.mocked(registrarNovedad).mock.calls
    expect(segundo.id_local).toBe(primero.id_local)
    expect(segundo.fecha_registro).toBe(primero.fecha_registro)
  })

  it('RF-05: un error del servidor se muestra con su mensaje y no se pierde el formulario', async () => {
    vi.mocked(registrarNovedad).mockRejectedValue({ code: 'P0001', message: 'FINCA_NO_ASIGNADA' })
    abrir()
    await llenar()

    await enviar()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Tu usuario no tiene una finca asignada.',
    )
    expect(screen.getByRole('button', { name: 'Enviar novedad' })).toBeEnabled()
  })

  it('RF-05: mientras envía no deja enviar dos veces', async () => {
    let resolver
    vi.mocked(registrarNovedad).mockReturnValue(new Promise((r) => (resolver = r)))
    abrir()
    await llenar()

    await enviar()

    expect(screen.getByRole('button', { name: 'Enviando…' })).toBeDisabled()
    resolver(REGISTRADA)
    expect(await screen.findByText('NOV-0153')).toBeVisible()
    expect(registrarNovedad).toHaveBeenCalledTimes(1)
  })

  it('si las áreas no cargan, lo dice y deja reintentar', async () => {
    vi.mocked(listarAreas).mockRejectedValueOnce(new TypeError('Failed to fetch'))
    abrir()

    expect(
      await screen.findByText('No pudimos cargar las áreas. Revisa tu conexión.'),
    ).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByRole('radio', { name: /Sistemas/ })).toBeVisible()
  })

  it('se puede cerrar sin registrar y volver a Mis novedades', async () => {
    abrir()

    await userEvent.click(screen.getByRole('link', { name: 'Cerrar sin registrar' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Mis novedades' })).toBeVisible()
  })
})
