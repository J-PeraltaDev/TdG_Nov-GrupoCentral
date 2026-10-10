-- RF-12 y RF-16 (Sprint 2): implementación de escalar_novedad.
-- Fuente: SDD 6.1.3, Tabla 29 (en atención → escalada) y Tabla 30. Reemplaza el cuerpo del
-- contrato; la firma y los privilegios no cambian.
--
-- El escalamiento ocurre dentro del mismo registro: la novedad no cambia de área y sigue en el
-- alcance del aprobador, que la ve «en espera» hasta que el director decida (RF-13, Sprint 3).
-- Solo se escala lo que ya se tomó: una novedad asignada responde TRANSICION_INVALIDA.

create or replace function public.escalar_novedad(p_novedad_id uuid, p_justificacion text)
returns public.novedad
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_perfil public.usuario%rowtype;
  v_novedad public.novedad%rowtype;
  v_justificacion text;
begin
  -- 1. Perfil: activo y aprobador de área.
  v_perfil := private.perfil_para_transicion(2::smallint);

  -- 2. Bloqueo y alcance: una novedad de su área.
  v_novedad := private.novedad_para_transicion(p_novedad_id, v_perfil);

  -- 3. Estado.
  if v_novedad.estado <> 'en_atencion' then
    raise exception 'TRANSICION_INVALIDA' using errcode = 'P0001';
  end if;

  -- 4. Guarda: la justificación (CU-12 3a).
  v_justificacion := private.texto_obligatorio(p_justificacion);

  -- 5. Actualización (actualizado_en lo mantiene su disparador), historial y avisos.
  update public.novedad n
  set estado = 'escalada'
  where n.id = v_novedad.id
  returning n.* into v_novedad;

  insert into public.historial_transicion (
    novedad_id, usuario_id, estado_anterior, estado_nuevo, observacion
  )
  values (v_novedad.id, v_perfil.id, 'en_atencion', 'escalada', v_justificacion);

  -- A los directores, que deciden, y al reportante (Tabla 30).
  perform private.avisar(
    v_novedad.id,
    'escalada',
    array(select private.usuarios_del_rol(3::smallint)) || v_novedad.reportante_id,
    v_perfil.id
  );

  return v_novedad;
end;
$$;
