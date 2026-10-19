import { supabase } from '../cliente.js'

/*
 * Repositorio de las suscripciones push del dispositivo (RF-31; SDD 5.3.5). La RLS solo deja ver
 * y cambiar las propias.
 */

/**
 * Guarda la suscripción del navegador a nombre del usuario. Si ese punto de entrega ya era suyo,
 * actualiza sus claves; si es de otra persona del dispositivo, la RLS lo rechaza.
 *
 * @param {string} usuarioId
 * @param {{ endpoint: string, keys: { p256dh: string, auth: string } }} suscripcion `toJSON()`
 *   de la `PushSubscription`.
 */
export async function guardarSuscripcion(usuarioId, { endpoint, keys }) {
  const { error } = await supabase
    .from('suscripcion_push')
    .upsert(
      { usuario_id: usuarioId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
      { onConflict: 'endpoint' },
    )
  if (error) throw error
}

/** @param {string} endpoint */
export async function borrarSuscripcion(endpoint) {
  const { error } = await supabase.from('suscripcion_push').delete().eq('endpoint', endpoint)
  if (error) throw error
}
