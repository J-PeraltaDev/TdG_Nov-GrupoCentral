// @vitest-environment node
import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { openDB } from 'idb'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as bd from './bd.js'
import { encolar } from './cola.js'
import { leerPendientes, vigilarPendientes } from './pendientes.js'

const PERFIL = { id: 'u-1', finca_id: 'finca-1' }
const BORRADOR = {
  id_local: '7f3a2c10-0000-4000-8000-000000000001',
  fecha_registro: '2026-09-24T11:52:00.000Z',
  descripcion: 'El rodillo del cable vía del lote 5 está suelto.',
  prioridad: 'normal',
  area_id: 'area-m',
  area: 'Mantenimiento',
}

async function pendientesGuardadas() {
  await bd.cerrarBd()
  const base = await openDB(bd.NOMBRE_BD, bd.VERSION_BD)
  const todas = await base.getAll('pendientes')
  base.close()
  return todas
}

describe('Cola de pendientes · encolar (RF-21 / CU-21, SDD 6.1.5 y Tabla 32)', () => {
  beforeEach(async () => {
    await bd.cerrarBd()
    globalThis.indexedDB = new IDBFactory()
    await vigilarPendientes(PERFIL.id)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('RF-21 / CU-21 1 a 3: guarda la novedad con su identificador, su fecha real y su dueño', async () => {
    const resultado = await encolar(BORRADOR, PERFIL)

    expect(resultado.ok).toBe(true)
    expect(await pendientesGuardadas()).toEqual([
      {
        ...BORRADOR,
        finca_id: 'finca-1',
        reportante_id: 'u-1',
        envio: 'pendiente',
        intentos: 0,
        ultimo_error: null,
      },
    ])
    expect(resultado.pendiente).toMatchObject({ id_local: BORRADOR.id_local, envio: 'pendiente' })
  })

  it('RF-21 / CU-21 5: el indicador cuenta la pendiente nueva', async () => {
    await encolar(BORRADOR, PERFIL)

    expect(leerPendientes()).toBe(1)
  })

  it('RNF-07: pide otra vez al navegador que no borre los datos del dispositivo', async () => {
    const persist = vi.fn().mockResolvedValue(true)
    vi.stubGlobal('navigator', { ...navigator, storage: { persist } })

    await encolar(BORRADOR, PERFIL)

    expect(persist).toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('RF-21 / CU-21 2a: si el almacenamiento está lleno, lo dice y no queda nada a medias', async () => {
    vi.spyOn(bd, 'guardarPendiente').mockRejectedValue(new DOMException('', 'QuotaExceededError'))

    await expect(encolar(BORRADOR, PERFIL)).resolves.toEqual({
      ok: false,
      tipo: 'local',
      codigo: 'CUOTA_LLENA',
      mensaje:
        'No se pudo guardar: el teléfono no tiene espacio. Libera espacio e intenta de nuevo.',
    })
    expect(leerPendientes()).toBe(0)
  })

  it('RF-21 / CU-21 2b: si la escritura falla por otra razón, pide reintentar', async () => {
    vi.spyOn(bd, 'guardarPendiente').mockRejectedValue(new DOMException('', 'UnknownError'))

    await expect(encolar(BORRADOR, PERFIL)).resolves.toMatchObject({
      ok: false,
      codigo: 'ESCRITURA_LOCAL',
      mensaje: 'La novedad no se guardó en el teléfono. Intenta de nuevo.',
    })
  })
})
