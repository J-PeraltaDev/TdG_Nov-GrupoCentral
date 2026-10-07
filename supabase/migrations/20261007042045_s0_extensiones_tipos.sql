-- Sprint 0 (RNF-14, RNF-17): extensiones, esquema privado y tipos enumerados.
-- Fuente: SDD 6.1.1 (tipos enumerados) y 6.1.4 (funciones auxiliares fuera de la API).

-- Extensiones -----------------------------------------------------------------
-- Van en el esquema extensions, no en public. No se fija la versión: desde
-- 2026-08-05 Supabase ignora la cláusula VERSION e instala la versión por defecto.
create extension if not exists unaccent with schema extensions; -- RF-14: nombre_normalizado de tipo_falla (Sprint 2)
create extension if not exists pg_net with schema extensions; -- RF-31: webhook de notificaciones (Sprint 5)

-- Esquema privado --------------------------------------------------------------
-- Aloja las funciones auxiliares de las políticas (fn_rol, fn_finca, fn_area,
-- fn_activo, puede_ver_novedad). No se expone en la API de datos: no figura en
-- [api].schemas de config.toml ni en los esquemas expuestos del proyecto remoto.
create schema if not exists private;

comment on schema private is
  'Funciones auxiliares de RLS y de las funciones de transición. No se expone en la API de datos.';

revoke all on schema private from public;
revoke all on schema private from anon;

-- Tipos enumerados (SDD 6.1.1) -----------------------------------------------------
-- El estado «pendiente de sincronizar» no está en el dominio: solo existe en el dispositivo.
create type public.estado_novedad as enum (
  'registrada',
  'asignada',
  'en_atencion',
  'escalada',
  'aprobada',
  'rechazada',
  'resuelta',
  'cerrada'
);

comment on type public.estado_novedad is
  'Estados de la novedad en el servidor (SDD, Tabla 28). rechazada y cerrada son finales.';

-- El orden de declaración es el orden de la bandeja del área (RF-09): no reordenar.
create type public.prioridad_novedad as enum (
  'critico',
  'alto',
  'normal',
  'bajo'
);

comment on type public.prioridad_novedad is
  'Prioridad de la novedad. El orden natural del tipo es el de la bandeja (RF-09).';

create type public.accion_auditoria as enum (
  'renombrar',
  'fusionar',
  'desactivar'
);

comment on type public.accion_auditoria is
  'Acciones del administrador sobre el catálogo de tipos de falla (RF-32).';
