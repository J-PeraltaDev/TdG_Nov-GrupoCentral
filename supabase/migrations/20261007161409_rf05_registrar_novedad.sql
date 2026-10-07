-- RF-05, RF-06, RF-07 y RF-16 (Sprint 1): implementación de registrar_novedad.
-- Fuente: SDD 6.1.3 (algoritmo general) y Tabla 30. Reemplaza el cuerpo del contrato.
--
-- Corre con los privilegios de su propietario porque el cliente no escribe en novedad,
-- historial_transicion ni notificacion (D-02): por eso verifica ella misma la identidad, el
-- rol y el alcance. Los errores de negocio son excepciones cuyo mensaje es un código estable
-- (SDD, Tabla 22). Cualquier excepción revierte todo (CU-16 1a).

create or replace function public.registrar_novedad(
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
declare
  v_usuario_id uuid := (select auth.uid());
  v_perfil public.usuario%rowtype;
  v_descripcion text := btrim(coalesce(p_descripcion, ''));
  v_fecha_registro timestamptz;
  v_novedad public.novedad%rowtype;
begin
  -- 1. Perfil: debe existir, estar activo y ser reportante.
  select u.* into v_perfil from public.usuario u where u.id = v_usuario_id;

  if not found or not v_perfil.activo or v_perfil.rol_id <> 1 then
    raise exception 'SIN_PERMISO' using errcode = 'P0001';
  end if;

  if p_id_local is null then
    raise exception 'DATO_OBLIGATORIO' using errcode = 'P0001';
  end if;

  -- 2. Idempotencia (RNF-08): si el envío ya se registró, se devuelve tal cual, sin escribir.
  -- Se busca antes de insertar porque `on conflict` consumiría un valor de la secuencia y
  -- dejaría saltos en NOV-####.
  select n.* into v_novedad from public.novedad n where n.id_local = p_id_local;

  if found then
    if v_novedad.reportante_id <> v_usuario_id then
      raise exception 'SIN_PERMISO' using errcode = 'P0001';
    end if;
    return v_novedad;
  end if;

  -- 3. Finca: asignada y activa.
  if not exists (
    select 1 from public.finca f where f.id = v_perfil.finca_id and f.activo
  ) then
    raise exception 'FINCA_NO_ASIGNADA' using errcode = 'P0001';
  end if;

  -- 4. Datos. El máximo de la descripción es el del CHECK de la tabla (parametros.js).
  if v_descripcion = ''
    or char_length(v_descripcion) > 500
    or p_prioridad is null
    or p_area_id is null
  then
    raise exception 'DATO_OBLIGATORIO' using errcode = 'P0001';
  end if;

  if not exists (select 1 from public.area a where a.id = p_area_id and a.activo) then
    raise exception 'AREA_INVALIDA' using errcode = 'P0001';
  end if;

  -- 5. Fecha real de registro (RNF-09): la del dispositivo, salvo que falte o sea futura.
  v_fecha_registro := case
    when p_fecha_registro is null or p_fecha_registro > now() then now()
    else p_fecha_registro
  end;

  -- 6. Inserción. La finca es siempre la del reportante, nunca la que mande el cliente.
  -- La novedad queda directamente en «asignada»: el enrutamiento ocurre en la misma
  -- transacción (RF-07) y el historial registra las dos transiciones.
  begin
    insert into public.novedad (
      id_local, finca_id, area_id, reportante_id, descripcion, prioridad, estado,
      fecha_registro, fecha_sincronizacion
    )
    values (
      p_id_local, v_perfil.finca_id, p_area_id, v_usuario_id, v_descripcion, p_prioridad,
      'asignada', v_fecha_registro, now()
    )
    returning * into v_novedad;
  exception
    when unique_violation then
      -- Red de seguridad: otro envío con el mismo id_local ganó la carrera.
      select n.* into v_novedad from public.novedad n where n.id_local = p_id_local;
      if not found or v_novedad.reportante_id <> v_usuario_id then
        raise exception 'SIN_PERMISO' using errcode = 'P0001';
      end if;
      return v_novedad;
  end;

  -- 7. Historial (RF-16): creación, con la fecha real de registro, y enrutamiento, con la
  -- hora del servidor. Las dos a nombre del reportante; la interfaz presenta la segunda
  -- como acción del sistema.
  insert into public.historial_transicion (
    novedad_id, usuario_id, estado_anterior, estado_nuevo, area_nueva_id, fecha_hora
  )
  values (v_novedad.id, v_usuario_id, null, 'registrada', null, v_fecha_registro);

  insert into public.historial_transicion (
    novedad_id, usuario_id, estado_anterior, estado_nuevo, area_nueva_id, fecha_hora
  )
  values (v_novedad.id, v_usuario_id, 'registrada', 'asignada', p_area_id, now());

  -- 8. Avisos (RF-30): a los aprobadores activos del área, excepto quien registra. El
  -- reportante no recibe aviso: su constancia es la pantalla 06.
  insert into public.notificacion (destinatario_id, novedad_id, estado_nuevo)
  select u.id, v_novedad.id, 'asignada'
  from public.usuario u
  where u.rol_id = 2
    and u.area_id = p_area_id
    and u.activo
    and u.id <> v_usuario_id;

  return v_novedad;
end;
$$;
