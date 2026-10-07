# 0006 · Parámetros configurables en un solo archivo

- **Estado:** Aceptada; los valores están por validar con la empresa
  (`docs/decisiones-pendientes.md`, punto 4)
- **Requerimientos:** RF-02, RF-05, RF-08 · SDD 7.3

## Contexto

El SDD deja varios valores como «configurables» o «por validar» (sección 7.3) y el código los
necesita como constantes.

## Decisión

Los parámetros están en `src/core/config/parametros.js` y, donde aplica, tienen su equivalente en
la base de datos. Los dos lados se cambian a la vez.

| Parámetro                 | Valor propuesto       | Se usa en | Equivalente en la BD                                                 |
| ------------------------- | --------------------- | --------- | -------------------------------------------------------------------- |
| Descripción de la novedad | Máximo 500 caracteres | Sprint 1  | `CHECK` de `novedad.descripcion` y validación de `registrar_novedad` |
| Código de recuperación    | Válido 30 minutos     | Sprint 3  | `solicitud_recuperacion.expira_en`                                   |
| Foto: lado mayor          | 1600 px               | Sprint 4  | —                                                                    |
| Foto: calidad JPEG        | 70 %                  | Sprint 4  | —                                                                    |
| Foto: peso máximo         | 1 MB                  | Sprint 4  | Límite del bucket `evidencias`                                       |
| Fotos por novedad         | Hasta 3               | Sprint 4  | Por definir                                                          |
| Zona horaria              | `America/Bogota`      | Sprint 1  | —                                                                    |

## Consecuencias

- Ningún componente escribe estos números directamente: los importa de `parametros.js`.
- Si la validación con la empresa cambia un valor, se cambia aquí, en su equivalente de la BD
  (con una migración) y en el SDD 7.3.
