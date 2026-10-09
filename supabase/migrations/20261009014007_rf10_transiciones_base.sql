-- RF-10 (Sprint 2): base común de las funciones de transición.
-- Fuente: SDD 6.1.3 (algoritmo general) y Tabla 30 (a quién avisa cada una).
--
-- Todas las transiciones repiten los mismos pasos: perfil del usuario, bloqueo y alcance de la
-- novedad, y avisos a los involucrados. Estas auxiliares los concentran para que cada función
-- solo escriba lo que le es propio (estados admitidos, guardas y destinatarios).
--
-- Viven en `private` y no son security definer: solo las llaman las funciones de transición,
-- que ya corren con los privilegios de su propietario. Por eso nadie más recibe `execute`, a
-- diferencia de fn_rol y compañía, que las evalúan las políticas con el rol de quien consulta.
--
-- Orden de las verificaciones, igual en todas las transiciones:
--   1. perfil activo con el rol de la función            → SIN_PERMISO
--   2. bloqueo de la fila y alcance                       → SIN_PERMISO
--   3. estado admitido                                    → TRANSICION_INVALIDA
--   4. guardas de datos (motivo, área, fecha, tipo…)      → su propio código
--   5. actualización, historial y avisos; cualquier excepción revierte todo.
-- El rol que no corresponde responde SIN_PERMISO, como dice la Tabla 22 y como ya hace
-- registrar_novedad (docs/cambios-sdd.md).

-- Paso 1 · perfil ------------------------------------------------------------------------

create function private.perfil_para_transicion(p_rol_id smallint)
returns public.usuario
language plpgsql
stable
set search_path = ''
as $$
declare
  v_perfil public.usuario%rowtype;
begin
  select u.* into v_perfil from public.usuario u where u.id = (select auth.uid());

  if not found or not v_perfil.activo or v_perfil.rol_id <> p_rol_id then
    raise exception 'SIN_PERMISO' using errcode = 'P0001';
  end if;

  return v_perfil;
end;
$$;

comment on function private.perfil_para_transicion(smallint) is
  'Perfil del usuario autenticado si existe, está activo y tiene el rol pedido; si no, SIN_PERMISO.';

-- Paso 2 · bloqueo y alcance ---------------------------------------------------------------
-- `for update` serializa las acciones concurrentes sobre una misma novedad: si dos aprobadores
-- la toman a la vez, el segundo espera y encuentra ya el estado nuevo. Cada transición bloquea
-- una sola fila, así que entre ellas no hay orden de bloqueos que cuidar.
--
-- Una novedad que no existe responde igual que una fuera del alcance: no se revela cuál es.

create function private.novedad_para_transicion(p_novedad_id uuid, p_perfil public.usuario)
returns public.novedad
language plpgsql
set search_path = ''
as $$
declare
  v_novedad public.novedad%rowtype;
begin
  select n.* into v_novedad from public.novedad n where n.id = p_novedad_id for update;

  -- El mismo alcance de private.puede_ver_novedad (SDD 6.1.4), con el perfil ya leído.
  if not found
    or not (
      (p_perfil.rol_id = 1 and v_novedad.finca_id = p_perfil.finca_id)
      or (p_perfil.rol_id = 2 and v_novedad.area_id = p_perfil.area_id)
      or p_perfil.rol_id in (3, 4)
    )
  then
    raise exception 'SIN_PERMISO' using errcode = 'P0001';
  end if;

  return v_novedad;
end;
$$;

comment on function private.novedad_para_transicion(uuid, public.usuario) is
  'Bloquea la novedad (for update) y la devuelve si está en el alcance del perfil; si no existe o está fuera, SIN_PERMISO.';

-- Paso 5 · destinatarios y avisos ------------------------------------------------------------

create function private.aprobadores_del_area(p_area_id uuid)
returns setof uuid
language sql
stable
set search_path = ''
as $$
  select u.id from public.usuario u where u.rol_id = 2 and u.area_id = p_area_id and u.activo;
$$;

comment on function private.aprobadores_del_area(uuid) is
  'Aprobadores activos de un área (SDD, Tabla 30).';

create function private.usuarios_del_rol(p_rol_id smallint)
returns setof uuid
language sql
stable
set search_path = ''
as $$
  select u.id from public.usuario u where u.rol_id = p_rol_id and u.activo;
$$;

comment on function private.usuarios_del_rol(smallint) is
  'Usuarios activos de un rol: directores o administradores (SDD, Tabla 30).';

-- Un aviso por destinatario, sin repetir. No recibe aviso quien ejecuta la acción (Tabla 30)
-- ni quien ya no está activo: no podría abrirlo.
create function private.avisar(
  p_novedad_id uuid,
  p_estado_nuevo public.estado_novedad,
  p_destinatarios uuid[],
  p_actor_id uuid
)
returns void
language sql
set search_path = ''
as $$
  insert into public.notificacion (destinatario_id, novedad_id, estado_nuevo)
  select u.id, p_novedad_id, p_estado_nuevo
  from public.usuario u
  where u.id = any (p_destinatarios)
    and u.activo
    and u.id is distinct from p_actor_id;
$$;

comment on function private.avisar(uuid, public.estado_novedad, uuid[], uuid) is
  'Inserta un aviso (RF-30) por cada destinatario activo, excepto quien ejecuta la acción.';

-- Privilegios --------------------------------------------------------------------------------
-- Postgres concede EXECUTE a PUBLIC en cada función nueva. Aquí no se le concede a nadie.

revoke execute on function
  private.perfil_para_transicion(smallint),
  private.novedad_para_transicion(uuid, public.usuario),
  private.aprobadores_del_area(uuid),
  private.usuarios_del_rol(smallint),
  private.avisar(uuid, public.estado_novedad, uuid[], uuid)
from public, anon, authenticated;
