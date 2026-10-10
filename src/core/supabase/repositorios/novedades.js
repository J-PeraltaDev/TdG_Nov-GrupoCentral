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
 * El director aprueba o rechaza una novedad escalada (RF-13). Aprobada, vuelve al área para
 * ejecutar la solución; rechazada, queda cerrada.
 *
 * @param {string} novedadId
 * @param {boolean} aprobar
 * @param {string | null} [observacion] Opcional al aprobar, obligatoria al rechazar.
 * @returns {Promise<Novedad>}
 */
export async function decidirEscalamiento(novedadId, aprobar, observacion = null) {
  const { data, error } = await supabase.rpc('decidir_escalamiento', {
    p_novedad_id: novedadId,
    p_aprobar: aprobar,
    p_observacion: observacion,
  })
  if (error) throw error
  return data
}

/**
 * Un reportante de la finca confirma que la novedad quedó resuelta. Queda cerrada, que es un
 * estado final (RF-15).
 *
 * @param {string} novedadId
 * @param {string | null} [observacion] Opcional.
 * @returns {Promise<Novedad>}
 */
export async function confirmarResolucion(novedadId, observacion = null) {
  const { data, error } = await supabase.rpc('confirmar_resolucion', {
    p_novedad_id: novedadId,
    p_observacion: observacion,
  })
  if (error) throw error
  return data
}

/**
 * Un reportante de la finca indica que la falla persiste: la novedad vuelve a estar en
 * atención (RF-15).
 *
 * @param {string} novedadId
 * @param {string} observacion Obligatoria: qué sigue fallando.
 * @returns {Promise<Novedad>}
 */
export async function reportarFallaPersiste(novedadId, observacion) {
  const { data, error } = await supabase.rpc('reportar_falla_persiste', {
    p_novedad_id: novedadId,
    p_observacion: observacion,
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

/*
 * Novedades escaladas, para el director de agricultura (RF-13, pantalla 19).
 */

/** Columnas de `v_novedad` que usa la lista de escaladas: solo las necesarias (RNF-06). */
const COLUMNAS_DE_LAS_ESCALADAS =
  'id, codigo, descripcion, prioridad, estado, area_id, area, finca_id, finca, fecha_registro'

/**
 * Página de las novedades que esperan la decisión del director: por prioridad y, dentro de
 * cada una, de la más antigua a la más reciente, como la bandeja del área.
 *
 * @param {{ pagina?: number }} [opciones] `pagina` empieza en 0.
 * @returns {Promise<{ novedades: object[], total: number }>}
 */
export async function listarEscaladas({ pagina = 0 } = {}) {
  const desde = pagina * NOVEDADES_POR_PAGINA
  const { data, error, count } = await supabase
    .from('v_novedad')
    .select(COLUMNAS_DE_LAS_ESCALADAS, { count: 'exact' })
    .eq('estado', 'escalada')
    .order('prioridad', { ascending: true })
    .order('fecha_registro', { ascending: true })
    .order('codigo', { ascending: true })
    .range(desde, desde + NOVEDADES_POR_PAGINA - 1)
  if (error) throw error
  return { novedades: data, total: count ?? data.length }
}

/**
 * Los escalamientos de esas novedades, en orden: la justificación, cuándo y quién escaló
 * (nombre, rol y área, de `usuario_publico`; nunca el correo, ADR 0010).
 *
 * @param {string[]} novedadIds Las de la página que se está viendo.
 * @returns {Promise<object[]>}
 */
export async function listarEscalamientos(novedadIds) {
  if (novedadIds.length === 0) return []
  const { data, error } = await supabase
    .from('historial_transicion')
    .select(
      'id, novedad_id, observacion, fecha_hora, ' +
        'usuario:usuario_publico!historial_transicion_usuario_id_fkey(nombre, rol_id, area)',
    )
    .in('novedad_id', novedadIds)
    .eq('estado_nuevo', 'escalada')
    .order('id', { ascending: true })
  if (error) throw error
  return data
}

/**
 * Cuántas novedades escaladas aprobó y cuántas rechazó un director desde una fecha (los dos
 * contadores «este mes» de la pantalla 19). Se cuentan en el historial, que es donde queda
 * quién decidió.
 *
 * @param {string} usuarioId El director.
 * @param {string} desde Instante ISO 8601 desde el que se cuenta.
 * @returns {Promise<{ aprobadas: number, rechazadas: number }>}
 */
export async function contarDecisionesDelMes(usuarioId, desde) {
  const contar = async (estado) => {
    const { count, error } = await supabase
      .from('historial_transicion')
      .select('id', { count: 'exact', head: true })
      .eq('usuario_id', usuarioId)
      .eq('estado_anterior', 'escalada')
      .eq('estado_nuevo', estado)
      .gte('fecha_hora', desde)
    if (error) throw error
    return count ?? 0
  }
  const [aprobadas, rechazadas] = await Promise.all([contar('aprobada'), contar('rechazada')])
  return { aprobadas, rechazadas }
}

/*
 * Detalle y línea de tiempo de una novedad (RF-18).
 */

/** Columnas de `v_novedad` que muestra el detalle. */
const COLUMNAS_DEL_DETALLE =
  'id, codigo, descripcion, prioridad, estado, solucion, fecha_ejecucion, fecha_registro, ' +
  'fecha_sincronizacion, finca_id, finca, razon_social, area_id, area, tipo_falla, reportante'

/**
 * Una novedad por su `id`, o `null` si no existe o está fuera del alcance de quien consulta:
 * en los dos casos la base de datos responde sin filas (SDD 6.1.4) y la interfaz muestra la
 * pantalla 22-B.
 *
 * @param {string} id uuid de la novedad.
 * @returns {Promise<object | null>}
 */
export async function obtenerNovedad(id) {
  const { data, error } = await supabase
    .from('v_novedad')
    .select(COLUMNAS_DEL_DETALLE)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}

/**
 * Transiciones de una novedad, de la más reciente a la más antigua, con el nombre de las
 * áreas y el nombre, el rol y el área de quien hizo cada una. Los datos de las personas salen
 * de `usuario_publico`; nunca se pide el correo (ADR 0010).
 *
 * @param {string} novedadId
 * @returns {Promise<import('../../ui/LineaDeTiempo.jsx').Transicion[]>}
 */
export async function listarLineaDeTiempo(novedadId) {
  const { data, error } = await supabase
    .from('historial_transicion')
    .select(
      'id, estado_anterior, estado_nuevo, observacion, fecha_hora, ' +
        'area_anterior:area!historial_transicion_area_anterior_id_fkey(nombre), ' +
        'area_nueva:area!historial_transicion_area_nueva_id_fkey(nombre), ' +
        'usuario:usuario_publico!historial_transicion_usuario_id_fkey(nombre, rol_id, area)',
    )
    .eq('novedad_id', novedadId)
    .order('id', { ascending: false })
  if (error) throw error
  return data
}
