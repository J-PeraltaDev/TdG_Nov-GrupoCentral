-- RF-13, RF-15, RF-03 y RF-02 (Sprint 3): contratos de las funciones del sprint.
-- Fuente: SDD 5.3.2, Tabla 21, con lo que la precisa docs/cambios-sdd.md. Publican las firmas
-- para que el cliente avance mientras se implementa el servidor. Por ahora todas lanzan
-- NO_IMPLEMENTADO; el cuerpo de cada una llega en la migración de su historia.
--
-- Todas son security definer: el cliente no escribe en novedad, historial_transicion,
-- notificacion ni solicitud_recuperacion, y no lee el correo de usuario ni el resumen del
-- código. Cada función verificará por sí misma la identidad, el rol y el alcance.

-- Transiciones de estado (SDD 6.1.3) ---------------------------------------------------

create function public.decidir_escalamiento(
  p_novedad_id uuid,
  p_aprobar boolean,
  p_observacion text default null
)
returns public.novedad
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'NO_IMPLEMENTADO' using errcode = 'P0001';
end;
$$;

comment on function public.decidir_escalamiento(uuid, boolean, text) is
  'El director aprueba o rechaza una novedad escalada: escalada → aprobada o rechazada. La observación es obligatoria al rechazar (RF-13, RF-16).';

create function public.confirmar_resolucion(p_novedad_id uuid, p_observacion text default null)
returns public.novedad
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'NO_IMPLEMENTADO' using errcode = 'P0001';
end;
$$;

comment on function public.confirmar_resolucion(uuid, text) is
  'Un reportante de la finca confirma que la novedad quedó resuelta, con una observación opcional: resuelta → cerrada (RF-15, RF-16).';

create function public.reportar_falla_persiste(p_novedad_id uuid, p_observacion text)
returns public.novedad
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'NO_IMPLEMENTADO' using errcode = 'P0001';
end;
$$;

comment on function public.reportar_falla_persiste(uuid, text) is
  'Un reportante de la finca indica que la falla persiste, con una observación obligatoria: resuelta → en_atencion (RF-15, RF-16).';

-- Recuperación de contraseña (SDD 6.1.10) ------------------------------------------------

-- La única función que se puede ejecutar sin sesión (Tabla 21: «Sin sesión»; ADR 0013): quien
-- olvidó su contraseña no puede ingresar. No devuelve nada, exista o no el correo.
create function public.solicitar_recuperacion(p_correo text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'NO_IMPLEMENTADO' using errcode = 'P0001';
end;
$$;

comment on function public.solicitar_recuperacion(text) is
  'Registra la solicitud de recuperación de contraseña de un usuario activo. No exige sesión y responde igual exista o no el correo (RF-02).';

create function public.generar_codigo_recuperacion(p_solicitud_id uuid)
returns table (codigo text, expira_en timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'NO_IMPLEMENTADO' using errcode = 'P0001';
end;
$$;

comment on function public.generar_codigo_recuperacion(uuid) is
  'El administrador genera el código temporal de seis dígitos de una solicitud. Lo devuelve una sola vez, con su vencimiento; en la base queda solo su resumen (RF-02).';

-- No está en la Tabla 21 (docs/cambios-sdd.md): la llama la Edge Function restablecer-contrasena
-- con la clave secreta. Compara el código con su resumen sin que el resumen salga de la base.
-- Devuelve el resultado en lugar de lanzar una excepción, porque una excepción desharía el
-- conteo de los intentos fallidos.
create function public.consumir_codigo_recuperacion(p_correo text, p_codigo text)
returns table (resultado text, usuario_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'NO_IMPLEMENTADO' using errcode = 'P0001';
end;
$$;

comment on function public.consumir_codigo_recuperacion(text, text) is
  'Valida y gasta el código temporal de un correo. Resultado: OK (con el usuario), CODIGO_INVALIDO o CODIGO_VENCIDO. Solo para service_role (RF-02).';

-- Gestión de usuarios (SDD 6.1.10) -------------------------------------------------------

-- No está en la Tabla 21 (docs/cambios-sdd.md): es la función que anunciaba el ADR 0010. La
-- API de datos no expone el correo; el administrador lo lee por aquí, junto con el último
-- ingreso, que solo existe en Auth.
create function public.listar_usuarios()
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
  raise exception 'NO_IMPLEMENTADO' using errcode = 'P0001';
end;
$$;

comment on function public.listar_usuarios() is
  'Todos los usuarios, activos e inactivos, con su correo y su último ingreso. Solo para un administrador activo (RF-03, RNF-18).';

-- Privilegios ----------------------------------------------------------------------------
-- Postgres concede EXECUTE a PUBLIC en cada función nueva, y Supabase, además, a los roles de
-- la API. Se retira todo y se concede lo justo.

revoke execute on function
  public.decidir_escalamiento(uuid, boolean, text),
  public.confirmar_resolucion(uuid, text),
  public.reportar_falla_persiste(uuid, text),
  public.solicitar_recuperacion(text),
  public.generar_codigo_recuperacion(uuid),
  public.consumir_codigo_recuperacion(text, text),
  public.listar_usuarios()
from public, anon, authenticated;

-- Con sesión: cada una verifica por sí misma el rol y el alcance.
grant execute on function
  public.decidir_escalamiento(uuid, boolean, text),
  public.confirmar_resolucion(uuid, text),
  public.reportar_falla_persiste(uuid, text),
  public.generar_codigo_recuperacion(uuid),
  public.listar_usuarios()
to authenticated;

-- Sin sesión. `authenticated` también, por si alguien la llama con una sesión abierta.
grant execute on function public.solicitar_recuperacion(text) to anon, authenticated;

-- Solo las Edge Functions, que usan la clave secreta.
grant execute on function public.consumir_codigo_recuperacion(text, text) to service_role;
