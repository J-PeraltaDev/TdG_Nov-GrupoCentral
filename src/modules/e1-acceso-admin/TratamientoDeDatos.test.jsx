import { screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { pintarConSesion } from '../../pruebas/sesionDePrueba.jsx'

// Los datos del responsable se simulan para probar las dos presentaciones: con los datos de
// contacto publicados y sin ellos.
const politica = vi.hoisted(() => ({
  RESPONSABLE: {
    razonSocial: 'Empresa de prueba S.A.S.',
    nit: null,
    direccion: null,
    correo: null,
    telefono: null,
  },
  VIGENTE_DESDE: null,
}))

vi.mock('./politicaDeDatos.js', () => politica)

const { default: TratamientoDeDatos } = await import('./TratamientoDeDatos.jsx')

const SIN_CONTACTO = { nit: null, direccion: null, correo: null, telefono: null }

function abrir(opciones) {
  return pintarConSesion(<TratamientoDeDatos />, { ruta: '/tratamiento-de-datos', ...opciones })
}

describe('Política de tratamiento de datos (RNF-18)', () => {
  afterEach(() => {
    Object.assign(politica.RESPONSABLE, SIN_CONTACTO)
    politica.VIGENTE_DESDE = null
  })

  it('RNF-18: presenta la política con sus secciones, en el orden en que se leen', () => {
    abrir()

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Política de tratamiento de datos personales',
      }),
    ).toBeVisible()
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Quién responde por tus datos',
      'Qué datos tratamos',
      'Para qué los usamos',
      'Quién puede verlos',
      'Dónde se guardan y cómo se protegen',
      'Cuánto tiempo se conservan',
      'Tus derechos',
      'Cómo ejercerlos',
      'Tu autorización',
      'Vigencia y cambios',
    ])
  })

  it('RNF-18: nombra la ley, al responsable y a la autoridad', () => {
    abrir()

    expect(screen.getByText(/Ley 1581 de 2012/)).toBeVisible()
    expect(screen.getByText(/Empresa de prueba S\.A\.S\./)).toBeVisible()
    expect(screen.getByText(/Superintendencia de Industria y Comercio/)).toBeVisible()
  })

  it('RNF-18: dice los plazos de la ley para las consultas y los reclamos', () => {
    abrir()

    const seccion = screen.getByRole('region', { name: 'Cómo ejercerlos' })
    expect(within(seccion).getByText(/máximo 10 días hábiles/)).toBeVisible()
    expect(within(seccion).getByText(/máximo 15 días hábiles/)).toBeVisible()
  })

  it('RNF-18: sin datos de contacto no inventa ninguno y remite a los administradores', () => {
    abrir()

    const seccion = screen.getByRole('region', { name: 'Quién responde por tus datos' })
    expect(within(seccion).queryByRole('term')).not.toBeInTheDocument()
    expect(within(seccion).getByText(/administradores de la plataforma/)).toBeVisible()
    expect(document.body).not.toHaveTextContent(/@|NIT/)
  })

  it('RNF-18: con los datos de contacto publicados, los muestra', () => {
    Object.assign(politica.RESPONSABLE, {
      nit: '900.000.000-0',
      direccion: 'Calle de prueba 1',
      correo: 'datos@empresa.test',
      telefono: '604 000 0000',
    })
    abrir()

    const seccion = screen.getByRole('region', { name: 'Quién responde por tus datos' })
    expect(within(seccion).getByText('900.000.000-0')).toBeVisible()
    expect(within(seccion).getByText('Calle de prueba 1')).toBeVisible()
    expect(within(seccion).getByRole('link', { name: 'datos@empresa.test' })).toHaveAttribute(
      'href',
      'mailto:datos@empresa.test',
    )
    expect(within(seccion).getByText('604 000 0000')).toBeVisible()
  })

  it('RNF-18: mientras la empresa no la apruebe, dice que es una versión preliminar', () => {
    abrir()

    expect(screen.getByText('Versión preliminar, en revisión por la empresa.')).toBeVisible()
  })

  it('RNF-18: aprobada, dice desde cuándo rige', () => {
    politica.VIGENTE_DESDE = '2026-11-13'
    abrir()

    expect(screen.getByText('Vigente desde el 13 nov 2026.')).toBeVisible()
    expect(screen.queryByText(/Versión preliminar/)).not.toBeInTheDocument()
  })

  it('RNF-18: sin sesión, el enlace de regreso lleva al ingreso', () => {
    abrir()

    expect(screen.getByRole('link', { name: 'Volver al ingreso' })).toHaveAttribute(
      'href',
      '/ingresar',
    )
  })

  it('RNF-18: con sesión, el enlace de regreso lleva al inicio del rol', () => {
    abrir({ rol: 'reportante' })

    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute(
      'href',
      '/novedades',
    )
  })
})
