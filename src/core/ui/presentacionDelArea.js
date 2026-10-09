import iconoMantenimiento from './iconos/construction.svg'
import iconoSistemas from './iconos/router.svg'

/**
 * Cómo se presenta cada área (Figma 05 y 17): su ícono, sus colores y qué atiende. Las áreas
 * vienen del catálogo de la base de datos; esto es solo su presentación. Un área que no esté
 * aquí se muestra sin ícono.
 *
 * @type {Record<string, { icono: string, colores: string, atiende: string }>}
 */
export const PRESENTACION_DEL_AREA = {
  Mantenimiento: {
    icono: iconoMantenimiento,
    colores: 'bg-advertencia-suave text-area-mantenimiento',
    atiende: 'Infraestructura, puentes, bombas, equipos y herramientas',
  },
  Sistemas: {
    icono: iconoSistemas,
    colores: 'bg-info-suave text-area-sistemas',
    atiende: 'Internet, biométricos, torniquetes y equipos de cómputo',
  },
}
