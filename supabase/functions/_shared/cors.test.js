// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { cabecerasCors, esOrigenPermitido } from './cors.js'

describe('CORS de las Edge Functions (SDD 5.3.4)', () => {
  it.each([
    'http://localhost:5173',
    'http://localhost:4173',
    'https://tdg-nov-grupocentral.pages.dev',
    'https://a1b2c3d4.tdg-nov-grupocentral.pages.dev',
    'https://feat-rf-03-gestionar-usuarios.tdg-nov-grupocentral.pages.dev',
  ])('permite el origen de la aplicación: %s', (origen) => {
    expect(esOrigenPermitido(origen)).toBe(true)
    expect(cabecerasCors(origen)['Access-Control-Allow-Origin']).toBe(origen)
  })

  it.each([
    'https://otro-sitio.example',
    'http://localhost:3000',
    'http://tdg-nov-grupocentral.pages.dev',
    'https://tdg-nov-grupocentral.pages.dev.otro-sitio.example',
    'https://otro.sitio.tdg-nov-grupocentral.pages.dev',
    'https://xtdg-nov-grupocentral.pages.dev',
    'null',
    '',
    null,
    undefined,
  ])('no permite un origen ajeno: %s', (origen) => {
    expect(esOrigenPermitido(origen)).toBe(false)
    expect(cabecerasCors(origen)).not.toHaveProperty('Access-Control-Allow-Origin')
  })

  it('nunca responde con el comodín', () => {
    for (const origen of ['http://localhost:5173', 'https://otro-sitio.example', null]) {
      expect(Object.values(cabecerasCors(origen))).not.toContain('*')
    }
  })

  it('avisa a las cachés de que la respuesta depende del origen', () => {
    expect(cabecerasCors('http://localhost:5173').Vary).toBe('Origin')
    expect(cabecerasCors('https://otro-sitio.example').Vary).toBe('Origin')
  })

  it('admite las cabeceras que envía supabase-js y solo POST', () => {
    const cabeceras = cabecerasCors('http://localhost:5173')
    for (const nombre of ['authorization', 'apikey', 'x-client-info', 'content-type']) {
      expect(cabeceras['Access-Control-Allow-Headers']).toContain(nombre)
    }
    expect(cabeceras['Access-Control-Allow-Methods']).toBe('POST, OPTIONS')
  })
})
