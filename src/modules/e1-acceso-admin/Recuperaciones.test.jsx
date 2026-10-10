import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { alPedirConteoDeInsignias } from '../../app/insignias.js'
import { alPedirRevisionDelPerfil } from '../../core/sesion/perfilVigente.js'
import { listarAreas } from '../../core/supabase/repositorios/catalogos.js'
import { listarFincasConConteos } from '../../core/supabase/repositorios/fincas.js'
import {
  generarCodigoRecuperacion,
  listarSolicitudes,
} from '../../core/supabase/repositorios/recuperacion.js'
import { listarUsuarios } from '../../core/supabase/repositorios/usuarios.js'
import { simularPantalla } from '../../pruebas/pantalla.js'
import { pintarConSesion } from '../../pruebas/sesionDePrueba.jsx'
import Recuperaciones from './Recuperaciones.jsx'

// Se simulan los repositorios, nunca la red.
vi.mock('../../core/supabase/repositorios/recuperacion.js', () => ({
  listarSolicitudes: vi.fn(),
  generarCodigoRecuperacion: vi.fn(),
}))
vi.mock('../../core/supabase/repositorios/usuarios.js', () => ({ listarUsuarios: vi.fn() }))
vi.mock('../../core/supabase/repositorios/fincas.js', () => ({ listarFincasConConteos: vi.fn() }))
vi.mock('../../core/supabase/repositorios/catalogos.js', () => ({ listarAreas: vi.fn() }))

// 8:05 a. m. del 24 de septiembre de 2026 en Colombia.
const AHORA = new Date('2026-09-24T13:05:00Z')
const en = (minutos) => new Date(AHORA.getTime() + minutos * 60_000).toISOString()

const AREAS = [
  { id: 'area-m', nombre: 'Mantenimiento' },
  { id: 'area-s', nombre: 'Sistemas' },
]
const FINCAS = [
  { id: 'f-1', nombre: 'Altamira', activo: true },
  { id: 'f-2', nombre: 'El Jardín', activo: true },
]
const USUARIOS = [
  {
    id: 'u-1',
    nombre: 'Yolanda Pérez',
    correo: 'yolanda@novedades.test',
    rol_id: 1,
    finca_id: 'f-1',
    area_id: null,
    activo: true,
  },
  {
    id: 'u-2',
    nombre: 'Jairo Mena',
    correo: 'jairo@novedades.test',
    rol_id: 2,
    finca_id: null,
    area_id: 'area-s',
    activo: true,
  },
  {
    id: 'u-3',
    nombre: 'Lucía Torres',
    correo: 'lucia@novedades.test',
    rol_id: 1,
    finca_id: 'f-2',
    area_id: null,
    activo: true,
  },
  {
    id: 'u-4',
    nombre: 'Néstor Ruiz',
    correo: 'nestor@novedades.test',
    rol_id: 3,
    finca_id: null,
    area_id: null,
    activo: true,
  },
]

const solicitud = (id, usuarioId, minutos, cambios = {}) => ({
  id,
  usuario_id: usuarioId,
  creada_en: en(-minutos),
  expira_en: null,
  usado: false,
  intentos_fallidos: 0,
  ...cambios,
})

/** De la más reciente a la más antigua, como las entrega el repositorio. */
const SOLICITUDES = [
  solicitud('s-1', 'u-1', 12),
  solicitud('s-2', 'u-2', 40, { expira_en: en(20) }),
  solicitud('s-4', 'u-4', 180, { expira_en: en(-140) }),
  solicitud('s-5', 'u-1', 300, { expira_en: en(10), intentos_fallidos: 5 }),
  solicitud('s-3', 'u-3', 1500, { expira_en: en(-1480), usado: true }),
]

const CODIGO = { codigo: '482719', expira_en: en(30) }

function abrir() {
  return pintarConSesion(<Recuperaciones />, { ruta: '/recuperacion', rol: 'administrador' })
}

const fila = (nombre) => screen.getByRole('row', { name: new RegExp(nombre) })
const celdas = (nombre) =>
  within(fila(nombre))
    .getAllByRole('cell')
    .map((celda) => celda.textContent)
const pestana = (nombre) => screen.getByRole('tab', { name: nombre })
const dialogo = () => within(screen.getByRole('dialog', { name: 'Código temporal generado' }))
const generar = (nombre) =>
  within(fila(nombre)).getByRole('button', { name: `Generar código para ${nombre}` })

let copiar

beforeEach(() => {
  // Solo se fija la fecha: los temporizadores siguen siendo reales.
  vi.useFakeTimers({ toFake: ['Date'], now: AHORA })
  simularPantalla('escritorio')
  vi.mocked(listarSolicitudes).mockResolvedValue(SOLICITUDES)
  vi.mocked(listarUsuarios).mockResolvedValue(USUARIOS)
  vi.mocked(listarFincasConConteos).mockResolvedValue(FINCAS)
  vi.mocked(listarAreas).mockResolvedValue(AREAS)
  vi.mocked(generarCodigoRecuperacion).mockResolvedValue(CODIGO)
  copiar = vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: copiar },
    configurable: true,
  })
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  delete navigator.clipboard
})

describe('Pantalla 32 · Recuperación de contraseñas (RF-02 / CU-02 5)', () => {
  it('muestra los textos de Figma: el título, la explicación, las pestañas y las columnas', async () => {
    abrir()

    expect(
      screen.getByRole('heading', { level: 1, name: 'Recuperación de contraseñas' }),
    ).toBeVisible()
    expect(
      screen.getByText(
        'Los correos de la plataforma no reciben mensajes. Genera un código temporal y entrégalo a la persona en persona o por teléfono.',
      ),
    ).toBeVisible()
    expect(await screen.findByRole('tab', { name: 'Pendientes (2)' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(pestana('Atendidas')).toHaveAttribute('aria-selected', 'false')
    expect(screen.getAllByRole('columnheader').map((columna) => columna.textContent)).toEqual([
      'Usuario',
      'Correo',
      'Rol y finca o área',
      'Solicitada',
      'Estado',
      'Acción',
    ])
  })

  it('RF-02 / CU-02 5: en «Pendientes» están las que esperan un código y las que ya lo tienen vigente', async () => {
    abrir()
    await screen.findByRole('tab', { name: 'Pendientes (2)' })

    expect(screen.getAllByRole('row').slice(1)).toHaveLength(2)
    expect(celdas('Yolanda Pérez')).toEqual([
      'yolanda@novedades.test',
      'Reportante · Altamira',
      'hace 12 min',
      'Pendiente',
      'Generar código',
    ])
    expect(celdas('Jairo Mena')).toEqual([
      'jairo@novedades.test',
      'Aprobador · Sistemas',
      'hace 40 min',
      'Código generado',
      'Generar otro código',
    ])
  })

  it('RF-02: en «Atendidas» están las usadas y las vencidas, sin ninguna acción', async () => {
    abrir()
    await userEvent.click(await screen.findByRole('tab', { name: 'Atendidas' }))

    expect(pestana('Atendidas')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getAllByRole('row').slice(1)).toHaveLength(3)
    expect(celdas('Néstor Ruiz')).toEqual([
      'nestor@novedades.test',
      'Director de agricultura',
      'hace 3 h',
      'Vencida',
      '—',
    ])
    // Agotó los cinco intentos: aunque le quede tiempo, su código ya no sirve.
    expect(celdas('Yolanda Pérez').slice(3)).toEqual(['Vencida', '—'])
    expect(celdas('Lucía Torres').slice(2)).toEqual(['hace 1 d', 'Usada', '—'])
    expect(screen.queryByRole('button', { name: /Generar/ })).not.toBeInTheDocument()
  })

  it('RF-02: la solicitud abierta de un usuario que fue desactivado ya no admite un código: va en «Atendidas», como vencida', async () => {
    vi.mocked(listarUsuarios).mockResolvedValue(
      USUARIOS.map((usuario) => (usuario.id === 'u-2' ? { ...usuario, activo: false } : usuario)),
    )
    abrir()

    // Jairo tenía un código vigente; solo queda la de Yolanda.
    expect(await screen.findByRole('tab', { name: 'Pendientes (1)' })).toBeVisible()
    expect(screen.queryByText('Jairo Mena')).not.toBeInTheDocument()

    await userEvent.click(pestana('Atendidas'))
    expect(celdas('Jairo Mena').slice(3)).toEqual(['Vencida', '—'])
  })

  it('sin solicitudes, cada pestaña lo dice', async () => {
    vi.mocked(listarSolicitudes).mockResolvedValue([])
    abrir()

    expect(await screen.findByText('No hay solicitudes pendientes.')).toBeVisible()
    expect(pestana('Pendientes (0)')).toBeVisible()

    await userEvent.click(pestana('Atendidas'))
    expect(screen.getByText('Todavía no hay solicitudes atendidas.')).toBeVisible()
  })

  it('en el teléfono, las solicitudes van en tarjetas', async () => {
    simularPantalla('telefono')
    abrir()

    const tarjeta = within(
      (await screen.findByRole('heading', { level: 2, name: 'Yolanda Pérez' })).closest('li'),
    )
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(tarjeta.getByText('yolanda@novedades.test')).toBeVisible()
    expect(tarjeta.getByText('Reportante · Altamira')).toBeVisible()
    expect(tarjeta.getByText('Pendiente')).toBeVisible()
    expect(tarjeta.getByText('Solicitada hace 12 min')).toBeVisible()
    expect(tarjeta.getByRole('button', { name: 'Generar código para Yolanda Pérez' })).toBeVisible()
  })

  it('si la lista no carga, lo dice y deja reintentar', async () => {
    vi.mocked(listarSolicitudes).mockRejectedValueOnce(new TypeError('Failed to fetch'))
    abrir()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No hay conexión. Revisa tu internet e intenta de nuevo.',
    )

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByRole('tab', { name: 'Pendientes (2)' })).toBeVisible()
  })

  it('RNF-11: si la lista responde SIN_PERMISO, pide releer el perfil', async () => {
    const oyente = vi.fn()
    const dejar = alPedirRevisionDelPerfil(oyente)
    vi.mocked(listarSolicitudes).mockRejectedValueOnce({ code: 'P0001', message: 'SIN_PERMISO' })
    abrir()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No tienes permiso para esta acción.',
    )
    expect(oyente).toHaveBeenCalled()
    dejar()
  })
})

describe('Pantalla 32 · Generar el código temporal (RF-02 / CU-02 6 y 7)', () => {
  it('RF-02 / CU-02 6: genera el código de esa solicitud y lo muestra una sola vez, como en Figma', async () => {
    abrir()
    await screen.findByText('Yolanda Pérez')
    await userEvent.click(generar('Yolanda Pérez'))

    expect(generarCodigoRecuperacion).toHaveBeenCalledExactlyOnceWith('s-1')
    expect(await screen.findByRole('dialog', { name: 'Código temporal generado' })).toBeVisible()
    expect(dialogo().getByText('Yolanda Pérez · yolanda@novedades.test')).toBeVisible()
    expect(dialogo().getByText('482 719')).toBeVisible()
    expect(
      dialogo().getByText(
        'Vence hoy a las 8:35 a. m. Solo se puede usar una vez y no se volverá a mostrar.',
      ),
    ).toBeVisible()
    expect(
      dialogo().getByText('Verifica la identidad de la persona antes de entregarlo.'),
    ).toBeVisible()
    expect(dialogo().getByRole('button', { name: 'Copiar' })).toBeVisible()
    expect(dialogo().getByRole('button', { name: 'Listo' })).toBeVisible()
  })

  it('un lector de pantalla lo dice dígito por dígito, no como un número', async () => {
    abrir()
    await screen.findByText('Yolanda Pérez')
    await userEvent.click(generar('Yolanda Pérez'))
    await screen.findByRole('dialog', { name: 'Código temporal generado' })

    expect(dialogo().getByText('482 719')).toHaveAttribute('aria-hidden', 'true')
    expect(dialogo().getByText('Código: 4 8 2 7 1 9')).toBeInTheDocument()
  })

  it('RF-02 / CU-02 7: «Copiar» deja el código en el portapapeles, sin el espacio, y lo confirma', async () => {
    abrir()
    await screen.findByText('Yolanda Pérez')
    await userEvent.click(generar('Yolanda Pérez'))
    await userEvent.click(await screen.findByRole('button', { name: 'Copiar' }))

    expect(copiar).toHaveBeenCalledExactlyOnceWith('482719')
    expect(await dialogo().findByRole('button', { name: 'Copiado' })).toBeVisible()
    expect(dialogo().getByRole('status')).toHaveTextContent('Código copiado.')
  })

  it('si el navegador no deja copiar, lo dice: el código sigue a la vista', async () => {
    copiar.mockRejectedValue(new Error('NotAllowedError'))
    abrir()
    await screen.findByText('Yolanda Pérez')
    await userEvent.click(generar('Yolanda Pérez'))
    await userEvent.click(await screen.findByRole('button', { name: 'Copiar' }))

    expect(await dialogo().findByRole('status')).toHaveTextContent(
      'No se pudo copiar. Escríbelo o selecciónalo a mano.',
    )
    expect(dialogo().getByText('482 719')).toBeVisible()
  })

  it('RNF-11: al cerrar con «Listo» el código desaparece, y la solicitud queda con «Código generado»', async () => {
    abrir()
    await screen.findByText('Yolanda Pérez')
    vi.mocked(listarSolicitudes).mockResolvedValue([
      solicitud('s-1', 'u-1', 12, { expira_en: en(30) }),
      ...SOLICITUDES.slice(1),
    ])
    const guardarLocal = vi.spyOn(Storage.prototype, 'setItem')

    await userEvent.click(generar('Yolanda Pérez'))
    await userEvent.click(await screen.findByRole('button', { name: 'Listo' }))

    await waitFor(() => expect(celdas('Yolanda Pérez').slice(3)[0]).toBe('Código generado'))
    expect(
      screen.queryByRole('dialog', { name: 'Código temporal generado' }),
    ).not.toBeInTheDocument()
    expect(document.body).not.toHaveTextContent('482 719')
    expect(document.body).not.toHaveTextContent('482719')
    expect(guardarLocal).not.toHaveBeenCalled()
    expect(listarSolicitudes).toHaveBeenCalledTimes(2)
  })

  it('RNF-11: un clic fuera del diálogo no lo cierra: el código no se puede volver a mostrar', async () => {
    abrir()
    await screen.findByText('Yolanda Pérez')
    await userEvent.click(generar('Yolanda Pérez'))
    const ventana = await screen.findByRole('dialog', { name: 'Código temporal generado' })

    await userEvent.click(ventana)

    expect(dialogo().getByText('482 719')).toBeVisible()
  })

  it('RF-02: «Generar otro código» reemplaza el de una solicitud que ya tenía uno', async () => {
    abrir()
    await screen.findByText('Jairo Mena')

    await userEvent.click(
      within(fila('Jairo Mena')).getByRole('button', {
        name: 'Generar otro código para Jairo Mena',
      }),
    )

    expect(generarCodigoRecuperacion).toHaveBeenCalledExactlyOnceWith('s-2')
    expect(await dialogo().findByText('Jairo Mena · jairo@novedades.test')).toBeVisible()
  })

  it('mientras genera, el botón queda deshabilitado y lo dice', async () => {
    let terminar
    vi.mocked(generarCodigoRecuperacion).mockReturnValue(
      new Promise((resolver) => (terminar = resolver)),
    )
    abrir()
    await screen.findByText('Yolanda Pérez')

    await userEvent.click(generar('Yolanda Pérez'))

    expect(within(fila('Yolanda Pérez')).getByRole('button')).toBeDisabled()
    expect(within(fila('Yolanda Pérez')).getByRole('button')).toHaveTextContent('Generando…')
    terminar(CODIGO)
    expect(await screen.findByRole('dialog', { name: 'Código temporal generado' })).toBeVisible()
  })

  it('RF-02: si la solicitud ya no admite un código (SOLICITUD_INVALIDA), lo dice y trae la lista de nuevo', async () => {
    vi.mocked(generarCodigoRecuperacion).mockRejectedValueOnce({
      code: 'P0001',
      message: 'SOLICITUD_INVALIDA',
    })
    abrir()
    await screen.findByText('Yolanda Pérez')

    await userEvent.click(generar('Yolanda Pérez'))

    expect(await screen.findByText('Esta solicitud ya no está disponible.')).toBeVisible()
    expect(
      screen.queryByRole('dialog', { name: 'Código temporal generado' }),
    ).not.toBeInTheDocument()
    await waitFor(() => expect(listarSolicitudes).toHaveBeenCalledTimes(2))
  })

  it('RNF-11: si generar responde SIN_PERMISO, lo dice y pide releer el perfil', async () => {
    const oyente = vi.fn()
    const dejar = alPedirRevisionDelPerfil(oyente)
    vi.mocked(generarCodigoRecuperacion).mockRejectedValueOnce({
      code: 'P0001',
      message: 'SIN_PERMISO',
    })
    abrir()
    await screen.findByText('Yolanda Pérez')

    await userEvent.click(generar('Yolanda Pérez'))

    expect(await screen.findByText('No tienes permiso para esta acción.')).toBeVisible()
    expect(oyente).toHaveBeenCalled()
    dejar()
  })

  it('decisión 28: al cargar y después de generar, pide actualizar la insignia del menú', async () => {
    const oyente = vi.fn()
    const dejar = alPedirConteoDeInsignias(oyente)
    abrir()
    await screen.findByText('Yolanda Pérez')
    oyente.mockClear()

    await userEvent.click(generar('Yolanda Pérez'))
    await screen.findByRole('dialog', { name: 'Código temporal generado' })

    expect(oyente).toHaveBeenCalled()
    dejar()
  })
})
