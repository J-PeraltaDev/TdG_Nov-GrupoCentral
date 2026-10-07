# 0009 · Fuente e íconos como archivos locales

- **Estado:** Propuesta en el Sprint 0, para confirmar en la revisión
  (`docs/decisiones-pendientes.md`, punto 5)
- **Requerimientos:** RNF-05 · SDD 5.2

## Contexto

El stack pide Public Sans autoalojada, para que funcione sin red, e íconos «exportados de Figma
como SVG locales, sin librería de íconos». Al revisar Figma se encontró que los íconos no son
vectores: son texto con la fuente Material Symbols Rounded, y el conector no los exporta como SVG
limpios (salen recortados al contorno del glifo y con el fondo del lienzo).

## Decisión

- **Fuente:** el archivo variable `public-sans-latin-wght-normal.woff2` (27 KB; cubre el español)
  está en `src/assets/fuentes/` con su licencia OFL. Se tomó del paquete
  `@fontsource-variable/public-sans` 5.3.0, pero no queda como dependencia.
- **Íconos:** un SVG por ícono en `src/core/ui/iconos/`, descargado sin modificar del conjunto
  oficial Material Symbols Rounded (el mismo de Figma, licencia Apache 2.0), con el nombre que
  tiene en Figma. No se carga la fuente de íconos, que pesa cientos de KB.
- **Uso:** `Icono.jsx` usa el SVG como máscara y lo pinta con `currentColor`, así el color sale
  siempre de los tokens. Son decorativos (`aria-hidden`): el significado lo da la etiqueta.

## Consecuencias

- Los SVG de menos de 4 KB quedan dentro del JavaScript; no generan solicitudes de red.
- Un ícono nuevo se agrega a mano siguiendo `src/core/ui/iconos/LEEME.md`.
- Los íconos de la aplicación (manifiesto y favicon) son marcadores: Figma no tiene un ícono de
  la app.
