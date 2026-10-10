-- RF-10 y RF-16 (Sprint 2): implementación de tomar_novedad.
-- Fuente: SDD 6.1.3, Tabla 29 (asignada → en atención) y Tabla 30. Reemplaza el cuerpo del
-- contrato; la firma y los privilegios no cambian.
--
-- Como el modelo no tiene un responsable individual, cualquier aprobador del área puede tomar
-- la novedad; quién la tomó se lee de esta transición en el historial.

create or replace function public.tomar_novedad(p_novedad_id uuid)
returns public.novedad
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_perfil public.usuario%rowtype;
  v_novedad public.novedad%rowtype;
begin
  -- 1. Perfil: activo y aprobador de área.
  v_perfil := private.perfil_para_transicion(2::smallint);

  -- 2. Bloqueo y alcance: una novedad de su área.
  v_novedad := private.novedad_para_transicion(p_novedad_id, v_perfil);

  -- 3. Estado. Si otro aprobador la tomó primero, aquí ya está en atención.
  if v_novedad.estado <> 'asignada' then
    raise exception 'TRANSICION_INVALIDA' using errcode = 'P0001';
  end if;

  -- 5. Actualización (actualizado_en lo mantiene su disparador), historial y aviso.
  update public.novedad n
  set estado = 'en_atencion'
  where n.id = v_novedad.id
  returning n.* into v_novedad;

  insert into public.historial_transicion (novedad_id, usuario_id, estado_anterior, estado_nuevo)
  values (v_novedad.id, v_perfil.id, 'asignada', 'en_atencion');

  perform private.avisar(
    v_novedad.id, 'en_atencion', array[v_novedad.reportante_id], v_perfil.id
  );

  return v_novedad;
end;
$$;
