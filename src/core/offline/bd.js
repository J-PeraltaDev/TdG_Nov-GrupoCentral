import { openDB } from 'idb'

/*
 * Almacenamiento local (C-05, SDD 6.1.5, Tabla 32): los cuatro almacenes de IndexedDB.
 *
 *   pendientes  novedades registradas sin conexión; se conservan al cerrar sesión (Sprint 4)
 *   novedades   última versión descargada de las novedades del usuario (Sprint 4)
 *   catalogos   áreas activas, finca del reportante… Se actualiza al ingresar
 *   meta        perfil del usuario dueño de los datos y fechas de actualización
 *
 * En el Sprint 1 se usan `meta` y `catalogos`. Los datos sin conexión viven aquí, nunca en
 * localStorage ni en la caché del service worker.
 */

export const NOMBRE_BD = 'novedades'
export const VERSION_BD = 1

/** @type {Promise<import('idb').IDBPDatabase> | null} */
let conexion = null

function abrir() {
  conexion ??= openDB(NOMBRE_BD, VERSION_BD, {
    // Regla para toda versión nueva: una actualización nunca borra `pendientes` (RNF-07); son
    // novedades que todavía no existen en el servidor.
    upgrade(bd) {
      const pendientes = bd.createObjectStore('pendientes', { keyPath: 'id_local' })
      pendientes.createIndex('fecha_registro', 'fecha_registro')

      const novedades = bd.createObjectStore('novedades', { keyPath: 'id' })
      novedades.createIndex('estado', 'estado')
      novedades.createIndex('actualizado_en', 'actualizado_en')

      bd.createObjectStore('catalogos')
      bd.createObjectStore('meta')
    },
    // Otra pestaña, o la versión nueva de la aplicación, necesita actualizar la base: esta
    // conexión se cierra para no trabarla, y la próxima lectura abre una nueva.
    blocking() {
      cerrarBd()
    },
  })
  return conexion
}

/** Cierra la conexión (para las pruebas y para borrar la base). */
export async function cerrarBd() {
  if (!conexion) return
  const bd = await conexion
  bd.close()
  conexion = null
}

/** @param {string} clave */
export async function leerMeta(clave) {
  return (await abrir()).get('meta', clave)
}

/**
 * @param {string} clave
 * @param {unknown} valor
 */
export async function guardarMeta(clave, valor) {
  await (await abrir()).put('meta', valor, clave)
}

/** @param {string} nombre */
export async function leerCatalogo(nombre) {
  return (await abrir()).get('catalogos', nombre)
}

/**
 * @param {string} nombre
 * @param {unknown} datos
 */
export async function guardarCatalogo(nombre, datos) {
  await (await abrir()).put('catalogos', datos, nombre)
}

/**
 * Guarda una pendiente y resuelve solo cuando la transacción terminó: la escritura quedó en el
 * dispositivo (RF-21, SDD 6.1.5 «esperar oncomplete»).
 *
 * @param {object} pendiente
 */
export async function guardarPendiente(pendiente) {
  const tx = (await abrir()).transaction('pendientes', 'readwrite')
  await Promise.all([tx.store.put(pendiente), tx.done])
}

/**
 * Pendientes del usuario, en el orden en que se registraron (RF-22).
 *
 * @param {string} reportanteId
 */
export async function listarPendientes(reportanteId) {
  const todas = await (await abrir()).getAllFromIndex('pendientes', 'fecha_registro')
  return todas.filter((p) => p.reportante_id === reportanteId)
}

/** @param {object} pendiente */
export async function actualizarPendiente(pendiente) {
  await (await abrir()).put('pendientes', pendiente)
}

/** @param {string} idLocal */
export async function borrarPendiente(idLocal) {
  await (await abrir()).delete('pendientes', idLocal)
}

/**
 * Cantidad de novedades pendientes de sincronizar del usuario (RF-23). Las de otra persona que
 * usó el dispositivo no se cuentan: solo se envían con su sesión (RNF-10).
 *
 * @param {string | null} reportanteId
 */
export async function contarPendientes(reportanteId) {
  if (!reportanteId) return 0
  const pendientes = await (await abrir()).getAll('pendientes')
  return pendientes.filter((p) => p.reportante_id === reportanteId).length
}

/**
 * Al cerrar la sesión se borran los datos descargados (novedades, catálogos y meta) y se
 * conservan las pendientes, que se envían cuando el mismo usuario vuelva a ingresar
 * (SDD 6.1.5, RNF-07).
 */
export async function borrarDatosDeSesion() {
  const bd = await abrir()
  const tx = bd.transaction(['novedades', 'catalogos', 'meta'], 'readwrite')
  await Promise.all([
    tx.objectStore('novedades').clear(),
    tx.objectStore('catalogos').clear(),
    tx.objectStore('meta').clear(),
    tx.done,
  ])
}
