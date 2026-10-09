import { supabase } from '../cliente.js'

/*
 * Repositorio de novedades (C-03, SDD 4.2.3). Aísla al resto del cliente de los detalles de
 * Supabase: las pantallas no llaman a `supabase` directamente.
 */

/** @typedef {import('../database.types').Database} Database */
/** @typedef {Database['public']['Tables']['novedad']['Row']} Novedad */
/** @typedef {Database['public']['Enums']['estado_novedad']} EstadoNovedad */

/** Columnas de `v_novedad` que usa la lista (RF-18): solo las necesarias (RNF-06). */
const COLUMNAS_DE_LA_LISTA = 'id, codigo, descripcion, prioridad, estado, area, fecha_registro'

/** Tamaño de página de las listas. */
export const NOVEDADES_POR_PAGINA = 20

/**
 * Registra una novedad (RF-05). El servidor le asigna el código, la enruta a su área y deja
 * el historial y los avisos (RF-06, RF-07, RF-16). Es idempotente por `id_local` (RNF-08):
 * repetir el envío devuelve la misma novedad.
 *
 * @param {object} datos
 * @param {string} datos.id_local Generado en el dispositivo antes del primer envío.
 * @param {string} datos.descripcion
 * @param {Database['public']['Enums']['prioridad_novedad']} datos.prioridad
 * @param {string} datos.area_id
 * @param {string} datos.fecha_registro Fecha y hora reales del registro (ISO 8601).
 * @returns {Promise<Novedad>} Lanza el error de Supabase si falla.
 */
export async function registrarNovedad({
  id_local,
  descripcion,
  prioridad,
  area_id,
  fecha_registro,
}) {
  const { data, error } = await supabase.rpc('registrar_novedad', {
    p_id_local: id_local,
    p_descripcion: descripcion,
    p_prioridad: prioridad,
    p_area_id: area_id,
    p_fecha_registro: fecha_registro,
  })
  if (error) throw error
  return data
}

/*
 * Transiciones de atención (SDD, Tabla 21 y 6.1.3). El cliente no escribe en `novedad`: cada
 * cambio de estado es una función del servidor, que verifica el rol y el alcance, deja el
 * historial y crea los avisos. Todas devuelven la novedad actualizada y lanzan el error de
 * Supabase si fallan; el mensaje del error es un código de la Tabla 22 (`core/errores`).
 */

/**
 * Toma para atención una novedad asignada al área del aprobador (RF-10).
 *
 * @param {string} novedadId
 * @returns {Promise<Novedad>}
 */
export async function tomarNovedad(novedadId) {
  const { data, error } = await supabase.rpc('tomar_novedad', { p_novedad_id: novedadId })
  if (error) throw error
  return data
}

/**
 * Rechaza una novedad del área del aprobador. Es un estado final (RF-11).
 *
 * @param {string} novedadId
 * @param {string} motivo Obligatorio.
 * @returns {Promise<Novedad>}
 */
export async function rechazarNovedad(novedadId, motivo) {
  const { data, error } = await supabase.rpc('rechazar_novedad', {
    p_novedad_id: novedadId,
    p_motivo: motivo,
  })
  if (error) throw error
  return data
}

/**
 * Reasigna la novedad a otra área. Después de esto sale del alcance del aprobador (RF-17).
 *
 * @param {string} novedadId
 * @param {string} areaDestinoId Activa y distinta de la actual.
 * @param {string} motivo Obligatorio.
 * @returns {Promise<Novedad>}
 */
export async function reasignarNovedad(novedadId, areaDestinoId, motivo) {
  const { data, error } = await supabase.rpc('reasignar_novedad', {
    p_novedad_id: novedadId,
    p_area_destino_id: areaDestinoId,
    p_motivo: motivo,
  })
  if (error) throw error
  return data
}

/**
 * Escala la novedad al director de agricultura (RF-12).
 *
 * @param {string} novedadId
 * @param {string} justificacion Obligatoria.
 * @returns {Promise<Novedad>}
 */
export async function escalarNovedad(novedadId, justificacion) {
  const { data, error } = await supabase.rpc('escalar_novedad', {
    p_novedad_id: novedadId,
    p_justificacion: justificacion,
  })
  if (error) throw error
  return data
}

/**
 * Registra la solución aplicada y clasifica la novedad por tipo de falla (RF-14). El tipo va
 * por su `id` si ya existe, o por su nombre si es nuevo: el servidor lo normaliza y no crea
 * duplicados (SDD 6.1.8).
 *
 * @param {string} novedadId
 * @param {object} datos
 * @param {string} datos.solucion
 * @param {string} datos.fecha_ejecucion Fecha sin hora (`2026-09-24`), no posterior a hoy.
 * @param {string} [datos.tipo_falla_id] Un tipo existente.
 * @param {string} [datos.tipo_falla_nombre] El nombre de un tipo, cuando no se eligió uno.
 * @returns {Promise<Novedad>}
 */
export async function registrarSolucion(
  novedadId,
  { solucion, fecha_ejecucion, tipo_falla_id, tipo_falla_nombre },
) {
  const { data, error } = await supabase.rpc('registrar_solucion', {
    p_novedad_id: novedadId,
    p_solucion: solucion,
    p_fecha_ejecucion: fecha_ejecucion,
    ...(tipo_falla_id
      ? { p_tipo_falla_id: tipo_falla_id }
      : { p_tipo_falla_nombre: tipo_falla_nombre }),
  })
  if (error) throw error
  return data
}

/**
 * Página de novedades del alcance del usuario, de la más reciente a la más antigua. Las
 * políticas de la base de datos limitan el resultado: el reportante solo recibe las de su
 * finca (RNF-11).
 *
 * @param {object} opciones
 * @param {EstadoNovedad[]} opciones.estados
 * @param {number} [opciones.pagina] Empieza en 0.
 * @returns {Promise<{ novedades: object[], total: number }>}
 */
export async function listarNovedades({ estados, pagina = 0 }) {
  const desde = pagina * NOVEDADES_POR_PAGINA
  const { data, error, count } = await supabase
    .from('v_novedad')
    .select(COLUMNAS_DE_LA_LISTA, { count: 'exact' })
    .in('estado', estados)
    .order('fecha_registro', { ascending: false })
    .range(desde, desde + NOVEDADES_POR_PAGINA - 1)
  if (error) throw error
  return { novedades: data, total: count ?? data.length }
}

/**
 * Cantidad de novedades del alcance del usuario en esos estados.
 *
 * @param {EstadoNovedad[]} estados
 */
export async function contarNovedades(estados) {
  const { count, error } = await supabase
    .from('v_novedad')
    .select('id', { count: 'exact', head: true })
    .in('estado', estados)
  if (error) throw error
  return count ?? 0
}

/*
 * Bandeja del área (RF-09, SDD 6.1.11).
 */

/** Columnas de `v_novedad` que usa la bandeja: solo las necesarias (RNF-06). */
const COLUMNAS_DE_LA_BANDEJA =
  'id, codigo, descripcion, prioridad, estado, area_id, area, finca_id, finca, fecha_registro'

/**
 * @typedef {object} FiltroDeBandeja
 * @property {string} areaId Área del aprobador. Las políticas ya limitan el resultado a su
 *   área (RNF-11); filtrarla aquí hace que la consulta use el índice de la bandeja.
 * @property {EstadoNovedad[]} estados
 * @property {string | null} [fincaId] Solo las novedades de esa finca.
 */

/** @param {FiltroDeBandeja} filtro */
function consultarBandeja(columnas, opciones, { areaId, estados, fincaId }) {
  const consulta = supabase
    .from('v_novedad')
    .select(columnas, opciones)
    .eq('area_id', areaId)
    .in('estado', estados)
  return fincaId ? consulta.eq('finca_id', fincaId) : consulta
}

/**
 * Página de la bandeja del área: por prioridad (crítico, alto, normal, bajo: el orden del
 * tipo `prioridad_novedad`) y, dentro de cada una, de la más antigua a la más reciente.
 *
 * @param {FiltroDeBandeja & { pagina?: number }} opciones `pagina` empieza en 0.
 * @returns {Promise<{ novedades: object[], total: number }>}
 */
export async function listarBandeja({ pagina = 0, ...filtro }) {
  const desde = pagina * NOVEDADES_POR_PAGINA
  const { data, error, count } = await consultarBandeja(
    COLUMNAS_DE_LA_BANDEJA,
    { count: 'exact' },
    filtro,
  )
    .order('prioridad', { ascending: true })
    .order('fecha_registro', { ascending: true })
    // Desempate estable: sin él, dos novedades con la misma fecha podrían repetirse o
    // perderse entre una página y la siguiente.
    .order('codigo', { ascending: true })
    .range(desde, desde + NOVEDADES_POR_PAGINA - 1)
  if (error) throw error
  return { novedades: data, total: count ?? data.length }
}

/**
 * Cantidad de novedades de la bandeja en esos estados (los conteos de las pestañas).
 *
 * @param {FiltroDeBandeja} filtro
 */
export async function contarBandeja(filtro) {
  const { count, error } = await consultarBandeja('id', { count: 'exact', head: true }, filtro)
  if (error) throw error
  return count ?? 0
}

/**
 * Transiciones que explican cómo llegó cada novedad a la bandeja: asignaciones (con el área
 * anterior, si fue una reasignación), escalamientos y aprobaciones del director, en orden.
 * Los nombres de las personas salen de `usuario_publico`; nunca se pide el correo (ADR 0010).
 *
 * @param {string[]} novedadIds Las de la página que se está viendo.
 * @returns {Promise<object[]>}
 */
export async function listarTransicionesDeBandeja(novedadIds) {
  if (novedadIds.length === 0) return []
  const { data, error } = await supabase
    .from('historial_transicion')
    .select(
      'id, novedad_id, estado_nuevo, observacion, fecha_hora, ' +
        'area_anterior:area!historial_transicion_area_anterior_id_fkey(nombre), ' +
        'usuario:usuario_publico!historial_transicion_usuario_id_fkey(nombre)',
    )
    .in('novedad_id', novedadIds)
    .in('estado_nuevo', ['asignada', 'escalada', 'aprobada'])
    .order('id', { ascending: true })
  if (error) throw error
  return data
}
