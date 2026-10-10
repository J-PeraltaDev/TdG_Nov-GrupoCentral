# Sprint 3 · Guion de la demo

Para la review con el cliente. Dura unos 20 minutos. Muestra el incremento del sprint: **el ciclo
completo de una novedad, con escalamiento y cierre confirmado** (registrar → tomar → escalar →
aprobar → resolver → confirmar), qué pasa cuando **la falla persiste**, y un **administrador que
crea una cuenta, le recupera la contraseña y administra las fincas**.

## Antes de empezar

- **Dónde:** la vista previa de Cloudflare Pages de la rama que tenga todo el sprint
  (`docs/S3-informe` o `feat/RF-02-recuperar-contrasena`), o `npm run build && npm run preview` en
  el equipo. Usa «staging», nunca producción.
- **Usuarios de prueba** (`@novedades.test`), con la contraseña que definió el equipo:
  `reportante.01`, `aprobador.mantenimiento`, `director` y `administrador`.
- **«staging» limpio:** avisarle al compañero y correr, en este orden, `npm run staging:reset`,
  `npm run staging:usuarios` y `npm run staging:functions`. Quita las novedades, las fincas y los
  usuarios que dejaron las pruebas, y carga los cuatro tipos de falla de prueba. Las funciones se
  despliegan de nuevo por si la rama cambió; el `reset` no las borra.
- **Cuatro ventanas,** con la sesión ya iniciada: una angosta, como un teléfono (360 px), para el
  reportante, y tres anchas para el aprobador, el director y el administrador. Una quinta, de
  incógnito y sin sesión, para la persona que olvidó su contraseña.
- **Tres novedades registradas de antemano** con el reportante, todas para Mantenimiento, y
  dejadas así, para no gastar la demo esperando:

  | Para mostrar      | Prioridad | Descripción sugerida                             | Cómo dejarla                      |
  | ----------------- | --------- | ------------------------------------------------ | --------------------------------- |
  | El ciclo completo | Alto      | La bomba de riego del lote 4 no enciende         | Asignada (recién registrada)      |
  | Rechazar          | Normal    | Se pide cambiar todas las luminarias del empaque | Tomada y **escalada** por el área |
  | La falla persiste | Crítico   | El biométrico de la entrada no deja marcar       | Tomada y **resuelta** por el área |

- **Un correo para la cuenta de la demo,** que no exista todavía: por ejemplo
  `demo.reportante@novedades.test`. Un usuario no se puede borrar: al terminar se desactiva, o se
  va con el siguiente `staging:reset`.

## 1. El punto de partida (1 min)

> «En el Sprint 2 el área ya atendía: tomaba, rechazaba, reasignaba, escalaba y resolvía. Pero una
> novedad escalada se quedaba esperando a alguien que no tenía pantalla, y una resuelta nunca se
> cerraba. Hoy se cierran las dos puntas, y además la aplicación ya se administra sola.»

## 2. El ciclo completo (7 min)

1. **Registrar** (ya está hecho). En la ventana del reportante, «Mis novedades»: la de la bomba,
   «Asignada».
2. **Tomar y escalar.** En la ventana del aprobador, abrir la novedad → «Tomar para atención» →
   «Escalar al director». Justificación: «El motor se quemó; hay que comprar uno nuevo.» Queda
   «Escalada», en la pestaña «En espera».
3. **El director decide.** En su ventana, «Novedades escaladas»:
   - Los tres contadores: «Esperan tu decisión», «Aprobadas este mes» y «Rechazadas este mes».
   - Cada tarjeta trae la justificación del área y quién escaló: no hay que abrir nada para
     entender qué se pide.
   - «Revisar y decidir» en la de la bomba. En el panel «Tu decisión»: elegir **Aprobar**, escribir
     «Comprar con el proveedor habitual» (es opcional) y «Confirmar decisión». Sale «Novedad
     aprobada. Vuelve a Mantenimiento para ejecutar la solución.» y el contador de aprobadas sube.
4. **El área ejecuta.** En la ventana del aprobador, la novedad está «Aprobada», con la
   observación del director a la vista. «Registrar solución»: «Se instaló el motor nuevo y se
   probó el riego.», tipo de falla «Riego» (o el que sugiera) → «Marcar como resuelta».
5. **La finca confirma.** En la ventana del reportante, la novedad está en «Por confirmar».
   Abrirla: ve la solución. «Confirmar cierre» → «¿Confirmas que la novedad quedó resuelta?», con
   una observación opcional → confirmar. Queda **«Cerrada»**, sin más acciones.
6. Mostrar la **línea de tiempo** completa: registrada, asignada, en atención, escalada, aprobada,
   resuelta y cerrada, cada paso con quién y cuándo.

> «Esto es lo que hoy son un mensaje de WhatsApp, un memorando al director, una llamada para
> saber si aprobó y otra para saber si quedó bien. Aquí es una sola novedad, y nadie la cierra por
> la finca.»

## 3. Rechazar lo escalado (2 min)

En la ventana del director, la de las luminarias → «Revisar y decidir» → **Rechazar**.

- Sin observación, «Confirmar decisión» responde «Escribe la observación para rechazar»: rechazar
  sin decir por qué no se puede.
- Escribir «No hay presupuesto este trimestre; se revisa en enero.» y confirmar. Queda
  «Rechazada»: «El área y la finca verán tu observación.»
- En la ventana del reportante: la novedad está rechazada, con la razón en la línea de tiempo.

## 4. La falla persiste (2 min)

En la ventana del reportante, abrir la del biométrico, que el área dejó «Resuelta».

- «La falla persiste». Sin texto, «Devolver a atención» no se activa.
- Escribir «Sigue sin leer las huellas de dos trabajadores.» → «Devolver a atención». Sale
  «Novedad devuelta a Mantenimiento. Vuelve a estar En atención.»
- En la ventana del aprobador: volvió a su pestaña «En atención», con lo que escribió la finca. La
  solución anterior quedó en el historial; la novedad espera una nueva.

> «La novedad no se cierra porque el área diga que la resolvió, sino cuando la finca lo confirma.
> Si no quedó bien, vuelve al mismo responsable, con su historia completa.»

## 5. El administrador: una cuenta nueva (3 min)

En la ventana del administrador, que entra a «Usuarios».

1. La lista: búsqueda, filtros por rol y estado, y el último ingreso de cada uno.
2. «Nuevo usuario»: nombre, el correo de la demo, **«Generar»** la contraseña inicial, rol
   «Reportante» y su finca. Mostrar que al elegir «Aprobador de área» el formulario pide el área
   en lugar de la finca. «Guardar usuario»: «Usuario creado. Entrégale su contraseña inicial.»
3. Mostrar que la fila propia dice «Tu cuenta» y no se puede desactivar: siempre queda un
   administrador.

> «El correo es solo el nombre de la cuenta: la plataforma no envía mensajes. Por eso la
> contraseña inicial la entrega el administrador, y por eso recuperar una contraseña pasa por él.»

## 6. Recuperar una contraseña (4 min)

1. **La persona.** En la ventana sin sesión, en el ingreso: «¿Olvidaste tu contraseña?». Escribir
   el correo de la demo → «Enviar solicitud» → «Solicitud enviada». Decir que con un correo que no
   existe la pantalla responde exactamente lo mismo: nadie puede usarla para averiguar quién tiene
   cuenta.
2. **El administrador.** En su menú apareció una insignia junto a «Recuperación de contraseñas».
   Abrirla: la solicitud está en «Pendientes». «Generar código»: el diálogo muestra el código
   **una sola vez**, con «Copiar», hasta cuándo sirve y «Verifica la identidad de la persona antes
   de entregarlo». «Listo»: el código desaparece y la solicitud queda con «Código generado».
3. **La persona otra vez.** «Ingresar código»: el correo ya viene puesto. Escribir primero un
   código equivocado: lo dice y deja corregirlo. Escribir el correcto y una contraseña nueva; las
   dos reglas se van marcando mientras se escribe. «Guardar contraseña» → vuelve al ingreso con
   «Contraseña actualizada. Ya puedes ingresar.» → ingresar con la nueva.
4. Volver a `/recuperar/codigo` con el mismo código: «El código venció. Pide uno nuevo al
   administrador.» Un código sirve una vez, dura 30 minutos y admite cinco intentos.

> «El administrador nunca conoce la contraseña de nadie, y el código no queda guardado en ningún
> lado: en la base de datos solo hay un resumen que ni él puede leer.»

## 7. Fincas (2 min)

En la ventana del administrador, «Fincas».

- La lista, con las novedades abiertas y los reportantes de cada una.
- «Nueva finca»: nombre «Finca de la demo» y su razón social → «Guardar finca». Intentar crearla
  otra vez con el mismo nombre en la misma razón social: no deja.
- Desactivarla: «¿Desactivar la finca…?». Mostrar, sin confirmar, el diálogo de una finca con
  novedades abiertas: dice cuántas tiene y qué pasa con ellas.

> «Una finca desactivada no recibe novedades nuevas, pero conserva su historial y las que tenía
> abiertas siguen su curso.»

## 8. Lo que no se ve, pero está (1 min)

- **Si a alguien lo desactivan con la aplicación abierta,** deja de ver datos de inmediato y, al
  volver a la pestaña, queda en el ingreso con el aviso de usuario desactivado. Se puede mostrar
  desactivando la cuenta de la demo mientras tiene la sesión abierta.
- **Quien decide es la base de datos, no la pantalla:** el director no puede generar códigos ni
  ver las solicitudes aunque conozca la dirección, y sin sesión no se puede leer nada.
- **En el teléfono,** el director y el administrador abren «Cuenta» desde su avatar, arriba a la
  derecha: su barra inferior no la trae. Ahí está «Cerrar sesión» y, para el administrador,
  Fincas, Tipos de falla y Recuperación de contraseñas.
- **Cada decisión quedó en el historial,** que no se edita ni se borra, y generó su aviso. La
  pantalla de avisos llega en el Sprint 5.

## 9. Cierre (1 min)

> «Con esto el ciclo de una novedad está completo, de la finca al director y de vuelta, y la
> aplicación se puede administrar sin tocar la base de datos. Lo que sigue es lo más difícil: que
> el registro funcione donde no hay señal, y las fotos.»

## Preguntas que conviene llevar

1. Al rechazar, la observación del director la ven el área **y** la finca. ¿Está bien, o hay
   razones que la finca no debería leer?
2. Cuando la falla persiste, la novedad vuelve a quien la tenía. ¿O debería volver a la bandeja,
   para que la tome cualquiera del área?
3. El código de recuperación dura 30 minutos y admite cinco intentos. ¿Alcanza, pensando en que
   se entrega por teléfono?
4. ¿Quiénes van a ser administradores, además de la cuenta inicial?
5. La política de tratamiento de datos es un borrador: ¿quién la revisa en la empresa y qué datos
   de contacto del responsable van?

## Si algo falla en la demo

- **Una acción responde «La novedad cambió de estado»:** alguien la movió en otra ventana. Se
  recarga sola; seguir con lo que muestre.
- **«Generar código» responde «Esta solicitud ya no está disponible»:** la solicitud se usó, venció
  o su usuario fue desactivado. La lista se recarga; la persona pide otra desde el ingreso.
- **El ingreso dice «Demasiados intentos»:** Auth limita los ingresos por dirección. Esperar unos
  minutos; por eso conviene tener las ventanas con la sesión ya iniciada.
- **La insignia no aparece:** se cuenta al entrar, cada minuto y al abrir la pantalla 32. Abrir
  «Recuperación de contraseñas» la actualiza.
- **Crear el usuario responde «Este correo ya está registrado»:** quedó de un ensayo anterior.
  Usar otro correo.
