-- RF-13 / CU-13 · decidir_escalamiento (SDD 6.1.3, Tablas 29 y 30).
-- Se prueba a través del RPC, con el rol y el JWT de cada usuario. Los datos se crean dentro
-- de la transacción, en un área propia, y no dependen del seed. Los avisos se cuentan solo
-- entre los usuarios de la prueba: «staging» tiene sus propios aprobadores.
begin;

create extension if not exists pgtap with schema extensions;

select plan(47);

-- Datos de la prueba (como propietario) ------------------------------------------------

insert into public.razon_social (id, nombre)
values ('b3000000-0000-4000-8000-0000000000a1', 'RS pgTAP decidir');

insert into public.finca (id, razon_social_id, nombre)
values ('b3000000-0000-4000-8000-0000000000f1', 'b3000000-0000-4000-8000-0000000000a1', 'Finca pgTAP decidir');

insert into public.area (id, nombre)
values
  ('b3000000-0000-4000-8000-0000000000b1', 'Área pgTAP decidir'),
  ('b3000000-0000-4000-8000-0000000000b2', 'Área pgTAP decidir vecina');

insert into auth.users (instance_id, id, aud, role, email)
select '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', correo
from (
  values
    ('b3000000-0000-4000-8000-000000000001'::uuid, 'reportante@decidir.pgtap.test'),
    ('b3000000-0000-4000-8000-000000000002'::uuid, 'aprobador@decidir.pgtap.test'),
    ('b3000000-0000-4000-8000-000000000003'::uuid, 'aprobador.colega@decidir.pgtap.test'),
    ('b3000000-0000-4000-8000-000000000004'::uuid, 'aprobador.vecino@decidir.pgtap.test'),
    ('b3000000-0000-4000-8000-000000000005'::uuid, 'aprobador.inactivo@decidir.pgtap.test'),
    ('b3000000-0000-4000-8000-000000000006'::uuid, 'director@decidir.pgtap.test'),
    ('b3000000-0000-4000-8000-000000000007'::uuid, 'administrador@decidir.pgtap.test'),
    ('b3000000-0000-4000-8000-000000000008'::uuid, 'sin.perfil@decidir.pgtap.test'),
    ('b3000000-0000-4000-8000-00000000000a'::uuid, 'director.dos@decidir.pgtap.test'),
    ('b3000000-0000-4000-8000-00000000000b'::uuid, 'director.inactivo@decidir.pgtap.test')
) as u (id, correo);

insert into public.usuario (id, nombre, correo, rol_id, finca_id, area_id, activo)
values
  ('b3000000-0000-4000-8000-000000000001', 'Reportante', 'reportante@decidir.pgtap.test', 1, 'b3000000-0000-4000-8000-0000000000f1', null, true),
  ('b3000000-0000-4000-8000-000000000002', 'Aprobador', 'aprobador@decidir.pgtap.test', 2, null, 'b3000000-0000-4000-8000-0000000000b1', true),
  ('b3000000-0000-4000-8000-000000000003', 'Aprobador colega', 'aprobador.colega@decidir.pgtap.test', 2, null, 'b3000000-0000-4000-8000-0000000000b1', true),
  ('b3000000-0000-4000-8000-000000000004', 'Aprobador vecino', 'aprobador.vecino@decidir.pgtap.test', 2, null, 'b3000000-0000-4000-8000-0000000000b2', true),
  ('b3000000-0000-4000-8000-000000000005', 'Aprobador inactivo', 'aprobador.inactivo@decidir.pgtap.test', 2, null, 'b3000000-0000-4000-8000-0000000000b1', false),
  ('b3000000-0000-4000-8000-000000000006', 'Director', 'director@decidir.pgtap.test', 3, null, null, true),
  ('b3000000-0000-4000-8000-000000000007', 'Administrador', 'administrador@decidir.pgtap.test', 4, null, null, true),
  ('b3000000-0000-4000-8000-00000000000a', 'Director dos', 'director.dos@decidir.pgtap.test', 3, null, null, true),
  ('b3000000-0000-4000-8000-00000000000b', 'Director inactivo', 'director.inactivo@decidir.pgtap.test', 3, null, null, false);

insert into public.tipo_falla (id, nombre, nombre_normalizado, creado_por)
values ('b3000000-0000-4000-8000-0000000000c1', 'Tipo pgTAP decidir', 'tipo pgtap decidir', 'b3000000-0000-4000-8000-000000000007');

-- Una novedad por caso. d1 a d6, escaladas: d1, d2 y d6 se aprueban; d3 se rechaza; d4 recibe
-- los intentos que deben fallar; d5, la falla simulada del historial. El resto, una en cada
-- uno de los demás estados.
insert into public.novedad (
  id, id_local, finca_id, area_id, reportante_id, descripcion, prioridad, estado,
  fecha_registro, actualizado_en, tipo_falla_id, solucion, fecha_ejecucion
)
select
  ('b3000000-0000-4000-8000-0000000000d' || n.sufijo)::uuid,
  ('b3000000-0000-4000-8000-0000000000e' || n.sufijo)::uuid,
  'b3000000-0000-4000-8000-0000000000f1',
  'b3000000-0000-4000-8000-0000000000b1',
  'b3000000-0000-4000-8000-000000000001',
  'Novedad pgTAP decidir ' || n.sufijo,
  'alto',
  n.estado::public.estado_novedad,
  '2026-09-01 08:00:00-05',
  '2026-09-01 08:00:00-05',
  case when n.estado in ('resuelta', 'cerrada') then 'b3000000-0000-4000-8000-0000000000c1'::uuid end,
  case when n.estado in ('resuelta', 'cerrada') then 'Solución de prueba' end,
  case when n.estado in ('resuelta', 'cerrada') then date '2026-09-02' end
from (
  values
    ('1', 'escalada'), ('2', 'escalada'), ('3', 'escalada'), ('4', 'escalada'),
    ('5', 'escalada'), ('6', 'escalada'),
    ('7', 'registrada'), ('8', 'asignada'), ('9', 'en_atencion'), ('a', 'aprobada'),
    ('b', 'resuelta'), ('c', 'rechazada'), ('f', 'cerrada')
) as n (sufijo, estado);

-- CU-13 · curso normal: aprobar ---------------------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub": "b3000000-0000-4000-8000-000000000006", "role": "authenticated"}';

select lives_ok(
  $$ select public.decidir_escalamiento(
       'b3000000-0000-4000-8000-0000000000d1', true,
       '  Aprobado. Comprar con el proveedor habitual.  '
     ) $$,
  'RF-13 / CU-13 3–5: el director aprueba una novedad escalada con una observación'
);
select is(
  (select estado::text from public.novedad where id = 'b3000000-0000-4000-8000-0000000000d1'),
  'aprobada',
  'RF-13 / CU-13 6: la novedad queda aprobada'
);
select ok(
  (select actualizado_en > '2026-09-02'::timestamptz from public.novedad where id = 'b3000000-0000-4000-8000-0000000000d1'),
  'RF-16: actualizado_en refleja el cambio (lo mantiene el disparador)'
);
select results_eq(
  $$ select estado_anterior::text, estado_nuevo::text, usuario_id, observacion, area_anterior_id, area_nueva_id
     from public.historial_transicion
     where novedad_id = 'b3000000-0000-4000-8000-0000000000d1' $$,
  $$ values ('escalada', 'aprobada', 'b3000000-0000-4000-8000-000000000006'::uuid,
             'Aprobado. Comprar con el proveedor habitual.', null::uuid, null::uuid) $$,
  'RF-16 / CU-13 7: el historial registra escalada → aprobada a nombre del director, con su observación sin espacios sobrantes'
);
select results_eq(
  $$ select r.id, r.estado::text, r.area_id
     from public.decidir_escalamiento('b3000000-0000-4000-8000-0000000000d2', true) as r $$,
  $$ values ('b3000000-0000-4000-8000-0000000000d2'::uuid, 'aprobada', 'b3000000-0000-4000-8000-0000000000b1'::uuid) $$,
  'RF-13 / CU-13: aprueba sin observación y devuelve la novedad, que sigue en su área'
);
select is(
  (select observacion from public.historial_transicion where novedad_id = 'b3000000-0000-4000-8000-0000000000d2'),
  null,
  'RF-13: sin observación, el historial la deja nula'
);
select lives_ok(
  $$ select public.decidir_escalamiento('b3000000-0000-4000-8000-0000000000d6', true, E'   \n  ') $$,
  'RF-13: al aprobar, una observación de solo espacios se toma como vacía'
);
select is(
  (select observacion from public.historial_transicion where novedad_id = 'b3000000-0000-4000-8000-0000000000d6'),
  null,
  'RF-13: y queda nula en el historial'
);

-- CU-13 · curso normal: rechazar --------------------------------------------------------------

select lives_ok(
  $$ select public.decidir_escalamiento(
       'b3000000-0000-4000-8000-0000000000d3', false, 'No hay presupuesto este trimestre.'
     ) $$,
  'RF-13 / CU-13 3–5: el director rechaza una novedad escalada con una observación'
);
select is(
  (select estado::text from public.novedad where id = 'b3000000-0000-4000-8000-0000000000d3'),
  'rechazada',
  'RF-13 / CU-13 6: la novedad queda rechazada'
);
select results_eq(
  $$ select estado_anterior::text, estado_nuevo::text, usuario_id, observacion
     from public.historial_transicion
     where novedad_id = 'b3000000-0000-4000-8000-0000000000d3' $$,
  $$ values ('escalada', 'rechazada', 'b3000000-0000-4000-8000-000000000006'::uuid,
             'No hay presupuesto este trimestre.') $$,
  'RF-16 / CU-13 7: el historial registra escalada → rechazada con la observación'
);
select throws_ok(
  $$ select public.decidir_escalamiento('b3000000-0000-4000-8000-0000000000d3', true) $$,
  'P0001', 'TRANSICION_INVALIDA',
  'RF-13: una novedad rechazada es final: ya no se puede aprobar'
);

-- Otro director llega tarde --------------------------------------------------------------------

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "b3000000-0000-4000-8000-00000000000a", "role": "authenticated"}';

select throws_ok(
  $$ select public.decidir_escalamiento('b3000000-0000-4000-8000-0000000000d1', false, 'Yo la rechazo') $$,
  'P0001', 'TRANSICION_INVALIDA',
  'RF-13: si otro director ya decidió, el segundo recibe TRANSICION_INVALIDA'
);

-- CU-13 5a · la observación es obligatoria al rechazar -----------------------------------------

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "b3000000-0000-4000-8000-000000000006", "role": "authenticated"}';

select throws_ok(
  $$ select public.decidir_escalamiento('b3000000-0000-4000-8000-0000000000d4', false) $$,
  'P0001', 'DATO_OBLIGATORIO',
  'RF-13 / CU-13 5a: rechazar sin observación → DATO_OBLIGATORIO'
);
select throws_ok(
  $$ select public.decidir_escalamiento('b3000000-0000-4000-8000-0000000000d4', false, '') $$,
  'P0001', 'DATO_OBLIGATORIO',
  'RF-13 / CU-13 5a: rechazar con la observación vacía → DATO_OBLIGATORIO'
);
select throws_ok(
  $$ select public.decidir_escalamiento('b3000000-0000-4000-8000-0000000000d4', false, E'  \n\t  ') $$,
  'P0001', 'DATO_OBLIGATORIO',
  'RF-13 / CU-13 5a: rechazar con solo espacios y saltos de línea → DATO_OBLIGATORIO'
);
select throws_ok(
  $$ select public.decidir_escalamiento('b3000000-0000-4000-8000-0000000000d4', false, repeat('x', 501)) $$,
  'P0001', 'DATO_OBLIGATORIO',
  'RF-13: rechazar con más de 500 caracteres → DATO_OBLIGATORIO'
);
select throws_ok(
  $$ select public.decidir_escalamiento('b3000000-0000-4000-8000-0000000000d4', true, repeat('x', 501)) $$,
  'P0001', 'DATO_OBLIGATORIO',
  'RF-13: aprobar con una observación de más de 500 caracteres → DATO_OBLIGATORIO'
);
select throws_ok(
  $$ select public.decidir_escalamiento('b3000000-0000-4000-8000-0000000000d4', null, 'Sin decisión') $$,
  'P0001', 'DATO_OBLIGATORIO',
  'RF-13: sin decir si aprueba o rechaza → DATO_OBLIGATORIO'
);

-- Estados que no admiten la acción (SDD, Tabla 29) ------------------------------------------

select throws_ok(
  $$ select public.decidir_escalamiento('b3000000-0000-4000-8000-0000000000d7', true) $$,
  'P0001', 'TRANSICION_INVALIDA', 'RF-13: una novedad registrada no se decide'
);
select throws_ok(
  $$ select public.decidir_escalamiento('b3000000-0000-4000-8000-0000000000d8', true) $$,
  'P0001', 'TRANSICION_INVALIDA', 'RF-13: una novedad asignada no se decide'
);
select throws_ok(
  $$ select public.decidir_escalamiento('b3000000-0000-4000-8000-0000000000d9', true) $$,
  'P0001', 'TRANSICION_INVALIDA', 'RF-13: una novedad en atención no se decide: primero se escala'
);
select throws_ok(
  $$ select public.decidir_escalamiento('b3000000-0000-4000-8000-0000000000da', false, 'Cambio de opinión') $$,
  'P0001', 'TRANSICION_INVALIDA', 'RF-13: una novedad ya aprobada no se rechaza después'
);
select throws_ok(
  $$ select public.decidir_escalamiento('b3000000-0000-4000-8000-0000000000db', true) $$,
  'P0001', 'TRANSICION_INVALIDA', 'RF-13: una novedad resuelta no se decide'
);
select throws_ok(
  $$ select public.decidir_escalamiento('b3000000-0000-4000-8000-0000000000dc', true) $$,
  'P0001', 'TRANSICION_INVALIDA', 'RF-13: una novedad rechazada no se decide'
);
select throws_ok(
  $$ select public.decidir_escalamiento('b3000000-0000-4000-8000-0000000000df', true) $$,
  'P0001', 'TRANSICION_INVALIDA', 'RF-13: una novedad cerrada no se decide'
);
select throws_ok(
  $$ select public.decidir_escalamiento('b3000000-0000-4000-8000-0000000000ee', true) $$,
  'P0001', 'SIN_PERMISO',
  'RNF-11: una novedad que no existe responde igual que una fuera del alcance'
);

-- Roles: SIN_PERMISO ---------------------------------------------------------------------------

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "b3000000-0000-4000-8000-000000000001", "role": "authenticated"}';
select throws_ok(
  $$ select public.decidir_escalamiento('b3000000-0000-4000-8000-0000000000d4', true) $$,
  'P0001', 'SIN_PERMISO', 'RNF-11: el reportante no decide un escalamiento'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "b3000000-0000-4000-8000-000000000002", "role": "authenticated"}';
select throws_ok(
  $$ select public.decidir_escalamiento('b3000000-0000-4000-8000-0000000000d4', true) $$,
  'P0001', 'SIN_PERMISO', 'RNF-11: el aprobador que la escaló no la decide'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "b3000000-0000-4000-8000-000000000007", "role": "authenticated"}';
select throws_ok(
  $$ select public.decidir_escalamiento('b3000000-0000-4000-8000-0000000000d4', true) $$,
  'P0001', 'SIN_PERMISO', 'RNF-11: el administrador no decide un escalamiento'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "b3000000-0000-4000-8000-00000000000b", "role": "authenticated"}';
select throws_ok(
  $$ select public.decidir_escalamiento('b3000000-0000-4000-8000-0000000000d4', true) $$,
  'P0001', 'SIN_PERMISO', 'RNF-11: un director desactivado no decide'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "b3000000-0000-4000-8000-000000000008", "role": "authenticated"}';
select throws_ok(
  $$ select public.decidir_escalamiento('b3000000-0000-4000-8000-0000000000d4', true) $$,
  'P0001', 'SIN_PERMISO', 'RNF-11: una cuenta sin perfil no decide'
);

reset role;
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';
select throws_ok(
  $$ select public.decidir_escalamiento('b3000000-0000-4000-8000-0000000000d4', true) $$,
  '42501', null,
  'RNF-11: anon no puede ejecutar decidir_escalamiento'
);

-- El camino de la pantalla 18-C: el área ejecuta lo que el director aprobó ----------------------

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "b3000000-0000-4000-8000-000000000002", "role": "authenticated"}';

select lives_ok(
  $$ select public.registrar_solucion(
       'b3000000-0000-4000-8000-0000000000d1', 'Se compró y se instaló el repuesto.',
       (now() at time zone 'America/Bogota')::date, 'b3000000-0000-4000-8000-0000000000c1'
     ) $$,
  'RF-14 / CU-14: después de la aprobación, el aprobador del área registra la solución'
);
select is(
  (select estado::text from public.novedad where id = 'b3000000-0000-4000-8000-0000000000d1'),
  'resuelta',
  'RF-14: y la novedad aprobada queda resuelta'
);

-- Lo que quedó escrito (como propietario: nadie ve los avisos de otro) ------------------------

reset role;

select is(
  (select estado::text from public.novedad where id = 'b3000000-0000-4000-8000-0000000000d4'),
  'escalada',
  'RF-13: los intentos sin permiso o sin datos no cambian el estado'
);
select is(
  (select count(*)::int from public.historial_transicion where novedad_id = 'b3000000-0000-4000-8000-0000000000d4'),
  0,
  'RF-16: ni dejan nada en el historial'
);
select is(
  (select count(*)::int from public.notificacion where novedad_id = 'b3000000-0000-4000-8000-0000000000d4'),
  0,
  'RF-30: ni envían avisos'
);
select results_eq(
  $$ select destinatario_id, estado_nuevo::text
     from public.notificacion
     where novedad_id = 'b3000000-0000-4000-8000-0000000000d1' and estado_nuevo = 'aprobada'
     order by destinatario_id $$,
  $$ values
       ('b3000000-0000-4000-8000-000000000001'::uuid, 'aprobada'),
       ('b3000000-0000-4000-8000-000000000002'::uuid, 'aprobada'),
       ('b3000000-0000-4000-8000-000000000003'::uuid, 'aprobada') $$,
  'RF-30 / CU-13 8: la aprobación avisa a los aprobadores activos del área y al reportante'
);
select results_eq(
  $$ select destinatario_id, estado_nuevo::text
     from public.notificacion
     where novedad_id = 'b3000000-0000-4000-8000-0000000000d3'
     order by destinatario_id $$,
  $$ values
       ('b3000000-0000-4000-8000-000000000001'::uuid, 'rechazada'),
       ('b3000000-0000-4000-8000-000000000002'::uuid, 'rechazada'),
       ('b3000000-0000-4000-8000-000000000003'::uuid, 'rechazada') $$,
  'RF-30 / CU-13 8: el rechazo avisa a los mismos'
);
select is(
  (
    select count(*)::int
    from public.notificacion
    where novedad_id::text like 'b3000000-0000-4000-8000-0000000000d%'
      and destinatario_id in (
        'b3000000-0000-4000-8000-000000000004', 'b3000000-0000-4000-8000-000000000005',
        'b3000000-0000-4000-8000-000000000006', 'b3000000-0000-4000-8000-000000000007',
        'b3000000-0000-4000-8000-00000000000a', 'b3000000-0000-4000-8000-00000000000b'
      )
  ),
  0,
  'RF-30: no avisa al aprobador de otra área, al inactivo, a los directores ni al administrador'
);

-- CU-16 1a · si falla el historial, se revierte todo -----------------------------------------

create function pg_temp.tg_falla_del_historial()
returns trigger
language plpgsql
as $$
begin
  raise exception 'FALLA_SIMULADA_DEL_HISTORIAL';
end;
$$;

create trigger pgtap_falla_del_historial
  before insert on public.historial_transicion
  for each row execute function pg_temp.tg_falla_del_historial();

set local role authenticated;
set local request.jwt.claims = '{"sub": "b3000000-0000-4000-8000-000000000006", "role": "authenticated"}';

select throws_ok(
  $$ select public.decidir_escalamiento('b3000000-0000-4000-8000-0000000000d5', true, 'Aprobado.') $$,
  'P0001', 'FALLA_SIMULADA_DEL_HISTORIAL',
  'RF-16 / CU-16 1a: si el registro del historial falla, la función informa el error'
);

reset role;

select is(
  (select estado::text from public.novedad where id = 'b3000000-0000-4000-8000-0000000000d5'),
  'escalada',
  'RF-16 / CU-16 1a: y la novedad sigue escalada (se revierte el cambio de estado)'
);
select is(
  (select count(*)::int from public.notificacion where novedad_id = 'b3000000-0000-4000-8000-0000000000d5'),
  0,
  'RF-16 / CU-16 1a: ni se envía ningún aviso'
);

-- El contrato sigue intacto -------------------------------------------------------------------

select ok(
  has_function_privilege('authenticated', 'public.decidir_escalamiento(uuid, boolean, text)', 'execute'),
  'RF-13: authenticated conserva el permiso de ejecutar decidir_escalamiento'
);
select ok(
  (select p.prosecdef and p.proconfig @> array['search_path=""'] from pg_proc p where p.oid = 'public.decidir_escalamiento(uuid, boolean, text)'::regprocedure),
  'RNF-11: decidir_escalamiento sigue siendo security definer con search_path vacío'
);
select ok(
  not has_function_privilege('authenticated', 'private.texto_opcional(text)', 'execute')
  and not has_function_privilege('anon', 'private.texto_opcional(text)', 'execute'),
  'RNF-11: la auxiliar private.texto_opcional no la ejecutan los roles de la API'
);

select * from finish();
rollback;
