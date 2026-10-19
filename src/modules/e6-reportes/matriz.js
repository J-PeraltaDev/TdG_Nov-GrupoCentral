/*
 * La matriz finca por tipo de falla (RF-29, Figma 26 y 27; plan del Sprint 5, decisión 22).
 * `rpt_recurrencia` devuelve las celdas que no son cero; aquí se ordenan, se recortan a siete
 * fincas («Otras N fincas» suma las demás) y se eligen las combinaciones más repetidas.
 */

/** @typedef {{ finca_id: string, finca: string, tipo_falla_id: string, tipo_falla: string, cantidad: number }} Celda */
/** @typedef {{ id: string, nombre: string, total: number, cantidades: Record<string, number> }} Fila */

const FILAS_A_LA_VISTA = 7

/** De mayor a menor total y, en un empate, por nombre. */
const porTotal = (a, b) => b.total - a.total || a.nombre.localeCompare(b.nombre, 'es')

/** Suma las cantidades de varias filas. */
function sumar(filas) {
  const cantidades = {}
  for (const fila of filas) {
    for (const [tipo, cantidad] of Object.entries(fila.cantidades)) {
      cantidades[tipo] = (cantidades[tipo] ?? 0) + cantidad
    }
  }
  return cantidades
}

/**
 * Filas, columnas, «Otras N fincas» y totales de la matriz. Las cantidades que faltan son cero.
 *
 * @param {Celda[]} celdas
 */
export function armarMatriz(celdas) {
  const fincas = new Map()
  const tipos = new Map()
  for (const { finca_id, finca, tipo_falla_id, tipo_falla, cantidad } of celdas) {
    if (!fincas.has(finca_id))
      fincas.set(finca_id, { id: finca_id, nombre: finca, total: 0, cantidades: {} })
    if (!tipos.has(tipo_falla_id))
      tipos.set(tipo_falla_id, { id: tipo_falla_id, nombre: tipo_falla, total: 0 })
    const fila = fincas.get(finca_id)
    fila.cantidades[tipo_falla_id] = cantidad
    fila.total += cantidad
    tipos.get(tipo_falla_id).total += cantidad
  }
  const columnas = [...tipos.values()].sort(porTotal)
  const ordenadas = [...fincas.values()]
    .map((fila) => ({
      ...fila,
      cantidades: Object.fromEntries(columnas.map(({ id }) => [id, fila.cantidades[id] ?? 0])),
    }))
    .sort(porTotal)
  const resto = ordenadas.slice(FILAS_A_LA_VISTA)
  const otras = resto.length
    ? {
        fincas: resto,
        total: resto.reduce((suma, fila) => suma + fila.total, 0),
        cantidades: sumar(resto),
      }
    : null
  return {
    columnas,
    filas: ordenadas.slice(0, FILAS_A_LA_VISTA),
    otras,
    total: columnas.reduce((suma, columna) => suma + columna.total, 0),
    // La celda más grande de una finca: el último paso de color.
    mayor: Math.max(0, ...celdas.map((celda) => celda.cantidad)),
  }
}

/**
 * El paso de color de una celda (Figma 26: de «Menos» a «Más», cinco), o 0 si está vacía.
 *
 * @param {number} cantidad
 * @param {number} mayor La celda más grande.
 */
export function pasoDeColor(cantidad, mayor) {
  if (cantidad <= 0) return 0
  return Math.min(5, Math.ceil((cantidad / mayor) * 5))
}

/**
 * Las combinaciones finca × tipo más repetidas: cinco en el escritorio y tres en el teléfono.
 *
 * @param {Celda[]} celdas
 * @param {number} cuantas
 */
export function combinaciones(celdas, cuantas) {
  return [...celdas]
    .sort(
      (a, b) =>
        b.cantidad - a.cantidad ||
        a.finca.localeCompare(b.finca, 'es') ||
        a.tipo_falla.localeCompare(b.tipo_falla, 'es'),
    )
    .slice(0, cuantas)
}
