// @vitest-environment node
import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  borrarNovedadesDescargadas,
  cerrarBd,
  guardarMeta,
  leerMeta,
  leerNovedadDescargada,
} from './bd.js'
import {
  contarDescargadas,
  guardarConteo,
  guardarNovedad,
  guardarPagina,
  leerConteo,
  leerNovedad,
  leerPagina,
  ORDEN,
  SinDescarga,
} from './novedadesLocales.js'

const ABIERTAS = ['registrada', 'asignada', 'en_atencion', 'escalada', 'aprobada']
const MIS_ABIERTAS = {
  clave: 'novedades:abiertas',
  filtro: (novedad) => ABIERTAS.includes(novedad.estado),
  orden: ORDEN.recientes,
}

/** Una fila de la lista, registrada hace `horas`. */
const fila = (codigo, horas, cambios = {}) => ({
  id: `n-${codigo}`,
  codigo,
  descripcion: `Novedad ${codigo}`,
  prioridad: 'normal',
  estado: 'asignada',
  area: 'Mantenimiento',
  fecha_registro: new Date(Date.UTC(2026, 8, 24, 12) - horas * 3_600_000).toISOString(),
  ...cambios,
})

describe('Novedades descargadas (RF-24 / CU-24, SDD Tabla 32)', () => {
  beforeEach(async () => {
    await cerrarBd()
    globalThis.indexedDB = new IDBFactory()
  })

  it('RF-24 / CU-24 3: arma la página como el servidor: filtra, ordena, cuenta y pagina', async () => {
    const filas = Array.from({ length: 23 }, (_, i) => fila(100 + i, i))
    await guardarPagina(MIS_ABIERTAS, 0, { novedades: filas.slice(0, 20), total: 23 })
    await guardarPagina(MIS_ABIERTAS, 20, { novedades: filas.slice(20), total: 23 })
    // Una de otra lista no entra en esta.
    await guardarPagina({ ...MIS_ABIERTAS, clave: 'novedades:cerradas', filtro: () => false }, 0, {
      novedades: [fila(90, 50, { estado: 'cerrada' })],
      total: 1,
    })

    const primera = await leerPagina(MIS_ABIERTAS, 0, 20)
    expect(primera.total).toBe(23)
    expect(primera.novedades.map(({ codigo }) => codigo)).toEqual(
      filas.slice(0, 20).map(({ codigo }) => codigo),
    )
    expect(primera.descargadaEn).toBe(await leerMeta('descarga:novedades:abiertas'))
    const segunda = await leerPagina(MIS_ABIERTAS, 20, 20)
    expect(segunda.novedades.map(({ codigo }) => codigo)).toEqual([120, 121, 122])
    expect(await contarDescargadas(MIS_ABIERTAS.filtro)).toBe(23)
  })

  it('RF-24: la bandeja va por prioridad y, en cada una, de la más antigua a la más reciente', () => {
    const lista = [
      fila(3, 1, { prioridad: 'bajo' }),
      fila(2, 1, { prioridad: 'critico' }),
      fila(1, 5, { prioridad: 'critico' }),
      fila(4, 9, { prioridad: 'alto' }),
    ].sort(ORDEN.porPrioridad)

    expect(lista.map(({ codigo }) => codigo)).toEqual([1, 2, 4, 3])
  })

  it('CU-24 3a: sin una descarga de esa lista, lanza SinDescarga', async () => {
    await expect(leerPagina(MIS_ABIERTAS, 0, 20)).rejects.toBeInstanceOf(SinDescarga)
  })

  it('combina por id: la fila de una lista no borra lo que trajo el detalle', async () => {
    await guardarNovedad(
      'n-7',
      { ...fila(7, 2), solucion: null, reportante: 'Luz Marina' },
      {
        completa: true,
      },
    )
    await guardarNovedad('n-7', { linea_de_tiempo: [{ id: 1 }] })

    await guardarPagina(MIS_ABIERTAS, 0, { novedades: [fila(7, 2)], total: 1 })

    const guardada = await leerNovedad('n-7')
    expect(guardada).toMatchObject({ reportante: 'Luz Marina', linea_de_tiempo: [{ id: 1 }] })
    expect(guardada.descargada_en).toEqual(expect.any(String))
  })

  it('si la novedad cambió de estado, su línea de tiempo guardada ya no sirve', async () => {
    await guardarNovedad('n-7', fila(7, 2), { completa: true })
    await guardarNovedad('n-7', { linea_de_tiempo: [{ id: 1 }] })

    await guardarPagina(MIS_ABIERTAS, 0, {
      novedades: [fila(7, 2, { estado: 'en_atencion' })],
      total: 1,
    })

    expect((await leerNovedad('n-7')).linea_de_tiempo).toBeUndefined()
  })

  it('la línea de tiempo que llega antes que la novedad espera sola y ninguna lista la toma', async () => {
    await guardarNovedad('n-7', { linea_de_tiempo: [{ id: 1 }] })
    await guardarMeta('descarga:novedades:abiertas', '2026-09-24T12:00:00.000Z')

    expect((await leerPagina(MIS_ABIERTAS, 0, 20)).novedades).toEqual([])
    await expect(leerNovedad('n-7')).rejects.toBeInstanceOf(SinDescarga)

    await guardarNovedad('n-7', fila(7, 2), { completa: true })
    expect((await leerNovedad('n-7')).linea_de_tiempo).toEqual([{ id: 1 }])
  })

  it('lo que ya no llega en una lista completa se borra; lo de otras listas o páginas, no', async () => {
    await guardarPagina(MIS_ABIERTAS, 0, {
      novedades: [fila(1, 1), fila(2, 2), fila(3, 3)],
      total: 3,
    })
    await guardarNovedad('n-9', fila(9, 9, { estado: 'cerrada' }), { completa: true })

    // La 2 cambió de estado en el servidor y ya no está entre las abiertas.
    await guardarPagina(MIS_ABIERTAS, 0, { novedades: [fila(1, 1), fila(3, 3)], total: 2 })

    expect(await leerNovedadDescargada('n-2')).toBeUndefined()
    expect(await leerNovedadDescargada('n-9')).toBeDefined()
  })

  it('con más de una página, solo borra lo que cae en el tramo que llegó', async () => {
    const filas = Array.from({ length: 25 }, (_, i) => fila(100 + i, i))
    await guardarPagina(MIS_ABIERTAS, 0, { novedades: filas.slice(0, 20), total: 25 })
    await guardarPagina(MIS_ABIERTAS, 20, { novedades: filas.slice(20), total: 25 })

    // Llega otra vez la primera página, sin la 105: las de la segunda página siguen.
    const sinLa105 = filas.slice(0, 21).filter(({ codigo }) => codigo !== 105)
    await guardarPagina(MIS_ABIERTAS, 0, { novedades: sinLa105, total: 24 })

    expect(await leerNovedadDescargada('n-105')).toBeUndefined()
    expect(await contarDescargadas(MIS_ABIERTAS.filtro)).toBe(24)
  })

  it('un conteo descargado vale sin conexión; si nunca se descargó, se cuentan las descargadas', async () => {
    await guardarPagina(MIS_ABIERTAS, 0, { novedades: [fila(1, 1)], total: 1 })
    expect(await leerConteo('novedades:abiertas', MIS_ABIERTAS.filtro)).toBe(1)

    await guardarConteo('novedades:abiertas', 4)
    expect(await leerConteo('novedades:abiertas', MIS_ABIERTAS.filtro)).toBe(4)
  })

  it('al cambiar el alcance del perfil se borran las descargadas, las fechas y los conteos', async () => {
    await guardarPagina(MIS_ABIERTAS, 0, { novedades: [fila(1, 1)], total: 1 })
    await guardarConteo('novedades:abiertas', 4)
    await guardarMeta('perfil', { id: 'u-1' })

    await borrarNovedadesDescargadas()

    expect(await contarDescargadas(() => true)).toBe(0)
    expect(await leerMeta('descarga:novedades:abiertas')).toBeUndefined()
    expect(await leerConteo('novedades:abiertas', MIS_ABIERTAS.filtro)).toBe(0)
    expect(await leerMeta('perfil')).toEqual({ id: 'u-1' })
  })
})
