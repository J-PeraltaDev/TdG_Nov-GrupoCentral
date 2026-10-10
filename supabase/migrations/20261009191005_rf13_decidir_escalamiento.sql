-- RF-13 y RF-16 (Sprint 3): implementación de decidir_escalamiento.
-- Fuente: SDD 6.1.3, Tabla 29 (escalada → aprobada o rechazada) y Tabla 30. Reemplaza el
-- cuerpo del contrato; la firma y los privilegios no cambian.
--
-- Es la segunda instancia: el director decide dentro del mismo registro lo que el área escaló
-- con su justificación. Aprobada, la novedad vuelve al área para ejecutar la solución
-- (RF-14); rechazada, queda en un estado final.

-- Guarda de los textos opcionales ----------------------------------------------------------
-- La observación del director al aprobar y la del reportante al confirmar el cierre son
-- opcionales (CU-13 y CU-15 3): si llegan, van sin espacios sobrantes y con el mismo máximo de
-- los textos obligatorios (private.texto_obligatorio); vacías, quedan nulas.
--
-- Como las demás auxiliares de las transiciones, vive en private y nadie recibe `execute`.

create function private.texto_opcional(p_texto text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_texto text := btrim(coalesce(p_texto, ''), E' \t\n\r');
begin
  if char_length(v_texto) > 500 then
    raise exception 'DATO_OBLIGATORIO' using errcode = 'P0001';
  end if;

  return nullif(v_texto, '');
end;
$$;

comment on function private.texto_opcional(text) is
  'Devuelve el texto sin espacios ni saltos de línea en los extremos, o nulo si queda vacío; si pasa de 500 caracteres, DATO_OBLIGATORIO.';

revoke execute on function private.texto_opcional(text) from public, anon, authenticated;

-- decidir_escalamiento -----------------------------------------------------------------------
-- El director ve todas las novedades (SDD 6.1.4): el alcance no lo limita, pero una novedad
-- que no existe responde SIN_PERMISO, igual que en las demás transiciones.

create or replace function public.decidir_escalamiento(
  p_novedad_id uuid,
  p_aprobar boolean,
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
  v_destino public.estado_novedad;
  v_observacion text;
begin
  -- 1. Perfil: activo y director de agricultura.
  v_perfil := private.perfil_para_transicion(3::smallint);

  -- 2. Bloqueo y alcance. Si dos directores deciden a la vez, el segundo espera y encuentra
  -- ya el estado nuevo.
  v_novedad := private.novedad_para_transicion(p_novedad_id, v_perfil);

  -- 3. Estado: solo lo que el área escaló.
  if v_novedad.estado <> 'escalada' then
    raise exception 'TRANSICION_INVALIDA' using errcode = 'P0001';
  end if;

  -- 4. Guardas: la decisión, y la observación, que es obligatoria al rechazar (CU-13 5a).
  if p_aprobar is null then
    raise exception 'DATO_OBLIGATORIO' using errcode = 'P0001';
  end if;

  if p_aprobar then
    v_destino := 'aprobada';
    v_observacion := private.texto_opcional(p_observacion);
  else
    v_destino := 'rechazada';
    v_observacion := private.texto_obligatorio(p_observacion);
  end if;

  -- 5. Actualización (actualizado_en lo mantiene su disparador), historial y avisos.
  update public.novedad n
  set estado = v_destino
  where n.id = v_novedad.id
  returning n.* into v_novedad;

  insert into public.historial_transicion (
    novedad_id, usuario_id, estado_anterior, estado_nuevo, observacion
  )
  values (v_novedad.id, v_perfil.id, 'escalada', v_destino, v_observacion);

  -- Al área, que ejecuta la solución o se entera del rechazo, y al reportante (Tabla 30).
  perform private.avisar(
    v_novedad.id,
    v_destino,
    array(select private.aprobadores_del_area(v_novedad.area_id)) || v_novedad.reportante_id,
    v_perfil.id
  );

  return v_novedad;
end;
$$;
