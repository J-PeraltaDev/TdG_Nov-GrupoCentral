-- RF-16 / CU-16 · RNF-12: el historial solo admite inserción, y restricciones del modelo.
begin;

create extension if not exists pgtap with schema extensions;

select plan(12);

-- Datos de la prueba (como propietario de las tablas) -----------------------------------

insert into public.razon_social (id, nombre)
values ('20000000-0000-4000-8000-0000000000a1', 'RS pgTAP historial');

insert into public.finca (id, razon_social_id, nombre)
values ('20000000-0000-4000-8000-0000000000f1', '20000000-0000-4000-8000-0000000000a1', 'Finca pgTAP historial');

insert into auth.users (instance_id, id, aud, role, email)
values
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'reportante.historial@pgtap.test'),
  ('00000000-0000-0000-0000-000000000000', '20000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'sin.perfil@pgtap.test');

insert into public.usuario (id, nombre, correo, rol_id, finca_id)
values ('20000000-0000-4000-8000-000000000001', 'Reportante pgTAP historial', 'reportante.historial@pgtap.test', 1, '20000000-0000-4000-8000-0000000000f1');

insert into public.novedad (id, id_local, finca_id, area_id, reportante_id, descripcion, prioridad, estado, fecha_registro, actualizado_en)
values (
  '20000000-0000-4000-8000-0000000000d1', '20000000-0000-4000-8000-0000000000e1', '20000000-0000-4000-8000-0000000000f1',
  (select id from public.area where nombre = 'Sistemas'), '20000000-0000-4000-8000-000000000001',
  'La impresora de la bodega no imprime', 'normal', 'asignada', now() - interval '2 days', now() - interval '2 days'
);

insert into public.historial_transicion (novedad_id, usuario_id, estado_anterior, estado_nuevo)
values ('20000000-0000-4000-8000-0000000000d1', '20000000-0000-4000-8000-000000000001', null, 'registrada');

-- RNF-12: ni el propietario puede alterar el historial -----------------------------------

select throws_ok(
  $$ update public.historial_transicion set observacion = 'editado' where novedad_id = '20000000-0000-4000-8000-0000000000d1' $$,
  'P0001', 'HISTORIAL_INMUTABLE',
  'RNF-12 / CU-16: actualizar el historial lanza una excepción, también para el propietario'
);
select throws_ok(
  $$ delete from public.historial_transicion where novedad_id = '20000000-0000-4000-8000-0000000000d1' $$,
  'P0001', 'HISTORIAL_INMUTABLE',
  'RNF-12 / CU-16: borrar del historial lanza una excepción, también para el propietario'
);
select throws_ok(
  'truncate public.historial_transicion',
  'P0001', 'HISTORIAL_INMUTABLE',
  'RNF-12 / CU-16: vaciar el historial lanza una excepción, también para el propietario'
);
select is(
  (select count(*)::int from public.historial_transicion where novedad_id = '20000000-0000-4000-8000-0000000000d1'),
  1,
  'RNF-12: el registro del historial sigue intacto'
);
select lives_ok(
  $$ insert into public.historial_transicion (novedad_id, usuario_id, estado_anterior, estado_nuevo)
     values ('20000000-0000-4000-8000-0000000000d1', '20000000-0000-4000-8000-000000000001', 'registrada', 'asignada') $$,
  'RF-16: el historial sí admite inserciones'
);
select results_eq(
  $$ select estado_nuevo::text from public.historial_transicion where novedad_id = '20000000-0000-4000-8000-0000000000d1' order by id $$,
  $$ values ('registrada'), ('asignada') $$,
  'RF-16: el identificador secuencial conserva el orden de las transiciones'
);

-- actualizado_en de la novedad -------------------------------------------------------------

update public.novedad set prioridad = 'alto' where id = '20000000-0000-4000-8000-0000000000d1';

select ok(
  (select actualizado_en > now() - interval '1 minute' from public.novedad where id = '20000000-0000-4000-8000-0000000000d1'),
  'RF-16: al cambiar la novedad se actualiza actualizado_en'
);

-- Restricciones del modelo (SDD, Tabla 26) -----------------------------------------------

select throws_ok(
  $$ update public.novedad set descripcion = '   ' where id = '20000000-0000-4000-8000-0000000000d1' $$,
  '23514', null,
  'RF-05: la descripción no puede quedar vacía'
);
select throws_ok(
  $$ update public.novedad set descripcion = repeat('a', 501) where id = '20000000-0000-4000-8000-0000000000d1' $$,
  '23514', null,
  'RF-05: la descripción no puede pasar de 500 caracteres'
);
select throws_ok(
  $$ update public.novedad set estado = 'resuelta' where id = '20000000-0000-4000-8000-0000000000d1' $$,
  '23514', null,
  'RF-14: una novedad resuelta exige tipo de falla, solución y fecha de ejecución'
);
select throws_ok(
  $$ insert into public.usuario (id, nombre, correo, rol_id)
     values ('20000000-0000-4000-8000-000000000002', 'Reportante sin finca', 'sin.perfil@pgtap.test', 1) $$,
  '23514', null,
  'RF-03: un reportante debe tener finca'
);
select throws_ok(
  $$ insert into public.usuario (id, nombre, correo, rol_id, finca_id)
     values ('20000000-0000-4000-8000-000000000002', 'Director con finca', 'sin.perfil@pgtap.test', 3, '20000000-0000-4000-8000-0000000000f1') $$,
  '23514', null,
  'RF-03: el director no lleva finca ni área'
);

select * from finish();
rollback;
