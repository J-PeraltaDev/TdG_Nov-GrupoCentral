-- RF-32 · reactivar_tipo_falla (cambio 39 de cambios-sdd). Con tipos propios, creados dentro de
-- la transacción: no toca los del seed.
begin;

create extension if not exists pgtap with schema extensions;

select plan(12);

-- Usuarios y tipos (como propietario) --------------------------------------------------

insert into public.area (id, nombre, activo)
values ('e9000000-0000-4000-8000-0000000000b1', 'Área pgTAP reactivar', true);

insert into auth.users (instance_id, id, aud, role, email)
select '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', correo
from (
  values
    ('e9000000-0000-4000-8000-000000000002'::uuid, 'aprobador@reactivar.pgtap.test'),
    ('e9000000-0000-4000-8000-000000000004'::uuid, 'administrador@reactivar.pgtap.test')
) as u (id, correo);

insert into public.usuario (id, nombre, correo, rol_id, finca_id, area_id, activo)
values
  ('e9000000-0000-4000-8000-000000000002', 'Aprobador', 'aprobador@reactivar.pgtap.test', 2, null, 'e9000000-0000-4000-8000-0000000000b1', true),
  ('e9000000-0000-4000-8000-000000000004', 'Administrador', 'administrador@reactivar.pgtap.test', 4, null, null, true);

-- t1 se desactiva y se reactiva; t2 se fusiona en t3.
insert into public.tipo_falla (id, nombre, nombre_normalizado, activo, creado_por)
values
  ('e9000000-0000-4000-8000-0000000000e1', 'Tipo pgTAP reactivar', 'tipo pgtap reactivar', true, 'e9000000-0000-4000-8000-000000000002'),
  ('e9000000-0000-4000-8000-0000000000e2', 'Tipo pgTAP fusionado', 'tipo pgtap fusionado', true, 'e9000000-0000-4000-8000-000000000002'),
  ('e9000000-0000-4000-8000-0000000000e3', 'Tipo pgTAP vigente', 'tipo pgtap vigente', true, 'e9000000-0000-4000-8000-000000000002');

set local role authenticated;

-- Quién puede --------------------------------------------------------------------------

set local request.jwt.claims = '{"sub": "e9000000-0000-4000-8000-000000000002", "role": "authenticated"}';
select throws_ok(
  $$ select public.reactivar_tipo_falla('e9000000-0000-4000-8000-0000000000e1') $$,
  'P0001', 'SIN_PERMISO', 'RF-32 (cambio 39): el aprobador no reactiva tipos'
);

select ok(
  not has_function_privilege('anon', 'public.reactivar_tipo_falla(uuid)', 'execute')
    and has_function_privilege('authenticated', 'public.reactivar_tipo_falla(uuid)', 'execute'),
  'RNF-11: anon no ejecuta reactivar_tipo_falla; authenticated sí'
);

-- Reactivar ----------------------------------------------------------------------------

set local request.jwt.claims = '{"sub": "e9000000-0000-4000-8000-000000000004", "role": "authenticated"}';

select throws_ok(
  $$ select public.reactivar_tipo_falla('e9000000-0000-4000-8000-0000000000e1') $$,
  'P0001', 'TIPO_FALLA_INVALIDO', 'RF-32 (cambio 39): un tipo activo no se reactiva'
);

select lives_ok(
  $$ select public.desactivar_tipo_falla('e9000000-0000-4000-8000-0000000000e1') $$,
  'RF-32: el administrador lo desactiva'
);

select is(
  (select public.reactivar_tipo_falla('e9000000-0000-4000-8000-0000000000e1')).activo,
  true,
  'RF-32 (cambio 39): el administrador reactiva un tipo desactivado'
);

select isnt_empty(
  $$ select s.id from public.sugerir_tipos_falla('pgtap reactivar') s $$,
  'RF-32 / RF-14: el tipo reactivado vuelve a las sugerencias'
);

select results_eq(
  $$
    select a.usuario_id, a.accion::text, a.valor_anterior
    from public.auditoria_tipo_falla a
    where a.tipo_falla_id = 'e9000000-0000-4000-8000-0000000000e1'
    order by a.fecha, a.accion
  $$,
  $$
    values
      ('e9000000-0000-4000-8000-000000000004'::uuid, 'desactivar', 'Tipo pgTAP reactivar'),
      ('e9000000-0000-4000-8000-000000000004'::uuid, 'reactivar', 'Tipo pgTAP reactivar')
  $$,
  'RF-32 (cambio 39): la reactivación queda auditada con el nombre del tipo'
);

select lives_ok(
  $$ select public.fusionar_tipos_falla('e9000000-0000-4000-8000-0000000000e2', 'e9000000-0000-4000-8000-0000000000e3') $$,
  'RF-32: el administrador fusiona otro'
);

select throws_ok(
  $$ select public.reactivar_tipo_falla('e9000000-0000-4000-8000-0000000000e2') $$,
  'P0001', 'TIPO_FALLA_INVALIDO',
  'RF-32 (cambio 39): un tipo fusionado no se reactiva: sus novedades ya son del destino'
);

select is(
  (select t.activo from public.tipo_falla t where t.id = 'e9000000-0000-4000-8000-0000000000e2'),
  false,
  'RF-32: el fusionado sigue inactivo'
);

select throws_ok(
  $$ select public.reactivar_tipo_falla('e9000000-0000-4000-8000-0000000000ff') $$,
  'P0001', 'TIPO_FALLA_INVALIDO', 'RF-32 (cambio 39): un tipo que no existe tampoco'
);

reset role;

select is(
  (select count(*)::int from public.notificacion n
   join public.novedad v on v.id = n.novedad_id
   where v.tipo_falla_id = 'e9000000-0000-4000-8000-0000000000e1'),
  0,
  'RF-32: reactivar no avisa a nadie (Tabla 30)'
);

select * from finish();

rollback;
