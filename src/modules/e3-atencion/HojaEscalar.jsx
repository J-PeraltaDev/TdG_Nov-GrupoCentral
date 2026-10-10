import { OBSERVACION_MAX_CARACTERES } from '../../core/config/parametros.js'
import { AreaDeTexto } from '../../core/ui/AreaDeTexto.jsx'
import { Hoja, IconoDeHoja } from '../../core/ui/Hoja.jsx'
import iconoEscalar from '../../core/ui/iconos/arrow_circle_up.svg'
import { Prioridad } from '../../core/ui/Prioridad.jsx'
import { formatearCodigo } from '../../core/utils/codigo.js'
import { BotonesDeHoja } from './BotonesDeHoja.jsx'
import { useTextoObligatorio } from './useTextoObligatorio.js'

/**
 * El contenido de la hoja. Va aparte porque solo existe mientras la hoja está abierta: cada
 * vez que se abre, la justificación empieza en blanco.
 *
 * @param {object} props
 * @param {{ codigo: number, finca: string, prioridad: string }} props.novedad
 * @param {() => void} props.alCerrar
 * @param {import('./useTextoObligatorio.js').AlConfirmarTexto} props.alConfirmar
 * @param {boolean} props.enCurso
 */
function Formulario({ novedad, alCerrar, alConfirmar, enCurso }) {
  const {
    texto: justificacion,
    escribir,
    error,
    bloqueado,
    confirmar,
  } = useTextoObligatorio({ alConfirmar, enCurso })

  return (
    <form noValidate onSubmit={confirmar} className="flex flex-col gap-4">
      <p className="text-cuerpo-pequeno text-texto-secundario">
        Úsalo cuando la solución necesita una autorización mayor, por ejemplo, la compra de
        repuestos. La novedad quedará Escalada hasta que el director decida.
      </p>

      {/* La novedad que se escala, para confirmar que es esa (Figma 3:1364). */}
      <p className="flex flex-wrap items-center gap-2 rounded-control bg-gris-100 p-2.5 text-etiqueta-fuerte text-texto">
        <span>
          <span translate="no">{formatearCodigo(novedad.codigo)}</span> · {novedad.finca}
        </span>
        <Prioridad prioridad={novedad.prioridad} />
      </p>

      <AreaDeTexto
        etiqueta="Justificación"
        obligatorio
        rows={3}
        maximo={OBSERVACION_MAX_CARACTERES}
        ayuda="Obligatoria para escalar"
        value={justificacion}
        error={error}
        onChange={(evento) => escribir(evento.target.value)}
      />

      <BotonesDeHoja
        icono={iconoEscalar}
        texto="Escalar novedad"
        textoEnCurso="Escalando…"
        enCurso={enCurso}
        deshabilitado={bloqueado}
        alCancelar={alCerrar}
      />

      <p className="text-center text-auxiliar text-texto-secundario">
        Se avisará al director de agricultura y a la finca.
      </p>
    </form>
  )
}

/**
 * Hoja 15 · Escalar al director de agricultura (RF-12 / CU-12, Figma 3:1356). Pide la
 * justificación, que es obligatoria (CU-12 3a), y explica cuándo conviene escalar.
 *
 * @param {object} props
 * @param {boolean} props.abierta
 * @param {{ codigo: number, finca: string, prioridad: string }} props.novedad
 * @param {() => void} props.alCerrar
 * @param {import('./useTextoObligatorio.js').AlConfirmarTexto} props.alConfirmar Recibe la
 *   justificación sin espacios sobrantes.
 * @param {boolean} props.enCurso La acción se está ejecutando.
 */
export function HojaEscalar({ abierta, novedad, alCerrar, alConfirmar, enCurso }) {
  return (
    <Hoja
      abierta={abierta}
      alCerrar={alCerrar}
      titulo="Escalar al director de agricultura"
      icono={
        <IconoDeHoja
          src={iconoEscalar}
          className="bg-estado-escalada-fondo text-estado-escalada-texto"
        />
      }
    >
      <Formulario
        novedad={novedad}
        alCerrar={alCerrar}
        alConfirmar={alConfirmar}
        enCurso={enCurso}
      />
    </Hoja>
  )
}
