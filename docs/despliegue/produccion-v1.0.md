# Producción de la v1.0 (cierre del Sprint 5)

> **Ejecutada el 19 oct 2026, del paso 1 al 13.** Cómo fue, con sus comprobaciones y lo que no
> salió como estaba escrito, está en [`docs/sprints/S5.md`](../sprints/S5.md), «Producción».
> Quedan los pasos 14 a 16.

La lista, en orden, para llevar el Sprint 5 a «PROYECTO» (`lyrdsmfalrchbdpmikmt`) y a la
aplicación publicada. **La ejecuta una persona del equipo, con el OK de la review.** El agente no
escribe en «PROYECTO» (en el Sprint 4 el modo de permisos tampoco se lo dejó). Prepara los
comandos y, después de cada paso, hace las comprobaciones de solo lectura de la columna
«Comprobación».

**Por qué en este orden.** Cloudflare Pages publica `main` en cuanto se fusiona. La base y la
función tienen que estar **antes** que el código que las usa (lección del 10 oct; decisión 28 del
Sprint 4 y 55 del Sprint 5). Cada migración se aplica justo antes de fusionar su PR, en el orden de
los PR: así sus fechas quedan en orden y no hace falta `--include-all`.

## Antes de empezar

- **El OK del equipo** después de la review del Sprint 5.
- **Quien lo ejecuta** tiene:
  - `npx supabase login` con acceso a «PROYECTO»;
  - acceso a Cloudflare Pages y permiso para fusionar en GitHub.
- **Fusiones:** con _squash_, una por una. Antes de cada una se trae a la rama la del PR anterior
  y después `main`, y se comprueba que la diferencia frente a `main` sea solo la propia (como en el
  Sprint 4). El agente lo hace si se lo piden; nunca con `rebase` ni con un `push` forzado.
- **El simulacro y el `db push` se corren desde la rama del PR**, con la del anterior y `main` ya
  traídas: así listan solo su migración. Desde otra rama listarían otras.
- **No hace falta `supabase link`** ni leer datos de «PROYECTO».
- **Punto de partida, comprobado el 19 oct:** el simulacro desde la rama del informe lista las
  seis migraciones del sprint, sin semillas ni roles, y el asesor de «PROYECTO» da 15 avisos
  _WARN_, los mismos del Sprint 4.

Las comprobaciones de solo lectura que repite el agente:

```bash
npx supabase db push --project-ref lyrdsmfalrchbdpmikmt --dry-run      # «Remote database is up to date»
npx supabase db advisors --linked --project-ref lyrdsmfalrchbdpmikmt   # sin avisos nuevos fuera de los previstos
```

## Los pasos

| N.º | PR             | Qué hace la persona                                                                                                                                                                                                                                                                  | Comprobación (agente, solo lectura)                                                                         |
| --- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| 1   | #40            | Fusiona las pruebas sin fecha y el e2e obligatorio. Va antes que #39: tiene el CI en verde, y con él `main` no queda en rojo por la unitaria de 08                                                                                                                                   | `main` igual a la rama; el CI de `main`                                                                     |
| 2   | #39            | Fusiona el plan, después de traerle `main` (con #40) y de ver su CI en verde                                                                                                                                                                                                         | `main` igual a la rama                                                                                      |
| 3   | #41            | Simulacro y `db push`: debe listar solo `20261017191806_rf19_contratos_sprint_5`. Después fusiona                                                                                                                                                                                    | Simulacro «up to date». Asesor: **20** (15 de antes y 5 previstos, los de las cinco funciones que escriben) |
| 4   | #42            | Simulacro y `db push`: solo `20261017235729_rf30_marcar_avisos_leidos`. Fusiona                                                                                                                                                                                                      | Simulacro «up to date»; asesor en 20                                                                        |
| 5   | #43            | Fusiona el historial (sin migración)                                                                                                                                                                                                                                                 | —                                                                                                           |
| 6   | #44            | Simulacro y `db push`: solo `20261018044501_rf26_rf27_reportes`. Fusiona                                                                                                                                                                                                             | Simulacro «up to date»; asesor en 20                                                                        |
| 7   | #46            | Simulacro y `db push`: solo `20261018210525_rf28_rf29_reportes`. Fusiona                                                                                                                                                                                                             | Simulacro «up to date»; asesor en 20                                                                        |
| 8   | #47            | Simulacro y `db push`: solo `20261018225411_rf32_gestionar_tipos_falla`. Fusiona                                                                                                                                                                                                     | Simulacro «up to date»; asesor en 20                                                                        |
| 9   | #48            | Fusiona el CSV (sin migración). El punto y coma queda por validar con el director (cambio 32)                                                                                                                                                                                        | —                                                                                                           |
| 10  | #49            | Los pasos de la tabla siguiente, **antes** de fusionar                                                                                                                                                                                                                               | Las de la tabla siguiente                                                                                   |
| 11  | —              | Cloudflare Pages: `VITE_VAPID_PUBLIC_KEY` en **Production** (la pública de «PROYECTO») y en **Preview** (la de «staging»), según `cloudflare-pages.md`                                                                                                                               | —                                                                                                           |
| 12  | #50            | Fusiona el push del cliente, con el trabajo de extremo a extremo en verde en WebKit (`4b2e472`): Pages publica con la variable                                                                                                                                                       | La aplicación publicada carga (sin sesión)                                                                  |
| 13  | #45, #51 y #52 | Fusiona las pruebas con el reloj fijo (#45), las e2e estables en el CI (#51, que sale de la rama de #50: se le trae `main`) y el servidor propio de Playwright (#52). No tocan la aplicación. Después marca el trabajo «Extremo a extremo» como requerido en la protección de `main` | El CI de `main`, con los cinco trabajos en verde                                                            |
| 14  | #53            | Fusiona el informe (`docs/S5-informe`)                                                                                                                                                                                                                                               | `main` igual a la rama                                                                                      |
| 15  | —              | Comprueba la aplicación publicada con una cuenta real (ver abajo)                                                                                                                                                                                                                    | —                                                                                                           |
| 16  | —              | Crea las etiquetas (ver abajo)                                                                                                                                                                                                                                                       | `git ls-remote --tags origin`                                                                               |

### El paso 10: las notificaciones push en «PROYECTO» (#49)

| N.º | Qué hace la persona                                                                                                                                                                                                                                                                | Comprobación (agente, solo lectura)                                                                                                     |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 10a | Genera las claves **propias** de «PROYECTO», en un archivo que Git ignora: `npm run vapid:claves -- --archivo .env.proyecto.local`. Escribe a mano `VAPID_SUBJECT=mailto:…` (el del equipo) y guarda el archivo en el gestor de contraseñas                                        | —                                                                                                                                       |
| 10b | Simulacro y `db push`: solo `20261019124519_rf31_webhook_notificacion`                                                                                                                                                                                                             | Simulacro «up to date»; asesor en 20                                                                                                    |
| 10c | Secretos de la función: `npx supabase secrets set --project-ref lyrdsmfalrchbdpmikmt --env-file .env.proyecto.local`                                                                                                                                                               | `npx supabase secrets list --project-ref lyrdsmfalrchbdpmikmt` lista los nombres (no los valores): `VAPID_*` y `ENVIAR_PUSH_SECRETO`    |
| 10d | Despliega la función: `npx supabase functions deploy enviar-push --use-api --project-ref lyrdsmfalrchbdpmikmt`                                                                                                                                                                     | `npx supabase functions list --project-ref lyrdsmfalrchbdpmikmt`: activa y sin `verify_jwt`. Un POST sin el encabezado responde **401** |
| 10e | Vault, por el panel (**Integrations → Vault → Add new secret**), para que el valor no quede en el historial del editor SQL: `enviar_push_url` = `https://lyrdsmfalrchbdpmikmt.supabase.co/functions/v1/enviar-push` y `enviar_push_secreto` = el `ENVIAR_PUSH_SECRETO` del archivo | —                                                                                                                                       |
| 10f | Fusiona #49                                                                                                                                                                                                                                                                        | —                                                                                                                                       |

Hasta el 10e, el disparador del webhook no envía nada y los avisos se crean igual: no hay prisa
entre un paso y otro.

### El paso 15: la aplicación publicada

En <https://tdg-nov-grupocentral.pages.dev/>, con las cuentas reales de «PROYECTO»:

- el administrador abre el panel, el historial, «Exportar CSV» y Tipos de falla;
- el director abre el panel y la matriz, y salta al historial filtrado;
- en un teléfono, un reportante activa las notificaciones desde Avisos (10-B) y, con la aplicación
  cerrada, recibe el push cuando el área toma su novedad. Es la lista de chequeo de la decisión 47
  (punto 48 de `docs/decisiones-pendientes.md`).

### El paso 16: las etiquetas

Ninguna existe todavía. Con el OK del equipo, desde una copia al día de `main`:

```bash
git tag -a v0.1.0-s1 41d78bf -m "Sprint 1"
git tag -a v0.2.0-s2 97a39fd -m "Sprint 2"
git tag -a v0.3.0-s3 4ab2f04 -m "Sprint 3"
git tag -a v0.4.0-s4 452c8e9 -m "Sprint 4"
git tag -a v1.0.0 <el commit del informe del Sprint 5 en main> -m "v1.0: Sprint 5"
git push origin v0.1.0-s1 v0.2.0-s2 v0.3.0-s3 v0.4.0-s4 v1.0.0
```

## Si algo sale mal

- **Un simulacro lista más de una migración:** se detiene. Falta fusionar algo antes o se saltó un
  paso.
- **El asesor muestra un aviso de nivel error o uno que no esté previsto:** se detiene y se revisa
  antes de fusionar.
- **El push no llega en el paso 15:**
  - el agente lee en «staging» cómo responde el webhook (`net._http_response`);
  - en «PROYECTO» se revisa con los logs de la función en el panel.

  Los avisos dentro de la aplicación siguen funcionando: el push nunca los toca (CU-31 2a).
