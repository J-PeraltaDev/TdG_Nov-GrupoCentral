# Sprint 4 · Guion de la demo

Para la review con el cliente. Dura unos 25 minutos. Muestra el incremento del sprint: **registrar
en modo avión, cerrar la aplicación, volver con red y ver la novedad sincronizada**, con su código,
su fecha real y sin duplicado. También muestra qué se puede consultar sin señal, qué acciones se
bloquean y por qué, y las fotos.

## Antes de empezar

- **Dónde:**
  - Lo mejor es un **teléfono Android con la aplicación instalada** desde la vista previa de
    Cloudflare Pages de este informe (#38), que usa «staging». El modo avión se ve mejor en un
    teléfono que en cualquier simulación.
  - Para el aprobador y el director, dos ventanas anchas en un portátil. La red se corta con
    DevTools (Network → Offline) o apagando el wifi.
  - `npm run dev` no sirve para esta demo: no tiene service worker y no abre sin red. Si no hay
    vista previa, usar `npm run build && npm run preview`.
- **Usuarios de prueba** (`@novedades.test`), con la contraseña que definió el equipo:
  `reportante.01` (en el teléfono y en una ventana angosta del portátil, para 05-D),
  `aprobador.mantenimiento` y `director`. Para el paso opcional, también `administrador`.
- **«staging» limpio:**
  - avisarle al compañero;
  - correr, en este orden, `npm run staging:reset`, `npm run staging:usuarios` y
    `npm run staging:functions`;
  - vaciar el bucket `evidencias` desde el panel de Supabase (Storage), porque el reset no borra
    los archivos.
- **Tres novedades registradas de antemano** con el reportante, todas para Mantenimiento y con
  red:

  | Para mostrar         | Prioridad | Descripción sugerida                       | Cómo dejarla                      |
  | -------------------- | --------- | ------------------------------------------ | --------------------------------- |
  | El aprobador sin red | Alto      | La bomba del lote 4 no enciende            | Asignada (recién registrada)      |
  | La finca sin red     | Normal    | La puerta del cuarto de químicos no cierra | Tomada y **resuelta** por el área |
  | El director sin red  | Crítico   | Hay que cambiar el techo de la empacadora  | Tomada y **escalada** por el área |

- **Descargar con red, antes de empezar.** Lo que no se abrió con red no está sin red (3a).
  - El reportante abre «Mis novedades» y el detalle de la resuelta.
  - El aprobador abre su bandeja y el detalle de la asignada.
  - El director abre «Novedades escaladas» y el detalle de la escalada.
- **Un archivo que no sea imagen** en el portátil (un PDF), para 05-D. En el teléfono el selector
  solo muestra imágenes.

## 1. El punto de partida (1 min)

> «Hasta el Sprint 3 todo el ciclo funcionaba, pero con conexión. En las fincas la señal va y
> viene, y hoy un reporte sin señal se queda en el WhatsApp de alguien. Desde este sprint, el
> teléfono guarda la novedad y la envía solo cuando vuelve la señal.»

## 2. En modo avión: lo que se puede ver (4 min)

En el teléfono del reportante, activar el **modo avión**.

1. El indicador de arriba pasa a **«Sin conexión»**. No hay que recargar nada.
2. «Mis novedades» sigue ahí (04-B), con el aviso «Estás viendo lo descargado hoy …»: la
   aplicación dice de cuándo son los datos.
3. Abrir la resuelta. Se ve el detalle, con «Datos del …». Los botones «Confirmar cierre» y «La
   falla persiste» siguen a la vista, con un candado y el aviso (09-D): «Confirmar o devolver la
   novedad necesita internet, porque depende de su estado actual en el servidor.» Tocarlos no hace
   nada.

> «Consultar se puede sin señal. Cambiar el estado, no: el teléfono no sabe si el área ya la movió,
> y una novedad no puede tener dos versiones.»

## 3. Registrar sin señal (3 min)

Todavía en modo avión, «Registrar».

1. Arriba sale el aviso de 05-B: «La novedad se guardará en este teléfono y se enviará sola cuando
   vuelva el internet.»
2. Las fotos no están disponibles: «Las fotos necesitan conexión. Podrás adjuntarla desde el
   detalle cuando la novedad se sincronice.»
3. Llenar la novedad: «El rodillo del cable vía del lote 5 está suelto.», prioridad Normal y
   Mantenimiento. «Guardar en el dispositivo».
4. Sale 07, **«Guardada en este teléfono»**, con un código local (`LOC-…`) que todavía no es el
   `NOV-`. El indicador dice «Sin conexión · 1 pendiente».
5. Tocar el indicador (o «Ver pendientes (1)»): 08, «Pendientes de sincronizar», con la novedad
   «En espera de conexión».

**Anotar la hora.** Para que el detalle diga «registrada sin conexión», la sincronización tiene
que llegar más de 5 minutos después: los pasos 4 y 5 dan ese tiempo.

## 4. Cerrar la aplicación (1 min)

Cerrarla del todo (quitarla de las recientes) y volver a abrirla desde el ícono, **todavía en modo
avión**.

- Abre sin red, en «Mis novedades».
- La pendiente sigue ahí, sin código y marcada «Pendiente de sincronizar», y el indicador la
  cuenta.

> «Lo que se guarda en el teléfono no depende de que la aplicación siga abierta.»

## 5. El área y el director sin red (3 min)

En la ventana del aprobador, cortar la red.

1. La bandeja sigue ahí (11-B): «Bandeja descargada hoy … Las acciones se habilitan al volver el
   internet.»
2. Abrir la asignada. Arriba sale el aviso de 14-B: «Puedes consultar, pero tomar, rechazar,
   escalar, aprobar, resolver, cerrar y reasignar necesitan internet, porque dependen del estado
   actual en el servidor.» Las acciones están con candado y «Se habilitan al volver la conexión».
3. Volver a conectar: el candado se va. «Tomar para atención» → «Novedad tomada. Ya está En
   atención.»

En la ventana del director, cortar la red y abrir la escalada: el mismo aviso, y la decisión no se
puede confirmar. Volver a conectar.

## 6. Vuelve la señal (3 min)

En el teléfono, **desactivar el modo avión**, con la aplicación abierta.

1. El indicador pasa por «En línea · sincronizando» y queda «En línea». No hubo que tocar nada.
2. En 08: «Todo está sincronizado», y la novedad dice «Enviada · código NOV-…».
3. En «Mis novedades» ya tiene su código. Abrirla:
   - **«Registrada en finca»** es la hora que se anotó en el paso 3, no la de ahora;
   - **«Sincronizada»** es la de ahora;
   - en la línea de tiempo, la primera entrada dice «registrada sin conexión».
4. En la ventana del aprobador, la bandeja tiene la novedad **una sola vez**.

> «La novedad llega con la hora en que la persona la vio en la finca, no con la hora en que volvió
> la señal. Así los tiempos de atención no salen falseados. Y aunque el envío se repita, el
> servidor la reconoce: no hay duplicados.»

## 7. Las fotos (4 min)

Con red, en el teléfono del reportante.

1. «Registrar», una novedad cualquiera para Mantenimiento. En «Foto», **«Tomar foto»**: se abre la
   cámara. Al volver, la miniatura dice «Reducida a … KB»: la foto se achica en el teléfono antes
   de subirla, para gastar menos datos.
2. «Enviar novedad» → 06, «Novedad recibida» → «Ver novedad». La foto está en «Evidencias» y se
   abre completa.
3. «Adjuntar foto» desde el mismo detalle: caben hasta 3.
4. En la ventana del reportante del portátil, «Registrar» → «Elegir de la galería». En el diálogo,
   cambiar el filtro a «Todos los archivos» y elegir el PDF: «El archivo no es una imagen o supera
   el tamaño permitido. Elige otra foto.» (05-D).

**Las fotos de la solución** (lo pidió el equipo durante el sprint; no está en Figma). En la
ventana del aprobador, la novedad que tomó en el paso 5: «Registrar solución», con «Fotos de la
solución». Elegir una, completar y «Marcar como resuelta». En el detalle la foto queda dentro de la
solución, y la finca la ve antes de confirmar el cierre.

## 8. Una pendiente que el servidor rechaza (opcional, 3 min)

Muestra qué pasa si al llegar la novedad ya no se puede registrar (CU-22 4b).

1. En el teléfono, modo avión y registrar otra novedad.
2. En la ventana del administrador, «Fincas»: desactivar «Finca de prueba 01». Pide confirmar y
   dice cuántas novedades abiertas tiene.
3. Quitar el modo avión. En 08 la novedad queda **«Error al enviar»**, con el motivo: «Tu usuario
   no tiene una finca asignada.» No se pierde.
4. Reactivar la finca en la ventana del administrador. En el teléfono, «Reintentar»: se envía.

Si algo no sale como se espera, se salta: lo cubren las pruebas automáticas.

## 9. La sesión vencida (1 min)

08-B sale cuando, al volver la señal, la sesión del teléfono ya no sirve y no se puede renovar;
por ejemplo, si la cuenta se cerró en el servidor. En vivo no se puede provocar de forma segura. Se
muestra la captura `evidencias/S4/rf22-08b-sesion-vencida-360.png`:

- arriba de las pendientes sale «Tu sesión venció»;
- debajo, «Ingresa de nuevo para enviar la novedad pendiente; sigue guardada en este teléfono.»;
- y el botón «Ingresar».

> «Aunque la sesión venza, lo que se registró en la finca no se pierde: espera a que la persona
> vuelva a ingresar.»

## 10. Lo que no se ve, pero está (1 min)

- **Un teléfono compartido** no mezcla pendientes: cada persona ve, cuenta y envía solo las suyas.
- **Dos pestañas abiertas** no envían dos veces: la sincronización corre en una sola.
- **Las fotos están en un espacio privado.** Cada foto se ve con un enlace que vence a los 5
  minutos. El servidor no deja pasar de 3 por novedad, ni archivos que no sean fotos o que pesen
  más de 1 MB.
- **Nada de lo que viene del servidor queda en la caché del navegador.** Lo descargado se guarda
  aparte, por usuario, y se borra si cambia el usuario o su rol.

## 11. Cierre (1 min)

> «Con esto la aplicación funciona donde están las fincas, con o sin señal, y la evidencia va con
> la novedad en lugar de quedarse en un chat. Lo que sigue son los reportes para el director, el
> historial y los avisos.»

## Preguntas que conviene llevar

1. **Las fotos de la solución:** las pidió el equipo, no están en el SRS. ¿Se quedan? ¿Alcanzan 3
   por solución?
2. **Tres fotos por novedad:** ¿alcanzan, pensando en cómo se reporta hoy por WhatsApp?
3. **«Registrada sin conexión»** se marca si la novedad tardó más de 5 minutos en llegar. ¿Les
   sirve ese umbral?
4. **Una pendiente que el servidor rechaza** solo la ve el reportante en su teléfono. ¿Debería
   enterarse alguien más?
5. **¿Qué teléfonos usan los reportantes?** Si hay iPhone, hay que probar en uno: Safari no se ha
   verificado sin red.
6. **¿Cuánto tiempo sin señal es normal** en las fincas más apartadas? Sirve para probar la cola
   con tiempos reales en el piloto.

## Si algo falla en la demo

- **El indicador sigue en «Sin conexión» con la red de vuelta:** la aplicación verifica cada
  15 s. Esperar unos segundos.
- **La línea de tiempo no dice «registrada sin conexión»:** la novedad llegó antes de 5 minutos.
  Es correcto; se explica con la hora de «Registrada en finca».
- **Sin red, una pantalla dice «La primera consulta necesita conexión»:** esa pantalla no se abrió
  con red antes (3a). Conectar, abrirla y volver a cortar.
- **«Tomar foto» no abre la cámara en el portátil:** usar «Elegir de la galería».
- **El ingreso dice «Demasiados intentos»:** Auth limita los ingresos por dirección. Esperar unos
  minutos; por eso conviene tener las ventanas con la sesión ya iniciada.
- **Una acción responde «La novedad cambió de estado»:** alguien la movió en otra ventana. Se
  recarga sola.
