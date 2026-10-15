-- RF-08: una sola política de inserción en `evidencia`, con los dos casos.
-- El asesor de Supabase (0006, multiple_permissive_policies) avisa que dos políticas permisivas
-- de inserción para el mismo rol se evalúan las dos en cada fila. Las fotos del reporte las
-- registra el reportante de la finca; las de la solución, el aprobador del área (cambio 23).
-- El disparador `evidencia_valida` sigue decidiendo el estado, el máximo y el intento.

drop policy evidencia_insercion_reportante on public.evidencia;
drop policy evidencia_insercion_aprobador on public.evidencia;

create policy evidencia_insercion on public.evidencia
  for insert to authenticated
  with check (
    subida_por = (select auth.uid())
    and exists (
      select 1
      from public.novedad n
      where n.id = evidencia.novedad_id
        and (
          ((select private.fn_rol()) = 1 and n.finca_id = (select private.fn_finca()))
          or ((select private.fn_rol()) = 2 and n.area_id = (select private.fn_area()))
        )
    )
  );
