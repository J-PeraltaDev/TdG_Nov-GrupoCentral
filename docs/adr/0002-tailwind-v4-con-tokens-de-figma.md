# 0002 · Tailwind CSS v4 con los tokens de Figma

- **Estado:** Aceptada (plan de arranque del Objetivo 3, 6 oct 2026)
- **Requerimientos:** RNF-01, RNF-05 · SDD 5.2

## Contexto

El diseño está cerrado en Figma: 47 variables de color, 12 estilos de texto en Public Sans y
cuatro componentes base con 28 variantes. El conector de Figma entrega código de referencia en
React y Tailwind, lo que acelera pasar las 69 pantallas sin una librería de componentes pesada.

## Decisión

Tailwind CSS v4 con su plugin de Vite. Las variables de Figma están en `src/styles/tokens.css`
dentro de `@theme`, con los nombres de Figma sin tildes ni «/»
(`estado/atencion/texto` → `--color-estado-atencion-texto` → `text-estado-atencion-texto`).

- La paleta por defecto de Tailwind está deshabilitada (`--color-*: initial`): solo existen los
  colores de Figma.
- Cada estilo de texto es una utilidad que fija tamaño, interlineado y peso (`text-cuerpo-fuerte`).
- «Escritorio» es el punto de quiebre `lg` (1024 px) en todo el proyecto. Figma solo dibuja 390 px
  y 1440 px; el corte intermedio es una decisión de implementación.

## Consecuencias

- Un color o un tamaño nuevo se agrega primero en Figma y después en `tokens.css`.
- `src/styles/tokens.test.js` verifica que estén los 47 colores y los 12 estilos y que los pares
  texto/fondo cumplan el contraste 4,5:1 de WCAG.
- No se usa una librería de componentes: los componentes base están en `src/core/ui/`.
