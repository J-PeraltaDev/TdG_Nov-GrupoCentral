/*
 * Contraseña inicial de un usuario nuevo (RF-03 / CU-03 4): una palabra y cuatro cifras, como
 * el ejemplo de Figma en la pantalla 29 («Banano-4821»). Es fácil de dictar y de escribir en
 * un teléfono; el administrador se la entrega al usuario, que la cambia después.
 *
 * Se arma en el navegador con el generador criptográfico, no con `Math.random`, y no se guarda
 * en ningún lado: vive en el formulario hasta que se cierra. El administrador puede escribir
 * otra en su lugar.
 */

// 32 palabras del campo, sin tildes ni eñes para que se escriban igual en cualquier teclado.
// Son una potencia de dos: el resto de un número de 32 bits las elige sin sesgo.
const PALABRAS = [
  'Banano',
  'Platano',
  'Cacao',
  'Guadua',
  'Palma',
  'Ceiba',
  'Yarumo',
  'Mango',
  'Guamo',
  'Totumo',
  'Caoba',
  'Roble',
  'Cedro',
  'Nogal',
  'Tagua',
  'Arroz',
  'Maizal',
  'Yuca',
  'Guayaba',
  'Papaya',
  'Lulo',
  'Mora',
  'Coco',
  'Limon',
  'Naranjo',
  'Cafetal',
  'Potrero',
  'Sendero',
  'Vereda',
  'Arroyo',
  'Laguna',
  'Colina',
]

const CIFRAS = 10_000
/** El mayor múltiplo de 10 000 que cabe en 32 bits: por encima, el resto favorecería a unas cifras. */
const LIMITE_SIN_SESGO = Math.floor(2 ** 32 / CIFRAS) * CIFRAS

/** Un entero de 32 bits del generador criptográfico. */
function azar() {
  return globalThis.crypto.getRandomValues(new Uint32Array(1))[0]
}

/** @returns {string} Por ejemplo, «Banano-4821». */
export function generarContrasena() {
  const palabra = PALABRAS[azar() % PALABRAS.length]
  let numero = azar()
  while (numero >= LIMITE_SIN_SESGO) numero = azar()
  return `${palabra}-${String(numero % CIFRAS).padStart(4, '0')}`
}
