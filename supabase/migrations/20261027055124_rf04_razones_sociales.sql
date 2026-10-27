-- RF-04 · Razones sociales desde la aplicación (cambio 40 de cambios-sdd). Eran un catálogo
-- precargado que solo cambiaba con SQL. Ahora el administrador las crea, las renombra, las
-- desactiva y las reactiva directamente en la tabla, como las fincas (RF-04, Sprint 1): no
-- hacen falta funciones. No se borran: una desactivada no se ofrece para fincas nuevas, y las
-- fincas que ya la tienen la conservan.
--
-- Solo las columnas que edita la pantalla: el id y el estado inicial los pone la tabla.

grant insert (nombre), update (nombre, activo) on public.razon_social to authenticated;

create policy razon_social_insercion_administrador on public.razon_social
  for insert to authenticated
  with check ((select private.fn_rol()) = 4);

create policy razon_social_actualizacion_administrador on public.razon_social
  for update to authenticated
  using ((select private.fn_rol()) = 4)
  with check ((select private.fn_rol()) = 4);

comment on table public.razon_social is
  'Razones sociales del grupo. Las administra el administrador desde la aplicación (cambio 40); se desactiva, no se borra.';
