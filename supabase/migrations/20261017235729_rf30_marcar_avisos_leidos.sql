-- RF-30 (Sprint 5): implementación de marcar_avisos_leidos y fin de la escritura directa en
-- notificacion.
-- Fuente: SDD 5.3.2 (Tabla 21) y 6.1.6, y la regla 1 de CLAUDE.md: el cliente nunca escribe en
-- notificacion. Las Tablas 20 y 31 del SDD le daban al destinatario un PATCH de leida y leida_en;
-- desde aquí esa es la única forma de marcar (plan del Sprint 5, decisión 29; cambio 26).
-- Reemplaza el cuerpo del contrato; la firma y los privilegios no cambian.

create or replace function public.marcar_avisos_leidos(p_ids uuid[] default null)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_marcados integer;
begin
  -- fn_activo es falso si el usuario no tiene perfil o está inactivo.
  if not private.fn_activo() then
    raise exception 'SIN_PERMISO' using errcode = 'P0001';
  end if;

  -- Solo los del usuario y sin leer: los ajenos se ignoran sin decir si existen, y un aviso ya
  -- leído conserva su hora. La hora la pone el servidor. Usa notificacion_destinatario_idx.
  update public.notificacion n
  set leida = true,
      leida_en = now()
  where n.destinatario_id = (select auth.uid())
    and not n.leida
    and (p_ids is null or n.id = any (p_ids));

  get diagnostics v_marcados = row_count;
  return v_marcados;
end;
$$;

-- El cliente ya no actualiza notificacion: sin el privilegio ni la política.
revoke update (leida, leida_en) on public.notificacion from authenticated;
drop policy notificacion_marcar_leida on public.notificacion;
