import { supabase } from '../cliente.js'
import { invocarFuncion } from './funciones.js'

/*
 * Repositorio de la recuperación de contraseña mediada por el administrador (RF-02; SDD
 * 6.1.10). Los correos de la plataforma no reciben mensajes: no hay enlaces de recuperación.
 */

/**
 * Registra la solicitud. No exige sesión y responde igual exista o no el correo (CU-02 4a):
 * de aquí no se puede saber si el correo está registrado.
 *
 * @param {string} correo
 * @returns {Promise<void>}
 */
export async function solicitarRecuperacion(correo) {
  const { error } = await supabase.rpc('solicitar_recuperacion', { p_correo: correo })
  if (error) throw error
}

/**
 * Solicitudes de recuperación, de la más reciente a la más antigua. Solo las recibe el
 * administrador. El estado se deriva de `expira_en` y `usado` (SDD 6.1.10); el resumen del
 * código no se puede leer por la API.
 *
 * @returns {Promise<{ id: string, usuario_id: string, expira_en: string | null, usado: boolean, creada_en: string }[]>}
 */
export async function listarSolicitudes() {
  const { data, error } = await supabase
    .from('solicitud_recuperacion')
    .select('id, usuario_id, expira_en, usado, creada_en')
    .order('creada_en', { ascending: false })
  if (error) throw error
  return data
}

/**
 * Genera el código temporal de una solicitud (CU-02, paso 6). Es la única vez que el código
 * sale del servidor: no se guarda ni se registra en el navegador.
 *
 * @param {string} solicitudId
 * @returns {Promise<{ codigo: string, expira_en: string }>}
 */
export async function generarCodigoRecuperacion(solicitudId) {
  const { data, error } = await supabase.rpc('generar_codigo_recuperacion', {
    p_solicitud_id: solicitudId,
  })
  if (error) throw error
  return data[0]
}

/**
 * Fija la contraseña nueva con el código temporal (CU-02, pasos 8 y 9). No exige sesión.
 * Si falla, el mensaje del error es `CODIGO_INVALIDO`, `CODIGO_VENCIDO` o `DATO_OBLIGATORIO`.
 *
 * @param {{ correo: string, codigo: string, contrasena: string }} datos
 * @returns {Promise<void>}
 */
export async function restablecerContrasena(datos) {
  await invocarFuncion('restablecer-contrasena', datos)
}
