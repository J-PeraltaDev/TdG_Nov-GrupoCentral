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
