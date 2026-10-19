# Sprint 5 · Guion de la demo

Para la review con el cliente; en la de este sprint participa la asesora. Dura unos 30 minutos.

**El incremento:** el director abre la matriz finca × tipo de falla y salta al historial filtrado.
También se muestra:

- la exportación a CSV;
- el ciclo de un aviso entre la finca y el área, con un push en un teléfono;
- el administrador que depura el catálogo de tipos de falla, y el panel que lo refleja.

Es la versión 1.0.

## Antes de empezar

- **Dónde:**
  - **La vista previa de Cloudflare Pages de este informe**, que usa «staging».
    - Para que salga 10-B, Pages necesita `VITE_VAPID_PUBLIC_KEY` en **Preview**, con la clave
      pública de «staging» (paso 11 de
      [`produccion-v1.0.md`](../despliegue/produccion-v1.0.md)), y un build nuevo después de
      ponerla.
    - Sin la variable, todo lo demás se muestra igual y el push se salta.
  - **Un teléfono Android con Chrome**, con la aplicación instalada desde la vista previa, para el
    reportante y el push. El push necesita `https`: la vista previa sirve, `localhost` en el
    teléfono no.
  - **Un portátil con tres ventanas** (perfiles distintos de Chrome o ventanas de incógnito, para
    que no compartan la sesión): director, aprobador de Mantenimiento y administrador.
  - `npm run dev` no sirve: no tiene service worker ni push. Sin vista previa, usar
    `npm run build && npm run preview`, sin el push en el teléfono.
- **Usuarios de prueba** (`@novedades.test`), con la contraseña que definió el equipo:
  - `reportante.01` en el teléfono y `reportante.03` (solo para preparar);
  - `aprobador.mantenimiento` y `aprobador.sistemas`;
  - `director` y `administrador`.
- **«staging» limpio:**
  - avisarle al compañero;
  - correr, en este orden, `npm run staging:reset`, `npm run staging:usuarios` y
    `npm run staging:functions`;
  - vaciar el bucket `evidencias` desde el panel de Supabase (Storage).

  El reset no borra Vault ni los secretos de las funciones: el push sigue configurado.

- **Las novedades de antemano.** El seed no trae novedades, y la matriz solo cuenta resueltas y
  cerradas. Se registran con la aplicación, con red, el mismo día de la demo (así todo cae en «Mes
  actual»). Toma unos 15 minutos.

  | N.º | Reportante | Área          | Descripción sugerida                               | Cómo dejarla                                                                         | Tipo de falla al resolver                                      |
  | --- | ---------- | ------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
  | 1   | 01         | Mantenimiento | La bomba del pozo 2 no arranca                     | Tomada, resuelta y **cerrada** por la finca                                          | «Bomba de riego» (escribirlo: es nuevo)                        |
  | 2   | 01         | Mantenimiento | La bomba del lote 4 bota agua por el sello         | Tomada, resuelta y **cerrada**                                                       | «Bomba de riego» (elegir la sugerencia)                        |
  | 3   | 03         | Mantenimiento | La bomba del canal no enciende                     | Tomada, resuelta y **cerrada**                                                       | «Bombas de riego» (escrito distinto **a propósito**: es nuevo) |
  | 4   | 01         | Sistemas      | El lector biométrico de la portería no lee huellas | Tomada, resuelta y **cerrada**                                                       | «Torniquetes» (**el error** que se corrige en la demo)         |
  | 5   | 03         | Sistemas      | No hay internet en la oficina de la finca          | Tomada y **escalada** («Hay que cambiar el radioenlace»); el director la **aprueba** | —                                                              |
  | 6   | 01         | Mantenimiento | La puerta del cuarto de químicos no cierra         | **Asignada** (recién registrada)                                                     | —                                                              |
  | 7   | 01         | Mantenimiento | El rodillo del cable vía del lote 5 está suelto    | **Asignada**                                                                         | —                                                              |

- **Antes de entrar a la sala:**
  - el teléfono, con la sesión del reportante, **sin abrir todavía «Avisos»** (para que 10-B salga
    en la demo);
  - en el portátil, las tres sesiones ya iniciadas.

## 1. El punto de partida (1 min)

> «Hasta el Sprint 4, cada persona hacía su parte: la finca reporta, el área atiende y el director
> decide, también sin señal. Lo que faltaba era ver el proceso de lejos: qué está abierto, cuánto
> se demora, qué se repite. Y que cada uno se entere de lo que le toca sin estar preguntando.»

## 2. El director: el panel (6 min)

En la ventana del director, **«Panel de reportes»**.

1. **«Novedades abiertas»**:
   - las tarjetas, las abiertas por área y por estado, y la tabla de todas las fincas;
   - «Datos al …» dice de cuándo son las cifras, y «Actualizar» las trae de nuevo;
   - tocar un área lleva al historial con sus abiertas. Volver.
2. **«Tiempos de atención»**: el promedio por área desde que la finca registró hasta la solución,
   la evolución por mes y «Abiertas con más tiempo».
3. **«Escalamiento»**:
   - qué parte de lo registrado llegó al director, por área;
   - las decisiones (aprobadas, rechazadas, en espera);
   - la escalada de Sistemas (5), aprobada.
4. **«Fallas recurrentes»**, con «Mes actual»:
   - la matriz: las fincas en las filas, los tipos de falla en las columnas;
   - el color de cada celda crece con la cantidad, y cada celda dice su número;
   - a la derecha, «Combinaciones más repetidas».

   Aparecen dos columnas que deberían ser una: «Bomba de riego» y «Bombas de riego». Se arregla en
   el paso 5.

5. **El incremento:** tocar la celda **Finca de prueba 01 × Bomba de riego**.
   - Abre el **historial ya filtrado**: esa finca, ese tipo, resueltas y cerradas, y el período del
     panel. Están las dos novedades (1 y 2).
   - Los filtros se ven como chips y se quitan uno a uno. Quitar el del tipo: aparecen todas las
     resueltas y cerradas de la finca.

> «Antes, saber qué se repite en qué finca era revisar memorandos a mano. Ahora es una celda, y
> detrás de la celda están las novedades con su historia completa.»

## 3. El historial y el CSV (4 min)

Todavía en la ventana del director, en el historial.

1. Los filtros: finca, área, estado (o «Abiertas»), rango de fechas y tipo de falla. «Aplicar
   filtros» los lleva a la dirección: el enlace se puede guardar o compartir y abre lo mismo.
2. Con un rango invertido (el «Desde» después del «Hasta»), «Aplicar» no se deja usar y lo dice
   (21-B).
3. **«Exportar CSV»**: descarga `historial-novedades-AAAA-MM-DD.csv` con **todo el resultado**,
   no solo la página que se ve.
4. **Abrir el archivo en Excel.**
   - Las tildes se ven bien.
   - Las columnas: código, fincas, área, estados con su nombre, «Registrada en finca», la fecha de
     ejecución y las horas hasta la resolución.
   - El separador es el punto y coma (la pregunta 1 del final).
5. Opcional: el buscador por código de la barra (`NOV-0004` o solo `4`) abre esa novedad desde
   cualquier pantalla.

> «Lo que el director necesite llevar a un informe sale con los mismos filtros que está viendo.»

## 4. El ciclo de un aviso, con el push en el teléfono (8 min)

**En el teléfono del reportante:**

1. Abrir **«Avisos»**. Sale 10-B, «Activa las notificaciones», con el texto del reportante. Tocar
   **«Activar notificaciones»** y aceptar el permiso del navegador.
2. Cerrar la aplicación del todo (quitarla de las recientes) y bloquear el teléfono.

**En la ventana del aprobador de Mantenimiento:**

3. Bandeja → la novedad 6 (la puerta) → **«Tomar para atención»**.

**En el teléfono, con la pantalla bloqueada:**

4. Llega el push:
   - el título es el código y el estado (por ejemplo, «NOV-0006 · En atención»);
   - el cuerpo dice «Mantenimiento tomó tu novedad para atención.»;
   - **no lleva la descripción**, que se vería en la pantalla bloqueada.
5. Tocarlo: abre esa novedad. El aviso queda leído y la insignia de «Avisos» baja.

**De vuelta en la ventana del aprobador:**

6. «Registrar solución» en la misma novedad («Se ajustaron las bisagras y el pestillo», tipo
   «Puertas y cerraduras», nuevo).

**En el teléfono:**

7. Otro push y, en «Avisos», «Mantenimiento registró la solución. Confirma si quedó resuelta.».
   Tocarlo, revisar la solución y **«Confirmar cierre»**.

**En la ventana del aprobador:**

8. La campana tiene una insignia nueva: «La finca Finca de prueba 01 confirmó el cierre.». Abrir el
   aviso: lleva a la novedad, que ya está **Cerrada**, con «Volver a los avisos».

> «Nadie tuvo que llamar ni escribir por WhatsApp para preguntar cómo iba. Cada uno se entera de
> lo suyo, y solo de lo suyo: el aprobador de Sistemas no recibió nada.»

Si el push no llega, el ciclo se muestra igual con los avisos dentro de la aplicación: el push es
un aviso más, no el único.

## 5. El administrador depura el catálogo (4 min)

En la ventana del administrador.

1. **«Avisos»** tiene «Se creó el tipo de falla «Bombas de riego»; revísalo en el catálogo.»:
   cada tipo nuevo que escribe un aprobador le llega al administrador.
2. **«Tipos de falla»**: «Bomba de riego» con 2 novedades y «Bombas de riego» con 1.
3. **«Fusionar»**: origen «Bombas de riego», destino «Bomba de riego». Antes de confirmar dice qué
   va a pasar: «La novedad de «Bombas de riego» pasará a «Bomba de riego», que quedará con 3.
   «Bombas de riego» saldrá de la lista.» → «Fusionar» → «Tipos de falla fusionados.».
4. En el registro de cambios queda quién lo hizo y cuándo.
5. **El panel lo refleja:** el administrador también entra al panel. «Fallas recurrentes» →
   «Actualizar». Queda una sola columna, «Bomba de riego», con la Finca de prueba 03 incluida.
6. Opcional: «Renombrar» y «Desactivar». Un tipo desactivado deja de sugerirse, pero sus novedades
   lo conservan.

> «El catálogo se llena con lo que escriben los aprobadores. El administrador lo ordena sin perder
> nada: las novedades pasan al tipo correcto y queda el registro.»

## 6. Corregir el tipo de una novedad cerrada (2 min)

1. En la ventana del administrador, abrir la novedad 4 (el lector biométrico). Está **Cerrada**,
   con el tipo «Torniquetes».
2. **«Corregir tipo»**, junto al tipo de falla → «Biométrico» → «Corregir».
3. En la línea de tiempo aparece **«Tipo de falla corregido»**, con «"Torniquetes" → "Biométrico"»
   y quién lo hizo. El estado no cambia: sigue Cerrada.

> «Una novedad cerrada no se reabre para arreglar un dato, pero el error tampoco se queda: se
> corrige y queda escrito.»

## 7. Lo que no se ve, pero está (2 min)

- **Cada uno ve lo suyo.**
  - El aprobador solo ve en el historial las novedades de su área, y no exporta el CSV.
  - La finca solo ve las suyas.
  - El panel es del director y del administrador.

  Lo controla la base de datos, no la pantalla.

- **El CSV no ejecuta nada:** si una descripción empieza con `=`, Excel no la toma como fórmula.
- **El push no lleva la descripción,** que es texto libre. Al cerrar sesión, el teléfono deja de
  recibirlos: otra persona en el mismo teléfono no ve los avisos de la anterior.
- **El panel y el historial necesitan conexión;** lo que se consulta sin señal es lo del Sprint 4.

## 8. La versión 1.0 (2 min)

- Los 32 requerimientos del SRS están construidos (ver el informe,
  [`S5.md`](S5.md)), y la producción se publica con la lista de
  [`produccion-v1.0.md`](../despliegue/produccion-v1.0.md).
- **Lo que sigue es la validación (Objetivo 4):**
  - cargar las fincas y las cuentas reales, después de aprobar la política de datos;
  - probar en los teléfonos de las fincas;
  - el piloto;
  - el manual de usuario.

> «La aplicación ya hace todo lo que se pidió. Lo que falta es ponerla en manos de las fincas y
> medir si cambia el proceso.»

## Preguntas que conviene llevar

1. **El separador del CSV** es el punto y coma, el que espera Excel con la configuración de
   Colombia (cambio 32). ¿Así abre bien en sus equipos, o prefieren coma?
2. **El push sin la descripción:** ¿alcanza con el código, el estado y el texto del aviso, o
   necesitan saber de qué se trata sin abrir la aplicación?
3. **¿Qué miran primero en el panel?** Sirve para el orden de las pestañas y para el piloto.
4. **Los períodos** (mes actual, 3, 6 y 12 meses, personalizado): ¿alcanzan?
5. **El catálogo de tipos de falla:** ¿quién lo depura, y cada cuánto?
6. **El administrador entra al panel** (cambio 35): ¿está bien, o el panel es solo del director?
7. **Para el piloto:** qué fincas, cuántas personas y qué teléfonos. Si hay iPhone, el push
   necesita la aplicación agregada a la pantalla de inicio.
8. **El manual de usuario:** ¿impreso, en PDF o dentro de la aplicación?

## Si algo falla en la demo

- **No sale 10-B:**
  - ya se ofreció en ese teléfono, o el permiso ya está decidido: activarlas desde «Cuenta», en
    «Notificaciones en este dispositivo»;
  - si «Cuenta» dice que el navegador no las permite, la vista previa no tiene
    `VITE_VAPID_PUBLIC_KEY`: el push se salta.
- **El push no llega:**
  - el ahorro de batería de Android puede retrasarlo: abrir Chrome una vez y repetir;
  - si sigue sin llegar, los avisos dentro de la aplicación muestran el mismo ciclo.
- **La matriz sale vacía:** el período no incluye las novedades preparadas. Elegir «Mes actual» o
  «Personalizado» con el día de hoy.
- **El CSV abre en una sola columna:** Excel usa la coma en ese equipo. Es justo la pregunta 1:
  se abre con «Datos → Desde texto» eligiendo el punto y coma.
- **El panel no cambia después de fusionar:** tocar «Actualizar»; las cifras son las de «Datos
  al …».
- **El ingreso dice «Demasiados intentos»:** Auth limita los ingresos. Esperar unos minutos; por
  eso conviene tener las sesiones ya iniciadas.
