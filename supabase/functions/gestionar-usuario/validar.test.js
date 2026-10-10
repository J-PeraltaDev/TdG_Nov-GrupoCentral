// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { validarSolicitud } from './validar.js'

const FINCA = '00000000-0000-4000-c000-000000000001'
const AREA = '00000000-0000-4000-d000-000000000001'
const USUARIO = '00000000-0000-4000-a000-000000000009'

const CREAR = {
  accion: 'crear',
  nombre: 'Persona de prueba',
  correo: 'persona@novedades.test',
  contrasena_inicial: 'Banano-4821',
  rol_id: 1,
  finca_id: FINCA,
}

const campos = (cuerpo) => {
  const resultado = validarSolicitud(cuerpo)
  return resultado.ok ? [] : resultado.campos
}

describe('gestionar-usuario · forma de la solicitud (SDD, Tabla 23)', () => {
  it('RF-03 / CU-03 4: acepta crear un reportante con su finca y devuelve los datos limpios', () => {
    const resultado = validarSolicitud({
      ...CREAR,
      nombre: '  Persona   de prueba ',
      correo: ' Persona@Novedades.TEST ',
    })

    expect(resultado).toEqual({
      ok: true,
      datos: {
        accion: 'crear',
        nombre: 'Persona de prueba',
        correo: 'persona@novedades.test',
        contrasena_inicial: 'Banano-4821',
        rol_id: 1,
        finca_id: FINCA,
        area_id: null,
        activo: true,
      },
    })
  })

  it('RF-03 / CU-03 4: acepta crear cada rol con su alcance', () => {
    expect(campos({ ...CREAR, rol_id: 2, finca_id: null, area_id: AREA })).toEqual([])
    expect(campos({ ...CREAR, rol_id: 3, finca_id: null })).toEqual([])
    expect(campos({ ...CREAR, rol_id: 4, finca_id: undefined })).toEqual([])
  })

  it('RF-03 / CU-03 6b: el reportante necesita finca y no lleva área', () => {
    expect(campos({ ...CREAR, finca_id: null })).toEqual(['finca_id'])
    expect(campos({ ...CREAR, area_id: AREA })).toEqual(['area_id'])
  })

  it('RF-03 / CU-03 6b: el aprobador necesita área y no lleva finca', () => {
    expect(campos({ ...CREAR, rol_id: 2, finca_id: null })).toEqual(['area_id'])
    expect(campos({ ...CREAR, rol_id: 2, area_id: AREA })).toEqual(['finca_id'])
  })

  it('RF-03 / CU-03 6b: el director y el administrador no llevan finca ni área', () => {
    expect(campos({ ...CREAR, rol_id: 3 })).toEqual(['finca_id'])
    expect(campos({ ...CREAR, rol_id: 4, finca_id: null, area_id: AREA })).toEqual(['area_id'])
  })

  it('RF-03 / CU-03 6b: señala cada dato que falta al crear', () => {
    expect(campos({ accion: 'crear' })).toEqual([
      'nombre',
      'correo',
      'contrasena_inicial',
      'rol_id',
    ])
  })

  it.each([
    ['nombre', ''],
    ['nombre', '   '],
    ['nombre', 'x'.repeat(121)],
    ['nombre', 42],
    ['correo', 'sin-arroba'],
    ['correo', 'dos@@arrobas.test'],
    ['correo', 'con espacio@novedades.test'],
    ['correo', `${'x'.repeat(250)}@a.co`],
    ['contrasena_inicial', 'corta1'],
    ['contrasena_inicial', 'sinnumeros'],
    ['rol_id', 0],
    ['rol_id', 5],
    ['rol_id', '1'],
    ['rol_id', 1.5],
    ['finca_id', 'no-es-un-uuid'],
    ['activo', 'sí'],
  ])('RF-03 / CU-03 6b: rechaza %s = %j', (campo, valor) => {
    expect(campos({ ...CREAR, [campo]: valor })).toEqual([campo])
  })

  it('RF-03: crear admite «activo» y lo toma como verdadero si no llega', () => {
    expect(validarSolicitud({ ...CREAR, activo: false }).datos.activo).toBe(false)
    expect(validarSolicitud(CREAR).datos.activo).toBe(true)
  })

  it('RF-03 / CU-03 5: actualizar pide el usuario, el nombre, el rol y su alcance', () => {
    expect(
      validarSolicitud({
        accion: 'actualizar',
        usuario_id: USUARIO,
        nombre: 'Otro nombre',
        rol_id: 2,
        area_id: AREA,
      }),
    ).toEqual({
      ok: true,
      datos: {
        accion: 'actualizar',
        usuario_id: USUARIO,
        nombre: 'Otro nombre',
        rol_id: 2,
        finca_id: null,
        area_id: AREA,
        activo: null,
      },
    })
    expect(campos({ accion: 'actualizar' })).toEqual(['usuario_id', 'nombre', 'rol_id'])
  })

  it('RF-03: actualizar no recibe correo ni contraseña', () => {
    const { datos } = validarSolicitud({
      accion: 'actualizar',
      usuario_id: USUARIO,
      nombre: 'Otro nombre',
      rol_id: 3,
      correo: 'otro@novedades.test',
      contrasena_inicial: 'Banano-4821',
    })

    expect(datos).not.toHaveProperty('correo')
    expect(datos).not.toHaveProperty('contrasena_inicial')
  })

  it.each(['desactivar', 'activar'])('RF-03 / CU-03 3a: %s solo pide el usuario', (accion) => {
    expect(validarSolicitud({ accion, usuario_id: USUARIO })).toEqual({
      ok: true,
      datos: { accion, usuario_id: USUARIO },
    })
    expect(campos({ accion })).toEqual(['usuario_id'])
    expect(campos({ accion, usuario_id: 'no-es-un-uuid' })).toEqual(['usuario_id'])
  })

  it.each([undefined, null, '', 'borrar', 'CREAR', 7])('rechaza la acción %j', (accion) => {
    expect(campos({ ...CREAR, accion })).toEqual(['accion'])
  })
})
