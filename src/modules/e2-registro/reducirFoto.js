import { FOTO_CALIDAD_JPEG } from '../../core/config/parametros.js'
import { cabeEnElLimite, esImagen, medidasDeDestino } from './medidasDeFoto.js'

/*
 * Reduce una foto en el navegador antes de subirla (RF-08, RNF-05; plan del Sprint 4, decisión
 * 22): respeta la orientación de la cámara, deja el lado mayor en 1600 px y la recodifica a
 * JPEG. Se carga bajo demanda, solo cuando la persona elige una foto.
 */

/** La foto no se puede usar: no es una imagen, el navegador no la abre o pesa demasiado (05-D). */
export class FotoInvalida extends Error {
  name = 'FotoInvalida'
}

/**
 * @param {File} archivo
 * @returns {Promise<Blob>} Un JPEG que cabe en el bucket.
 */
export async function reducirFoto(archivo) {
  if (!esImagen(archivo)) throw new FotoInvalida()
  let mapa
  try {
    mapa = await createImageBitmap(archivo, { imageOrientation: 'from-image' })
  } catch {
    // HEIC en Chrome, un archivo dañado…: el navegador no lo puede abrir.
    throw new FotoInvalida()
  }
  const { ancho, alto } = medidasDeDestino(mapa.width, mapa.height)
  const lienzo = document.createElement('canvas')
  lienzo.width = ancho
  lienzo.height = alto
  lienzo.getContext('2d')?.drawImage(mapa, 0, 0, ancho, alto)
  mapa.close()
  const foto = await new Promise((resolver) =>
    lienzo.toBlob(resolver, 'image/jpeg', FOTO_CALIDAD_JPEG),
  )
  if (!foto || !cabeEnElLimite(foto.size)) throw new FotoInvalida()
  return foto
}
