-- RF-02 / CU-02 · recuperar la contraseña: solicitar_recuperacion, generar_codigo_recuperacion
-- y consumir_codigo_recuperacion (SDD 6.1.10; ADR 0013).
-- Se prueban a través del RPC, con el rol de cada quien: anon (sin sesión), authenticated con
-- el JWT de cada usuario y service_role (la Edge Function). Los datos se crean dentro de la
-- transacción y no dependen del seed. El código que genera el administrador solo existe en su
-- respuesta: la prueba lo guarda en una variable de la transacción para usarlo después, dentro
-- de un bloque `do`, para que no salga impreso.
begin;

create extension if not exists pgtap with schema extensions;

select plan(60);

-- Datos de la prueba (como propietario) ------------------------------------------------

insert into public.razon_social (id, nombre)
values ('c2000000-0000-4000-8000-0000000000a1', 'RS pgTAP recuperar');

insert into public.finca (id, razon_social_id, nombre)
values ('c2000000-0000-4000-8000-0000000000f1', 'c2000000-0000-4000-8000-0000000000a1', 'Finca pgTAP recuperar');

insert into public.area (id, nombre)
values ('c2000000-0000-4000-8000-0000000000b1', 'Área pgTAP recuperar');

insert into auth.users (instance_id, id, aud, role, email)
select '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', correo
from (
  values
    ('c2000000-0000-4000-8000-000000000001'::uuid, 'administrador@recuperar.pgtap.test'),
    ('c2000000-0000-4000-8000-000000000002'::uuid, 'ana@recuperar.pgtap.test'),
    ('c2000000-0000-4000-8000-000000000003'::uuid, 'inactivo@recuperar.pgtap.test'),
    ('c2000000-0000-4000-8000-000000000004'::uuid, 'aprobador@recuperar.pgtap.test'),
    ('c2000000-0000-4000-8000-000000000005'::uuid, 'director@recuperar.pgtap.test'),
    ('c2000000-0000-4000-8000-000000000006'::uuid, 'beto@recuperar.pgtap.test'),
    ('c2000000-0000-4000-8000-000000000007'::uuid, 'administrador.inactivo@recuperar.pgtap.test'),
    ('c2000000-0000-4000-8000-000000000008'::uuid, 'carla@recuperar.pgtap.test'),
    ('c2000000-0000-4000-8000-000000000009'::uuid, 'diego@recuperar.pgtap.test')
) as u (id, correo);

insert into public.usuario (id, nombre, correo, rol_id, finca_id, area_id, activo)
values
  ('c2000000-0000-4000-8000-000000000001', 'Administrador', 'administrador@recuperar.pgtap.test', 4, null, null, true),
  ('c2000000-0000-4000-8000-000000000002', 'Ana', 'ana@recuperar.pgtap.test', 1, 'c2000000-0000-4000-8000-0000000000f1', null, true),
  ('c2000000-0000-4000-8000-000000000003', 'Inactivo', 'inactivo@recuperar.pgtap.test', 1, 'c2000000-0000-4000-8000-0000000000f1', null, false),
  ('c2000000-0000-4000-8000-000000000004', 'Aprobador', 'aprobador@recuperar.pgtap.test', 2, null, 'c2000000-0000-4000-8000-0000000000b1', true),
  ('c2000000-0000-4000-8000-000000000005', 'Director', 'director@recuperar.pgtap.test', 3, null, null, true),
  ('c2000000-0000-4000-8000-000000000006', 'Beto', 'beto@recuperar.pgtap.test', 1, 'c2000000-0000-4000-8000-0000000000f1', null, true),
  ('c2000000-0000-4000-8000-000000000007', 'Administrador inactivo', 'administrador.inactivo@recuperar.pgtap.test', 4, null, null, false),
  ('c2000000-0000-4000-8000-000000000008', 'Carla', 'carla@recuperar.pgtap.test', 1, 'c2000000-0000-4000-8000-0000000000f1', null, true),
  ('c2000000-0000-4000-8000-000000000009', 'Diego', 'diego@recuperar.pgtap.test', 1, 'c2000000-0000-4000-8000-0000000000f1', null, true);

-- Cuántas solicitudes tiene un usuario de la prueba.
create function pg_temp.solicitudes(p_usuario text)
returns integer
language sql
as $$
  select count(*)::integer
  from public.solicitud_recuperacion s
  where s.usuario_id = ('c2000000-0000-4000-8000-00000000000' || p_usuario)::uuid;
$$;

-- El esquema y los privilegios -----------------------------------------------------------------

select col_type_is(
  'public', 'solicitud_recuperacion', 'intentos_fallidos', 'smallint',
  'RF-02: la solicitud cuenta los intentos fallidos de su código'
);
select ok(
  has_function_privilege('anon', 'public.solicitar_recuperacion(text)', 'execute')
  and has_function_privilege('authenticated', 'public.solicitar_recuperacion(text)', 'execute'),
  'RF-02 / ADR 0013: solicitar_recuperacion se ejecuta sin sesión'
);
select ok(
  not has_function_privilege('anon', 'public.generar_codigo_recuperacion(uuid)', 'execute')
  and has_function_privilege('authenticated', 'public.generar_codigo_recuperacion(uuid)', 'execute'),
  'RNF-11: generar_codigo_recuperacion exige sesión'
);
select ok(
  has_function_privilege('service_role', 'public.consumir_codigo_recuperacion(text, text)', 'execute')
  and not has_function_privilege('authenticated', 'public.consumir_codigo_recuperacion(text, text)', 'execute')
  and not has_function_privilege('anon', 'public.consumir_codigo_recuperacion(text, text)', 'execute'),
  'RNF-11: consumir_codigo_recuperacion solo la ejecuta service_role (la Edge Function)'
);
select ok(
  (
    select bool_and(p.prosecdef and p.proconfig @> array['search_path=""'])
    from pg_proc p
    where p.oid in (
      'public.solicitar_recuperacion(text)'::regprocedure,
      'public.generar_codigo_recuperacion(uuid)'::regprocedure,
      'public.consumir_codigo_recuperacion(text, text)'::regprocedure
    )
  ),
  'RNF-11: las tres son security definer con search_path vacío'
);
select ok(
  not has_column_privilege('authenticated', 'public.solicitud_recuperacion', 'codigo_hash', 'select')
  and not has_table_privilege('anon', 'public.solicitud_recuperacion', 'select')
  and not has_table_privilege('authenticated', 'public.solicitud_recuperacion', 'insert')
  and not has_table_privilege('authenticated', 'public.solicitud_recuperacion', 'update'),
  'RNF-11: el resumen del código no sale por la API, anon no lee la tabla y nadie la escribe directamente'
);

-- CU-02 3 y 4 · solicitar, sin sesión ------------------------------------------------------------

set local role anon;
set local request.jwt.claims = '{"role": "anon"}';

select lives_ok(
  $$ select public.solicitar_recuperacion('  Ana@Recuperar.PGTAP.test ') $$,
  'RF-02 / CU-02 3: quien olvidó su contraseña pide la recuperación sin sesión, con el correo como lo escriba'
);
select throws_ok(
  $$ select count(*) from public.solicitud_recuperacion $$,
  '42501', null,
  'RNF-11: anon no puede leer las solicitudes'
);
-- CU-02 4a: nada de esto crea una solicitud ni responde distinto.
select lives_ok(
  $$ select public.solicitar_recuperacion('nadie@recuperar.pgtap.test') $$,
  'RF-02 / CU-02 4a: con un correo que no existe responde igual'
);
select lives_ok(
  $$ select public.solicitar_recuperacion('inactivo@recuperar.pgtap.test') $$,
  'RF-02 / CU-02 4a: con el correo de un usuario inactivo responde igual'
);
select lives_ok(
  $$ select public.solicitar_recuperacion(null), public.solicitar_recuperacion(''), public.solicitar_recuperacion('   ') $$,
  'RF-02 / CU-02 4a: sin correo responde igual'
);
select lives_ok(
  $$ select public.solicitar_recuperacion(repeat('x', 5000) || '@recuperar.pgtap.test') $$,
  'RF-02: un correo enorme no hace nada, y tampoco falla'
);
select lives_ok(
  $$ select public.solicitar_recuperacion('ana@recuperar.pgtap.test') $$,
  'RF-02: pedirla otra vez con una abierta responde igual'
);

reset role;

select is(pg_temp.solicitudes('2'), 1, 'RF-02 / CU-02 4: quedó una sola solicitud de la usuaria, aunque la pidió dos veces');
select results_eq(
  $$ select codigo_hash, expira_en, usado, intentos_fallidos
     from public.solicitud_recuperacion where usuario_id = 'c2000000-0000-4000-8000-000000000002' $$,
  $$ values (null::text, null::timestamptz, false, 0::smallint) $$,
  'RF-02 / CU-02 4: la solicitud queda pendiente: sin código, sin usar y sin intentos'
);
select is(
  (select count(*)::int from public.solicitud_recuperacion s
   join public.usuario u on u.id = s.usuario_id
   where u.correo like '%@recuperar.pgtap.test' and u.id <> 'c2000000-0000-4000-8000-000000000002'),
  0,
  'RF-02 / CU-02 4a: ni el correo inexistente, ni el inactivo, ni el vacío crearon nada'
);
select throws_ok(
  $$ insert into public.solicitud_recuperacion (usuario_id) values ('c2000000-0000-4000-8000-000000000002') $$,
  '23505', null,
  'RF-02: el índice único impide dos solicitudes pendientes del mismo usuario, aunque lleguen a la vez'
);

-- CU-02 5 y 6 · el administrador genera el código ------------------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub": "c2000000-0000-4000-8000-000000000001", "role": "authenticated"}';

select results_eq(
  $$ select usuario_id, usado, expira_en, intentos_fallidos::int from public.solicitud_recuperacion
     where usuario_id = 'c2000000-0000-4000-8000-000000000002' $$,
  $$ values ('c2000000-0000-4000-8000-000000000002'::uuid, false, null::timestamptz, 0) $$,
  'RF-02 / CU-02 5: el administrador ve la solicitud pendiente, con sus intentos'
);
select throws_ok(
  $$ select codigo_hash from public.solicitud_recuperacion limit 1 $$,
  '42501', null,
  'RNF-11: ni el administrador lee el resumen del código'
);

-- El código solo existe en esta respuesta: se guarda en la transacción para usarlo después.
do $$
begin
  perform set_config(
    'prueba.codigo',
    (
      select g.codigo
      from public.generar_codigo_recuperacion(
        (select s.id from public.solicitud_recuperacion s where s.usuario_id = 'c2000000-0000-4000-8000-000000000002')
      ) as g
    ),
    true
  );
end;
$$;

select matches(
  current_setting('prueba.codigo'), '^[0-9]{6}$',
  'RF-02 / CU-02 6: el código temporal tiene seis dígitos'
);
select ok(
  (select expira_en between now() + interval '29 minutes' and now() + interval '31 minutes'
   from public.solicitud_recuperacion where usuario_id = 'c2000000-0000-4000-8000-000000000002'),
  'RF-02 / CU-02 6: vence a los 30 minutos'
);

reset role;

select ok(
  (
    select s.codigo_hash <> current_setting('prueba.codigo')
      and s.codigo_hash not like '%' || current_setting('prueba.codigo') || '%'
      and extensions.crypt(current_setting('prueba.codigo'), s.codigo_hash) = s.codigo_hash
    from public.solicitud_recuperacion s
    where s.usuario_id = 'c2000000-0000-4000-8000-000000000002'
  ),
  'RNF-11: en la base queda solo el resumen con sal del código, nunca el código'
);

-- Un código nuevo reemplaza al anterior.
do $$
begin
  perform set_config('prueba.codigo_viejo', current_setting('prueba.codigo'), true);
end;
$$;

set local role authenticated;
set local request.jwt.claims = '{"sub": "c2000000-0000-4000-8000-000000000001", "role": "authenticated"}';

do $$
begin
  perform set_config(
    'prueba.codigo',
    (
      select g.codigo
      from public.generar_codigo_recuperacion(
        (select s.id from public.solicitud_recuperacion s where s.usuario_id = 'c2000000-0000-4000-8000-000000000002')
      ) as g
    ),
    true
  );
end;
$$;

reset role;

select ok(
  (
    select extensions.crypt(current_setting('prueba.codigo'), s.codigo_hash) = s.codigo_hash
      and (
        current_setting('prueba.codigo') = current_setting('prueba.codigo_viejo')
        or extensions.crypt(current_setting('prueba.codigo_viejo'), s.codigo_hash) <> s.codigo_hash
      )
    from public.solicitud_recuperacion s
    where s.usuario_id = 'c2000000-0000-4000-8000-000000000002'
  ),
  'RF-02: «Generar otro código» reemplaza el resumen: el código anterior deja de servir'
);

-- Con un código vigente, pedir otra solicitud no crea nada (decisión 11).
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';
select lives_ok(
  $$ select public.solicitar_recuperacion('ana@recuperar.pgtap.test') $$,
  'RF-02: con un código vigente, pedir la recuperación otra vez responde igual'
);
reset role;
select is(pg_temp.solicitudes('2'), 1, 'RF-02: y no crea otra solicitud');

-- RNF-11 · solo un administrador activo genera códigos ---------------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub": "c2000000-0000-4000-8000-000000000002", "role": "authenticated"}';
select throws_ok(
  $$ select * from public.generar_codigo_recuperacion('c2000000-0000-4000-8000-0000000000ee') $$,
  'P0001', 'SIN_PERMISO', 'RNF-11: el reportante no genera códigos'
);
select is(
  (select count(*)::int from public.solicitud_recuperacion),
  0,
  'RNF-11: ni ve las solicitudes, ni siquiera la suya'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "c2000000-0000-4000-8000-000000000004", "role": "authenticated"}';
select throws_ok(
  $$ select * from public.generar_codigo_recuperacion('c2000000-0000-4000-8000-0000000000ee') $$,
  'P0001', 'SIN_PERMISO', 'RNF-11: el aprobador no genera códigos'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "c2000000-0000-4000-8000-000000000005", "role": "authenticated"}';
select throws_ok(
  $$ select * from public.generar_codigo_recuperacion('c2000000-0000-4000-8000-0000000000ee') $$,
  'P0001', 'SIN_PERMISO', 'RNF-11: el director no genera códigos'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "c2000000-0000-4000-8000-000000000007", "role": "authenticated"}';
select throws_ok(
  $$ select * from public.generar_codigo_recuperacion('c2000000-0000-4000-8000-0000000000ee') $$,
  'P0001', 'SIN_PERMISO', 'RNF-11: un administrador desactivado no genera códigos'
);

reset role;
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';
select throws_ok(
  $$ select * from public.generar_codigo_recuperacion('c2000000-0000-4000-8000-0000000000ee') $$,
  '42501', null, 'RNF-11: anon no puede ejecutar generar_codigo_recuperacion'
);
select throws_ok(
  $$ select * from public.consumir_codigo_recuperacion('ana@recuperar.pgtap.test', '000000') $$,
  '42501', null, 'RNF-11: anon no puede ejecutar consumir_codigo_recuperacion'
);

reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "c2000000-0000-4000-8000-000000000001", "role": "authenticated"}';
select throws_ok(
  $$ select * from public.consumir_codigo_recuperacion('ana@recuperar.pgtap.test', '000000') $$,
  '42501', null, 'RNF-11: ni el administrador puede ejecutar consumir_codigo_recuperacion'
);
select throws_ok(
  $$ select * from public.generar_codigo_recuperacion('c2000000-0000-4000-8000-0000000000ee') $$,
  'P0001', 'SOLICITUD_INVALIDA',
  'RF-02: una solicitud que no existe → SOLICITUD_INVALIDA'
);

-- CU-02 9 y 9b · la Edge Function consume el código ------------------------------------------------
-- La función solo ejecuta la RPC: no necesita leer la tabla, y en un proyecto donde las tablas no
-- se exponen solas (el CI, «PROYECTO») service_role no puede. Lo que la prueba comprueba en la
-- tabla lo lee como su dueño.

reset role;
set local role service_role;

select results_eq(
  $$ select resultado, usuario_id from public.consumir_codigo_recuperacion('nadie@recuperar.pgtap.test', '123456') $$,
  $$ values ('CODIGO_INVALIDO', null::uuid) $$,
  'RF-02 / CU-02 9b: con un correo que no existe → CODIGO_INVALIDO, sin decir que no existe'
);
select results_eq(
  $$ select resultado, usuario_id from public.consumir_codigo_recuperacion('beto@recuperar.pgtap.test', '123456') $$,
  $$ values ('CODIGO_INVALIDO', null::uuid) $$,
  'RF-02: con un usuario que no ha pedido nada → la misma respuesta'
);
select results_eq(
  $$ select resultado from public.consumir_codigo_recuperacion('ana@recuperar.pgtap.test', '12345') $$,
  $$ values ('CODIGO_INVALIDO') $$,
  'RF-02: un código que no tiene seis dígitos → CODIGO_INVALIDO'
);
select results_eq(
  $$ select resultado from public.consumir_codigo_recuperacion('ana@recuperar.pgtap.test', null) $$,
  $$ values ('CODIGO_INVALIDO') $$,
  'RF-02: sin código → CODIGO_INVALIDO'
);
reset role;
select is(
  (select intentos_fallidos::int from public.solicitud_recuperacion where usuario_id = 'c2000000-0000-4000-8000-000000000002'),
  0,
  'RF-02: un código mal formado no gasta un intento'
);
set local role service_role;
-- Un código de seis dígitos que no es el suyo.
select results_eq(
  format(
    $f$ select resultado, usuario_id from public.consumir_codigo_recuperacion('ana@recuperar.pgtap.test', %L) $f$,
    lpad(((current_setting('prueba.codigo')::int + 1) % 1000000)::text, 6, '0')
  ),
  $$ values ('CODIGO_INVALIDO', null::uuid) $$,
  'RF-02 / CU-02 9b: con un código incorrecto → CODIGO_INVALIDO'
);
reset role;
select results_eq(
  $$ select intentos_fallidos::int, usado from public.solicitud_recuperacion
     where usuario_id = 'c2000000-0000-4000-8000-000000000002' $$,
  $$ values (1, false) $$,
  'RF-02 / CU-02 9b: suma un intento fallido y la solicitud sigue sirviendo'
);
set local role service_role;
select results_eq(
  format(
    $f$ select resultado, usuario_id from public.consumir_codigo_recuperacion('  ANA@recuperar.pgtap.test ', %L) $f$,
    current_setting('prueba.codigo')
  ),
  $$ values ('OK', 'c2000000-0000-4000-8000-000000000002'::uuid) $$,
  'RF-02 / CU-02 9: con el código correcto → OK y el usuario, con el correo como lo escriba'
);
reset role;
select is(
  (select usado from public.solicitud_recuperacion where usuario_id = 'c2000000-0000-4000-8000-000000000002'),
  true,
  'RF-02 / CU-02 9: el código queda usado'
);
set local role service_role;
select results_eq(
  format(
    $f$ select resultado, usuario_id from public.consumir_codigo_recuperacion('ana@recuperar.pgtap.test', %L) $f$,
    current_setting('prueba.codigo')
  ),
  $$ values ('CODIGO_VENCIDO', null::uuid) $$,
  'RF-02 / CU-02 9a: el mismo código por segunda vez → CODIGO_VENCIDO'
);

-- Con la solicitud usada, el administrador ya no puede generarle otro código, y la usuaria
-- puede pedir una solicitud nueva.
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "c2000000-0000-4000-8000-000000000001", "role": "authenticated"}';
select throws_ok(
  $$ select * from public.generar_codigo_recuperacion(
       (select id from public.solicitud_recuperacion where usuario_id = 'c2000000-0000-4000-8000-000000000002')
     ) $$,
  'P0001', 'SOLICITUD_INVALIDA',
  'RF-02: una solicitud ya usada → SOLICITUD_INVALIDA'
);
reset role;
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';
select lives_ok(
  $$ select public.solicitar_recuperacion('ana@recuperar.pgtap.test') $$,
  'RF-02: con la anterior usada, puede pedir otra'
);
reset role;
select is(pg_temp.solicitudes('2'), 2, 'RF-02: y esta vez sí se crea');

-- CU-02 9a · el código vence ---------------------------------------------------------------------

set local role anon;
set local request.jwt.claims = '{"role": "anon"}';
select lives_ok(
  $$ select public.solicitar_recuperacion('diego@recuperar.pgtap.test') $$,
  'RF-02: otro usuario pide la recuperación'
);
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "c2000000-0000-4000-8000-000000000001", "role": "authenticated"}';
do $$
begin
  perform set_config(
    'prueba.codigo',
    (
      select g.codigo
      from public.generar_codigo_recuperacion(
        (select s.id from public.solicitud_recuperacion s where s.usuario_id = 'c2000000-0000-4000-8000-000000000009')
      ) as g
    ),
    true
  );
end;
$$;
reset role;
-- Pasan 31 minutos: no se pueden esperar, así que se mueve el vencimiento.
update public.solicitud_recuperacion
set expira_en = now() - interval '1 minute'
where usuario_id = 'c2000000-0000-4000-8000-000000000009';

set local role service_role;
select results_eq(
  format(
    $f$ select resultado, usuario_id from public.consumir_codigo_recuperacion('diego@recuperar.pgtap.test', %L) $f$,
    current_setting('prueba.codigo')
  ),
  $$ values ('CODIGO_VENCIDO', null::uuid) $$,
  'RF-02 / CU-02 9a: el código correcto, pero vencido → CODIGO_VENCIDO'
);
reset role;
select is(
  (select usado from public.solicitud_recuperacion where usuario_id = 'c2000000-0000-4000-8000-000000000009'),
  false,
  'RF-02: un código vencido no queda como usado'
);
set local role authenticated;
set local request.jwt.claims = '{"sub": "c2000000-0000-4000-8000-000000000001", "role": "authenticated"}';
select throws_ok(
  $$ select * from public.generar_codigo_recuperacion(
       (select id from public.solicitud_recuperacion where usuario_id = 'c2000000-0000-4000-8000-000000000009')
     ) $$,
  'P0001', 'SOLICITUD_INVALIDA',
  'RF-02: una solicitud vencida no se reabre → SOLICITUD_INVALIDA'
);
reset role;
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';
select lives_ok(
  $$ select public.solicitar_recuperacion('diego@recuperar.pgtap.test') $$,
  'RF-02: con la anterior vencida, pide otra desde la pantalla 02'
);
reset role;
select is(pg_temp.solicitudes('9'), 2, 'RF-02: y se crea');

-- Fuerza bruta · cinco intentos por código -----------------------------------------------------

set local role anon;
set local request.jwt.claims = '{"role": "anon"}';
select lives_ok(
  $$ select public.solicitar_recuperacion('carla@recuperar.pgtap.test') $$,
  'RF-02: una tercera usuaria pide la recuperación'
);
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub": "c2000000-0000-4000-8000-000000000001", "role": "authenticated"}';
do $$
begin
  perform set_config(
    'prueba.codigo',
    (
      select g.codigo
      from public.generar_codigo_recuperacion(
        (select s.id from public.solicitud_recuperacion s where s.usuario_id = 'c2000000-0000-4000-8000-000000000008')
      ) as g
    ),
    true
  );
end;
$$;
reset role;
set local role service_role;

select is(
  (
    select count(*)::int
    from generate_series(1, 5) as intento,
      lateral public.consumir_codigo_recuperacion(
        'carla@recuperar.pgtap.test',
        lpad(((current_setting('prueba.codigo')::int + intento) % 1000000)::text, 6, '0')
      ) as r
    where r.resultado = 'CODIGO_INVALIDO'
  ),
  5,
  'RF-02: cinco códigos incorrectos seguidos → cinco veces CODIGO_INVALIDO'
);
select results_eq(
  format(
    $f$ select resultado, usuario_id from public.consumir_codigo_recuperacion('carla@recuperar.pgtap.test', %L) $f$,
    current_setting('prueba.codigo')
  ),
  $$ values ('CODIGO_VENCIDO', null::uuid) $$,
  'RF-02: después de cinco intentos fallidos, ni el código correcto sirve → CODIGO_VENCIDO'
);
reset role;
select results_eq(
  $$ select intentos_fallidos::int, usado from public.solicitud_recuperacion
     where usuario_id = 'c2000000-0000-4000-8000-000000000008' $$,
  $$ values (5, false) $$,
  'RF-02: los intentos se quedan en cinco y la solicitud no queda usada'
);
set local role anon;
set local request.jwt.claims = '{"role": "anon"}';
select lives_ok(
  $$ select public.solicitar_recuperacion('carla@recuperar.pgtap.test') $$,
  'RF-02: con el código bloqueado, pide otra solicitud'
);
reset role;
select is(pg_temp.solicitudes('8'), 2, 'RF-02: y se crea');

-- Si desactivan al usuario, su solicitud deja de servir -------------------------------------------

update public.usuario set activo = false where id = 'c2000000-0000-4000-8000-000000000008';

set local role authenticated;
set local request.jwt.claims = '{"sub": "c2000000-0000-4000-8000-000000000001", "role": "authenticated"}';
select throws_ok(
  $$ select * from public.generar_codigo_recuperacion(
       (select id from public.solicitud_recuperacion
        where usuario_id = 'c2000000-0000-4000-8000-000000000008' and expira_en is null)
     ) $$,
  'P0001', 'SOLICITUD_INVALIDA',
  'RF-02: la solicitud de un usuario que fue desactivado → SOLICITUD_INVALIDA'
);

select * from finish();
rollback;
