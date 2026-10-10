-- RF-02 (Sprint 3): implementación de solicitar_recuperacion.
-- Fuente: SDD 6.1.10; CU-02, pasos 3 y 4 y alterno 4a; ADR 0013. Reemplaza el cuerpo del
-- contrato; la firma y los privilegios (anon y authenticated) no cambian.
--
-- Es la única función que se ejecuta sin sesión: quien olvidó su contraseña no puede ingresar.
-- Por eso no dice nada: devuelve lo mismo exista o no el correo, esté activo o no el usuario y
-- tenga o no una solicitud abierta (CU-02 4a). Lo único que puede hacer quien la llama es dejar
-- una solicitud pendiente, a lo sumo una por usuario, que solo ve el administrador.

create or replace function public.solicitar_recuperacion(p_correo text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  -- Los correos se guardan en minúsculas y sin espacios (Auth y gestionar-usuario).
  v_correo text := lower(btrim(coalesce(p_correo, '')));
  v_usuario_id uuid;
begin
  -- 254 es el máximo de un correo: lo que pase de ahí no puede ser el de nadie.
  if v_correo = '' or length(v_correo) > 254 then
    return;
  end if;

  select u.id
  into v_usuario_id
  from public.usuario u
  where u.correo = v_correo and u.activo;

  if v_usuario_id is null then
    return;
  end if;

  -- Si dos peticiones llegan a la vez, el índice único parcial deja pasar una sola.
  insert into public.solicitud_recuperacion (usuario_id)
  select v_usuario_id
  where not exists (
    select 1
    from public.solicitud_recuperacion s
    where s.usuario_id = v_usuario_id and private.solicitud_abierta(s)
  )
  on conflict do nothing;
end;
$$;
