// Entrada de Deno de enviar-push (SDD 5.3.5). Solo arma las dependencias reales; la lógica está
// en manejar.js, que se prueba con Vitest (docs/adr/0012). La llama el webhook de la base de
// datos, no una persona: no hay sesión (verify_jwt = false) y la verifica el secreto del
// encabezado x-webhook-secreto.
import { createClient } from '@supabase/supabase-js'
import { atender } from '../_shared/servir.js'
import { manejar } from './manejar.js'

// La plataforma inyecta SUPABASE_URL y SUPABASE_SECRET_KEYS; los otros los pone
// `npm run staging:secretos` (o una persona, en «PROYECTO»). Ninguno está en el repositorio.
const url = Deno.env.get('SUPABASE_URL')!
const claveSecreta = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')!)['default']
const secreto = Deno.env.get('ENVIAR_PUSH_SECRETO') ?? ''
const vapid = {
  sujeto: Deno.env.get('VAPID_SUBJECT') ?? '',
  publica: Deno.env.get('VAPID_PUBLIC_KEY') ?? '',
  privada: Deno.env.get('VAPID_PRIVATE_KEY') ?? '',
}

const admin = createClient(url, claveSecreta, {
  auth: { persistSession: false, autoRefreshToken: false },
})

type Aviso = { novedad_id: string; destinatario_id: string }

/** La novedad del aviso, el rol del destinatario y sus suscripciones. */
async function leerDestino(aviso: Aviso) {
  const [novedad, usuario, suscripciones] = await Promise.all([
    admin
      .from('novedad')
      .select('codigo, prioridad, finca(nombre), area(nombre), tipo_falla(nombre)')
      .eq('id', aviso.novedad_id)
      .single(),
    admin.from('usuario').select('rol_id').eq('id', aviso.destinatario_id).single(),
    admin
      .from('suscripcion_push')
      .select('id, endpoint, p256dh, auth')
      .eq('usuario_id', aviso.destinatario_id),
  ])
  const error = novedad.error ?? usuario.error ?? suscripciones.error
  if (error) throw error
  if (!usuario.data) throw new Error('DESTINATARIO_INEXISTENTE')
  const n = novedad.data as Record<string, any>
  return {
    novedad: {
      codigo: n.codigo,
      prioridad: n.prioridad,
      finca: n.finca?.nombre,
      area: n.area?.nombre,
      tipo_falla: n.tipo_falla?.nombre ?? null,
    },
    rol_id: usuario.data.rol_id,
    suscripciones: suscripciones.data ?? [],
  }
}

Deno.serve((peticion) =>
  atender(peticion, (cuerpo) =>
    manejar(cuerpo, {
      secreto,
      secretoRecibido: peticion.headers.get('x-webhook-secreto'),
      vapid,
      leerDestino,
      async enviar(destino: string, opciones: RequestInit) {
        const respuesta = await fetch(destino, opciones)
        await respuesta.body?.cancel()
        return respuesta.status
      },
      async borrarSuscripcion(id: string) {
        const { error } = await admin.from('suscripcion_push').delete().eq('id', id)
        if (error) throw error
      },
      registrar: (mensaje: string) => console.error(mensaje),
    }),
  ),
)
