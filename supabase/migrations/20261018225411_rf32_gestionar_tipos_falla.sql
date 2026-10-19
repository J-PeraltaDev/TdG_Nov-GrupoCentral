-- RF-32 (Sprint 5): el administrador depura el catálogo de tipos de falla y corrige el tipo de
-- una novedad cerrada. Fuente: SDD 6.1.8, Tabla 21 y Tabla 30; plan del Sprint 5, decisiones 48
-- a 53. Reemplaza los cuerpos de los contratos (PR 1): las firmas, los comentarios y los
-- privilegios no cambian.
--
-- Las cuatro son security definer: escriben en tipo_falla, novedad, auditoria_tipo_falla e
-- historial_transicion, donde el cliente no escribe. Cada una verifica que quien llama sea un
-- administrador activo (private.perfil_para_transicion(4)). No avisan a nadie (Tabla 30).
--
-- Código nuevo de la Tabla 22: TIPO_FALLA_DUPLICADO, el nombre ya es de otro tipo (cambio 30).
-- Va aparte de TIPO_FALLA_INVALIDO para que la pantalla sepa cuándo proponer la fusión (31-B).
--
-- Bloqueos: quien cambia un tipo lo bloquea `for update`; la fusión bloquea los dos en orden
-- de id, para que dos fusiones a la vez no se traben. Quien lo usa (registrar_solucion y la
-- corrección) lo lee `for share`: espera a la fusión en curso y ve el tipo ya inactivo.

-- resolver_tipo_falla: el mismo cuerpo de RF-14, con `for share` (decisión 50) ------------

create or replace function private.resolver_tipo_falla(
  p_tipo_falla_id uuid,
  p_tipo_falla_nombre text,
  p_usuario_id uuid,
  out tipo_id uuid,
  out es_nuevo boolean
)
language plpgsql
set search_path = ''
as $$
declare
  v_nombre text;
  v_normalizado text;
  v_tipo public.tipo_falla%rowtype;
  v_destino_id uuid;
  v_saltos integer := 0;
begin
  es_nuevo := false;

  if p_tipo_falla_id is not null then
    select t.* into v_tipo from public.tipo_falla t where t.id = p_tipo_falla_id for share;

    if not found or not v_tipo.activo then
      raise exception 'TIPO_FALLA_INVALIDO' using errcode = 'P0001';
    end if;

    tipo_id := v_tipo.id;
    return;
  end if;

  -- El nombre se guarda como lo escribió la persona, con los espacios arreglados.
  v_nombre := btrim(regexp_replace(coalesce(p_tipo_falla_nombre, ''), '\s+', ' ', 'g'));
  v_normalizado := private.normalizar_tipo_falla(v_nombre);

  if v_normalizado = '' then
    raise exception 'DATO_OBLIGATORIO' using errcode = 'P0001';
  end if;

  loop
    select t.* into v_tipo
    from public.tipo_falla t
    where t.nombre_normalizado = v_normalizado
    for share;

    if found then
      -- Un tipo inactivo fue fusionado o desactivado. Si fue fusionado, vale el destino de
      -- la última fusión; si ese destino también se fusionó después, se sigue la cadena.
      while not v_tipo.activo loop
        select a.tipo_destino_id into v_destino_id
        from public.auditoria_tipo_falla a
        where a.tipo_falla_id = v_tipo.id and a.accion = 'fusionar'
        order by a.fecha desc
        limit 1;

        v_saltos := v_saltos + 1;
        if v_destino_id is null or v_saltos > 10 then
          raise exception 'TIPO_FALLA_INVALIDO' using errcode = 'P0001';
        end if;

        select t.* into v_tipo from public.tipo_falla t where t.id = v_destino_id for share;
      end loop;

      tipo_id := v_tipo.id;
      return;
    end if;

    -- No existe: se crea. Si otro aprobador creó el mismo nombre al tiempo, la restricción
    -- de unicidad lo detiene y se vuelve a leer, como hace registrar_novedad con id_local.
    begin
      insert into public.tipo_falla (nombre, nombre_normalizado, creado_por)
      values (v_nombre, v_normalizado, p_usuario_id)
      returning id into tipo_id;

      es_nuevo := true;
      return;
    exception
      when unique_violation then
        v_saltos := v_saltos + 1;
        if v_saltos > 10 then
          raise exception 'TIPO_FALLA_INVALIDO' using errcode = 'P0001';
        end if;
    end;
  end loop;
end;
$$;

-- renombrar_tipo_falla (CU-32 3 y 3a; decisión 49) -------------------------------------------

create or replace function public.renombrar_tipo_falla(p_tipo_id uuid, p_nombre text)
returns public.tipo_falla
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_perfil public.usuario%rowtype;
  v_tipo public.tipo_falla%rowtype;
  v_anterior text;
  v_nombre text := btrim(regexp_replace(coalesce(p_nombre, ''), '\s+', ' ', 'g'));
  v_normalizado text := private.normalizar_tipo_falla(p_nombre);
begin
  v_perfil := private.perfil_para_transicion(4::smallint);

  if v_normalizado = '' then
    raise exception 'DATO_OBLIGATORIO' using errcode = 'P0001';
  end if;

  select t.* into v_tipo from public.tipo_falla t where t.id = p_tipo_id for update;

  -- Un tipo inactivo no se toca: no hay reactivación (decisión 51).
  if not found or not v_tipo.activo then
    raise exception 'TIPO_FALLA_INVALIDO' using errcode = 'P0001';
  end if;

  if v_nombre = v_tipo.nombre then
    return v_tipo;
  end if;

  -- El nombre de otro tipo, activo o no. El mismo tipo con otras mayúsculas o tildes, sí.
  if exists (
    select 1 from public.tipo_falla t
    where t.nombre_normalizado = v_normalizado and t.id <> v_tipo.id
  ) then
    raise exception 'TIPO_FALLA_DUPLICADO' using errcode = 'P0001';
  end if;

  v_anterior := v_tipo.nombre;

  begin
    update public.tipo_falla t
    set nombre = v_nombre, nombre_normalizado = v_normalizado
    where t.id = v_tipo.id
    returning t.* into v_tipo;
  exception
    -- Un aprobador creó ese nombre al resolver, entre la verificación y el cambio.
    when unique_violation then
      raise exception 'TIPO_FALLA_DUPLICADO' using errcode = 'P0001';
  end;

  insert into public.auditoria_tipo_falla (tipo_falla_id, usuario_id, accion, valor_anterior)
  values (v_tipo.id, v_perfil.id, 'renombrar', v_anterior);

  return v_tipo;
end;
$$;

-- fusionar_tipos_falla (CU-32 4 y 4a; decisión 50) -------------------------------------------

create or replace function public.fusionar_tipos_falla(p_origen_id uuid, p_destino_id uuid)
returns public.tipo_falla
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_perfil public.usuario%rowtype;
  v_origen public.tipo_falla%rowtype;
  v_destino public.tipo_falla%rowtype;
begin
  v_perfil := private.perfil_para_transicion(4::smallint);

  if p_origen_id is not distinct from p_destino_id then
    raise exception 'TIPO_FALLA_INVALIDO' using errcode = 'P0001';
  end if;

  -- Los dos, en orden de id: dos fusiones cruzadas esperan en vez de trabarse.
  perform 1
  from public.tipo_falla t
  where t.id in (p_origen_id, p_destino_id)
  order by t.id
  for update;

  select t.* into v_origen from public.tipo_falla t where t.id = p_origen_id;
  select t.* into v_destino from public.tipo_falla t where t.id = p_destino_id;

  if not coalesce(v_origen.activo, false) or not coalesce(v_destino.activo, false) then
    raise exception 'TIPO_FALLA_INVALIDO' using errcode = 'P0001';
  end if;

  -- Todas, también las cerradas: el indicador de recurrencia agrupa por el tipo vigente.
  update public.novedad n set tipo_falla_id = v_destino.id where n.tipo_falla_id = v_origen.id;

  update public.tipo_falla t set activo = false where t.id = v_origen.id;

  insert into public.auditoria_tipo_falla (
    tipo_falla_id, tipo_destino_id, usuario_id, accion, valor_anterior
  )
  values (v_origen.id, v_destino.id, v_perfil.id, 'fusionar', v_origen.nombre);

  return v_destino;
end;
$$;

-- desactivar_tipo_falla (decisión 52) --------------------------------------------------------

create or replace function public.desactivar_tipo_falla(p_tipo_id uuid)
returns public.tipo_falla
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_perfil public.usuario%rowtype;
  v_tipo public.tipo_falla%rowtype;
begin
  v_perfil := private.perfil_para_transicion(4::smallint);

  select t.* into v_tipo from public.tipo_falla t where t.id = p_tipo_id for update;

  if not found or not v_tipo.activo then
    raise exception 'TIPO_FALLA_INVALIDO' using errcode = 'P0001';
  end if;

  update public.tipo_falla t set activo = false where t.id = v_tipo.id returning t.* into v_tipo;

  insert into public.auditoria_tipo_falla (tipo_falla_id, usuario_id, accion, valor_anterior)
  values (v_tipo.id, v_perfil.id, 'desactivar', v_tipo.nombre);

  return v_tipo;
end;
$$;

-- corregir_tipo_falla (CU-32 1a; decisión 53) ------------------------------------------------

create or replace function public.corregir_tipo_falla(p_novedad_id uuid, p_tipo_falla_id uuid)
returns public.novedad
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_perfil public.usuario%rowtype;
  v_novedad public.novedad%rowtype;
  v_tipo public.tipo_falla%rowtype;
  v_anterior text;
begin
  v_perfil := private.perfil_para_transicion(4::smallint);

  -- El tipo antes que la novedad, en el mismo orden que la fusión (tipos y después novedades):
  -- una fusión hacia este tipo espera a que termine la corrección.
  select t.* into v_tipo from public.tipo_falla t where t.id = p_tipo_falla_id for share;

  if not found or not v_tipo.activo then
    raise exception 'TIPO_FALLA_INVALIDO' using errcode = 'P0001';
  end if;

  v_novedad := private.novedad_para_transicion(p_novedad_id, v_perfil);

  if v_novedad.estado <> 'cerrada' then
    raise exception 'TRANSICION_INVALIDA' using errcode = 'P0001';
  end if;

  if v_novedad.tipo_falla_id = v_tipo.id then
    raise exception 'TIPO_FALLA_INVALIDO' using errcode = 'P0001';
  end if;

  select t.nombre into v_anterior from public.tipo_falla t where t.id = v_novedad.tipo_falla_id;

  update public.novedad n
  set tipo_falla_id = v_tipo.id
  where n.id = v_novedad.id
  returning n.* into v_novedad;

  -- No cambia el estado: el historial lo muestra como «Tipo de falla corregido».
  insert into public.historial_transicion (
    novedad_id, usuario_id, estado_anterior, estado_nuevo, observacion
  )
  values (
    v_novedad.id, v_perfil.id, 'cerrada', 'cerrada',
    format('"%s" → "%s"', v_anterior, v_tipo.nombre)
  );

  return v_novedad;
end;
$$;
