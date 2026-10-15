-- RF-08 (Sprint 4, a pedido del equipo): el aprobador del área adjunta fotos de la solución.
-- Fuente: cambio 23 de docs/cambios-sdd.md (SRS RF-08, CU-08 y CU-14; SDD Tablas 26, 31 y 35).
--
-- Cada foto de la solución queda atada a su intento: la transición «→ resuelta» que la registró.
-- Si la falla persiste y se resuelve otra vez, las fotos del intento anterior siguen con el suyo
-- y no se mezclan con las de la solución nueva. Las fotos del reporte no tienen transición.

alter table public.evidencia
  add column transicion_id bigint references public.historial_transicion (id);

comment on column public.evidencia.transicion_id is
  'RF-08: nula en las fotos del reporte; en las de la solución, la transición → resuelta del intento. La pone el disparador.';

create index evidencia_transicion_id_idx on public.evidencia (transicion_id);

-- El intento de solución vigente de una novedad: su última transición a resuelta. Corre con
-- los permisos de quien la llama: el historial que no puede leer no cuenta.
create function private.solucion_vigente(p_novedad_id uuid)
returns bigint
language sql
stable
set search_path = ''
as $$
  select max(h.id)
  from public.historial_transicion h
  where h.novedad_id = p_novedad_id
    and h.estado_nuevo = 'resuelta';
$$;

revoke execute on function private.solucion_vigente(uuid) from public, anon;
-- La política de subida del aprobador se evalúa con su rol: necesita ejecutarla.
grant execute on function private.solucion_vigente(uuid) to authenticated;

-- Políticas de storage.objects ------------------------------------------------------------

-- El máximo del reportante cuenta solo las fotos del reporte: las de la solución van aparte.
drop policy evidencias_subida_reportante on storage.objects;

create policy evidencias_subida_reportante on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'evidencias'
    and (select private.fn_rol()) = 1
    and exists (
      select 1
      from public.novedad n
      where n.id = private.novedad_de_la_ruta(objects.name)
        and n.finca_id = (select private.fn_finca())
        and n.estado not in ('cerrada', 'rechazada')
    )
    and (
      select count(*)
      from public.evidencia e
      where e.novedad_id = private.novedad_de_la_ruta(objects.name)
        and e.transicion_id is null
    ) < 3
  );

-- Sube el aprobador del área a una novedad resuelta (la solución está registrada y la finca
-- todavía no la confirma), hasta 3 fotos por intento de solución.
create policy evidencias_subida_aprobador on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'evidencias'
    and (select private.fn_rol()) = 2
    and exists (
      select 1
      from public.novedad n
      where n.id = private.novedad_de_la_ruta(objects.name)
        and n.area_id = (select private.fn_area())
        and n.estado = 'resuelta'
    )
    and (
      select count(*)
      from public.evidencia e
      where e.novedad_id = private.novedad_de_la_ruta(objects.name)
        and e.transicion_id = private.solucion_vigente(private.novedad_de_la_ruta(objects.name))
    ) < 3
  );

-- Política de inserción de `evidencia` para el aprobador del área (Tabla 31) ----------------

create policy evidencia_insercion_aprobador on public.evidencia
  for insert to authenticated
  with check (
    subida_por = (select auth.uid())
    and (select private.fn_rol()) = 2
    and exists (
      select 1
      from public.novedad n
      where n.id = evidencia.novedad_id
        and n.area_id = (select private.fn_area())
    )
  );

-- El disparador de `evidencia`, con los dos casos ------------------------------------------

create or replace function private.tg_evidencia_valida()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_novedad public.novedad%rowtype;
  v_rol smallint := private.fn_rol();
  v_tamano integer;
begin
  -- Dos fotos de la misma novedad a la vez se ordenan aquí: la cuenta de abajo es segura.
  select n.* into v_novedad
  from public.novedad n
  where n.id = new.novedad_id
  for update;

  if not found then
    raise exception 'SIN_PERMISO' using errcode = 'P0001';
  end if;

  if v_rol = 1 then
    -- La foto del reporte: el reportante de la finca, mientras la novedad no sea final.
    if v_novedad.finca_id is distinct from (select private.fn_finca()) then
      raise exception 'SIN_PERMISO' using errcode = 'P0001';
    end if;
    if v_novedad.estado in ('cerrada', 'rechazada') then
      raise exception 'TRANSICION_INVALIDA' using errcode = 'P0001';
    end if;
    new.transicion_id := null;
  elsif v_rol = 2 then
    -- La foto de la solución: el aprobador del área, con la solución registrada y sin
    -- confirmar. Queda atada al intento vigente; el cliente no lo elige.
    if v_novedad.area_id is distinct from (select private.fn_area()) then
      raise exception 'SIN_PERMISO' using errcode = 'P0001';
    end if;
    if v_novedad.estado <> 'resuelta' then
      raise exception 'TRANSICION_INVALIDA' using errcode = 'P0001';
    end if;
    new.transicion_id := private.solucion_vigente(new.novedad_id);
  else
    raise exception 'SIN_PERMISO' using errcode = 'P0001';
  end if;

  -- Hasta 3 del reporte y hasta 3 por cada intento de solución.
  if (
    select count(*)
    from public.evidencia e
    where e.novedad_id = new.novedad_id
      and e.transicion_id is not distinct from new.transicion_id
  ) >= 3 then
    raise exception 'LIMITE_DE_FOTOS' using errcode = 'P0001';
  end if;

  -- La fila tiene que ser de un archivo que existe, en la carpeta de su novedad. El tamaño se
  -- toma del archivo, no de lo que diga el cliente.
  select (o.metadata ->> 'size')::integer into v_tamano
  from storage.objects o
  where o.bucket_id = 'evidencias'
    and o.name = new.ruta_storage;

  if v_tamano is null
     or private.novedad_de_la_ruta(new.ruta_storage) is distinct from new.novedad_id then
    raise exception 'EVIDENCIA_INVALIDA' using errcode = 'P0001';
  end if;

  new.tamano_bytes := v_tamano;
  return new;
end;
$$;

comment on function private.tg_evidencia_valida() is
  'RF-08: quién adjunta (el reportante al reporte; el aprobador a la solución vigente), el estado, el máximo de 3 de cada grupo, la ruta y el tamaño real.';
