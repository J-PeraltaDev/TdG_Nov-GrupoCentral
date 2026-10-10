# Sprint 2 · Guion de la demo

Para la review con el cliente. Dura unos 15 minutos. Muestra el incremento del sprint: **registrar
→ tomar → resolver con tipo de falla, todo visible en la línea de tiempo**, y además rechazar,
escalar y reasignar.

## Antes de empezar

- **Dónde:** la vista previa de Cloudflare Pages de la rama que tenga todo el sprint (o
  `npm run build && npm run preview` en el equipo). Usa «staging», nunca producción.
- **Usuarios de prueba** (`@novedades.test`), con la contraseña que definió el equipo:
  `reportante.01`, `aprobador.mantenimiento`, `aprobador.sistemas` y `director`.
- **«staging» limpio:** avisarle al compañero y correr `npm run staging:reset` y después
  `npm run staging:usuarios`. Quita las novedades que dejaron las pruebas y carga los cuatro tipos
  de falla de prueba («Biométrico», «Puentes y pasos», «Torniquetes» y «Red e internet»), para que
  el autocompletado tenga qué sugerir.
- **Dos ventanas:** una angosta, como un teléfono (360 px), para el reportante, y una ancha para
  el aprobador. Conviene tenerlas con la sesión ya iniciada.
- **Cuatro novedades registradas de antemano** con el reportante, todas para Mantenimiento, para
  no gastar la demo escribiendo:

  | Para mostrar | Prioridad | Descripción sugerida                                 |
  | ------------ | --------- | ---------------------------------------------------- |
  | El recorrido | Crítico   | El biométrico de la entrada no deja marcar la salida |
  | Rechazar     | Bajo      | Se necesitan dos cajas de guantes para la empacadora |
  | Escalar      | Alto      | La bomba de riego del lote 4 no enciende             |
  | Reasignar    | Normal    | No hay internet en la oficina desde esta mañana      |

## 1. El punto de partida (1 min)

En la ventana del reportante, abrir «Mis novedades»: ahí están las cuatro, todas «Asignada».

> «En el Sprint 1 el reportante registraba la novedad y recibía su código. Hasta ahí llegaba: del
> otro lado no había nadie. Hoy mostramos ese otro lado.»

## 2. La bandeja del área (2 min)

En la ventana del aprobador de Mantenimiento.

- Las tres pestañas con sus conteos: «Por atender», «En atención» y «En espera».
- El orden: primero la crítica, después la alta, la normal y la baja; dentro de cada prioridad, la
  más antigua.
- Cada fila dice el código, la finca, la prioridad, el estado y hace cuánto se registró.
- El filtro por finca y la vista previa de la derecha.

> «Esto reemplaza el grupo de WhatsApp: el área ve todo lo suyo, ordenado por lo que más urge.»

## 3. El recorrido: tomar y resolver (5 min)

1. Elegir la novedad del biométrico y abrir «Ver detalle completo». Mostrar los datos y la línea
   de tiempo: quién la registró y cuándo, y que el sistema la asignó a Mantenimiento.
2. **«Tomar para atención».** Sale el aviso «Novedad tomada. Ya está En atención.», cambia el
   estado, aparece «Tomada por…» y la línea de tiempo gana un paso. Cambian las acciones.
3. **«Registrar solución».**
   - «¿Qué se hizo?»: «Se actualizó el firmware del biométrico y se reinició el equipo.»
   - La fecha de ejecución ya trae la de hoy. Cambiarla a mañana y pulsar «Marcar como resuelta»:
     el sistema no la deja pasar. Devolverla a hoy.
   - Tipo de falla: escribir «biometrico», sin tilde. El sistema sugiere «Biométrico», lo marca
     con «Coincide» y no deja crear otro. (Sin el `staging:reset` no existe todavía: se crea ahí
     mismo, y se puede mostrar lo mismo con la segunda novedad que se resuelva.)
   - «Marcar como resuelta».
4. De vuelta en el detalle: «Resuelta», con la solución, el tipo de falla y la fecha.
5. En la ventana del reportante: la novedad está en «Por confirmar». Abrirla: ve la solución y toda
   la línea de tiempo.

> «El tipo de falla lo pone quien resuelve, no quien reporta, y el sistema evita que el mismo
> problema quede con dos nombres. Con eso se va a calcular qué fallas se repiten.»
>
> «La novedad queda resuelta, no cerrada: la cierra la finca cuando confirma. Eso llega en el
> Sprint 3.»

## 4. Las otras tres salidas (5 min)

**Rechazar.** Abrir la de los guantes → «Rechazar». Mostrar que sin motivo el botón no se activa.
Tocar «Es una solicitud de insumos», completar el motivo y confirmar. Queda «Rechazada» y ya no
tiene acciones. En la ventana del reportante: ve el motivo en la línea de tiempo.

**Escalar.** Abrir la de la bomba → «Tomar para atención» → «Escalar al director». Justificación:
«El motor se quemó; hay que comprar uno nuevo.» Queda «Escalada» y pasa a la pestaña «En espera».

> «Hoy eso es un memorando aparte. Aquí queda en la misma novedad, con su justificación. La
> pantalla del director para aprobar o rechazar es lo primero del Sprint 3.»

**Reasignar.** Abrir la del internet → «Reasignar». Se ven el área actual y el destino. Motivo: «Es
de la red; lo atiende Sistemas.» La novedad desaparece de la bandeja de Mantenimiento. Ingresar
como `aprobador.sistemas`: está en su bandeja, con la nota «Reasignada desde Mantenimiento».

## 5. Lo que no se ve, pero está (1 min)

- **Cada paso quedó en el historial**, que no se puede editar ni borrar.
- **Cada paso generó un aviso** para quien corresponde (la finca, el director, la otra área). La
  pantalla de avisos llega en el Sprint 5; por ahora quedan guardados.
- **Quien decide es la base de datos, no la pantalla:** un aprobador no puede actuar sobre una
  novedad de otra área aunque conozca su dirección. Se puede mostrar pegando en la ventana de
  Mantenimiento la dirección de la novedad reasignada: «No puedes ver esta novedad».
- **Si dos personas actúan a la vez**, la segunda recibe «La novedad cambió de estado» y ve cómo
  quedó.

## 6. Cierre (1 min)

> «El área ya puede atender. Faltan las dos puntas del ciclo: que el director decida lo escalado y
> que la finca confirme lo resuelto. Eso, y la administración de usuarios y fincas, es el
> Sprint 3.»

## Preguntas que conviene llevar

1. Los tres motivos frecuentes de rechazo, ¿son los que usan? ¿Falta alguno?
2. Al escalar se avisa a **todos** los directores activos. ¿Es uno solo o son varios?
3. El texto de las justificaciones admite 500 caracteres. ¿Alcanza?
4. ¿Qué tipos de falla quieren que existan desde el primer día en producción?

## Si algo falla en la demo

- **La bandeja se queda en «Cargando…»:** recargar la página. Si sigue igual, revisar la conexión
  del equipo: en las pruebas, cuando pasó, el servidor estaba respondiendo bien.
- **Una acción responde «La novedad cambió de estado»:** alguien la movió en otra ventana. Se
  recarga sola; seguir con lo que muestre.
- **No hay conexión:** el aviso dice que no se aplicó y ofrece «Reintentar». Es justo lo que debe
  pasar; se puede mostrar a propósito apagando el wifi.
