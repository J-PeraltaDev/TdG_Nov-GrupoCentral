# Cambios frente al SDD y al SRS

El SDD y el SRS son documentos vivos. Cada vez que la implementación se aparta de ellos, se anota
aquí, en el mismo PR, con la sección afectada y el texto propuesto, para que Mateo y Juan
actualicen los documentos (lo exige la Definition of Done).

| N.º | Sprint | Documento y sección                         | Qué cambia                                                                                                             | Estado    |
| --- | ------ | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------- |
| 1   | S0     | SDD 4.2.4 (C-04) y plan de arranque («PWA») | Precisión, no cambio: el service worker precachea con código propio, sin las librerías de Workbox                      | Propuesto |
| 2   | S0     | SDD 5.2 («Sistema de diseño»)               | Precisión: los íconos de Figma son la fuente Material Symbols Rounded; en el código son SVG locales del mismo conjunto | Propuesto |
| 3   | S1     | SDD 6.1.4, Tabla 31 (fila `usuario`)        | **Cambio:** la lectura de `usuario` es para todo usuario activo, limitada por columnas; el correo no se expone         | Propuesto |
| 4   | S1     | SDD 6.1.1, Tabla 27                         | Complemento: índices en las claves foráneas que la Tabla 27 no cubre                                                   | Propuesto |
| 5   | S1     | SDD 3.3.3 («Sesión sin conexión»)           | Precisión: sin red la aplicación abre con el perfil guardado, sin esperar al cliente de Supabase                       | Propuesto |
| 6   | S2     | SDD 5.3.2, Tabla 21                         | Precisión: parámetros opcionales de `registrar_solucion` y columnas de salida de `sugerir_tipos_falla`                 | Propuesto |
| 7   | S2     | SDD 6.1.3 (algoritmo general)               | Precisión: el rol que no corresponde a la acción recibe `SIN_PERMISO`, como en la Tabla 22, y no `TRANSICION_INVALIDA` | Propuesto |
| 8   | S2     | SDD 6.1.3 (Tabla 30) y 7.3 (parámetros)     | Complemento: el motivo, la justificación y la solución admiten máximo 500 caracteres                                   | Propuesto |

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
