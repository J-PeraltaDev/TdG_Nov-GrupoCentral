# 0010 · Control de acceso en la base de datos y lectura de `usuario`

- **Estado:** Propuesta en el Sprint 1 (PR `feat/RF-16-esquema-nucleo`), para confirmar en la revisión
- **Requerimientos:** RNF-11, RNF-12, RNF-18, RF-16, RF-18 · SDD 6.1.1, 6.1.3 y 6.1.4

## Contexto

El SDD define el control de acceso con políticas RLS (Tabla 31) y dos vistas, `v_novedad` y
`usuario_publico`, que se ejecutan con los permisos de quien consulta. La Tabla 31 solo deja leer
de `usuario` la fila propia, y eso choca con las vistas: un aprobador vería vacíos el nombre del
reportante y los nombres de la línea de tiempo.

## Decisión

1. **Lectura de `usuario`.** Cualquier usuario autenticado y activo puede leer todas las filas,
   incluidas las de usuarios desactivados (para que la línea de tiempo no pierda nombres), pero
   solo las columnas `id, nombre, rol_id, finca_id, area_id, activo`. El correo no se expone por
   la API: el propio usuario lo tiene en su sesión y el administrador lo leerá en el Sprint 3
   mediante una función que verifique su rol. **El cliente debe pedir columnas explícitas de
   `usuario`, nunca `select *`.**
2. **Privilegios explícitos y mínimos.** Las tablas nacen sin privilegios para `anon` y
   `authenticated`; cada una concede solo lo que la Tabla 31 permite. `anon` no tiene ningún
   privilegio. En `notificacion`, el destinatario solo puede actualizar `leida` y `leida_en`. En
   `solicitud_recuperacion`, `codigo_hash` no se concede a nadie.
3. **Funciones auxiliares en `private`** (`fn_activo`, `fn_rol`, `fn_finca`, `fn_area`,
   `puede_ver_novedad`): `stable`, `security definer` y con `search_path` fijo. Devuelven nulo o
   falso si el usuario no existe o está inactivo. En las políticas van envueltas en `(select …)`
   para que se evalúen una vez por consulta.
4. **Política de `novedad`.** Escribe la condición de `puede_ver_novedad` con las auxiliares
   envueltas, en lugar de llamar la función por cada fila. Una prueba pgTAP verifica que las dos
   coinciden.
5. **Índices de claves foráneas.** Además de los de la Tabla 27, se indexan las claves foráneas
   que no cubre (`novedad.reportante_id`, `notificacion.novedad_id`, las de `usuario`,
   `evidencia`, `historial_transicion`, `tipo_falla`, `auditoria_tipo_falla`,
   `solicitud_recuperacion` y `suscripcion_push`). Es un complemento del SDD, no un cambio.
6. **`novedad.codigo` e `historial_transicion.id`** son columnas de identidad (`generated always
as identity`): la secuencia es propia de la columna y nadie puede fijar el valor a mano.

## Excepción aceptada del asesor de Supabase

El asesor marca `registrar_novedad` como función `SECURITY DEFINER` ejecutable por
`authenticated` (`authenticated_security_definer_function_executable`). Es la decisión D-02 del
SDD: el cliente no escribe en `novedad` ni en el historial, así que la función debe correr con
los privilegios de su propietario. Verifica por sí misma la identidad, el rol y el alcance, y
`anon` no puede ejecutarla. Las demás funciones de transición tendrán la misma alerta.

Las otras dos alertas son de configuración de Auth, no del esquema: protección contra
contraseñas filtradas y opciones de MFA (el diseño no usa MFA).

## Consecuencias

- Un usuario desactivado no puede leer ni su propia fila: después de ingresar, la consulta del
  perfil vuelve vacía y el cliente lo trata como «usuario desactivado» (pantalla 01-C).
- Las vistas siguen siendo `security_invoker`: no hay ninguna vista que salte las políticas.
- Las pruebas de RLS (`supabase/tests/rf16_rls_por_rol_test.sql`) crean sus propios datos dentro
  de una transacción; no dependen del seed.
