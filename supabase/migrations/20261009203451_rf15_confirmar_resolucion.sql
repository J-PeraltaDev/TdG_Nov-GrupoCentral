-- RF-15 y RF-16 (Sprint 3): implementación de confirmar_resolucion.
-- Fuente: SDD 6.1.3, Tabla 29 (resuelta → cerrada) y Tabla 30. Reemplaza el cuerpo del
-- contrato; la firma y los privilegios no cambian.
--
-- Es el cierre del ciclo: la finca que reportó la falla dice que quedó resuelta. Lo puede hacer
-- cualquier reportante activo de la finca de la novedad, no solo quien la registró (Tabla 30).
-- Que la finca se haya desactivado después no lo impide: sus novedades siguen su curso
-- (CU-04 3b).

create or replace function public.confirmar_resolucion(
  p_novedad_id uuid,
  p_observacion text default null
)
returns public.novedad
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_perfil public.usuario%rowtype;
  v_novedad public.novedad%rowtype;
  v_observacion text;
begin
  -- 1. Perfil: activo y reportante.
  v_perfil := private.perfil_para_transicion(1::smallint);

  -- 2. Bloqueo y alcance: una novedad de su finca. Si dos reportantes de la finca responden
  -- a la vez, el segundo espera y encuentra ya el estado nuevo.
  v_novedad := private.novedad_para_transicion(p_novedad_id, v_perfil);

  -- 3. Estado: solo lo que el área ya resolvió.
  if v_novedad.estado <> 'resuelta' then
    raise exception 'TRANSICION_INVALIDA' using errcode = 'P0001';
  end if;

  -- 4. Guarda: la observación es opcional (CU-15 3).
  v_observacion := private.texto_opcional(p_observacion);

  -- 5. Actualización (actualizado_en lo mantiene su disparador), historial y avisos. La
  -- solución, la fecha de ejecución y el tipo de falla se conservan: son lo que queda de la
  -- novedad cerrada (restricción novedad_resuelta_completa).
  update public.novedad n
  set estado = 'cerrada'
  where n.id = v_novedad.id
  returning n.* into v_novedad;

  insert into public.historial_transicion (
    novedad_id, usuario_id, estado_anterior, estado_nuevo, observacion
  )
  values (v_novedad.id, v_perfil.id, 'resuelta', 'cerrada', v_observacion);

  -- Al área que la atendió (Tabla 30).
  perform private.avisar(
    v_novedad.id,
    'cerrada',
    array(select private.aprobadores_del_area(v_novedad.area_id)),
    v_perfil.id
  );

  return v_novedad;
end;
$$;
