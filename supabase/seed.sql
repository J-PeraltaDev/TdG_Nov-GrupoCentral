-- Datos de PRUEBA para el entorno local y para staging. Nunca van a producción.
-- Se cargan con `npm run staging:reset` (o `supabase db reset` si hay Docker).
--
-- Nombres y correos inventados a propósito: no pongas aquí fincas, personas ni correos reales.
-- Los correos usan @novedades.test, un dominio reservado que no existe en internet.

-- Razones sociales y fincas de prueba --------------------------------------------------

insert into public.razon_social (id, nombre)
values
  ('00000000-0000-4000-b000-00000000000a', 'Razón social de prueba A'),
  ('00000000-0000-4000-b000-00000000000b', 'Razón social de prueba B')
on conflict do nothing;

insert into public.finca (id, razon_social_id, nombre)
values
  ('00000000-0000-4000-c000-000000000001', '00000000-0000-4000-b000-00000000000a', 'Finca de prueba 01'),
  ('00000000-0000-4000-c000-000000000002', '00000000-0000-4000-b000-00000000000a', 'Finca de prueba 02'),
  ('00000000-0000-4000-c000-000000000003', '00000000-0000-4000-b000-00000000000b', 'Finca de prueba 03')
on conflict do nothing;

-- Cuentas de prueba en Supabase Auth -----------------------------------------------------
-- Se crean con una contraseña al azar que nadie conoce. Cada persona les pone la suya con
-- `npm run staging:usuarios`, que la lee de .env.local (ver README). Así ninguna contraseña
-- queda en el repositorio, que es público.

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000', c.id, 'authenticated', 'authenticated', c.correo,
  extensions.crypt(gen_random_uuid()::text, extensions.gen_salt('bf')), now(),
  '{"provider": "email", "providers": ["email"]}'::jsonb, '{}'::jsonb, now(), now(),
  '', '', '', ''
from (
  values
    ('00000000-0000-4000-a000-000000000001'::uuid, 'reportante.01@novedades.test'),
    ('00000000-0000-4000-a000-000000000002'::uuid, 'reportante.03@novedades.test'),
    ('00000000-0000-4000-a000-000000000003'::uuid, 'aprobador.mantenimiento@novedades.test'),
    ('00000000-0000-4000-a000-000000000004'::uuid, 'aprobador.sistemas@novedades.test'),
    ('00000000-0000-4000-a000-000000000005'::uuid, 'director@novedades.test'),
    ('00000000-0000-4000-a000-000000000006'::uuid, 'administrador@novedades.test'),
    ('00000000-0000-4000-a000-000000000007'::uuid, 'desactivado@novedades.test')
) as c (id, correo)
on conflict (id) do nothing;

insert into auth.identities (
  provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
)
select
  u.id::text, u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true, 'phone_verified', false),
  'email', now(), now(), now()
from auth.users u
where u.email like '%@novedades.test'
on conflict (provider_id, provider) do nothing;

-- Perfiles: dos reportantes de fincas distintas, un aprobador por área, un director, un
-- administrador y un usuario desactivado.

insert into public.usuario (id, nombre, correo, rol_id, finca_id, area_id, activo)
values
  ('00000000-0000-4000-a000-000000000001', 'Reportante de prueba 01', 'reportante.01@novedades.test', 1,
   '00000000-0000-4000-c000-000000000001', null, true),
  ('00000000-0000-4000-a000-000000000002', 'Reportante de prueba 03', 'reportante.03@novedades.test', 1,
   '00000000-0000-4000-c000-000000000003', null, true),
  ('00000000-0000-4000-a000-000000000003', 'Aprobador de prueba Mantenimiento', 'aprobador.mantenimiento@novedades.test', 2,
   null, (select id from public.area where nombre = 'Mantenimiento'), true),
  ('00000000-0000-4000-a000-000000000004', 'Aprobador de prueba Sistemas', 'aprobador.sistemas@novedades.test', 2,
   null, (select id from public.area where nombre = 'Sistemas'), true),
  ('00000000-0000-4000-a000-000000000005', 'Director de prueba', 'director@novedades.test', 3, null, null, true),
  ('00000000-0000-4000-a000-000000000006', 'Administrador de prueba', 'administrador@novedades.test', 4, null, null, true),
  ('00000000-0000-4000-a000-000000000007', 'Usuario desactivado de prueba', 'desactivado@novedades.test', 1,
   '00000000-0000-4000-c000-000000000001', null, false)
on conflict (id) do nothing;

-- Tipos de falla de prueba (RF-14) --------------------------------------------------------
-- Para que el autocompletado de «Registrar solución» (pantalla 18) tenga qué sugerir. Los
-- crea el administrador de prueba. El nombre normalizado sale de la misma función que usa
-- registrar_solucion, para que el seed no se aparte de la regla (SDD 6.1.8).

insert into public.tipo_falla (id, nombre, nombre_normalizado, creado_por)
select t.id, t.nombre, private.normalizar_tipo_falla(t.nombre), '00000000-0000-4000-a000-000000000006'
from (
  values
    ('00000000-0000-4000-f000-000000000001'::uuid, 'Biométrico'),
    ('00000000-0000-4000-f000-000000000002'::uuid, 'Puentes y pasos'),
    ('00000000-0000-4000-f000-000000000003'::uuid, 'Torniquetes'),
    ('00000000-0000-4000-f000-000000000004'::uuid, 'Red e internet')
) as t (id, nombre)
on conflict (id) do nothing;
