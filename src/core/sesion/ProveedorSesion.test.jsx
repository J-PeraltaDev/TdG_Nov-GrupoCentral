import { act, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSesion } from './ContextoSesion.js'
import { pedirRevisionDelPerfil } from './perfilVigente.js'
import { ProveedorSesion } from './ProveedorSesion.jsx'
import { revisarSesion } from './sesion.js'

// Se simula lo que el proveedor usa: la sesión, el cliente de Auth y la base local.
vi.mock('./sesion.js', () => ({
  revisarSesion: vi.fn(),
  iniciarSesion: vi.fn(),
  cerrarSesion: vi.fn(),
}))
const auth = vi.hoisted(() => ({
  oyente: /** @type {((evento: string) => void) | null} */ (null),
}))
vi.mock('../supabase/cliente.js', () => ({
  supabase: {
    auth: {
      onAuthStateChange: (oyente) => {
        auth.oyente = oyente
        return { data: { subscription: { unsubscribe: () => {} } } }
      },
    },
  },
}))
vi.mock('../offline/bd.js', () => ({ borrarDatosDeSesion: vi.fn().mockResolvedValue(undefined) }))

const REPORTANTE = {
  id: 'u-1',
  nombre: 'Reportante de prueba',
  rol_id: 1,
  finca_id: 'finca-1',
  area_id: null,
  activo: true,
  finca: { id: 'finca-1', nombre: 'Finca de prueba 01', razon_social: null },
  area: null,
}
const conPerfil = (perfil) => ({ perfil, desactivado: false })
const DESACTIVADO = { perfil: null, desactivado: true }

/** Lo que cualquier pantalla ve de la sesión. */
function Testigo() {
  const { fase, perfil, motivoDeSalida } = useSesion()
  return (
    <p data-testid="sesion">
      {[fase, perfil?.nombre, perfil?.rol_id, perfil?.finca_id, motivoDeSalida]
        .filter((dato) => dato !== null && dato !== undefined)
        .join(' · ')}
    </p>
  )
}

const sesion = () => screen.getByTestId('sesion').textContent

async function abrir() {
  render(
    <ProveedorSesion>
      <Testigo />
    </ProveedorSesion>,
  )
  await waitFor(() => expect(sesion()).not.toBe('cargando'))
}

/** La persona vuelve a la pestaña. */
const volver = () => act(() => document.dispatchEvent(new Event('visibilitychange')))
const pasar = (milisegundos) => act(() => vi.advanceTimersByTime(milisegundos))

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-09-24T13:05:00Z') })
  vi.mocked(revisarSesion).mockResolvedValue(conPerfil(REPORTANTE))
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

describe('Proveedor de sesión (RF-01 / CU-01, SDD 6.1.10)', () => {
  it('al abrir recupera la sesión guardada', async () => {
    await abrir()

    expect(sesion()).toBe('con_sesion · Reportante de prueba · 1 · finca-1')
    expect(revisarSesion).toHaveBeenCalledOnce()
  })

  it('sin sesión guardada queda sin sesión, sin motivo', async () => {
    vi.mocked(revisarSesion).mockResolvedValue(conPerfil(null))
    await abrir()

    expect(sesion()).toBe('sin_sesion')
  })
})

describe('El perfil se relee con la sesión viva (RF-03 / CU-01 4b, decisión 16 del plan)', () => {
  it('al volver a la pestaña vuelve a leer el perfil', async () => {
    await abrir()
    pasar(61_000)

    await volver()

    await waitFor(() => expect(revisarSesion).toHaveBeenCalledTimes(2))
  })

  it('no lo relee más de una vez por minuto, ni con la pestaña oculta', async () => {
    await abrir()

    await volver()
    pasar(30_000)
    await volver()
    expect(revisarSesion).toHaveBeenCalledOnce()

    pasar(31_000)
    const visibilidad = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    await volver()
    expect(revisarSesion).toHaveBeenCalledOnce()

    visibilidad.mockReturnValue('visible')
    await volver()
    await waitFor(() => expect(revisarSesion).toHaveBeenCalledTimes(2))
  })

  it('CU-01 4b: si lo desactivaron, queda sin sesión y la pantalla de ingreso sabe por qué', async () => {
    await abrir()
    vi.mocked(revisarSesion).mockResolvedValue(DESACTIVADO)
    pasar(61_000)

    await volver()

    await waitFor(() => expect(sesion()).toBe('sin_sesion · desactivado'))
  })

  it('si Auth avisa primero del cierre, el motivo no se pierde', async () => {
    await abrir()
    vi.mocked(revisarSesion).mockImplementation(async () => {
      // Al cerrar la sesión local, Auth avisa antes de que la revisión termine.
      auth.oyente?.('SIGNED_OUT')
      return DESACTIVADO
    })
    pasar(61_000)

    await volver()

    await waitFor(() => expect(sesion()).toBe('sin_sesion · desactivado'))
    // Y un aviso tardío de Auth tampoco lo borra.
    act(() => auth.oyente?.('SIGNED_OUT'))
    expect(sesion()).toBe('sin_sesion · desactivado')
  })

  it('RF-03: si le cambiaron el rol o la finca, las pantallas reciben el perfil nuevo', async () => {
    await abrir()
    vi.mocked(revisarSesion).mockResolvedValue(
      conPerfil({ ...REPORTANTE, rol_id: 2, finca_id: null, area_id: 'area-m' }),
    )
    pasar(61_000)

    await volver()

    await waitFor(() => expect(sesion()).toBe('con_sesion · Reportante de prueba · 2'))
  })

  it('si nada cambió, las pantallas no se vuelven a pintar', async () => {
    const alPintar = vi.fn()
    function Contador() {
      useSesion()
      alPintar()
      return null
    }
    render(
      <ProveedorSesion>
        <Contador />
        <Testigo />
      </ProveedorSesion>,
    )
    await waitFor(() => expect(sesion()).toContain('con_sesion'))
    const antes = alPintar.mock.calls.length
    // El servidor entrega otro objeto con los mismos datos.
    vi.mocked(revisarSesion).mockResolvedValue(
      conPerfil({ ...REPORTANTE, finca: { ...REPORTANTE.finca } }),
    )
    pasar(61_000)

    await volver()
    await waitFor(() => expect(revisarSesion).toHaveBeenCalledTimes(2))
    await act(async () => {})

    expect(alPintar).toHaveBeenCalledTimes(antes)
  })

  it('cuando una acción responde SIN_PERMISO, lo relee de una vez, sin esperar el minuto', async () => {
    await abrir()
    vi.mocked(revisarSesion).mockResolvedValue(DESACTIVADO)

    act(() => pedirRevisionDelPerfil())

    await waitFor(() => expect(sesion()).toBe('sin_sesion · desactivado'))
    expect(revisarSesion).toHaveBeenCalledTimes(2)
  })

  it('sin sesión no hay nada que releer', async () => {
    vi.mocked(revisarSesion).mockResolvedValue(conPerfil(null))
    await abrir()
    pasar(61_000)

    await volver()
    act(() => pedirRevisionDelPerfil())

    expect(revisarSesion).toHaveBeenCalledOnce()
  })

  it('si la revisión falla (sin red, por ejemplo), la sesión sigue como estaba', async () => {
    await abrir()
    vi.mocked(revisarSesion).mockRejectedValue(new TypeError('Failed to fetch'))
    pasar(61_000)

    await volver()
    await waitFor(() => expect(revisarSesion).toHaveBeenCalledTimes(2))
    await act(async () => {})

    expect(sesion()).toBe('con_sesion · Reportante de prueba · 1 · finca-1')
  })
})
