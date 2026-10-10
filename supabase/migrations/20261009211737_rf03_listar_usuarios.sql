-- RF-03 (Sprint 3): implementación de listar_usuarios y privilegios de la función
-- gestionar-usuario sobre las cuentas.
-- Fuente: SDD 6.1.10 y ADR 0010. Reemplaza el cuerpo del contrato; la firma y los privilegios de
-- la función no cambian.

-- listar_usuarios ------------------------------------------------------------------------------
-- La API de datos no expone el correo (ADR 0010): el administrador lo lee por aquí, junto con
-- el último ingreso, que solo existe en Auth. Es security definer porque lee auth.users y la
-- columna `correo`; por eso verifica por sí misma que quien la llama sea un administrador
-- activo.
--
-- `ultimo_ingreso` es el último ingreso con contraseña (auth.users.last_sign_in_at): renovar
-- la sesión no lo cambia, así que quien lleva días con la sesión abierta muestra una fecha
-- vieja. Una cuenta de Auth sin perfil no es un usuario de la aplicación y no aparece.

create or replace function public.listar_usuarios()
returns table (
  id uuid,
  nombre text,
  correo text,
  rol_id smallint,
  finca_id uuid,
  area_id uuid,
  activo boolean,
  creado_en timestamptz,
  ultimo_ingreso timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.usuario u
    where u.id = (select auth.uid()) and u.activo and u.rol_id = 4
  ) then
    raise exception 'SIN_PERMISO' using errcode = 'P0001';
  end if;

  return query
  select
    u.id, u.nombre, u.correo, u.rol_id, u.finca_id, u.area_id, u.activo, u.creado_en,
    c.last_sign_in_at
  from public.usuario u
  join auth.users c on c.id = u.id
  order by u.nombre, u.id;
end;
$$;

-- Privilegios de service_role (regla 4) --------------------------------------------------------
-- La Edge Function gestionar-usuario escribe en `usuario` con la clave de servicio (SDD 6.1.10,
-- Tabla 23). En «staging» service_role ya tiene estos privilegios, pero una migración no debe
-- depender de los privilegios por defecto del proyecto: en «PROYECTO» las tablas nuevas no se
-- exponen solas.
--
-- Lee `finca` y `area` para comprobar que el alcance del usuario existe y está activo
-- (CU-03 6b). No recibe `delete`: un usuario se desactiva, nunca se borra. El único borrado de
-- la función es el de la cuenta de Auth recién creada, cuando falla la inserción del perfil.

grant select, insert, update on public.usuario to service_role;
grant select on public.finca, public.area to service_role;
revoke delete, truncate on public.usuario from service_role;
