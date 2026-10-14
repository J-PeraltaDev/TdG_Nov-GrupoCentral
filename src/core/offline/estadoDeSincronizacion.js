import { useSyncExternalStore } from 'react'

/*
 * Estado de la sincronización de las pendientes (RF-22, RF-23), aparte del sincronizador: el
 * indicador de conexión lo lee en todas las pantallas, también en la de ingreso, y así no carga
 * con el sincronizador ni con el repositorio de novedades (RNF-05).
 */

/**
 * @typedef {object} EstadoDeSincronizacion
 * @property {boolean} enCurso
 * @property {number} total Las que el ciclo intenta enviar.
 * @property {number} hechas Las que el ciclo ya intentó, llegaran o no.
 * @property {string | null} enviando `id_local` de la que se está enviando.
 * @property {Array<object & { codigo: number }>} enviadas Las que llegaron en esta visita (08).
 * @property {boolean} sesionVencida 08-B.
 */

/** @type {EstadoDeSincronizacion} */
let estado = {
  enCurso: false,
  total: 0,
  hechas: 0,
  enviando: null,
  enviadas: [],
  sesionVencida: false,
}
const oyentes = new Set()

/** @param {Partial<EstadoDeSincronizacion>} cambios */
export function cambiarSincronizacion(cambios) {
  estado = { ...estado, ...cambios }
  for (const oyente of oyentes) oyente()
}

export const leerSincronizacion = () => estado

/** @param {() => void} oyente */
export function suscribirSincronizacion(oyente) {
  oyentes.add(oyente)
  return () => oyentes.delete(oyente)
}

/** @returns {EstadoDeSincronizacion} */
export function useSincronizacion() {
  return useSyncExternalStore(suscribirSincronizacion, leerSincronizacion, leerSincronizacion)
}

/** Al salir de 08, las enviadas dejan de mostrarse: ya están en «Mis novedades» con su código. */
export const limpiarEnviadas = () => cambiarSincronizacion({ enviadas: [] })
