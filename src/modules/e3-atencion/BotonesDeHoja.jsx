import { useId } from 'react'
import { useEnLinea } from '../../core/conexion/useEnLinea.js'
import { Boton } from '../../core/ui/Boton.jsx'

/**
 * Los dos botones con que termina una hoja (Figma 15, 16 y 17): el que confirma, que envía el
 * formulario, y «Cancelar». En el teléfono van uno sobre otro; en el escritorio, en una fila
 * a la derecha.
 *
 * Si se pierde la conexión con la hoja abierta, la hoja se queda con lo escrito y el botón que
 * confirma queda no disponible hasta que vuelva (RF-25; decisión 18 del plan).
 *
 * @param {object} props
 * @param {string} props.texto
 * @param {string} props.textoEnCurso Lo que dice el botón mientras la acción se ejecuta.
 * @param {boolean} props.enCurso
 * @param {boolean} props.deshabilitado
 * @param {import('../../core/ui/Boton.jsx').TipoBoton} [props.tipo]
 * @param {string} [props.icono]
 * @param {() => void} props.alCancelar
 */
export function BotonesDeHoja({
  texto,
  textoEnCurso,
  enCurso,
  deshabilitado,
  tipo = 'primario',
  icono,
  alCancelar,
}) {
  const sinRed = !useEnLinea()
  const idSinRed = useId()

  return (
    <div className="flex flex-col lg:flex-row-reverse lg:flex-wrap lg:justify-start lg:gap-2.5">
      <Boton
        type="submit"
        tipo={tipo}
        icono={icono}
        disabled={deshabilitado}
        noDisponible={sinRed}
        aria-describedby={sinRed ? idSinRed : undefined}
        className="w-full lg:w-auto"
      >
        {enCurso ? textoEnCurso : texto}
      </Boton>
      <Boton tipo="texto" onClick={alCancelar} className="w-full lg:w-auto">
        Cancelar
      </Boton>
      {sinRed ? (
        <p
          id={idSinRed}
          className="text-center text-auxiliar text-texto-secundario lg:w-full lg:text-right"
        >
          Se habilita al volver la conexión
        </p>
      ) : null}
    </div>
  )
}
