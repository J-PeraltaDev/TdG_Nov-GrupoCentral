export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      area: {
        Row: {
          activo: boolean
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      auditoria_tipo_falla: {
        Row: {
          accion: Database["public"]["Enums"]["accion_auditoria"]
          fecha: string
          id: string
          tipo_destino_id: string | null
          tipo_falla_id: string
          usuario_id: string
          valor_anterior: string | null
        }
        Insert: {
          accion: Database["public"]["Enums"]["accion_auditoria"]
          fecha?: string
          id?: string
          tipo_destino_id?: string | null
          tipo_falla_id: string
          usuario_id: string
          valor_anterior?: string | null
        }
        Update: {
          accion?: Database["public"]["Enums"]["accion_auditoria"]
          fecha?: string
          id?: string
          tipo_destino_id?: string | null
          tipo_falla_id?: string
          usuario_id?: string
          valor_anterior?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auditoria_tipo_falla_tipo_destino_id_fkey"
            columns: ["tipo_destino_id"]
            isOneToOne: false
            referencedRelation: "tipo_falla"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auditoria_tipo_falla_tipo_falla_id_fkey"
            columns: ["tipo_falla_id"]
            isOneToOne: false
            referencedRelation: "tipo_falla"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auditoria_tipo_falla_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auditoria_tipo_falla_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuario_publico"
            referencedColumns: ["id"]
          },
        ]
      }
      evidencia: {
        Row: {
          id: string
          novedad_id: string
          ruta_storage: string
          subida_en: string
          subida_por: string
          tamano_bytes: number
        }
        Insert: {
          id?: string
          novedad_id: string
          ruta_storage: string
          subida_en?: string
          subida_por: string
          tamano_bytes: number
        }
        Update: {
          id?: string
          novedad_id?: string
          ruta_storage?: string
          subida_en?: string
          subida_por?: string
          tamano_bytes?: number
        }
        Relationships: [
          {
            foreignKeyName: "evidencia_novedad_id_fkey"
            columns: ["novedad_id"]
            isOneToOne: false
            referencedRelation: "novedad"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidencia_novedad_id_fkey"
            columns: ["novedad_id"]
            isOneToOne: false
            referencedRelation: "v_novedad"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidencia_subida_por_fkey"
            columns: ["subida_por"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidencia_subida_por_fkey"
            columns: ["subida_por"]
            isOneToOne: false
            referencedRelation: "usuario_publico"
            referencedColumns: ["id"]
          },
        ]
      }
      finca: {
        Row: {
          activo: boolean
          creado_en: string
          id: string
          nombre: string
          razon_social_id: string
        }
        Insert: {
          activo?: boolean
          creado_en?: string
          id?: string
          nombre: string
          razon_social_id: string
        }
        Update: {
          activo?: boolean
          creado_en?: string
          id?: string
          nombre?: string
          razon_social_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finca_razon_social_id_fkey"
            columns: ["razon_social_id"]
            isOneToOne: false
            referencedRelation: "razon_social"
            referencedColumns: ["id"]
          },
        ]
      }
      historial_transicion: {
        Row: {
          area_anterior_id: string | null
          area_nueva_id: string | null
          estado_anterior: Database["public"]["Enums"]["estado_novedad"] | null
          estado_nuevo: Database["public"]["Enums"]["estado_novedad"]
          fecha_hora: string
          id: number
          novedad_id: string
          observacion: string | null
          usuario_id: string
        }
        Insert: {
          area_anterior_id?: string | null
          area_nueva_id?: string | null
          estado_anterior?: Database["public"]["Enums"]["estado_novedad"] | null
          estado_nuevo: Database["public"]["Enums"]["estado_novedad"]
          fecha_hora?: string
          id?: never
          novedad_id: string
          observacion?: string | null
          usuario_id: string
        }
        Update: {
          area_anterior_id?: string | null
          area_nueva_id?: string | null
          estado_anterior?: Database["public"]["Enums"]["estado_novedad"] | null
          estado_nuevo?: Database["public"]["Enums"]["estado_novedad"]
          fecha_hora?: string
          id?: never
          novedad_id?: string
          observacion?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "historial_transicion_area_anterior_id_fkey"
            columns: ["area_anterior_id"]
            isOneToOne: false
            referencedRelation: "area"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historial_transicion_area_nueva_id_fkey"
            columns: ["area_nueva_id"]
            isOneToOne: false
            referencedRelation: "area"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historial_transicion_novedad_id_fkey"
            columns: ["novedad_id"]
            isOneToOne: false
            referencedRelation: "novedad"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historial_transicion_novedad_id_fkey"
            columns: ["novedad_id"]
            isOneToOne: false
            referencedRelation: "v_novedad"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historial_transicion_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historial_transicion_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuario_publico"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacion: {
        Row: {
          creada_en: string
          destinatario_id: string
          estado_nuevo: Database["public"]["Enums"]["estado_novedad"]
          id: string
          leida: boolean
          leida_en: string | null
          novedad_id: string
        }
        Insert: {
          creada_en?: string
          destinatario_id: string
          estado_nuevo: Database["public"]["Enums"]["estado_novedad"]
          id?: string
          leida?: boolean
          leida_en?: string | null
          novedad_id: string
        }
        Update: {
          creada_en?: string
          destinatario_id?: string
          estado_nuevo?: Database["public"]["Enums"]["estado_novedad"]
          id?: string
          leida?: boolean
          leida_en?: string | null
          novedad_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacion_destinatario_id_fkey"
            columns: ["destinatario_id"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacion_destinatario_id_fkey"
            columns: ["destinatario_id"]
            isOneToOne: false
            referencedRelation: "usuario_publico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacion_novedad_id_fkey"
            columns: ["novedad_id"]
            isOneToOne: false
            referencedRelation: "novedad"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacion_novedad_id_fkey"
            columns: ["novedad_id"]
            isOneToOne: false
            referencedRelation: "v_novedad"
            referencedColumns: ["id"]
          },
        ]
      }
      novedad: {
        Row: {
          actualizado_en: string
          area_id: string
          codigo: number
          descripcion: string
          estado: Database["public"]["Enums"]["estado_novedad"]
          fecha_ejecucion: string | null
          fecha_registro: string
          fecha_sincronizacion: string
          finca_id: string
          id: string
          id_local: string
          prioridad: Database["public"]["Enums"]["prioridad_novedad"]
          reportante_id: string
          solucion: string | null
          tipo_falla_id: string | null
        }
        Insert: {
          actualizado_en?: string
          area_id: string
          codigo?: never
          descripcion: string
          estado?: Database["public"]["Enums"]["estado_novedad"]
          fecha_ejecucion?: string | null
          fecha_registro: string
          fecha_sincronizacion?: string
          finca_id: string
          id?: string
          id_local: string
          prioridad: Database["public"]["Enums"]["prioridad_novedad"]
          reportante_id: string
          solucion?: string | null
          tipo_falla_id?: string | null
        }
        Update: {
          actualizado_en?: string
          area_id?: string
          codigo?: never
          descripcion?: string
          estado?: Database["public"]["Enums"]["estado_novedad"]
          fecha_ejecucion?: string | null
          fecha_registro?: string
          fecha_sincronizacion?: string
          finca_id?: string
          id?: string
          id_local?: string
          prioridad?: Database["public"]["Enums"]["prioridad_novedad"]
          reportante_id?: string
          solucion?: string | null
          tipo_falla_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "novedad_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "area"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "novedad_finca_id_fkey"
            columns: ["finca_id"]
            isOneToOne: false
            referencedRelation: "finca"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "novedad_finca_id_fkey"
            columns: ["finca_id"]
            isOneToOne: false
            referencedRelation: "v_finca"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "novedad_reportante_id_fkey"
            columns: ["reportante_id"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "novedad_reportante_id_fkey"
            columns: ["reportante_id"]
            isOneToOne: false
            referencedRelation: "usuario_publico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "novedad_tipo_falla_id_fkey"
            columns: ["tipo_falla_id"]
            isOneToOne: false
            referencedRelation: "tipo_falla"
            referencedColumns: ["id"]
          },
        ]
      }
      razon_social: {
        Row: {
          activo: boolean
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      rol: {
        Row: {
          id: number
          nombre: string
        }
        Insert: {
          id: number
          nombre: string
        }
        Update: {
          id?: number
          nombre?: string
        }
        Relationships: []
      }
      solicitud_recuperacion: {
        Row: {
          codigo_hash: string | null
          creada_en: string
          expira_en: string | null
          id: string
          intentos_fallidos: number
          usado: boolean
          usuario_id: string
        }
        Insert: {
          codigo_hash?: string | null
          creada_en?: string
          expira_en?: string | null
          id?: string
          intentos_fallidos?: number
          usado?: boolean
          usuario_id: string
        }
        Update: {
          codigo_hash?: string | null
          creada_en?: string
          expira_en?: string | null
          id?: string
          intentos_fallidos?: number
          usado?: boolean
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitud_recuperacion_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitud_recuperacion_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuario_publico"
            referencedColumns: ["id"]
          },
        ]
      }
      suscripcion_push: {
        Row: {
          auth: string
          creada_en: string
          endpoint: string
          id: string
          p256dh: string
          usuario_id: string
        }
        Insert: {
          auth: string
          creada_en?: string
          endpoint: string
          id?: string
          p256dh: string
          usuario_id: string
        }
        Update: {
          auth?: string
          creada_en?: string
          endpoint?: string
          id?: string
          p256dh?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suscripcion_push_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suscripcion_push_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuario_publico"
            referencedColumns: ["id"]
          },
        ]
      }
      tipo_falla: {
        Row: {
          activo: boolean
          creado_en: string
          creado_por: string
          id: string
          nombre: string
          nombre_normalizado: string
        }
        Insert: {
          activo?: boolean
          creado_en?: string
          creado_por: string
          id?: string
          nombre: string
          nombre_normalizado: string
        }
        Update: {
          activo?: boolean
          creado_en?: string
          creado_por?: string
          id?: string
          nombre?: string
          nombre_normalizado?: string
        }
        Relationships: [
          {
            foreignKeyName: "tipo_falla_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tipo_falla_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "usuario_publico"
            referencedColumns: ["id"]
          },
        ]
      }
      usuario: {
        Row: {
          activo: boolean
          area_id: string | null
          correo: string
          creado_en: string
          finca_id: string | null
          id: string
          nombre: string
          rol_id: number
        }
        Insert: {
          activo?: boolean
          area_id?: string | null
          correo: string
          creado_en?: string
          finca_id?: string | null
          id: string
          nombre: string
          rol_id: number
        }
        Update: {
          activo?: boolean
          area_id?: string | null
          correo?: string
          creado_en?: string
          finca_id?: string | null
          id?: string
          nombre?: string
          rol_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "usuario_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "area"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuario_finca_id_fkey"
            columns: ["finca_id"]
            isOneToOne: false
            referencedRelation: "finca"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuario_finca_id_fkey"
            columns: ["finca_id"]
            isOneToOne: false
            referencedRelation: "v_finca"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuario_rol_id_fkey"
            columns: ["rol_id"]
            isOneToOne: false
            referencedRelation: "rol"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      usuario_publico: {
        Row: {
          area: string | null
          area_id: string | null
          id: string | null
          nombre: string | null
          rol: string | null
          rol_id: number | null
        }
        Relationships: [
          {
            foreignKeyName: "usuario_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "area"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuario_rol_id_fkey"
            columns: ["rol_id"]
            isOneToOne: false
            referencedRelation: "rol"
            referencedColumns: ["id"]
          },
        ]
      }
      v_finca: {
        Row: {
          activo: boolean | null
          creado_en: string | null
          id: string | null
          nombre: string | null
          novedades_abiertas: number | null
          razon_social: string | null
          razon_social_id: string | null
          reportantes_activos: number | null
        }
        Relationships: [
          {
            foreignKeyName: "finca_razon_social_id_fkey"
            columns: ["razon_social_id"]
            isOneToOne: false
            referencedRelation: "razon_social"
            referencedColumns: ["id"]
          },
        ]
      }
      v_novedad: {
        Row: {
          actualizado_en: string | null
          area: string | null
          area_id: string | null
          codigo: number | null
          descripcion: string | null
          estado: Database["public"]["Enums"]["estado_novedad"] | null
          fecha_ejecucion: string | null
          fecha_registro: string | null
          fecha_sincronizacion: string | null
          finca: string | null
          finca_id: string | null
          id: string | null
          id_local: string | null
          prioridad: Database["public"]["Enums"]["prioridad_novedad"] | null
          razon_social: string | null
          razon_social_id: string | null
          reportante: string | null
          reportante_id: string | null
          solucion: string | null
          tipo_falla: string | null
          tipo_falla_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finca_razon_social_id_fkey"
            columns: ["razon_social_id"]
            isOneToOne: false
            referencedRelation: "razon_social"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "novedad_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "area"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "novedad_finca_id_fkey"
            columns: ["finca_id"]
            isOneToOne: false
            referencedRelation: "finca"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "novedad_finca_id_fkey"
            columns: ["finca_id"]
            isOneToOne: false
            referencedRelation: "v_finca"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "novedad_reportante_id_fkey"
            columns: ["reportante_id"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "novedad_reportante_id_fkey"
            columns: ["reportante_id"]
            isOneToOne: false
            referencedRelation: "usuario_publico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "novedad_tipo_falla_id_fkey"
            columns: ["tipo_falla_id"]
            isOneToOne: false
            referencedRelation: "tipo_falla"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      confirmar_resolucion: {
        Args: { p_novedad_id: string; p_observacion?: string }
        Returns: {
          actualizado_en: string
          area_id: string
          codigo: number
          descripcion: string
          estado: Database["public"]["Enums"]["estado_novedad"]
          fecha_ejecucion: string | null
          fecha_registro: string
          fecha_sincronizacion: string
          finca_id: string
          id: string
          id_local: string
          prioridad: Database["public"]["Enums"]["prioridad_novedad"]
          reportante_id: string
          solucion: string | null
          tipo_falla_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "novedad"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      consumir_codigo_recuperacion: {
        Args: { p_codigo: string; p_correo: string }
        Returns: {
          resultado: string
          usuario_id: string
        }[]
      }
      decidir_escalamiento: {
        Args: {
          p_aprobar: boolean
          p_novedad_id: string
          p_observacion?: string
        }
        Returns: {
          actualizado_en: string
          area_id: string
          codigo: number
          descripcion: string
          estado: Database["public"]["Enums"]["estado_novedad"]
          fecha_ejecucion: string | null
          fecha_registro: string
          fecha_sincronizacion: string
          finca_id: string
          id: string
          id_local: string
          prioridad: Database["public"]["Enums"]["prioridad_novedad"]
          reportante_id: string
          solucion: string | null
          tipo_falla_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "novedad"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      escalar_novedad: {
        Args: { p_justificacion: string; p_novedad_id: string }
        Returns: {
          actualizado_en: string
          area_id: string
          codigo: number
          descripcion: string
          estado: Database["public"]["Enums"]["estado_novedad"]
          fecha_ejecucion: string | null
          fecha_registro: string
          fecha_sincronizacion: string
          finca_id: string
          id: string
          id_local: string
          prioridad: Database["public"]["Enums"]["prioridad_novedad"]
          reportante_id: string
          solucion: string | null
          tipo_falla_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "novedad"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      generar_codigo_recuperacion: {
        Args: { p_solicitud_id: string }
        Returns: {
          codigo: string
          expira_en: string
        }[]
      }
      listar_usuarios: {
        Args: never
        Returns: {
          activo: boolean
          area_id: string
          correo: string
          creado_en: string
          finca_id: string
          id: string
          nombre: string
          rol_id: number
          ultimo_ingreso: string
        }[]
      }
      reasignar_novedad: {
        Args: {
          p_area_destino_id: string
          p_motivo: string
          p_novedad_id: string
        }
        Returns: {
          actualizado_en: string
          area_id: string
          codigo: number
          descripcion: string
          estado: Database["public"]["Enums"]["estado_novedad"]
          fecha_ejecucion: string | null
          fecha_registro: string
          fecha_sincronizacion: string
          finca_id: string
          id: string
          id_local: string
          prioridad: Database["public"]["Enums"]["prioridad_novedad"]
          reportante_id: string
          solucion: string | null
          tipo_falla_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "novedad"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      rechazar_novedad: {
        Args: { p_motivo: string; p_novedad_id: string }
        Returns: {
          actualizado_en: string
          area_id: string
          codigo: number
          descripcion: string
          estado: Database["public"]["Enums"]["estado_novedad"]
          fecha_ejecucion: string | null
          fecha_registro: string
          fecha_sincronizacion: string
          finca_id: string
          id: string
          id_local: string
          prioridad: Database["public"]["Enums"]["prioridad_novedad"]
          reportante_id: string
          solucion: string | null
          tipo_falla_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "novedad"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      registrar_novedad: {
        Args: {
          p_area_id: string
          p_descripcion: string
          p_fecha_registro: string
          p_id_local: string
          p_prioridad: Database["public"]["Enums"]["prioridad_novedad"]
        }
        Returns: {
          actualizado_en: string
          area_id: string
          codigo: number
          descripcion: string
          estado: Database["public"]["Enums"]["estado_novedad"]
          fecha_ejecucion: string | null
          fecha_registro: string
          fecha_sincronizacion: string
          finca_id: string
          id: string
          id_local: string
          prioridad: Database["public"]["Enums"]["prioridad_novedad"]
          reportante_id: string
          solucion: string | null
          tipo_falla_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "novedad"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      registrar_solucion: {
        Args: {
          p_fecha_ejecucion: string
          p_novedad_id: string
          p_solucion: string
          p_tipo_falla_id?: string
          p_tipo_falla_nombre?: string
        }
        Returns: {
          actualizado_en: string
          area_id: string
          codigo: number
          descripcion: string
          estado: Database["public"]["Enums"]["estado_novedad"]
          fecha_ejecucion: string | null
          fecha_registro: string
          fecha_sincronizacion: string
          finca_id: string
          id: string
          id_local: string
          prioridad: Database["public"]["Enums"]["prioridad_novedad"]
          reportante_id: string
          solucion: string | null
          tipo_falla_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "novedad"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      reportar_falla_persiste: {
        Args: { p_novedad_id: string; p_observacion: string }
        Returns: {
          actualizado_en: string
          area_id: string
          codigo: number
          descripcion: string
          estado: Database["public"]["Enums"]["estado_novedad"]
          fecha_ejecucion: string | null
          fecha_registro: string
          fecha_sincronizacion: string
          finca_id: string
          id: string
          id_local: string
          prioridad: Database["public"]["Enums"]["prioridad_novedad"]
          reportante_id: string
          solucion: string | null
          tipo_falla_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "novedad"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      solicitar_recuperacion: { Args: { p_correo: string }; Returns: undefined }
      sugerir_tipos_falla: {
        Args: { p_texto: string }
        Returns: {
          cantidad_novedades: number
          coincidencia_exacta: boolean
          id: string
          nombre: string
        }[]
      }
      tomar_novedad: {
        Args: { p_novedad_id: string }
        Returns: {
          actualizado_en: string
          area_id: string
          codigo: number
          descripcion: string
          estado: Database["public"]["Enums"]["estado_novedad"]
          fecha_ejecucion: string | null
          fecha_registro: string
          fecha_sincronizacion: string
          finca_id: string
          id: string
          id_local: string
          prioridad: Database["public"]["Enums"]["prioridad_novedad"]
          reportante_id: string
          solucion: string | null
          tipo_falla_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "novedad"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      accion_auditoria: "renombrar" | "fusionar" | "desactivar"
      estado_novedad:
        | "registrada"
        | "asignada"
        | "en_atencion"
        | "escalada"
        | "aprobada"
        | "rechazada"
        | "resuelta"
        | "cerrada"
      prioridad_novedad: "critico" | "alto" | "normal" | "bajo"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      accion_auditoria: ["renombrar", "fusionar", "desactivar"],
      estado_novedad: [
        "registrada",
        "asignada",
        "en_atencion",
        "escalada",
        "aprobada",
        "rechazada",
        "resuelta",
        "cerrada",
      ],
      prioridad_novedad: ["critico", "alto", "normal", "bajo"],
    },
  },
} as const
