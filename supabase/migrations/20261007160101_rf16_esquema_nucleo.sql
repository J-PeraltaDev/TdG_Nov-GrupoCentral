-- RF-16 (Sprint 1): las 13 tablas del modelo de datos, sus restricciones y sus índices.
-- Fuente: SDD 6.1.1, Tabla 26 (entidades) y Tabla 27 (índices).
--
-- Se crean todas ahora, aunque varias se usen en sprints posteriores. El control de acceso
-- (RLS, privilegios y vistas) va en la migración siguiente: aquí las tablas quedan cerradas
-- para anon y authenticated.

-- Estructura organizacional ---------------------------------------------------------

create table public.razon_social (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  activo boolean not null default true,
  constraint razon_social_nombre_unico unique (nombre),
  constraint razon_social_nombre_no_vacio check (btrim(nombre) <> '')
);

comment on table public.razon_social is 'Razones sociales del grupo. Catálogo precargado; se desactiva, no se borra.';

create table public.finca (
  id uuid primary key default gen_random_uuid(),
  razon_social_id uuid not null references public.razon_social (id),
  nombre text not null,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  -- También sirve de índice de la clave foránea razon_social_id.
  constraint finca_razon_social_nombre_unico unique (razon_social_id, nombre),
  constraint finca_nombre_no_vacio check (btrim(nombre) <> '')
);

comment on table public.finca is 'Fincas (RF-04). Única por razón social y nombre; se desactiva, no se borra.';

create table public.area (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  activo boolean not null default true,
  constraint area_nombre_unico unique (nombre),
  constraint area_nombre_no_vacio check (btrim(nombre) <> '')
);

comment on table public.area is 'Áreas responsables. Catálogo fijo: Mantenimiento y Sistemas.';

-- Usuarios y acceso -------------------------------------------------------------------

create table public.rol (
  id smallint primary key,
  nombre text not null,
  constraint rol_nombre_unico unique (nombre)
);

comment on table public.rol is 'Roles fijos: 1 reportante, 2 aprobador_area, 3 director_agricultura, 4 administrador.';

create table public.usuario (
  -- El mismo identificador de auth.users: las contraseñas las gestiona Supabase Auth.
  id uuid primary key references auth.users (id),
  nombre text not null,
  correo text not null,
  rol_id smallint not null references public.rol (id),
  finca_id uuid references public.finca (id),
  area_id uuid references public.area (id),
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  constraint usuario_correo_unico unique (correo),
  constraint usuario_nombre_no_vacio check (btrim(nombre) <> ''),
  -- RF-03: el reportante tiene finca y no área; el aprobador, área y no finca; el director
  -- y el administrador, ninguna de las dos.
  constraint usuario_alcance_segun_rol check (
    (rol_id = 1 and finca_id is not null and area_id is null)
    or (rol_id = 2 and area_id is not null and finca_id is null)
    or (rol_id in (3, 4) and finca_id is null and area_id is null)
  )
);

comment on table public.usuario is 'Perfil de cada cuenta (RF-03). El correo no se expone por la API de datos.';

create index usuario_rol_id_idx on public.usuario (rol_id);
create index usuario_finca_id_idx on public.usuario (finca_id);
create index usuario_area_id_idx on public.usuario (area_id);

create table public.solicitud_recuperacion (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuario (id),
  -- Se diligencian cuando el administrador genera el código (RF-02, Sprint 3).
  codigo_hash text,
  expira_en timestamptz,
  usado boolean not null default false,
  creada_en timestamptz not null default now()
);

comment on table public.solicitud_recuperacion is 'Solicitudes de recuperación de contraseña mediadas por el administrador (RF-02).';

create index solicitud_recuperacion_usuario_id_idx on public.solicitud_recuperacion (usuario_id);

create table public.suscripcion_push (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.usuario (id),
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  creada_en timestamptz not null default now(),
  constraint suscripcion_push_endpoint_unico unique (endpoint)
);

comment on table public.suscripcion_push is 'Suscripciones push de cada dispositivo (RF-31).';

create index suscripcion_push_usuario_id_idx on public.suscripcion_push (usuario_id);

-- Clasificación y recurrencia ---------------------------------------------------------

create table public.tipo_falla (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  -- Minúsculas, sin tildes y con espacios simples (RF-14). Lo calcula registrar_solucion.
  nombre_normalizado text not null,
  activo boolean not null default true,
  creado_por uuid not null references public.usuario (id),
  creado_en timestamptz not null default now(),
  constraint tipo_falla_nombre_normalizado_unico unique (nombre_normalizado),
  constraint tipo_falla_nombre_no_vacio check (btrim(nombre) <> '')
);

comment on table public.tipo_falla is 'Catálogo de tipos de falla (RF-14, RF-32). Se desactiva, no se borra.';

create index tipo_falla_creado_por_idx on public.tipo_falla (creado_por);

-- Núcleo del proceso ------------------------------------------------------------------

create table public.novedad (
  id uuid primary key default gen_random_uuid(),
  -- Consecutivo que se informa al reportante como NOV-#### (RF-06).
  codigo bigint generated always as identity,
  -- Lo genera el dispositivo antes del primer envío: repetir un envío no duplica (RNF-08).
  id_local uuid not null,
  finca_id uuid not null references public.finca (id),
  area_id uuid not null references public.area (id),
  reportante_id uuid not null references public.usuario (id),
  tipo_falla_id uuid references public.tipo_falla (id),
  descripcion text not null,
  prioridad public.prioridad_novedad not null,
  estado public.estado_novedad not null default 'registrada',
  solucion text,
  fecha_ejecucion date,
  -- Momento real del registro en la finca: con él se miden los tiempos (RNF-09, RF-27).
  fecha_registro timestamptz not null,
  -- Momento en que el servidor recibió la novedad.
  fecha_sincronizacion timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint novedad_codigo_unico unique (codigo),
  constraint novedad_id_local_unico unique (id_local),
  -- El máximo es el parámetro DESCRIPCION_MAX_CARACTERES de src/core/config/parametros.js.
  constraint novedad_descripcion_valida check (
    btrim(descripcion) <> '' and char_length(descripcion) <= 500
  ),
  constraint novedad_resuelta_completa check (
    estado not in ('resuelta', 'cerrada')
    or (
      tipo_falla_id is not null
      and solucion is not null
      and btrim(solucion) <> ''
      and fecha_ejecucion is not null
    )
  )
);

comment on table public.novedad is 'Novedades (RF-05). Solo las funciones de transición escriben en esta tabla.';

-- Índices de la Tabla 27.
create index novedad_bandeja_idx on public.novedad (area_id, estado, prioridad, fecha_registro);
create index novedad_finca_estado_idx on public.novedad (finca_id, estado);
create index novedad_fecha_registro_idx on public.novedad (fecha_registro);
create index novedad_tipo_falla_id_idx on public.novedad (tipo_falla_id);
-- Complemento del SDD: clave foránea que la Tabla 27 no cubre.
create index novedad_reportante_id_idx on public.novedad (reportante_id);

create table public.evidencia (
  id uuid primary key default gen_random_uuid(),
  novedad_id uuid not null references public.novedad (id),
  subida_por uuid not null references public.usuario (id),
  ruta_storage text not null,
  tamano_bytes integer not null,
  subida_en timestamptz not null default now(),
  constraint evidencia_ruta_storage_unica unique (ruta_storage),
  constraint evidencia_tamano_positivo check (tamano_bytes > 0)
);

comment on table public.evidencia is 'Metadatos de las fotografías del bucket evidencias (RF-08).';

create index evidencia_novedad_id_idx on public.evidencia (novedad_id);
create index evidencia_subida_por_idx on public.evidencia (subida_por);

create table public.historial_transicion (
  -- Secuencial: preserva el orden de las transiciones (RF-16).
  id bigint generated always as identity primary key,
  novedad_id uuid not null references public.novedad (id),
  usuario_id uuid not null references public.usuario (id),
  estado_anterior public.estado_novedad,
  estado_nuevo public.estado_novedad not null,
  area_anterior_id uuid references public.area (id),
  area_nueva_id uuid references public.area (id),
  observacion text,
  fecha_hora timestamptz not null default now()
);

comment on table public.historial_transicion is 'Historial inmutable de estados y áreas (RF-16, RNF-12). Solo admite inserción.';

-- Índices de la Tabla 27.
create index historial_transicion_novedad_idx on public.historial_transicion (novedad_id, id);
create index historial_transicion_estado_fecha_idx on public.historial_transicion (estado_nuevo, fecha_hora);
-- Complemento del SDD: claves foráneas que la Tabla 27 no cubre.
create index historial_transicion_usuario_id_idx on public.historial_transicion (usuario_id);
create index historial_transicion_area_anterior_id_idx on public.historial_transicion (area_anterior_id);
create index historial_transicion_area_nueva_id_idx on public.historial_transicion (area_nueva_id);

create table public.auditoria_tipo_falla (
  id uuid primary key default gen_random_uuid(),
  tipo_falla_id uuid not null references public.tipo_falla (id),
  tipo_destino_id uuid references public.tipo_falla (id),
  usuario_id uuid not null references public.usuario (id),
  accion public.accion_auditoria not null,
  valor_anterior text,
  fecha timestamptz not null default now()
);

comment on table public.auditoria_tipo_falla is 'Quién renombró, fusionó o desactivó un tipo de falla y cuándo (RF-32).';

create index auditoria_tipo_falla_tipo_falla_id_idx on public.auditoria_tipo_falla (tipo_falla_id);
create index auditoria_tipo_falla_tipo_destino_id_idx on public.auditoria_tipo_falla (tipo_destino_id);
create index auditoria_tipo_falla_usuario_id_idx on public.auditoria_tipo_falla (usuario_id);

-- Comunicación --------------------------------------------------------------------------

create table public.notificacion (
  id uuid primary key default gen_random_uuid(),
  destinatario_id uuid not null references public.usuario (id),
  novedad_id uuid not null references public.novedad (id),
  estado_nuevo public.estado_novedad not null,
  leida boolean not null default false,
  creada_en timestamptz not null default now(),
  leida_en timestamptz
);

comment on table public.notificacion is 'Avisos dentro de la aplicación (RF-30). Los crean las funciones de transición.';

-- Índice de la Tabla 27.
create index notificacion_destinatario_idx on public.notificacion (destinatario_id, leida, creada_en);
-- Complemento del SDD: clave foránea que la Tabla 27 no cubre.
create index notificacion_novedad_id_idx on public.notificacion (novedad_id);

-- Privilegios ---------------------------------------------------------------------------
-- Nada queda abierto por defecto: la migración de control de acceso concede lo necesario.

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
