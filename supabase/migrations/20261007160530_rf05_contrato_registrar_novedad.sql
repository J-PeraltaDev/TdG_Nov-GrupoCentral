-- RF-05 (Sprint 1): contrato de registrar_novedad (SDD, Tabla 21).
-- Publica la firma para que el cliente avance mientras se implementa el servidor. Por ahora
-- lanza NO_IMPLEMENTADO; el cuerpo llega en la migración rf05_registrar_novedad.

create function public.registrar_novedad(
  p_id_local uuid,
  p_descripcion text,
  p_prioridad public.prioridad_novedad,
  p_area_id uuid,
  p_fecha_registro timestamptz
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

comment on function public.registrar_novedad(uuid, text, public.prioridad_novedad, uuid, timestamptz) is
  'Registra una novedad del reportante autenticado y la enruta a su área (RF-05, RF-06, RF-07, RF-16). Idempotente por p_id_local.';

revoke execute on function
  public.registrar_novedad(uuid, text, public.prioridad_novedad, uuid, timestamptz)
from public, anon;

grant execute on function
  public.registrar_novedad(uuid, text, public.prioridad_novedad, uuid, timestamptz)
to authenticated;
