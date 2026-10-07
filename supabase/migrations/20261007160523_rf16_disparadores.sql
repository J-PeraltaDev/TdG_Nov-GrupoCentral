-- RF-16 (Sprint 1): historial inmutable (RNF-12) y fecha de última actualización.
-- Fuente: SDD 6.1.3, «Protección del historial».

-- Ni siquiera el propietario de la tabla o una función con privilegios elevados puede
-- alterar o borrar un registro del historial.
create function private.tg_historial_inmutable()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'HISTORIAL_INMUTABLE'
    using errcode = 'P0001',
          detail = 'historial_transicion solo admite inserciones (RNF-12).';
end;
$$;

revoke execute on function private.tg_historial_inmutable() from public, anon, authenticated;

create trigger historial_transicion_sin_cambios
  before update or delete on public.historial_transicion
  for each row execute function private.tg_historial_inmutable();

create trigger historial_transicion_sin_truncate
  before truncate on public.historial_transicion
  for each statement execute function private.tg_historial_inmutable();

-- actualizado_en de la novedad: momento de su último cambio.
create function private.tg_novedad_actualizado_en()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.actualizado_en := now();
  return new;
end;
$$;

revoke execute on function private.tg_novedad_actualizado_en() from public, anon, authenticated;

create trigger novedad_actualizado_en
  before update on public.novedad
  for each row execute function private.tg_novedad_actualizado_en();
