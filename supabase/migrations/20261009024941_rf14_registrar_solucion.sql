-- RF-14 y RF-16 (Sprint 2): implementación de registrar_solucion y de sugerir_tipos_falla.
-- Fuente: SDD 6.1.3, Tabla 29 (en atención o aprobada → resuelta), Tabla 30 y 6.1.8 (catálogo
-- de tipos de falla). Reemplaza el cuerpo de los contratos; las firmas y los privilegios no
-- cambian.

-- resolver_tipo (SDD 6.1.8) -----------------------------------------------------------------
-- Decide con qué tipo de falla queda la novedad:
--   · con identificador, gana: debe existir y estar activo;
--   · con nombre, se normaliza: si hay un tipo activo, se usa; si fue fusionado, se usa el
--     destino de su última fusión (siguiendo la cadena hasta un tipo activo); si fue
--     desactivado, no se puede usar; si no existe, se crea a nombre de quien actúa.
-- Devuelve también si el tipo es nuevo, porque entonces hay que avisar a los administradores.
--
-- Vive en private y nadie recibe `execute`: solo la llama registrar_solucion.

create function private.resolver_tipo_falla(
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
    select t.* into v_tipo from public.tipo_falla t where t.id = p_tipo_falla_id;

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
    select t.* into v_tipo from public.tipo_falla t where t.nombre_normalizado = v_normalizado;

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

        select t.* into v_tipo from public.tipo_falla t where t.id = v_destino_id;
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

comment on function private.resolver_tipo_falla(uuid, text, uuid) is
  'Tipo de falla con que queda una novedad: el del identificador, el que corresponde al nombre normalizado (o el destino de su fusión) o uno nuevo (SDD 6.1.8).';

revoke execute on function private.resolver_tipo_falla(uuid, text, uuid)
from public, anon, authenticated;

-- registrar_solucion --------------------------------------------------------------------------
-- «Hoy» es el día en Colombia. El servidor está en UTC: después de las 7 p. m. en Colombia ya
-- es mañana en UTC, y comparar con la fecha del servidor dejaría pasar una fecha futura.
--
-- El tipo se resuelve al final de las guardas: así un intento con datos inválidos no llega a
-- crear un tipo (aunque lo creara, la excepción lo revertiría).

create or replace function public.registrar_solucion(
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
declare
  v_perfil public.usuario%rowtype;
  v_novedad public.novedad%rowtype;
  v_estado_anterior public.estado_novedad;
  v_solucion text;
  v_hoy date := (now() at time zone 'America/Bogota')::date;
  v_tipo record;
  v_destinatarios uuid[];
begin
  -- 1. Perfil: activo y aprobador de área.
  v_perfil := private.perfil_para_transicion(2::smallint);

  -- 2. Bloqueo y alcance: una novedad de su área.
  v_novedad := private.novedad_para_transicion(p_novedad_id, v_perfil);

  -- 3. Estado: en atención, o aprobada por el director.
  if v_novedad.estado not in ('en_atencion', 'aprobada') then
    raise exception 'TRANSICION_INVALIDA' using errcode = 'P0001';
  end if;
  v_estado_anterior := v_novedad.estado;

  -- 4. Guardas (CU-14 6a): la solución, la fecha y el tipo de falla.
  v_solucion := private.texto_obligatorio(p_solucion);

  if p_fecha_ejecucion is null
    or (p_tipo_falla_id is null and private.normalizar_tipo_falla(p_tipo_falla_nombre) = '')
  then
    raise exception 'DATO_OBLIGATORIO' using errcode = 'P0001';
  end if;

  if p_fecha_ejecucion > v_hoy then
    raise exception 'FECHA_INVALIDA' using errcode = 'P0001';
  end if;

  select r.tipo_id, r.es_nuevo into v_tipo
  from private.resolver_tipo_falla(p_tipo_falla_id, p_tipo_falla_nombre, v_perfil.id) as r;

  -- 5. Actualización, historial y avisos. Los cuatro datos van juntos: lo exige la
  -- restricción novedad_resuelta_completa. actualizado_en lo mantiene su disparador.
  update public.novedad n
  set estado = 'resuelta',
      solucion = v_solucion,
      fecha_ejecucion = p_fecha_ejecucion,
      tipo_falla_id = v_tipo.tipo_id
  where n.id = v_novedad.id
  returning n.* into v_novedad;

  insert into public.historial_transicion (novedad_id, usuario_id, estado_anterior, estado_nuevo)
  values (v_novedad.id, v_perfil.id, v_estado_anterior, 'resuelta');

  -- Al reportante, que debe confirmar el cierre, y, si se creó un tipo, a los administradores,
  -- para que lo revisen y lo fusionen si corresponde (Tabla 30).
  v_destinatarios := array[v_novedad.reportante_id];
  if v_tipo.es_nuevo then
    v_destinatarios := v_destinatarios || array(select private.usuarios_del_rol(4::smallint));
  end if;

  perform private.avisar(v_novedad.id, 'resuelta', v_destinatarios, v_perfil.id);

  return v_novedad;
end;
$$;

-- sugerir_tipos_falla -------------------------------------------------------------------------
-- Los tipos activos cuyo nombre normalizado contiene el texto normalizado: primero la
-- coincidencia exacta, luego por cantidad de novedades y por nombre; máximo ocho. Sin texto,
-- los ocho más usados.
--
-- Es security definer con verificación de rol para que la cantidad sea la de todas las
-- novedades del tipo, que es lo que orienta hacia el más usado; con los permisos de quien
-- consulta, el aprobador solo contaría las de su área. Se busca con strpos y no con LIKE: el
-- texto de la persona puede traer «%» o «_».

create or replace function public.sugerir_tipos_falla(p_texto text)
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
#variable_conflict use_column
declare
  v_texto text := private.normalizar_tipo_falla(p_texto);
begin
  -- Solo quien registra soluciones o administra el catálogo, y está activo.
  if not exists (
    select 1
    from public.usuario u
    where u.id = (select auth.uid()) and u.activo and u.rol_id in (2, 4)
  ) then
    raise exception 'SIN_PERMISO' using errcode = 'P0001';
  end if;

  return query
  select
    t.id,
    t.nombre,
    (select count(*) from public.novedad n where n.tipo_falla_id = t.id)::integer,
    t.nombre_normalizado = v_texto
  from public.tipo_falla t
  where t.activo and strpos(t.nombre_normalizado, v_texto) > 0
  order by 4 desc, 3 desc, t.nombre
  limit 8;
end;
$$;
