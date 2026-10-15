// @vitest-environment node
import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { openDB } from 'idb'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cerrarBd, leerMeta, NOMBRE_BD, VERSION_BD } from './bd.js'
import {
  avisarCambioDePendientes,
  CANAL_DE_PENDIENTES,
  leerPendientes,
  suscribirPendientes,
  vigilarPendientes,
} from './pendientes.js'

/** Deja pendientes en la base, ya creada por la aplicación con sus almacenes. */
async function sembrar(...pendientes) {
  await leerMeta('abrir')
  await cerrarBd()
  const bd = await openDB(NOMBRE_BD, VERSION_BD)
  for (const p of pendientes) await bd.put('pendientes', { fecha_registro: '2026-10-13', ...p })
  bd.close()
}

describe('Contador de pendientes (RF-23 / CU-23 3)', () => {
  beforeEach(async () => {
    await cerrarBd()
    globalThis.indexedDB = new IDBFactory()
    await vigilarPendientes(null)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('RF-23 / CU-23 3: cuenta las pendientes del usuario de la sesión', async () => {
    await sembrar(
      { id_local: 'p-1', reportante_id: 'u-1' },
      { id_local: 'p-2', reportante_id: 'u-1' },
      { id_local: 'p-3', reportante_id: 'u-2' },
    )

    await vigilarPendientes('u-1')

    expect(leerPendientes()).toBe(2)
  })

  it('RF-23 / CU-23 4: se actualiza cuando la cola cambia y avisa a quien lo muestra', async () => {
    await vigilarPendientes('u-1')
    const oyente = vi.fn()
    const dejar = suscribirPendientes(oyente)

    await sembrar({ id_local: 'p-1', reportante_id: 'u-1' })
    await avisarCambioDePendientes()

    expect(leerPendientes()).toBe(1)
    expect(oyente).toHaveBeenCalledTimes(1)

    // Sin cambio en la cantidad, nadie se vuelve a pintar.
    await avisarCambioDePendientes()
    expect(oyente).toHaveBeenCalledTimes(1)
    dejar()
  })

  it('RF-23: se actualiza cuando otra pestaña cambia la cola', async () => {
    await vigilarPendientes('u-1')
    const oyente = vi.fn()
    suscribirPendientes(oyente)
    await sembrar({ id_local: 'p-1', reportante_id: 'u-1' })

    const otraPestana = new BroadcastChannel(CANAL_DE_PENDIENTES)
    otraPestana.postMessage('cambio')
    otraPestana.close()

    await vi.waitFor(() => expect(leerPendientes()).toBe(1))
    expect(oyente).toHaveBeenCalled()
  })

  it('RNF-10: sin sesión no hay pendientes que mostrar', async () => {
    await sembrar({ id_local: 'p-1', reportante_id: 'u-1' })

    await vigilarPendientes(null)

    expect(leerPendientes()).toBe(0)
  })
})
