// @vitest-environment node
import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cerrarBd } from '../../offline/bd.js'
import { guardarNovedad } from '../../offline/novedadesLocales.js'
import { supabase } from '../cliente.js'
import { listarEvidencias, subirEvidencia } from './evidencias.js'

// Se simulan el cliente y el monitor, no la red; lo descargado va a un IndexedDB en memoria.
const conexion = vi.hoisted(() => ({ enLinea: true }))
const almacenamiento = vi.hoisted(() => ({
  upload: vi.fn(),
  createSignedUrls: vi.fn(),
}))
vi.mock('../cliente.js', () => ({
  supabase: { from: vi.fn(), storage: { from: vi.fn(() => almacenamiento) } },
}))
vi.mock('../../conexion/monitor.js', () => ({ estaEnLinea: () => conexion.enLinea }))

/** Una consulta de supabase-js: anota los pasos y entrega `respuesta`. */
function responder(respuesta) {
  const pasos = []
  const consulta = new Proxy(
    {},
    {
      get: (_, metodo) =>
        metodo === 'then'
          ? (resolver, rechazar) => Promise.resolve(respuesta).then(resolver, rechazar)
          : (...argumentos) => {
              pasos.push([metodo, ...argumentos])
              return consulta
            },
    },
  )
  vi.mocked(supabase.from).mockReturnValue(consulta)
  return pasos
}

const NOVEDAD = '00000000-0000-4000-e000-000000000145'
const EVIDENCIAS = [
  { id: 'e-1', ruta_storage: `${NOVEDAD}/a.jpg`, subida_en: '2026-09-22T13:00:00Z' },
  { id: 'e-2', ruta_storage: `${NOVEDAD}/b.jpg`, subida_en: '2026-09-22T13:05:00Z' },
]

describe('Evidencias fotográficas (RF-08 / CU-08)', () => {
  beforeEach(async () => {
    await cerrarBd()
    globalThis.indexedDB = new IDBFactory()
    vi.mocked(supabase.from).mockReset()
    almacenamiento.upload.mockReset()
    almacenamiento.createSignedUrls.mockReset()
    conexion.enLinea = true
  })

  it('RF-08 / CU-08 4: sube el JPEG a {novedad}/{uuid}.jpg y después registra su fila', async () => {
    almacenamiento.upload.mockResolvedValue({ data: {}, error: null })
    const pasos = responder({ data: EVIDENCIAS[0], error: null })
    const foto = new Blob(['x'.repeat(2048)], { type: 'image/jpeg' })

    await subirEvidencia(NOVEDAD, foto, 'u-1')

    const [ruta, enviada, opciones] = almacenamiento.upload.mock.calls[0]
    expect(ruta).toMatch(new RegExp(`^${NOVEDAD}/[0-9a-f-]{36}\\.jpg$`))
    expect(enviada).toBe(foto)
    expect(opciones).toEqual({ contentType: 'image/jpeg' })
    expect(supabase.from).toHaveBeenCalledWith('evidencia')
    expect(pasos[0]).toEqual([
      'insert',
      { novedad_id: NOVEDAD, ruta_storage: ruta, subida_por: 'u-1', tamano_bytes: 2048 },
    ])
  })

  it('si el archivo no sube, no se registra la fila', async () => {
    const rechazo = { message: 'new row violates row-level security policy' }
    almacenamiento.upload.mockResolvedValue({ data: null, error: rechazo })

    await expect(subirEvidencia(NOVEDAD, new Blob(['x']), 'u-1')).rejects.toBe(rechazo)
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('RF-08 (decisión 23): firma las URLs de todas en una sola llamada, de 5 minutos', async () => {
    const pasos = responder({ data: EVIDENCIAS, error: null })
    almacenamiento.createSignedUrls.mockResolvedValue({
      data: [{ signedUrl: 'https://firmada/a' }, { signedUrl: 'https://firmada/b' }],
      error: null,
    })

    const lista = await listarEvidencias(NOVEDAD)

    expect(pasos).toContainEqual(['eq', 'novedad_id', NOVEDAD])
    expect(almacenamiento.createSignedUrls).toHaveBeenCalledExactlyOnceWith(
      [`${NOVEDAD}/a.jpg`, `${NOVEDAD}/b.jpg`],
      300,
    )
    expect(lista.map(({ url }) => url)).toEqual(['https://firmada/a', 'https://firmada/b'])
  })

  it('RF-24 (09-D, 14-B): sin conexión devuelve las descargadas, sin URL', async () => {
    await guardarNovedad(
      NOVEDAD,
      { id: NOVEDAD, codigo: 145, estado: 'resuelta' },
      { completa: true },
    )
    responder({ data: EVIDENCIAS, error: null })
    almacenamiento.createSignedUrls.mockResolvedValue({
      data: [{ signedUrl: 'https://firmada/a' }, { signedUrl: 'https://firmada/b' }],
      error: null,
    })
    await listarEvidencias(NOVEDAD)

    conexion.enLinea = false

    expect(await listarEvidencias(NOVEDAD)).toEqual(
      EVIDENCIAS.map((evidencia) => ({ ...evidencia, url: null })),
    )
  })
})
