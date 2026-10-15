import { estaEnLinea } from '../../conexion/monitor.js'
import { esErrorDeRed } from '../../errores/traducir.js'

/**
 * Lee del servidor y guarda lo leído; si no hay conexión, o la red falla en el camino, lee del
 * dispositivo (RF-24). Sin conexión no se intenta el servidor: la API reintenta una lectura
 * fallida durante unos 7 s.
 *
 * @template T
 * @param {() => Promise<T>} delServidor
 * @param {(resultado: T) => Promise<unknown>} guardar Si falla, la lectura sigue sirviendo.
 * @param {() => Promise<T>} delDispositivo Lanza `SinDescarga` si no hay nada guardado.
 * @returns {Promise<T>}
 */
export async function conRespaldo(delServidor, guardar, delDispositivo) {
  if (estaEnLinea()) {
    try {
      const resultado = await delServidor()
      await guardar(resultado).catch(() => {})
      return resultado
    } catch (error) {
      if (!esErrorDeRed(error)) throw error
    }
  }
  return delDispositivo()
}
