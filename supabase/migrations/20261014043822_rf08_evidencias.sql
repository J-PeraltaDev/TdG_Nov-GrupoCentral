-- RF-08 (Sprint 4): evidencias fotográficas en Storage.
-- Fuente: SDD 6.1.7, 5.3.3, 4.2.9 y 6.1.4 (Tabla 31); plan del Sprint 4, decisiones 19 a 21.
--
-- El cliente reduce la foto, la sube a evidencias/{novedad_id}/{uuid}.jpg y después inserta la
-- fila de `evidencia`. Las políticas de storage.objects deciden quién sube y quién lee; el
-- disparador de `evidencia` cuida lo que una política no puede contar con seguridad: el estado
-- de la novedad, el máximo de fotos y que la fila corresponda a un archivo de esa novedad.

-- Bucket privado ------------------------------------------------------------------------------
-- 1 MB es FOTO_PESO_MAXIMO_BYTES de parametros.js. Solo JPEG: el cliente recodifica cada foto.
-- `staging:reset` no borra los buckets (drop.sql del CLI): si ya existe, se deja como debe estar.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('evidencias', 'evidencias', false, 1048576, array['image/jpeg'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- La novedad de una ruta {novedad_id}/{uuid}.jpg, o nulo si el nombre no tiene esa forma. Dentro
-- de una política, un `::uuid` sobre un nombre cualquiera lanzaría un error en vez de negar.
create function private.novedad_de_la_ruta(p_ruta text)
returns uuid
language sql
immutable
set search_path = ''
as $$
  select case
    when p_ruta ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$'
    then split_part(p_ruta, '/', 1)::uuid
  end;
$$;

revoke execute on function private.novedad_de_la_ruta(text) from public, anon;
-- Las políticas se evalúan con el rol de quien sube: necesita ejecutarla.
grant execute on function private.novedad_de_la_ruta(text) to authenticated;

-- Políticas de storage.objects (Tabla 31, «Objetos del bucket evidencias») -----------------

-- Sube el reportante activo de la finca, a una novedad que no esté cerrada ni rechazada y que
-- tenga menos de 3 evidencias (FOTOS_MAXIMO_POR_NOVEDAD). Con dos subidas a la vez la cuenta
-- puede quedarse corta; el disparador de abajo es el que no deja pasar la cuarta fila.
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
    ) < 3
  );

-- Lee quien puede leer la fila de `evidencia` del archivo, y esa fila ya la filtra su política
-- por el alcance de la novedad. Un archivo sin fila (huérfano, decisión 21) no lo ve nadie.
create policy evidencias_lectura on storage.objects
  for select to authenticated
  using (
    bucket_id = 'evidencias'
    and exists (select 1 from public.evidencia e where e.ruta_storage = objects.name)
  );

-- Nadie actualiza ni borra desde el cliente: no hay políticas de update ni de delete.

-- Disparador de `evidencia` --------------------------------------------------------------
-- security definer: tiene que bloquear la novedad y leer storage.objects, que el reportante no
-- ve hasta que su fila exista. Corre antes que la política de inserción de `evidencia`, así que
-- repite el alcance para no decirle nada de una novedad ajena a quien no la puede ver.

create function private.tg_evidencia_valida()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_novedad public.novedad%rowtype;
  v_tamano integer;
begin
  -- Dos fotos de la misma novedad a la vez se ordenan aquí: la cuenta de abajo es segura.
  select n.* into v_novedad
  from public.novedad n
  where n.id = new.novedad_id
  for update;

  if not found
     or (select private.fn_rol()) is distinct from 1
     or v_novedad.finca_id is distinct from (select private.fn_finca()) then
    raise exception 'SIN_PERMISO' using errcode = 'P0001';
  end if;

  if v_novedad.estado in ('cerrada', 'rechazada') then
    raise exception 'TRANSICION_INVALIDA' using errcode = 'P0001';
  end if;

  if (select count(*) from public.evidencia e where e.novedad_id = new.novedad_id) >= 3 then
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

revoke execute on function private.tg_evidencia_valida() from public, anon, authenticated;

create trigger evidencia_valida
  before insert on public.evidencia
  for each row execute function private.tg_evidencia_valida();

comment on function private.tg_evidencia_valida() is
  'RF-08: estado no final, máximo de 3, ruta de la novedad y tamaño real del archivo.';
