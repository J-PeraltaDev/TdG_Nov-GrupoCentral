// MARCADOR ESCRITO A MANO (Sprint 0): todavía no se pudo generar porque el equipo de
// desarrollo no tiene Docker para levantar la base local.
//
// Este archivo lo genera `npm run db:types` (supabase gen types typescript --local) y se
// regenera después de cada migración. No lo edites a mano: cuando haya base local, corre el
// comando y reemplaza todo el contenido. Refleja solo la migración s0_extensiones_tipos.

export type Database = {
  public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      accion_auditoria: 'renombrar' | 'fusionar' | 'desactivar'
      estado_novedad:
        | 'registrada'
        | 'asignada'
        | 'en_atencion'
        | 'escalada'
        | 'aprobada'
        | 'rechazada'
        | 'resuelta'
        | 'cerrada'
      prioridad_novedad: 'critico' | 'alto' | 'normal' | 'bajo'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
