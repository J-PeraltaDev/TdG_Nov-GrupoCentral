import { Link } from 'react-router'
import { ROL, rutaDeInicio } from '../../core/sesion/roles.js'
import { Icono } from '../../core/ui/Icono.jsx'
import iconoSinPermiso from '../../core/ui/iconos/lock.svg'

/*
 * Pantalla 22-B · Sin permiso sobre la novedad (RF-18 / CU-18 2a). Figma 4:2322.
 *
 * Sale cuando la consulta no devuelve filas: la novedad está fuera del alcance del usuario o
 * no existe. La base de datos responde igual en los dos casos, a propósito (RNF-11), así que
 * la pantalla tampoco los distingue.
 */

/** Lo que cada rol puede consultar y adónde vuelve. Figma solo dibuja el del reportante. */
const TEXTOS = {
  [ROL.REPORTANTE]: {
    explicacion: 'Solo puedes consultar las novedades de tu finca.',
    volver: 'Volver a mis novedades',
  },
  [ROL.APROBADOR_AREA]: {
    explicacion: 'Solo puedes consultar las novedades de tu área.',
    volver: 'Volver a la bandeja',
  },
}

// El director y el administrador consultan todas: si no aparece, es que no existe.
const SIN_RESTRICCION = {
  explicacion: 'Esta novedad no existe o ya no está disponible.',
  volver: 'Volver al inicio',
}

/**
 * @param {object} props
 * @param {number} props.rolId
 */
export function SinPermiso({ rolId }) {
  const { explicacion, volver } = TEXTOS[rolId] ?? SIN_RESTRICCION

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-6 pt-24 pb-6 text-center">
      <span className="flex size-22 items-center justify-center rounded-full bg-gris-100 text-texto-secundario">
        <Icono src={iconoSinPermiso} tamano={44} />
      </span>
      <h1 className="text-titulo text-texto">No puedes ver esta novedad</h1>
      <p className="text-cuerpo text-texto-secundario">{explicacion}</p>
      <Link
        to={rutaDeInicio(rolId)}
        className="flex h-12 w-full items-center justify-center rounded-control bg-primario px-5 text-cuerpo-fuerte text-sobre-primario hover:bg-primario-hover lg:h-10 lg:w-auto lg:px-4 lg:text-etiqueta-fuerte"
      >
        {volver}
      </Link>
    </div>
  )
}
