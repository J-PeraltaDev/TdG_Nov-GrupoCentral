import { describe, expect, it, vi } from 'vitest'
import {
  alPedirRevisionDelPerfil,
  pedirRevisionDelPerfil,
  vigilarPermiso,
} from './perfilVigente.js'

describe('Aviso de perfil desactualizado (RF-03 / CU-01 4b)', () => {
  it('quien escucha recibe el aviso, y deja de recibirlo cuando se retira', () => {
    const oyente = vi.fn()
    const dejarDeEscuchar = alPedirRevisionDelPerfil(oyente)

    pedirRevisionDelPerfil()
    expect(oyente).toHaveBeenCalledOnce()

    dejarDeEscuchar()
    pedirRevisionDelPerfil()
    expect(oyente).toHaveBeenCalledOnce()
  })

  it('una acción que responde SIN_PERMISO pide la revisión, y el error sigue su camino', async () => {
    const oyente = vi.fn()
    const dejarDeEscuchar = alPedirRevisionDelPerfil(oyente)
    const fallo = new Error('SIN_PERMISO')

    await expect(vigilarPermiso(() => Promise.reject(fallo))).rejects.toBe(fallo)

    expect(oyente).toHaveBeenCalledOnce()
    dejarDeEscuchar()
  })

  it.each([
    ['otro código', new Error('TRANSICION_INVALIDA')],
    ['un error de red', new TypeError('Failed to fetch')],
    ['algo que no es un error', null],
  ])('con %s no pide nada', async (_, fallo) => {
    const oyente = vi.fn()
    const dejarDeEscuchar = alPedirRevisionDelPerfil(oyente)

    await expect(vigilarPermiso(() => Promise.reject(fallo))).rejects.toBe(fallo)

    expect(oyente).not.toHaveBeenCalled()
    dejarDeEscuchar()
  })

  it('si la acción termina bien, entrega su resultado y no pide nada', async () => {
    const oyente = vi.fn()
    const dejarDeEscuchar = alPedirRevisionDelPerfil(oyente)

    await expect(vigilarPermiso(async () => 'hecho')).resolves.toBe('hecho')

    expect(oyente).not.toHaveBeenCalled()
    dejarDeEscuchar()
  })
})
