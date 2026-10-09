# Cambios frente al SDD y al SRS

El SDD y el SRS son documentos vivos. Cada vez que la implementación se aparta de ellos, se anota
aquí, en el mismo PR, con la sección afectada y el texto propuesto, para que Mateo y Juan
actualicen los documentos (lo exige la Definition of Done).

| N.º | Sprint | Documento y sección                         | Qué cambia                                                                                                                                 | Estado    |
| --- | ------ | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| 1   | S0     | SDD 4.2.4 (C-04) y plan de arranque («PWA») | Precisión, no cambio: el service worker precachea con código propio, sin las librerías de Workbox                                          | Propuesto |
| 2   | S0     | SDD 5.2 («Sistema de diseño»)               | Precisión: los íconos de Figma son la fuente Material Symbols Rounded; en el código son SVG locales del mismo conjunto                     | Propuesto |
| 3   | S1     | SDD 6.1.4, Tabla 31 (fila `usuario`)        | **Cambio:** la lectura de `usuario` es para todo usuario activo, limitada por columnas; el correo no se expone                             | Propuesto |
| 4   | S1     | SDD 6.1.1, Tabla 27                         | Complemento: índices en las claves foráneas que la Tabla 27 no cubre                                                                       | Propuesto |
| 5   | S1     | SDD 3.3.3 («Sesión sin conexión»)           | Precisión: sin red la aplicación abre con el perfil guardado, sin esperar al cliente de Supabase                                           | Propuesto |
| 6   | S2     | SDD 5.3.2, Tabla 21                         | Precisión: parámetros opcionales de `registrar_solucion` y columnas de salida de `sugerir_tipos_falla`                                     | Propuesto |
| 7   | S2     | SDD 6.1.3 (algoritmo general)               | Precisión: el rol que no corresponde a la acción recibe `SIN_PERMISO`, como en la Tabla 22, y no `TRANSICION_INVALIDA`                     | Propuesto |
| 8   | S2     | SDD 6.1.3 (Tabla 30) y 7.3 (parámetros)     | Complemento: el motivo, la justificación y la solución admiten máximo 500 caracteres                                                       | Propuesto |
| 9   | S2     | SDD 6.1.8 y 6.1.3 (Tabla 30)                | Precisión: cadena de fusiones, «hoy» en la hora de Colombia y permisos de `sugerir_tipos_falla`                                            | Propuesto |
| 10  | S3     | SDD 5.3.4 (Tabla 23) y 4.2.10               | Precisión: cuerpo de los errores, `activo` opcional, CORS y `verify_jwt` de las Edge Functions; se despliegan sin Docker                   | Propuesto |
| 11  | S3     | SDD 5.3.2 (Tablas 21 y 22) y 6.1.3          | Precisión de las firmas del sprint. **Cambio:** dos funciones nuevas, tres códigos de error nuevos y una función que `anon` puede ejecutar | Propuesto |

## 1 · Service worker sin librerías de Workbox (S0)

**Sección:** SDD 4.2.4, ficha de C-04, fila «Función».

**Qué pasa.** El SDD no nombra Workbox, así que no hay contradicción. Se anota porque el plan lo
daba por supuesto al elegir `vite-plugin-pwa`: el plugin solo inyecta la lista de archivos de la
versión publicada y el precaché lo hace `src/sw.js` con la API Cache Storage (unas 60 líneas).
Razón: `workbox-precaching` y `workbox-routing` no están en la lista de dependencias aprobadas.

**Texto propuesto (agregar al final de la fila «Función»):**

> El precaché se implementa con la API Cache Storage en el propio service worker: cada versión
> publicada usa una caché con nombre propio y las anteriores se eliminan al activarse la nueva.

Si prefieren usar `workbox-precaching`, es un cambio de pocas líneas en `src/sw.js` (ver
`docs/decisiones-pendientes.md`, punto 7).

## 2 · Íconos como SVG locales de Material Symbols (S0)

**Sección:** SDD 5.2, párrafo «Sistema de diseño».

**Texto propuesto (agregar una frase):**

> Los íconos corresponden al conjunto Material Symbols Rounded (Google, licencia Apache 2.0); en
> la aplicación se incluyen como archivos SVG locales, sin cargar la fuente de íconos, para
> mantener liviana la carga inicial (RNF-05) y funcionar sin conexión.

## 3 · Lectura de `usuario` limitada por columnas (S1)

**Sección:** SDD 6.1.4, Tabla 31, fila `usuario`; y Tabla 20, fila `usuario`.

**El problema.** La Tabla 31 solo deja leer de `usuario` la fila propia. Como `v_novedad` y
`usuario_publico` se ejecutan con los permisos de quien consulta, el nombre del reportante y los
nombres de la línea de tiempo saldrían vacíos para los demás usuarios.

**Texto propuesto para la fila `usuario` de la Tabla 31:**

> Lectura: usuarios activos, todas las filas, solo las columnas id, nombre, rol_id, finca_id,
> area_id y activo. Inserción y actualización: solo gestionar-usuario. Borrado: nadie.

**Texto propuesto para agregar después de la Tabla 31:**

> La lectura de `usuario` se limita con privilegios por columna: el correo no se expone por la
> API de datos. El propio usuario lo tiene en su sesión, y el administrador lo consulta mediante
> una función que verifica su rol (RF-03). Por eso el cliente pide siempre columnas explícitas de
> `usuario`. Se incluyen las filas de usuarios desactivados para que la línea de tiempo conserve
> sus nombres.

**Texto propuesto para la fila `usuario` de la Tabla 20:** «GET de las columnas públicas
(usuarios activos)» en lugar de «GET propio; GET de todos (administrador)».

Detalle en `docs/adr/0010-control-de-acceso-y-lectura-de-usuario.md`.

## 4 · Índices de claves foráneas (S1)

**Sección:** SDD 6.1.1, Tabla 27.

**Texto propuesto (agregar a la nota de la tabla):**

> Además, cada clave foránea que no encabeza uno de estos índices tiene el suyo
> (por ejemplo, `novedad (reportante_id)` y `notificacion (novedad_id)`), para que las uniones y
> las verificaciones de integridad no recorran las tablas completas.

## 5 · Apertura sin conexión con el perfil guardado (S1)

**Sección:** SDD 3.3.3, fila «Sesión sin conexión».

**Qué pasa.** El SDD dice que el cliente de Supabase persiste la sesión y que sin conexión no
puede renovarla. La prueba obligatoria de RNF-10 lo confirmó, con un matiz que el SDD no recoge:
con el token vencido y sin red, el cliente conserva la sesión, pero tarda cerca de medio minuto
reintentando la renovación antes de responder. Esperarlo dejaría al reportante frente a una
pantalla de carga. Resultado completo en `docs/pruebas/sesion-sin-conexion.md`.

**Texto propuesto (agregar al final de la fila):**

> Al abrir sin conexión, la aplicación entra de inmediato con el perfil guardado en el dispositivo
> durante el último ingreso, sin esperar al cliente de Supabase, que con el token vencido reintenta
> la renovación durante cerca de medio minuto. Con conexión, espera la sesión un máximo de cuatro
> segundos. La sesión se renueva sola cuando vuelve la conexión, y el acceso a los datos lo decide
> siempre el servidor (RNF-11).

## 6 · Contratos de las funciones de atención (S2)

**Sección:** SDD 5.3.2, Tabla 21, filas `registrar_solucion` y `sugerir_tipos_falla`.

**Qué pasa.** La Tabla 21 dice que el tipo de falla llega por su identificador o por su nombre, y
que las sugerencias traen la cantidad de novedades y la marca de coincidencia exacta, pero no fija
cómo se declaran esos dos parámetros ni cómo se llaman las columnas del resultado. Al publicar los
contratos del Sprint 2 hubo que decidirlo. No cambia el diseño: lo precisa, como prevé la nota de
la misma tabla.

**Texto propuesto para los parámetros de `registrar_solucion`:**

> p_novedad_id uuid, p_solucion text, p_fecha_ejecucion date, p_tipo_falla_id uuid (opcional) y
> p_tipo_falla_nombre text (opcional). Es una sola función, sin sobrecargas: el cliente envía el
> identificador de un tipo existente o el nombre de un tipo; si llegan los dos, se usa el
> identificador.

**Texto propuesto para el resultado de `sugerir_tipos_falla`:**

> Filas con id, nombre, cantidad_novedades y coincidencia_exacta de los tipos activos que coinciden
> con el texto. RF-14

## 7 · Rol que no corresponde a la acción: `SIN_PERMISO` (S2)

**Sección:** SDD 6.1.3, algoritmo general de las funciones de transición, y Tabla 22.

**Qué pasa.** El algoritmo general comprueba en un solo paso el estado, la acción y el rol, y
responde `TRANSICION_INVALIDA` si la combinación no está permitida. La Tabla 22, en cambio, deja
`SIN_PERMISO` para el rol o el alcance que no permiten la acción y `TRANSICION_INVALIDA` para el
estado. Con el algoritmo al pie de la letra, un reportante que llamara a `tomar_novedad` recibiría
el aviso de que la novedad cambió de estado y el cliente recargaría el detalle, que no es lo que
pasó. Se implementó como la Tabla 22, en este orden: el perfil y el rol (`SIN_PERMISO`), el bloqueo
de la fila y el alcance (`SIN_PERMISO`) y, por último, el estado (`TRANSICION_INVALIDA`). Así,
además, un usuario de otro rol no llega a bloquear la fila.

Estas comprobaciones, los destinatarios y la escritura de los avisos son comunes a todas las
transiciones del sprint: viven en funciones auxiliares del esquema `private`, sin permiso de
ejecución para los roles de la API (migración `rf10_transiciones_base`).

**Texto propuesto (reemplaza las tres comprobaciones del algoritmo):**

> u ← perfil del usuario autenticado. SI u no existe, NO u.activo O u.rol no es el de la acción →
> ERROR SIN_PERMISO
>
> n ← la novedad, con bloqueo de la fila. SI n no existe O NO alcance(u, n) → ERROR SIN_PERMISO
>
> SI n.estado no admite la acción → ERROR TRANSICION_INVALIDA

## 8 · Máximo de 500 caracteres en los textos de las transiciones (S2)

**Sección:** SDD 6.1.3, Tabla 30 (columna de validaciones), y 7.3 (parámetros por validar).

**Qué pasa.** La Tabla 30 pide que el motivo, la justificación y la solución no estén vacíos, pero
no les pone un máximo, y la columna `observacion` del historial es un texto sin límite. Figma sí lo
muestra: las hojas 15, 16 y 17 traen un contador «/500». Se adoptó ese límite (decisión 7 del plan
del Sprint 2), igual al de la descripción de la novedad:

- En el cliente, el parámetro `OBSERVACION_MAX_CARACTERES` de `src/core/config/parametros.js`; el
  campo no deja escribir más y muestra el contador.
- En el servidor, la auxiliar `private.texto_obligatorio`, que usan las funciones de transición:
  quita los espacios y los saltos de línea de los extremos y responde `DATO_OBLIGATORIO` si el
  texto queda vacío o pasa de 500 caracteres. No se agregó un `CHECK` a la tabla: el historial
  solo se escribe desde esas funciones.

**Texto propuesto (Tabla 30, validaciones de `rechazar_novedad`, `reasignar_novedad`,
`escalar_novedad` y `registrar_solucion`):**

> Motivo (o justificación, o solución) no vacío y de máximo 500 caracteres, sin contar los espacios
> de los extremos.

**Texto propuesto (parámetros configurables):**

> Longitud máxima del motivo, la justificación, la observación y la solución: 500 caracteres.

## 9 · Tipos de falla y fecha de ejecución: lo que el SDD deja abierto (S2)

**Sección:** SDD 6.1.8 (algoritmo `resolver_tipo` y sugerencias) y 6.1.3, Tabla 30 (fila
`registrar_solucion`).

**Qué pasa.** Al implementar `registrar_solucion` y `sugerir_tipos_falla` hubo que precisar cuatro
cosas que el SDD no fija. Ninguna cambia el diseño.

1. **Cadena de fusiones** (decisión 21 del plan). El algoritmo dice que, si el nombre corresponde a
   un tipo fusionado, se usa el destino de la última fusión. Ese destino pudo fusionarse después en
   otro tipo: se sigue la cadena hasta llegar a un tipo activo. Si la cadena termina en un tipo
   desactivado, responde `TIPO_FALLA_INVALIDO`.
2. **«Hoy» es el día en Colombia.** La Tabla 30 pide que la fecha de ejecución no sea posterior a la
   actual. El servidor está en UTC: después de las 7 p. m. en Colombia su fecha ya es la de mañana y
   dejaría pasar una fecha futura. La función compara contra la fecha de `America/Bogota`, y el
   cliente calcula su «hoy» de la misma manera.
3. **Permisos de `sugerir_tipos_falla`** (decisión 6 del plan). Es `security definer` y verifica que
   quien la llama sea un aprobador o un administrador activo (si no, `SIN_PERMISO`). Así la cantidad
   de novedades de cada tipo es la de todo el sistema, que es lo que orienta hacia el tipo más
   usado; con los permisos de quien consulta, un aprobador solo contaría las de su área. Sin texto
   devuelve los ocho tipos más usados.
4. **Orden de las guardas de `registrar_solucion`.** Primero lo que falta (`DATO_OBLIGATORIO`:
   solución, fecha o tipo), después la fecha (`FECHA_INVALIDA`) y por último el tipo
   (`TIPO_FALLA_INVALIDO`), de modo que un intento con datos inválidos no llega a crear un tipo.

**Texto propuesto (6.1.8, en `resolver_tipo`):**

> SI t existe Y fue fusionado: RETORNAR el destino de su última fusión; si ese destino también fue
> fusionado, se sigue la cadena hasta un tipo activo; si termina en un tipo desactivado, ERROR
> TIPO_FALLA_INVALIDO

**Texto propuesto (6.1.8, sugerencias):**

> La función se ejecuta con los privilegios de su propietario y verifica que el usuario sea un
> aprobador de área o un administrador activo. La cantidad de novedades de cada tipo es la de todas
> las áreas. Sin texto, devuelve los ocho tipos más usados.

**Texto propuesto (Tabla 30, validaciones de `registrar_solucion`):**

> Solución no vacía; fecha de ejecución no posterior a la fecha actual en Colombia
> (America/Bogota); tipo existente activo o nombre nuevo normalizado sin duplicado (sección 6.1.8)

## 10 · Contrato de las Edge Functions (S3)

**Sección:** SDD 5.3.4, Tabla 23, y 4.2.10 (ficha de C-10).

**Qué pasa.** La Tabla 23 da la solicitud y los estados de respuesta, pero no el cuerpo de un error
ni cómo se despliegan y se prueban las funciones en equipos sin Docker. Al publicar el contrato hubo
que precisarlo (plan del Sprint 3, decisiones 1 a 6 y 14). No cambia el diseño. Detalle en
`docs/adr/0012-edge-functions-sin-docker.md`.

**Texto propuesto (agregar después de la Tabla 23):**

> Las dos funciones reciben `POST` con un objeto JSON. Un error lleva el cuerpo `{ codigo, campos }`:
> `codigo` es un código estable (los de la Tabla 22 y, además, `CORREO_EXISTENTE` y
> `NO_ENCONTRADO`) y `campos` dice qué datos de la solicitud están mal. `gestionar-usuario`
> responde 403 con `SIN_PERMISO` si quien llama no es un administrador activo, o si intenta
> desactivarse o cambiarse el rol a sí mismo; 404 si el usuario no existe. En `crear` y en
> `actualizar` admite además `activo` (opcional).
>
> `gestionar-usuario` conserva la verificación del token que hace la plataforma y, dentro,
> comprueba en la tabla `usuario` que quien llama es un administrador activo.
> `restablecer-contrasena` no exige sesión. Las dos responden solo a los orígenes de la aplicación
> (CORS con lista cerrada).

**Texto propuesto (ficha de C-10, fila «Recursos»):**

> Invocaciones del plan gratuito. La clave de servicio la entrega la plataforma a cada función; no
> se copia a ningún archivo. Las funciones se despliegan con el CLI sin Docker, y su lógica se
> prueba fuera de Deno.

## 11 · Funciones del Sprint 3 (S3)

**Sección:** SDD 5.3.2, Tablas 21 y 22; 6.1.3 (reglas de las funciones); 6.1.4, Tabla 31; y la
regla 2 de `CLAUDE.md`.

**Qué pasa.** Al publicar los contratos del sprint (plan del Sprint 3, decisiones 7, 8, 10 y 13)
hubo que precisar tres firmas y agregar dos funciones que la Tabla 21 no tiene.

1. **Firmas.** `decidir_escalamiento` y `confirmar_resolucion` declaran la observación como
   opcional; que sea obligatoria al rechazar lo valida la función. `generar_codigo_recuperacion`
   devuelve, además del código, cuándo vence, para que la pantalla 32 pueda decir «Vence hoy a
   las…».
2. **`listar_usuarios()`, nueva.** La API de datos no expone el correo (cambio 3 y ADR 0010). El
   administrador lo lee con esta función, que verifica que sea un administrador activo y devuelve
   también el último ingreso, que solo existe en Auth (pantalla 28).
3. **`consumir_codigo_recuperacion(p_correo, p_codigo)`, nueva.** La llama
   `restablecer-contrasena` con la clave de servicio. Compara el código con su resumen dentro de la
   base de datos, así `codigo_hash` no sale de ella, y marca la solicitud como usada. Solo la
   ejecuta `service_role`.
4. **`solicitar_recuperacion` la ejecuta `anon`.** Es lo que dice la Tabla 21 («Sin sesión»), pero
   contradice la regla general de la sección 6.1.3 («su ejecución se revoca al rol anónimo»). Es
   la única excepción; razones y resguardos en `docs/adr/0013`.
5. **Códigos de error nuevos:** `SOLICITUD_INVALIDA` (la solicitud no existe, ya se usó, ya venció
   o su usuario está inactivo) y, en las Edge Functions, `CORREO_EXISTENTE` y `NO_ENCONTRADO`.
   `CODIGO_INVALIDO` deja reintentar, como pide CU-02 9b.

**Texto propuesto (Tabla 21, filas nuevas y cambiadas):**

> decidir_escalamiento · p_novedad_id, p_aprobar boolean, p_observacion (opcional; obligatoria si
> rechaza) · Director de agricultura · Novedad aprobada o rechazada. RF-13
>
> generar_codigo_recuperacion · p_solicitud_id · Administrador · Código de seis dígitos, visible una
> sola vez, y su vencimiento. RF-02
>
> listar_usuarios · — · Administrador · Usuarios con su correo y su último ingreso. RF-03
>
> consumir_codigo_recuperacion · p_correo, p_codigo · Solo restablecer-contrasena · OK con el
> usuario, CODIGO_INVALIDO o CODIGO_VENCIDO; marca la solicitud como usada. RF-02

**Texto propuesto (6.1.3, después de «se concede solo a los usuarios autenticados»):**

> La excepción es solicitar_recuperacion, que no exige sesión: no devuelve nada, no revela si el
> correo existe y solo registra una solicitud por usuario.

**Texto propuesto (Tabla 22, filas nuevas):**

> SOLICITUD_INVALIDA · La solicitud de recuperación no existe, ya se usó, ya venció o su usuario
> está inactivo · «Esta solicitud ya no está disponible»; se recarga la lista.
>
> CORREO_EXISTENTE · El correo ya está registrado (gestionar-usuario) · Pantalla 29, en el campo.

**Texto propuesto (Tabla 31, fila `usuario`, columna de lectura):** agregar «El administrador lee
el correo y el último ingreso con listar_usuarios».
