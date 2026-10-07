# Decisiones pendientes

Dudas de diseño o de negocio que los documentos no resuelven. Ninguna bloquea: en cada una se
tomó la opción más conservadora y se dejó anotada para que Mateo y Juan la confirmen o la cambien.

| N.º | Tema                                       | Qué se hizo mientras tanto                                           | La decide                 |
| --- | ------------------------------------------ | -------------------------------------------------------------------- | ------------------------- |
| 1   | Lista oficial de fincas y razones sociales | **Recibida** (7 oct). Fuera del repo; faltan 4 nombres y cómo cargar | Wilmar Cuesta / el equipo |
| 2   | Base de datos de las vistas previas        | **Resuelta:** «staging» creado y variables de Pages comprobadas      | El equipo                 |
| 3   | Dominio de los correos de la plataforma    | `@novedades.test` para los usuarios de prueba                        | El equipo                 |
| 4   | Valores de los parámetros configurables    | Los que propone el plan, en `parametros.js`                          | La empresa                |
| 5   | Íconos de la app y conjunto de íconos      | Marcadores para la app; Material Symbols para la interfaz            | El equipo                 |
| 6   | Contraste del estado «escalada»            | Se dejó el color de Figma; prueba marcada como falla conocida        | El equipo (Figma)         |
| 7   | Service worker propio o con Workbox        | Propio, sin dependencias nuevas                                      | El equipo                 |
| 8   | Versión de Node y de jsdom                 | jsdom 29, compatible con Node 24.14                                  | El equipo                 |
| 9   | Estados de interacción que Figma no dibuja | Solo el `hover` del botón primario                                   | El equipo (Figma)         |
| 10  | Textos que no están en Figma               | Redactados con tuteo; listados abajo                                 | El equipo                 |
| 11  | Peso de la ruta de ingreso                 | Medido: 183,8 KB de 200 KB                                           | El equipo                 |
| 12  | Borde del botón secundario                 | Se dejó el color de Figma                                            | El equipo (Figma)         |
| 13  | Detalles de las pantallas 04, 05 y 06      | Resueltos con el criterio más cercano a Figma; listados abajo        | El equipo (Figma)         |
| 14  | Pantallas 05 y 06 en el escritorio         | Dentro del marco del escritorio, en una columna centrada             | El equipo (Figma)         |
| 15  | WebKit no abre en los equipos              | Las pruebas locales corren en Chromium; WebKit está sin verificar    | El equipo                 |
| 16  | Avisos del asesor de Supabase              | Tres avisos conocidos, ninguno nuevo; explicados abajo               | El equipo                 |
| 17  | Pruebas que necesitan ingresar             | Corridas una vez contra «staging»; falta repetirlas tras un arreglo  | El equipo                 |
| 18  | Primer administrador de producción         | Nada: «PROYECTO» tiene el esquema, pero ningún usuario               | El equipo                 |

## 1 · Lista oficial de fincas y razones sociales

**Recibida el 7 oct 2026:** 7 razones sociales y 12 fincas, con NIT, código IBM y municipio. Quedó
en `docs/fuentes/fincas.csv`, que no se sube al repositorio. El seed sigue usando marcadores
(«Razón social de prueba A», «Finca de prueba 01»…), nunca nombres reales.

**Falta confirmar cuatro nombres**, porque la lista escrita y la tabla no coinciden:

| En la lista del equipo      | En la tabla                   | Duda                                     |
| --------------------------- | ----------------------------- | ---------------------------------------- |
| Agropecuaria Truandó S.A.S. | Agropecuaria Gran Truandó SAS | ¿Cuál es el nombre registrado?           |
| Agropecuaria Juanca S.A.S.  | Agrícola Juanca SAS           | ¿Cuál es el nombre registrado?           |
| —                           | Finca «AGUAS VERDE2»          | ¿Es «Aguas Verdes 2»?                    |
| —                           | Finca «1LA CEJA»              | ¿Es «La Ceja»? El «1» parece un descuido |

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
- **«Ver novedad» en la constancia.** El detalle llega en el Sprint 2; por ahora lleva a Mis
  novedades. Por lo mismo, las tarjetas de la lista todavía no se pueden abrir.
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

El asesor sobre «staging» deja tres avisos (nivel _WARN_), los mismos desde el PR 1:

| Aviso                                                | Por qué queda                                                                                                                                          |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `authenticated_security_definer_function_executable` | Es `registrar_novedad`. El diseño lo pide: el cliente no escribe en las tablas y la función verifica por sí misma identidad, rol y alcance (SDD 5.3.2) |
| `auth_leaked_password_protection`                    | La comprobación de contraseñas filtradas es del plan de pago                                                                                           |
| `auth_insufficient_mfa_options`                      | El SRS no pide segundo factor                                                                                                                          |

El primero aparecerá una vez por cada función RPC que se agregue. Los otros dos son del proyecto,
no del código, y saldrán también en «PROYECTO».

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

**Propuesta:** crearlo una sola vez, a mano, cuando haga falta entrar a producción:

1. en el panel de Supabase de «PROYECTO», **Authentication → Users → Add user**, con el correo
   real del administrador y una contraseña que solo él conozca;
2. una fila en `public.usuario` con ese mismo `id`, su nombre, su correo y `rol_id = 4`, sin finca
   ni área.

El segundo paso escribe en producción, así que se hace con el OK del equipo y queda anotado en el
reporte del sprint. Falta decidir quién será ese administrador y con qué correo (punto 3).
