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
    upgrade(bd) {
      const pendientes = bd.createObjectStore('pendientes', { keyPath: 'id_local' })
      pendientes.createIndex('fecha_registro', 'fecha_registro')

      const novedades = bd.createObjectStore('novedades', { keyPath: 'id' })
      novedades.createIndex('estado', 'estado')
      novedades.createIndex('actualizado_en', 'actualizado_en')

      bd.createObjectStore('catalogos')
      bd.createObjectStore('meta')
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

/** Cantidad de novedades pendientes de sincronizar (RF-23). */
export async function contarPendientes() {
  return (await abrir()).count('pendientes')
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
