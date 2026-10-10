-- RF-15, RF-14 y RF-16 (Sprint 3): implementación de reportar_falla_persiste y qué pasa con
-- la solución que no sirvió.
-- Fuente: SDD 6.1.3, Tabla 29 (resuelta → en atención) y Tabla 30. Reemplaza el cuerpo del
-- contrato; la firma y los privilegios no cambian.
--
-- Cambio frente a la Tabla 30 (docs/cambios-sdd.md, decisión 21 del plan del Sprint 3). El SDD
-- deja la solución solo en la novedad («Sin observación; la solución queda en la novedad») y
-- no dice qué pasa con ella si la falla persiste. Una novedad que vuelve a estar en atención
-- no puede seguir mostrando una solución, y al registrar la siguiente se perdería el texto de
-- la primera. Por eso:
--   · registrar_solucion guarda además la solución como observación de su transición: el
--     historial, que es inmutable, conserva el texto de cada intento;
--   · reportar_falla_persiste limpia de la novedad la solución, la fecha de ejecución y el
--     tipo de falla: en atención, la novedad nunca trae una solución.
-- Del intento que no sirvió se pierden el tipo de falla y la fecha de ejecución. Los reportes
-- del Sprint 5 no cambian: miran el estado y la última resolución.

-- registrar_solucion ---------------------------------------------------------------------------
-- El mismo cuerpo del Sprint 2 (rf14_registrar_solucion), con un cambio: la transición lleva
-- la solución como observación.

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

  -- La solución queda también bajo su transición: si la falla persiste, la novedad la pierde
  -- y el historial la conserva.
  insert into public.historial_transicion (
    novedad_id, usuario_id, estado_anterior, estado_nuevo, observacion
  )
  values (v_novedad.id, v_perfil.id, v_estado_anterior, 'resuelta', v_solucion);

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

-- reportar_falla_persiste ----------------------------------------------------------------------
-- Como confirmar_resolucion, lo puede hacer cualquier reportante activo de la finca de la
-- novedad. La novedad vuelve al área en el mismo estado en que estaba antes de resolverla: en
-- atención, sin pasar otra vez por «asignada». Por eso «Tomada por» sigue saliendo de la
-- última vez que pasó de asignada a en atención, que fue la del aprobador.

create or replace function public.reportar_falla_persiste(p_novedad_id uuid, p_observacion text)
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

  -- 2. Bloqueo y alcance: una novedad de su finca.
  v_novedad := private.novedad_para_transicion(p_novedad_id, v_perfil);

  -- 3. Estado: solo lo que el área ya resolvió.
  if v_novedad.estado <> 'resuelta' then
    raise exception 'TRANSICION_INVALIDA' using errcode = 'P0001';
  end if;

  -- 4. Guarda: qué sigue fallando (CU-15 3b).
  v_observacion := private.texto_obligatorio(p_observacion);

  -- 5. Actualización (actualizado_en lo mantiene su disparador), historial y avisos. La
  -- solución que no sirvió sale de la novedad; su texto sigue en el historial.
  update public.novedad n
  set estado = 'en_atencion',
      solucion = null,
      fecha_ejecucion = null,
      tipo_falla_id = null
  where n.id = v_novedad.id
  returning n.* into v_novedad;

  insert into public.historial_transicion (
    novedad_id, usuario_id, estado_anterior, estado_nuevo, observacion
  )
  values (v_novedad.id, v_perfil.id, 'resuelta', 'en_atencion', v_observacion);

  -- Al área, que debe atenderla otra vez (Tabla 30).
  perform private.avisar(
    v_novedad.id,
    'en_atencion',
    array(select private.aprobadores_del_area(v_novedad.area_id)),
    v_perfil.id
  );

  return v_novedad;
end;
$$;
