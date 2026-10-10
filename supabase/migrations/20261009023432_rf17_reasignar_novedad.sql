-- RF-17 y RF-16 (Sprint 2): implementación de reasignar_novedad.
-- Fuente: SDD 6.1.3, Tabla 29 (asignada o en atención → asignada en otra área) y Tabla 30.
-- Reemplaza el cuerpo del contrato; la firma y los privilegios no cambian.
--
-- Corrige el enrutamiento de una novedad que llegó al área equivocada. La novedad cambia de
-- área y vuelve a «asignada»: sale del alcance de quien la reasigna y queda en la bandeja del
-- área nueva, que debe tomarla. El historial guarda el área anterior, la nueva y el motivo.
-- La función devuelve la novedad aunque quien la llama ya no pueda leerla.

create or replace function public.reasignar_novedad(
  p_novedad_id uuid,
  p_area_destino_id uuid,
  p_motivo text
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
  v_area_anterior_id uuid;
  v_motivo text;
begin
  -- 1. Perfil: activo y aprobador de área.
  v_perfil := private.perfil_para_transicion(2::smallint);

  -- 2. Bloqueo y alcance: una novedad de su área.
  v_novedad := private.novedad_para_transicion(p_novedad_id, v_perfil);

  -- 3. Estado: solo antes de escalarla o de resolverla.
  if v_novedad.estado not in ('asignada', 'en_atencion') then
    raise exception 'TRANSICION_INVALIDA' using errcode = 'P0001';
  end if;
  v_estado_anterior := v_novedad.estado;
  v_area_anterior_id := v_novedad.area_id;

  -- 4. Guardas: el motivo (CU-17 3a) y el área de destino, que debe existir, estar activa y
  -- ser distinta de la actual.
  v_motivo := private.texto_obligatorio(p_motivo);

  if p_area_destino_id is null
    or p_area_destino_id = v_area_anterior_id
    or not exists (select 1 from public.area a where a.id = p_area_destino_id and a.activo)
  then
    raise exception 'AREA_INVALIDA' using errcode = 'P0001';
  end if;

  -- 5. Actualización (actualizado_en lo mantiene su disparador), historial y avisos.
  update public.novedad n
  set estado = 'asignada', area_id = p_area_destino_id
  where n.id = v_novedad.id
  returning n.* into v_novedad;

  insert into public.historial_transicion (
    novedad_id, usuario_id, estado_anterior, estado_nuevo, area_anterior_id, area_nueva_id,
    observacion
  )
  values (
    v_novedad.id, v_perfil.id, v_estado_anterior, 'asignada', v_area_anterior_id,
    p_area_destino_id, v_motivo
  );

  -- A quienes deben atenderla ahora y al reportante (Tabla 30).
  perform private.avisar(
    v_novedad.id,
    'asignada',
    array(select private.aprobadores_del_area(p_area_destino_id)) || v_novedad.reportante_id,
    v_perfil.id
  );

  return v_novedad;
end;
$$;
