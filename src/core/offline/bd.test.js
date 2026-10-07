// @vitest-environment node
import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { openDB } from 'idb'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  borrarDatosDeSesion,
  cerrarBd,
  contarPendientes,
  guardarCatalogo,
  guardarMeta,
  leerCatalogo,
  leerMeta,
  NOMBRE_BD,
  VERSION_BD,
} from './bd.js'

describe('Almacenamiento local · IndexedDB (SDD 6.1.5, Tabla 32)', () => {
  beforeEach(async () => {
    await cerrarBd()
    globalThis.indexedDB = new IDBFactory()
  })

  it('crea los cuatro almacenes de la Tabla 32, con sus claves e índices', async () => {
    await leerMeta('cualquiera')
    await cerrarBd()

    const bd = await openDB(NOMBRE_BD, VERSION_BD)
    expect([...bd.objectStoreNames]).toEqual(['catalogos', 'meta', 'novedades', 'pendientes'])

    const tx = bd.transaction(['pendientes', 'novedades'])
    expect(tx.objectStore('pendientes').keyPath).toBe('id_local')
    expect([...tx.objectStore('pendientes').indexNames]).toEqual(['fecha_registro'])
    expect(tx.objectStore('novedades').keyPath).toBe('id')
    expect([...tx.objectStore('novedades').indexNames]).toEqual(['actualizado_en', 'estado'])
    bd.close()
  })

  it('RNF-10: guarda y lee el perfil en el almacén meta', async () => {
    const perfil = { id: 'u-1', nombre: 'Reportante de prueba', rol_id: 1, finca_id: 'f-1' }

    await guardarMeta('perfil', perfil)

    expect(await leerMeta('perfil')).toEqual(perfil)
    expect(await leerMeta('no-existe')).toBeUndefined()
  })

  it('RF-05: guarda y lee los catálogos descargados al ingresar', async () => {
    const areas = [
      { id: 'a-1', nombre: 'Mantenimiento' },
      { id: 'a-2', nombre: 'Sistemas' },
    ]

    await guardarCatalogo('areas', areas)

    expect(await leerCatalogo('areas')).toEqual(areas)
  })

  it('RF-01 / CU-01 5a: al cerrar sesión borra lo descargado y conserva las pendientes', async () => {
    await guardarMeta('perfil', { id: 'u-1' })
    await guardarCatalogo('areas', [{ id: 'a-1' }])
    await cerrarBd()
    const bd = await openDB(NOMBRE_BD, VERSION_BD)
    await bd.put('pendientes', { id_local: 'p-1', fecha_registro: '2026-10-13T12:00:00Z' })
    await bd.put('novedades', { id: 'n-1', estado: 'asignada', actualizado_en: '2026-10-13' })
    bd.close()

    await borrarDatosDeSesion()

    expect(await leerMeta('perfil')).toBeUndefined()
    expect(await leerCatalogo('areas')).toBeUndefined()
    expect(await contarPendientes()).toBe(1)
  })
})
