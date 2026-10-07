# Prueba de sesión sin conexión (RNF-10)

- **Requerimiento:** RNF-10 · CU-01, curso alterno 2b · SDD 3.3.3 («Sesión sin conexión») y 6.1.10
- **Fecha:** 7 oct 2026 · **Versión probada:** `@supabase/supabase-js` 2.117.0
- **Navegador:** Chromium (Playwright 1.63), a 360 × 800 y a 1280 × 800, sobre el build de
  producción con service worker
- **Prueba automatizada:** `e2e/rnf-10-sesion-sin-conexion.spec.js`

## Qué se quería saber

El SDD da por hecho que el cliente de Supabase conserva la sesión en el dispositivo, pero no
estaba probado qué hace `supabase-js` al abrir la aplicación **sin red y con el token de acceso
vencido**. Si cerrara o borrara la sesión, se rompería RNF-10 y, con él, el registro sin conexión
del Sprint 4.

## Cómo se probó

1. Se abre la aplicación con red (se instala el service worker y se crea la base local).
2. Se deja el dispositivo como queda después de un ingreso: la sesión en el almacenamiento de
   `supabase-js` y el perfil en el almacén `meta` de IndexedDB.
3. Se corta la red (`context.setOffline(true)`).
4. Se vuelve a abrir la aplicación.

Se corre dos veces: con el token vigente y con el token vencido hace una hora.

El plan proponía poner `jwt_expiry = 300` y esperar a que venciera un token real. Como el equipo
trabaja contra «staging» y no con Supabase local, se usó una sesión fabricada con la fecha de
vencimiento en el pasado. Para esta pregunta es equivalente: sin red nadie valida el token, y lo
que decide `supabase-js` depende solo de la fecha de vencimiento guardada. Además, la prueba no
necesita credenciales ni esperar cinco minutos.

## Resultado

**Pasa.** En los dos casos la aplicación:

| Verificación                                           | Token vigente | Token vencido |
| ------------------------------------------------------ | ------------- | ------------- |
| Abre desde la caché del service worker                 | Sí            | Sí            |
| Conserva la sesión en el almacenamiento                | Sí            | Sí            |
| Entra a la pantalla de inicio del rol (`/novedades`)   | Sí            | Sí            |
| Pinta el menú del rol con el perfil guardado en `meta` | Sí            | Sí            |
| Muestra el indicador «Sin conexión»                    | Sí            | Sí            |
| Llega al formulario de registro                        | Sí            | Sí            |

## Lo que se encontró en `supabase-js`

Con el token vencido y sin red, `supabase-js`:

- **no borra la sesión**: el fallo al renovar es un error «reintentable»
  (`AuthRetryableFetchError`) y la sesión se queda en el almacenamiento;
- **pero `getSession()` no responde de inmediato**: reintenta la renovación con esperas cada vez
  más largas y tarda cerca de **25 segundos** en devolver «sin sesión» con ese error.

La primera versión de la aplicación esperaba esa respuesta, así que durante ese medio minuto
mostraba el formulario de ingreso, como si la persona no hubiera entrado nunca. Se corrigió en
`src/core/sesion/sesion.js`:

1. El **perfil guardado en `meta`** es la señal de quién ingresó en el dispositivo: se escribe
   al ingresar y se borra al cerrar la sesión.
2. **Sin red** (`navigator.onLine` en falso), la aplicación entra de inmediato con ese perfil y
   no le pregunta nada a `supabase-js`.
3. **Con red aparente pero sin respuesta**, espera a `getSession()` máximo 4 segundos y sigue
   con el perfil guardado.
4. Al **volver la red**, confirma la sesión contra el servidor; si la cuenta fue desactivada o
   la sesión ya no vale, cierra la sesión.
5. Mientras se recupera la sesión, la pantalla de ingreso muestra «Cargando…» y no el formulario.

Entrar con el perfil guardado no abre ningún dato: sin un token válido el servidor no entrega
nada (RNF-11). El perfil solo sirve para pintar el menú y dejar llegar al formulario.

## Qué queda para el Sprint 4

- La cola de pendientes debe enviarse solo cuando la sesión esté renovada. Si al volver la red
  la renovación falla (por ejemplo, porque la cuenta fue suspendida), se conserva la cola y se
  pide el ingreso (pantalla 08-B).
- Repetir la prueba en un teléfono Android y en un iPhone reales, con un ingreso de verdad.

## Lo que no se pudo probar aquí

- **WebKit (Safari):** en el equipo de desarrollo, el Control de aplicaciones de Windows bloquea
  las bibliotecas de WebKit de Playwright. La prueba corre en WebKit en el CI.
- **Con un ingreso real:** las pruebas que ingresan con usuario y contraseña
  (`e2e/cu-01-iniciar-sesion.spec.js`) las corre el equipo, con su propia contraseña de prueba.
