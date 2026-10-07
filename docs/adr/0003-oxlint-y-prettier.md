# 0003 · oxlint y Prettier

- **Estado:** Aceptada (plan de arranque del Objetivo 3, 6 oct 2026)
- **Requerimientos:** RNF-17

## Contexto

La plantilla del repositorio (Vite 8 + React 19) ya trae oxlint en lugar de ESLint. El plan
original hablaba de ESLint; se decidió conservar lo que ya estaba instalado.

## Decisión

- **oxlint** para el análisis estático, con los plugins `react`, `oxc` y `jsx-a11y`
  (`.oxlintrc.json`). La regla `jsx-a11y/prefer-tag-over-role` está apagada: pide `<output>` en
  lugar de `role="status"`, y aquí los indicadores de estado no son resultados de un formulario.
- **Prettier** para el formato (`.prettierrc.json`): sin punto y coma, comillas simples y 100
  columnas, que es el estilo de la plantilla.
- Los dos corren en el CI (`npm run lint` y `npm run format:check`).

## Consecuencias

- oxlint es muy rápido, pero no tiene todas las reglas de ESLint ni plugin de Tailwind.
- Prettier no ordena las clases de Tailwind (haría falta un plugin que no está en el stack).
- Prettier no formatea SQL: las migraciones se cuidan a mano.
