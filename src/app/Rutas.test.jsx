import 'fake-indexeddb/auto'
import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { pintarConSesion } from '../pruebas/sesionDePrueba.jsx'
import { Rutas } from './Rutas.jsx'

const abrir = (ruta, rol) => pintarConSesion(<Rutas />, { ruta, rol })

/** Textos del menú de la barra lateral (escritorio). */
async function menuDelEscritorio() {
  const [lateral] = await screen.findAllByRole('navigation', { name: 'Principal' })
  return within(lateral)
    .getAllByRole('link')
    .map((enlace) => enlace.textContent)
}

describe('Rutas y guardián de rol (RF-01 / CU-01, SDD 6.1.11)', () => {
  it('RNF-10: sin sesión, / lleva al ingreso', () => {
    abrir('/', null)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Novedades · Grupo Central' }),
    ).toBeVisible()
  })

  it('RNF-10: sin sesión no se entra a una ruta protegida', () => {
    abrir('/novedades', null)

    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeVisible()
  })

  it('mientras se recupera la sesión no decide todavía a dónde ir', () => {
    pintarConSesion(<Rutas />, { ruta: '/novedades', sesion: { fase: 'cargando' } })

    expect(screen.getByRole('status')).toHaveTextContent('Cargando…')
  })

  it.each([
    ['reportante', 'Mis novedades'],
    ['aprobador', 'Bandeja del área'],
    ['director', 'Novedades escaladas'],
    ['administrador', 'Panel de reportes'],
  ])('RF-01 / CU-01 4: el %s entra a su pantalla de inicio («%s»)', async (rol, titulo) => {
    abrir('/', rol)

    expect(await screen.findByRole('heading', { level: 1, name: titulo })).toBeVisible()
  })

  it.each([
    ['reportante', ['Novedades', 'Registrar', 'Avisos', 'Cuenta']],
    ['aprobador', ['Bandeja', 'Historial', 'Avisos']],
    ['director', ['Escaladas', 'Historial', 'Panel de reportes', 'Avisos']],
    [
      'administrador',
      [
        'Panel de reportes',
        'Historial',
        'Usuarios',
        'Fincas',
        'Tipos de falla',
        'Recuperación de contraseñas',
        'Avisos',
      ],
    ],
  ])('RF-01 / CU-01 4: el %s ve el menú de su rol (SDD, Tabla 10)', async (rol, menu) => {
    abrir('/', rol)

    expect(await menuDelEscritorio()).toEqual(menu)
  })

  it('en el teléfono la barra inferior tiene cuatro opciones', async () => {
    abrir('/', 'aprobador')

    const [, inferior] = await screen.findAllByRole('navigation', { name: 'Principal' })
    expect(
      within(inferior)
        .getAllByRole('link')
        .map((enlace) => enlace.textContent),
    ).toEqual(['Bandeja', 'Historial', 'Avisos', 'Cuenta'])
  })

  it.each([
    ['reportante', '/bandeja', 'Mis novedades'],
    ['reportante', '/usuarios', 'Mis novedades'],
    ['aprobador', '/registrar', 'Bandeja del área'],
    ['aprobador', '/panel', 'Bandeja del área'],
    ['director', '/usuarios', 'Novedades escaladas'],
    ['administrador', '/registrar', 'Panel de reportes'],
  ])(
    'RF-18: el %s no entra a %s; el guardián lo devuelve a su inicio',
    async (rol, ruta, titulo) => {
      abrir(ruta, rol)

      expect(await screen.findByRole('heading', { level: 1, name: titulo })).toBeVisible()
    },
  )

  it('el reportante ve su finca y su razón social en la barra superior', async () => {
    abrir('/novedades', 'reportante')

    expect(await screen.findByText('Finca de prueba 01')).toBeInTheDocument()
    expect(screen.getByText('Razón social de prueba A')).toBeInTheDocument()
  })

  it('RF-23: el indicador de conexión está siempre a la vista', async () => {
    abrir('/novedades', 'reportante')

    expect((await screen.findAllByRole('status')).some((e) => e.textContent === 'En línea')).toBe(
      true,
    )
  })

  it('con sesión, el ingreso redirige al inicio del rol', async () => {
    abrir('/ingresar', 'aprobador')

    expect(await screen.findByRole('heading', { level: 1, name: 'Bandeja del área' })).toBeVisible()
  })

  it('una ruta que no existe muestra la página de no encontrada', () => {
    abrir('/no-existe', null)

    expect(
      screen.getByRole('heading', { level: 1, name: 'No encontramos esta página' }),
    ).toBeVisible()
  })

  it('/_dev/componentes muestra las 28 variantes de los componentes base', async () => {
    abrir('/_dev/componentes', null)

    expect(await screen.findByRole('heading', { level: 1, name: 'Componentes base' })).toBeVisible()
    expect(document.querySelectorAll('[data-estado]')).toHaveLength(9)
    expect(document.querySelectorAll('[data-prioridad]')).toHaveLength(4)
    expect(document.querySelectorAll('[data-conexion]')).toHaveLength(3)
    expect(screen.getAllByRole('button')).toHaveLength(12)
  })
})
