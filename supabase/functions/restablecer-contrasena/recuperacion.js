/*
 * La recuperación sobre supabase-js: lo que restablecer-contrasena necesita de la base de datos
 * y de Auth (SDD 6.1.10). Recibe el cliente ya armado con la clave de servicio; por eso vive
 * solo en la función (CLAUDE.md, regla 8).
 *
 * Módulo puro: no importa nada de Deno, y se prueba con un cliente simulado (docs/adr/0012).
 */

/**
 * @param {any} admin Cliente de supabase-js con la clave de servicio.
 * @returns {import('./manejar.js').Recuperacion}
 */
export function crearRecuperacion(admin) {
  return {
    // consumir_codigo_recuperacion solo la ejecuta service_role: compara el código con su
    // resumen dentro de la base de datos, y el resumen nunca llega aquí.
    async consumirCodigo(correo, codigo) {
      const { data, error } = await admin.rpc('consumir_codigo_recuperacion', {
        p_correo: correo,
        p_codigo: codigo,
      })
      if (error) throw error
      const fila = data?.[0]
      return { resultado: fila?.resultado ?? null, usuarioId: fila?.usuario_id ?? null }
    },

    async fijarContrasena(usuarioId, contrasena) {
      const { error } = await admin.auth.admin.updateUserById(usuarioId, { password: contrasena })
      if (error) throw error
    },
  }
}
