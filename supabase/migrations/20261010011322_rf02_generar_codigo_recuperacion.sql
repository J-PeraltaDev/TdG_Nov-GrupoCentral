-- RF-02 (Sprint 3): implementación de generar_codigo_recuperacion.
-- Fuente: SDD 6.1.10; CU-02, pasos 5 y 6. Reemplaza el cuerpo del contrato; la firma y los
-- privilegios no cambian.
--
-- El administrador genera el código temporal de una solicitud abierta y se lo entrega a la
-- persona por un medio propio (CU-02 7). El código sale de la base de datos esta única vez: se
-- guarda solo su resumen con sal, que ni el administrador puede leer.

create or replace function public.generar_codigo_recuperacion(p_solicitud_id uuid)
returns table (codigo text, expira_en timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_solicitud public.solicitud_recuperacion;
  v_bytes bytea;
  v_numero integer;
  v_codigo text;
  v_expira timestamptz := now() + interval '30 minutes';
begin
  if not exists (
    select 1
    from public.usuario u
    where u.id = (select auth.uid()) and u.activo and u.rol_id = 4
  ) then
    raise exception 'SIN_PERMISO' using errcode = 'P0001';
  end if;

  -- Se bloquea la fila: dos administradores a la vez no dejan dos códigos distintos a medias.
  select s.*
  into v_solicitud
  from public.solicitud_recuperacion s
  where s.id = p_solicitud_id
  for update;

  -- No existe, ya se usó, venció, agotó los intentos o su usuario fue desactivado.
  if v_solicitud.id is null
    or not private.solicitud_abierta(v_solicitud)
    or not exists (
      select 1 from public.usuario u where u.id = v_solicitud.usuario_id and u.activo
    )
  then
    raise exception 'SOLICITUD_INVALIDA' using errcode = 'P0001';
  end if;

  -- Seis dígitos de una fuente criptográfica, nunca de random(). Tres bytes dan un número
  -- entre 0 y 16 777 215: se descarta lo que pase de 16 000 000 para que, al tomar el residuo,
  -- los seis dígitos salgan con la misma probabilidad.
  loop
    v_bytes := extensions.gen_random_bytes(3);
    v_numero := (get_byte(v_bytes, 0) << 16) | (get_byte(v_bytes, 1) << 8) | get_byte(v_bytes, 2);
    exit when v_numero < 16000000;
  end loop;
  v_codigo := lpad((v_numero % 1000000)::text, 6, '0');

  -- Un código nuevo reemplaza el resumen anterior: el código viejo deja de servir. Con un
  -- millón de códigos posibles, el resumen no resiste a quien tenga la base; el costo 10 hace
  -- que recorrerlos todos tome más que los 30 minutos que dura el código.
  update public.solicitud_recuperacion s
  set
    codigo_hash = extensions.crypt(v_codigo, extensions.gen_salt('bf', 10)),
    expira_en = v_expira,
    intentos_fallidos = 0
  where s.id = v_solicitud.id;

  return query select v_codigo, v_expira;
end;
$$;
