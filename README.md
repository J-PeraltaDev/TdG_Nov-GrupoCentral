# Novedades Grupo Central

Aplicación web progresiva (PWA) para registrar, enrutar, aprobar, seguir y cerrar las novedades
de infraestructura física y tecnológica de las fincas de Grupo Central (Agropecuaria Tumaradó
S.A.S.). Reemplaza los reportes por WhatsApp y los memorandos en hoja de cálculo por un flujo
único: el reportante registra la novedad desde su teléfono, el sistema le entrega un código
`NOV-####` y la envía al área responsable; el área la atiende o la escala al director de
agricultura, y la novedad solo se cierra cuando el reportante confirma que quedó resuelta. El
registro y la consulta funcionan sin conexión.

Trabajo de grado de Mateo Vanegas y Juan Manuel Peralta · Ingeniería Informática · Politécnico
Colombiano Jaime Isaza Cadavid.

**Estado:** Sprint 4 (el reportante registra y consulta sin conexión, las pendientes se envían
solas al volver la señal, las acciones que cambian el estado se bloquean sin red y las novedades
llevan fotos), ya en `main` junto con los Sprints 1 a 3. Producción («PROYECTO») tiene sus
migraciones desde el 14 oct 2026. El avance por sprint está en
[`docs/sprints/`](docs/sprints/).

## Tecnologías

React 19 y Vite 8 (JavaScript con JSX) · Tailwind CSS v4 · React Router · Supabase (PostgreSQL
con RLS, Auth, Storage y Edge Functions) · `vite-plugin-pwa` · Cloudflare Pages. Las decisiones y
sus razones están en [`docs/adr/`](docs/adr/).

## Requisitos

| Herramienta        | Versión                                              | Para qué                       |
| ------------------ | ---------------------------------------------------- | ------------------------------ |
| Node.js            | 22.22 o superior (recomendada: 24 LTS, ver `.nvmrc`) | App, pruebas y Supabase CLI    |
| npm                | El que trae Node                                     | Dependencias                   |
| Git                | Reciente                                             | Control de versiones           |
| Cuenta de Supabase | Miembro de la organización «Trabajo de Grado»        | Base de desarrollo («staging») |

**No hace falta Docker.** Supabase CLI no se instala aparte: viene como dependencia de desarrollo
y se usa con `npx supabase …` o con los scripts `staging:*`.

## Instalación

```bash
git clone https://github.com/J-PeraltaDev/TdG_Nov-GrupoCentral.git
cd TdG_Nov-GrupoCentral
npm ci
```

## Entorno de desarrollo

Hay dos proyectos de Supabase (las razones están en
[`docs/adr/0011`](docs/adr/0011-staging-en-lugar-de-supabase-local.md)):

| Proyecto   | Referencia             | Para qué                                              |
| ---------- | ---------------------- | ----------------------------------------------------- |
| «staging»  | `qxjnnanjidytbyihanet` | Desarrollo, pruebas y vistas previas. Datos de prueba |
| «PROYECTO» | `lyrdsmfalrchbdpmikmt` | **Producción.** No se desarrolla contra él            |

**1. Sesión del CLI** (una vez por equipo; sirve en cualquier carpeta):

```bash
npx supabase login
```

No hace falta `supabase link`: los scripts `staging:*` ya llevan la referencia de «staging».

**2. Variables.** Copia `.env.example` como `.env.local` y complétalo:

```bash
VITE_SUPABASE_URL=https://qxjnnanjidytbyihanet.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_…   # panel de «staging» → Project Settings → API Keys
CLAVE_USUARIOS_DE_PRUEBA=…                        # la inventas tú; mínimo 8 caracteres
```

En el cliente solo va la clave publicable. La clave secreta nunca va en `.env.local` ni en el
repositorio, que es público. `.env.local` no se sube.

**3. Usuarios de prueba.** El seed los crea con una contraseña aleatoria que nadie conoce. Para
poder ingresar, ponles la tuya:

```bash
npm run staging:usuarios
```

| Correo                                   | Rol                     | Alcance            |
| ---------------------------------------- | ----------------------- | ------------------ |
| `reportante.01@novedades.test`           | Reportante              | Finca de prueba 01 |
| `reportante.03@novedades.test`           | Reportante              | Finca de prueba 03 |
| `aprobador.mantenimiento@novedades.test` | Aprobador de área       | Mantenimiento      |
| `aprobador.sistemas@novedades.test`      | Aprobador de área       | Sistemas           |
| `director@novedades.test`                | Director de agricultura | Todo               |
| `administrador@novedades.test`           | Administrador           | Todo               |
| `desactivado@novedades.test`             | Reportante desactivado  | No puede ingresar  |

Todos quedan con la misma contraseña. Como «staging» es compartido, el último que corra
`staging:usuarios` (o `staging:reset`) deja la suya: si no puedes ingresar, vuelve a correrlo.

**4. Aplicación:**

```bash
npm run dev            # http://localhost:5173
```

En desarrollo, `http://localhost:5173/_dev/componentes` muestra las 28 variantes de los
componentes base para compararlas con Figma.

**Después de cada migración:**

```bash
npm run staging:reset     # recrea «staging»: migraciones + supabase/seed.sql (borra sus datos)
npm run staging:usuarios  # vuelve a poner tu contraseña de prueba
npm run staging:test      # pruebas pgTAP
npm run staging:types     # regenera src/core/supabase/database.types.ts
npm run staging:advisors  # asesor de seguridad y rendimiento
npm run staging:functions # despliega las Edge Functions en «staging» (sin Docker)
```

`staging:reset` borra lo que haya en «staging», también lo del compañero: avisa antes. Para
aplicar solo lo nuevo sin borrar, `npm run staging:push`. Los datos de `supabase/seed.sql` son de
prueba y nunca llegan a producción.

## Scripts

| Script                                   | Qué hace                                                        |
| ---------------------------------------- | --------------------------------------------------------------- |
| `npm run dev`                            | Servidor de desarrollo (sin service worker)                     |
| `npm run build`                          | Build de producción en `dist/`, con service worker y manifiesto |
| `npm run preview`                        | Sirve `dist/` en `http://localhost:4173` para probar la PWA     |
| `npm run lint`                           | oxlint                                                          |
| `npm run format` · `format:check`        | Prettier: corrige o solo verifica                               |
| `npm run test` · `test:watch`            | Pruebas unitarias con Vitest y Testing Library                  |
| `npm run test:e2e` · `test:e2e:chromium` | Pruebas de extremo a extremo con Playwright                     |
| `npm run staging:reset` · `staging:push` | Reconstruye «staging» o le aplica las migraciones nuevas        |
| `npm run staging:test`                   | Pruebas de base de datos con pgTAP, contra «staging»            |
| `npm run staging:types`                  | Tipos de la base de datos para el autocompletado                |
| `npm run staging:advisors`               | Asesor de seguridad y rendimiento de Supabase                   |
| `npm run staging:usuarios`               | Pone tu contraseña a los usuarios de prueba                     |
| `npm run staging:functions`              | Despliega las Edge Functions en «staging», sin Docker           |
| `npm run staging:secretos`               | Pone en «staging» los secretos de las notificaciones push       |
| `npm run vapid:claves`                   | Genera las claves push en `.env.local`, sin imprimirlas         |
| `npm run db:*` · `test:db`               | Lo mismo con Supabase local; necesitan Docker (los usa el CI)   |

**Edge Functions.** Hay tres, en `supabase/functions/`: `gestionar-usuario` (crea, actualiza,
desactiva y reactiva cuentas; exige la sesión de un administrador), `restablecer-contrasena`
(valida el código temporal y fija la contraseña nueva; no exige sesión) y `enviar-push` (la llama
el webhook de cada aviso nuevo; la verifica un secreto, no una sesión). Son lo único que usa la
clave de servicio, que la plataforma les inyecta: no está en el repositorio ni en el cliente. Su
lógica va en módulos `.js` puros, que se prueban con `npm run test` como el resto; `index.ts` solo
arma las dependencias reales, y el CI lo revisa con `deno check`. Después de cambiar una:
`npm run staging:functions` (con un nombre despliega solo esa) y una prueba contra «staging». Las
razones están en [`docs/adr/0012`](docs/adr/0012-edge-functions-sin-docker.md).

**Pruebas de extremo a extremo.** Corren contra el build real y contra «staging». Las que
necesitan ingresar usan `CLAVE_USUARIOS_DE_PRUEBA` y se omiten si falta. Cada corrida deja
novedades de prueba en «staging», y algunas fotos de pocos KB en su bucket. Las que cambian una contraseña o desactivan algo lo hacen con
usuarios (`e2e-…@novedades.test`) y fincas («Finca e2e …») que crea la propia prueba, y los dejan
desactivados; a los del seed no les cambian nada. Todo eso se va con un `staging:reset`.

Auth limita los ingresos por minuto, así que cada usuario de prueba ingresa una sola vez al
comienzo de la corrida (`e2e/sesiones.setup.js`) y las pruebas reutilizan su sesión con
`ingresarComo`. Solo las de CU-01, que prueban el ingreso mismo, pasan por el formulario. Las
sesiones quedan en `test-results/sesiones/`, que Playwright limpia en cada corrida y que no se sube
al repositorio: son tokens de los usuarios de prueba, no hay que compartir esa carpeta.

Playwright necesita sus navegadores una sola vez: `npx playwright install chromium webkit`. Si la
descarga se queda colgada (pasa en redes con IPv6 defectuoso), define antes la variable de entorno
`NODE_OPTIONS` con el valor `--dns-result-order=ipv4first`. En equipos con Control de aplicaciones
de Windows, WebKit se instala pero no abre: usa `npm run test:e2e:chromium`. El CI las corre en
Chromium y WebKit (#30). En WebKit, las que navegan sin red quedan como `fixme`, porque Playwright
WebKit no abre la aplicación sin red; se verifican en un iPhone.

## Sin conexión

Después de la primera carga, la aplicación abre sin red. El service worker guarda la aplicación,
nunca los datos de Supabase. Los datos viven en IndexedDB (`src/core/offline/`), separados por
usuario:

- **La cola de pendientes.** Lo que se registra sin red queda en el dispositivo con su `id_local`
  y su fecha real. Se envía solo al volver la conexión, también con la aplicación abierta.
  `registrar_novedad` es idempotente por `id_local`: si un envío se repite, no hay duplicado.
- **Lo descargado.** Las listas y los detalles que se abrieron con red, para consultarlos sin ella.
  Se borra si cambian el usuario, su rol o su alcance.

El monitor de conexión (`src/core/conexion/`) decide si hay red. Usa lo que dice el navegador, los
fallos de red de cada solicitud y una verificación contra Auth cada 15 s. Sin red, las acciones que
cambian el estado se ven con un candado y su explicación.

Para probarlo hace falta el service worker, que `npm run dev` no tiene: usa
`npm run build && npm run preview`. En Chrome, la red se corta en DevTools (Network → Offline) y
los datos se ven en DevTools → Application → IndexedDB.

## Fotos (Supabase Storage)

- **Dónde quedan:** en el bucket privado `evidencias`, como `{novedad_id}/{uuid}.jpg`.
- **Antes de subir,** el navegador reduce cada foto: lado mayor de 1600 px, JPEG al 70 %.
- **Quién sube:** el reportante de la finca y, para la solución, el aprobador del área.
- **Qué acepta:** el bucket, solo JPEG de hasta 1 MB. Un disparador de `evidencia` revisa el
  estado de la novedad, que el archivo exista y el máximo de 3 fotos: 3 del reporte, y aparte 3
  por cada solución.
- **Cómo se ven:** con URLs firmadas de 5 minutos, que el service worker no guarda.
- **Sin conexión** no se suben.

`staging:reset` no borra los archivos del bucket. Antes de una demo, se vacía desde el panel de
Supabase (Storage).

## Notificaciones push

- **Cómo llegan:** cada aviso nuevo en `notificacion` dispara un POST, con `pg_net`, a la Edge
  Function `enviar-push`. Ella cifra el mensaje (RFC 8291) y lo firma (VAPID, RFC 8292) con Web
  Crypto, sin dependencias, y lo envía a cada suscripción del destinatario.
- **Qué dice:** el código y el estado en el título y el texto del aviso en el cuerpo. Nunca la
  descripción, que se vería en la pantalla bloqueada.
- **Claves y secretos:** `npm run vapid:claves` las agrega a `.env.local` (escribe a mano
  `VAPID_SUBJECT=mailto:…`) y `npm run staging:secretos` las pone en «staging»: los secretos de
  la función y, en Vault, la URL y el secreto que usa el webhook. Ninguno se imprime ni va al
  repositorio. Las de «staging» las genera una sola persona, una vez.
- **Sin los secretos de Vault** (el Supabase local, el CI) no se envía nada y los avisos se crean
  igual. `staging:reset` no borra Vault.
- **Para probarlas** hace falta Chrome o Edge con el build (`npm run build && npm run preview`):
  el Chromium de Playwright no trae el servicio push.

## Estructura

```
src/app/        rutas, guardianes por rol y layouts
src/core/       núcleo compartido: supabase, offline, sesión, acciones, errores, ui, utils
src/modules/    una carpeta por épica (e1-acceso-admin … e7-avisos)
src/styles/     tokens de Figma (tokens.css)
src/sw.js       service worker
supabase/       config.toml, migraciones, pruebas pgTAP, funciones y seed de prueba
scripts/        staging.mjs: la base de desarrollo sin Docker
e2e/            pruebas de extremo a extremo, un archivo por caso de uso
docs/           decisiones (adr), scrum, sprints, despliegue y pruebas
```

Las convenciones de nombres, ramas, commits y migraciones, y las reglas de seguridad de la base
de datos, están en [`CLAUDE.md`](CLAUDE.md).

## Forma de trabajo

1. Rama corta desde `main`: `feat/RF-05-registrar-novedad`.
2. Commits con Conventional Commits y el RF como alcance: `feat(RF-05): registrar novedad`.
3. Pull request hacia `main` con la plantilla del repo: el CI corre lint, pruebas y build, y
   Cloudflare Pages publica una vista previa. El compañero revisa.
4. Squash merge. Las migraciones van a producción al cierre del sprint, justo antes de fusionar el
   PR que las trae.

La Definition of Ready y la Definition of Done están en
[`docs/scrum/dor-dod.md`](docs/scrum/dor-dod.md); el backlog, en
[`docs/scrum/backlog.md`](docs/scrum/backlog.md).

## Despliegue

- **Aplicación:** Cloudflare Pages publica `main` en producción y una vista previa por cada pull
  request. Comando de build `npm run build`, salida `dist`. Pasos y variables en
  [`docs/despliegue/cloudflare-pages.md`](docs/despliegue/cloudflare-pages.md).
- **Base de datos:** las migraciones de cada PR se prueban en «staging». A «PROYECTO» llegan con
  `npx supabase db push --project-ref lyrdsmfalrchbdpmikmt`, primero con `--dry-run`. Se aplican
  al cierre del sprint, después de la review, con el visto bueno del equipo y **antes de fusionar
  el PR que las trae**, porque Pages publica `main` enseguida. Las aplica una persona.
  Configuración de Auth en
  [`docs/despliegue/supabase-auth.md`](docs/despliegue/supabase-auth.md).
- **Edge Functions:** a «PROYECTO» también llegan al cierre del sprint, después de las
  migraciones y con el visto bueno del equipo. Las despliega una persona; el comando está en la
  misma guía.

## Licencias de terceros

Public Sans (SIL Open Font License 1.1, `src/assets/fuentes/OFL.txt`) y Material Symbols (Apache
2.0, `src/core/ui/iconos/LEEME.md`).
