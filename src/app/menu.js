import { ROL } from '../core/sesion/roles.js'
import iconoRegistrar from '../core/ui/iconos/add_circle.svg'
import iconoFincas from '../core/ui/iconos/agriculture.svg'
import iconoTiposDeFalla from '../core/ui/iconos/category.svg'
import iconoUsuarios from '../core/ui/iconos/group.svg'
import iconoHistorial from '../core/ui/iconos/history.svg'
import iconoBandeja from '../core/ui/iconos/inbox.svg'
import iconoRecuperacion from '../core/ui/iconos/key.svg'
import iconoNovedades from '../core/ui/iconos/list_alt.svg'
import iconoPanel from '../core/ui/iconos/monitoring.svg'
import iconoEscaladas from '../core/ui/iconos/move_up.svg'
import iconoAvisos from '../core/ui/iconos/notifications.svg'
import iconoCuenta from '../core/ui/iconos/person.svg'

/**
 * @typedef {object} ItemDeMenu
 * @property {string} ruta
 * @property {string} etiqueta Texto del escritorio (barra lateral).
 * @property {string} [corta] Texto del teléfono, si es distinto (barra inferior).
 * @property {string} icono
 * @property {boolean} [soloEscritorio] No cabe en la barra inferior del teléfono.
 * @property {boolean} [soloTelefono] En el escritorio va en la barra superior.
 */

const AVISOS = { ruta: '/avisos', etiqueta: 'Avisos', icono: iconoAvisos }
const HISTORIAL = { ruta: '/historial', etiqueta: 'Historial', icono: iconoHistorial }
const CUENTA = { ruta: '/cuenta', etiqueta: 'Cuenta', icono: iconoCuenta }
const PANEL = { ruta: '/panel', etiqueta: 'Panel de reportes', corta: 'Panel', icono: iconoPanel }

/**
 * Navegación de cada rol (SDD, Tabla 10). En el teléfono es una barra inferior de cuatro
 * opciones; en el escritorio, la barra lateral.
 *
 * @type {Record<number, ItemDeMenu[]>}
 */
export const MENU = {
  [ROL.REPORTANTE]: [
    { ruta: '/novedades', etiqueta: 'Novedades', icono: iconoNovedades },
    { ruta: '/registrar', etiqueta: 'Registrar', icono: iconoRegistrar },
    AVISOS,
    CUENTA,
  ],
  [ROL.APROBADOR_AREA]: [
    { ruta: '/bandeja', etiqueta: 'Bandeja', icono: iconoBandeja },
    HISTORIAL,
    AVISOS,
    { ...CUENTA, soloTelefono: true },
  ],
  [ROL.DIRECTOR_AGRICULTURA]: [
    { ruta: '/escaladas', etiqueta: 'Escaladas', icono: iconoEscaladas },
    HISTORIAL,
    PANEL,
    AVISOS,
  ],
  // El administrador trabaja sobre todo en el escritorio (SDD, Tabla 10).
  [ROL.ADMINISTRADOR]: [
    PANEL,
    HISTORIAL,
    { ruta: '/usuarios', etiqueta: 'Usuarios', icono: iconoUsuarios },
    { ruta: '/fincas', etiqueta: 'Fincas', icono: iconoFincas, soloEscritorio: true },
    {
      ruta: '/tipos-de-falla',
      etiqueta: 'Tipos de falla',
      icono: iconoTiposDeFalla,
      soloEscritorio: true,
    },
    {
      ruta: '/recuperacion',
      etiqueta: 'Recuperación de contraseñas',
      icono: iconoRecuperacion,
      soloEscritorio: true,
    },
    AVISOS,
  ],
}
