import { ROL } from '../sesion/roles.js'

/*
 * Mapa de acciones (C-02, SDD 6.1.11, Tabla 35): qué puede hacer cada rol sobre una novedad
 * según su estado. Es el reflejo en la interfaz de la máquina de estados del servidor
 * (Tabla 29): sirve para pintar solo los botones que tienen sentido, no para autorizar. Quien
 * decide es la base de datos (RNF-11).
 */

/** Acciones del detalle de una novedad. */
export const ACCION = Object.freeze({
  ADJUNTAR_FOTO: 'adjuntar_foto',
  TOMAR: 'tomar',
  REASIGNAR: 'reasignar',
  RECHAZAR: 'rechazar',
  REGISTRAR_SOLUCION: 'registrar_solucion',
  ESCALAR: 'escalar',
  APROBAR: 'aprobar',
  RECHAZAR_ESCALAMIENTO: 'rechazar_escalamiento',
  CONFIRMAR_CIERRE: 'confirmar_cierre',
  FALLA_PERSISTE: 'falla_persiste',
  CORREGIR_TIPO_FALLA: 'corregir_tipo_falla',
})

/** @typedef {typeof ACCION[keyof typeof ACCION]} Accion */

const NINGUNA = Object.freeze([])

/**
 * La Tabla 35, fila por fila, en el orden en que se presentan las acciones. «Registrada» no
 * aparece en la tabla: es transitorio, porque el enrutamiento ocurre en la misma transacción.
 *
 * @type {Record<string, Partial<Record<number, readonly Accion[]>>>}
 */
const TABLA_35 = {
  registrada: {},
  asignada: {
    [ROL.REPORTANTE]: [ACCION.ADJUNTAR_FOTO],
    [ROL.APROBADOR_AREA]: [ACCION.TOMAR, ACCION.REASIGNAR, ACCION.RECHAZAR],
  },
  en_atencion: {
    [ROL.REPORTANTE]: [ACCION.ADJUNTAR_FOTO],
    [ROL.APROBADOR_AREA]: [
      ACCION.REGISTRAR_SOLUCION,
      ACCION.ESCALAR,
      ACCION.REASIGNAR,
      ACCION.RECHAZAR,
    ],
  },
  escalada: {
    [ROL.REPORTANTE]: [ACCION.ADJUNTAR_FOTO],
    [ROL.DIRECTOR_AGRICULTURA]: [ACCION.APROBAR, ACCION.RECHAZAR_ESCALAMIENTO],
  },
  aprobada: {
    [ROL.REPORTANTE]: [ACCION.ADJUNTAR_FOTO],
    [ROL.APROBADOR_AREA]: [ACCION.REGISTRAR_SOLUCION],
  },
  resuelta: {
    [ROL.REPORTANTE]: [ACCION.CONFIRMAR_CIERRE, ACCION.FALLA_PERSISTE, ACCION.ADJUNTAR_FOTO],
  },
  cerrada: {
    [ROL.ADMINISTRADOR]: [ACCION.CORREGIR_TIPO_FALLA],
  },
  rechazada: {},
}

/**
 * Alcance de cada rol sobre una novedad: el reportante, las de su finca; el aprobador, las de
 * su área; el director y el administrador, todas (SDD 6.1.4).
 */
function estaEnSuAlcance(perfil, novedad) {
  if (perfil.rol_id === ROL.REPORTANTE) return novedad.finca_id === perfil.finca_id
  if (perfil.rol_id === ROL.APROBADOR_AREA) return novedad.area_id === perfil.area_id
  return perfil.rol_id === ROL.DIRECTOR_AGRICULTURA || perfil.rol_id === ROL.ADMINISTRADOR
}

/**
 * Acciones que el usuario puede ejecutar sobre la novedad en su estado vigente, en el orden
 * de la Tabla 35. Una lista vacía significa que solo puede consultarla.
 *
 * @param {import('../sesion/sesion.js').Perfil | null | undefined} perfil
 * @param {{ estado: string, finca_id: string, area_id: string } | null | undefined} novedad
 * @returns {readonly Accion[]}
 */
export function accionesDisponibles(perfil, novedad) {
  if (!perfil?.activo || !novedad || !estaEnSuAlcance(perfil, novedad)) return NINGUNA
  return TABLA_35[novedad.estado]?.[perfil.rol_id] ?? NINGUNA
}
