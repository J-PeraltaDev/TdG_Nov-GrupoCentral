# 0013 · `solicitar_recuperacion` se puede ejecutar sin sesión

- **Estado:** Aceptada el 9 oct 2026 (plan del Sprint 3, decisión 7). Es una **excepción** a la
  regla 2 de `CLAUDE.md`.
- **Requerimientos:** RF-02, RNF-11 · SDD 5.3.2 (Tabla 21) y 6.1.10 · CU-02

## Contexto

Quien olvidó su contraseña no puede ingresar: la solicitud de recuperación tiene que poder hacerse
sin sesión. El SDD lo dice dos veces: la Tabla 21 pone a `solicitar_recuperacion` con el rol «Sin
sesión», y la sección 6.1.10, que «la solicitud se registra mediante una función que no exige
sesión y que siempre responde con el mismo mensaje».

La regla 2 de `CLAUDE.md`, que vale para todas las demás funciones, dice lo contrario: toda función
`security definer` le quita `execute` a `anon`. Y la función tiene que ser `security definer`,
porque nadie escribe directamente en `solicitud_recuperacion`.

Había dos salidas: conceder `execute` a `anon` en esa sola función, o mover la solicitud a una
tercera Edge Function.

## Decisión

**`solicitar_recuperacion` es la única función de `public` y de `private` que `anon` puede
ejecutar.** Se sigue el diseño tal como está en la Tabla 21.

Se eligió sobre la Edge Function porque la exposición es la misma (una puerta sin sesión abierta a
internet, igual que `restablecer-contrasena`, que el diseño ya tiene) y cuesta menos: no cambia la
Tabla 21, no suma una función por desplegar y mantener, y se prueba con pgTAP como las demás.

Como cualquiera puede llamarla, la función se escribe para que no se pueda abusar de ella:

1. **Siempre responde lo mismo.** Devuelve `void` y no lanza excepciones, exista o no el correo,
   esté activo o no el usuario, tenga o no una solicitud abierta (CU-02 4a). Quien la llama no
   aprende nada.
2. **No puede llenar la tabla.** Solo inserta para un usuario activo que no tenga ya una solicitud
   abierta: como mucho hay una por usuario, y un índice único parcial lo garantiza aunque lleguen
   dos peticiones a la vez.
3. **Entrada acotada.** Un correo de más de 254 caracteres no hace nada.
4. **No entrega nada.** El código lo genera después un administrador, que antes verifica la
   identidad de la persona (pantalla 32). Una solicitud que nadie pidió se queda en «Pendiente» y
   no le da acceso a nadie.

## Consecuencias

- El asesor de Supabase muestra un aviso de un tipo nuevo,
  `anon_security_definer_function_executable`, para esta función. Es el esperado y queda anotado en
  `docs/decisiones-pendientes.md`, punto 16.
- Dos pruebas lo vigilan: `rf16_estructura_test.sql` y `s3_contratos_test.sql` fallan si `anon`
  puede ejecutar cualquier otra función.
- La respuesta tarda casi lo mismo exista o no el correo (la diferencia es una inserción, menos de
  un milisegundo, por debajo de la variación de la red). No se agregó una espera artificial dentro
  de la base de datos, porque retendría una conexión por cada petición.
- Alguien que conozca correos de la plataforma puede crearle una solicitud a cada uno. No obtiene
  nada, pero el administrador vería solicitudes que nadie hizo. Si llega a pasar, la respuesta es
  limitar las peticiones delante de la API, no cambiar esta decisión.
- Si el diseño cambia y la solicitud deja de ser una función de la base de datos, se le quita el
  permiso a `anon` y este ADR queda reemplazado.
