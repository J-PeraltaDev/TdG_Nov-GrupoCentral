# Decisiones pendientes

Dudas de diseño o de negocio que los documentos no resuelven. Ninguna bloquea: en cada una se
tomó la opción más conservadora y se dejó anotada para que Mateo y Juan la confirmen o la cambien.

| N.º | Tema                                       | Qué se hizo mientras tanto                                           | La decide         |
| --- | ------------------------------------------ | -------------------------------------------------------------------- | ----------------- |
| 1   | Lista oficial de fincas y razones sociales | **Recibida y confirmada** (7 oct). Fuera del repo; falta cómo cargar | El equipo         |
| 2   | Base de datos de las vistas previas        | **Resuelta:** «staging» creado y variables de Pages comprobadas      | El equipo         |
| 3   | Dominio de los correos de la plataforma    | `@novedades.test` para los usuarios de prueba                        | El equipo         |
| 4   | Valores de los parámetros configurables    | Los que propone el plan, en `parametros.js`                          | La empresa        |
| 5   | Íconos de la app y conjunto de íconos      | Marcadores para la app; Material Symbols para la interfaz            | El equipo         |
| 6   | Contraste del estado «escalada»            | Se dejó el color de Figma; prueba marcada como falla conocida        | El equipo (Figma) |
| 7   | Service worker propio o con Workbox        | Propio, sin dependencias nuevas                                      | El equipo         |
| 8   | Versión de Node y de jsdom                 | jsdom 29, compatible con Node 24.14                                  | El equipo         |
| 9   | Estados de interacción que Figma no dibuja | Solo el `hover` del botón primario                                   | El equipo (Figma) |
| 10  | Textos que no están en Figma               | Redactados con tuteo; listados abajo                                 | El equipo         |
| 11  | Peso de la ruta de ingreso                 | Medido: 185,7 KB de 200 KB                                           | El equipo         |
| 12  | Borde del botón secundario                 | Se dejó el color de Figma                                            | El equipo (Figma) |
| 13  | Detalles de las pantallas 04, 05 y 06      | Resueltos con el criterio más cercano a Figma; listados abajo        | El equipo (Figma) |
| 14  | Pantallas 05 y 06 en el escritorio         | Dentro del marco del escritorio, en una columna centrada             | El equipo (Figma) |
| 15  | WebKit no abre en los equipos              | Las pruebas locales corren en Chromium; WebKit está sin verificar    | El equipo         |
| 16  | Avisos del asesor de Supabase              | Tres tipos de aviso conocidos; el de las funciones sale una por RPC  | El equipo         |
| 17  | Pruebas que necesitan ingresar             | Corridas una vez contra «staging»; falta repetirlas tras un arreglo  | El equipo         |
| 18  | Primer administrador de producción         | **Decidido:** una sola cuenta, compartida. Falta crearla             | El equipo         |
| 19  | Detalles de la bandeja del área (11 y 12)  | Resueltos con el criterio más cercano a Figma; listados abajo        | El equipo (Figma) |
| 20  | Detalles del detalle (13, 14, 22 y 22-B)   | Resueltos con el criterio más cercano a Figma; listados abajo        | El equipo (Figma) |
| 21  | Acciones del aprobador (13-B y 14-C)       | Resueltas con el criterio más cercano a Figma; listadas abajo        | El equipo (Figma) |
| 22  | Hojas de las acciones (15, 16 y 17)        | Resueltas con el criterio más cercano a Figma; listadas abajo        | El equipo (Figma) |

## 1 · Lista oficial de fincas y razones sociales

**Recibida el 7 oct 2026:** 7 razones sociales y 12 fincas, con NIT, código IBM y municipio. Quedó
en `docs/fuentes/fincas.csv`, que no se sube al repositorio. El seed sigue usando marcadores
(«Razón social de prueba A», «Finca de prueba 01»…), nunca nombres reales.

**Nombres confirmados el 7 oct 2026.** La lista escrita y la tabla no coincidían en cuatro nombres
(dos razones sociales y dos fincas). El equipo los aclaró y `docs/fuentes/fincas.csv` ya tiene los
definitivos.

**Falta decidir cómo se cargan en producción.** Dos caminos:

1. **Desde la pantalla 30 (Fincas), con el administrador, en el Sprint 3.** Los nombres no pasan
   por el repositorio, que es público. Es la opción recomendada: son 19 registros, y de paso se
   prueba la pantalla con datos reales.
2. **Una migración de datos** (`rf04_carga_fincas`, con `insert … on conflict do nothing`),
   revisada en un PR y aplicada al cierre del sprint. Más rápida, pero deja los nombres de las
   empresas y de las fincas en el historial público de GitHub.

**El modelo no guarda NIT, código IBM ni municipio.** Las tablas `razon_social` y `finca` del SDD
(Tabla 26) solo tienen nombre y estado. Si esos datos deben verse en la aplicación o en los
reportes, es un cambio al SDD que conviene decidir antes del Sprint 3.

## 2 · Base de datos de las vistas previas

**Resuelta el 7 oct 2026.** El equipo decidió no instalar Docker y aprobó el proyecto «staging»
(`qxjnnanjidytbyihanet`). Es la base de desarrollo, de las pruebas y de las vistas previas; el
detalle está en `docs/adr/0011`. «PROYECTO» queda solo para producción.

El equipo puso las variables en Cloudflare Pages ese mismo día. **Producción está comprobada:**
publica con la URL y la clave de «PROYECTO». **Las vistas previas también:** publican con las de
«staging», y esa clave la acepta «staging» y la rechaza «PROYECTO». Solo falta que alguien ingrese
en una vista previa con un usuario de prueba.

## 3 · Dominio de los correos de la plataforma

Los correos no son buzones reales. Los usuarios de prueba del seed usan `@novedades.test`
(`.test` es un dominio reservado que nunca existe en internet). Falta decidir el dominio de las
cuentas reales.

## 4 · Parámetros configurables

Valores del plan, en `src/core/config/parametros.js` (ver `docs/adr/0006`): descripción de máximo
500 caracteres; código de recuperación válido 30 minutos; fotos con lado mayor de 1600 px, JPEG al
70 %, máximo 1 MB y hasta 3 por novedad. Faltan confirmarlos con la empresa.

## 5 · Íconos de la app y conjunto de íconos de la interfaz

- **Ícono de la aplicación:** Figma no tiene uno. `public/favicon.svg` y `public/iconos/*.png`
  son marcadores (una «N» blanca sobre el verde primario). Hay que reemplazarlos por el ícono
  definitivo en 192, 512, 512 _maskable_ y 180 px.
- **Íconos de la interfaz:** en Figma son texto con la fuente Material Symbols Rounded, no
  vectores, y el conector no los exporta como SVG limpios. Se usaron los SVG oficiales del mismo
  conjunto (Google, Apache 2.0), sin modificar. Detalle en `docs/adr/0009` y en
  `src/core/ui/iconos/LEEME.md`. Falta confirmar que esa es la fuente que quieren.

## 6 · Contraste del estado «escalada»

El texto `#a16207` sobre el fondo `#fef3c7` da **4,42:1**; WCAG 1.4.3 pide 4,5:1 para texto de
12 px. Es el único de los nueve estados que no pasa, y por poco.

No se cambió, porque el color se corrige primero en Figma. La prueba
`src/styles/tokens.test.js` lo tiene como falla conocida (`it.fails`) y avisará cuando se ajuste.

**Propuesta:** `estado/escalada/texto` = `#955a06` (5,04:1), que conserva el tono, o `#854d0e`
(6,15:1). Se cambia en Figma y en `tokens.css`.

## 7 · Service worker propio o con Workbox

`src/sw.js` hace el precaché con la API Cache Storage, sin importar `workbox-precaching` ni
`workbox-routing`, porque no están en la lista de dependencias aprobadas (ver `docs/adr/0008`).
Funciona y está verificado, pero son unas 70 líneas propias en lugar de una librería probada.

**Si prefieren Workbox:** aprobar esas dos dependencias; el cambio es de pocas líneas.

## 8 · Versión de Node y de jsdom

El equipo donde se armó el entorno tiene Node 24.14.0. jsdom 30 exige Node 24.15 o superior, así
que se instaló jsdom 29.1, que sí es compatible. No afecta nada más: jsdom solo se usa en las
pruebas. Al actualizar Node a la versión 24 vigente se puede subir a jsdom 30.

## 9 · Estados de interacción que Figma no dibuja

Figma define `primario-hover`, pero no el `hover` de los demás botones ni el estado presionado.
Solo se implementó el del botón primario. El foco con teclado es un contorno de 2 px en el color
primario, que tampoco está dibujado pero lo exige la accesibilidad (WCAG 2.4.7).

## 10 · Textos que no están en Figma

Redactados en español de Colombia, con tuteo, para que los revisen:

- **Aviso de nueva versión:** «Hay una versión nueva de la aplicación. Actualiza para usarla.»,
  con los botones «Actualizar» y «Ahora no».
- **Página no encontrada:** «No encontramos esta página» · «Revisa la dirección o vuelve al
  inicio.» · «Ir al inicio».
- **Manifiesto:** nombre «Novedades Grupo Central», nombre corto «Novedades».
- **Pantallas que llegan en otro sprint:** «Esta pantalla llega en el Sprint N.»
- **Cuenta** (Figma no la dibuja para el Sprint 1): «Cerrar sesión»; con pendientes, «Tienes
  novedades sin enviar» y la explicación de que se conservan en el dispositivo (CU-01 5a).
- **Registro, si la red falla al enviar** (Figma dibuja el caso sin conexión para el Sprint 4, no
  este): «La novedad no se envió» · «No hay conexión. Revisa tu internet e intenta de nuevo. Lo
  que escribiste sigue aquí.»
- **Registro, descripción muy larga:** «Usa máximo 500 caracteres» (el campo ya no deja pasar de
  500; es la red de seguridad).
- **Registro, un solo faltante:** «Falta 1 dato obligatorio» (Figma solo muestra el plural).
- **Registro, si las áreas no cargan:** «No pudimos cargar las áreas. Revisa tu conexión.» ·
  «Reintentar».
- **Registro, botón de cerrar:** nombre accesible «Cerrar sin registrar»; mientras envía, el
  botón dice «Enviando…».
- **Constancia:** al copiar, los lectores de pantalla oyen «Código NOV-0001 copiado».
- **Lista:** «Cargando…» · «Ver más» · «No hay novedades en esta lista.» (para Por confirmar,
  Cerradas y Rechazadas; Figma solo dibuja el vacío de Abiertas) · «N novedades resueltas
  esperan tu confirmación» (Figma solo muestra el singular).
- **Bandeja del área (Sprint 2):** «No hay novedades en esta lista.» cuando la pestaña está
  vacía pero hay novedades en otra (Figma solo dibuja la bandeja sin nada pendiente); «menos de
  1 min» como duración mínima; «Cargando…», «Ver más» y «Reintentar», como en Mis novedades. Para
  los lectores de pantalla: «Novedades de la bandeja» (pestañas), «Filtrar por finca», «Novedades:
  Por atender» (título de la tabla) y «Vista previa de NOV-0147».
- **Detalle de la novedad (Sprint 2):** el enlace de regreso según la pantalla de origen
  («Volver a la bandeja», «Volver a mis novedades», «Volver a las escaladas», «Volver al panel»;
  Figma solo escribe «Volver al historial»); en 22-B, «Solo puedes consultar las novedades de tu
  área.» para el aprobador y «Esta novedad no existe o ya no está disponible.» con «Volver al
  inicio» para el director y el administrador (Figma solo dibuja el del reportante); en la línea de
  tiempo, «Área: de Sistemas a Mantenimiento» para una reasignación, y «pasa a» entre los dos
  estados para los lectores de pantalla; «Registró» en la solución, como la pantalla 09.
- **Acciones del aprobador (Sprint 2):** mientras la acción se ejecuta, el botón dice «Tomando…»;
  el aviso de 14-C nombra el estado en que quedó la novedad («La novedad sigue Asignada.»; Figma
  lo escribe para una en atención).
- **Rechazar novedad (Sprint 2):** el aviso «Novedad rechazada. La finca verá el motivo.»; el botón
  dice «Rechazando…» mientras se ejecuta; para los lectores de pantalla, «Motivos frecuentes»
  (grupo de accesos rápidos) y «Caracteres:» antes del contador.
- **Mensajes de error de la Tabla 22:** el SDD da la idea de cada uno; la redacción exacta está en
  `src/core/errores/traducir.js`.

## 11 · Peso de la ruta de ingreso (RNF-05)

Presupuesto: 200 KB comprimidos. Medido el 7 oct 2026 con el build de producción, al cierre del
Sprint 1:

| Parte                                                 | Comprimido     |
| ----------------------------------------------------- | -------------- |
| JavaScript inicial (React, router, Supabase, ingreso) | 148,6 KB       |
| CSS                                                   | 6,2 KB         |
| Fuente Public Sans                                    | 26,8 KB        |
| Registro del service worker                           | 2,2 KB         |
| **Total**                                             | **≈ 183,8 KB** |

Quedan unos 16 KB. Todo lo que tiene sesión se carga bajo demanda y no cuenta aquí: el marco
(5,8 KB), Mis novedades (3,1 KB), Registrar (5,1 KB) y la constancia (1,7 KB).

**Sprint 2, medido el 8 oct 2026 con «Tomar novedad» (RF-10):** ≈ 185,6 KB (JavaScript 149,0 KB,
CSS 7,6 KB, fuente 26,8 KB y registro del service worker 2,2 KB). Quedan unos 14 KB. Lo nuevo se
carga bajo demanda: la bandeja (5,4 KB), el detalle (4,9 KB) y las acciones del aprobador
(0,8 KB), que solo descarga ese rol. Lo que sube es el CSS, 1,4 KB desde el Sprint 1.

Con «Rechazar novedad» (RF-11): ≈ 185,7 KB. La hoja y su campo van en el paquete de las acciones
del aprobador, que pasa a 2,8 KB.

**Riesgo:** el CSS es un solo archivo y crece con cada pantalla (4,2 KB en el Sprint 0; 6,2 KB
ahora), y los componentes compartidos que usa el ingreso también suman. Hay que seguir midiéndolo
en cada PR; si el margen se agota, habrá que decidir qué sale de la carga inicial.

## 12 · Borde del botón secundario

El borde `#d6dbd3` sobre blanco da 1,41:1. WCAG 1.4.11 pide 3:1 para los límites de un control
cuando son lo único que lo identifica; aquí el botón se reconoce por su texto, así que no es un
incumplimiento claro. Se anota por si quieren oscurecerlo en Figma. Lo mismo pasa con el borde
punteado de «Pendiente de sincronizar» (`#94a3b8`, 2,56:1).

## 13 · Detalles de las pantallas 04, 05 y 06

Puntos en los que Figma no alcanza a decidir, o en los que se contradice:

- **Semana en la constancia.** El formato general es «24 sep 2026, 7:40 a. m. · Sem 39»
  (SDD 6.1.11), pero la pantalla 06 lo escribe «24 sep 2026, 7:40 a. m. (Sem 39)». Se respetó
  cada pantalla. Conviene unificarlo en Figma.
- **Tarjeta de prioridad elegida.** Figma solo dibuja «Crítico» elegida (fondo rojo suave, borde
  de 2 px del color de la prioridad). Para las otras tres se siguió la misma regla con los colores
  suaves que existen: Alto con advertencia suave, Normal con información suave y Bajo con gris.
- **Alto de las tarjetas de prioridad.** En Figma cada tarjeta mide lo que ocupa su texto
  (86 y 102 px en la misma fila). En la aplicación las dos de una fila miden lo mismo.
- **«Ver novedad» en la constancia.** **Resuelto en el Sprint 2:** abre el detalle de la novedad
  (`/novedades/:id`), igual que las tarjetas de Mis novedades y las de la bandeja.
- **«Revisar» en el aviso de novedades por confirmar.** Cambia al filtro «Por confirmar». La
  confirmación como tal (CU-15) es del Sprint 2.
- **Cerrar el formulario con datos escritos.** La «X» sale sin preguntar y lo escrito se pierde.
  Figma no dibuja una confirmación. Si la quieren, hay que diseñarla.
- **Corregir un campo señalado.** Figma muestra el estado 05-C fijo. En la aplicación la señal de
  un campo se quita apenas se corrige, y el resumen pasa de «Faltan 3…» a «Faltan 2…».
- **Insignia de la campana.** Figma muestra un «2» sobre la campana; los avisos son del Sprint 5,
  así que todavía no se pinta.

## 14 · Pantallas 05 y 06 en el escritorio

Figma dibuja el registro y la constancia solo para el teléfono, que es donde trabaja el
reportante. En el escritorio se muestran dentro del marco (barra lateral y barra superior), en una
columna centrada de 576 px, y el botón «Enviar novedad» cierra el formulario en lugar de quedar
fijo abajo. Si quieren otro tratamiento, hay que dibujarlo.

## 15 · WebKit no abre en los equipos de desarrollo

Los navegadores de Playwright quedaron instalados (la descarga falló primero por un problema de
IPv6 de la red; la solución está en el README). Chromium funciona. WebKit se instala, pero el
Control de aplicaciones de Windows bloquea sus bibliotecas («Una directiva de Control de
aplicaciones bloqueó este archivo»). No se intentó saltar ese control.

Las pruebas locales corren con `npm run test:e2e:chromium`. **El CI no corre las pruebas de
extremo a extremo:** tiene dos trabajos (lint, formato, unitarias y build; migraciones y pgTAP) y
ninguno usa Playwright. Una versión anterior de este documento decía lo contrario.

**Riesgo:** RNF-04 pide Safari y hoy no hay ninguna verificación en WebKit.

**Propuesta:** agregar al CI un trabajo que levante Supabase local, genere una contraseña al azar
para los usuarios de prueba y corra Playwright en Chromium y WebKit.

## 16 · Avisos del asesor de Supabase

El asesor sobre «staging» deja tres tipos de aviso (nivel _WARN_), los mismos desde el Sprint 1:

| Aviso                                                | Por qué queda                                                                                                                                          |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `authenticated_security_definer_function_executable` | Es `registrar_novedad`. El diseño lo pide: el cliente no escribe en las tablas y la función verifica por sí misma identidad, rol y alcance (SDD 5.3.2) |
| `auth_leaked_password_protection`                    | La comprobación de contraseñas filtradas es del plan de pago                                                                                           |
| `auth_insufficient_mfa_options`                      | El SRS no pide segundo factor                                                                                                                          |

El primero aparece una vez por cada función RPC. Los otros dos son del proyecto, no del código, y
salen también en «PROYECTO».

**Al 8 oct 2026 (contratos del Sprint 2):** nueve avisos en «staging». Siete son el primero, uno
por función: `registrar_novedad` y las seis del Sprint 2 (`tomar_novedad`, `rechazar_novedad`,
`reasignar_novedad`, `escalar_novedad`, `registrar_solucion` y `sugerir_tipos_falla`). Ninguno es
de un tipo nuevo ni de nivel de error.

## 17 · Pruebas que necesitan ingresar

Las pruebas de extremo a extremo de CU-01 (ingreso por rol, 01-B, 01-C y cierre de sesión), CU-05,
CU-06 y CU-07 ingresan con los usuarios de prueba, cuya contraseña define cada persona (README,
«Usuarios de prueba»). El agente no la maneja, así que las corre el equipo.

**Ya se corrieron una vez** (7 oct 2026, Chromium, contra «staging»): el ingreso real funciona, y
con él el registro, la constancia, el reintento sin duplicar y el enrutamiento. Fallaron 5 de 40,
todas de CU-01 y por la prueba, no por la aplicación; el detalle está en `docs/sprints/S1.md`.

**Falta repetirlas** después de ese arreglo; deben pasar las 40:

```bash
npm run test:e2e:chromium
```

Las capturas de error de Playwright (`test-results/`) guardan lo que había escrito en los campos,
incluida la contraseña de prueba. La carpeta no se sube al repositorio; tampoco hay que
compartirla.

## 18 · Primer administrador de producción

«PROYECTO» tiene el esquema desde el 7 oct 2026, pero ningún usuario, así que en producción nadie
puede ingresar. Crear usuarios es la historia RF-03 (Sprint 3), y esa pantalla la usa un
administrador que ya debe existir: el primero hay que crearlo de otra forma.

**Decidido el 7 oct 2026:** una sola cuenta de administrador en producción, que usan Mateo y Juan.
Como la comparten, el historial no distingue cuál de los dos hizo cada cosa; sirve para arrancar,
y con la gestión de usuarios del Sprint 3 cada uno puede tener la suya.

**Falta crearla.** Son dos pasos, en el panel de Supabase de «PROYECTO»:

1. **Authentication → Users → Add user → Create new user:** el correo de la cuenta y una
   contraseña que solo conozcan los dos, con **Auto Confirm User** marcado (sin eso el ingreso
   responde que el correo no está confirmado). Este paso lo hace una persona: la contraseña no
   pasa por el repositorio ni por un agente.
2. **SQL Editor:** el perfil de la aplicación, que es lo que la vuelve administrador. Se cambian
   los dos textos en mayúsculas:

   ```sql
   insert into public.usuario (id, nombre, correo, rol_id)
   select id, 'NOMBRE QUE SE VERÁ EN LA APLICACIÓN', email, 4
     from auth.users
    where email = 'CORREO_DE_LA_CUENTA';
   ```

   Debe responder que insertó una fila. Si inserta cero, el correo no coincide con el del paso 1.

Después, en <https://tdg-nov-grupocentral.pages.dev/>, la cuenta debe entrar y ver el menú del
administrador. Queda anotarlo en el reporte del sprint, porque es un cambio hecho a mano en
producción. El correo de la cuenta depende del punto 3.

## 19 · Detalles de la bandeja del área (11 y 12)

Lo que Figma no alcanza a decidir en las pantallas 11, 11-C y 12, y cómo quedó (plan del Sprint 2,
decisiones 1, 4, 5, 14 y 15):

- **Lo que llega en otro sprint no se pinta todavía:** el ícono de cámara de las tarjetas y de la
  tabla (evidencias, Sprint 4), la insignia con la cantidad en «Bandeja» y en la campana (Sprint 5)
  y el buscador por código (Sprint 5).
- **Fila y vista previa en el escritorio.** Tocar una fila la muestra en la vista previa; el
  detalle se abre con «Ver detalle completo». La primera fila queda elegida al cargar. La acción
  principal del panel («Tomar para atención», «Registrar solución») llega con su historia.
- **Notas del estado.** «Aprobada por el director» sale del estado; «Reasignada desde {área}», de la
  última asignación de la novedad en su historial, que el escritorio consulta para las novedades de
  la página. El teléfono no pide el historial.
- **Anchos entre 1024 y 1439 px.** Figma dibuja la bandeja a 1440 px. Entre 1024 y 1279 px la vista
  previa va debajo de la tabla; entre 1280 y 1439 px el panel mide 300 px (340 en Figma) y la
  primera y la última columna se angostan, para que la descripción siga siendo legible.
- **A 360 px.** Figma dibuja el teléfono a 390 px. Por debajo de ese ancho, el título de la barra
  superior baja de 18 a 16 px («Bandeja · Mantenimiento» no cabe junto a la conexión y la campana)
  y las tarjetas de los contadores usan menos espacio interior.
- **Bandeja vacía (11-C).** «No hay novedades pendientes en {área}» solo sale cuando las tres
  pestañas están en cero. Si la vacía es solo la pestaña abierta, o hay un filtro de finca, dice
  «No hay novedades en esta lista.».
- **Filtro por finca.** Solo en el escritorio, como en Figma. Ofrece las fincas activas del
  catálogo, no solo las que tienen novedades en la bandeja. La pestaña y la finca quedan en la
  dirección, igual que el filtro de Mis novedades.
- **Fila bajo el cursor.** Se sombrea con `gris-100`; Figma no dibuja ese estado (punto 9).
- **Duraciones.** Las dos unidades mayores, sin redondear hacia arriba: «35 min», «5 h 20 min»,
  «1 d 3 h».

## 20 · Detalles del detalle de la novedad (13, 14, 22 y 22-B)

Lo que Figma no alcanza a decidir, o en lo que sus pantallas no coinciden entre sí, y cómo quedó
(plan del Sprint 2, decisiones 1, 3, 10, 12, 13, 17 y 19):

- **Lo que llega en otro sprint no se pinta todavía:** el bloque «Evidencias» (Sprint 4), la
  etiqueta «Registrada sin conexión» (Sprint 4), «Corregir tipo» (Sprint 5) y el menú «⋮» del
  encabezado, cuyo contenido Figma no dibuja.
- **Usuario en la línea de tiempo.** «Nombre · Rol · Área» en el teléfono y en el escritorio, como
  la pantalla 22 y como pide SDD 5.2.5. Las pantallas 13, 14 y 09 escriben «Nombre · Área» para el
  aprobador.
- **«Sincronizada» y la semana.** El teléfono muestra siempre «Sincronizada» (13 la dibuja y 14
  no) y escribe la fecha de registro con su semana, «(Sem 39)», como 09 y 22 (13 y 14 no la traen).
- **Orden de las etiquetas.** Estado, prioridad, área y finca, como 09 y 22; en 13 y 14 la finca va
  antes que el área. La etiqueta antepone «Finca» al nombre, como Figma («Finca Juanca»), salvo que
  el nombre ya empiece así.
- **«Tomada por».** Sale de la última vez que la novedad pasó de asignada a en atención, para que
  en el Sprint 3 «la falla persiste» no muestre al reportante. Lleva solo la hora si fue hoy; si
  no, también la fecha («22 sep, 10:20 a. m.»). Se muestra mientras la novedad está en atención.
- **«Registrada hace…» en el escritorio.** Figma solo dibuja en el escritorio una novedad cerrada.
  Para las que están en manos del área, la línea «Registrada hace 3 h · Tomada por…» va bajo la
  razón social.
- **Novedad resuelta en el teléfono.** Para todos los roles se usa el bloque de la pantalla 09:
  «Solución registrada por {área}», con el tipo de falla, la fecha de ejecución y quién la registró.
- **22-B sin el código.** Figma pone el código en el encabezado, pero cuando la consulta no
  devuelve filas la aplicación no lo conoce (la dirección lleva el identificador): el encabezado
  dice «Novedad». La pantalla no distingue una novedad fuera del alcance de una que no existe,
  porque la base de datos responde igual en los dos casos.
- **Barras del teléfono.** El detalle trae su propia barra superior, con «volver», y conserva la
  navegación inferior, como 22-B. Cuando haya acciones (PR 4), su barra la reemplaza, como en 13
  y 14.
- **Menú en el detalle.** Queda marcada la pantalla desde la que se abrió (Bandeja, Novedades…);
  si se llegó por la dirección, la de inicio del rol.
- **Anchos entre 1024 y 1279 px.** La línea de tiempo va debajo de los datos; desde 1280 px, a la
  derecha, con los 400 px de Figma.

## 21 · Acciones del aprobador en el detalle (13, 13-B, 14 y 14-C)

Lo que Figma no dibuja o deja abierto de las acciones, resuelto con las decisiones 4 y 9 del plan
del Sprint 2:

- **En el escritorio.** Figma solo dibuja las acciones en el teléfono. En el escritorio los botones
  van bajo el encabezado del detalle, y el aviso temporal, abajo a la derecha. En la vista previa
  de la bandeja (12) va la acción principal de la novedad («Tomar para atención» en una asignada);
  las demás se ejecutan desde el detalle.
- **Barra de acciones del teléfono.** Reemplaza a la navegación inferior, como en 13 y 14. Si la
  novedad queda sin acciones, vuelve la navegación y el aviso se muestra encima de ella. Hasta que
  lleguen rechazar, escalar, reasignar y registrar la solución (RF-11, 12, 17 y 14), una novedad en
  atención no tiene barra.
- **Después de tomarla.** La persona se queda en el detalle, que se actualiza sin pasar por
  «Cargando…»: cambian el estado, la línea de tiempo y «Tomada por». El foco del teclado pasa al
  contenido de la página, porque el botón que lo tenía desaparece.
- **Cuánto dura el aviso.** El de confirmación (13-B) se quita solo a los 6 segundos. El de error
  (14-C) se queda hasta que la persona actúe, porque trae «Reintentar». Figma no fija la duración.
- **Sin conexión (14-C).** Si la acción no llega al servidor, no se encola ni se reintenta sola: el
  aviso dice que no se aplicó y en qué estado sigue la novedad, y ofrece «Reintentar» (RF-25).
- **Si otra persona ya actuó.** Con `TRANSICION_INVALIDA` se muestra «La novedad cambió de estado.»
  y el detalle se recarga solo (Tabla 22).
- **Mientras se ejecuta.** El botón queda deshabilitado y dice «Tomando…», para que no se envíe dos
  veces.

## 22 · Hojas de las acciones (15, 16 y 17)

Lo que Figma no dibuja o deja abierto de las hojas que piden un texto antes de confirmar:

- **En el escritorio** (decisión 4 del plan): la hoja es un diálogo centrado de 448 px con el mismo
  contenido; «Cancelar» y el botón que confirma van en una fila, a la derecha.
- **Qué pasa al confirmar.** La hoja se cierra siempre y el resultado se muestra en el detalle, con
  el aviso temporal: un aviso fuera de un diálogo modal no se ve ni lo anuncia el lector de
  pantalla. Si se pierde la conexión, «Reintentar» envía el mismo texto sin volver a abrir la hoja.
  La única excepción es `DATO_OBLIGATORIO`, que se corrige en la misma hoja.
- **Después de rechazar** (decisión 9): la persona se queda en el detalle, ya rechazado y sin
  acciones, con el motivo en la línea de tiempo.
- **Motivos frecuentes de la hoja 16.** Son accesos rápidos, no un catálogo. Al tocar uno se
  escribe al comienzo del motivo y se conserva lo que la persona ya había escrito («Duplicada: ya
  está en atención como NOV-0149.», como el ejemplo de Figma); tocar otro lo reemplaza y tocar el
  mismo lo quita. El que queda marcado es el que encabeza el texto. El foco no se mueve al campo.
- **Tamaño de los motivos frecuentes.** La pastilla mide 32 px, como en Figma, dentro de un botón
  de 48 px en el teléfono (área táctil); por eso las filas quedan a 16 px y no a 8. A 360 px el
  tercero no cabe en una línea y pasa a dos.
- **«Rechazar novedad» deshabilitado.** Mientras el motivo esté vacío o tenga solo espacios (CU-11
  3a). El campo no deja pasar de 500 caracteres y muestra el contador.
- **Al abrir**, el foco queda en el primer control de la hoja; al cerrarla vuelve al botón que la
  abrió y, si ese botón ya no existe, al contenido de la página.
