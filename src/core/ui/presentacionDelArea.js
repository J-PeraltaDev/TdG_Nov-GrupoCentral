import iconoMantenimiento from './iconos/construction.svg'
import iconoSistemas from './iconos/router.svg'

/**
 * Cómo se presenta cada área (Figma 05 y 17): su ícono, sus colores y qué atiende; en los
 * gráficos del panel (23 y 24), el color de su ícono, de su barra y de su línea. Las áreas
 * vienen del catálogo de la base de datos; esto es solo su presentación. Un área que no esté
 * aquí se muestra sin ícono.
 *
 * @type {Record<string, { icono: string, colores: string, atiende: string, texto: string, barra: string, trazo: string }>}
 */
export const PRESENTACION_DEL_AREA = {
  Mantenimiento: {
    icono: iconoMantenimiento,
    colores: 'bg-advertencia-suave text-area-mantenimiento',
    texto: 'text-area-mantenimiento',
    barra: 'bg-area-mantenimiento',
    trazo: 'stroke-area-mantenimiento',
    atiende: 'Infraestructura, puentes, bombas, equipos y herramientas',
  },
  Sistemas: {
    icono: iconoSistemas,
    colores: 'bg-info-suave text-area-sistemas',
    texto: 'text-area-sistemas',
    barra: 'bg-area-sistemas',
    trazo: 'stroke-area-sistemas',
    atiende: 'Internet, biométricos, torniquetes y equipos de cómputo',
  },
}

/** Un área nueva, sin presentación propia: gris en los gráficos. */
const AREA_SIN_PRESENTACION = {
  icono: null,
  colores: 'bg-gris-100 text-texto-secundario',
  atiende: '',
  texto: 'text-texto-secundario',
  barra: 'bg-texto-secundario',
  trazo: 'stroke-texto-secundario',
}

/**
 * La presentación de un área por su nombre; la gris si no tiene una propia.
 *
 * @param {string} nombre
 */
export const presentacionDe = (nombre) => PRESENTACION_DEL_AREA[nombre] ?? AREA_SIN_PRESENTACION
