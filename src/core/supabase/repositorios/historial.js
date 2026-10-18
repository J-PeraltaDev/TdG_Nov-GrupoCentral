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
 * Una página del historial con los filtros puestos, de la más reciente a la más antigua (por
 * `fecha_registro` y, en un empate, por `id`), y cuántas hay en total.
 *
 * @param {FiltroDelHistorial} filtro `desde` y `hasta` son días de Colombia, inclusivos.
 * @param {number} [pagina] Empieza en 0.
 * @returns {Promise<{ novedades: object[], total: number }>}
 */
export async function listarHistorial({ finca, area, estados, desde, hasta, tipo }, pagina = 0) {
  let consulta = supabase.from('v_novedad').select(COLUMNAS_DEL_HISTORIAL, { count: 'exact' })
  if (finca) consulta = consulta.eq('finca_id', finca)
  if (area) consulta = consulta.eq('area_id', area)
  if (estados.length > 0) consulta = consulta.in('estado', estados)
  if (desde) consulta = consulta.gte('fecha_registro', comienzoDelDia(desde))
  if (hasta) consulta = consulta.lt('fecha_registro', comienzoDelDia(diaSiguiente(hasta)))
  if (tipo) consulta = consulta.eq('tipo_falla_id', tipo)
  const inicio = pagina * NOVEDADES_POR_PAGINA
  const { data, error, count } = await consulta
    .order('fecha_registro', { ascending: false })
    // Desempate estable: sin él, dos novedades con la misma fecha podrían repetirse o perderse
    // entre una página y la siguiente.
    .order('id', { ascending: false })
    .range(inicio, inicio + NOVEDADES_POR_PAGINA - 1)
  // PGRST103: la página pedida ya no existe (una dirección vieja, o menos novedades que antes).
  if (error?.code === 'PGRST103') return { novedades: [], total: 0 }
  if (error) throw error
  return { novedades: data, total: count ?? data.length }
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
