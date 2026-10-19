-- RF-31 / CU-31 · el webhook de los avisos: private.tg_notificacion_push y el disparador after
-- insert en notificacion (SDD 6.1.6; plan del Sprint 5, decisiones 38 y 39). Los secretos de
-- Vault se borran y se crean dentro de la transacción: al final, el rollback deja los de
-- «staging» como estaban. pg_net encola en la misma transacción, así que nada sale de aquí.
begin;

create extension if not exists pgtap with schema extensions;

select plan(15);

-- Datos de la prueba (como propietario) ------------------------------------------------

insert into public.razon_social (id, nombre)
values ('e9000000-0000-4000-8000-0000000000a1', 'RS pgTAP push');

insert into public.finca (id, razon_social_id, nombre)
values ('e9000000-0000-4000-8000-0000000000f1', 'e9000000-0000-4000-8000-0000000000a1', 'Finca pgTAP push');

insert into public.area (id, nombre)
values ('e9000000-0000-4000-8000-0000000000b1', 'Área pgTAP push');

insert into auth.users (instance_id, id, aud, role, email)
select '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', correo
from (
  values
    ('e9000000-0000-4000-8000-000000000001'::uuid, 'reportante@push.pgtap.test'),
    ('e9000000-0000-4000-8000-000000000002'::uuid, 'aprobador@push.pgtap.test')
) as u (id, correo);

insert into public.usuario (id, nombre, correo, rol_id, finca_id, area_id, activo)
values
  ('e9000000-0000-4000-8000-000000000001', 'Reportante', 'reportante@push.pgtap.test', 1, 'e9000000-0000-4000-8000-0000000000f1', null, true),
  ('e9000000-0000-4000-8000-000000000002', 'Aprobador', 'aprobador@push.pgtap.test', 2, null, 'e9000000-0000-4000-8000-0000000000b1', true);

insert into public.novedad (id, id_local, finca_id, area_id, reportante_id, descripcion, prioridad, estado, fecha_registro)
values ('e9000000-0000-4000-8000-0000000000d1', gen_random_uuid(), 'e9000000-0000-4000-8000-0000000000f1', 'e9000000-0000-4000-8000-0000000000b1', 'e9000000-0000-4000-8000-000000000001', 'Novedad pgTAP push', 'normal', 'asignada', now());

-- La función y el disparador (regla 2) -------------------------------------------------

select has_trigger(
  'public', 'notificacion', 'notificacion_push',
  'RF-31: notificacion tiene el disparador del webhook'
);

select ok(
  (
    select p.prosecdef and p.proconfig @> array['search_path=""']
    from pg_proc p
    where p.oid = 'private.tg_notificacion_push()'::regprocedure
  ),
  'Regla 2: la función del disparador es security definer y con search_path vacío'
);

select ok(
  not has_function_privilege('authenticated', 'private.tg_notificacion_push()', 'execute')
    and not has_function_privilege('anon', 'private.tg_notificacion_push()', 'execute'),
  'Regla 2: ni authenticated ni anon ejecutan la función del disparador'
);

select ok(
  has_table_privilege('service_role', 'public.novedad', 'select')
    and has_table_privilege('service_role', 'public.finca', 'select')
    and has_table_privilege('service_role', 'public.area', 'select')
    and has_table_privilege('service_role', 'public.tipo_falla', 'select')
    and has_table_privilege('service_role', 'public.usuario', 'select')
    and has_table_privilege('service_role', 'public.suscripcion_push', 'select')
    and has_table_privilege('service_role', 'public.suscripcion_push', 'delete'),
  'Regla 4: enviar-push lee la novedad, el destinatario y sus suscripciones, y borra las vencidas'
);

-- Sin los secretos (el Supabase local del CI): no se encola nada y el aviso se crea --------

delete from vault.secrets where name in ('enviar_push_url', 'enviar_push_secreto');

select lives_ok(
  $$
    insert into public.notificacion (id, destinatario_id, novedad_id, estado_nuevo)
    values ('e9000000-0000-4000-8000-0000000000c1', 'e9000000-0000-4000-8000-000000000001', 'e9000000-0000-4000-8000-0000000000d1', 'asignada')
  $$,
  'RF-30 / RF-31: sin los secretos en Vault, el aviso se crea igual'
);

select is(
  (
    select count(*)::int from net.http_request_queue q
    where position('e9000000-0000-4000-8000-0000000000c1' in convert_from(q.body, 'UTF8')) > 0
  ),
  0,
  'RF-31: sin los secretos en Vault no se encola ninguna solicitud'
);

-- Con los secretos: cada aviso encola una solicitud ----------------------------------------

do $$
begin
  perform vault.create_secret('https://ejemplo.test/functions/v1/enviar-push', 'enviar_push_url');
  perform vault.create_secret('secreto-de-prueba', 'enviar_push_secreto');
end
$$;

insert into public.notificacion (id, destinatario_id, novedad_id, estado_nuevo)
values ('e9000000-0000-4000-8000-0000000000c2', 'e9000000-0000-4000-8000-000000000001', 'e9000000-0000-4000-8000-0000000000d1', 'asignada');

select results_eq(
  $$
    select q.method::text, q.url, q.headers ->> 'x-webhook-secreto', q.headers ->> 'Content-Type', q.timeout_milliseconds
    from net.http_request_queue q
    where position('e9000000-0000-4000-8000-0000000000c2' in convert_from(q.body, 'UTF8')) > 0
  $$,
  $$ values ('POST', 'https://ejemplo.test/functions/v1/enviar-push', 'secreto-de-prueba', 'application/json', 5000) $$,
  'RF-31 / CU-31 1: un aviso encola un POST a enviar-push con el secreto y 5 s de espera'
);

select is(
  (
    select (convert_from(q.body, 'UTF8')::jsonb -> 'record') - 'creada_en'
    from net.http_request_queue q
    where position('e9000000-0000-4000-8000-0000000000c2' in convert_from(q.body, 'UTF8')) > 0
  ),
  jsonb_build_object(
    'id', 'e9000000-0000-4000-8000-0000000000c2',
    'destinatario_id', 'e9000000-0000-4000-8000-000000000001',
    'novedad_id', 'e9000000-0000-4000-8000-0000000000d1',
    'estado_nuevo', 'asignada',
    'leida', false,
    'leida_en', null
  ),
  'RF-31: el cuerpo lleva el aviso como record, como los webhooks de Supabase'
);

-- Una transición que falla no deja nada (pg_net encola en la misma transacción) -----------

do $$
begin
  begin
    insert into public.notificacion (id, destinatario_id, novedad_id, estado_nuevo)
    values ('e9000000-0000-4000-8000-0000000000c3', 'e9000000-0000-4000-8000-000000000001', 'e9000000-0000-4000-8000-0000000000d1', 'asignada');
    raise exception 'TRANSICION_INVALIDA';
  exception
    when others then null;
  end;
end
$$;

select is(
  (
    select count(*)::int from net.http_request_queue q
    where position('e9000000-0000-4000-8000-0000000000c3' in convert_from(q.body, 'UTF8')) > 0
  ),
  0,
  'RF-31: si la transición falla, la solicitud se revierte con ella'
);

select is(
  (select count(*)::int from public.notificacion where id = 'e9000000-0000-4000-8000-0000000000c3'),
  0,
  'RF-31: y el aviso tampoco queda'
);

-- Una transición real: tomar la novedad avisa al reportante ---------------------------------

set local role authenticated;
set local request.jwt.claims = '{"sub": "e9000000-0000-4000-8000-000000000002", "role": "authenticated"}';

select lives_ok(
  $$ select public.tomar_novedad('e9000000-0000-4000-8000-0000000000d1') $$,
  'RF-10: el aprobador toma la novedad'
);

reset role;

select is(
  (
    select count(*)::int
    from public.notificacion n
    join net.http_request_queue q on position(n.id::text in convert_from(q.body, 'UTF8')) > 0
    where n.novedad_id = 'e9000000-0000-4000-8000-0000000000d1' and n.estado_nuevo = 'en_atencion'
  ),
  1,
  'RF-31 / CU-31 1: el aviso de la transición encola su push'
);

select is(
  (
    select convert_from(q.body, 'UTF8')::jsonb -> 'record' ->> 'destinatario_id'
    from public.notificacion n
    join net.http_request_queue q on position(n.id::text in convert_from(q.body, 'UTF8')) > 0
    where n.novedad_id = 'e9000000-0000-4000-8000-0000000000d1' and n.estado_nuevo = 'en_atencion'
  ),
  'e9000000-0000-4000-8000-000000000001',
  'RF-31 / CU-31 1: y va a nombre del reportante'
);

-- Quitar un secreto vuelve a apagar el envío (el CI, una configuración incompleta) ---------

delete from vault.secrets where name = 'enviar_push_secreto';

insert into public.notificacion (id, destinatario_id, novedad_id, estado_nuevo)
values ('e9000000-0000-4000-8000-0000000000c4', 'e9000000-0000-4000-8000-000000000001', 'e9000000-0000-4000-8000-0000000000d1', 'asignada');

select is(
  (
    select count(*)::int from net.http_request_queue q
    where position('e9000000-0000-4000-8000-0000000000c4' in convert_from(q.body, 'UTF8')) > 0
  ),
  0,
  'RF-31: con la URL pero sin el secreto, no se envía nada'
);

select is(
  (select count(*)::int from public.notificacion where id = 'e9000000-0000-4000-8000-0000000000c4'),
  1,
  'RF-30: y el aviso dentro de la aplicación se crea igual (CU-31 2a)'
);

select * from finish();

rollback;
