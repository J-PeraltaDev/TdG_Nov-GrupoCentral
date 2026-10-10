// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { activar, actualizar, crear, desactivar } from './acciones.js'

const ADMINISTRADOR = 'u-admin'
const FINCA = '00000000-0000-4000-c000-000000000001'
const OTRA_FINCA = '00000000-0000-4000-c000-000000000002'
const AREA = '00000000-0000-4000-d000-000000000001'

const REPORTANTE = {
  id: 'u-nuevo',
  nombre: 'Persona de prueba',
  correo: 'persona@novedades.test',
  rol_id: 1,
  finca_id: FINCA,
  area_id: null,
  activo: true,
}

/** Los datos de `crear` como salen de `validarSolicitud`. */
const CREAR = {
  accion: 'crear',
  nombre: REPORTANTE.nombre,
  correo: REPORTANTE.correo,
  contrasena_inicial: 'Banano-4821',
  rol_id: 1,
  finca_id: FINCA,
  area_id: null,
  activo: true,
}

/** Los datos de `actualizar`: `activo` nulo es «no cambia». */
const ACTUALIZAR = {
  accion: 'actualizar',
  usuario_id: REPORTANTE.id,
  nombre: 'Persona con otro nombre',
  rol_id: 1,
  finca_id: FINCA,
  area_id: null,
  activo: null,
}

/**
 * Las cuentas simuladas. Cada operación anota su nombre en `orden`, para comprobar en qué
 * orden se hacen las cosas.
 */
function simular({ existente = REPORTANTE, ...reemplazos } = {}) {
  const orden = []
  const anotar =
    (nombre, respuesta) =>
    async (...argumentos) => {
      orden.push(nombre)
      return typeof respuesta === 'function' ? respuesta(...argumentos) : respuesta
    }
  const cuentas = {
    leerUsuario: vi.fn(anotar('leerUsuario', existente)),
    fincaActiva: vi.fn(anotar('fincaActiva', true)),
    areaActiva: vi.fn(anotar('areaActiva', true)),
    crearCuenta: vi.fn(anotar('crearCuenta', { id: REPORTANTE.id })),
    borrarCuenta: vi.fn(anotar('borrarCuenta')),
    suspenderCuenta: vi.fn(anotar('suspenderCuenta')),
    reactivarCuenta: vi.fn(anotar('reactivarCuenta')),
    insertarUsuario: vi.fn(anotar('insertarUsuario', (usuario) => ({ usuario }))),
    actualizarUsuario: vi.fn(
      anotar('actualizarUsuario', (id, cambios) => ({ ...existente, id, ...cambios })),
    ),
    ...reemplazos,
  }
  return { cuentas, orden, contexto: { cuentas, quien: ADMINISTRADOR } }
}

describe('gestionar-usuario · crear (RF-03 / CU-03 4 a 6; SDD 6.1.10)', () => {
  it('crea la cuenta en Auth y después el perfil, con el mismo identificador', async () => {
    const { cuentas, orden, contexto } = simular()

    const resultado = await crear(CREAR, contexto)

    expect(resultado).toEqual({ estado: 201, cuerpo: { usuario: REPORTANTE } })
    expect(orden).toEqual(['fincaActiva', 'crearCuenta', 'insertarUsuario'])
    expect(cuentas.crearCuenta).toHaveBeenCalledExactlyOnceWith({
      correo: 'persona@novedades.test',
      contrasena: 'Banano-4821',
    })
    expect(cuentas.insertarUsuario).toHaveBeenCalledExactlyOnceWith(REPORTANTE)
  })

  it('la contraseña inicial no va al perfil ni vuelve en la respuesta', async () => {
    const { cuentas, contexto } = simular()

    const resultado = await crear(CREAR, contexto)

    expect(JSON.stringify(cuentas.insertarUsuario.mock.calls)).not.toContain('Banano-4821')
    expect(JSON.stringify(resultado)).not.toContain('Banano-4821')
  })

  it('CU-03 6a: si Auth dice que el correo ya existe, responde 409 y no escribe el perfil', async () => {
    const { cuentas, contexto } = simular({
      crearCuenta: vi.fn().mockResolvedValue({ existe: true }),
    })

    expect(await crear(CREAR, contexto)).toEqual({
      estado: 409,
      cuerpo: { codigo: 'CORREO_EXISTENTE', campos: ['correo'] },
    })
    expect(cuentas.insertarUsuario).not.toHaveBeenCalled()
    expect(cuentas.borrarCuenta).not.toHaveBeenCalled()
  })

  it('CU-03 6a: si el correo ya está en `usuario`, borra la cuenta recién creada y responde 409', async () => {
    const { cuentas, orden, contexto } = simular({
      insertarUsuario: vi.fn().mockResolvedValue({ existe: true }),
    })

    expect(await crear(CREAR, contexto)).toEqual({
      estado: 409,
      cuerpo: { codigo: 'CORREO_EXISTENTE', campos: ['correo'] },
    })
    expect(cuentas.borrarCuenta).toHaveBeenCalledExactlyOnceWith(REPORTANTE.id)
    expect(orden).toEqual(['fincaActiva', 'crearCuenta', 'borrarCuenta'])
  })

  it('SDD 6.1.10: si falla la inserción del perfil, borra la cuenta recién creada y deja ver el error', async () => {
    const fallo = new Error('falló la base de datos')
    const { cuentas, contexto } = simular({ insertarUsuario: vi.fn().mockRejectedValue(fallo) })

    await expect(crear(CREAR, contexto)).rejects.toBe(fallo)
    expect(cuentas.borrarCuenta).toHaveBeenCalledExactlyOnceWith(REPORTANTE.id)
  })

  it('si tampoco se puede borrar la cuenta, el error que se ve es el de la inserción', async () => {
    const fallo = new Error('falló la base de datos')
    const { contexto } = simular({
      insertarUsuario: vi.fn().mockRejectedValue(fallo),
      borrarCuenta: vi.fn().mockRejectedValue(new Error('Auth no responde')),
    })

    await expect(crear(CREAR, contexto)).rejects.toBe(fallo)
  })

  it.each([
    ['la finca no existe o está inactiva', CREAR, { fincaActiva: false }, 'finca_id'],
    [
      'el área no existe o está inactiva',
      { ...CREAR, rol_id: 2, finca_id: null, area_id: AREA },
      { areaActiva: false },
      'area_id',
    ],
  ])(
    'CU-03 6b: si %s, responde 400 con el campo y no toca Auth',
    async (_, datos, estado, campo) => {
      const { cuentas, contexto } = simular({
        fincaActiva: vi.fn().mockResolvedValue(estado.fincaActiva ?? true),
        areaActiva: vi.fn().mockResolvedValue(estado.areaActiva ?? true),
      })

      expect(await crear(datos, contexto)).toEqual({
        estado: 400,
        cuerpo: { codigo: 'DATO_OBLIGATORIO', campos: [campo] },
      })
      expect(cuentas.crearCuenta).not.toHaveBeenCalled()
    },
  )

  it.each([3, 4])('el rol %i no tiene finca ni área que revisar', async (rol_id) => {
    const { cuentas, contexto } = simular()

    const resultado = await crear({ ...CREAR, rol_id, finca_id: null }, contexto)

    expect(resultado.estado).toBe(201)
    expect(cuentas.fincaActiva).not.toHaveBeenCalled()
    expect(cuentas.areaActiva).not.toHaveBeenCalled()
  })

  it('CU-03: con «Usuario activo» apagado, la cuenta nace suspendida', async () => {
    const { cuentas, orden, contexto } = simular()

    const resultado = await crear({ ...CREAR, activo: false }, contexto)

    expect(resultado.cuerpo.usuario.activo).toBe(false)
    expect(orden).toEqual(['fincaActiva', 'crearCuenta', 'insertarUsuario', 'suspenderCuenta'])
    expect(cuentas.suspenderCuenta).toHaveBeenCalledExactlyOnceWith(REPORTANTE.id)
  })
})

describe('gestionar-usuario · actualizar (RF-03 / CU-03 5)', () => {
  it('cambia el nombre, el rol y el alcance; el correo y el estado no se tocan', async () => {
    const { cuentas, orden, contexto } = simular()

    const resultado = await actualizar(
      { ...ACTUALIZAR, rol_id: 2, finca_id: null, area_id: AREA },
      contexto,
    )

    expect(resultado.estado).toBe(200)
    expect(resultado.cuerpo.usuario).toMatchObject({
      id: REPORTANTE.id,
      nombre: 'Persona con otro nombre',
      correo: REPORTANTE.correo,
      rol_id: 2,
      area_id: AREA,
    })
    expect(cuentas.actualizarUsuario).toHaveBeenCalledExactlyOnceWith(REPORTANTE.id, {
      nombre: 'Persona con otro nombre',
      rol_id: 2,
      finca_id: null,
      area_id: AREA,
    })
    expect(orden).toEqual(['leerUsuario', 'areaActiva', 'actualizarUsuario'])
    expect(cuentas.suspenderCuenta).not.toHaveBeenCalled()
  })

  it('si el usuario no existe responde 404', async () => {
    const { cuentas, contexto } = simular({ existente: null })

    expect(await actualizar(ACTUALIZAR, contexto)).toEqual({
      estado: 404,
      cuerpo: { codigo: 'NO_ENCONTRADO' },
    })
    expect(cuentas.actualizarUsuario).not.toHaveBeenCalled()
  })

  it('CU-03 6b: al cambiar de finca, la nueva debe estar activa', async () => {
    const { cuentas, contexto } = simular({ fincaActiva: vi.fn().mockResolvedValue(false) })

    expect(await actualizar({ ...ACTUALIZAR, finca_id: OTRA_FINCA }, contexto)).toEqual({
      estado: 400,
      cuerpo: { codigo: 'DATO_OBLIGATORIO', campos: ['finca_id'] },
    })
    expect(cuentas.fincaActiva).toHaveBeenCalledWith(OTRA_FINCA)
    expect(cuentas.actualizarUsuario).not.toHaveBeenCalled()
  })

  it('CU-04 3b: si la finca no cambia, se puede editar el nombre aunque su finca esté desactivada', async () => {
    const { cuentas, contexto } = simular({ fincaActiva: vi.fn().mockResolvedValue(false) })

    const resultado = await actualizar(ACTUALIZAR, contexto)

    expect(resultado.estado).toBe(200)
    expect(cuentas.fincaActiva).not.toHaveBeenCalled()
  })

  it('con `activo` en falso, además lo desactiva: primero los datos y después el ingreso', async () => {
    const { cuentas, orden, contexto } = simular()

    const resultado = await actualizar({ ...ACTUALIZAR, activo: false }, contexto)

    expect(resultado.cuerpo.usuario.activo).toBe(false)
    expect(orden).toEqual([
      'leerUsuario',
      'actualizarUsuario',
      'actualizarUsuario',
      'suspenderCuenta',
    ])
    expect(cuentas.actualizarUsuario).toHaveBeenLastCalledWith(REPORTANTE.id, { activo: false })
  })

  it('con `activo` en verdadero sobre un inactivo, además lo reactiva: primero el ingreso', async () => {
    const { orden, contexto } = simular({ existente: { ...REPORTANTE, activo: false } })

    const resultado = await actualizar({ ...ACTUALIZAR, activo: true }, contexto)

    expect(resultado.cuerpo.usuario.activo).toBe(true)
    expect(orden).toEqual([
      'leerUsuario',
      'actualizarUsuario',
      'reactivarCuenta',
      'actualizarUsuario',
    ])
  })

  it('si `activo` llega igual al que tiene, no toca Auth', async () => {
    const { cuentas, contexto } = simular()

    await actualizar({ ...ACTUALIZAR, activo: true }, contexto)

    expect(cuentas.suspenderCuenta).not.toHaveBeenCalled()
    expect(cuentas.reactivarCuenta).not.toHaveBeenCalled()
    expect(cuentas.actualizarUsuario).toHaveBeenCalledOnce()
  })

  it.each([
    ['cambiarse el rol', { rol_id: 3 }, ['rol_id']],
    ['desactivarse', { activo: false }, ['activo']],
    ['las dos cosas', { rol_id: 3, activo: false }, ['rol_id', 'activo']],
  ])('Tabla 23: el administrador no puede %s a sí mismo', async (_, cambios, campos) => {
    const yo = { ...REPORTANTE, id: ADMINISTRADOR, rol_id: 4, finca_id: null }
    const { cuentas, contexto } = simular({ existente: yo })

    const resultado = await actualizar(
      { ...ACTUALIZAR, usuario_id: ADMINISTRADOR, rol_id: 4, finca_id: null, ...cambios },
      contexto,
    )

    expect(resultado).toEqual({ estado: 403, cuerpo: { codigo: 'SIN_PERMISO', campos } })
    expect(cuentas.actualizarUsuario).not.toHaveBeenCalled()
  })

  it('pero sí puede cambiar su propio nombre', async () => {
    const yo = { ...REPORTANTE, id: ADMINISTRADOR, rol_id: 4, finca_id: null }
    const { contexto } = simular({ existente: yo })

    const resultado = await actualizar(
      { ...ACTUALIZAR, usuario_id: ADMINISTRADOR, rol_id: 4, finca_id: null },
      contexto,
    )

    expect(resultado.estado).toBe(200)
  })
})

describe('gestionar-usuario · desactivar y activar (RF-03 / CU-03 3a)', () => {
  const DESACTIVAR = { accion: 'desactivar', usuario_id: REPORTANTE.id }
  const ACTIVAR = { accion: 'activar', usuario_id: REPORTANTE.id }

  it('desactivar corta primero los datos y después suspende el ingreso', async () => {
    const { cuentas, orden, contexto } = simular()

    const resultado = await desactivar(DESACTIVAR, contexto)

    expect(resultado).toEqual({
      estado: 200,
      cuerpo: { usuario: { ...REPORTANTE, activo: false } },
    })
    expect(orden).toEqual(['leerUsuario', 'actualizarUsuario', 'suspenderCuenta'])
    expect(cuentas.actualizarUsuario).toHaveBeenCalledExactlyOnceWith(REPORTANTE.id, {
      activo: false,
    })
  })

  it('si la suspensión falla, el error se ve y la operación se puede repetir', async () => {
    const fallo = new Error('Auth no responde')
    const { cuentas, contexto } = simular({
      suspenderCuenta: vi.fn().mockRejectedValueOnce(fallo).mockResolvedValueOnce(undefined),
    })

    await expect(desactivar(DESACTIVAR, contexto)).rejects.toBe(fallo)
    // El segundo intento da el mismo resultado que si el primero hubiera terminado.
    const resultado = await desactivar(DESACTIVAR, contexto)

    expect(resultado.estado).toBe(200)
    expect(cuentas.suspenderCuenta).toHaveBeenCalledTimes(2)
  })

  it('Tabla 23: el administrador no puede desactivarse a sí mismo', async () => {
    const { cuentas, contexto } = simular()

    expect(await desactivar({ ...DESACTIVAR, usuario_id: ADMINISTRADOR }, contexto)).toEqual({
      estado: 403,
      cuerpo: { codigo: 'SIN_PERMISO', campos: ['usuario_id'] },
    })
    expect(cuentas.actualizarUsuario).not.toHaveBeenCalled()
    expect(cuentas.suspenderCuenta).not.toHaveBeenCalled()
  })

  it('activar quita primero la suspensión y después activa el perfil', async () => {
    const { orden, contexto } = simular({ existente: { ...REPORTANTE, activo: false } })

    const resultado = await activar(ACTIVAR, contexto)

    expect(resultado).toEqual({ estado: 200, cuerpo: { usuario: REPORTANTE } })
    expect(orden).toEqual(['leerUsuario', 'reactivarCuenta', 'actualizarUsuario'])
  })

  it.each([
    ['desactivar', desactivar, DESACTIVAR],
    ['activar', activar, ACTIVAR],
  ])('%s un usuario que no existe responde 404, sin tocar Auth', async (_, accion, datos) => {
    const { cuentas, contexto } = simular({ existente: null })

    expect(await accion(datos, contexto)).toEqual({
      estado: 404,
      cuerpo: { codigo: 'NO_ENCONTRADO' },
    })
    expect(cuentas.suspenderCuenta).not.toHaveBeenCalled()
    expect(cuentas.reactivarCuenta).not.toHaveBeenCalled()
  })

  it('nunca borra una cuenta: desactivar no llama a borrarCuenta', async () => {
    const { cuentas, contexto } = simular()

    await desactivar(DESACTIVAR, contexto)

    expect(cuentas.borrarCuenta).not.toHaveBeenCalled()
  })
})
