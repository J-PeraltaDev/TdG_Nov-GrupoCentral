# Product backlog · 32 historias (HU-xx = RF-xx = CU-xx)

Generado a partir del SRS (ficha de cada RF), la especificación de casos de uso (cursos normal y
alternos), la Tabla 36 del SDD (pantallas) y el archivo de Figma (nodos). Es el contenido que irá
al tablero de GitHub Projects cuando el equipo lo autorice: una historia por issue, con sus etiquetas
de épica, prioridad y urgencia y su milestone de sprint. `backlog.json` trae lo mismo en forma de datos.

Los criterios de aceptación de cada historia son el curso normal y los cursos alternos de su CU.
La estimación en puntos (Fibonacci) se llena en el refinamiento; sin ella la historia no cumple la DoR.

## Resumen por sprint

| Sprint | Fechas    | Historias                                                     |
| ------ | --------- | ------------------------------------------------------------- |
| S0     | 6–9 oct   | RNF-14 y RNF-17 (entorno; ver `docs/sprints/S0.md`)           |
| S1     | 13–16 oct | HU-01, HU-05, HU-06, HU-07, HU-16                             |
| S2     | 19–23 oct | HU-09, HU-10, HU-11, HU-12, HU-14, HU-17, HU-18               |
| S3     | 26–30 oct | HU-02, HU-03, HU-04, HU-13, HU-15                             |
| S4     | 3–6 nov   | HU-21, HU-22, HU-23, HU-24, HU-25, HU-08                      |
| S5     | 9–13 nov  | HU-19, HU-20, HU-26, HU-27, HU-28, HU-29, HU-30, HU-32, HU-31 |

Festivos: 12 oct, 2 nov y 16 nov. Línea de corte si falta tiempo, en este orden: RF-31, RF-20, RF-08 y RF-32.

| Historia                                                           | Épica | Prioridad | Urgencia       | Sprint |
| ------------------------------------------------------------------ | ----- | --------- | -------------- | ------ |
| HU-01 · RF-01 · Iniciar y cerrar sesión                            | E1    | Alta      | Inmediatamente | S1     |
| HU-02 · RF-02 · Recuperar contraseña                               | E1    | Alta      | Inmediatamente | S3     |
| HU-03 · RF-03 · Gestionar usuarios                                 | E1    | Alta      | Inmediatamente | S3     |
| HU-04 · RF-04 · Gestionar fincas                                   | E1    | Alta      | Inmediatamente | S3     |
| HU-05 · RF-05 · Registrar novedad                                  | E2    | Alta      | Inmediatamente | S1     |
| HU-06 · RF-06 · Asignar código y confirmar recepción               | E2    | Alta      | Inmediatamente | S1     |
| HU-07 · RF-07 · Enrutar novedad al área responsable                | E2    | Alta      | Inmediatamente | S1     |
| HU-08 · RF-08 · Adjuntar evidencia fotográfica                     | E2    | Baja      | Puede esperar  | S4     |
| HU-09 · RF-09 · Consultar bandeja del área                         | E3    | Alta      | Hay presión    | S2     |
| HU-10 · RF-10 · Tomar novedad para atención                        | E3    | Alta      | Hay presión    | S2     |
| HU-11 · RF-11 · Rechazar novedad                                   | E3    | Alta      | Hay presión    | S2     |
| HU-12 · RF-12 · Escalar novedad a segunda instancia                | E3    | Alta      | Hay presión    | S2     |
| HU-13 · RF-13 · Aprobar o rechazar novedad escalada                | E3    | Alta      | Hay presión    | S3     |
| HU-14 · RF-14 · Registrar solución aplicada                        | E3    | Alta      | Hay presión    | S2     |
| HU-15 · RF-15 · Confirmar resolución y cerrar novedad              | E3    | Alta      | Hay presión    | S3     |
| HU-16 · RF-16 · Registrar transición en el historial               | E3    | Alta      | Inmediatamente | S1     |
| HU-17 · RF-17 · Reasignar novedad a otra área                      | E3    | Media     | Puede esperar  | S2     |
| HU-18 · RF-18 · Consultar detalle y línea de tiempo de una novedad | E4    | Alta      | Hay presión    | S2     |
| HU-19 · RF-19 · Consultar historial con filtros                    | E4    | Alta      | Hay presión    | S5     |
| HU-20 · RF-20 · Exportar resultado de la consulta                  | E4    | Baja      | Puede esperar  | S5     |
| HU-21 · RF-21 · Registrar novedad sin conexión                     | E5    | Alta      | Hay presión    | S4     |
| HU-22 · RF-22 · Sincronizar novedades pendientes                   | E5    | Alta      | Hay presión    | S4     |
| HU-23 · RF-23 · Mostrar estado de conexión y pendientes            | E5    | Media     | Puede esperar  | S4     |
| HU-24 · RF-24 · Consultar novedades sin conexión                   | E5    | Alta      | Hay presión    | S4     |
| HU-25 · RF-25 · Restringir acciones sin conexión                   | E5    | Alta      | Hay presión    | S4     |
| HU-26 · RF-26 · Consultar novedades abiertas por finca y por área  | E6    | Alta      | Hay presión    | S5     |
| HU-27 · RF-27 · Medir tiempos de atención                          | E6    | Alta      | Hay presión    | S5     |
| HU-28 · RF-28 · Calcular proporción de novedades escaladas         | E6    | Alta      | Hay presión    | S5     |
| HU-29 · RF-29 · Identificar fallas recurrentes                     | E6    | Alta      | Hay presión    | S5     |
| HU-30 · RF-30 · Notificar cambios dentro de la aplicación          | E7    | Media     | Puede esperar  | S5     |
| HU-31 · RF-31 · Enviar notificaciones push                         | E7    | Baja      | Puede esperar  | S5     |
| HU-32 · RF-32 · Gestionar tipos de falla                           | E1    | Media     | Puede esperar  | S5     |

## S1 · 13–16 oct

### HU-01 · RF-01 · Iniciar y cerrar sesión

- **Épica:** E1 Acceso y administración · **Prioridad:** Alta · **Urgencia:** Inmediatamente
- **RF-01:** El sistema debe permitir que los usuarios registrados y activos ingresen con su correo y su contraseña, y que cierren su sesión.
- **CU-01** · Actores: Usuario (primario).
- **Precondición:** El usuario está registrado y activo en el sistema.
- **Postcondición:** El usuario queda autenticado con los permisos de su rol, o sin sesión si la cerró.
- **Puntos:** por estimar

Criterios de aceptación · curso normal

1. **Usuario:** Solicita ingresar al sistema.
2. **Sistema:** Solicita el correo y la contraseña.
3. **Usuario:** Ingresa el correo y la contraseña.
4. **Sistema:** Valida las credenciales, identifica el rol del usuario y muestra el menú correspondiente.
5. **Usuario:** Solicita cerrar la sesión.
6. **Sistema:** Cierra la sesión y muestra la pantalla de ingreso.

Criterios de aceptación · cursos alternos

- **2a** Si no hay conexión y el usuario nunca ha ingresado en ese dispositivo, el sistema informa que el primer ingreso requiere conexión. El caso de uso termina.
- **2b** Si no hay conexión y el usuario ya ingresó antes con conexión en ese dispositivo, el sistema conserva la sesión almacenada y permite el registro y la consulta sin conexión (RNF-10). El caso de uso termina.
- **4a** Si las credenciales son incorrectas, el sistema muestra un mensaje de error. Continúa en el paso 2.
- **4b** Si el usuario está desactivado, el sistema niega el acceso. El caso de uso termina.
- **5a** Si hay novedades pendientes de sincronizar, el sistema advierte que se conservarán en el dispositivo y que se enviarán cuando el mismo usuario vuelva a ingresar. Continúa en el paso 6.

Pantallas de Figma (SDD, Tabla 36: 01)

- [01 · Iniciar sesión](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=1-351)
- [01-B · Credenciales incorrectas](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=1-392)
- [01-C · Usuario desactivado](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=1-435)
- [01-D · Sin conexión en el primer ingreso](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=1-478)
- [01-E · Contraseña actualizada](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=1-525)

### HU-05 · RF-05 · Registrar novedad

- **Épica:** E2 Registro y enrutamiento · **Prioridad:** Alta · **Urgencia:** Inmediatamente
- **RF-05:** El sistema debe permitir que el reportante registre una novedad de su finca.
- **CU-05** · Actores: Reportante (primario).
- **Precondición:** El reportante inició sesión al menos una vez con conexión en el dispositivo y tiene una finca asignada.
- **Postcondición:** La novedad queda registrada con código único y asignada a su área, o guardada en el dispositivo pendiente de sincronizar.
- **Puntos:** por estimar

Criterios de aceptación · curso normal

1. **Reportante:** Solicita registrar una novedad.
2. **Sistema:** Muestra el formulario con la finca del reportante precargada.
3. **Reportante:** Escribe la descripción, elige la prioridad (crítico, alto, normal o bajo) y el área que debe atenderla (mantenimiento o sistemas), y confirma.
4. **Sistema:** Valida los datos y agrega la fecha, la hora y el usuario que registra.
5. **Sistema:** Guarda la novedad en estado “registrada”.
6. **Sistema:** Asigna el código y confirma la recepción al reportante (incluye CU-06).
7. **Sistema:** Enruta la novedad al área responsable (incluye CU-07).

Criterios de aceptación · cursos alternos

- **3a** Si el reportante desea adjuntar una fotografía, se realiza CU-08. Continúa en el paso 3.
- **4a** Si falta la descripción, la prioridad o el área, el sistema señala los campos. Continúa en el paso 3.
- **5a** Si no hay conexión, o si esta se pierde durante el guardado, se realiza CU-21. El caso de uso termina.

Pantallas de Figma (SDD, Tabla 36: 05)

- [05 · Registrar novedad](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=2-423)
- [05-B · Sin conexión: guardar en el dispositivo](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=2-538)
- [05-C · Campos obligatorios faltantes](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=2-657)
- [05-D · Foto no válida](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=2-777)

### HU-06 · RF-06 · Asignar código y confirmar recepción

- **Épica:** E2 Registro y enrutamiento · **Prioridad:** Alta · **Urgencia:** Inmediatamente
- **RF-06:** El sistema debe asignar un código consecutivo único a cada novedad guardada en el servidor y confirmar su recepción al reportante. Se ejecuta dentro de RF-05 y RF-22.
- **CU-06** · Actores: Reportante (receptor de la confirmación).
- **Precondición:** La novedad quedó guardada en el servidor.
- **Postcondición:** La novedad tiene código definitivo y el reportante tiene constancia de su recepción.
- **Puntos:** por estimar

Criterios de aceptación · curso normal

1. **Sistema:** Genera un código consecutivo único y definitivo para la novedad.
2. **Sistema:** Muestra al reportante la confirmación de recepción con el código, la fecha y el estado.

Criterios de aceptación · cursos alternos

- **2a** Si la novedad llegó por sincronización (CU-22), el sistema muestra la confirmación en la lista de novedades del reportante. El caso de uso termina.

Pantallas de Figma (SDD, Tabla 36: 06)

- [06 · Novedad recibida](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=2-887)

### HU-07 · RF-07 · Enrutar novedad al área responsable

- **Épica:** E2 Registro y enrutamiento · **Prioridad:** Alta · **Urgencia:** Inmediatamente
- **RF-07:** El sistema debe enrutar de forma automática cada novedad registrada al área seleccionada por el reportante, sin intermediarios. Se ejecuta dentro de RF-05 y RF-22.
- **CU-07** · Actores: Aprobador de área (receptor de la novedad).
- **Precondición:** La novedad está en estado “registrada” en el servidor.
- **Postcondición:** La novedad aparece en estado “asignada” en la bandeja del área (CU-09).
- **Puntos:** por estimar

Criterios de aceptación · curso normal

1. **Sistema:** Consulta el área responsable seleccionada por el reportante.
2. **Sistema:** Asigna la novedad a esa área y cambia su estado a “asignada”.
3. **Sistema:** Registra en el historial la creación de la novedad y su enrutamiento (incluye CU-16).
4. **Sistema:** Notifica al área (incluye CU-30).

Criterios de aceptación · cursos alternos

- No se identificaron cursos alternos.

Pantallas de Figma (SDD, Tabla 36: 06, 11)

- [06 · Novedad recibida](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=2-887)
- [11 · Bandeja del área (móvil)](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=3-295)
- [11-B · Bandeja sin conexión](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=3-407)
- [11-C · Bandeja vacía](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=3-524)

### HU-16 · RF-16 · Registrar transición en el historial

- **Épica:** E3 Atención, aprobación y cierre · **Prioridad:** Alta · **Urgencia:** Inmediatamente
- **RF-16:** El sistema debe registrar en el historial de la novedad cada cambio de estado o de área. Se ejecuta dentro de RF-07, que registra la creación y el enrutamiento de la novedad, RF-10 a RF-15 y RF-17.
- **CU-16** · Actores: Ninguno (lo ejecuta el sistema).
- **Precondición:** Una novedad cambió de estado o de área.
- **Postcondición:** El historial de la novedad incluye la transición, sin posibilidad de edición ni borrado.
- **Puntos:** por estimar

Criterios de aceptación · curso normal

1. **Sistema:** Registra el estado anterior (vacío en la creación de la novedad) y el estado nuevo.
2. **Sistema:** Registra el usuario que hizo el cambio, la fecha, la hora y la observación, si la hay.
3. **Sistema:** Actualiza la línea de tiempo de la novedad.

Criterios de aceptación · cursos alternos

- **1a** Si el registro de la transición falla, el sistema revierte el cambio de estado e informa el error. El caso de uso termina.

Pantallas de Figma (SDD, Tabla 36: 09, 15–18, 20, 22)

- [09 · Detalle de novedad resuelta](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=2-1118)
- [09-B · Hoja: la falla persiste](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=2-1243)
- [09-C · Diálogo: confirmar cierre](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=2-1365)
- [09-D · Sin conexión: cierre bloqueado](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=2-1479)
- [15 · Hoja: escalar al director](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=3-1281)
- [16 · Hoja: rechazar novedad](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=3-1387)
- [17 · Hoja: reasignar a otra área](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=3-1499)
- [18 · Registrar solución y tipo de falla](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=3-1619)
- [18-B · Fecha posterior a hoy](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=3-1685)
- [18-C · Novedad aprobada por el director](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=3-1754)
- [20 · Decidir sobre una novedad escalada](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=4-705)
- [20-B · Rechazo sin observación](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=4-878)
- [20-C · Versión móvil de la decisión](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=4-1054)
- [22 · Detalle completo con línea de tiempo](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=4-2093)
- [22-B · Sin permiso sobre la novedad](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=4-2322)

## S2 · 19–23 oct

### HU-09 · RF-09 · Consultar bandeja del área

- **Épica:** E3 Atención, aprobación y cierre · **Prioridad:** Alta · **Urgencia:** Hay presión
- **RF-09:** El sistema debe mostrar al aprobador de área las novedades abiertas de su área.
- **CU-09** · Actores: Aprobador de área (primario).
- **Precondición:** El aprobador de área inició sesión.
- **Postcondición:** El aprobador conoce las novedades pendientes de su área.
- **Puntos:** por estimar

Criterios de aceptación · curso normal

1. **Aprobador de área:** Solicita ver la bandeja de su área.
2. **Sistema:** Obtiene las novedades abiertas del área y las ordena por prioridad (crítico, alto, normal, bajo) y luego por antigüedad.
3. **Sistema:** Muestra de cada novedad el código, la finca, la prioridad, el estado y el tiempo transcurrido desde su registro.
4. **Aprobador de área:** Selecciona una novedad.
5. **Sistema:** Muestra el detalle de la novedad (CU-18).

Criterios de aceptación · cursos alternos

- **2a** Si no hay conexión, el sistema muestra la última versión descargada con su fecha de actualización. Continúa en el paso 3.
- **2b** Si no hay novedades pendientes, el sistema lo informa. El caso de uso termina.

Pantallas de Figma (SDD, Tabla 36: 11, 12)

- [11 · Bandeja del área (móvil)](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=3-295)
- [11-B · Bandeja sin conexión](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=3-407)
- [11-C · Bandeja vacía](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=3-524)
- [12 · Bandeja del área (escritorio)](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=3-587)

### HU-10 · RF-10 · Tomar novedad para atención

- **Épica:** E3 Atención, aprobación y cierre · **Prioridad:** Alta · **Urgencia:** Hay presión
- **RF-10:** El sistema debe permitir que el aprobador de área tome para atención una novedad asignada a su área.
- **CU-10** · Actores: Aprobador de área (primario).
- **Precondición:** La novedad está en estado “asignada”, pertenece al área del aprobador y hay conexión.
- **Postcondición:** La novedad queda “en atención” a cargo del área.
- **Puntos:** por estimar

Criterios de aceptación · curso normal

1. **Aprobador de área:** Selecciona una novedad asignada de su bandeja.
2. **Aprobador de área:** Solicita tomarla para atención.
3. **Sistema:** Cambia el estado de la novedad a “en atención”.
4. **Sistema:** Registra la transición en el historial (incluye CU-16).
5. **Sistema:** Notifica al reportante (incluye CU-30).

Criterios de aceptación · cursos alternos

- **2a** Si no hay conexión, se realiza CU-25. El caso de uso termina.

Pantallas de Figma (SDD, Tabla 36: 13)

- [13 · Detalle: novedad asignada](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=3-764)
- [13-B · Novedad tomada](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=3-854)

### HU-11 · RF-11 · Rechazar novedad

- **Épica:** E3 Atención, aprobación y cierre · **Prioridad:** Alta · **Urgencia:** Hay presión
- **RF-11:** El sistema debe permitir que el aprobador de área rechace una novedad de su área indicando el motivo.
- **CU-11** · Actores: Aprobador de área (primario).
- **Precondición:** La novedad está “asignada” o “en atención” en el área del aprobador y hay conexión.
- **Postcondición:** La novedad queda “rechazada” con su motivo registrado; el caso termina en ese estado final.
- **Puntos:** por estimar

Criterios de aceptación · curso normal

1. **Aprobador de área:** Solicita rechazar la novedad.
2. **Sistema:** Solicita el motivo del rechazo.
3. **Aprobador de área:** Escribe el motivo y confirma.
4. **Sistema:** Cambia el estado a “rechazada” (estado final).
5. **Sistema:** Registra la transición en el historial (incluye CU-16).
6. **Sistema:** Notifica al reportante (incluye CU-30).

Criterios de aceptación · cursos alternos

- **1a** Si no hay conexión, se realiza CU-25. El caso de uso termina.
- **3a** Si el motivo está vacío, el sistema no permite confirmar. Continúa en el paso 2.

Pantallas de Figma (SDD, Tabla 36: 13, 14, 16)

- [13 · Detalle: novedad asignada](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=3-764)
- [13-B · Novedad tomada](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=3-854)
- [14 · Detalle: novedad en atención](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=3-965)
- [14-B · Sin conexión: acciones bloqueadas](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=3-1064)
- [14-C · Conexión perdida durante una acción](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=3-1178)
- [16 · Hoja: rechazar novedad](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=3-1387)

### HU-12 · RF-12 · Escalar novedad a segunda instancia

- **Épica:** E3 Atención, aprobación y cierre · **Prioridad:** Alta · **Urgencia:** Hay presión
- **RF-12:** El sistema debe permitir que el aprobador de área escale al director de agricultura una novedad cuya solución exige una autorización mayor, como la compra de repuestos.
- **CU-12** · Actores: Aprobador de área (primario); Director de agricultura (receptor).
- **Precondición:** La novedad está “en atención” en el área del aprobador y hay conexión.
- **Postcondición:** La novedad queda “escalada” y visible para el director de agricultura.
- **Puntos:** por estimar

Criterios de aceptación · curso normal

1. **Aprobador de área:** Solicita escalar la novedad.
2. **Sistema:** Solicita la justificación del escalamiento (por ejemplo, la compra de repuestos).
3. **Aprobador de área:** Escribe la justificación y confirma.
4. **Sistema:** Cambia el estado a “escalada” y envía la novedad a la bandeja del director de agricultura.
5. **Sistema:** Registra la transición en el historial (incluye CU-16).
6. **Sistema:** Notifica al director de agricultura y al reportante (incluye CU-30).

Criterios de aceptación · cursos alternos

- **1a** Si no hay conexión, se realiza CU-25. El caso de uso termina.
- **3a** Si la justificación está vacía, el sistema no permite confirmar. Continúa en el paso 2.

Pantallas de Figma (SDD, Tabla 36: 14, 15)

- [14 · Detalle: novedad en atención](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=3-965)
- [14-B · Sin conexión: acciones bloqueadas](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=3-1064)
- [14-C · Conexión perdida durante una acción](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=3-1178)
- [15 · Hoja: escalar al director](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=3-1281)

### HU-14 · RF-14 · Registrar solución aplicada

- **Épica:** E3 Atención, aprobación y cierre · **Prioridad:** Alta · **Urgencia:** Hay presión
- **RF-14:** El sistema debe permitir que el aprobador de área registre la solución aplicada a una novedad y la clasifique por tipo de falla.
- **CU-14** · Actores: Aprobador de área (primario).
- **Precondición:** La novedad está “en atención” o “aprobada” a cargo del área del aprobador y hay conexión.
- **Postcondición:** La novedad queda “resuelta” con la solución y el tipo de falla registrados, en espera de la confirmación del reportante.
- **Puntos:** por estimar

Criterios de aceptación · curso normal

1. **Aprobador de área:** Solicita registrar la solución.
2. **Sistema:** Solicita la descripción de la solución aplicada, la fecha de ejecución y el tipo de falla.
3. **Aprobador de área:** Escribe el tipo de falla.
4. **Sistema:** Sugiere los tipos existentes que coinciden con lo escrito.
5. **Aprobador de área:** Selecciona un tipo existente o confirma uno nuevo, completa los demás datos y confirma.
6. **Sistema:** Cambia el estado a “resuelta” y asocia el tipo de falla a la novedad.
7. **Sistema:** Registra la transición en el historial (incluye CU-16).
8. **Sistema:** Notifica al reportante y, si se creó un tipo de falla nuevo, a los administradores (incluye CU-30).

Criterios de aceptación · cursos alternos

- **1a** Si no hay conexión, se realiza CU-25. El caso de uso termina.
- **5a** Si el tipo escrito coincide con uno existente salvo por mayúsculas o tildes, el sistema propone el existente en lugar de crear uno nuevo. Continúa en el paso 5.
- **6a** Si la descripción o el tipo de falla están vacíos, o la fecha de ejecución es posterior a la actual, el sistema lo señala. Continúa en el paso 2.

Pantallas de Figma (SDD, Tabla 36: 14, 18)

- [14 · Detalle: novedad en atención](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=3-965)
- [14-B · Sin conexión: acciones bloqueadas](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=3-1064)
- [14-C · Conexión perdida durante una acción](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=3-1178)
- [18 · Registrar solución y tipo de falla](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=3-1619)
- [18-B · Fecha posterior a hoy](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=3-1685)
- [18-C · Novedad aprobada por el director](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=3-1754)

### HU-17 · RF-17 · Reasignar novedad a otra área

- **Épica:** E3 Atención, aprobación y cierre · **Prioridad:** Media · **Urgencia:** Puede esperar
- **RF-17:** El sistema debe permitir que el aprobador de área reasigne a la otra área una novedad enrutada por error.
- **CU-17** · Actores: Aprobador de área (primario); aprobador de la otra área (receptor).
- **Precondición:** La novedad está “asignada” o “en atención” en el área del aprobador y hay conexión.
- **Postcondición:** La novedad queda en la bandeja de la otra área, en estado “asignada”.
- **Puntos:** por estimar

Criterios de aceptación · curso normal

1. **Aprobador de área:** Solicita reasignar la novedad.
2. **Sistema:** Solicita el motivo de la reasignación.
3. **Aprobador de área:** Escribe el motivo y confirma.
4. **Sistema:** Asigna la novedad al área nueva en estado “asignada”.
5. **Sistema:** Registra la transición en el historial (incluye CU-16).
6. **Sistema:** Notifica a la nueva área y al reportante (incluye CU-30).

Criterios de aceptación · cursos alternos

- **1a** Si no hay conexión, se realiza CU-25. El caso de uso termina.
- **3a** Si el motivo está vacío, el sistema no permite confirmar. Continúa en el paso 2.

Pantallas de Figma (SDD, Tabla 36: 13, 14, 17)

- [13 · Detalle: novedad asignada](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=3-764)
- [13-B · Novedad tomada](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=3-854)
- [14 · Detalle: novedad en atención](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=3-965)
- [14-B · Sin conexión: acciones bloqueadas](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=3-1064)
- [14-C · Conexión perdida durante una acción](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=3-1178)
- [17 · Hoja: reasignar a otra área](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=3-1499)

### HU-18 · RF-18 · Consultar detalle y línea de tiempo de una novedad

- **Épica:** E4 Consulta e historial · **Prioridad:** Alta · **Urgencia:** Hay presión
- **RF-18:** El sistema debe mostrar el detalle y la línea de tiempo de una novedad a los usuarios con permiso sobre ella.
- **CU-18** · Actores: Usuario (primario): reportante, aprobador de área, director de agricultura o administrador.
- **Precondición:** El usuario inició sesión y tiene permiso sobre la novedad.
- **Postcondición:** El usuario conoce el estado y el historial completo de la novedad.
- **Puntos:** por estimar

Criterios de aceptación · curso normal

1. **Usuario:** Selecciona una novedad.
2. **Sistema:** Verifica que la novedad esté dentro del alcance de consulta del rol: el reportante ve las de su finca; el aprobador de área, las de su área; el director de agricultura, todas, y el administrador, todo el sistema.
3. **Sistema:** Muestra el código, la finca, el área, la prioridad, la descripción y el estado actual y, si la novedad está resuelta o cerrada, el tipo de falla.
4. **Sistema:** Muestra la línea de tiempo con cada transición, su usuario, su fecha y su observación.
5. **Sistema:** Muestra las acciones que el rol del usuario puede ejecutar en el estado actual.

Criterios de aceptación · cursos alternos

- **2a** Si el usuario no tiene permiso sobre la novedad, el sistema niega el acceso. El caso de uso termina.
- **3a** Si no hay conexión, el sistema muestra la última versión descargada con su fecha de actualización. Continúa en el paso 4.

Pantallas de Figma (SDD, Tabla 36: 04, 09, 13, 14, 20–22)

- [04 · Mis novedades](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=2-36)
- [04-B · Consulta sin conexión](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=2-160)
- [04-C · Finca sin novedades abiertas](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=2-291)
- [09 · Detalle de novedad resuelta](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=2-1118)
- [09-B · Hoja: la falla persiste](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=2-1243)
- [09-C · Diálogo: confirmar cierre](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=2-1365)
- [09-D · Sin conexión: cierre bloqueado](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=2-1479)
- [13 · Detalle: novedad asignada](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=3-764)
- [13-B · Novedad tomada](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=3-854)
- [14 · Detalle: novedad en atención](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=3-965)
- [14-B · Sin conexión: acciones bloqueadas](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=3-1064)
- [14-C · Conexión perdida durante una acción](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=3-1178)
- [20 · Decidir sobre una novedad escalada](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=4-705)
- [20-B · Rechazo sin observación](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=4-878)
- [20-C · Versión móvil de la decisión](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=4-1054)
- [21 · Historial con filtros y exportación](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=4-1189)
- [21-B · Rango de fechas inválido](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=4-1523)
- [21-C · Sin resultados](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=4-1862)
- [21-D · Historial en móvil (aprobador)](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=4-1973)
- [22 · Detalle completo con línea de tiempo](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=4-2093)
- [22-B · Sin permiso sobre la novedad](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=4-2322)

## S3 · 26–30 oct

### HU-02 · RF-02 · Recuperar contraseña

- **Épica:** E1 Acceso y administración · **Prioridad:** Alta · **Urgencia:** Inmediatamente
- **RF-02:** El sistema debe permitir que el usuario restablezca su contraseña a través de los administradores, dado que los correos de la plataforma no corresponden a dominios reales y no admiten enlaces de recuperación.
- **CU-02** · Actores: Usuario (primario); Administrador (secundario).
- **Precondición:** El usuario está registrado con un correo asignado por el administrador y hay conexión.
- **Postcondición:** La contraseña del usuario queda actualizada.
- **Puntos:** por estimar

Criterios de aceptación · curso normal

1. **Usuario:** Solicita recuperar su contraseña desde la pantalla de ingreso.
2. **Sistema:** Solicita el correo registrado.
3. **Usuario:** Ingresa el correo.
4. **Sistema:** Registra la solicitud en el panel de los administradores y muestra un mensaje de confirmación.
5. **Administrador:** Consulta la solicitud, verifica la identidad del usuario y solicita generar el código temporal.
6. **Sistema:** Genera un código temporal de un solo uso y lo muestra una sola vez al administrador.
7. **Administrador:** Entrega el código al usuario.
8. **Usuario:** Ingresa el código temporal y la nueva contraseña.
9. **Sistema:** Valida el código, actualiza la contraseña y muestra la pantalla de ingreso.

Criterios de aceptación · cursos alternos

- **4a** Si el correo no corresponde a un usuario activo, el sistema muestra el mismo mensaje de confirmación sin registrar la solicitud. El caso de uso termina.
- **9a** Si el código venció o ya se usó, el sistema informa que debe solicitarse uno nuevo. El caso de uso termina.
- **9b** Si el código no es válido, el sistema lo informa. Continúa en el paso 8.

Pantallas de Figma (SDD, Tabla 36: 02, 03, 32)

- [02 · Recuperar contraseña](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=1-570)
- [02-B · Solicitud enviada](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=1-616)
- [03 · Crear contraseña con código](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=1-672)
- [03-B · Código vencido](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=1-735)
- [32 · Recuperación de contraseñas](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=6-3317)

### HU-03 · RF-03 · Gestionar usuarios

- **Épica:** E1 Acceso y administración · **Prioridad:** Alta · **Urgencia:** Inmediatamente
- **RF-03:** El sistema debe permitir que el administrador cree, edite y desactive usuarios.
- **CU-03** · Actores: Administrador (primario).
- **Precondición:** El administrador inició sesión y hay conexión.
- **Postcondición:** El usuario queda creado, actualizado o desactivado con su rol asignado.
- **Puntos:** por estimar

Criterios de aceptación · curso normal

1. **Administrador:** Solicita gestionar usuarios.
2. **Sistema:** Muestra la lista de usuarios con su rol, su finca o área y su estado.
3. **Administrador:** Elige crear un usuario o editar uno existente.
4. **Sistema:** Solicita nombre, correo, contraseña inicial, rol y, según el rol, la finca (reportante) o el área (aprobador de área).
5. **Administrador:** Ingresa o modifica los datos y confirma.
6. **Sistema:** Valida los datos, guarda el usuario y actualiza la lista.

Criterios de aceptación · cursos alternos

- **3a** Si el administrador elige desactivar un usuario, el sistema le impide el ingreso en adelante y conserva sus registros históricos. El caso de uso termina.
- **6a** Si el correo ya está registrado, el sistema informa el error. Continúa en el paso 5.
- **6b** Si falta un dato obligatorio o el rol no tiene la finca o el área asociada, el sistema señala los campos. Continúa en el paso 5.

Pantallas de Figma (SDD, Tabla 36: 28, 29)

- [28 · Usuarios](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=6-867)
- [28-B · Diálogo: desactivar usuario](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=6-1098)
- [29 · Crear o editar usuario](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=6-1343)
- [29-B · Rol aprobador de área](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=6-1651)

### HU-04 · RF-04 · Gestionar fincas

- **Épica:** E1 Acceso y administración · **Prioridad:** Alta · **Urgencia:** Inmediatamente
- **RF-04:** El sistema debe permitir que el administrador cree, edite y desactive las fincas.
- **CU-04** · Actores: Administrador (primario).
- **Precondición:** El administrador inició sesión y hay conexión.
- **Postcondición:** La finca queda disponible para el registro de novedades, o inactiva si se desactivó.
- **Puntos:** por estimar

Criterios de aceptación · curso normal

1. **Administrador:** Solicita gestionar fincas.
2. **Sistema:** Muestra la lista de fincas con su razón social y su estado.
3. **Administrador:** Elige crear una finca o editar una existente.
4. **Sistema:** Solicita el nombre de la finca y la razón social a la que pertenece.
5. **Administrador:** Ingresa o modifica los datos y confirma.
6. **Sistema:** Valida y guarda la finca.

Criterios de aceptación · cursos alternos

- **3a** Si el administrador elige desactivar una finca, el sistema la oculta para nuevos registros y conserva su historial. El caso de uso termina.
- **3b** Si la finca que se va a desactivar tiene novedades abiertas, el sistema lo advierte y pide confirmación; con la confirmación, continúa como en 3a.
- **6a** Si ya existe una finca con ese nombre en la misma razón social, el sistema informa el error. Continúa en el paso 5.

Pantallas de Figma (SDD, Tabla 36: 30)

- [30 · Fincas](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=6-1961)
- [30-B · Formulario: nueva finca](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=6-2194)

### HU-13 · RF-13 · Aprobar o rechazar novedad escalada

- **Épica:** E3 Atención, aprobación y cierre · **Prioridad:** Alta · **Urgencia:** Hay presión
- **RF-13:** El sistema debe permitir que el director de agricultura apruebe o rechace las novedades escaladas.
- **CU-13** · Actores: Director de agricultura (primario).
- **Precondición:** La novedad está “escalada”, el director inició sesión y hay conexión.
- **Postcondición:** La novedad queda “aprobada”, y regresa al área para ejecutar la solución (CU-14), o “rechazada”, con lo que el caso termina.
- **Puntos:** por estimar

Criterios de aceptación · curso normal

1. **Director de agricultura:** Solicita ver las novedades escaladas.
2. **Sistema:** Muestra las novedades escaladas con su justificación y su historial.
3. **Director de agricultura:** Selecciona una novedad y decide aprobarla o rechazarla.
4. **Sistema:** Solicita una observación.
5. **Director de agricultura:** Escribe la observación y confirma.
6. **Sistema:** Cambia el estado a “aprobada” o “rechazada” según la decisión.
7. **Sistema:** Registra la transición en el historial (incluye CU-16).
8. **Sistema:** Notifica al área y al reportante (incluye CU-30).

Criterios de aceptación · cursos alternos

- **3a** Si no hay conexión, se realiza CU-25. El caso de uso termina.
- **5a** Si la decisión es rechazar y la observación está vacía, el sistema no permite confirmar. Continúa en el paso 4.

Pantallas de Figma (SDD, Tabla 36: 12, 19, 20)

- [12 · Bandeja del área (escritorio)](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=3-587)
- [19 · Novedades escaladas](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=4-547)
- [20 · Decidir sobre una novedad escalada](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=4-705)
- [20-B · Rechazo sin observación](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=4-878)
- [20-C · Versión móvil de la decisión](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=4-1054)

### HU-15 · RF-15 · Confirmar resolución y cerrar novedad

- **Épica:** E3 Atención, aprobación y cierre · **Prioridad:** Alta · **Urgencia:** Hay presión
- **RF-15:** El sistema debe permitir que el reportante confirme que una novedad de su finca quedó resuelta o indique que la falla persiste.
- **CU-15** · Actores: Reportante (primario).
- **Precondición:** La novedad está “resuelta”, pertenece a la finca del reportante y hay conexión.
- **Postcondición:** La novedad queda “cerrada” y no admite más cambios, salvo la corrección del tipo de falla por el administrador (CU-32), que no cambia su estado y queda anotada en su historial.
- **Puntos:** por estimar

Criterios de aceptación · curso normal

1. **Reportante:** Consulta una novedad en estado “resuelta”.
2. **Sistema:** Muestra la solución registrada por el área.
3. **Reportante:** Confirma que la novedad quedó resuelta y, si lo desea, escribe una observación.
4. **Sistema:** Cambia el estado a “cerrada” (estado final).
5. **Sistema:** Registra la transición en el historial (incluye CU-16).
6. **Sistema:** Notifica al área (incluye CU-30).

Criterios de aceptación · cursos alternos

- **1a** Si no hay conexión, se realiza CU-25. El caso de uso termina.
- **3a** Si el reportante indica que la falla persiste, escribe una observación obligatoria; el sistema devuelve la novedad a “en atención” con esa observación, registra la transición (CU-16) y notifica al área (CU-30). El caso de uso termina.
- **3b** Si indica que la falla persiste y la observación está vacía, el sistema no permite confirmar. Continúa en el paso 3.

Pantallas de Figma (SDD, Tabla 36: 04, 09)

- [04 · Mis novedades](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=2-36)
- [04-B · Consulta sin conexión](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=2-160)
- [04-C · Finca sin novedades abiertas](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=2-291)
- [09 · Detalle de novedad resuelta](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=2-1118)
- [09-B · Hoja: la falla persiste](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=2-1243)
- [09-C · Diálogo: confirmar cierre](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=2-1365)
- [09-D · Sin conexión: cierre bloqueado](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=2-1479)

## S4 · 3–6 nov

### HU-21 · RF-21 · Registrar novedad sin conexión

- **Épica:** E5 Operación sin conexión · **Prioridad:** Alta · **Urgencia:** Hay presión
- **RF-21:** El sistema debe guardar en el dispositivo las novedades que se registran sin conexión. Se ejecuta dentro de RF-05.
- **CU-21** · Actores: Reportante (primario).
- **Precondición:** El reportante ingresó antes con conexión en el dispositivo y en este momento no hay conexión.
- **Postcondición:** La novedad queda guardada en el dispositivo, pendiente de sincronizar, aunque se cierre el navegador o se apague el dispositivo.
- **Puntos:** por estimar

Criterios de aceptación · curso normal

1. **Sistema:** Genera un identificador único local para la novedad.
2. **Sistema:** Guarda la novedad en el almacenamiento del dispositivo con la fecha y la hora de registro, y confirma que la escritura quedó guardada.
3. **Sistema:** Marca la novedad como “pendiente de sincronizar”.
4. **Sistema:** Informa al reportante que la novedad se enviará al recuperar la conexión.
5. **Sistema:** Actualiza el indicador de conexión y pendientes (incluye CU-23).

Criterios de aceptación · cursos alternos

- **2a** Si el almacenamiento del dispositivo está lleno, el sistema informa que no se pudo guardar la novedad. El caso de uso termina.
- **2b** Si la escritura en el dispositivo falla, el sistema informa que la novedad no se guardó y pide reintentar. El caso de uso termina.

Pantallas de Figma (SDD, Tabla 36: 05-B, 07)

- [05-B · Sin conexión: guardar en el dispositivo](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=2-538)
- [07 · Guardada en el dispositivo](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=2-935)

### HU-22 · RF-22 · Sincronizar novedades pendientes

- **Épica:** E5 Operación sin conexión · **Prioridad:** Alta · **Urgencia:** Hay presión
- **RF-22:** El sistema debe enviar automáticamente al servidor las novedades pendientes cuando se restablezca la conexión.
- **CU-22** · Actores: Reportante (primario; el sistema inicia el caso al detectar la conexión).
- **Precondición:** La aplicación está abierta, hay novedades pendientes de sincronizar y la sesión del usuario sigue vigente.
- **Postcondición:** Las novedades pendientes quedan en el servidor, con código definitivo y asignadas a su área.
- **Puntos:** por estimar

Criterios de aceptación · curso normal

1. **Sistema:** Detecta, al abrirse o mientras está abierto, que la conexión se restableció.
2. **Sistema:** Toma las novedades pendientes en el orden en que fueron creadas.
3. **Sistema:** Envía cada novedad al servidor con su identificador local y su fecha de registro.
4. **Sistema:** Guarda la novedad en el servidor en estado “registrada”.
5. **Sistema:** Asigna el código y confirma la recepción (incluye CU-06).
6. **Sistema:** Enruta la novedad al área responsable (incluye CU-07).
7. **Sistema:** Marca la novedad como sincronizada y la retira de la cola de pendientes. Los pasos 3 a 7 se repiten para cada novedad pendiente.
8. **Sistema:** Actualiza el indicador de conexión y pendientes (incluye CU-23).

Criterios de aceptación · cursos alternos

- **3a** Si la sesión venció, el sistema conserva la cola y solicita el ingreso (CU-01). El caso de uso termina.
- **3b** Si la conexión se pierde durante el envío, el sistema conserva en la cola las novedades restantes y reintenta al volver la conexión. El caso de uso termina.
- **4a** Si el servidor ya tiene una novedad con ese identificador local, la marca como sincronizada sin duplicarla. Continúa en el paso 7.
- **4b** Si el servidor rechaza la novedad por una regla de negocio, como una finca o un área desactivadas, el sistema la conserva en la cola marcada con el error y continúa con la siguiente; el reportante puede reintentar su envío (CU-23). Continúa en el paso 3.

Pantallas de Figma (SDD, Tabla 36: 08, 08-B)

- [08 · Pendientes de sincronizar](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=2-982)
- [08-B · Sesión vencida durante la sincronización](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=2-1048)

### HU-23 · RF-23 · Mostrar estado de conexión y pendientes

- **Épica:** E5 Operación sin conexión · **Prioridad:** Media · **Urgencia:** Puede esperar
- **RF-23:** El sistema debe mostrar de forma permanente el estado de la conexión y la cantidad de novedades pendientes de sincronizar.
- **CU-23** · Actores: Usuario (primario).
- **Precondición:** El usuario tiene la aplicación abierta.
- **Postcondición:** El usuario sabe si está en línea y cuántas novedades faltan por enviar.
- **Puntos:** por estimar

Criterios de aceptación · curso normal

1. **Sistema:** Detecta el estado de la conexión del dispositivo.
2. **Sistema:** Muestra un indicador de “en línea” o “sin conexión”.
3. **Sistema:** Muestra la cantidad de novedades pendientes de sincronizar, si las hay.
4. **Sistema:** Actualiza el indicador cuando termina una sincronización.

Criterios de aceptación · cursos alternos

- **3a** Si una novedad falló al sincronizar, el sistema la señala con el error y permite reintentar manualmente. Continúa en el paso 4.

Pantallas de Figma (SDD, Tabla 36: 04, 07, 08, 11)

- [04 · Mis novedades](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=2-36)
- [04-B · Consulta sin conexión](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=2-160)
- [04-C · Finca sin novedades abiertas](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=2-291)
- [07 · Guardada en el dispositivo](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=2-935)
- [08 · Pendientes de sincronizar](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=2-982)
- [08-B · Sesión vencida durante la sincronización](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=2-1048)
- [11 · Bandeja del área (móvil)](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=3-295)
- [11-B · Bandeja sin conexión](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=3-407)
- [11-C · Bandeja vacía](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=3-524)

### HU-24 · RF-24 · Consultar novedades sin conexión

- **Épica:** E5 Operación sin conexión · **Prioridad:** Alta · **Urgencia:** Hay presión
- **RF-24:** El sistema debe permitir consultar sin conexión las novedades descargadas previamente en el dispositivo.
- **CU-24** · Actores: Usuario (primario).
- **Precondición:** El usuario abrió antes la aplicación con conexión y sus novedades quedaron descargadas en el dispositivo.
- **Postcondición:** El usuario consulta la información disponible en el dispositivo.
- **Puntos:** por estimar

Criterios de aceptación · curso normal

1. **Usuario:** Solicita ver las novedades según su rol.
2. **Sistema:** Detecta que no hay conexión.
3. **Sistema:** Muestra las novedades descargadas y las pendientes de sincronizar.
4. **Sistema:** Indica la fecha y la hora de la última actualización.
5. **Usuario:** Selecciona una novedad.
6. **Sistema:** Muestra el detalle disponible en el dispositivo (CU-18).

Criterios de aceptación · cursos alternos

- **3a** Si no hay novedades descargadas, el sistema informa que la primera consulta requiere conexión. El caso de uso termina.

Pantallas de Figma (SDD, Tabla 36: 04-B, 11-B)

- [04-B · Consulta sin conexión](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=2-160)
- [11-B · Bandeja sin conexión](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=3-407)

### HU-25 · RF-25 · Restringir acciones sin conexión

- **Épica:** E5 Operación sin conexión · **Prioridad:** Alta · **Urgencia:** Hay presión
- **RF-25:** El sistema debe impedir las acciones que modifican el estado de una novedad mientras no haya conexión, porque dependen del estado vigente en el servidor. Se ejecuta dentro de RF-10 a RF-15 y RF-17.
- **CU-25** · Actores: Aprobador de área, Director de agricultura y Reportante (quienes intentan la acción).
- **Precondición:** No hay conexión.
- **Postcondición:** Ningún cambio de estado se realiza sin conexión.
- **Puntos:** por estimar

Criterios de aceptación · curso normal

1. **Sistema:** Detecta que no hay conexión.
2. **Sistema:** Deshabilita las acciones de tomar, rechazar, escalar, aprobar, resolver, cerrar, indicar que la falla persiste y reasignar.
3. **Sistema:** Informa que estas acciones requieren conexión porque dependen del estado vigente en el servidor.
4. **Sistema:** Al restablecerse la conexión, habilita de nuevo las acciones según el rol del usuario.

Criterios de aceptación · cursos alternos

- **2a** Si la conexión se pierde mientras se envía una acción, el sistema informa que no se aplicó y conserva el estado anterior. El caso de uso termina.

Pantallas de Figma (SDD, Tabla 36: 09-D, 14-B, 14-C)

- [09-D · Sin conexión: cierre bloqueado](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=2-1479)
- [14-B · Sin conexión: acciones bloqueadas](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=3-1064)
- [14-C · Conexión perdida durante una acción](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=3-1178)

### HU-08 · RF-08 · Adjuntar evidencia fotográfica

- **Épica:** E2 Registro y enrutamiento · **Prioridad:** Baja · **Urgencia:** Puede esperar · **Línea de corte:** 3.º
- **RF-08:** El sistema debe permitir que el reportante adjunte fotografías como evidencia al registrar una novedad de su finca o al consultarla mientras no esté cerrada ni rechazada.
- **CU-08** · Actores: Reportante (primario).
- **Precondición:** El reportante está registrando una novedad de su finca o consultando una que no está cerrada ni rechazada.
- **Postcondición:** La novedad tiene la fotografía asociada como evidencia.
- **Puntos:** por estimar

Criterios de aceptación · curso normal

1. **Reportante:** Solicita adjuntar una fotografía.
2. **Sistema:** Permite tomar la foto con la cámara o elegirla de la galería del dispositivo.
3. **Reportante:** Toma o selecciona la fotografía.
4. **Sistema:** Reduce el tamaño de la imagen y la asocia a la novedad.

Criterios de aceptación · cursos alternos

- **4a** Si el archivo no es una imagen o supera el tamaño permitido, el sistema lo rechaza. Continúa en el paso 2.
- **4b** Si no hay conexión, el sistema no guarda la fotografía y lo informa; el reportante puede continuar con el registro de la novedad sin ella y adjuntarla desde el detalle cuando la novedad se sincronice. El caso de uso termina.

Pantallas de Figma (SDD, Tabla 36: 05, 09)

- [05 · Registrar novedad](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=2-423)
- [05-B · Sin conexión: guardar en el dispositivo](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=2-538)
- [05-C · Campos obligatorios faltantes](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=2-657)
- [05-D · Foto no válida](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=2-777)
- [09 · Detalle de novedad resuelta](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=2-1118)
- [09-B · Hoja: la falla persiste](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=2-1243)
- [09-C · Diálogo: confirmar cierre](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=2-1365)
- [09-D · Sin conexión: cierre bloqueado](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=2-1479)

## S5 · 9–13 nov

### HU-19 · RF-19 · Consultar historial con filtros

- **Épica:** E4 Consulta e historial · **Prioridad:** Alta · **Urgencia:** Hay presión
- **RF-19:** El sistema debe permitir consultar el historial de novedades mediante filtros.
- **CU-19** · Actores: Usuario (primario).
- **Precondición:** El usuario inició sesión y hay conexión.
- **Postcondición:** El usuario obtiene el listado de novedades filtrado.
- **Puntos:** por estimar

Criterios de aceptación · curso normal

1. **Usuario:** Solicita consultar el historial.
2. **Sistema:** Muestra los filtros de finca, área, estado, rango de fechas y tipo de falla.
3. **Usuario:** Aplica uno o más filtros.
4. **Sistema:** Muestra las novedades que cumplen los filtros dentro del alcance de permisos del usuario, de la más reciente a la más antigua.
5. **Usuario:** Selecciona una novedad.
6. **Sistema:** Muestra el detalle de la novedad (CU-18).

Criterios de aceptación · cursos alternos

- **3a** Si la fecha inicial es posterior a la fecha final, el sistema lo señala. Continúa en el paso 3.
- **4a** Si ninguna novedad cumple los filtros, el sistema lo informa. Continúa en el paso 3.
- **4b** Si el usuario es administrador o director de agricultura, puede exportar el resultado (CU-20). Continúa en el paso 5.

Pantallas de Figma (SDD, Tabla 36: 21, 23, 26)

- [21 · Historial con filtros y exportación](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=4-1189)
- [21-B · Rango de fechas inválido](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=4-1523)
- [21-C · Sin resultados](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=4-1862)
- [21-D · Historial en móvil (aprobador)](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=4-1973)
- [23 · Panel: novedades abiertas](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=5-783)
- [26 · Panel: fallas recurrentes (matriz)](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=5-1862)

### HU-20 · RF-20 · Exportar resultado de la consulta

- **Épica:** E4 Consulta e historial · **Prioridad:** Baja · **Urgencia:** Puede esperar · **Línea de corte:** 2.º
- **RF-20:** El sistema debe permitir que el administrador y el director de agricultura exporten a CSV el resultado de una consulta.
- **CU-20** · Actores: Director de agricultura y Administrador (primarios).
- **Precondición:** Se realizó CU-19 con al menos un resultado.
- **Postcondición:** El usuario tiene un archivo CSV con el resultado de la consulta.
- **Puntos:** por estimar

Criterios de aceptación · curso normal

1. **Director de agricultura o Administrador:** Solicita exportar el resultado de la consulta.
2. **Sistema:** Genera un archivo CSV con las novedades filtradas y sus datos principales.
3. **Sistema:** Descarga el archivo en el dispositivo.

Criterios de aceptación · cursos alternos

- **1a** Si el usuario no es administrador ni director de agricultura, el sistema no muestra la opción. El caso de uso termina.

Pantallas de Figma (SDD, Tabla 36: 21)

- [21 · Historial con filtros y exportación](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=4-1189)
- [21-B · Rango de fechas inválido](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=4-1523)
- [21-C · Sin resultados](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=4-1862)
- [21-D · Historial en móvil (aprobador)](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=4-1973)

### HU-26 · RF-26 · Consultar novedades abiertas por finca y por área

- **Épica:** E6 Panel de reportes · **Prioridad:** Alta · **Urgencia:** Hay presión
- **RF-26:** El sistema debe mostrar en el panel de reportes las novedades abiertas agrupadas por finca y por área.
- **CU-26** · Actores: Usuario con acceso al panel de reportes (primario): director de agricultura o administrador.
- **Precondición:** El usuario tiene acceso al panel de reportes y hay conexión.
- **Postcondición:** El usuario conoce la carga de novedades abiertas por finca y por área.
- **Puntos:** por estimar

Criterios de aceptación · curso normal

1. **Usuario:** Solicita el panel de reportes.
2. **Sistema:** Calcula las novedades abiertas agrupadas por finca y por área.
3. **Sistema:** Muestra los totales en gráficos y en tabla.
4. **Usuario:** Selecciona una finca o un área.
5. **Sistema:** Muestra el historial con ese filtro aplicado (CU-19).

Criterios de aceptación · cursos alternos

- **1a** Si el usuario no es director de agricultura ni administrador, el sistema no muestra la opción. El caso de uso termina.
- **2a** Si no hay novedades abiertas, el sistema muestra los totales en cero. Continúa en el paso 3.

Pantallas de Figma (SDD, Tabla 36: 23)

- [23 · Panel: novedades abiertas](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=5-783)

### HU-27 · RF-27 · Medir tiempos de atención

- **Épica:** E6 Panel de reportes · **Prioridad:** Alta · **Urgencia:** Hay presión
- **RF-27:** El sistema debe calcular los tiempos de atención de cada área.
- **CU-27** · Actores: Usuario con acceso al panel de reportes (primario): director de agricultura o administrador.
- **Precondición:** El usuario tiene acceso al panel de reportes y hay conexión.
- **Postcondición:** El usuario conoce los tiempos de atención de mantenimiento y de sistemas.
- **Puntos:** por estimar

Criterios de aceptación · curso normal

1. **Usuario:** Selecciona el indicador de tiempos de atención y un período.
2. **Sistema:** Calcula el tiempo transcurrido de cada novedad abierta desde su registro.
3. **Sistema:** Calcula el tiempo promedio entre el registro y la resolución, por área, en el período, con base en la fecha real de registro en la finca.
4. **Sistema:** Muestra los resultados y destaca las novedades con más tiempo abiertas.

Criterios de aceptación · cursos alternos

- **3a** Si no hay novedades resueltas en el período, el sistema indica que el promedio no está disponible. Continúa en el paso 4.

Pantallas de Figma (SDD, Tabla 36: 24)

- [24 · Panel: tiempos de atención](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=5-1087)
- [24-B · Sin resueltas en el período](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=5-1326)

### HU-28 · RF-28 · Calcular proporción de novedades escaladas

- **Épica:** E6 Panel de reportes · **Prioridad:** Alta · **Urgencia:** Hay presión
- **RF-28:** El sistema debe calcular qué proporción de las novedades requiere la segunda instancia de aprobación.
- **CU-28** · Actores: Usuario con acceso al panel de reportes (primario): director de agricultura o administrador.
- **Precondición:** El usuario tiene acceso al panel de reportes y hay conexión.
- **Postcondición:** El usuario conoce qué parte de las novedades requiere la segunda instancia de aprobación.
- **Puntos:** por estimar

Criterios de aceptación · curso normal

1. **Usuario:** Selecciona el indicador de escalamiento y un período.
2. **Sistema:** Cuenta las novedades registradas en el período y las que pasaron por el estado “escalada”.
3. **Sistema:** Calcula la proporción y la muestra por área.

Criterios de aceptación · cursos alternos

- **2a** Si no hay novedades en el período, el sistema lo informa. Continúa en el paso 1.

Pantallas de Figma (SDD, Tabla 36: 25)

- [25 · Panel: escalamiento](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=5-1530)
- [25-B · Período sin novedades](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=5-1776)

### HU-29 · RF-29 · Identificar fallas recurrentes

- **Épica:** E6 Panel de reportes · **Prioridad:** Alta · **Urgencia:** Hay presión
- **RF-29:** El sistema debe mostrar la frecuencia de novedades por finca y por tipo de falla, para distinguir una falla puntual de un problema estructural.
- **CU-29** · Actores: Usuario con acceso al panel de reportes (primario): director de agricultura o administrador.
- **Precondición:** El usuario tiene acceso al panel de reportes y hay conexión.
- **Postcondición:** El usuario identifica qué fincas repiten el mismo tipo de falla.
- **Puntos:** por estimar

Criterios de aceptación · curso normal

1. **Usuario:** Selecciona el indicador de recurrencia y un período.
2. **Sistema:** Cuenta las novedades resueltas y cerradas del período, agrupadas por finca y por tipo de falla.
3. **Sistema:** Muestra una matriz de finca por tipo de falla, de mayor a menor frecuencia.
4. **Usuario:** Selecciona una combinación de finca y tipo de falla.
5. **Sistema:** Muestra el historial con esos filtros aplicados (CU-19).

Criterios de aceptación · cursos alternos

- **2a** Si no hay novedades en el período, el sistema lo informa. Continúa en el paso 1.
- **2b** Si hay novedades sin tipo de falla por estar abiertas o rechazadas, el sistema las excluye del conteo e informa cuántas quedaron por fuera. Continúa en el paso 3.

Pantallas de Figma (SDD, Tabla 36: 26, 27)

- [26 · Panel: fallas recurrentes (matriz)](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=5-1862)
- [27 · Panel: fallas recurrentes (móvil)](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=5-2174)

### HU-30 · RF-30 · Notificar cambios dentro de la aplicación

- **Épica:** E7 Notificaciones · **Prioridad:** Media · **Urgencia:** Puede esperar
- **RF-30:** El sistema debe notificar dentro de la aplicación los cambios de estado o de área de las novedades. Se ejecuta dentro de RF-07, RF-10 a RF-15 y RF-17.
- **CU-30** · Actores: Usuario (destinatario): reportante, aprobador de área, director de agricultura o administrador.
- **Precondición:** Una novedad cambió de estado o de área.
- **Postcondición:** Los involucrados quedan enterados del cambio.
- **Puntos:** por estimar

Criterios de aceptación · curso normal

1. **Sistema:** Identifica a los destinatarios: los aprobadores del área cuando la novedad llega a su bandeja o cuando el director o el reportante actúan sobre ella; los directores cuando hay escalamiento; el reportante en cada cambio de estado o de área de su novedad, y los administradores cuando un aprobador crea un tipo de falla nuevo. Quien ejecuta la acción no recibe la notificación de su propio cambio.
2. **Sistema:** Crea una notificación con el código, el estado nuevo y la fecha.
3. **Sistema:** Muestra a cada destinatario un contador de notificaciones sin leer.
4. **Usuario:** Abre una notificación.
5. **Sistema:** Marca la notificación como leída y muestra la novedad (CU-18).

Criterios de aceptación · cursos alternos

- **2a** Si el destinatario autorizó las notificaciones push, se realiza CU-31. Continúa en el paso 3.
- **3a** Si el destinatario no tiene sesión abierta, el sistema conserva la notificación hasta su próximo ingreso. Continúa en el paso 3 cuando el destinatario ingresa.

Pantallas de Figma (SDD, Tabla 36: 10 y avisos de 06, 15–17, 20)

- [10 · Avisos](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=2-1612)
- [10-B · Hoja: activar notificaciones push](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=2-1703)
- [10-C · Notificación push en el teléfono](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=2-1807)
- [06 · Novedad recibida](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=2-887)
- [15 · Hoja: escalar al director](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=3-1281)
- [16 · Hoja: rechazar novedad](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=3-1387)
- [17 · Hoja: reasignar a otra área](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=3-1499)
- [20 · Decidir sobre una novedad escalada](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=4-705)
- [20-B · Rechazo sin observación](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=4-878)
- [20-C · Versión móvil de la decisión](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=4-1054)

### HU-32 · RF-32 · Gestionar tipos de falla

- **Épica:** E1 Acceso y administración · **Prioridad:** Media · **Urgencia:** Puede esperar · **Línea de corte:** 4.º
- **RF-32:** El sistema debe permitir que el administrador depure el catálogo de tipos de falla para evitar su fragmentación y que corrija el tipo de falla de una novedad cerrada mal clasificada.
- **CU-32** · Actores: Administrador (primario).
- **Precondición:** El administrador inició sesión y hay conexión.
- **Postcondición:** La lista de tipos de falla o la clasificación de la novedad quedan corregidas, y los indicadores del panel reflejan la agrupación corregida.
- **Puntos:** por estimar

Criterios de aceptación · curso normal

1. **Administrador:** Solicita gestionar los tipos de falla.
2. **Sistema:** Muestra la lista de tipos con la cantidad de novedades asociadas a cada uno.
3. **Administrador:** Elige renombrar un tipo, fusionar dos tipos en uno o desactivar un tipo.
4. **Sistema:** Aplica el cambio: al fusionar, reasigna al tipo destino las novedades del tipo origen y retira el origen de la lista; al desactivar, conserva las novedades asociadas y deja el tipo fuera de las sugerencias; al renombrar, actualiza el nombre.
5. **Sistema:** Guarda los cambios y registra quién los hizo y cuándo.

Criterios de aceptación · cursos alternos

- **1a** Si el administrador solicita corregir el tipo de falla desde el detalle de una novedad cerrada (CU-18), el sistema muestra los tipos activos; el administrador elige uno y el sistema lo asigna a la novedad y anota la corrección en su historial, con el tipo anterior y el nuevo, sin cambiar su estado. El caso de uso termina.
- **3a** Si el nombre nuevo ya existe, el sistema propone fusionar los dos tipos. Continúa en el paso 3.
- **4a** Si el tipo origen y el destino de la fusión son el mismo, el sistema no permite la fusión. Continúa en el paso 3.

Pantallas de Figma (SDD, Tabla 36: 18, 22, 31)

- [18 · Registrar solución y tipo de falla](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=3-1619)
- [18-B · Fecha posterior a hoy](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=3-1685)
- [18-C · Novedad aprobada por el director](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=3-1754)
- [22 · Detalle completo con línea de tiempo](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=4-2093)
- [22-B · Sin permiso sobre la novedad](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=4-2322)
- [31 · Tipos de falla](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=6-2438)
- [31-B · Renombrar a un nombre que ya existe](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=6-2734)
- [31-C · Origen y destino iguales](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=6-3019)

### HU-31 · RF-31 · Enviar notificaciones push

- **Épica:** E7 Notificaciones · **Prioridad:** Baja · **Urgencia:** Puede esperar · **Línea de corte:** 1.º
- **RF-31:** El sistema debe enviar como notificación push las notificaciones de RF-30 a los usuarios que lo autoricen. Se ejecuta dentro de RF-30.
- **CU-31** · Actores: Servicio de notificaciones push (secundario); Usuario (destinatario).
- **Precondición:** El destinatario autorizó las notificaciones push.
- **Postcondición:** El destinatario se entera del cambio aunque no tenga la aplicación abierta.
- **Puntos:** por estimar

Criterios de aceptación · curso normal

1. **Sistema:** Toma la notificación creada en CU-30.
2. **Sistema:** Envía la notificación al servicio de notificaciones push.
3. **Servicio de notificaciones push:** Entrega la notificación en el dispositivo del destinatario.
4. **Usuario:** Abre la notificación.
5. **Sistema:** Abre la aplicación en la novedad correspondiente.

Criterios de aceptación · cursos alternos

- **2a** Si el envío falla, el sistema conserva la notificación dentro de la aplicación. El caso de uso termina.

Pantallas de Figma (SDD, Tabla 36: 10, 10-B, 10-C)

- [10 · Avisos](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=2-1612)
- [10-B · Hoja: activar notificaciones push](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=2-1703)
- [10-C · Notificación push en el teléfono](https://www.figma.com/design/mxiQ5ZATu4oLYhA5u5Nd54/?node-id=2-1807)
