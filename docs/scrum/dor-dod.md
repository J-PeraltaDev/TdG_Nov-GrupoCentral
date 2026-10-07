# Definition of Ready y Definition of Done

> **Borrador para aprobar.** Es el texto del plan de arranque del Objetivo 3; falta que el equipo
> lo apruebe en el Sprint Planning del Sprint 1 (13 oct 2026).

## Definition of Ready

Una historia entra al sprint si:

- [ ] está enlazada a su RF y a su CU (HU-xx = RF-xx = CU-xx);
- [ ] sus criterios de aceptación son el curso normal y los cursos alternos del CU;
- [ ] tiene los enlaces a sus pantallas de Figma;
- [ ] la firma de su función RPC está definida (SDD, Tabla 21);
- [ ] está estimada en puntos (Fibonacci).

## Definition of Done

Una historia está terminada si:

- [ ] el compañero aprobó el PR;
- [ ] el CI está en verde: lint, pruebas unitarias, pgTAP y build;
- [ ] incluye las pruebas de su RF, con el RF y el CU en el nombre;
- [ ] la migración está versionada y aplicada en desarrollo;
- [ ] se probó a 360 px y en escritorio;
- [ ] el asesor de Supabase no muestra alertas nuevas;
- [ ] corre en la vista previa de Cloudflare Pages;
- [ ] si cambió algo del diseño, el SDD o el SRS se actualizó (`docs/cambios-sdd.md`, en el mismo PR).

## Cómo se verifica cada punto

| Punto                    | Evidencia                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------ |
| Aprobación del compañero | Review aprobada en el PR (RNF-17)                                                          |
| CI en verde              | Jobs «App» y «Base de datos» de GitHub Actions                                             |
| Pruebas del RF           | Nombres con el RF y el CU: `RF-05 / CU-05 4a: señala los campos faltantes`                 |
| Migración                | Archivo en `supabase/migrations/`; `supabase db reset && supabase test db` pasa desde cero |
| 360 px y escritorio      | Dos capturas en el PR (360 × 800 y 1280 × 800)                                             |
| Asesor de Supabase       | Salida de `supabase db advisors` sin alertas nuevas, resumida en el PR                     |
| Vista previa             | URL de la vista previa de Pages en el PR                                                   |
| Diseño actualizado       | Entrada en `docs/cambios-sdd.md` con la sección afectada y el texto propuesto              |
