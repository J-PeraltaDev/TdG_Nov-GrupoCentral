-- RF-32 · Reactivar un tipo de falla desactivado (cambio 39 de cambios-sdd). Revierte, para los
-- desactivados, la decisión 51 del plan del Sprint 5 («no hay reactivación»): el administrador
-- puede haberse equivocado al desactivar y, sin esto, el nombre queda ocupado para siempre. Un
-- tipo fusionado sigue sin volver: sus novedades ya son del destino y resolver_tipo_falla sigue
-- la cadena de fusiones de los inactivos.
--
-- La acción nueva se agrega al enum aquí y solo se usa dentro de la función, que Postgres no
-- ejecuta en esta misma transacción.

alter type public.accion_auditoria add value if not exists 'reactivar';

comment on type public.accion_auditoria is
  'Acciones del administrador sobre el catálogo de tipos de falla (RF-32; reactivar, cambio 39).';

-- Como desactivar_tipo_falla: security definer porque escribe en tipo_falla y en
-- auditoria_tipo_falla, donde el cliente no escribe; verifica que quien llama sea un
-- administrador activo y bloquea el tipo `for update`. No avisa a nadie (Tabla 30).
create function public.reactivar_tipo_falla(p_tipo_id uuid)
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
  if not found or v_tipo.activo or exists (
    select 1
    from public.auditoria_tipo_falla a
    where a.tipo_falla_id = v_tipo.id and a.accion = 'fusionar'
  ) then
    raise exception 'TIPO_FALLA_INVALIDO' using errcode = 'P0001';
  end if;
  -- El nombre no puede chocar: nombre_normalizado es único también entre los inactivos.
  update public.tipo_falla t set activo = true where t.id = v_tipo.id returning t.* into v_tipo;
  insert into public.auditoria_tipo_falla (tipo_falla_id, usuario_id, accion, valor_anterior)
  values (v_tipo.id, v_perfil.id, 'reactivar', v_tipo.nombre);
  return v_tipo;
end;
$$;

comment on function public.reactivar_tipo_falla(uuid) is
  'El administrador devuelve a las sugerencias un tipo que desactivó. Un tipo activo, fusionado o inexistente: TIPO_FALLA_INVALIDO. Queda auditado (RF-32, cambio 39).';

revoke execute on function public.reactivar_tipo_falla(uuid) from public, anon, authenticated;
grant execute on function public.reactivar_tipo_falla(uuid) to authenticated;
