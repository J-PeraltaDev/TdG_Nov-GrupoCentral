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

**Estado:** Sprint 0 (entorno listo para construir). El avance por sprint está en
[`docs/sprints/`](docs/sprints/).

## Tecnologías

React 19 y Vite 8 (JavaScript con JSX) · Tailwind CSS v4 · React Router · Supabase (PostgreSQL
con RLS, Auth, Storage y Edge Functions) · `vite-plugin-pwa` · Cloudflare Pages. Las decisiones y
sus razones están en [`docs/adr/`](docs/adr/).

## Requisitos

| Herramienta    | Versión                                              | Para qué                               |
| -------------- | ---------------------------------------------------- | -------------------------------------- |
| Node.js        | 22.22 o superior (recomendada: 24 LTS, ver `.nvmrc`) | App, pruebas y Supabase CLI            |
| npm            | El que trae Node                                     | Dependencias                           |
| Docker Desktop | Reciente, en ejecución                               | Base de datos local (`supabase start`) |
| Git            | Reciente                                             | Control de versiones                   |

Supabase CLI no se instala aparte: viene como dependencia de desarrollo y se usa con
`npx supabase …` o con los scripts `db:*`.

## Instalación

```bash
git clone https://github.com/J-PeraltaDev/TdG_Nov-GrupoCentral.git
cd TdG_Nov-GrupoCentral
npm ci
```

## Entorno local

La base de datos de desarrollo corre en tu equipo con Supabase CLI y Docker. El proyecto remoto
«PROYECTO» es **producción**: no se desarrolla contra él.

```bash
npm run db:start       # levanta Supabase local y aplica las migraciones
npx supabase status    # muestra la URL de la API y la clave publicable locales
```

Copia `.env.example` como `.env.local` y pon esos dos valores:

```bash
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_…
```

En el cliente solo va la clave publicable. La clave secreta nunca va en `.env.local` ni en el
repositorio, que es público.

```bash
npm run dev            # http://localhost:5173
```

En desarrollo, `http://localhost:5173/_dev/componentes` muestra las 28 variantes de los
componentes base para compararlas con Figma.

Después de cada migración:

```bash
npm run db:reset       # recrea la base local: migraciones + supabase/seed.sql
npm run test:db        # pruebas pgTAP
npm run db:types       # regenera src/core/supabase/database.types.ts
```

Los datos de `supabase/seed.sql` y los usuarios de prueba son solo para el entorno local.

## Scripts

| Script                                      | Qué hace                                                        |
| ------------------------------------------- | --------------------------------------------------------------- |
| `npm run dev`                               | Servidor de desarrollo (sin service worker)                     |
| `npm run build`                             | Build de producción en `dist/`, con service worker y manifiesto |
| `npm run preview`                           | Sirve `dist/` en `http://localhost:4173` para probar la PWA     |
| `npm run lint`                              | oxlint                                                          |
| `npm run format` · `format:check`           | Prettier: corrige o solo verifica                               |
| `npm run test` · `test:watch`               | Pruebas unitarias con Vitest y Testing Library                  |
| `npm run test:db`                           | Pruebas de base de datos con pgTAP                              |
| `npm run test:e2e`                          | Pruebas de extremo a extremo con Playwright                     |
| `npm run db:start` · `db:stop` · `db:reset` | Supabase local                                                  |
| `npm run db:types`                          | Tipos de la base de datos para el autocompletado                |

Playwright necesita sus navegadores una sola vez: `npx playwright install chromium webkit`.

## Estructura

```
src/app/        rutas, guardianes por rol y layouts
src/core/       núcleo compartido: supabase, offline, sesión, acciones, errores, ui, utils
src/modules/    una carpeta por épica (e1-acceso-admin … e7-avisos)
src/styles/     tokens de Figma (tokens.css)
src/sw.js       service worker
supabase/       config.toml, migraciones, pruebas pgTAP, funciones y seed local
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
- **Base de datos:** `supabase db push` hacia «PROYECTO», solo al cierre del sprint, después de la
  review y con el visto bueno del equipo. Configuración de Auth en
  [`docs/despliegue/supabase-auth.md`](docs/despliegue/supabase-auth.md).

## Licencias de terceros

Public Sans (SIL Open Font License 1.1, `src/assets/fuentes/OFL.txt`) y Material Symbols (Apache
2.0, `src/core/ui/iconos/LEEME.md`).
