import { supabase } from '../cliente.js'

/*
 * Fincas, para el administrador (RF-04 / CU-04, pantalla 30). Las crea y las edita
 * directamente en la tabla, con las políticas del Sprint 1: no hay funciones. Una finca no se
 * borra: se desactiva.
 */

/**
 * @typedef {object} Finca Fila de `v_finca`.
 * @property {string} id
 * @property {string} nombre
 * @property {boolean} activo
 * @property {string} razon_social_id
 * @property {string} razon_social Nombre de la razón social.
 * @property {number} novedades_abiertas Las que no están cerradas ni rechazadas.
 * @property {number} reportantes_activos
 */

/** Columnas de `v_finca` que usa la lista: solo las necesarias (RNF-06). */
const COLUMNAS =
  'id, nombre, activo, razon_social_id, razon_social, novedades_abiertas, reportantes_activos'

/** La restricción `finca_razon_social_nombre_unico` (CU-04 6a). */
const VIOLACION_DE_UNICIDAD = '23505'

/**
 * El error de una escritura, con el nombre repetido convertido en un código que el traductor
 * de errores conoce.
 *
 * @param {{ code?: string }} error
 */
const convertir = (error) =>
  error.code === VIOLACION_DE_UNICIDAD ? new Error('FINCA_EXISTENTE') : error

/**
 * Todas las fincas, activas e inactivas, con su razón social y sus conteos. Son decenas de
 * filas: la búsqueda, los filtros y las páginas se resuelven en el navegador.
 *
 * @returns {Promise<Finca[]>}
 */
export async function listarFincasConConteos() {
  const { data, error } = await supabase
    .from('v_finca')
    .select(COLUMNAS)
    .order('nombre')
    .order('razon_social')
  if (error) throw error
  return data
}

/**
 * Razones sociales activas, por nombre: las opciones del filtro y del formulario. Es un
 * catálogo precargado; la aplicación no lo edita.
 *
 * @returns {Promise<{ id: string, nombre: string }[]>}
 */
export async function listarRazonesSociales() {
  const { data, error } = await supabase
    .from('razon_social')
    .select('id, nombre')
    .eq('activo', true)
    .order('nombre')
  if (error) throw error
  return data
}

/**
 * Crea una finca, que queda activa.
 *
 * @param {{ nombre: string, razonSocialId: string }} finca
 * @returns {Promise<{ id: string }>}
 */
export async function crearFinca({ nombre, razonSocialId }) {
  const { data, error } = await supabase
    .from('finca')
    .insert({ nombre: nombre.trim(), razon_social_id: razonSocialId })
    .select('id')
    .single()
  if (error) throw convertir(error)
  return data
}

/**
 * Cambia el nombre, la razón social o el estado de una finca. Solo se envía lo que llega.
 *
 * @param {string} id
 * @param {{ nombre?: string, razonSocialId?: string, activo?: boolean }} cambios
 * @returns {Promise<{ id: string }>}
 */
export async function actualizarFinca(id, { nombre, razonSocialId, activo }) {
  const cambios = {}
  if (nombre !== undefined) cambios.nombre = nombre.trim()
  if (razonSocialId !== undefined) cambios.razon_social_id = razonSocialId
  if (activo !== undefined) cambios.activo = activo

  const { data, error } = await supabase
    .from('finca')
    .update(cambios)
    .eq('id', id)
    .select('id')
    .maybeSingle()
  if (error) throw convertir(error)
  // La política de actualización no falla: deja la consulta sin filas. Pasa si quien la hace
  // ya no es un administrador activo.
  if (!data) throw new Error('SIN_PERMISO')
  return data
}
