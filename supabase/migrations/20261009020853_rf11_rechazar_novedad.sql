-- RF-11 y RF-16 (Sprint 2): implementación de rechazar_novedad.
-- Fuente: SDD 6.1.3, Tabla 29 (asignada o en atención → rechazada, estado final) y Tabla 30.
-- Reemplaza el cuerpo del contrato; la firma y los privilegios no cambian.

-- Guarda de los textos obligatorios --------------------------------------------------------
-- El motivo, la justificación, la observación y la solución son textos que la persona debe
-- escribir: sin espacios ni saltos de línea sobrantes no pueden quedar vacíos. Figma los
-- limita a 500 caracteres; el máximo es el parámetro OBSERVACION_MAX_CARACTERES de
-- src/core/config/parametros.js y se cambia en los dos lados a la vez (docs/cambios-sdd.md).
--
-- Como las demás auxiliares de las transiciones, vive en private y nadie recibe `execute`.

create function private.texto_obligatorio(p_texto text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_texto text := btrim(coalesce(p_texto, ''), E' \t\n\r');
begin
  if v_texto = '' or char_length(v_texto) > 500 then
    raise exception 'DATO_OBLIGATORIO' using errcode = 'P0001';
  end if;

  return v_texto;
end;
$$;

comment on function private.texto_obligatorio(text) is
  'Devuelve el texto sin espacios ni saltos de línea en los extremos; si queda vacío o pasa de 500 caracteres, DATO_OBLIGATORIO.';

revoke execute on function private.texto_obligatorio(text) from public, anon, authenticated;

-- rechazar_novedad ---------------------------------------------------------------------------
-- La novedad no cambia de área: sigue en el alcance del aprobador, que puede consultarla ya
-- rechazada. La finca ve el motivo en la línea de tiempo.

create or replace function public.rechazar_novedad(p_novedad_id uuid, p_motivo text)
returns public.novedad
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_perfil public.usuario%rowtype;
  v_novedad public.novedad%rowtype;
  v_estado_anterior public.estado_novedad;
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

  -- 4. Guarda: el motivo (CU-11 3a).
  v_motivo := private.texto_obligatorio(p_motivo);

  -- 5. Actualización (actualizado_en lo mantiene su disparador), historial y aviso.
  update public.novedad n
  set estado = 'rechazada'
  where n.id = v_novedad.id
  returning n.* into v_novedad;

  insert into public.historial_transicion (
    novedad_id, usuario_id, estado_anterior, estado_nuevo, observacion
  )
  values (v_novedad.id, v_perfil.id, v_estado_anterior, 'rechazada', v_motivo);

  perform private.avisar(v_novedad.id, 'rechazada', array[v_novedad.reportante_id], v_perfil.id);

  return v_novedad;
end;
$$;
