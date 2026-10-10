import { Boton } from '../../core/ui/Boton.jsx'

/**
 * Los dos botones con que termina una hoja (Figma 15, 16 y 17): el que confirma, que envía el
 * formulario, y «Cancelar». En el teléfono van uno sobre otro; en el escritorio, en una fila
 * a la derecha.
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
  return (
    <div className="flex flex-col lg:flex-row-reverse lg:justify-start lg:gap-2.5">
      <Boton
        type="submit"
        tipo={tipo}
        icono={icono}
        disabled={deshabilitado}
        className="w-full lg:w-auto"
      >
        {enCurso ? textoEnCurso : texto}
      </Boton>
      <Boton tipo="texto" onClick={alCancelar} className="w-full lg:w-auto">
        Cancelar
      </Boton>
    </div>
  )
}
