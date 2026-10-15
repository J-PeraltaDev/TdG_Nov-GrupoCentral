import { FOTO_LADO_MAYOR_PX, FOTO_PESO_MAXIMO_BYTES } from '../../core/config/parametros.js'

/*
 * Las cuentas de la reducción de una foto (RF-08; plan del Sprint 4, decisión 22). Van aparte de
 * la codificación, que necesita el navegador, para probarlas con Vitest.
 */

/** Las fotos sin conexión, con el texto de Figma (05-B); también lo dice 07 (decisión 21). */
export const FOTOS_SIN_RED =
  'Las fotos necesitan conexión. Podrás adjuntarla desde el detalle cuando la novedad se sincronice.'

/**
 * Las medidas a las que se reduce una foto: el lado mayor queda en 1600 px, con la misma
 * proporción. Una foto más pequeña no se agranda.
 *
 * @param {number} ancho
 * @param {number} alto
 * @returns {{ ancho: number, alto: number }}
 */
export function medidasDeDestino(ancho, alto) {
  const escala = Math.min(1, FOTO_LADO_MAYOR_PX / Math.max(ancho, alto))
  return { ancho: Math.round(ancho * escala), alto: Math.round(alto * escala) }
}

/**
 * Si el archivo dice ser una imagen. Que el navegador la pueda abrir se sabe al reducirla.
 *
 * @param {{ type?: string } | null | undefined} archivo
 */
export const esImagen = (archivo) => Boolean(archivo?.type?.startsWith('image/'))

/**
 * Si una foto ya reducida cabe en el límite del bucket (1 MB).
 *
 * @param {number} bytes
 */
export const cabeEnElLimite = (bytes) => bytes > 0 && bytes <= FOTO_PESO_MAXIMO_BYTES

/**
 * «180 KB», como lo escribe Figma bajo la miniatura.
 *
 * @param {number} bytes
 */
export const formatearPeso = (bytes) => `${Math.max(1, Math.round(bytes / 1024))} KB`
