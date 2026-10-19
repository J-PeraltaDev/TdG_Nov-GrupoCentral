# Supabase · configuración de Auth y de la API de datos

Valores que debe tener el proyecto remoto «PROYECTO» (`lyrdsmfalrchbdpmikmt`). Se ponen a mano en
el panel; un agente no los cambia sin que el equipo se lo pida, porque «PROYECTO» es producción.
El entorno local ya los tiene en `supabase/config.toml`.

Fuente: SDD 5.3.1 («registro público deshabilitado, confirmación por correo deshabilitada y
recuperación por enlace al correo no utilizada, porque los correos de la plataforma no reciben
mensajes»).

## Auth

Panel de Supabase → **Authentication**.

| Dónde                              | Ajuste                     | Valor                         | En `config.toml`                            |
| ---------------------------------- | -------------------------- | ----------------------------- | ------------------------------------------- |
| Sign In / Providers → User Signups | Allow new users to sign up | **Desactivado**               | `[auth] enable_signup = false`              |
| Sign In / Providers → User Signups | Allow anonymous sign-ins   | **Desactivado**               | `[auth] enable_anonymous_sign_ins = false`  |
| Sign In / Providers → Email        | Enable Email provider      | **Activado**                  | `[auth.email] enable_signup = true`         |
| Sign In / Providers → Email        | Confirm email              | **Desactivado**               | `[auth.email] enable_confirmations = false` |
| Sign In / Providers → Email        | Minimum password length    | **8**                         | `[auth] minimum_password_length = 8`        |
| Sessions                           | Access token (JWT) expiry  | **3600** segundos             | `[auth] jwt_expiry = 3600`                  |
| URL Configuration                  | Site URL                   | La URL de producción de Pages | `[auth] site_url`                           |

Notas:

- Con el registro público desactivado, las cuentas solo las crea el administrador mediante la
  Edge Function `gestionar-usuario` (Sprint 3), que usa la clave secreta.
- No se usan enlaces de recuperación por correo: la recuperación es con un código que entrega el
  administrador (RF-02). No hace falta configurar SMTP.
- Los demás proveedores (teléfono, OAuth, Web3) quedan desactivados.

## API de datos

Panel de Supabase → **Project Settings** → **Data API**.

| Ajuste          | Valor                                                                           |
| --------------- | ------------------------------------------------------------------------------- |
| Exposed schemas | `public` (y `graphql_public`, que viene por defecto). **No agregar `private`.** |
| Max rows        | 1000                                                                            |

## Claves

Panel de Supabase → **Project Settings** → **API Keys**.

- **Publishable key** (`sb_publishable_…`): es la única que va en el cliente
  (`VITE_SUPABASE_PUBLISHABLE_KEY`) y en Cloudflare Pages.
- **Secret key** (`sb_secret_…`): nunca en el repositorio, en `.env.local` ni en Pages. Solo la
  usan las Edge Functions, y **nadie tiene que copiarla**: la plataforma se la entrega a cada
  función en la variable `SUPABASE_SECRET_KEYS` (un JSON por nombre de clave; se usa `default`).

## Edge Functions

Son tres (SDD 5.3.4, Tabla 23): `gestionar-usuario`, `restablecer-contrasena` y `enviar-push`.
Cómo están hechas y por qué: `docs/adr/0012`.

En «staging» se despliegan con el script del repositorio, sin Docker:

```bash
npm run staging:functions
```

Sin argumentos despliega todas; con un nombre, solo esa (`npm run staging:functions --
gestionar-usuario`). Qué función exige sesión (`verify_jwt`) se define en `supabase/config.toml`.
`SUPABASE_URL` y `SUPABASE_SECRET_KEYS` los pone la plataforma. `enviar-push` necesita además
`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` y `ENVIAR_PUSH_SECRETO`, y el
webhook necesita en Vault `enviar_push_url` y `enviar_push_secreto`. En «staging» los pone
`npm run staging:secretos`, que los lee de `.env.local` y no imprime ninguno.

**En «PROYECTO» las despliega una persona, al cierre del sprint y con el OK del equipo**, después
de aplicar las migraciones:

```bash
npx supabase functions deploy --use-api --project-ref lyrdsmfalrchbdpmikmt
```

Después conviene comprobar, sin sesión, que `restablecer-contrasena` responde (400 con un cuerpo
vacío) y que `gestionar-usuario` y `enviar-push` rechazan (401).

### Notificaciones push en «PROYECTO»

Una persona del equipo, una sola vez y antes de desplegar `enviar-push`:

1. **Claves propias de «PROYECTO»** (no las de «staging»), en un archivo aparte que Git ignora:
   `npm run vapid:claves -- --archivo .env.proyecto.local`. Agrega a mano
   `VAPID_SUBJECT=mailto:…` (el del equipo) y guarda el archivo en el gestor de contraseñas.
2. **Secretos de la función:**
   `npx supabase secrets set --project-ref lyrdsmfalrchbdpmikmt --env-file .env.proyecto.local`.
3. **Vault:** en el panel, **Integrations → Vault → Add new secret**, dos secretos:
   `enviar_push_url` con `https://lyrdsmfalrchbdpmikmt.supabase.co/functions/v1/enviar-push` y
   `enviar_push_secreto` con el `ENVIAR_PUSH_SECRETO` del archivo. Por el panel, y no por el
   editor SQL, para que el valor no quede en el historial de consultas.
4. **Cloudflare Pages:** `VITE_VAPID_PUBLIC_KEY` de producción con la `VAPID_PUBLIC_KEY` de
   «PROYECTO» (la de las vistas previas es la de «staging»).

Hasta que estén los dos secretos de Vault, el webhook no envía nada y los avisos se crean igual.

## Vincular el repositorio (`supabase link`)

Sirve para dejar el vínculo y, al cierre del sprint, hacer `supabase db push`. Cada persona lo
hace en su equipo:

```bash
npx supabase login
npx supabase link --project-ref lyrdsmfalrchbdpmikmt
```

`link` pide la contraseña de la base de datos (Project Settings → Database). Se escribe en la
terminal; no se guarda en ningún archivo del repositorio. Para un agente o para el CI es mejor un
token personal con alcance limitado a este proyecto (Account → Access Tokens) en la variable
`SUPABASE_ACCESS_TOKEN`.

**Pendiente en el Sprint 0:** el vínculo no se hizo, porque falta la sesión del CLI y la
contraseña de la base.

## Por verificar cuando haya base local

`[auth.email] enable_signup` quedó en `true` a propósito: en el CLI ese valor habilita el
proveedor de correo, es decir, el ingreso con correo y contraseña; el registro público lo
bloquea `[auth] enable_signup = false`. Hay que confirmarlo con `supabase start`: el ingreso de un
usuario del seed debe funcionar y `signUp` desde el cliente debe ser rechazado.
