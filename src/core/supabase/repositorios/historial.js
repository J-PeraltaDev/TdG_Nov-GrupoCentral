import { supabase } from '../cliente.js'
import { NOVEDADES_POR_PAGINA } from './novedades.js'

/*
 * Historial de novedades (RF-19, pantallas 21 y 21-D) y buscador por código (plan del Sprint 5,
 * decisión 15). Requieren conexión: no se guardan en el dispositivo (decisión 13). El alcance lo
 * ponen las políticas de la base de datos (RNF-11): el aprobador solo recibe las de su área.
 */

/** @typedef {import('../../../modules/e4-consulta/filtrosDelHistorial.js').FiltroDelHistorial} FiltroDelHistorial */

/** Columnas de `v_novedad` que muestran 21 y 21-D: solo las necesarias (RNF-06). */
const COLUMNAS_DEL_HISTORIAL =
  'id, codigo, prioridad, estado, fecha_registro, resuelta_en, finca, area, tipo_falla, reportante'

/** El comienzo de un día de Colombia como instante. Colombia no cambia de hora: siempre UTC−5. */
const comienzoDelDia = (dia) => `${dia}T00:00:00-05:00`

/** El día siguiente a `AAAA-MM-DD`. */
function diaSiguiente(dia) {
  const [anio, mes, numero] = dia.split('-').map(Number)
  return new Date(Date.UTC(anio, mes - 1, numero + 1)).toISOString().slice(0, 10)
}

/**
 * Los filtros del historial sobre una consulta de `v_novedad`, de la más reciente a la más
 * antigua (por `fecha_registro` y, en un empate, por `id`). La página y la exportación filtran
 * y ordenan igual.
 *
 * @param {FiltroDelHistorial} filtro `desde` y `hasta` son días de Colombia, inclusivos.
 */
function filtrar(consulta, { finca, area, estados, desde, hasta, tipo }) {
  if (finca) consulta = consulta.eq('finca_id', finca)
  if (area) consulta = consulta.eq('area_id', area)
  if (estados.length > 0) consulta = consulta.in('estado', estados)
  if (desde) consulta = consulta.gte('fecha_registro', comienzoDelDia(desde))
  if (hasta) consulta = consulta.lt('fecha_registro', comienzoDelDia(diaSiguiente(hasta)))
  if (tipo) consulta = consulta.eq('tipo_falla_id', tipo)
  return (
    consulta
      .order('fecha_registro', { ascending: false })
      // Desempate estable: sin él, dos novedades con la misma fecha podrían repetirse o perderse
      // entre una página y la siguiente.
      .order('id', { ascending: false })
  )
}

/**
 * Una página del historial con los filtros puestos y cuántas hay en total.
 *
 * @param {FiltroDelHistorial} filtro
 * @param {number} [pagina] Empieza en 0.
 * @returns {Promise<{ novedades: object[], total: number }>}
 */
export async function listarHistorial(filtro, pagina = 0) {
  const inicio = pagina * NOVEDADES_POR_PAGINA
  const { data, error, count } = await filtrar(
    supabase.from('v_novedad').select(COLUMNAS_DEL_HISTORIAL, { count: 'exact' }),
    filtro,
  ).range(inicio, inicio + NOVEDADES_POR_PAGINA - 1)
  // PGRST103: la página pedida ya no existe (una dirección vieja, o menos novedades que antes).
  if (error?.code === 'PGRST103') return { novedades: [], total: 0 }
  if (error) throw error
  return { novedades: data, total: count ?? data.length }
}

/** Columnas del CSV (SDD 5.3.8; decisión 17). */
const COLUMNAS_DEL_CSV =
  'codigo, fecha_registro, finca, razon_social, area, prioridad, estado, tipo_falla, ' +
  'fecha_ejecucion, reportante, resuelta_en'

/**
 * Lo más que entrega la API por solicitud: `max_rows` de supabase/config.toml y de cada
 * proyecto. Si se baja, un bloque llegaría «incompleto» antes de tiempo.
 */
export const FILAS_POR_BLOQUE = 1000

/**
 * Todo el resultado con los filtros puestos, para el CSV (RF-20): por bloques de 1000 hasta que
 * llega uno incompleto. Si un bloque falla, lanza el error y no se descarga nada.
 *
 * @param {FiltroDelHistorial} filtro
 * @returns {Promise<object[]>}
 */
export async function listarParaExportar(filtro) {
  const todas = []
  // atajo: range con desplazamiento; con decenas de miles de filas, paginar por cursor.
  for (let inicio = 0; ; inicio += FILAS_POR_BLOQUE) {
    const { data, error } = await filtrar(
      supabase.from('v_novedad').select(COLUMNAS_DEL_CSV),
      filtro,
    ).range(inicio, inicio + FILAS_POR_BLOQUE - 1)
    if (error) throw error
    todas.push(...data)
    if (data.length < FILAS_POR_BLOQUE) return todas
  }
}

/**
 * El `id` de la novedad con ese código, o `null` si no existe o está fuera del alcance de quien
 * busca: la base de datos responde igual en los dos casos, y la interfaz también (como 22-B).
 *
 * @param {number} codigo
 * @returns {Promise<string | null>}
 */
export async function buscarPorCodigo(codigo) {
  const { data, error } = await supabase
    .from('v_novedad')
    .select('id')
    .eq('codigo', codigo)
    .maybeSingle()
  if (error) throw error
  return data?.id ?? null
}

/** Activas primero y por nombre: las inactivas también tienen historia. */
async function listarCatalogo(tabla) {
  const { data, error } = await supabase
    .from(tabla)
    .select('id, nombre, activo')
    .order('activo', { ascending: false })
    .order('nombre')
  if (error) throw error
  return data
}

/**
 * Las opciones de los filtros (decisión 9): fincas y áreas activas e inactivas, y los tipos de
 * falla activos y desactivados. Un tipo fusionado queda inactivo y sin novedades (pasaron al
 * destino): no se ofrece, porque no encontraría nada.
 *
 * @returns {Promise<import('../../../modules/e4-consulta/filtrosDelHistorial.js').OpcionesDelHistorial>}
 */
export async function listarOpcionesDelHistorial() {
  const [fincas, areas, tipos] = await Promise.all([
    listarCatalogo('finca'),
    listarCatalogo('area'),
    supabase
      .from('tipo_falla')
      .select('id, nombre, activo, novedad(count)')
      .order('activo', { ascending: false })
      .order('nombre')
      .then(({ data, error }) => {
        if (error) throw error
        return data
          .filter((tipo) => tipo.activo || tipo.novedad[0]?.count > 0)
          .map(({ id, nombre, activo }) => ({ id, nombre, activo }))
      }),
  ])
  return { fincas, areas, tipos }
}
