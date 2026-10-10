-- RF-10, RF-11, RF-12, RF-14 y RF-17 (Sprint 2): contratos de las funciones de atención.
-- Fuente: SDD 5.3.2, Tabla 21. Publican las firmas para que el cliente avance mientras se
-- implementa el servidor. Por ahora todas lanzan NO_IMPLEMENTADO; el cuerpo de cada una llega
-- en la migración de su historia.
--
-- Todas son security definer porque el cliente no escribe en novedad, historial_transicion ni
-- notificacion (D-02): cada función verificará por sí misma la identidad, el rol y el alcance.

-- Transiciones de estado (SDD 6.1.3) ---------------------------------------------------

create function public.tomar_novedad(p_novedad_id uuid)
returns public.novedad
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'NO_IMPLEMENTADO' using errcode = 'P0001';
end;
$$;

comment on function public.tomar_novedad(uuid) is
  'El aprobador toma para atención una novedad asignada a su área: asignada → en_atencion (RF-10, RF-16).';

create function public.rechazar_novedad(p_novedad_id uuid, p_motivo text)
returns public.novedad
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'NO_IMPLEMENTADO' using errcode = 'P0001';
end;
$$;

comment on function public.rechazar_novedad(uuid, text) is
  'El aprobador rechaza una novedad de su área con un motivo: asignada o en_atencion → rechazada (RF-11, RF-16).';

create function public.reasignar_novedad(
  p_novedad_id uuid,
  p_area_destino_id uuid,
  p_motivo text
)
returns public.novedad
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'NO_IMPLEMENTADO' using errcode = 'P0001';
end;
$$;

comment on function public.reasignar_novedad(uuid, uuid, text) is
  'El aprobador reasigna a otra área una novedad de la suya, con un motivo: asignada o en_atencion → asignada (RF-17, RF-16).';

create function public.escalar_novedad(p_novedad_id uuid, p_justificacion text)
returns public.novedad
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'NO_IMPLEMENTADO' using errcode = 'P0001';
end;
$$;

comment on function public.escalar_novedad(uuid, text) is
  'El aprobador escala al director una novedad de su área, con su justificación: en_atencion → escalada (RF-12, RF-16).';

-- El tipo de falla llega por su id (uno existente) o por su nombre (uno nuevo o uno que se
-- resuelve por el nombre normalizado). Una sola función con los dos parámetros opcionales:
-- con sobrecargas, la API no sabría cuál elegir.
create function public.registrar_solucion(
  p_novedad_id uuid,
  p_solucion text,
  p_fecha_ejecucion date,
  p_tipo_falla_id uuid default null,
  p_tipo_falla_nombre text default null
)
returns public.novedad
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'NO_IMPLEMENTADO' using errcode = 'P0001';
end;
$$;

comment on function public.registrar_solucion(uuid, text, date, uuid, text) is
  'El aprobador registra la solución y el tipo de falla de una novedad de su área: en_atencion o aprobada → resuelta (RF-14, RF-16).';

-- Catálogo de tipos de falla (SDD 6.1.8) -----------------------------------------------

create function public.sugerir_tipos_falla(p_texto text)
returns table (
  id uuid,
  nombre text,
  cantidad_novedades integer,
  coincidencia_exacta boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  raise exception 'NO_IMPLEMENTADO' using errcode = 'P0001';
end;
$$;

comment on function public.sugerir_tipos_falla(text) is
  'Tipos de falla activos que coinciden con el texto, con su cantidad de novedades y la marca de coincidencia exacta (RF-14). Solo aprobador y administrador.';

-- Privilegios ----------------------------------------------------------------------------
-- Postgres concede EXECUTE a PUBLIC en cada función nueva: se revoca y se concede solo a
-- authenticated.

revoke execute on function
  public.tomar_novedad(uuid),
  public.rechazar_novedad(uuid, text),
  public.reasignar_novedad(uuid, uuid, text),
  public.escalar_novedad(uuid, text),
  public.registrar_solucion(uuid, text, date, uuid, text),
  public.sugerir_tipos_falla(text)
from public, anon;

grant execute on function
  public.tomar_novedad(uuid),
  public.rechazar_novedad(uuid, text),
  public.reasignar_novedad(uuid, uuid, text),
  public.escalar_novedad(uuid, text),
  public.registrar_solucion(uuid, text, date, uuid, text),
  public.sugerir_tipos_falla(text)
to authenticated;
