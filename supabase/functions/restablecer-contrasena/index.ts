// Entrada de Deno de restablecer-contrasena (SDD 5.3.4). No exige sesión: en config.toml lleva
// verify_jwt = false. La lógica está en manejar.js, que se prueba con Vitest (docs/adr/0012).
import { atender } from '../_shared/servir.js'
import { manejar } from './manejar.js'

Deno.serve((peticion) => atender(peticion, (cuerpo) => manejar(cuerpo)))
