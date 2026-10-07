/** Roles fijos del sistema (`rol.id`, SDD Tabla 26). */
export const ROL = Object.freeze({
  REPORTANTE: 1,
  APROBADOR_AREA: 2,
  DIRECTOR_AGRICULTURA: 3,
  ADMINISTRADOR: 4,
})

const NOMBRES = {
  [ROL.REPORTANTE]: 'Reportante',
  [ROL.APROBADOR_AREA]: 'Aprobador',
  [ROL.DIRECTOR_AGRICULTURA]: 'Director de agricultura',
  [ROL.ADMINISTRADOR]: 'Administrador',
}

/** Pantalla de inicio de cada rol (SDD, Tabla 10). */
const INICIO = {
  [ROL.REPORTANTE]: '/novedades',
  [ROL.APROBADOR_AREA]: '/bandeja',
  [ROL.DIRECTOR_AGRICULTURA]: '/escaladas',
  [ROL.ADMINISTRADOR]: '/panel',
}

/** @param {number | null | undefined} rolId */
export function rutaDeInicio(rolId) {
  return INICIO[rolId] ?? '/ingresar'
}

/** @param {number | null | undefined} rolId */
export function nombreDeRol(rolId) {
  return NOMBRES[rolId] ?? ''
}

/**
 * Rol con su alcance, como lo muestra Figma: «Aprobador · Mantenimiento».
 *
 * @param {import('./sesion.js').Perfil} perfil
 */
export function descripcionDelPerfil(perfil) {
  const alcance = perfil.area?.nombre ?? perfil.finca?.nombre
  return alcance ? `${nombreDeRol(perfil.rol_id)} · ${alcance}` : nombreDeRol(perfil.rol_id)
}

/**
 * Iniciales para el avatar: «Carlos Mario Restrepo» → «CR».
 *
 * @param {string} nombre
 */
export function iniciales(nombre) {
  const palabras = nombre.trim().split(/\s+/).filter(Boolean)
  if (palabras.length === 0) return ''
  const primera = palabras[0][0]
  const ultima = palabras.length > 1 ? palabras[palabras.length - 1][0] : ''
  return (primera + ultima).toUpperCase()
}
