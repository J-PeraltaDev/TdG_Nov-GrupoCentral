-- RF-09 / CU-09 · Bandeja del área: orden por prioridad y antigüedad (SDD 6.1.11).
-- La bandeja lee v_novedad con la sesión del aprobador y pide `order by prioridad,
-- fecha_registro`. Aquí se comprueba que ese orden es crítico, alto, normal, bajo (el de
-- declaración del tipo, no el alfabético) y que cada área solo ve lo suyo.
begin;

create extension if not exists pgtap with schema extensions;

select plan(6);

-- Datos de la prueba (como propietario) ------------------------------------------------

insert into public.razon_social (id, nombre)
values ('90000000-0000-4000-8000-0000000000a1', 'RS pgTAP bandeja');

insert into public.finca (id, razon_social_id, nombre)
values ('90000000-0000-4000-8000-0000000000f1', '90000000-0000-4000-8000-0000000000a1', 'Finca pgTAP bandeja');

insert into public.area (id, nombre)
values
  ('90000000-0000-4000-8000-0000000000b1', 'Área pgTAP bandeja'),
  ('90000000-0000-4000-8000-0000000000b2', 'Área pgTAP bandeja vecina');

insert into auth.users (instance_id, id, aud, role, email)
select '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', correo
from (
  values
    ('90000000-0000-4000-8000-000000000001'::uuid, 'reportante@bandeja.pgtap.test'),
    ('90000000-0000-4000-8000-000000000002'::uuid, 'aprobador@bandeja.pgtap.test'),
    ('90000000-0000-4000-8000-000000000003'::uuid, 'aprobador.vecino@bandeja.pgtap.test')
) as u (id, correo);

insert into public.usuario (id, nombre, correo, rol_id, finca_id, area_id)
values
  ('90000000-0000-4000-8000-000000000001', 'Reportante bandeja', 'reportante@bandeja.pgtap.test', 1, '90000000-0000-4000-8000-0000000000f1', null),
  ('90000000-0000-4000-8000-000000000002', 'Aprobador bandeja', 'aprobador@bandeja.pgtap.test', 2, null, '90000000-0000-4000-8000-0000000000b1'),
  ('90000000-0000-4000-8000-000000000003', 'Aprobador vecino', 'aprobador.vecino@bandeja.pgtap.test', 2, null, '90000000-0000-4000-8000-0000000000b2');

-- Se insertan desordenadas a propósito: la más antigua es la de prioridad más baja.
insert into public.novedad (id_local, finca_id, area_id, reportante_id, descripcion, prioridad, estado, fecha_registro)
values
  ('90000000-0000-4000-8000-0000000000e1', '90000000-0000-4000-8000-0000000000f1', '90000000-0000-4000-8000-0000000000b1', '90000000-0000-4000-8000-000000000001', 'baja, la más antigua', 'bajo', 'asignada', '2026-09-20 08:00:00-05'),
  ('90000000-0000-4000-8000-0000000000e2', '90000000-0000-4000-8000-0000000000f1', '90000000-0000-4000-8000-0000000000b1', '90000000-0000-4000-8000-000000000001', 'normal', 'normal', 'asignada', '2026-09-21 08:00:00-05'),
  ('90000000-0000-4000-8000-0000000000e3', '90000000-0000-4000-8000-0000000000f1', '90000000-0000-4000-8000-0000000000b1', '90000000-0000-4000-8000-000000000001', 'crítica reciente', 'critico', 'asignada', '2026-09-24 08:00:00-05'),
  ('90000000-0000-4000-8000-0000000000e4', '90000000-0000-4000-8000-0000000000f1', '90000000-0000-4000-8000-0000000000b1', '90000000-0000-4000-8000-000000000001', 'alta', 'alto', 'aprobada', '2026-09-22 08:00:00-05'),
  ('90000000-0000-4000-8000-0000000000e5', '90000000-0000-4000-8000-0000000000f1', '90000000-0000-4000-8000-0000000000b1', '90000000-0000-4000-8000-000000000001', 'crítica antigua', 'critico', 'asignada', '2026-09-23 08:00:00-05'),
  ('90000000-0000-4000-8000-0000000000e6', '90000000-0000-4000-8000-0000000000f1', '90000000-0000-4000-8000-0000000000b1', '90000000-0000-4000-8000-000000000001', 'en atención', 'critico', 'en_atencion', '2026-09-19 08:00:00-05'),
  ('90000000-0000-4000-8000-0000000000e7', '90000000-0000-4000-8000-0000000000f1', '90000000-0000-4000-8000-0000000000b2', '90000000-0000-4000-8000-000000000001', 'del área vecina', 'critico', 'asignada', '2026-09-18 08:00:00-05');

-- La columna conserva el tipo enumerado: por eso la API ordena por declaración -------------

select is(
  (
    select a.atttypid
    from pg_attribute a
    where a.attrelid = 'public.v_novedad'::regclass and a.attname = 'prioridad'
  ),
  'public.prioridad_novedad'::regtype::oid,
  'RF-09: v_novedad.prioridad conserva el tipo prioridad_novedad (el orden es el de su declaración)'
);

-- Como el aprobador del área ----------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub": "90000000-0000-4000-8000-000000000002", "role": "authenticated"}';

select results_eq(
  $$ select descripcion
     from public.v_novedad
     where area_id = '90000000-0000-4000-8000-0000000000b1' and estado in ('asignada', 'aprobada')
     order by prioridad, fecha_registro, codigo $$,
  $$ values ('crítica antigua'), ('crítica reciente'), ('alta'), ('normal'), ('baja, la más antigua') $$,
  'RF-09 / CU-09 2: «Por atender» sale por prioridad (crítico, alto, normal, bajo) y luego la más antigua primero'
);
select results_eq(
  $$ select descripcion
     from public.v_novedad
     where area_id = '90000000-0000-4000-8000-0000000000b1' and estado in ('en_atencion')
     order by prioridad, fecha_registro, codigo $$,
  $$ values ('en atención') $$,
  'RF-09: «En atención» solo trae las que están en atención'
);
select is(
  (
    select count(*)::int
    from public.v_novedad
    where area_id = '90000000-0000-4000-8000-0000000000b1' and estado in ('escalada', 'resuelta')
  ),
  0,
  'RF-09 / CU-09 2b: una pestaña sin novedades devuelve cero filas, sin error'
);
select is(
  (select count(*)::int from public.v_novedad where descripcion = 'del área vecina'),
  0,
  'RNF-11: el aprobador no recibe las novedades de otra área aunque no filtre por la suya'
);

-- Como el aprobador del área vecina -----------------------------------------------------------

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "90000000-0000-4000-8000-000000000003", "role": "authenticated"}';

select results_eq(
  $$ select descripcion from public.v_novedad order by prioridad, fecha_registro, codigo $$,
  $$ values ('del área vecina') $$,
  'RNF-11: cada área ve solo su bandeja'
);

select * from finish();
rollback;
