/**
 * Una página de una lista que ya está completa en el navegador (pantallas 28, 30 y 32: decenas
 * de filas, que se filtran y se buscan aquí).
 *
 * Si la lista se acortó (un filtro, una fila que salió) y la página pedida ya no existe, entrega
 * la última que sí: la pantalla no se queda en una página vacía.
 *
 * @template T
 * @param {T[]} lista
 * @param {number} pagina Empieza en 0.
 * @param {number} porPagina
 * @returns {{ pagina: number, ultima: number, desde: number, visibles: T[] }} `desde` es la
 *   posición del primer elemento visible, empezando en 0.
 */
export function paginar(lista, pagina, porPagina) {
  const ultima = Math.max(0, Math.ceil(lista.length / porPagina) - 1)
  const vigente = Math.min(Math.max(0, pagina), ultima)
  const desde = vigente * porPagina
  return { pagina: vigente, ultima, desde, visibles: lista.slice(desde, desde + porPagina) }
}

/**
 * Las páginas con número (Figma 21): la primera, la última y las vecinas de la actual; `null`
 * es un «…». Si entre dos queda una sola, va su número en lugar del «…».
 *
 * @param {number} pagina Empieza en 0.
 * @param {number} ultima
 * @returns {(number | null)[]}
 */
export function paginasVisibles(pagina, ultima) {
  const numeros = [...new Set([0, pagina - 1, pagina, pagina + 1, ultima])]
    .filter((numero) => numero >= 0 && numero <= ultima)
    .sort((a, b) => a - b)
  return numeros.flatMap((numero, i) => {
    const salto = i === 0 ? 1 : numero - numeros[i - 1]
    if (salto === 2) return [numero - 1, numero]
    return salto > 2 ? [null, numero] : [numero]
  })
}
