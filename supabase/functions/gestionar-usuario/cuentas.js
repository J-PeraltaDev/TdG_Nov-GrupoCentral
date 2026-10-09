/*
 * Las cuentas sobre supabase-js: lo que las acciones de gestionar-usuario necesitan de Auth y
 * de la base de datos (SDD 6.1.10). Recibe el cliente ya armado con la clave de servicio, que
 * salta las políticas RLS; por eso vive solo en la función (CLAUDE.md, regla 8).
 *
 * Módulo puro: no importa nada de Deno, y se prueba con un cliente simulado (docs/adr/0012).
 */

/** Lo que se lee y se devuelve de `usuario`. El correo va: la función solo le responde a un
 * administrador. */
const COLUMNAS = 'id, nombre, correo, rol_id, finca_id, area_id, activo'

/** Auth no tiene «para siempre»: cien años. `none` quita la suspensión. */
const SUSPENSION = '876000h'
const SIN_SUSPENSION = 'none'

/** Violación de `usuario_correo_unico`. */
const VIOLACION_DE_UNICIDAD = '23505'

/**
 * Auth responde 422 con el código `email_exists` cuando el correo ya tiene una cuenta. Las
 * versiones anteriores solo traían el mensaje.
 *
 * @param {{ code?: string, status?: number, message?: string }} error
 */
function esCorreoExistente(error) {
  return (
    error.code === 'email_exists' ||
    (error.status === 422 && /already (been )?registered/i.test(error.message ?? ''))
  )
}

/**
 * @param {any} admin Cliente de supabase-js con la clave de servicio.
 * @returns {import('./acciones.js').Cuentas}
 */
export function crearCuentas(admin) {
  /** Espera una consulta y entrega sus datos, o lanza su error. */
  const pedir = async (consulta) => {
    const { data, error } = await consulta
    if (error) throw error
    return data
  }

  const estaActiva = async (tabla, id) =>
    Boolean(
      await pedir(admin.from(tabla).select('id').eq('id', id).eq('activo', true).maybeSingle()),
    )

  const cambiarSuspension = async (id, duracion) => {
    const { error } = await admin.auth.admin.updateUserById(id, { ban_duration: duracion })
    if (error) throw error
  }

  return {
    leerUsuario: (id) => pedir(admin.from('usuario').select(COLUMNAS).eq('id', id).maybeSingle()),
    fincaActiva: (id) => estaActiva('finca', id),
    areaActiva: (id) => estaActiva('area', id),

    async crearCuenta({ correo, contrasena }) {
      // El correo es exclusivo de la plataforma y no recibe mensajes: nace confirmado.
      const { data, error } = await admin.auth.admin.createUser({
        email: correo,
        password: contrasena,
        email_confirm: true,
      })
      if (error) {
        if (esCorreoExistente(error)) return { existe: true }
        throw error
      }
      return { id: data.user.id }
    },

    async borrarCuenta(id) {
      const { error } = await admin.auth.admin.deleteUser(id)
      if (error) throw error
    },

    suspenderCuenta: (id) => cambiarSuspension(id, SUSPENSION),
    reactivarCuenta: (id) => cambiarSuspension(id, SIN_SUSPENSION),

    async insertarUsuario(usuario) {
      const { data, error } = await admin.from('usuario').insert(usuario).select(COLUMNAS).single()
      if (error) {
        if (error.code === VIOLACION_DE_UNICIDAD) return { existe: true }
        throw error
      }
      return { usuario: data }
    },

    actualizarUsuario: (id, cambios) =>
      pedir(admin.from('usuario').update(cambios).eq('id', id).select(COLUMNAS).single()),
  }
}
