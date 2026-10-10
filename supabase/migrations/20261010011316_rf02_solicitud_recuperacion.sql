-- RF-02 (Sprint 3): la tabla solicitud_recuperacion queda lista para el código temporal.
-- Fuente: SDD 6.1.1 (Tabla 26) y 6.1.10, con lo que precisa docs/cambios-sdd.md (entrada 15).
-- Cambia el esquema: una columna, dos restricciones y un índice único parcial.

-- El código se guarda como un resumen con sal (crypt) y se genera con gen_random_bytes: las
-- dos son de pgcrypto. En Supabase ya viene instalada en `extensions`; se declara para que la
-- migración no dependa de eso.
create extension if not exists pgcrypto with schema extensions;

-- Fuerza bruta ---------------------------------------------------------------------------------
-- Un código tiene seis dígitos: un millón de posibilidades. Lo que lo protege no es su resumen,
-- sino que vence a los 30 minutos y que admite cinco intentos fallidos. Sin esta columna no hay
-- cómo contarlos.

alter table public.solicitud_recuperacion
  add column intentos_fallidos smallint not null default 0,
  add constraint solicitud_recuperacion_intentos_validos
    check (intentos_fallidos between 0 and 5),
  -- El resumen y su vencimiento se llenan juntos, cuando el administrador genera el código.
  add constraint solicitud_recuperacion_codigo_con_vencimiento
    check ((codigo_hash is null) = (expira_en is null));

comment on column public.solicitud_recuperacion.intentos_fallidos is
  'Códigos incorrectos que se han probado contra esta solicitud. Al quinto, su código deja de servir (RF-02).';

-- Una sola solicitud pendiente por usuario -----------------------------------------------------
-- solicitar_recuperacion se ejecuta sin sesión: dos peticiones a la vez no deben dejar dos
-- solicitudes del mismo usuario esperando un código.

create unique index solicitud_recuperacion_pendiente_unica
  on public.solicitud_recuperacion (usuario_id)
  where not usado and codigo_hash is null;

-- Cuándo una solicitud sigue abierta -----------------------------------------------------------
-- Abierta: sin usar y, o todavía no tiene código, o su código está vigente (no ha vencido ni
-- agotó los intentos). Con una abierta, pedir otra no crea nada; una que ya no está abierta no
-- se reabre: la persona pide otra desde la pantalla 02.

create function private.solicitud_abierta(p_solicitud public.solicitud_recuperacion)
returns boolean
language sql
stable
set search_path = ''
as $$
  select not p_solicitud.usado
    and (
      p_solicitud.codigo_hash is null
      or (p_solicitud.expira_en > now() and p_solicitud.intentos_fallidos < 5)
    );
$$;

comment on function private.solicitud_abierta(public.solicitud_recuperacion) is
  'Si la solicitud de recuperación sigue abierta: sin usar y, o sin código, o con un código vigente y con intentos (RF-02).';

revoke execute on function private.solicitud_abierta(public.solicitud_recuperacion)
from public, anon, authenticated;

-- Privilegios (regla 4) ------------------------------------------------------------------------
-- El administrador ve los intentos para saber que un código quedó bloqueado. El resumen sigue
-- sin salir por la API: la política de lectura no cambia.

grant select (intentos_fallidos) on public.solicitud_recuperacion to authenticated;
