-- RF-02 (Sprint 3): implementación de consumir_codigo_recuperacion.
-- Fuente: SDD 6.1.10; CU-02, paso 9 y alternos 9a y 9b. Reemplaza el cuerpo del contrato; la
-- firma y los privilegios (solo service_role) no cambian.
--
-- La llama la Edge Function restablecer-contrasena antes de cambiar la contraseña. Compara el
-- código con su resumen sin que el resumen salga de la base de datos, y lo gasta.
--
--   OK               el código es el de la solicitud y está vigente: queda usado.
--   CODIGO_INVALIDO  el código no es ese. También cuando el correo no es de un usuario activo
--                    o no tiene una solicitud con código: no se dice cuál de las tres.
--   CODIGO_VENCIDO   el código es ese, pero ya se usó, venció o agotó sus cinco intentos.
--
-- CODIGO_VENCIDO solo se le responde a quien conoce el código, así que ninguna respuesta dice
-- si un correo existe. Devuelve el resultado en lugar de lanzar una excepción, porque una
-- excepción desharía la suma del intento fallido.

create or replace function public.consumir_codigo_recuperacion(p_correo text, p_codigo text)
returns table (resultado text, usuario_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_correo text := lower(btrim(coalesce(p_correo, '')));
  v_codigo text := coalesce(p_codigo, '');
  v_solicitud public.solicitud_recuperacion;
begin
  if v_codigo ~ '^[0-9]{6}$' and v_correo <> '' and length(v_correo) <= 254 then
    -- La solicitud con el código más reciente del usuario. Se bloquea: dos intentos a la vez
    -- no se saltan el conteo ni gastan el código dos veces.
    select s.*
    into v_solicitud
    from public.solicitud_recuperacion s
    join public.usuario u on u.id = s.usuario_id
    where u.correo = v_correo and u.activo and s.codigo_hash is not null
    order by s.expira_en desc, s.creada_en desc
    limit 1
    for update of s;
  end if;

  if v_solicitud.id is null then
    -- No hay con qué comparar. Se calcula igual un resumen, para tardar lo mismo que cuando
    -- sí lo hay: el tiempo de la respuesta tampoco debe decir si el correo existe.
    perform extensions.crypt(left(v_codigo, 6), extensions.gen_salt('bf', 10));
    return query select 'CODIGO_INVALIDO'::text, null::uuid;
    return;
  end if;

  if extensions.crypt(v_codigo, v_solicitud.codigo_hash) <> v_solicitud.codigo_hash then
    update public.solicitud_recuperacion s
    set intentos_fallidos = least(s.intentos_fallidos + 1, 5)
    where s.id = v_solicitud.id;
    return query select 'CODIGO_INVALIDO'::text, null::uuid;
    return;
  end if;

  if not private.solicitud_abierta(v_solicitud) then
    return query select 'CODIGO_VENCIDO'::text, null::uuid;
    return;
  end if;

  update public.solicitud_recuperacion s
  set usado = true
  where s.id = v_solicitud.id;

  return query select 'OK'::text, v_solicitud.usuario_id;
end;
$$;
