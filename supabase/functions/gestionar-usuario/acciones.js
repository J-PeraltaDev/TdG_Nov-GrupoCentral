import { fallo } from '../_shared/servir.js'

/*
 * Las cuatro acciones de gestionar-usuario (SDD 6.1.10 y Tabla 23 · RF-03 / CU-03). Reciben
 * los datos ya validados (validar.js) y las cuentas como una dependencia, para probarlas sin
 * Deno ni red (docs/adr/0012).
 *
 * Cada usuario vive en dos lugares: la cuenta de Auth, que es con la que ingresa, y su perfil
 * en `usuario`, que es lo que miran las políticas. No hay transacción que cubra los dos, así
 * que cada acción los toca en el orden que deja el fallo intermedio menos grave, y todas dan
 * el mismo resultado si se repiten.
 *
 * Nunca se borra un usuario: se desactiva. El único borrado es el de la cuenta recién creada
 * cuando su perfil no se pudo guardar.
 */

const ROL = { REPORTANTE: 1, APROBADOR_AREA: 2 }

/**
 * @typedef {object} Usuario
 * @property {string} id
 * @property {string} nombre
 * @property {string} correo
 * @property {number} rol_id
 * @property {string | null} finca_id
 * @property {string | null} area_id
 * @property {boolean} activo
 */

/**
 * Lo que las acciones necesitan de Auth y de la base de datos (cuentas.js lo arma sobre
 * supabase-js).
 *
 * @typedef {object} Cuentas
 * @property {(id: string) => Promise<Usuario | null>} leerUsuario
 * @property {(id: string) => Promise<boolean>} fincaActiva Existe y está activa.
 * @property {(id: string) => Promise<boolean>} areaActiva
 * @property {(cuenta: { correo: string, contrasena: string }) => Promise<{ id: string } | { existe: true }>} crearCuenta
 *   Crea la cuenta de Auth con el correo confirmado; `existe` si el correo ya está registrado.
 * @property {(id: string) => Promise<void>} borrarCuenta
 * @property {(id: string) => Promise<void>} suspenderCuenta Le impide ingresar.
 * @property {(id: string) => Promise<void>} reactivarCuenta
 * @property {(usuario: Usuario) => Promise<{ usuario: Usuario } | { existe: true }>} insertarUsuario
 *   `existe` si el correo ya está en `usuario`.
 * @property {(id: string, cambios: Partial<Usuario>) => Promise<Usuario>} actualizarUsuario
 */

/**
 * @typedef {object} Contexto
 * @property {Cuentas} cuentas
 * @property {string} quien `id` del administrador que hace la solicitud.
 */

const exito = (estado, usuario) => ({ estado, cuerpo: { usuario } })

/**
 * La finca del reportante o el área del aprobador debe existir y estar activa (CU-03 6b). La
 * forma ya la revisó validar.js; esto es lo que hay que consultar.
 *
 * @returns {Promise<string[]>} Los campos que no cumplen.
 */
async function alcanceInactivo(cuentas, { rol_id: rolId, finca_id: fincaId, area_id: areaId }) {
  if (rolId === ROL.REPORTANTE && !(await cuentas.fincaActiva(fincaId))) return ['finca_id']
  if (rolId === ROL.APROBADOR_AREA && !(await cuentas.areaActiva(areaId))) return ['area_id']
  return []
}

/**
 * Primero los datos y después el ingreso: con `activo` en falso las políticas dejan de
 * responderle de inmediato, aunque su sesión siga viva hasta que venza. Si la suspensión
 * falla, el usuario ya no ve nada y la operación se repite.
 */
async function suspender(cuentas, id) {
  const usuario = await cuentas.actualizarUsuario(id, { activo: false })
  await cuentas.suspenderCuenta(id)
  return usuario
}

/**
 * Al revés: primero el ingreso. Si el segundo paso falla, queda una cuenta que puede ingresar
 * pero no ve nada, que es el lado seguro.
 */
async function reactivar(cuentas, id) {
  await cuentas.reactivarCuenta(id)
  return cuentas.actualizarUsuario(id, { activo: true })
}

/**
 * Crea la cuenta con su contraseña inicial y su perfil (CU-03, pasos 4 a 6).
 *
 * @param {Record<string, any>} datos
 * @param {Contexto} contexto
 */
export async function crear(datos, { cuentas }) {
  const campos = await alcanceInactivo(cuentas, datos)
  if (campos.length > 0) return fallo(400, 'DATO_OBLIGATORIO', campos)

  const cuenta = await cuentas.crearCuenta({
    correo: datos.correo,
    contrasena: datos.contrasena_inicial,
  })
  // CU-03 6a.
  if ('existe' in cuenta) return fallo(409, 'CORREO_EXISTENTE', ['correo'])

  // La cuenta ya existe en Auth: si el perfil no se guarda, no puede quedar una cuenta que
  // ingresa sin ser un usuario de la aplicación. Si el borrado también falla, el error que
  // importa sigue siendo el de la inserción.
  const deshacer = () => cuentas.borrarCuenta(cuenta.id).catch(() => {})
  let insercion
  try {
    insercion = await cuentas.insertarUsuario({
      id: cuenta.id,
      nombre: datos.nombre,
      correo: datos.correo,
      rol_id: datos.rol_id,
      finca_id: datos.finca_id,
      area_id: datos.area_id,
      activo: datos.activo,
    })
  } catch (error) {
    await deshacer()
    throw error
  }
  if ('existe' in insercion) {
    await deshacer()
    return fallo(409, 'CORREO_EXISTENTE', ['correo'])
  }

  // Con «Usuario activo» apagado, la cuenta nace sin poder ingresar.
  if (!datos.activo) await cuentas.suspenderCuenta(cuenta.id)

  return exito(201, insercion.usuario)
}

/**
 * Cambia el nombre, el rol y la finca o el área; si llega `activo` y es distinto, además lo
 * desactiva o lo reactiva (el interruptor del formulario 29). El correo no se edita.
 *
 * @param {Record<string, any>} datos
 * @param {Contexto} contexto
 */
export async function actualizar(datos, { cuentas, quien }) {
  const actual = await cuentas.leerUsuario(datos.usuario_id)
  if (!actual) return fallo(404, 'NO_ENCONTRADO')

  // Nadie se cambia el rol ni se desactiva a sí mismo: como solo un administrador activo
  // puede llamar la función, así siempre queda al menos uno.
  if (actual.id === quien) {
    const propios = []
    if (datos.rol_id !== actual.rol_id) propios.push('rol_id')
    if (datos.activo === false) propios.push('activo')
    if (propios.length > 0) return fallo(403, 'SIN_PERMISO', propios)
  }

  // El alcance se revisa solo si cambia: a un reportante cuya finca se desactivó después
  // todavía se le puede corregir el nombre.
  if (datos.finca_id !== actual.finca_id || datos.area_id !== actual.area_id) {
    const campos = await alcanceInactivo(cuentas, datos)
    if (campos.length > 0) return fallo(400, 'DATO_OBLIGATORIO', campos)
  }

  let usuario = await cuentas.actualizarUsuario(actual.id, {
    nombre: datos.nombre,
    rol_id: datos.rol_id,
    finca_id: datos.finca_id,
    area_id: datos.area_id,
  })

  // `null`: el formulario no dijo nada del estado.
  if (datos.activo !== null && datos.activo !== actual.activo) {
    usuario = datos.activo
      ? await reactivar(cuentas, actual.id)
      : await suspender(cuentas, actual.id)
  }

  return exito(200, usuario)
}

/**
 * Le impide el ingreso y conserva sus registros (CU-03 3a).
 *
 * @param {Record<string, any>} datos
 * @param {Contexto} contexto
 */
export async function desactivar(datos, { cuentas, quien }) {
  if (datos.usuario_id === quien) return fallo(403, 'SIN_PERMISO', ['usuario_id'])
  if (!(await cuentas.leerUsuario(datos.usuario_id))) return fallo(404, 'NO_ENCONTRADO')

  return exito(200, await suspender(cuentas, datos.usuario_id))
}

/**
 * @param {Record<string, any>} datos
 * @param {Contexto} contexto
 */
export async function activar(datos, { cuentas }) {
  if (!(await cuentas.leerUsuario(datos.usuario_id))) return fallo(404, 'NO_ENCONTRADO')

  return exito(200, await reactivar(cuentas, datos.usuario_id))
}
