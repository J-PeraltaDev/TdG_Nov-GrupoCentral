// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { crearCuentas } from './cuentas.js'

const USUARIO = {
  id: 'u-1',
  nombre: 'Persona de prueba',
  correo: 'persona@novedades.test',
  rol_id: 1,
  finca_id: 'f-1',
  area_id: null,
  activo: true,
}

/**
 * Un cliente de supabase-js simulado: anota cada consulta (tabla y métodos encadenados) y
 * cada llamada a la administración de Auth, y entrega las respuestas que se le indiquen.
 */
function simular({ datos = { data: null, error: null }, auth = {} } = {}) {
  const consultas = []
  const admin = {
    from(tabla) {
      const pasos = [['from', tabla]]
      consultas.push(pasos)
      const consulta = new Proxy(
        {},
        {
          get(_, metodo) {
            if (metodo === 'then') {
              return (resolver, rechazar) => Promise.resolve(datos).then(resolver, rechazar)
            }
            return (...argumentos) => {
              pasos.push([metodo, ...argumentos])
              return consulta
            }
          },
        },
      )
      return consulta
    },
    auth: {
      admin: {
        createUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u-1' } }, error: null }),
        deleteUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
        updateUserById: vi.fn().mockResolvedValue({ data: {}, error: null }),
        ...auth,
      },
    },
  }
  return { admin, consultas, cuentas: crearCuentas(admin) }
}

describe('gestionar-usuario · cuentas sobre supabase-js (SDD 6.1.10)', () => {
  it('lee el perfil por su identificador, con columnas explícitas', async () => {
    const { cuentas, consultas } = simular({ datos: { data: USUARIO, error: null } })

    await expect(cuentas.leerUsuario('u-1')).resolves.toEqual(USUARIO)

    expect(consultas[0]).toEqual([
      ['from', 'usuario'],
      ['select', 'id, nombre, correo, rol_id, finca_id, area_id, activo'],
      ['eq', 'id', 'u-1'],
      ['maybeSingle'],
    ])
  })

  it.each([
    ['fincaActiva', 'finca'],
    ['areaActiva', 'area'],
  ])('CU-03 6b: %s busca en `%s` una fila activa con ese identificador', async (metodo, tabla) => {
    const existe = simular({ datos: { data: { id: 'x-1' }, error: null } })
    await expect(existe.cuentas[metodo]('x-1')).resolves.toBe(true)
    expect(existe.consultas[0]).toEqual([
      ['from', tabla],
      ['select', 'id'],
      ['eq', 'id', 'x-1'],
      ['eq', 'activo', true],
      ['maybeSingle'],
    ])

    // Sin fila: no existe o está inactiva.
    const falta = simular({ datos: { data: null, error: null } })
    await expect(falta.cuentas[metodo]('x-1')).resolves.toBe(false)
  })

  it('crea la cuenta de Auth con el correo ya confirmado', async () => {
    const { cuentas, admin } = simular()

    await expect(
      cuentas.crearCuenta({ correo: 'persona@novedades.test', contrasena: 'Banano-4821' }),
    ).resolves.toEqual({ id: 'u-1' })

    expect(admin.auth.admin.createUser).toHaveBeenCalledExactlyOnceWith({
      email: 'persona@novedades.test',
      password: 'Banano-4821',
      email_confirm: true,
    })
  })

  it.each([
    ['el código de Auth', { code: 'email_exists', status: 422, message: 'x' }],
    [
      'el mensaje de versiones anteriores',
      { status: 422, message: 'A user with this email address has already been registered' },
    ],
  ])('CU-03 6a: reconoce el correo repetido por %s', async (_, error) => {
    const { cuentas } = simular({
      auth: { createUser: vi.fn().mockResolvedValue({ data: { user: null }, error }) },
    })

    await expect(cuentas.crearCuenta({ correo: 'a@b.co', contrasena: 'x' })).resolves.toEqual({
      existe: true,
    })
  })

  it('los demás errores de Auth pasan como llegan', async () => {
    const error = { code: 'weak_password', status: 422, message: 'Password is too weak' }
    const { cuentas } = simular({
      auth: { createUser: vi.fn().mockResolvedValue({ data: { user: null }, error }) },
    })

    await expect(cuentas.crearCuenta({ correo: 'a@b.co', contrasena: 'x' })).rejects.toBe(error)
  })

  it('inserta el perfil y lo devuelve', async () => {
    const { cuentas, consultas } = simular({ datos: { data: USUARIO, error: null } })

    await expect(cuentas.insertarUsuario(USUARIO)).resolves.toEqual({ usuario: USUARIO })

    expect(consultas[0]).toContainEqual(['insert', USUARIO])
    expect(consultas[0][0]).toEqual(['from', 'usuario'])
  })

  it('CU-03 6a: el correo repetido en `usuario` (23505) se entrega como `existe`', async () => {
    const { cuentas } = simular({ datos: { data: null, error: { code: '23505' } } })

    await expect(cuentas.insertarUsuario(USUARIO)).resolves.toEqual({ existe: true })
  })

  it('los demás errores de la inserción pasan como llegan', async () => {
    const error = { code: '23503', message: 'la finca no existe' }
    const { cuentas } = simular({ datos: { data: null, error } })

    await expect(cuentas.insertarUsuario(USUARIO)).rejects.toBe(error)
  })

  it('actualiza solo lo que recibe y devuelve el perfil', async () => {
    const { cuentas, consultas } = simular({
      datos: { data: { ...USUARIO, activo: false }, error: null },
    })

    await expect(cuentas.actualizarUsuario('u-1', { activo: false })).resolves.toMatchObject({
      activo: false,
    })

    expect(consultas[0]).toContainEqual(['update', { activo: false }])
    expect(consultas[0]).toContainEqual(['eq', 'id', 'u-1'])
  })

  it('CU-03 3a: suspender y reactivar cambian la suspensión de la cuenta en Auth', async () => {
    const { cuentas, admin } = simular()

    await cuentas.suspenderCuenta('u-1')
    await cuentas.reactivarCuenta('u-1')

    expect(admin.auth.admin.updateUserById.mock.calls).toEqual([
      ['u-1', { ban_duration: '876000h' }],
      ['u-1', { ban_duration: 'none' }],
    ])
  })

  it('borra una cuenta por su identificador (solo la compensación de `crear`)', async () => {
    const { cuentas, admin } = simular()

    await cuentas.borrarCuenta('u-1')

    expect(admin.auth.admin.deleteUser).toHaveBeenCalledExactlyOnceWith('u-1')
  })

  it.each([
    ['suspenderCuenta', 'updateUserById'],
    ['borrarCuenta', 'deleteUser'],
  ])('si Auth falla en %s, el error se ve', async (metodo, llamada) => {
    const error = { status: 500, message: 'Auth no responde' }
    const { cuentas } = simular({
      auth: { [llamada]: vi.fn().mockResolvedValue({ data: null, error }) },
    })

    await expect(cuentas[metodo]('u-1')).rejects.toBe(error)
  })

  it('nunca borra de `usuario`', async () => {
    const { cuentas, consultas } = simular({ datos: { data: USUARIO, error: null } })

    await cuentas.leerUsuario('u-1')
    await cuentas.insertarUsuario(USUARIO)
    await cuentas.actualizarUsuario('u-1', { nombre: 'Otro' })
    await cuentas.borrarCuenta('u-1')

    expect(consultas.flat().map(([metodo]) => metodo)).not.toContain('delete')
  })
})
