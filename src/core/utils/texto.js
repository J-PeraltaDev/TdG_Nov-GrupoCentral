/**
 * El texto en minúsculas, sin tildes ni espacios en los extremos, para comparar y buscar como
 * lo haría una persona: «La Mónica» y «la monica» son lo mismo. La ñ se conserva: «año» no es
 * «ano».
 *
 * @param {string | null | undefined} texto
 */
export function sinTildes(texto) {
  return (
    (texto ?? '')
      .normalize('NFD')
      // Quita las marcas de acento, salvo la virgulilla de la ñ (U+0303).
      .replace(/[̀-̂̄-ͯ]/g, '')
      .normalize('NFC')
      .toLowerCase()
      .trim()
  )
}
