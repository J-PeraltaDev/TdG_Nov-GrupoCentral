# Decisiones pendientes

Dudas de diseño o de negocio que los documentos no resuelven. Ninguna bloquea: en cada una se
tomó la opción más conservadora y se dejó anotada para que Mateo y Juan la confirmen o la cambien.

| N.º | Tema                                       | Qué se hizo mientras tanto                                    | La decide                 |
| --- | ------------------------------------------ | ------------------------------------------------------------- | ------------------------- |
| 1   | Lista oficial de fincas y razones sociales | Marcadores en el seed local (Sprint 1)                        | Wilmar Cuesta / el equipo |
| 2   | Base de datos de las vistas previas        | Nada creado; recomendación: proyecto «staging»                | El equipo                 |
| 3   | Dominio de los correos de la plataforma    | `@novedades.test` para los usuarios de prueba                 | El equipo                 |
| 4   | Valores de los parámetros configurables    | Los que propone el plan, en `parametros.js`                   | La empresa                |
| 5   | Íconos de la app y conjunto de íconos      | Marcadores para la app; Material Symbols para la interfaz     | El equipo                 |
| 6   | Contraste del estado «escalada»            | Se dejó el color de Figma; prueba marcada como falla conocida | El equipo (Figma)         |
| 7   | Service worker propio o con Workbox        | Propio, sin dependencias nuevas                               | El equipo                 |
| 8   | Versión de Node y de jsdom                 | jsdom 29, compatible con Node 24.14                           | El equipo                 |
| 9   | Estados de interacción que Figma no dibuja | Solo el `hover` del botón primario                            | El equipo (Figma)         |
| 10  | Textos que no están en Figma               | Redactados con tuteo; listados abajo                          | El equipo                 |
| 11  | Peso de la ruta de ingreso                 | Medido; margen estrecho                                       | El equipo                 |
| 12  | Borde del botón secundario                 | Se dejó el color de Figma                                     | El equipo (Figma)         |

## 1 · Lista oficial de fincas y razones sociales

El objetivo del trabajo habla de 12 fincas, la descripción del proyecto de 13 y el SRS no da una
cifra; se esperan 7 razones sociales. El seed local del Sprint 1 usará marcadores («Razón social
de prueba A», «Finca de prueba 01»…), nunca nombres reales.

**Cuando llegue la lista** (por ejemplo `docs/fuentes/fincas.csv`, que no se sube al repo), la
propuesta para producción es una migración de datos revisada en un PR (`rf04_carga_fincas`) con
`insert … on conflict do nothing`, aplicada al cierre del sprint con el resto. Si los nombres de
las fincas no deben estar en un repositorio público, la alternativa es cargarlos desde la pantalla
30 (Fincas) con el administrador, en el Sprint 3.

## 2 · Base de datos de las vistas previas

Las reviews se hacen sobre la vista previa de Pages, pero las migraciones solo llegan a
«PROYECTO» al cierre del sprint: una vista previa que apunte a producción vería una base vacía o
desactualizada.

**Recomendación:** un segundo proyecto gratuito, «staging», para las variables _Preview_ de Pages.
Las migraciones de cada PR se le aplican con el OK del equipo, y «PROYECTO» queda solo para
_Production_. El plan gratuito permite dos proyectos activos.

**Hallazgo del Sprint 0:** el equipo donde se armó el entorno no tiene Docker ni WSL, así que no
se pudo levantar Supabase local. «staging» es también la alternativa del plan para trabajar sin
Docker. Hace falta decidir una de dos: instalar Docker Desktop, o crear «staging» y probar las
migraciones contra él. No se creó nada.

## 3 · Dominio de los correos de la plataforma

Los correos no son buzones reales. Los usuarios de prueba del seed usarán `@novedades.test`
(`.test` es un dominio reservado que nunca existe en internet). Falta decidir el dominio de las
cuentas reales.

## 4 · Parámetros configurables

Valores del plan, en `src/core/config/parametros.js` (ver `docs/adr/0006`): descripción de máximo
500 caracteres; código de recuperación válido 30 minutos; fotos con lado mayor de 1600 px, JPEG al
70 %, máximo 1 MB y hasta 3 por novedad. Faltan confirmarlos con la empresa.

## 5 · Íconos de la app y conjunto de íconos de la interfaz

- **Ícono de la aplicación:** Figma no tiene uno. `public/favicon.svg` y `public/iconos/*.png`
  son marcadores (una «N» blanca sobre el verde primario). Hay que reemplazarlos por el ícono
  definitivo en 192, 512, 512 _maskable_ y 180 px.
- **Íconos de la interfaz:** en Figma son texto con la fuente Material Symbols Rounded, no
  vectores, y el conector no los exporta como SVG limpios. Se usaron los SVG oficiales del mismo
  conjunto (Google, Apache 2.0), sin modificar. Detalle en `docs/adr/0009` y en
  `src/core/ui/iconos/LEEME.md`. Falta confirmar que esa es la fuente que quieren.

## 6 · Contraste del estado «escalada»

El texto `#a16207` sobre el fondo `#fef3c7` da **4,42:1**; WCAG 1.4.3 pide 4,5:1 para texto de
12 px. Es el único de los nueve estados que no pasa, y por poco.

No se cambió, porque el color se corrige primero en Figma. La prueba
`src/styles/tokens.test.js` lo tiene como falla conocida (`it.fails`) y avisará cuando se ajuste.

**Propuesta:** `estado/escalada/texto` = `#955a06` (5,04:1), que conserva el tono, o `#854d0e`
(6,15:1). Se cambia en Figma y en `tokens.css`.

## 7 · Service worker propio o con Workbox

`src/sw.js` hace el precaché con la API Cache Storage, sin importar `workbox-precaching` ni
`workbox-routing`, porque no están en la lista de dependencias aprobadas (ver `docs/adr/0008`).
Funciona y está verificado, pero son unas 70 líneas propias en lugar de una librería probada.

**Si prefieren Workbox:** aprobar esas dos dependencias; el cambio es de pocas líneas.

## 8 · Versión de Node y de jsdom

El equipo donde se armó el entorno tiene Node 24.14.0. jsdom 30 exige Node 24.15 o superior, así
que se instaló jsdom 29.1, que sí es compatible. No afecta nada más: jsdom solo se usa en las
pruebas. Al actualizar Node a la versión 24 vigente se puede subir a jsdom 30.

## 9 · Estados de interacción que Figma no dibuja

Figma define `primario-hover`, pero no el `hover` de los demás botones ni el estado presionado.
Solo se implementó el del botón primario. El foco con teclado es un contorno de 2 px en el color
primario, que tampoco está dibujado pero lo exige la accesibilidad (WCAG 2.4.7).

## 10 · Textos que no están en Figma

Redactados en español de Colombia, con tuteo, para que los revisen:

- Aviso de nueva versión: «Hay una versión nueva de la aplicación. Actualiza para usarla.»,
  con los botones «Actualizar» y «Ahora no».
- Página no encontrada: «No encontramos esta página» · «Revisa la dirección o vuelve al inicio.»
  · «Ir al inicio».
- App de prueba del Sprint 0 (se reemplaza en el Sprint 1): «Estamos construyendo la aplicación.
  El ingreso llega en el Sprint 1.»
- Manifiesto: nombre «Novedades Grupo Central», nombre corto «Novedades».

## 11 · Peso de la ruta de ingreso (RNF-05)

Presupuesto: 200 KB comprimidos. Medido el 6 oct 2026 con el build de producción:

| Parte                                                         | Comprimido   |
| ------------------------------------------------------------- | ------------ |
| App de prueba del Sprint 0 (React, router y componentes base) | 85,2 KB      |
| CSS                                                           | 4,2 KB       |
| Fuente Public Sans                                            | 26,8 KB      |
| Registro del service worker                                   | 2,2 KB       |
| **Total del Sprint 0**                                        | **≈ 119 KB** |
| `@supabase/supabase-js`, que entra en el Sprint 1             | + 55,0 KB    |

Con el ingreso del Sprint 1 la ruta quedará cerca de 185 KB. Cabe, pero con poco margen: todo lo
que no sea del ingreso debe cargarse bajo demanda, y hay que medirlo en cada PR.

## 12 · Borde del botón secundario

El borde `#d6dbd3` sobre blanco da 1,41:1. WCAG 1.4.11 pide 3:1 para los límites de un control
cuando son lo único que lo identifica; aquí el botón se reconoce por su texto, así que no es un
incumplimiento claro. Se anota por si quieren oscurecerlo en Figma. Lo mismo pasa con el borde
punteado de «Pendiente de sincronizar» (`#94a3b8`, 2,56:1).
