// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  ABIERTAS,
  chipsDelFiltro,
  escribirFiltros,
  leerFiltros,
  quitarFiltro,
  rangoInvertido,
  SIN_FILTROS,
  textoDeEstados,
  textoDelRango,
} from './filtrosDelHistorial.js'

const FINCA = '0a000000-0000-4000-a000-000000000001'
const AREA = '0b000000-0000-4000-a000-000000000002'
const TIPO = '0c000000-0000-4000-a000-000000000003'
const AHORA = '2026-09-24T14:30:00Z'

const leer = (texto) => leerFiltros(new URLSearchParams(texto))

describe('Filtros del historial en la dirección (RF-19; plan del Sprint 5, decisión 10)', () => {
  it('RF-19 / CU-19 2: lee cada filtro y la página, que en la dirección empieza en 1', () => {
    expect(
      leer(
        `finca=${FINCA}&area=${AREA}&estado=cerrada,resuelta&desde=2026-04-01&hasta=2026-09-24&tipo=${TIPO}&pagina=2`,
      ),
    ).toEqual({
      finca: FINCA,
      area: AREA,
      // En el orden de la Tabla 28, no en el de la dirección.
      estados: ['resuelta', 'cerrada'],
      desde: '2026-04-01',
      hasta: '2026-09-24',
      tipo: TIPO,
      pagina: 1,
    })
  })

  it('RF-19: sin parámetros, sin filtros y en la primera página', () => {
    expect(leer('')).toEqual({ ...SIN_FILTROS, pagina: 0 })
  })

  it('RF-26: «abiertas» son los seis estados que no son finales (SDD, Tabla 34)', () => {
    expect(ABIERTAS).toEqual([
      'registrada',
      'asignada',
      'en_atencion',
      'escalada',
      'aprobada',
      'resuelta',
    ])
    expect(leer('estado=abiertas').estados).toEqual(ABIERTAS)
  })

  it('RF-19: un parámetro desconocido o mal formado se ignora', () => {
    expect(
      leer(
        'finca=abc&area=1&estado=foo,resuelta,resuelta&desde=2026-02-30&hasta=24/09/2026&tipo=&pagina=-1&orden=codigo',
      ),
    ).toEqual({ ...SIN_FILTROS, estados: ['resuelta'], pagina: 0 })
    expect(leer('pagina=dos').pagina).toBe(0)
    expect(leer('pagina=1.5').pagina).toBe(0)
    expect(leer('pagina=0').pagina).toBe(0)
  })

  it('RF-19 / CU-19 3: escribe solo lo que filtra, con las comas a la vista', () => {
    const filtro = {
      ...SIN_FILTROS,
      finca: FINCA,
      estados: ['resuelta', 'cerrada'],
      desde: '2026-04-01',
    }
    expect(escribirFiltros(filtro)).toBe(`finca=${FINCA}&estado=resuelta,cerrada&desde=2026-04-01`)
    expect(escribirFiltros(SIN_FILTROS)).toBe('')
    expect(escribirFiltros({ ...SIN_FILTROS, estados: ABIERTAS })).toBe('estado=abiertas')
  })

  it('RF-19: la página va en la dirección desde la segunda', () => {
    expect(escribirFiltros({ ...SIN_FILTROS, pagina: 0 })).toBe('')
    expect(escribirFiltros({ ...SIN_FILTROS, tipo: TIPO, pagina: 1 })).toBe(`tipo=${TIPO}&pagina=2`)
  })

  it('RF-19: lo que se escribe se vuelve a leer igual', () => {
    const filtro = {
      finca: FINCA,
      area: AREA,
      estados: ['asignada', 'rechazada'],
      desde: '2026-01-01',
      hasta: '2026-01-31',
      tipo: TIPO,
      pagina: 3,
    }
    expect(leer(escribirFiltros(filtro))).toEqual(filtro)
  })
})

describe('Rango de fechas (RF-19, Figma 21-B)', () => {
  it('RF-19 / CU-19 3a: la fecha inicial posterior a la final es un rango invertido', () => {
    expect(rangoInvertido({ desde: '2026-09-30', hasta: '2026-09-01' })).toBe(true)
    expect(rangoInvertido({ desde: '2026-09-01', hasta: '2026-09-01' })).toBe(false)
    expect(rangoInvertido({ desde: '2026-04-01', hasta: '2026-09-24' })).toBe(false)
    expect(rangoInvertido({ desde: '2026-09-30', hasta: null })).toBe(false)
  })

  it('RF-19: el texto del control, como Figma 21', () => {
    expect(textoDelRango({ desde: '2026-04-01', hasta: '2026-09-24' })).toBe(
      '01 abr 2026 – 24 sep 2026',
    )
    expect(textoDelRango({ desde: '2026-04-01', hasta: null })).toBe('Desde 01 abr 2026')
    expect(textoDelRango({ desde: null, hasta: '2026-09-24' })).toBe('Hasta 24 sep 2026')
    expect(textoDelRango({ desde: null, hasta: null })).toBe('Todas las fechas')
  })

  it('RF-19: el texto del control de estados', () => {
    expect(textoDeEstados([])).toBe('Todos')
    expect(textoDeEstados(['resuelta', 'cerrada'])).toBe('Resuelta, Cerrada')
    expect(textoDeEstados(ABIERTAS)).toBe('Abiertas')
  })
})

describe('Chips de los filtros puestos (RF-19, Figma 21 y 21-D)', () => {
  const OPCIONES = {
    fincas: [{ id: FINCA, nombre: 'La Mónica', activo: false }],
    areas: [{ id: AREA, nombre: 'Sistemas', activo: true }],
    tipos: [{ id: TIPO, nombre: 'Biométrico', activo: true }],
  }

  it('RF-19: un chip por filtro, con el texto del escritorio y el corto del teléfono', () => {
    const filtro = {
      finca: FINCA,
      area: AREA,
      estados: ['resuelta', 'cerrada'],
      desde: '2026-04-01',
      hasta: '2026-09-24',
      tipo: TIPO,
    }
    expect(chipsDelFiltro(filtro, OPCIONES, AHORA)).toEqual([
      { clave: 'finca', texto: 'Finca: La Mónica', corto: 'La Mónica' },
      { clave: 'area', texto: 'Área: Sistemas', corto: 'Sistemas' },
      { clave: 'estado', texto: 'Estado: Resuelta, Cerrada', corto: 'Resuelta, Cerrada' },
      { clave: 'rango', texto: 'Desde 01 abr hasta 24 sep 2026', corto: '01 abr – 24 sep' },
      { clave: 'tipo', texto: 'Tipo de falla: Biométrico', corto: 'Biométrico' },
    ])
  })

  it('RF-19: sin filtros, sin chips', () => {
    expect(chipsDelFiltro(SIN_FILTROS, OPCIONES, AHORA)).toEqual([])
  })

  it('RF-19: el rango con una sola fecha o con años distintos', () => {
    const chip = (desde, hasta) =>
      chipsDelFiltro({ ...SIN_FILTROS, desde, hasta }, OPCIONES, AHORA)[0]
    expect(chip('2026-04-01', null)).toMatchObject({
      texto: 'Desde 01 abr 2026',
      corto: 'Desde 01 abr',
    })
    expect(chip(null, '2026-09-24')).toMatchObject({
      texto: 'Hasta 24 sep 2026',
      corto: 'Hasta 24 sep',
    })
    expect(chip('2025-12-01', '2026-01-31')).toMatchObject({
      texto: 'Desde 01 dic 2025 hasta 31 ene 2026',
      corto: '01 dic 2025 – 31 ene',
    })
  })

  it('RF-26: «abiertas» se nombra así', () => {
    expect(chipsDelFiltro({ ...SIN_FILTROS, estados: ABIERTAS }, OPCIONES, AHORA)).toEqual([
      { clave: 'estado', texto: 'Estado: Abiertas', corto: 'Abiertas' },
    ])
  })

  it('RF-19: mientras llegan las opciones, el nombre espera', () => {
    expect(
      chipsDelFiltro({ ...SIN_FILTROS, finca: FINCA }, { fincas: [], areas: [], tipos: [] }, AHORA),
    ).toEqual([{ clave: 'finca', texto: 'Finca: …', corto: '…' }])
  })

  it('RF-19: quitar un chip quita su filtro y vuelve a la primera página', () => {
    const filtro = {
      ...SIN_FILTROS,
      finca: FINCA,
      desde: '2026-04-01',
      hasta: '2026-09-24',
      pagina: 2,
    }
    expect(quitarFiltro(filtro, 'rango')).toEqual({ ...SIN_FILTROS, finca: FINCA, pagina: 0 })
    expect(quitarFiltro(filtro, 'finca')).toMatchObject({ finca: null, desde: '2026-04-01' })
    expect(quitarFiltro({ ...SIN_FILTROS, estados: ['cerrada'] }, 'estado').estados).toEqual([])
  })
})
