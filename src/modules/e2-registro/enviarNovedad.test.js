import { beforeEach, describe, expect, it, vi } from 'vitest'
import { registrarNovedad } from '../../core/supabase/repositorios/novedades.js'
import { crearBorrador, enviarNovedad } from './enviarNovedad.js'

vi.mock('../../core/supabase/repositorios/novedades.js', () => ({
  registrarNovedad: vi.fn(),
}))

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

describe('crearBorrador (RNF-08, RNF-09)', () => {
  it('RNF-08: genera un identificador local único por novedad', () => {
    const datos = { descripcion: 'La bomba no enciende', prioridad: 'alto', areaId: 'area-m' }
    const uno = crearBorrador(datos)
    const otro = crearBorrador(datos)

    expect(uno.id_local).toMatch(UUID)
    expect(otro.id_local).not.toBe(uno.id_local)
  })

  it('RNF-09: fija la fecha real de registro con la hora del dispositivo', () => {
    vi.useFakeTimers({ now: new Date('2026-09-24T12:40:00.000Z') })
    try {
      const borrador = crearBorrador({ descripcion: 'x', prioridad: 'bajo', areaId: 'area-s' })
      expect(borrador.fecha_registro).toBe('2026-09-24T12:40:00.000Z')
    } finally {
      vi.useRealTimers()
    }
  })

  it('RF-05: quita los espacios sobrantes de la descripción y conserva prioridad y área', () => {
    expect(
      crearBorrador({ descripcion: '  Puente caído \n', prioridad: 'critico', areaId: 'area-m' }),
    ).toMatchObject({ descripcion: 'Puente caído', prioridad: 'critico', area_id: 'area-m' })
  })
})

describe('enviarNovedad (RF-05)', () => {
  const BORRADOR = {
    id_local: '3f0c2f5e-2f0b-4c58-9a44-0f6f4d6f1a11',
    fecha_registro: '2026-09-24T12:40:00.000Z',
    descripcion: 'La bomba no enciende',
    prioridad: 'alto',
    area_id: 'area-m',
  }

  beforeEach(() => {
    vi.mocked(registrarNovedad).mockReset()
  })

  it('RF-05 / CU-05 5: devuelve la novedad que registró el servidor', async () => {
    const novedad = { id: 'n-1', codigo: 153, estado: 'asignada' }
    vi.mocked(registrarNovedad).mockResolvedValue(novedad)

    await expect(enviarNovedad(BORRADOR)).resolves.toEqual({ ok: true, novedad })
    expect(registrarNovedad).toHaveBeenCalledWith(BORRADOR)
  })

  it('RNF-08: un corte de la red se informa como error de red, para poder reintentar', async () => {
    vi.mocked(registrarNovedad).mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(enviarNovedad(BORRADOR)).resolves.toMatchObject({
      ok: false,
      tipo: 'red',
      codigo: 'RED',
    })
  })

  it('RF-05: un error de negocio llega con el mensaje de la Tabla 22', async () => {
    vi.mocked(registrarNovedad).mockRejectedValue({ code: 'P0001', message: 'FINCA_NO_ASIGNADA' })

    await expect(enviarNovedad(BORRADOR)).resolves.toEqual({
      ok: false,
      tipo: 'negocio',
      codigo: 'FINCA_NO_ASIGNADA',
      mensaje: 'Tu usuario no tiene una finca asignada.',
    })
  })
})
