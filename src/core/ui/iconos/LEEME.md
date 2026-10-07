# Íconos

SVG locales, sin librería de íconos. Se usan con `Icono.jsx`, que los pinta con el color del texto.

## De dónde salen

En Figma los íconos no son vectores: son texto con la fuente **Material Symbols Rounded**
(peso 400, sin relleno). El conector de Figma no los exporta como SVG limpios, así que estos
archivos se descargaron del mismo conjunto oficial de Google, sin modificarlos:

`https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsrounded/<nombre>/default/20px.svg`

El nombre del archivo es el nombre del ícono en Figma (`cloud_off`, `task_alt`…). Para agregar
uno nuevo, descárgalo de esa misma ruta con el nombre que muestra Figma y no lo edites.

`punto.svg` sí viene de Figma (nodo 1:108, el punto del indicador «En línea»).

Pendiente de confirmar con el equipo: `docs/decisiones-pendientes.md`, punto 5.

## Licencia

Material Symbols es de Google y se distribuye con la licencia Apache 2.0
(https://www.apache.org/licenses/LICENSE-2.0).
