# Cloudflare Pages · crear el proyecto y verificarlo

El proyecto de Pages lo crea una persona desde el panel, porque pide autorizar GitHub. Se hace
una sola vez. Decisión y razones: `docs/adr/0004`.

## Antes de empezar

- El código del Sprint 0 debe estar en `main` del repositorio `J-PeraltaDev/TdG_Nov-GrupoCentral`.
- Ten a la mano la clave publicable de «PROYECTO»: panel de Supabase → **Project Settings** →
  **API Keys** → _Publishable key_ (`sb_publishable_…`). **No** copies la _Secret key_.

## Crear el proyecto

1. Entra a [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create**
   → pestaña **Pages** → **Connect to Git**.
2. Autoriza la app de Cloudflare en GitHub **solo para el repositorio**
   `J-PeraltaDev/TdG_Nov-GrupoCentral` (lo hace Juan, que es el dueño).
3. Selecciona el repositorio y pulsa **Begin setup**.
4. Configura el build:

   | Campo                  | Valor                     |
   | ---------------------- | ------------------------- |
   | Project name           | `novedades-grupo-central` |
   | Production branch      | `main`                    |
   | Framework preset       | `None`                    |
   | Build command          | `npm run build`           |
   | Build output directory | `dist`                    |
   | Root directory         | _(vacío)_                 |

5. En **Environment variables (advanced)** agrega las variables de **Production**:

   | Variable                        | Valor                                      |
   | ------------------------------- | ------------------------------------------ |
   | `VITE_SUPABASE_URL`             | `https://lyrdsmfalrchbdpmikmt.supabase.co` |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | la clave `sb_publishable_…` de «PROYECTO»  |

6. Pulsa **Save and Deploy** y espera el primer despliegue.
7. Después, en **Settings** → **Environment variables**, agrega las mismas dos variables para
   **Preview**:
   - si ya existe el proyecto «staging» (`docs/decisiones-pendientes.md`, punto 2), con la URL y
     la clave publicable de «staging»;
   - mientras no exista, con las de «PROYECTO». En el Sprint 0 la app no consulta la base, así
     que no hay riesgo; hay que cambiarlo antes de la primera review del Sprint 1.

La versión de Node la toma de `.nvmrc` (24). No hace falta la variable `NODE_VERSION`.

No actives Pages Functions ni agregues un `wrangler.jsonc`: el sitio es estático.

## Verificar

1. **Producción:** abre `https://novedades-grupo-central.pages.dev` (o la URL que muestre el
   panel). Debe verse la app de prueba con «Supabase: Variables configuradas».
2. **Ruta de la SPA:** abre `…pages.dev/cualquier/ruta`. Debe mostrar «No encontramos esta
   página», no un error de Cloudflare.
3. **Cabeceras:** en las herramientas del navegador (pestaña Red), `sw.js` y
   `manifest.webmanifest` deben responder con `Cache-Control: no-cache`, y los archivos de
   `/assets/` con `public, max-age=31536000, immutable`.
4. **PWA:** el navegador debe ofrecer instalar la aplicación. Después de la primera carga, activa
   el modo avión y vuelve a abrirla: debe abrir.
5. **Vista previa:** abre un pull request de prueba. Cloudflare comenta en el PR la URL de la
   vista previa (`https://<hash>.novedades-grupo-central.pages.dev`).

Cuando el proyecto exista, avísale al agente para que verifique las dos URL y las deje en
`docs/sprints/S0.md`.

## Si el build falla

- **Versión de Node:** confirma en el registro del build que usa Node 24. Si no, agrega la
  variable `NODE_VERSION` = `24` en Production y en Preview.
- **Descarga de Supabase CLI:** la dependencia de desarrollo `supabase` descarga su binario
  durante `npm ci`. Si esa descarga falla en Pages, hay que sacar el CLI de `package.json` e
  instalarlo aparte en cada equipo; avisen antes de cambiarlo.
- **Variables:** las `VITE_*` se leen en el momento del build. Si las cambias, vuelve a desplegar.
