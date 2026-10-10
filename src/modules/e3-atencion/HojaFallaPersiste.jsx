import { OBSERVACION_MAX_CARACTERES } from '../../core/config/parametros.js'
import { AreaDeTexto } from '../../core/ui/AreaDeTexto.jsx'
import { Hoja } from '../../core/ui/Hoja.jsx'
import iconoDevolver from '../../core/ui/iconos/undo.svg'
import { BotonesDeHoja } from './BotonesDeHoja.jsx'
import { useTextoObligatorio } from './useTextoObligatorio.js'

/**
 * El contenido de la hoja. Va aparte porque solo existe mientras la hoja está abierta: cada
 * vez que se abre, la observación empieza en blanco.
 *
 * @param {object} props
 * @param {{ area: string }} props.novedad
 * @param {() => void} props.alCerrar
 * @param {import('./useTextoObligatorio.js').AlConfirmarTexto} props.alConfirmar
 * @param {boolean} props.enCurso
 */
function Formulario({ novedad, alCerrar, alConfirmar, enCurso }) {
  const {
    texto: observacion,
    escribir,
    error,
    bloqueado,
    confirmar,
  } = useTextoObligatorio({ alConfirmar, enCurso })

  return (
    <form noValidate onSubmit={confirmar} className="flex flex-col gap-4">
      <p className="text-cuerpo text-texto-secundario">
        La novedad volverá a En atención para {novedad.area}, con tu observación.
      </p>

      <AreaDeTexto
        etiqueta="¿Qué sigue fallando?"
        obligatorio
        rows={3}
        maximo={OBSERVACION_MAX_CARACTERES}
        value={observacion}
        error={error}
        onChange={(evento) => escribir(evento.target.value)}
      />

      <BotonesDeHoja
        icono={iconoDevolver}
        texto="Devolver a atención"
        textoEnCurso="Devolviendo…"
        enCurso={enCurso}
        deshabilitado={bloqueado}
        alCancelar={alCerrar}
      />
    </form>
  )
}

/**
 * Hoja 09-B · La falla persiste (RF-15 / CU-15 3a, Figma 2:1243). El reportante cuenta qué
 * sigue fallando, que es obligatorio (CU-15 3b), y la novedad vuelve al área.
 *
 * @param {object} props
 * @param {boolean} props.abierta
 * @param {{ area: string }} props.novedad
 * @param {() => void} props.alCerrar
 * @param {import('./useTextoObligatorio.js').AlConfirmarTexto} props.alConfirmar Recibe la
 *   observación sin espacios sobrantes.
 * @param {boolean} props.enCurso La acción se está ejecutando.
 */
export function HojaFallaPersiste({ abierta, novedad, alCerrar, alConfirmar, enCurso }) {
  return (
    <Hoja abierta={abierta} alCerrar={alCerrar} titulo="La falla persiste">
      <Formulario
        novedad={novedad}
        alCerrar={alCerrar}
        alConfirmar={alConfirmar}
        enCurso={enCurso}
      />
    </Hoja>
  )
}
