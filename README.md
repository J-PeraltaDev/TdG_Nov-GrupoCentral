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

**Estado:** Sprint 2 (atención en primera instancia: bandeja del área, detalle con línea de
tiempo, y tomar, rechazar, escalar, reasignar y registrar la solución con su tipo de falla), en
revisión. En `main` está el Sprint 1 (ingreso por rol, registro de la novedad con su código
`NOV-####` y lista de novedades de la finca). El avance por sprint está en
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
| `npm run db:*` · `test:db`               | Lo mismo con Supabase local; necesitan Docker (los usa el CI)   |

**Pruebas de extremo a extremo.** Corren contra el build real y contra «staging». Las que
necesitan ingresar usan `CLAVE_USUARIOS_DE_PRUEBA` y se omiten si falta. Cada corrida deja
novedades de prueba en «staging».

Auth limita los ingresos por minuto, así que cada usuario de prueba ingresa una sola vez al
comienzo de la corrida (`e2e/sesiones.setup.js`) y las pruebas reutilizan su sesión con
`ingresarComo`. Solo las de CU-01, que prueban el ingreso mismo, pasan por el formulario. Las
sesiones quedan en `test-results/sesiones/`, que Playwright limpia en cada corrida y que no se sube
al repositorio: son tokens de los usuarios de prueba, no hay que compartir esa carpeta.

Playwright necesita sus navegadores una sola vez: `npx playwright install chromium webkit`. Si la
descarga se queda colgada (pasa en redes con IPv6 defectuoso), define antes la variable de entorno
`NODE_OPTIONS` con el valor `--dns-result-order=ipv4first`. En equipos con Control de aplicaciones
de Windows, WebKit se instala pero no abre: usa `npm run test:e2e:chromium`. El CI todavía no
corre las pruebas de extremo a extremo, así que WebKit está sin verificar.

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
4. Squash merge. Las migraciones van a producción solo al cierre del sprint.

La Definition of Ready y la Definition of Done están en
[`docs/scrum/dor-dod.md`](docs/scrum/dor-dod.md); el backlog, en
[`docs/scrum/backlog.md`](docs/scrum/backlog.md).

## Despliegue

- **Aplicación:** Cloudflare Pages publica `main` en producción y una vista previa por cada pull
  request. Comando de build `npm run build`, salida `dist`. Pasos y variables en
  [`docs/despliegue/cloudflare-pages.md`](docs/despliegue/cloudflare-pages.md).
- **Base de datos:** las migraciones de cada PR se prueban en «staging»; a «PROYECTO» llegan con
  `supabase db push`, solo al cierre del sprint, después de la review y con el visto bueno del
  equipo. Configuración de Auth en
  [`docs/despliegue/supabase-auth.md`](docs/despliegue/supabase-auth.md).

## Licencias de terceros

Public Sans (SIL Open Font License 1.1, `src/assets/fuentes/OFL.txt`) y Material Symbols (Apache
2.0, `src/core/ui/iconos/LEEME.md`).
