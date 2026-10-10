import { ROL } from '../../core/sesion/roles.js'

/*
 * Qué pasa con el trabajo en curso cuando un usuario deja de atender su alcance, porque se
 * desactiva o porque le cambian el rol, la finca o el área (RF-03).
 *
 * El modelo no tiene responsable individual: cualquier aprobador del área o reportante de la
 * finca continúa las novedades. Por eso el cambio siempre se permite; solo se advierte cuando
 * no queda nadie más (decisión 15b del plan del Sprint 3).
 */

/**
 * @param {{ id: string, rol_id: number, finca_id: string | null, area_id: string | null, activo: boolean } | null | undefined} usuario
 *   Como está hoy, antes del cambio.
 * @param {{ id: string, rol_id: number, finca_id: string | null, area_id: string | null, activo: boolean }[]} usuarios
 *   Todos los usuarios.
 * @param {object} catalogos
 * @param {{ id: string, nombre: string, novedades_abiertas: number }[]} catalogos.fincas
 * @param {{ id: string, nombre: string }[]} catalogos.areas
 * @returns {string | null} La advertencia, o `null` si alguien más cubre su alcance.
 */
export function advertenciaDeAlcance(usuario, usuarios, { fincas, areas }) {
  // Quien ya está inactivo no atiende nada.
  if (!usuario?.activo) return null

  const hayOtro = (campo) =>
    usuarios.some(
      (otro) =>
        otro.id !== usuario.id &&
        otro.activo &&
        otro.rol_id === usuario.rol_id &&
        otro[campo] === usuario[campo],
    )

  if (usuario.rol_id === ROL.APROBADOR_AREA) {
    const area = areas.find(({ id }) => id === usuario.area_id)
    if (!area || hayOtro('area_id')) return null
    return `Es el único aprobador activo de ${area.nombre}: sus novedades quedarán sin quien las atienda.`
  }

  if (usuario.rol_id === ROL.REPORTANTE) {
    const finca = fincas.find(({ id }) => id === usuario.finca_id)
    // Sin novedades abiertas no hay cierre que confirmar.
    if (!finca || finca.novedades_abiertas === 0 || hayOtro('finca_id')) return null
    const abiertas =
      finca.novedades_abiertas === 1
        ? '1 novedad abierta'
        : `${finca.novedades_abiertas} novedades abiertas`
    return `Es el único reportante activo de ${finca.nombre}, que tiene ${abiertas}: nadie podrá confirmar su cierre.`
  }

  return null
}
