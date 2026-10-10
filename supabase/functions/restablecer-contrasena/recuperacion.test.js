// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { crearRecuperacion } from './recuperacion.js'

/** Un cliente de supabase-js simulado, con lo único que usa la función. */
function simular({ rpc, updateUserById } = {}) {
  const admin = {
    rpc: vi.fn().mockResolvedValue(rpc ?? { data: [], error: null }),
    auth: {
      admin: {
        updateUserById: vi.fn().mockResolvedValue(updateUserById ?? { data: {}, error: null }),
      },
    },
  }
  return { admin, recuperacion: crearRecuperacion(admin) }
}

describe('restablecer-contrasena · la recuperación sobre supabase-js (SDD 6.1.10)', () => {
  it('RF-02 / CU-02 9: consume el código con consumir_codigo_recuperacion y entrega su resultado', async () => {
    const { admin, recuperacion } = simular({
      rpc: { data: [{ resultado: 'OK', usuario_id: 'u-7' }], error: null },
    })

    await expect(recuperacion.consumirCodigo('persona@novedades.test', '482719')).resolves.toEqual({
      resultado: 'OK',
      usuarioId: 'u-7',
    })

    expect(admin.rpc).toHaveBeenCalledExactlyOnceWith('consumir_codigo_recuperacion', {
      p_correo: 'persona@novedades.test',
      p_codigo: '482719',
    })
  })

  it.each(['CODIGO_INVALIDO', 'CODIGO_VENCIDO'])(
    'RF-02 / CU-02 9a y 9b: entrega %s, sin usuario',
    async (resultado) => {
      const { recuperacion } = simular({
        rpc: { data: [{ resultado, usuario_id: null }], error: null },
      })

      await expect(recuperacion.consumirCodigo('a@b.co', '000000')).resolves.toEqual({
        resultado,
        usuarioId: null,
      })
    },
  )

  it('si la función de la base de datos no devuelve ninguna fila, no hay resultado', async () => {
    const { recuperacion } = simular({ rpc: { data: [], error: null } })

    await expect(recuperacion.consumirCodigo('a@b.co', '000000')).resolves.toEqual({
      resultado: null,
      usuarioId: null,
    })
  })

  it('si la base de datos falla al consumir, lanza su error', async () => {
    const error = { code: '42501', message: 'permission denied' }
    const { recuperacion } = simular({ rpc: { data: null, error } })

    await expect(recuperacion.consumirCodigo('a@b.co', '000000')).rejects.toBe(error)
  })

  it('RF-02 / CU-02 9: fija la contraseña con la administración de Auth, y nada más', async () => {
    const { admin, recuperacion } = simular()

    await expect(recuperacion.fijarContrasena('u-7', 'Banano-4821')).resolves.toBeUndefined()

    expect(admin.auth.admin.updateUserById).toHaveBeenCalledExactlyOnceWith('u-7', {
      password: 'Banano-4821',
    })
  })

  it('si Auth no cambia la contraseña, lanza su error', async () => {
    const error = { status: 500, message: 'unexpected_failure' }
    const { recuperacion } = simular({ updateUserById: { data: null, error } })

    await expect(recuperacion.fijarContrasena('u-7', 'Banano-4821')).rejects.toBe(error)
  })
})
