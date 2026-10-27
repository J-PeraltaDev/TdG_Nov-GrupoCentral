# Cambios frente al SDD y al SRS

El SDD y el SRS son documentos vivos. Cada vez que la implementación se aparta de ellos, se anota
aquí, en el mismo PR, con la sección afectada y el texto propuesto, para que Mateo y Juan
actualicen los documentos (lo exige la Definition of Done).

| N.º | Sprint | Documento y sección                                       | Qué cambia                                                                                                                                                            | Estado    |
| --- | ------ | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 1   | S0     | SDD 4.2.4 (C-04) y plan de arranque («PWA»)               | Precisión, no cambio: el service worker precachea con código propio, sin las librerías de Workbox                                                                     | Propuesto |
| 2   | S0     | SDD 5.2 («Sistema de diseño»)                             | Precisión: los íconos de Figma son la fuente Material Symbols Rounded; en el código son SVG locales del mismo conjunto                                                | Propuesto |
| 3   | S1     | SDD 6.1.4, Tabla 31 (fila `usuario`)                      | **Cambio:** la lectura de `usuario` es para todo usuario activo, limitada por columnas; el correo no se expone                                                        | Propuesto |
| 4   | S1     | SDD 6.1.1, Tabla 27                                       | Complemento: índices en las claves foráneas que la Tabla 27 no cubre                                                                                                  | Propuesto |
| 5   | S1     | SDD 3.3.3 («Sesión sin conexión»)                         | Precisión: sin red la aplicación abre con el perfil guardado, sin esperar al cliente de Supabase                                                                      | Propuesto |
| 6   | S2     | SDD 5.3.2, Tabla 21                                       | Precisión: parámetros opcionales de `registrar_solucion` y columnas de salida de `sugerir_tipos_falla`                                                                | Propuesto |
| 7   | S2     | SDD 6.1.3 (algoritmo general)                             | Precisión: el rol que no corresponde a la acción recibe `SIN_PERMISO`, como en la Tabla 22, y no `TRANSICION_INVALIDA`                                                | Propuesto |
| 8   | S2     | SDD 6.1.3 (Tabla 30) y 7.3 (parámetros)                   | Complemento: el motivo, la justificación y la solución admiten máximo 500 caracteres                                                                                  | Propuesto |
| 9   | S2     | SDD 6.1.8 y 6.1.3 (Tabla 30)                              | Precisión: cadena de fusiones, «hoy» en la hora de Colombia y permisos de `sugerir_tipos_falla`                                                                       | Propuesto |
| 10  | S3     | SDD 5.3.4 (Tabla 23) y 4.2.10                             | Precisión: cuerpo de los errores, `activo` opcional, CORS y `verify_jwt` de las Edge Functions; se despliegan sin Docker                                              | Propuesto |
| 11  | S3     | SDD 5.3.2 (Tablas 21 y 22) y 6.1.3                        | Precisión de las firmas del sprint. **Cambio:** dos funciones nuevas, tres códigos de error nuevos y una función que `anon` puede ejecutar                            | Propuesto |
| 12  | S3     | SDD 6.1.3, Tabla 30                                       | **Cambio:** `registrar_solucion` deja la solución también en el historial y `reportar_falla_persiste` la quita de la novedad                                          | Propuesto |
| 13  | S3     | SDD 5.3.2 (Tabla 20) y 6.1.1 (vistas)                     | Complemento: vista `v_finca`, con las novedades abiertas y los reportantes activos de cada finca                                                                      | Propuesto |
| 14  | S3     | SDD 5.3.1 (Tabla 19), 6.1.10 y Tabla 10                   | Complemento: el perfil se relee con la sesión viva. Precisión de `gestionar-usuario`. Temporal: el administrador entra a «Usuarios»                                   | Propuesto |
| 15  | S3     | SDD 6.1.1 (Tabla 26), 6.1.10 y 7.3                        | **Cambio:** `intentos_fallidos` y un índice único en `solicitud_recuperacion`. Precisión del código temporal y de los estados de la solicitud                         | Propuesto |
| 16  | S3     | SDD 5.2 («Navegación por rol») y Tabla 10                 | Complemento: en el teléfono, el director y el administrador abren «Cuenta» desde un avatar en la barra superior                                                       | Propuesto |
| 17  | S4     | SDD 6.1.4 (Tabla 31), 6.1.7, 5.3.3 y Tabla 22             | **Cambio:** disparador de `evidencia` (estado, máximo de 3, ruta y tamaño real); los archivos se leen a través de su fila; solo JPEG; dos códigos de error nuevos     | Propuesto |
| 18  | S4     | SDD 6.1.5 («Monitor de conexión») y 5.3.6                 | Complemento: de dónde saca el estado el monitor (navegador, fallos de red de cada solicitud y verificación contra Auth), cada cuánto verifica y un solo anuncio       | Propuesto |
| 19  | S4     | SDD 6.1.5 («Registro de la novedad» y «Persistencia»)     | Precisión: un error de sesión al enviar también encola; el aviso de 07 siempre; sin `estimate()`; `persist()` también al encolar                                      | Propuesto |
| 20  | S4     | SDD 6.1.5 («Sincronización de las pendientes») y 5.3.6    | Complemento: disparadores (el monitor, no el evento `online`), Web Locks entre pestañas, solo las del usuario, `SIN_PERMISO` y el error de sesión de la API de datos  | Propuesto |
| 21  | S4     | SDD 6.1.5 (Tabla 32 y «Consulta»)                         | Precisión: qué guarda el almacén `novedades`, qué retira, cómo arma las listas sin conexión y cuándo se borra; fecha y conteos de cada lista                          | Propuesto |
| 22  | S4     | SDD 5.2, 6.1.11 y 7.3                                     | Complemento: «registrada sin conexión» se deriva de las dos fechas con un umbral configurable                                                                         | Propuesto |
| 23  | S4     | SRS RF-08, CU-08 y CU-14; SDD Tablas 26, 31 y 35, y 6.1.7 | **Cambio:** el aprobador del área adjunta fotos de la solución; `evidencia.transicion_id` las ata a su intento                                                        | Propuesto |
| 24  | S5     | SDD 5.3.2, Tabla 21                                       | Precisión: tipos de retorno de las nueve funciones del sprint, `p_desde` y `p_hasta` como `date` y la forma del `jsonb` de cada indicador                             | Propuesto |
| 25  | S5     | SDD 6.1.1 («Vistas e índices»), Tablas 20 y 34            | Complemento: `v_novedad.resuelta_en`, una sola regla para «Tiempo hasta resolver»                                                                                     | Propuesto |
| 26  | S5     | SDD 5.3.2 (Tabla 20) y 6.1.4 (Tabla 31)                   | **Cambio:** el cliente ya no actualiza `notificacion`; `marcar_avisos_leidos` es la única forma de marcar un aviso                                                    | Propuesto |
| 27  | S5     | SDD 6.1.6 (Tabla 33)                                      | Precisión: el texto sale del estado nuevo y del rol del destinatario; sin el código, que va aparte; «reasignada» manda sobre Figma 10                                 | Propuesto |
| 28  | S5     | SDD 5.2.5 y Tabla 20 (fila `v_novedad`)                   | Complemento: filtros del historial en la dirección, el grupo «abiertas», las opciones de cada filtro, sin conexión y el buscador por código                           | Propuesto |
| 29  | S5     | SDD 6.1.9 (Tabla 34), 5.2.6 y Tabla 22                    | Precisión: período en días de Colombia, «por mes», «Datos al», quién agrupa, «abiertas con más tiempo», opciones del período; `FECHA_INVALIDA` también en las `rpt_*` | Propuesto |
| 30  | S5     | SDD 6.1.8 y Tabla 22                                      | **Cambio:** `TIPO_FALLA_DUPLICADO`; bloqueos de la fusión, destino inactivo, `for share` al resolver, sin reactivar y la lista sin los fusionados                     | Propuesto |
| 31  | S5     | SDD 6.1.3 (Tabla 30) y 5.2.5                              | Precisión: la observación de la corrección del tipo de falla y cómo la muestra la línea de tiempo                                                                     | Propuesto |
| 32  | S5     | SDD 5.3.8 y 7.3 (Tabla 39)                                | **Cambio, por validar:** separador `;`; columnas, fechas, horas y nombre del archivo; fórmulas neutralizadas                                                          | Propuesto |
| 33  | S5     | SDD 6.1.6, 5.3.4, 5.3.5 y 4.2.10                          | Precisión: webhook propio con `pg_net` y Vault, el contenido que envía, el encabezado secreto, `verify_jwt = false`, cifrado con Web Crypto y `TTL`                   | Propuesto |
| 34  | S5     | SDD 5.3.5 y 6.1.6                                         | Precisión: dónde se ofrece 10-B, el control de Cuenta, el cierre de sesión y el contenido del push sin la descripción (RNF-18)                                        | Propuesto |
| 35  | S5     | SDD 5.2, Tabla 10                                         | Cierra el temporal del cambio 14: el administrador entra a `/panel`                                                                                                   | Propuesto |
| 36  | S5     | SDD 5.2.5 (pantalla 04)                                   | Complemento: insignia en «Rechazadas» con las rechazadas que el reportante no ha visto (sus avisos de rechazo sin leer)                                               | Propuesto |
| 37  | S5     | SDD 5.2 («Navegación por rol») y Tabla 10                 | **Cambio:** «Cuenta» en la barra inferior de todos los roles («Más» para el administrador) y los avisos en la campana. Reemplaza el cambio 16                         | Propuesto |
| 38  | S5     | SRS RF-26 a RF-29; SDD 6.1.9 y Tablas 10 y 21             | **Cambio:** el aprobador de área ve el panel de reportes, solo de su área                                                                                             | Propuesto |
| 39  | S5     | SDD 6.1.8, Tabla 21 y tipo `accion_auditoria`             | **Cambio:** `reactivar_tipo_falla` para los tipos desactivados; deshace «sin reactivar» del cambio 30, salvo para los fusionados                                      | Propuesto |
| 40  | S5     | SRS RF-04; SDD 6.1.4 (Tabla 31) y Tabla 22                | **Cambio:** el administrador crea, renombra, desactiva y reactiva las razones sociales desde Fincas; `RAZON_SOCIAL_EXISTENTE`                                         | Propuesto |
| 41  | S5     | SDD 6.1.7 y 5.2.5                                         | Complemento: las fotos se abren en un visor dentro de la aplicación, no en otra pestaña con la URL firmada                                                            | Propuesto |
| 42  | S5     | SDD 5.2 («Sistema de diseño»)                             | Complemento: el logo de Grupo Central en el ingreso, la barra lateral, el favicon y los íconos de la aplicación                                                       | Propuesto |
| 43  | S5     | SDD 5.3.5                                                 | Precisión: en Brave de escritorio, el error de activar las notificaciones dice qué ajuste encender                                                                    | Propuesto |

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

## 12 · La solución cuando la falla persiste (S3)

**Sección:** SDD 6.1.3, Tabla 30 (filas de `registrar_solucion`, `confirmar_resolucion` y
`reportar_falla_persiste`).

**Qué pasa.** La Tabla 30 dice de `registrar_solucion`: «Sin observación; la solución queda en la
novedad». Y de «la falla persiste» solo dice que la novedad vuelve a estar en atención. Con eso,
una novedad en atención seguiría mostrando una solución, una fecha de ejecución y un tipo de
falla; y al registrar la solución siguiente, el texto de la primera se perdería, porque no está en
ningún otro lado. Se adoptó la opción C de la decisión 21 del plan del Sprint 3:

1. **`registrar_solucion` guarda además la solución como observación de su transición.** El
   historial es inmutable (RNF-12): conserva el texto de cada intento, y la línea de tiempo lo
   muestra bajo «→ Resuelta».
2. **`reportar_falla_persiste` limpia de la novedad** `solucion`, `fecha_ejecucion` y
   `tipo_falla_id`. Una novedad en atención nunca trae una solución, y la restricción
   `novedad_resuelta_completa` sigue valiendo para las resueltas y las cerradas.
3. **`confirmar_resolucion` conserva los tres datos:** son lo que queda de la novedad cerrada.

**Lo que se pierde:** el tipo de falla y la fecha de ejecución del intento que no sirvió; el texto
de la solución, no. Los reportes del Sprint 5 no cambian: RF-27 y RF-29 miran el estado y la
última resolución.

**Lo que no cambia:** las soluciones registradas antes de este cambio siguen sin observación en
el historial, que no se puede corregir; su texto está en la novedad.

También queda precisado quién puede responder: cualquier reportante activo de la finca de la
novedad, no solo quien la registró, aunque la finca se haya desactivado después (CU-04 3b).

**Texto propuesto (Tabla 30, fila de `registrar_solucion`, columna del historial):**

> en atención o aprobada → resuelta, con la solución como observación. La solución, la fecha de
> ejecución y el tipo de falla quedan además en la novedad.

**Texto propuesto (Tabla 30, fila de `reportar_falla_persiste`):**

> Reportante activo de la finca de la novedad · Estado resuelta · Observación no vacía y de máximo
> 500 caracteres · resuelta → en atención, con la observación; la novedad pierde la solución, la
> fecha de ejecución y el tipo de falla, que se registran de nuevo al resolverla · Avisa a los
> aprobadores activos del área.

**Texto propuesto (Tabla 30, fila de `confirmar_resolucion`):**

> Reportante activo de la finca de la novedad · Estado resuelta · Observación opcional, de máximo
> 500 caracteres · resuelta → cerrada, con la observación si la hay; la novedad conserva la
> solución · Avisa a los aprobadores activos del área.

## 13 · Vista `v_finca` (S3)

**Sección:** SDD 5.3.2, Tabla 20 (recursos de la API de datos), y 6.1.1 («Vistas e índices»).

**Qué pasa.** La pantalla 30 muestra, junto a cada finca, su razón social, sus novedades abiertas y
sus reportantes asignados, y el diálogo de desactivar advierte cuántas novedades abiertas tiene
(CU-04 3b). El modelo no trae de dónde sacar esos conteos. El plan del Sprint 3 (decisión 17)
preveía pedirlos a la API como recursos embebidos y, si no se podía, una vista. No se pudo: la
lectura de `usuario` está limitada por columnas (cambio 3 y ADR 0010), y contar usuarios como
recurso embebido pide la tabla completa («permission denied for table usuario»).

Se agregó la vista `public.v_finca` (`rf04_vista_finca`):

- Columnas: `id`, `nombre`, `activo`, `creado_en`, `razon_social_id`, `razon_social`,
  `novedades_abiertas` (las que no están cerradas ni rechazadas) y `reportantes_activos`.
- Es `security_invoker`: no da acceso a nada nuevo. Cada consulta pasa por las políticas de
  `finca`, `novedad` y `usuario` de quien la hace; el administrador, que ve todas las
  novedades, obtiene los conteos reales.
- Solo lectura para `authenticated`. Las escrituras siguen yendo a `finca`, con las políticas
  del Sprint 1; no hay funciones nuevas.

**Texto propuesto (Tabla 20, fila nueva):**

> v_finca (vista) · GET con filtros y orden · Pantalla 30: finca con su razón social, sus novedades
> abiertas y sus reportantes activos.

**Texto propuesto (6.1.1, «Vistas e índices», después de usuario_publico):**

> La vista v_finca agrega a cada finca su razón social, la cantidad de novedades abiertas y la de
> reportantes activos, para la pantalla de administración de fincas. Se define igual, con
> security_invoker.

## 14 · Cuentas: sesión viva, `gestionar-usuario` e inicio del administrador (S3)

**Sección:** SDD 5.3.1, Tabla 19 (sesión); 6.1.10 y Tabla 23 (gestión de cuentas); Tabla 10 (pantalla
de inicio de cada rol).

**1. El perfil se relee con la sesión viva (complemento).** El SDD lee el perfil al ingresar y al
abrir la aplicación. Con RF-03, un administrador puede desactivar a alguien, o cambiarle el rol o
la finca, mientras esa persona tiene la aplicación abierta. La base de datos deja de responderle
de inmediato (las políticas miran `usuario.activo` y el rol en cada consulta), pero el menú y las
pantallas seguirían siendo los de antes. Ahora la aplicación relee el perfil:

- al volver a la pestaña o a la ventana, a lo sumo una vez por minuto;
- cuando una acción responde `SIN_PERMISO`.

Si el usuario ya no está activo, cierra la sesión local, conserva las novedades pendientes de
sincronizar y muestra en el ingreso el aviso 01-C. Si cambió el rol, la finca o el área, lo lleva
a su pantalla de inicio con el menú nuevo.

**2. `gestionar-usuario` (precisión de la Tabla 23).** Cada usuario vive en dos lugares, la
cuenta de Auth y su perfil en `usuario`, y ninguna transacción cubre los dos. La función los toca
en el orden que deja el fallo intermedio menos grave, y todas las acciones dan el mismo resultado
si se repiten:

- `crear`: primero la cuenta de Auth (con el correo confirmado) y después el perfil; si el perfil
  no se guarda, borra la cuenta recién creada. Es el único borrado.
- `desactivar`: primero `usuario.activo = false`, que corta los datos de inmediato, y después la
  suspensión en Auth. `activar`, al revés.
- `actualizar`: nombre, rol y finca o área; el correo no se edita. La finca o el área se
  validan (que existan y estén activas) solo si cambian.
- Nadie se desactiva ni se cambia el rol a sí mismo (403): así siempre queda un administrador.
- `service_role` no tiene `delete` sobre `usuario`: un usuario se desactiva, nunca se borra.

**3. Inicio del administrador (temporal).** La Tabla 10 dice que el administrador entra al panel
de reportes, que llega en el Sprint 5. Mientras tanto entra a «Usuarios». No hay que cambiar el
SDD: se vuelve a la Tabla 10 cuando exista el panel.

**Texto propuesto (Tabla 19, fila nueva):**

> Con la sesión abierta · Al volver a la aplicación y cuando una acción responde SIN_PERMISO · Se
> relee el perfil. Usuario inactivo: se cierra la sesión local, se conservan las pendientes y se
> muestra el aviso de usuario desactivado. Rol o alcance distinto: se actualiza el menú y se lleva
> a su pantalla de inicio.

**Texto propuesto (6.1.10, después de la descripción de gestionar-usuario):**

> Como la cuenta de Auth y el perfil no se escriben en una misma transacción, la función crea
> primero la cuenta y después el perfil (y borra la cuenta si el perfil falla), desactiva primero
> el perfil y después suspende la cuenta, y reactiva en el orden contrario. Ninguna acción borra un
> usuario existente, y nadie puede desactivarse ni cambiarse el rol a sí mismo.

## 15 · Recuperación de contraseña: intentos, una solicitud abierta y estados (S3)

**Sección:** SDD 6.1.1, Tabla 26 (`solicitud_recuperacion`); 6.1.10 (recuperación mediada por el
administrador); 7.3 (parámetros). Complementa el cambio 11, que publicó las firmas.

**1. `solicitud_recuperacion` cambia (Tabla 26).** Un código tiene seis dígitos: un millón de
posibilidades. Lo protege que dura 30 minutos y que admite pocos intentos, y la tabla no tenía
cómo contarlos.

- Columna nueva `intentos_fallidos smallint not null default 0`, entre 0 y 5. Cada código
  incorrecto suma uno; al quinto, el código deja de servir. Un código nuevo los vuelve a cero.
- `codigo_hash` y `expira_en` se llenan juntos (restricción).
- Índice único parcial sobre `usuario_id` para las solicitudes sin usar y sin código: un usuario
  no tiene dos esperando, ni con dos peticiones a la vez. Hace falta porque
  `solicitar_recuperacion` se ejecuta sin sesión.
- El administrador lee `intentos_fallidos`, para saber que un código quedó bloqueado. El resumen
  del código sigue sin poder leerse por la API.

**2. Una solicitud abierta por usuario (precisión de 6.1.10).** Está abierta la que no se ha usado
y, o no tiene código, o lo tiene vigente (no venció ni agotó sus intentos). Con una abierta, pedir
otra no crea nada y responde igual. Una que ya no está abierta no se reabre: la persona pide otra.
La regla vive en una sola función, `private.solicitud_abierta`, que usan las tres.

**3. El código (precisión de 6.1.10).**

- Sale de `gen_random_bytes` (pgcrypto), con descarte para que los seis dígitos sean uniformes;
  nunca de `random()`.
- Se guarda como resumen con sal (`crypt`, bcrypt con costo 10). Con un millón de códigos
  posibles el resumen no resiste a quien tenga la base de datos; el costo hace que recorrerlos
  tome más que los 30 minutos que dura el código.
- `consumir_codigo_recuperacion` responde `CODIGO_VENCIDO` solo a quien conoce el código (ya
  usado, vencido o sin intentos) y `CODIGO_INVALIDO` en los demás casos, incluido el correo que
  no existe, tardando lo mismo: ninguna respuesta dice si un correo está registrado. Devuelve el
  resultado en lugar de lanzar una excepción, porque una excepción desharía la suma del intento.
- `restablecer-contrasena` revisa la forma de la solicitud antes de tocar el código (una
  contraseña que no cumple la regla no gasta un intento) y gasta el código **antes** de cambiar la
  contraseña: si Auth falla, la persona pide otro. Un código nunca sirve dos veces.
- Si al usuario lo desactivan, su solicitud deja de servir: no admite un código nuevo
  (`SOLICITUD_INVALIDA`) ni se acepta el que tenía.

**4. Estados de la solicitud (precisión de 6.1.10).** No se guardan: se derivan de `usado`,
`expira_en` e `intentos_fallidos`. Pendiente (sin código), código generado (vigente), usada y
vencida (pasó el tiempo, agotó los intentos o su usuario fue desactivado).

**5. Parámetro nuevo (7.3):** máximo de intentos fallidos por código, 5. La vigencia sigue en 30
minutos.

**Texto propuesto (Tabla 26, fila `solicitud_recuperacion`):**

> id, usuario_id, codigo_hash, expira_en, usado, intentos_fallidos, creada_en · codigo_hash y
> expira_en se diligencian juntos al generar el código · intentos_fallidos entre 0 y 5 · Un
> usuario tiene a lo sumo una solicitud sin usar y sin código (índice único parcial).

**Texto propuesto (6.1.10, después de la descripción del código temporal):**

> El código se genera con una fuente criptográfica y se guarda solo su resumen con sal. Admite
> cinco intentos fallidos y 30 minutos; después, o una vez usado, deja de servir y la persona
> solicita otro. Un usuario tiene una sola solicitud abierta. La validación responde igual para un
> correo inexistente que para un código incorrecto, y el código se gasta antes de cambiar la
> contraseña.

**Texto propuesto (7.3, fila nueva):**

> Intentos fallidos por código temporal · 5 · Al alcanzarlo, el código deja de servir.

## 16 · «Cuenta» en el teléfono del director y del administrador (S3)

**Sección:** SDD 5.2, «Navegación por rol», y Tabla 10 (menú de cada rol).

**Qué pasa.** En el teléfono la navegación es una barra inferior de cuatro opciones. La del
reportante y la del aprobador traen «Cuenta». La del director (Escaladas, Historial, Panel y
Avisos) y la del administrador (Panel, Historial, Usuarios y Avisos) no, ni en la Tabla 10 ni en
Figma (pantalla 20-C). «Cuenta» es donde se cierra la sesión (CU-01, pasos 5 y 6) y, para el
administrador, por donde se llega en el teléfono a Fincas, Tipos de falla y Recuperación de
contraseñas, que no caben en la barra. Sin una entrada, esos dos roles solo llegaban escribiendo
la dirección.

**Qué se hizo (complemento).** En el teléfono, la barra superior de esos dos roles lleva el avatar
con las iniciales que ya tiene la del escritorio, y abre «Cuenta». La barra inferior no cambia:
siguen siendo las cuatro opciones de la Tabla 10. Para el administrador, el avatar carga la
insignia de las solicitudes de recuperación que esperan un código, que en el teléfono solo se veía
dentro de «Cuenta». El equipo dejó esta decisión a la implementación (10 oct 2026).

**Texto propuesto (5.2, «Navegación por rol», después de la barra inferior):**

> Cuando «Cuenta» no es una de las cuatro opciones de la barra inferior (director de agricultura y
> administrador), la barra superior del teléfono incluye el avatar del usuario, que la abre, igual
> que en el escritorio.

## 17 · Evidencias: disparador de `evidencia`, lectura por la fila y dos códigos (S4)

**Sección:** SDD 6.1.4 (Tabla 31, filas `evidencia` y «Objetos del bucket evidencias»), 6.1.7,
5.3.3 y 5.3.2 (Tabla 22).

**Qué pasa.** La Tabla 31 dice quién sube y quién lee, pero RF-08 pone tres reglas más que una
política no puede garantizar con seguridad: la novedad no puede estar cerrada ni rechazada, tiene
como máximo 3 fotos (`FOTOS_MAXIMO_POR_NOVEDAD`) y la fila de `evidencia` tiene que corresponder a
un archivo de esa novedad. Contar dentro de una política no es seguro con dos subidas a la vez, y
el tamaño que manda el cliente no es de fiar. Además, repetir el alcance de la novedad a partir del
nombre de la carpeta duplicaba las reglas de 6.1.4.

**Qué se hizo** (migración `rf08_evidencias`, decisiones 19 a 21 del plan del Sprint 4):

- **Bucket** privado de 1 MB y solo `image/jpeg`: el cliente recodifica toda foto a JPEG (6.1.7).
- **Subida** (`storage.objects`, insert): reportante activo, nombre `{novedad_id}/{uuid}.jpg` de
  una novedad de su finca que no esté cerrada ni rechazada y tenga menos de 3 evidencias.
- **Lectura** (`storage.objects`, select): quien puede leer la fila de `evidencia` con esa ruta,
  que ya filtra su política por el alcance de la novedad. Un archivo sin fila no lo ve nadie.
- **Disparador** `before insert` en `evidencia` (`private.tg_evidencia_valida`, `security
definer`): bloquea la novedad (`for update`), repite el alcance del reportante, exige el estado
  no final y menos de 3 evidencias, comprueba que el archivo exista en la carpeta de su novedad y
  toma `tamano_bytes` del archivo.
- **Códigos nuevos:** `LIMITE_DE_FOTOS` (ya tiene 3) y `EVIDENCIA_INVALIDA` (la fila no corresponde
  a un archivo de la novedad). El estado final responde `TRANSICION_INVALIDA`, como las
  transiciones.

**Texto propuesto (6.1.4, Tabla 31, fila «Objetos del bucket evidencias», columna Lectura):**

> Si existe la fila de `evidencia` con esa ruta y quien consulta puede leerla.

**Texto propuesto (6.1.7, después de «e inserta la fila de evidencia con la ruta y el tamaño»):**

> Un disparador de `evidencia` bloquea la novedad mientras valida: que no esté cerrada ni
> rechazada, que tenga menos fotos que el máximo configurado y que el archivo exista en la carpeta
> de la novedad. El tamaño se toma del archivo guardado. El bucket acepta solo JPEG, porque el
> cliente recodifica toda imagen antes de subirla.

**Texto propuesto (Tabla 22, dos filas nuevas):**

> | `LIMITE_DE_FOTOS` | La novedad ya tiene el máximo de fotos | «Esta novedad ya tiene 3 fotos.» |
> | `EVIDENCIA_INVALIDA` | La fila no corresponde a un archivo de la novedad | «No pudimos guardar la foto. Intenta de nuevo.» |

## 18 · Monitor de conexión: fuentes, verificación y anuncio (S4)

**Sección:** SDD 6.1.5, viñeta «Monitor de conexión (RF-23, RF-25)», y 5.3.6 (Tabla 24, fila
«Eventos de conexión»).

**Qué pasa.** El SDD dice que el monitor «combina el estado que informa el navegador con la
detección de fallos de red en las solicitudes» y que «mientras está sin conexión, verifica
periódicamente si el servidor responde», pero no dice contra qué, cada cuánto ni cómo se anuncia.

**Qué se hizo (complemento; plan del Sprint 4, decisiones 11 y 12):**

- Hay conexión si el navegador dice que la hay (`navigator.onLine` y sus eventos) **y** el servidor
  no dejó de responder. El cliente único de Supabase avisa al monitor de cada solicitud: un fallo
  de red (`TypeError` de `fetch`) lo pasa a «Sin conexión»; cualquier respuesta lo confirma. Una
  red «conectada» sin internet (portal cautivo, señal débil) ya no engaña al indicador.
- Mientras el servidor no responde, el monitor verifica cada **15 s** contra `/auth/v1/health`, con
  la clave publicable, **5 s** de espera máxima y sin caché, y en pausa con la pestaña oculta. Es
  otro origen: el service worker no la toca. Al volver el evento `online` verifica de inmediato.
- El indicador muestra también las pendientes **del usuario** («Sin conexión · 1 pendiente», «En
  línea · 2 pendientes»). Se actualiza al cambiar la cola, en esta pestaña o en otra
  (`BroadcastChannel`).
- El indicador ya no se anuncia por sí mismo: varias barras pintan uno a la vez. El marco tiene
  una sola región `aria-live="polite"` con el mismo texto.

**Texto propuesto (6.1.5, al final de la viñeta «Monitor de conexión»):**

> El estado sale de los eventos de conexión del navegador y de cada solicitud del cliente de
> Supabase: un fallo de red marca «sin conexión» aunque el navegador diga que hay red, y cualquier
> respuesta lo confirma. Mientras el servidor no responde, el monitor consulta cada 15 s el
> servicio de salud de Auth, con 5 s de espera máxima y en pausa con la pestaña oculta. El
> indicador muestra la cantidad de pendientes del usuario y se anuncia una sola vez por cambio.

## 19 · Registro sin conexión: error de sesión, aviso de 07 y persistencia (S4)

**Sección:** SDD 6.1.5, «Registro de la novedad» (seudocódigo) y «Persistencia (RNF-07)».

**Qué pasa.** El algoritmo dice qué hacer con un error de red («continuar como sin conexión») y con
uno de negocio, pero no con uno de sesión (la sesión venció y no se pudo renovar). En persistencia,
pide verificar la cuota y mostrar el aviso de 07 solo si el navegador no concedió el almacenamiento
persistente; Figma lo dibuja siempre.

**Qué se hizo (precisión; plan del Sprint 4, decisiones 1 a 3):**

- Un error de **sesión** al enviar se trata como uno de red: la novedad va a la cola y aparece 07.
  La sincronización pide el ingreso (08-B) y la envía con la sesión nueva. Así lo escrito no se
  pierde.
- 07 aparece solo después de que la transacción de IndexedDB terminó. Si falla, el formulario dice
  por qué (almacenamiento lleno, `QuotaExceededError`, o cualquier otra falla) y conserva lo escrito.
- El aviso de 07 sale **siempre**: es cierto en los dos casos y no hace falta preguntar si el
  navegador concedió la persistencia.
- **No se usa `navigator.storage.estimate()`:** es aproximado y no cambia nada; la cuota llena la
  avisa la escritura misma. `persist()` se pide al ingresar y otra vez al encolar (Safari decide
  según el uso).

**Texto propuesto (6.1.5, seudocódigo de `registrar`):**

> SI error de red O error de sesión: continuar como sin conexión

**Texto propuesto (6.1.5, viñeta «Persistencia»):**

> Persistencia (RNF-07): al ingresar y al guardar una pendiente, la aplicación solicita al navegador
> almacenamiento persistente. La constancia de la pantalla 07 recomienda siempre no borrar los datos
> del navegador hasta sincronizar. Si el almacenamiento está lleno, la escritura falla con
> `QuotaExceededError` y el formulario lo informa (CU-21 2a).

## 20 · Sincronización: disparadores, un solo ciclo y alcance (S4)

**Sección:** SDD 6.1.5, «Sincronización de las pendientes» (párrafo, seudocódigo y Figura 18), y
5.3.6 (Tabla 24, fila «Eventos de conexión»).

**Qué pasa.** El algoritmo se dispara con el evento `online` del navegador, que también llega en
una red sin internet (portal cautivo). El indicador de ejecución solo ve la pestaña donde corre: dos
pestañas abiertas harían dos ciclos. No dice qué pasa con una pendiente que quedó «enviando» porque
la aplicación se cerró a mitad del envío, ni con `SIN_PERMISO`, ni con las pendientes de otra
persona del dispositivo. Tampoco cómo reconoce el cliente el error de sesión: la API de datos no
pone el estado HTTP en el error que entrega `supabase-js`.

**Qué se hizo (complemento; plan del Sprint 4, decisiones 5 a 10):**

- **Disparadores:** abrir la aplicación con sesión y red, el monitor de conexión que pasa a «en
  línea» (cambio 18), «Reintentar» y «Reintentar todo» (08) y el nuevo ingreso después de 08-B.
- **Un solo ciclo:** la bandera en la pestaña y, entre pestañas,
  `navigator.locks.request('novedades-sincronizacion', { ifAvailable: true })`: si otra pestaña
  tiene el bloqueo, este ciclo no corre. Sin Web Locks queda la bandera; la idempotencia de
  `registrar_novedad` por `id_local` es la red de seguridad (RNF-08).
- **«Enviando» que sobró** de un envío interrumpido: el ciclo siguiente la vuelve a enviar.
- **Solo las del usuario de la sesión** (RNF-10): las de otra persona del dispositivo no se
  envían, no se cuentan y no se muestran.
- **La sesión se confirma antes del primer envío** (`getSession()`, que la renueva si venció) con
  4 s de espera máxima. Si no hay respuesta, el ciclo termina sin tocar la cola.
- **`SIN_PERMISO`:** esa pendiente queda con su error, se relee el perfil (decisión 16 del Sprint 3) y el ciclo se detiene sin marcar las demás.
- **Errores de negocio:** el ciclo automático no los repite; solo «Reintentar». Los de red sí.
- **Error de sesión:** el 401 de Auth y los códigos `PGRST301` (token inválido) y `PGRST303`
  (vencido) de la API de datos. La pendiente vuelve a la cola y aparece 08-B.
- **«Última sincronización completa»** se guarda solo cuando la cola queda vacía.

**Texto propuesto (6.1.5, primer párrafo de «Sincronización de las pendientes»):**

> La sincronización se dispara al abrir la aplicación con conexión, cuando el monitor de conexión
> pasa a «en línea», cuando el usuario pulsa «Reintentar» o «Reintentar todo» (pantalla 08) y al
> volver a ingresar después de 08-B. No depende de la sincronización en segundo plano del
> navegador, que no está disponible en todos los navegadores objetivo y que el SRS no exige (RF-22
> requiere la aplicación abierta). Un indicador de ejecución en la pestaña y un bloqueo entre
> pestañas (Web Locks) evitan que dos ciclos corran a la vez (Figura 18). Solo se envían las
> pendientes del usuario de la sesión (RNF-10).

**Texto propuesto (6.1.5, seudocódigo de `sincronizar`; cambian las líneas marcadas):**

> SI ya hay una sincronización en curso O no hay conexión **O otra pestaña tiene el bloqueo**: FIN
>
> SI la sesión venció Y no se puede renovar: conservar la cola; solicitar el ingreso (08-B); FIN
>
> PARA CADA pendiente p **del usuario** EN «pendientes» ORDENADAS POR fecha_registro, **salvo las
> que tienen un error de negocio**:
>
> …
>
> **SI SIN_PERMISO: marcar p con el error; releer el perfil; DETENER**
>
> **SI la cola quedó vacía:** actualizar la fecha de la última sincronización

**Texto propuesto (5.3.6, Tabla 24, primera columna de la fila):**

> Cambios del monitor de conexión (eventos online y offline y respuestas del servidor)

## 21 · Consulta sin conexión: qué se guarda, qué se retira y los conteos (S4)

**Sección:** SDD 6.1.5, Tabla 32 (almacenes `novedades` y `meta`) y la viñeta «Consulta (RF-24)».

**Qué pasa.** La Tabla 32 dice que `novedades` guarda la última versión descargada de cada
novedad, «con su línea de tiempo», y que «se reemplaza en cada consulta con conexión». Pero cada
consulta trae solo una lista o una novedad. No dice qué pasa con una novedad que salió de una
lista porque cambió de estado o de área, ni con los conteos de las pestañas que no se abrieron.
Tampoco dice qué pasa si el perfil cambia de rol o de alcance sin cerrar la sesión. Y `meta` tiene
una sola «fecha de la última actualización».

**Qué se hizo (precisión; plan del Sprint 4, decisiones 13 a 16):**

- **Qué se guarda.** Cada consulta con conexión guarda lo que trae, combinado por `id` con lo que
  ya había: «Mis novedades», la bandeja, las escaladas del director (con su escalamiento) y el
  detalle con su línea de tiempo. Si la novedad cambió de estado, su línea de tiempo guardada se
  descarta hasta que se vuelva a abrir con conexión.
- **Qué se retira.** Una novedad guardada que, por su lugar en el orden, tendría que haber
  llegado en una página y no llegó, ya no está en esa lista: se borra. También se borra si el
  servidor ya no deja verla.
- **Cómo se arma una lista sin conexión.** Con el mismo filtro, orden, páginas de 20 y «Ver más»
  que el servidor. Los conteos de las pestañas y de los contadores son los de la última descarga,
  aunque esa pestaña no se haya abierto (Figma 04-B y 11-B).
- **`meta` por lista.** Guarda la fecha de descarga de cada lista (`descarga:…`) y sus conteos
  (`descarga:conteo:…`). Sin conexión, cada vista muestra la de su lista.
- **Sin esperar a la red.** Si el monitor ya sabe que no hay conexión, la lectura va directo al
  dispositivo, sin los cerca de 7 s de reintentos de la API (punto 34 de las decisiones
  pendientes). Si la red falla en el camino, también responde con lo descargado.
- **Cuándo se borra.** Al cerrar la sesión, como ya decía la tabla, y también si el perfil vuelve
  del servidor con otro rol, finca o área.
- **CU-24 3a.** Una lista que nunca se descargó dice «La primera consulta necesita conexión. Abre
  esta pantalla con internet para descargar tus novedades.» En el detalle, «Esta novedad no está
  descargada. Ábrela con conexión.» Es un código interno del cliente (`SIN_DESCARGA`), no de la
  Tabla 22.

**Texto propuesto (Tabla 32, fila `novedades`, «Ciclo de vida»):**

> Se actualiza con cada consulta con conexión, combinada por `id`; se retiran las que ya no están
> en la lista consultada. Se borra al cerrar sesión o si cambian el rol, la finca o el área del
> usuario.

**Texto propuesto (Tabla 32, fila `meta`, «Contenido»):**

> Usuario dueño de los datos, fecha de descarga y conteos de cada lista, y versión del esquema
> local

**Texto propuesto (6.1.5, viñeta «Consulta (RF-24)»):**

> Consulta (RF-24): cada consulta con conexión de Mis novedades, de la bandeja, de las escaladas o
> del detalle actualiza el almacén novedades. Sin conexión, las vistas leen de ese almacén con el
> mismo filtro, orden y paginación que el servidor, y muestran la fecha y la hora de la descarga de
> esa lista (RF-09, RF-18); si esa lista no se ha descargado, informan que la primera consulta
> requiere conexión.

## 22 · Cómo se sabe que una novedad se registró sin conexión (S4)

**Sección:** SDD 5.2 (detalle completo, Figura 12) y 6.1.11; 7.3 (decisiones por validar).

**Qué pasa.** El SDD dice que la ficha «indica cuándo la novedad se registró sin conexión (RNF-09)»,
y Figma lo escribe en la primera entrada de la línea de tiempo («21 sep, 6:48 a. m. · registrada
sin conexión», pantalla 20). Pero ni la Tabla 26 ni `registrar_novedad` guardan ese dato.

**Qué se hizo (complemento; plan del Sprint 4, decisión 25, opción A):** se deriva de las dos
fechas que ya existen. Si `fecha_sincronizacion` es más de `REGISTRO_SIN_CONEXION_MINUTOS` (5,
parámetro nuevo de `parametros.js`) posterior a `fecha_registro`, la novedad se registró sin
conexión: un envío con conexión tarda segundos. La base no cambia. Lo dice la entrada del registro
en la línea de tiempo del detalle, para los cuatro roles.

**Texto propuesto (6.1.11, al final del párrafo del detalle):**

> «Registrada sin conexión» se deriva de las dos fechas: si la sincronización llegó más de
> `REGISTRO_SIN_CONEXION_MINUTOS` (5) después del registro en la finca, la entrada del registro
> en la línea de tiempo lo indica. No se guarda en la base.

**Texto propuesto (7.3, una fila nueva):**

> El umbral de 5 minutos para «registrada sin conexión» se valida en el piloto con los tiempos
> reales de envío desde las fincas.

## 23 · Fotos de la solución: también las adjunta el aprobador del área (S4)

**Sección:** SRS RF-08; CU-08 y CU-14; SDD 5.2.3 (y la fila de la pantalla 18), 6.1.1 (Tabla 26,
fila `evidencia`), 6.1.4 (Tabla 31), 6.1.7, 6.1.11 (Tabla 35) y la fila de RF-08 en la Tabla 36.

**Qué pasa.** RF-08, CU-08 y la Tabla 31 dejan adjuntar fotos solo al reportante, y Figma no
dibuja fotos en la pantalla 18 ni en la solución del detalle. El equipo pidió (14 oct) que el
aprobador del área también deje fotos de lo que hizo, con el estilo del resto de la aplicación.

**Qué se hizo** (servidor en el PR #31, migraciones `rf08_fotos_de_la_solucion` y
`rf08_una_politica_de_insercion`; cliente en el PR #37):

- **Columna nueva `evidencia.transicion_id`** (bigint, nula, clave foránea a
  `historial_transicion`). Es nula en las fotos del reporte; en las de la solución apunta a la
  transición «→ resuelta» de esa solución. La pone el disparador, no el cliente. Si la falla
  persiste y el área registra otra solución, cada una conserva sus fotos (la solución anterior ya
  quedaba en el historial, cambio 12).
- **Quién sube.** El reportante de la finca, como antes, mientras la novedad no sea final. El
  aprobador del área de la novedad, solo mientras está `resuelta`: al registrar la solución (18)
  y desde el detalle, hasta que la finca responda. Una sola política de inserción cubre a los dos,
  para no dejar dos políticas permisivas (aviso del asesor).
- **Máximo de 3 por grupo:** 3 del reporte y 3 por cada solución. El disparador cuenta solo las
  del mismo `transicion_id`; lo demás no cambia (bloqueo de la novedad, archivo en su carpeta y
  tamaño real).
- **La lectura no cambia:** quien puede ver la novedad ve todas sus fotos.
- **Pantalla 18:** campo «Fotos de la solución (opcional)», el mismo de 05. Las fotos suben
  después de `registrar_solucion`; si una no sube, la solución queda registrada y el aviso lo dice.
- **Detalle:** las fotos de la solución vigente van dentro de su bloque, para los cuatro roles, y
  el aprobador del área tiene ahí «Adjuntar foto» mientras la novedad está resuelta. Las del
  reporte siguen en «Evidencias». Las de soluciones anteriores no se muestran.

**Texto propuesto (SRS, RF-08, primer párrafo):**

> El sistema debe permitir que el reportante adjunte fotografías como evidencia al registrar una
> novedad de su finca o al consultarla mientras no esté cerrada ni rechazada, y que el aprobador
> de área adjunte fotografías de la solución al registrarla o mientras la novedad esté resuelta.

**Texto propuesto (SRS, RF-08, una regla de negocio nueva):**

> - Las fotografías de la solución quedan asociadas a la solución registrada: si la falla persiste
>   y se registra otra solución, cada una conserva las suyas.

**Texto propuesto (CU-08):**

> - Actores: Reportante (primario); aprobador de área, para las fotografías de la solución.
> - Referencias: RF-08. Extiende CU-05, CU-14 y CU-18.
> - Precondición: El reportante está registrando una novedad de su finca o consultando una que no
>   está cerrada ni rechazada, o el aprobador de área está registrando la solución de una novedad
>   de su área o consultando una de su área que está resuelta.

**Texto propuesto (CU-14):** en Referencias, «Extendido por CU-08 y CU-25», y el paso 5 del
aprobador de área:

> Selecciona un tipo existente o confirma uno nuevo, completa los demás datos, adjunta
> fotografías de la solución si lo desea (CU-08) y confirma.

**Texto propuesto (SDD 5.2.3, al final de la frase del registro de la solución):**

> Admite además fotografías opcionales de la solución, que el detalle muestra junto a ella (RF-08).

En la tabla de pantallas, la fila 18 suma RF-08; en la Tabla 36, la fila de RF-08 suma las
pantallas 18 y 22.

**Texto propuesto (6.1.1, Tabla 26, fila `evidencia`):** en las columnas, «transicion_id FK NULL»
después de «subida_por FK», y en las restricciones, después de «Ruta única en el bucket
evidencias (RF-08).»:

> transicion_id es nulo en las fotografías del reporte; en las de la solución, es la transición a
> resuelta de esa solución.

**Texto propuesto (6.1.4, Tabla 31, columna Inserción de las filas `evidencia` y «Objetos del
bucket evidencias»):**

> Reportante de la finca; aprobador del área mientras la novedad está resuelta (en `evidencia`,
> además, subida_por = usuario).

**Texto propuesto (6.1.7, una viñeta nueva después de la cuarta):**

> - El aprobador de área puede adjuntar fotografías de la solución al registrarla (pantalla 18) y
>   desde el detalle mientras la novedad esté resuelta. Se suben después de registrar la solución
>   y el servidor las asocia a la transición a resuelta de esa solución. El máximo de fotografías
>   se aplica por separado a las del reporte y a las de cada solución.

**Texto propuesto (6.1.11, Tabla 35, fila «Resuelta», columna del aprobador):**

> Adjuntar foto de la solución (en espera de la finca)

## 24 · Firmas y resultados de las funciones del Sprint 5 (S5)

**Sección:** SDD 5.3.2, Tabla 21 (funciones de IRPC).

**Qué pasa.** La Tabla 21 nombra las funciones del sprint y sus parámetros, pero no fija los tipos
de retorno ni el de `p_desde` y `p_hasta`. El contrato del Sprint 5 (`rf19_contratos_sprint_5`,
plan del Sprint 5, decisiones 2 y 20) los fija:

- `marcar_avisos_leidos(p_ids uuid[] default null)` devuelve `integer`: cuántos avisos marcó.
  Nulo marca todos los del usuario; los ajenos se ignoran sin error.
- Los cuatro indicadores devuelven un `jsonb` cada uno, con `datos_al` (la hora de la consulta)
  y la forma que trae el comentario de cada función. Son `security invoker` y `stable`.
- `p_desde` y `p_hasta` son `date`: días de Colombia, inclusivos.
- `renombrar_tipo_falla`, `desactivar_tipo_falla` y `fusionar_tipos_falla` devuelven la fila del
  tipo (la del destino, al fusionar); `corregir_tipo_falla` devuelve la novedad, como las demás
  transiciones.

**Texto propuesto (Tabla 21, columna «Parámetros»):**

> marcar_avisos_leidos: p_ids uuid[] (opcional; nulo = todos). rpt_tiempos_atencion,
> rpt_escalamiento y rpt_recurrencia: p_desde date, p_hasta date (días de Colombia, inclusivos).

**Texto propuesto (Tabla 21, nota, al final):**

> Los indicadores devuelven un objeto JSON cada uno, con la fecha de corte de la consulta y las
> agrupaciones de la Tabla 34; marcar_avisos_leidos devuelve la cantidad de avisos marcados, y las
> funciones del catálogo, el tipo de falla resultante.

## 25 · `v_novedad.resuelta_en` (S5)

**Sección:** SDD 6.1.1 («Vistas e índices»), Tabla 20 (fila `v_novedad`) y Tabla 34 (tiempos de
atención).

**Qué pasa.** «Tiempo hasta resolver» aparece en el historial (21), en el detalle (22), en el CSV
(«horas hasta la resolución», 5.3.8) y en el panel (24), y la Tabla 34 lo define como la última
transición hacia resuelta menos `fecha_registro`. `v_novedad` no lo traía: el detalle lo
calculaba con su línea de tiempo y las listas no tenían de dónde sacarlo. Se agregó al final de la
vista la columna `resuelta_en` (plan del Sprint 5, decisión 6):

- Es la fecha de la última transición hacia resuelta, si la novedad está resuelta o cerrada, y
  nula si no. La que volvió a «en atención» porque la falla persistió no tiene fecha hasta que se
  resuelva otra vez; la corrección del tipo de una cerrada no la cambia.
- La vista sigue con `security_invoker`. La subconsulta usa el índice
  `historial_transicion_novedad_idx`, y Postgres no la calcula en las consultas que no piden la
  columna.

**Texto propuesto (6.1.1, «Vistas e índices», al final de la frase de v_novedad):**

> …y el nombre del reportante, y la fecha de su última resolución, de la que se calcula el tiempo
> hasta resolver en el historial, el detalle, la exportación y el indicador de tiempos de atención.

**Texto propuesto (Tabla 20, fila v_novedad, columna «Uso»):**

> Bandeja, Mis novedades, historial y detalle: novedad con finca, razón social, área, tipo de falla,
> nombre del reportante y fecha de su última resolución.

## 26 · Marcar los avisos solo con `marcar_avisos_leidos` (S5)

**Sección:** SDD 5.3.2, Tabla 20 (fila `notificacion`), y 6.1.4, Tabla 31 (fila `notificacion`).

**Qué pasa.** Las Tablas 20 y 31 le dan al destinatario un `PATCH` de `leida` y `leida_en` sobre
`notificacion`, con su política. La Tabla 21 trae además `marcar_avisos_leidos`, y la regla 1 del
proyecto dice que el cliente nunca escribe en `notificacion`. Se dejó una sola forma (plan del
Sprint 5, decisión 29; migración `rf30_marcar_avisos_leidos`):

- `marcar_avisos_leidos(p_ids)` es `security definer`: exige un usuario activo, marca solo los
  avisos propios sin leer (nulo = todos), pone `leida_en` con la hora del servidor, ignora los
  ajenos sin decir si existen y devuelve cuántos marcó.
- Se revocó el `update (leida, leida_en)` de `authenticated` y se quitó la política
  `notificacion_marcar_leida`. La lectura no cambia.
- Suma un aviso del asesor del tipo conocido (`authenticated_security_definer_function_executable`).

**Texto propuesto (Tabla 20, fila notificacion, columna «Operaciones del cliente»):**

> GET propias (los marca como leídos marcar_avisos_leidos)

**Texto propuesto (Tabla 31, fila notificacion, columna «Actualización»):**

> Solo funciones (marcar_avisos_leidos, sobre los avisos del destinatario)

## 27 · Textos de los avisos (S5)

**Sección:** SDD 6.1.6, Tabla 33 y su nota.

**Qué pasa.** `notificacion` solo guarda el estado nuevo, y la Tabla 33 tiene textos distintos
para el mismo estado según quién lo recibe. Leídas las funciones de transición, el contexto sale
del rol del destinatario (plan del Sprint 5, decisión 30): el reportante solo recibe «asignada»
por una reasignación (`registrar_novedad` avisa solo a los aprobadores), los aprobadores solo
reciben «en atención» cuando la finca dice que la falla persiste, y los administradores solo
reciben «resuelta» por un tipo de falla nuevo. No hace falta guardar más en `notificacion`.

Los textos son los de la Tabla 33 **sin el código**, que la pantalla 10 pone arriba de cada aviso
y el push lleva en el título (decisiones 31 y 47). Figma 10 ya escribe así «El director de
agricultura aprobó la novedad; vuelve a Mantenimiento para ejecutarla.». Una sola función
(`supabase/functions/_shared/plantillas.js`) sirve a la pantalla 10 y a `enviar-push`.

**Figma 10 frente a la Tabla 33.** 10 le escribe al reportante «Tu novedad fue asignada a
Sistemas.» a la hora del registro: es el aviso del enrutamiento, que la Tabla 30 decidió no
enviar (su constancia es 06). Manda la Tabla 33: el único «asignada» del reportante es por una
reasignación, «Tu novedad fue reasignada a {área}.».

**Texto propuesto (Tabla 33, columna «Texto del aviso»):** los mismos, sin «NOV-####»:

> Nueva novedad de {finca} · {prioridad}. · Tu novedad fue reasignada a {área}. · {Área} tomó tu
> novedad para atención. · La finca {finca} indica que la falla persiste. · Escalada por {área}:
> requiere tu decisión. · Tu novedad fue escalada al director de agricultura. · El director de
> agricultura aprobó la novedad; vuelve a {área} para ejecutarla. · La novedad fue rechazada.
> Ábrela para ver el motivo. · {Área} registró la solución. Confirma si quedó resuelta. · Se creó
> el tipo de falla «{tipo}»; revísalo en el catálogo. · La finca {finca} confirmó el cierre.

**Texto propuesto (nota de la Tabla 33, al final):**

> El texto depende del estado nuevo y del rol del destinatario; el código de la novedad se
> muestra aparte. Los datos (finca, área, prioridad y tipo) son los vigentes de la novedad.

## 28 · Historial: filtros, opciones y buscador por código (S5)

**Sección:** SDD 5.2.5 («Interfaz E: Consulta e historial») y Tabla 20 (fila `v_novedad`).

**Qué pasa.** 5.2.5 dice qué filtra el historial (finca, área, estado, rango de fechas y tipo de
falla) y que el panel abre el historial filtrado (5.2.6), pero no cómo viajan los filtros, qué
opciones ofrece cada uno, qué pasa sin conexión ni qué hace el buscador de la barra superior que
dibuja Figma. Se resolvió así (plan del Sprint 5, decisiones 9 a 15):

- **Los filtros van en la dirección:** `/historial?finca=<id>&area=<id>&estado=resuelta,cerrada&desde=2026-04-01&hasta=2026-09-24&tipo=<id>&pagina=2`.
  `estado=abiertas` es el grupo de los seis estados que no son finales (Tabla 34); lo usa el
  panel. Lo que llega mal formado se ignora. `desde` y `hasta` son días de Colombia, inclusivos.
- **Opciones:** fincas y áreas activas e inactivas (las inactivas al final, con «(inactiva)»), y
  tipos de falla activos y desactivados. Un tipo fusionado no se ofrece: queda inactivo y sin
  novedades, que pasaron al destino.
- **El aprobador** no tiene el filtro de área: las políticas ya le dan solo la suya (21-D).
- **Orden y páginas:** de la más reciente a la más antigua por `fecha_registro` (y por `id` en un
  empate), de 20 en 20, con los números de página.
- **Sin conexión:** RF-19 requiere conexión y RF-24 no cubre el historial: nada se guarda en el
  dispositivo, los filtros quedan deshabilitados y se explica.
- **Buscador por código** (barra superior del escritorio, los cuatro roles): acepta «NOV-0153»,
  «nov 153», «NOV0153», «0153» y «153»; busca en `v_novedad`, de modo que la RLS pone el alcance,
  y abre el detalle. Si no la encuentra, el mismo mensaje exista o no, como 22-B.

**Texto propuesto (5.2.5, después del primer párrafo):**

> Los filtros del historial viajan en la dirección de la pantalla, de modo que el detalle vuelve
> al mismo resultado y el panel abre el historial ya filtrado; el grupo «abiertas» reúne los
> estados no finales. Las listas de fincas y áreas incluyen las inactivas, y la de tipos de falla,
> los desactivados que tienen novedades. El historial requiere conexión. La barra superior del
> escritorio ofrece, a todos los roles, un buscador por código que abre el detalle de la novedad
> si está dentro del alcance de quien busca.

**Texto propuesto (Tabla 20, fila `v_novedad`, «Uso»):**

> Bandeja, Mis novedades, historial (con sus filtros en la dirección), buscador por código y
> detalle: novedad con finca, razón social, área, tipo de falla, nombre del reportante y
> `resuelta_en`.

## 29 · Panel de reportes: períodos, cifras y quién agrupa (S5)

**Sección:** SDD 6.1.9 (Tabla 34), 5.2.6 («Interfaz F: Panel de reportes») y Tabla 22.

**Qué pasa.** La Tabla 34 define cada indicador, pero no fija en qué hora se cortan los períodos,
qué es «por mes», qué devuelve cada función ni quién recorta y ordena lo que muestra Figma (plan
del Sprint 5, decisiones 5 y 19 a 27). Las dos primeras llegaron en el PR 4 y las otras dos en
el PR 5.

- **Seguridad:** las `rpt_*` son `security invoker` (como dice 6.1.9) y verifican el rol al
  comenzar: quien no es director ni administrador activo recibe `SIN_PERMISO`, en lugar de un
  panel recortado por su RLS. No suman avisos del asesor.
- **Período:** `p_desde` y `p_hasta` son días de Colombia, inclusivos: desde las 12:00 a. m. de
  `p_desde` hasta antes de las 12:00 a. m. del día siguiente a `p_hasta`. Uno invertido o nulo
  responde `FECHA_INVALIDA` (Tabla 22). Las opciones son las de Figma: «Mes actual» y «Últimos 3,
  6 y 12 meses» (meses de calendario hasta hoy) y, además, «Personalizado».
- **«Datos al»:** la hora de la consulta, que devuelve cada función.
- **Abiertas (RF-26):** los seis estados no finales, por área, por finca y por estado. Salen todas
  las fincas activas, en cero si no tienen abiertas, y las inactivas que aún tengan alguna.
- **Tiempos (RF-27):** desde `fecha_registro` hasta la última resolución (`v_novedad.resuelta_en`,
  cambio 25), de las resueltas o cerradas cuya última resolución cae en el período. «Por mes» es el
  mes de Colombia de la resolución. «Abiertas con más tiempo» son las cinco abiertas más antiguas
  hoy, sin depender del período.
- **Escalamiento (RF-28):** de las novedades registradas en el período, las que tuvieron al menos
  una transición a «escalada» (una escalada dos veces cuenta una), por el área actual. La
  justificación y la decisión del director son las de la **última** escalada: la siguiente
  transición desde «escalada», o ninguna si todavía espera. Se listan todas las del período.
- **Fallas recurrentes (RF-29):** las resueltas y cerradas registradas en el período, por finca y
  tipo de falla vigente (tras una fusión, el destino), solo las combinaciones que no son cero.
  Aparte, cuántas del período quedaron por fuera por no estar resueltas ni cerradas.
- **Quién agrupa:** las funciones devuelven agregados simples; la pantalla ordena, recorta y
  dibuja.

**Texto propuesto (Tabla 34, nota):**

> Los períodos se cortan en días de Colombia, inclusivos; «por mes» es el mes de Colombia de la
> fecha que mide el indicador. Cada indicador informa la hora de la consulta («Datos al»). Las
> funciones verifican que quien consulta sea el director de agricultura o el administrador.

**Texto propuesto (Tabla 22, fila `FECHA_INVALIDA`, «Condición»):**

> Fecha de ejecución posterior a la actual, o un período de reporte con la fecha inicial
> posterior a la final o sin alguna de las dos

## 30 · Catálogo de tipos de falla: el nombre repetido, la fusión y los bloqueos (S5)

**Sección:** SDD 6.1.8 («Catálogo de tipos de falla») y Tabla 22.

**Qué pasa.** 6.1.8 dice qué hacen renombrar, fusionar y desactivar, pero no qué responde cada
una cuando el nombre ya existe, qué pasa con las novedades cerradas ni cómo se cuidan de dos
cambios a la vez (plan del Sprint 5, decisiones 48 a 52). Llegaron en el PR 6.

- **Quién:** las cuatro funciones son `security definer` y verifican que quien llama sea un
  administrador activo (`SIN_PERMISO` si no). No avisan a nadie.
- **Renombrar:** guarda el nombre como lo escribió el administrador, con los espacios arreglados,
  y lo normaliza como al resolver. El mismo tipo con otras mayúsculas o tildes sí se puede
  («biometrico» → «Biométrico»). **Si el nombre normalizado ya es de otro tipo, activo o no:
  `TIPO_FALLA_DUPLICADO`, un código nuevo.** Con `TIPO_FALLA_INVALIDO` la pantalla no sabría
  cuándo proponer la fusión (31-B). Un tipo inactivo no se renombra (`TIPO_FALLA_INVALIDO`).
  Queda auditado con el nombre anterior; repetir el mismo nombre no cambia nada.
- **Fusionar:** bloquea los dos tipos en orden de id, para que dos fusiones cruzadas esperen en vez
  de trabarse. Origen igual al destino, o alguno inactivo: `TIPO_FALLA_INVALIDO`. Pasan al
  destino **todas** las novedades del origen, también las cerradas (el indicador de recurrencia
  agrupa por el tipo vigente). El origen queda inactivo y auditado con el destino y su nombre.
  Devuelve el destino. Una cadena A → B y después B → C deja todo en C.
- **Al resolver:** `private.resolver_tipo_falla` lee el tipo `for share`: una solución que llega
  durante una fusión espera y queda con el destino, no con un origen ya inactivo.
- **Desactivar:** queda auditado con el nombre del tipo; uno inactivo no se vuelve a desactivar.
  **No hay reactivación:** `accion_auditoria` no la tiene y 31 dibuja el tipo inactivo con sus
  acciones deshabilitadas (decisión 51).
- **La lista de 31:** los activos y los desactivados; los fusionados no («retira el origen de la
  lista», RF-32), que se reconocen por su auditoría.

**Texto propuesto (6.1.8, al final):**

> Renombrar, fusionar y desactivar son del administrador y quedan en `auditoria_tipo_falla`. Un
> nombre normalizado que ya es de otro tipo, activo o inactivo, no se acepta. La fusión pasa al
> destino todas las novedades del origen, también las cerradas, y desactiva el origen; bloquea
> los dos tipos en orden de identificador. Un tipo inactivo no se renombra, no se fusiona ni se
> reactiva.

**Texto propuesto (Tabla 22, fila nueva):**

> | `TIPO_FALLA_DUPLICADO` | El nombre nuevo de un tipo de falla ya es de otro tipo | Pantalla 31-B si el otro está activo; si no, «Ya existe «{tipo}», pero está inactivo. Elige otro nombre.» |

## 31 · La corrección del tipo de falla en el historial (S5)

**Sección:** SDD 6.1.3 (Tabla 30) y 5.2.5 («Línea de tiempo»).

**Qué pasa.** La Tabla 30 dice que corregir el tipo de una novedad cerrada no cambia su estado y
queda en el historial, pero no qué se escribe ni cómo se ve (plan del Sprint 5, decisión 53).

- `corregir_tipo_falla` acepta solo una novedad `cerrada` (si no, `TRANSICION_INVALIDA`) y un
  tipo activo y distinto del actual (si no, `TIPO_FALLA_INVALIDO`).
- Deja una transición **`cerrada → cerrada`** a nombre del administrador, con la observación
  `"Puentes" → "Puentes y pasos"` (el tipo anterior y el nuevo). No avisa a nadie.
- La línea de tiempo no la pinta como un cambio de estado: dice **«Tipo de falla corregido»**, con
  quién, cuándo y la observación.

**Texto propuesto (Tabla 30, fila nueva):**

> | Corregir el tipo de falla | Administrador | `cerrada → cerrada`, con el tipo anterior y el nuevo en la observación | Nadie |

**Texto propuesto (5.2.5, «Línea de tiempo»):**

> Una transición de «cerrada» a «cerrada» es la corrección del tipo de falla: se muestra como
> «Tipo de falla corregido», no como un cambio de estado.

## 32 · El archivo CSV del historial (S5)

**Sección:** SDD 5.3.8 («Archivo CSV de exportación») y 7.3 (Tabla 39, fila «Separador del archivo
CSV»).

**Qué pasa.** 5.3.8 adopta la coma y deja el punto y coma como punto por validar. El PR 7 del
Sprint 5 usa **punto y coma** (plan del Sprint 5, decisiones 16 a 18), y queda por validar con el
director de agricultura y los administradores:

- **Separador:** Excel con la configuración regional de Colombia usa la coma como separador
  decimal: abre directo un archivo con `;`, con las columnas separadas; con `,` lo pega en una
  sola columna. La línea `sep=,` lo arreglaría, pero hace que Excel ignore el BOM y se rompen las
  tildes. Google Sheets y LibreOffice detectan el `;`.
- **Contenido:** las columnas de 5.3.8, en su orden: «Código;Registrada en finca;Finca;Razón
  social;Área;Prioridad;Estado;Tipo de falla;Fecha de ejecución;Reportada por;Horas hasta la
  resolución». Fechas en la hora de Colombia, como las reconoce una hoja de cálculo
  («2026-09-24 08:15» y «2026-09-23»); las horas con un decimal y coma («52,3»), desde el registro
  hasta la última resolución (`v_novedad.resuelta_en`, cambio 25), y vacías si no se ha resuelto.
  UTF-8 con BOM, filas terminadas en CRLF y comillas cuando el campo trae `;`, comillas o saltos
  de línea.
- **Todo el resultado filtrado**, no solo la página: en bloques de 1000 (lo más que entrega la API
  por solicitud) hasta que llega uno incompleto. Si un bloque falla, no se descarga nada.
- **Fórmulas:** un texto que escribió una persona (finca, razón social, área, tipo de falla,
  reportante) y empieza por `=`, `+`, `-`, `@`, tabulador o retorno de carro sale con un
  apóstrofo adelante (OWASP, «CSV Injection»). Las columnas que arma la aplicación no se tocan.
- **Nombre:** `historial-novedades-2026-10-17.csv`, con el día de Colombia.

**Texto propuesto (5.3.8, en lugar de la última frase):**

> El separador es el punto y coma, que las hojas de cálculo con la configuración regional de
> Colombia abren sin pasos adicionales. Las fechas van en la hora de Colombia y las horas hasta la
> resolución con un decimal. Un texto que empieza como una fórmula se antepone con un apóstrofo,
> para que la hoja de cálculo no lo ejecute.

**Texto propuesto (Tabla 39, fila «Separador del archivo CSV», «Decisión adoptada»):**

> Punto y coma, con BOM; por validar con el director de agricultura y los administradores

## 33 · El webhook y `enviar-push` (S5)

**Sección:** SDD 6.1.6 (Figura 17), 5.3.4 (Tabla 23), 5.3.5 y 4.2.10.

**Qué pasa.** El SDD dice que un webhook de la base de datos llama a `enviar-push` por cada aviso
y que la función envía el push. El PR 8 del Sprint 5 fija cómo (plan del Sprint 5, decisiones 38 a
43, comprobadas en la prueba corta del 17 de octubre):

- **Webhook propio:** un disparador `after insert` en `notificacion`
  (`private.tg_notificacion_push`, `security definer`) encola con `pg_net` un POST a
  `enviar-push` con el aviso como `record`. No es el «Database Webhook» del panel, que guarda el
  encabezado en la definición del disparador, es decir, en la migración de un repositorio público.
- **Vault:** la URL de la función y el secreto viven en Vault (`enviar_push_url` y
  `enviar_push_secreto`). Sin ellos (el Supabase local, el CI) el disparador no hace nada y el
  aviso se crea igual.
- **En la misma transacción:** `pg_net` encola dentro de la transacción de la transición: si
  falla, la solicitud se revierte con ella. La entrega ocurre después del commit y no frena la
  transición.
- **Quién llama:** el webhook, no una persona. `enviar-push` tiene `verify_jwt = false` y
  comprueba el encabezado `x-webhook-secreto` en tiempo constante (401 si no coincide).
- **Qué hace:** lee la novedad y el rol del destinatario con la clave de servicio, arma el mensaje
  con los textos de la Tabla 33 (sin la descripción) y lo envía a cada suscripción con `TTL` de un
  día. 404 o 410: borra esa suscripción; otro error: al log, y sigue. Siempre responde 200.
- **Cifrado y firma:** propios, con Web Crypto: `aes128gcm` (RFC 8291) y VAPID (RFC 8292), sin
  dependencias, probados con el ejemplo del apéndice A del RFC 8291.

**Texto propuesto (6.1.6, en lugar de la descripción del webhook):**

> Un disparador posterior a la inserción en `notificacion` encola, con `pg_net` y en la misma
> transacción, una solicitud a la Edge Function `enviar-push` con el aviso y un encabezado
> secreto; la dirección y el secreto se guardan en Vault. La función verifica el encabezado, arma
> el mensaje con el texto del aviso y lo envía cifrado a cada suscripción del destinatario; borra
> las suscripciones que el servicio push ya no reconoce. Una falla en el envío no afecta el aviso
> dentro de la aplicación.

**Texto propuesto (Tabla 23, fila `enviar-push`, «Autenticación»):**

> Encabezado secreto del webhook (`verify_jwt = false`)

## 34 · Las notificaciones push en el dispositivo (S5)

**Sección:** SDD 5.3.5 («Notificaciones push») y 6.1.6.

**Qué pasa.** El SDD dice que la persona activa las notificaciones y que el service worker las
muestra. El PR 9 del Sprint 5 fija dónde se ofrecen, cómo se apagan y qué muestran (plan del
Sprint 5, decisiones 44 a 47):

- **Dónde se ofrecen:** 10-B sale la primera vez que se abren los avisos en el dispositivo, solo
  si el navegador lo admite (en iPhone, con la aplicación instalada) y si el permiso no está
  decidido. El permiso se pide después del toque en «Activar notificaciones». «Ahora no» no
  vuelve a preguntar.
- **Cuenta:** la fila «Notificaciones en este dispositivo» las activa y las desactiva, y explica
  si el navegador no las admite o si se bloquearon.
- **Dispositivo compartido:** cerrar sesión cancela la suscripción del navegador y borra su fila
  antes de salir. Sin red, la fila queda y `enviar-push` la borra con el 410 del servicio push.
  Si el punto de entrega es de otra persona del dispositivo, se cancela y se crea otro.
- **Qué muestran:** el código y el estado en el título y el texto del aviso en el cuerpo, **sin la
  descripción**, que se vería en la pantalla bloqueada (RNF-18). Las de una misma novedad se
  reemplazan y vuelven a sonar. Tocarla abre la novedad y deja leído su aviso.

**Texto propuesto (5.3.5, al final):**

> La aplicación ofrece activar las notificaciones la primera vez que se abren los avisos en el
> dispositivo, y permite activarlas o desactivarlas desde Cuenta. Al cerrar la sesión, la
> suscripción del dispositivo se cancela. La notificación muestra el código, el estado y el texto
> del aviso, sin la descripción de la novedad.

## 35 · El administrador entra al panel de reportes (S5)

**Sección:** SDD 5.2, Tabla 10. Cierra el temporal del cambio 14.

**Qué pasa.** Mientras no existía el panel, el administrador entraba a «Usuarios». Desde el PR 4
del Sprint 5 entra a `/panel`, como dice la Tabla 10 (plan del Sprint 5, decisión 28). No hay
texto que proponer: la Tabla 10 ya dice «23 Panel de reportes».

## 36 · Las rechazadas que el reportante no ha visto (S5)

**Sección:** SDD 5.2.5, pantalla 04 · Mis novedades.

**Qué pasa.** Lo pidió el equipo en la revisión del Sprint 5. La pastilla «Rechazadas» lleva una
insignia, como la de los avisos, con cuántas novedades rechazadas no ha visto el reportante. No
hace falta guardar nada nuevo: cada rechazo ya le crea un aviso (Tabla 33), así que «sin ver» es
«con su aviso de rechazo sin leer». Abrir esa lista marca esos avisos como leídos con
`marcar_avisos_leidos`; leerlos en «Avisos» también la apaga. Vale en todos los dispositivos.

**Texto propuesto (5.2.5, pantalla 04, al final):**

> La pestaña «Rechazadas» muestra cuántas novedades rechazadas tienen su aviso sin leer; al
> abrirla, esos avisos quedan leídos.

## 37 · «Cuenta» en la barra inferior de todos los roles (S5)

**Sección:** SDD 5.2 («Navegación por rol») y Tabla 10. Reemplaza el cambio 16.

**Qué pasa.** El equipo vio que en el teléfono el administrador no encontraba Fincas, Tipos de
falla y Recuperación de contraseñas: solo se llegaba a ellas tocando el avatar de la barra
superior. Ahora la última opción de la barra inferior es «Cuenta» para todos los roles; para el
administrador se llama «Más» (ícono `menu`), porque además de la cuenta trae esas tres
pantallas, y lleva la insignia de las solicitudes de recuperación. Para que quepa, «Avisos» sale
de la barra inferior del aprobador, el director y el administrador: la campana de la barra
superior, con su insignia, ya los abría. El avatar de la barra superior desaparece. En el
escritorio no cambia nada.

**Texto propuesto (Tabla 10, columna «Teléfono»):** aprobador: Bandeja, Historial, Panel y Cuenta;
director: Escaladas, Historial, Panel y Cuenta; administrador: Panel, Historial, Usuarios y Más.
Los avisos, en la campana de la barra superior.

## 38 · El panel de reportes para el aprobador, solo de su área (S5)

**Sección:** SRS RF-26 a RF-29 (actores); SDD 6.1.9, Tabla 10 y Tabla 21 (columna «Rol»).

**Qué pasa.** Lo pidió el equipo: el aprobador de Mantenimiento o de Sistemas ve los cuatro
indicadores de su área. Las cuatro `rpt_*` admiten el rol 2; siguen siendo `security invoker`,
así que la RLS de `novedad` ya lo limita a su área, y además cada consulta filtra por
`private.fn_area()` y la lista de áreas trae solo la suya. Un aprobador sin área recibe
`SIN_PERMISO`. Como en todo el sistema, una novedad cuenta para el área que la tiene hoy: si se
reasignó, el área anterior deja de verla. Migración `rf26_panel_del_aprobador`.

**Texto propuesto (6.1.9, al final):**

> El aprobador de área consulta los mismos indicadores, limitados a las novedades de su área.

## 39 · Reactivar un tipo de falla desactivado (S5)

**Sección:** SDD 6.1.8, Tabla 21 y el tipo `accion_auditoria`. Corrige en parte el cambio 30.

**Qué pasa.** El cambio 30 decía «sin reactivar» (decisión 51 del plan del Sprint 5). El equipo
pidió poder deshacer una desactivación. `reactivar_tipo_falla(p_tipo_id)` (administrador,
`security definer`) vuelve a activar un tipo desactivado y lo audita con la acción nueva
`reactivar`. Un tipo fusionado no se reactiva (`TIPO_FALLA_INVALIDO`): sus novedades ya son del
destino y `resolver_tipo_falla` sigue la cadena de fusiones. En la pantalla 31, un tipo
inactivo muestra «Reactivar» en lugar de las tres acciones deshabilitadas; no pide confirmación.
Migración `rf32_reactivar_tipo_falla`.

**Texto propuesto (Tabla 21, fila nueva):**

> `reactivar_tipo_falla` · `p_tipo_id` · Administrador

## 40 · Razones sociales desde la aplicación (S5)

**Sección:** SRS RF-04; SDD 6.1.4 (Tabla 31, fila `razon_social`) y Tabla 22.

**Qué pasa.** Las razones sociales eran un catálogo precargado que solo cambiaba con SQL. Ahora,
debajo de las fincas (pantalla 30, sin dibujo en Figma), el administrador las crea, las renombra,
las desactiva y las reactiva, directamente en la tabla, como las fincas: `grant insert (nombre),
update (nombre, activo)` y dos políticas para el rol 4. No se borran. Una desactivada no se
ofrece para fincas nuevas; las que ya la tienen la conservan, y al editarlas sigue en el campo. El
nombre repetido es `RAZON_SOCIAL_EXISTENTE` (lo arma el repositorio desde el 23505, como
`FINCA_EXISTENTE`). Migración `rf04_razones_sociales`.

**Texto propuesto (Tabla 31, fila `razon_social`):**

> Lectura: usuarios activos. Inserción y actualización (nombre, activo): administrador.

## 41 · Visor de fotos (S5)

**Sección:** SDD 6.1.7 y 5.2.5 (bloque «Evidencias»).

**Qué pasa.** Tocar una foto abría su URL firmada en otra pestaña, con el token a la vista en la
barra de direcciones. Ese token no es la clave de la API: es una firma que vale 5 minutos y solo
para ese archivo. Aun así, la foto ahora se abre en un visor dentro de la aplicación, a toda la
pantalla, con «anterior», «siguiente» (también con las flechas del teclado) y zoom (botón, toque
en la foto o pellizco en el teléfono). La foto se sigue cargando con su URL firmada.

## 42 · El logo de Grupo Central (S5)

**Sección:** SDD 5.2 («Sistema de diseño»). Resuelve el punto 5 de `decisiones-pendientes.md`
(ícono de la aplicación).

**Qué pasa.** El equipo entregó el logo. Va en el ingreso (en lugar del ícono de hoja de Figma),
en la barra lateral del escritorio, en el favicon y en los íconos de la aplicación instalada (192,
512, 512 _maskable_ sobre blanco y 180 para iOS), que también usan las notificaciones push.

## 43 · Notificaciones en Brave (S5)

**Sección:** SDD 5.3.5.

**Qué pasa.** Brave de escritorio apaga por omisión el servicio push de Google, y
`pushManager.subscribe` falla con `AbortError` aunque el permiso esté concedido. No se arregla
desde la aplicación: la persona debe activar «Usar los servicios de Google para la mensajería
push» en `brave://settings/privacy` y reiniciar el navegador. La fila de Cuenta y 10-B ahora lo
dicen así en lugar del error genérico. En Brave para Android ese ajuste no existe, y queda el
mensaje genérico.
