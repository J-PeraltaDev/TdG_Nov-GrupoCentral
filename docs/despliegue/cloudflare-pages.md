# Cloudflare Pages · configurar el proyecto y verificarlo

El proyecto de Pages **ya existe**: `tdg-nov-grupocentral`, en
<https://tdg-nov-grupocentral.pages.dev/>, conectado al repositorio
`J-PeraltaDev/TdG_Nov-GrupoCentral`. Lo creó el equipo. Decisión y razones: `docs/adr/0004`.

**Estado al 7 oct 2026:** la URL responde, pero publica la plantilla inicial de Vite (título
«proyecto»), que es lo que hay en `main`. La aplicación aparecerá cuando el Sprint 0 llegue a
`main`. Lo que sigue se configura en el panel y lo hace una persona.

## 1 · Revisar la configuración del build

En [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** →
`tdg-nov-grupocentral` → **Settings** → **Builds & deployments**:

| Campo                  | Valor           |
| ---------------------- | --------------- |
| Production branch      | `main`          |
| Framework preset       | `None`          |
| Build command          | `npm run build` |
| Build output directory | `dist`          |
| Root directory         | _(vacío)_       |

La versión de Node la toma de `.nvmrc` (24). No hace falta la variable `NODE_VERSION`.

No actives Pages Functions ni agregues un `wrangler.jsonc`: el sitio es estático.

## 2 · Variables de entorno

En **Settings** → **Environment variables**. Son dos variables, con valores distintos por
entorno (las razones están en `docs/adr/0011`):

| Entorno        | `VITE_SUPABASE_URL`                        | `VITE_SUPABASE_PUBLISHABLE_KEY`           |
| -------------- | ------------------------------------------ | ----------------------------------------- |
| **Production** | `https://lyrdsmfalrchbdpmikmt.supabase.co` | la clave `sb_publishable_…` de «PROYECTO» |
| **Preview**    | `https://qxjnnanjidytbyihanet.supabase.co` | la clave `sb_publishable_…` de «staging»  |

Cada clave está en el panel de Supabase del proyecto correspondiente: **Project Settings** →
**API Keys** → _Publishable key_. **Nunca** copies la _Secret key_: el repositorio y el sitio son
públicos.

Así, las vistas previas de los pull requests usan la base de pruebas, con las migraciones del
sprint y los usuarios de prueba, y producción usa «PROYECTO», que solo recibe migraciones al
cierre de cada sprint.

Las variables `VITE_*` se leen en el momento del build: después de cambiarlas hay que volver a
desplegar (**Deployments** → **Retry deployment**).

## 3 · La URL de producción en Supabase Auth

La guía `docs/despliegue/supabase-auth.md` pide poner en «PROYECTO» la URL de producción de Pages
como _Site URL_ (**Authentication** → **URL Configuration**). Con el nombre real del proyecto es
`https://tdg-nov-grupocentral.pages.dev`.

En el Sprint 1 el ingreso es con correo y contraseña y no usa redirecciones, así que esto no
bloquea; hará falta en el Sprint 3, con la recuperación de contraseña.

## 4 · Verificar

1. **Producción:** abre <https://tdg-nov-grupocentral.pages.dev/>. Debe verse el ingreso
   («Novedades · Grupo Central»), en español.
2. **Ruta de la SPA:** abre `…pages.dev/cualquier/ruta`. Debe mostrar «No encontramos esta
   página», no un error de Cloudflare.
3. **Cabeceras:** en las herramientas del navegador (pestaña Red), `sw.js` y
   `manifest.webmanifest` deben responder con `Cache-Control: no-cache`, y los archivos de
   `/assets/` con `public, max-age=31536000, immutable`.
4. **PWA:** el navegador debe ofrecer instalar la aplicación. Después de la primera carga, activa
   el modo avión y vuelve a abrirla: debe abrir.
5. **Vista previa:** abre un pull request. Cloudflare comenta en el PR la URL de la vista previa
   (`https://<hash>.tdg-nov-grupocentral.pages.dev`). Ahí debe poderse ingresar con un usuario de
   prueba de «staging».
6. **Lighthouse** (Chrome → herramientas de desarrollo → Lighthouse → categoría _Progressive Web
   App_ o el panel **Application** → **Manifest**): la aplicación debe aparecer como instalable.
   Guarda el resultado en `docs/sprints/evidencias/`.

## Si el build falla

- **Versión de Node:** confirma en el registro del build que usa Node 24. Si no, agrega la
  variable `NODE_VERSION` = `24` en Production y en Preview.
- **Descarga de Supabase CLI:** la dependencia de desarrollo `supabase` descarga su binario
  durante `npm ci`. Si esa descarga falla en Pages, hay que sacar el CLI de `package.json` e
  instalarlo aparte en cada equipo; avisen antes de cambiarlo.
- **Faltan las variables:** si la aplicación abre en blanco y la consola dice que faltan
  `VITE_SUPABASE_URL` o `VITE_SUPABASE_PUBLISHABLE_KEY`, revisa el paso 2 y vuelve a desplegar.
