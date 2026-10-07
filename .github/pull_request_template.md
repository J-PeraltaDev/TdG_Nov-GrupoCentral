<!-- Título del PR: Conventional Commits con el RF como alcance, p. ej. `feat(RF-05): registrar novedad` -->

## Qué hace este PR

<!-- Dos o tres frases. Una rama y un PR por historia. -->

## Trazabilidad

- **Historia:** HU-xx · RF-xx · CU-xx (enlace al issue)
- **Sprint:** S_
- **Cursos del CU cubiertos:** curso normal · alternos _a, _b…
- **Fuera del alcance de este PR:**

## Pantallas de Figma

<!-- Enlace al nodo de cada pantalla o variante que toca el PR. «No aplica» si no hay interfaz. -->

-

## Cómo se probó

<!-- Qué pruebas se agregaron (con el RF y el CU en el nombre) y qué se verificó a mano. -->

- [ ] `npm run lint` y `npm run format:check`
- [ ] `npm run test`
- [ ] `supabase db reset && supabase test db`
- [ ] `npm run build`
- [ ] `npm run test:e2e` (si el PR toca un flujo de usuario)

## Capturas

| 360 × 800 | Escritorio (1280 × 800) |
| --------- | ----------------------- |
|           |                         |

## Revisión propia antes de pedir la del compañero

- [ ] **Diferencias:** revisé `git diff main...HEAD` completo.
- [ ] **Estándares:** cumple las convenciones de `CLAUDE.md` (nombres del SDD, ramas, commits y migraciones).
- [ ] **Especificación:** cubre el RF y todos los cursos alternos de su CU, cada uno con su prueba, y no trae nada fuera del alcance del sprint.
- [ ] **SQL:** cumple las reglas de `CLAUDE.md` (RLS, `security definer`, `security_invoker`, `GRANT` explícitos) y el asesor de Supabase no muestra alertas nuevas.
- [ ] **Interfaz:** revisada contra las guías de interfaz web y la lista de accesibilidad (foco visible, 48 px en el teléfono, nada comunicado solo con color).

## Definition of Done

- [ ] El compañero aprobó el PR.
- [ ] El CI está en verde (lint, unitarias, pgTAP y build).
- [ ] Incluye las pruebas de su RF.
- [ ] La migración está versionada y aplicada en desarrollo, y los tipos están regenerados (`npm run db:types`).
- [ ] Se probó a 360 px y en escritorio.
- [ ] El asesor de Supabase no muestra alertas nuevas.
- [ ] Corre en la vista previa de Cloudflare Pages.
- [ ] Si cambió algo del diseño, `docs/cambios-sdd.md` tiene la sección afectada y el texto propuesto.

## Secretos

- [ ] No subo claves secretas, contraseñas ni tokens. El repositorio es público.
