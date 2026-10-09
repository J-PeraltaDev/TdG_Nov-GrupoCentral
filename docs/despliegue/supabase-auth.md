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

Son dos (SDD 5.3.4, Tabla 23): `gestionar-usuario` y `restablecer-contrasena`. Cómo están hechas y
por qué: `docs/adr/0012`.

En «staging» se despliegan con el script del repositorio, sin Docker:

```bash
npm run staging:functions
```

Sin argumentos despliega todas; con un nombre, solo esa (`npm run staging:functions --
gestionar-usuario`). Qué función exige sesión (`verify_jwt`) se define en `supabase/config.toml`.
No hay secretos que crear a mano: `SUPABASE_URL` y `SUPABASE_SECRET_KEYS` los pone la plataforma.
Para confirmarlo, **Edge Functions → Secrets** en el panel debe listar las dos.

**En «PROYECTO» las despliega una persona, al cierre del sprint y con el OK del equipo**, después
de aplicar las migraciones:

```bash
npx supabase functions deploy --use-api --project-ref lyrdsmfalrchbdpmikmt
```

Después conviene comprobar, sin sesión, que `restablecer-contrasena` responde (400 con un cuerpo
vacío) y que `gestionar-usuario` rechaza (401).

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
