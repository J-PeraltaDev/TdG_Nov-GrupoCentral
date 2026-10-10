import { OBSERVACION_MAX_CARACTERES } from '../../core/config/parametros.js'
import { AreaDeTexto } from '../../core/ui/AreaDeTexto.jsx'
import { Hoja, IconoDeHoja } from '../../core/ui/Hoja.jsx'
import iconoRechazar from '../../core/ui/iconos/block.svg'
import { BotonesDeHoja } from './BotonesDeHoja.jsx'
import {
  alternarMotivoFrecuente,
  MOTIVOS_FRECUENTES,
  motivoFrecuenteDe,
} from './motivosDeRechazo.js'
import { useTextoObligatorio } from './useTextoObligatorio.js'

/**
 * El contenido de la hoja. Va aparte porque solo existe mientras la hoja está abierta: cada
 * vez que se abre, el motivo empieza en blanco.
 *
 * @param {object} props
 * @param {() => void} props.alCerrar
 * @param {import('./useTextoObligatorio.js').AlConfirmarTexto} props.alConfirmar
 * @param {boolean} props.enCurso
 */
function Formulario({ alCerrar, alConfirmar, enCurso }) {
  const {
    texto: motivo,
    escribir,
    error,
    bloqueado,
    confirmar,
  } = useTextoObligatorio({ alConfirmar, enCurso })
  const frecuente = motivoFrecuenteDe(motivo)

  return (
    <form noValidate onSubmit={confirmar} className="flex flex-col gap-4">
      <p className="text-cuerpo-pequeno text-texto-secundario">
        La novedad se cerrará como Rechazada y la finca verá el motivo. Esta acción no se puede
        deshacer.
      </p>

      {/* La pastilla mide 32 px, como en Figma; el botón que la contiene da los 48 px de área
          táctil del teléfono, y el margen negativo conserva la separación con lo de arriba y
          lo de abajo. Si el texto no cabe en el ancho (360 px), pasa a dos líneas. */}
      <div
        role="group"
        aria-label="Motivos frecuentes"
        className="-my-2 flex flex-wrap gap-x-2 lg:my-0 lg:gap-y-2"
      >
        {MOTIVOS_FRECUENTES.map((opcion) => (
          <button
            key={opcion}
            type="button"
            aria-pressed={opcion === frecuente}
            onClick={() => escribir(alternarMotivoFrecuente(motivo, opcion))}
            className="flex min-h-12 max-w-full cursor-pointer items-center rounded-2xl text-left lg:min-h-0"
          >
            <span
              className={`rounded-2xl px-3 py-1.5 text-etiqueta inset-ring ${
                opcion === frecuente
                  ? 'bg-primario-contenedor text-primario inset-ring-primario'
                  : 'bg-superficie text-texto inset-ring-borde'
              }`}
            >
              {opcion}
            </span>
          </button>
        ))}
      </div>

      <AreaDeTexto
        etiqueta="Motivo del rechazo"
        obligatorio
        maximo={OBSERVACION_MAX_CARACTERES}
        value={motivo}
        error={error}
        onChange={(evento) => escribir(evento.target.value)}
      />

      <BotonesDeHoja
        tipo="peligro"
        icono={iconoRechazar}
        texto="Rechazar novedad"
        textoEnCurso="Rechazando…"
        enCurso={enCurso}
        deshabilitado={bloqueado}
        alCancelar={alCerrar}
      />
    </form>
  )
}

/**
 * Hoja 16 · Rechazar novedad (RF-11 / CU-11, Figma 3:1468). Pide el motivo, que es obligatorio
 * (CU-11 3a), con tres motivos frecuentes como accesos rápidos, y advierte que el rechazo no
 * se puede deshacer.
 *
 * @param {object} props
 * @param {boolean} props.abierta
 * @param {() => void} props.alCerrar
 * @param {import('./useTextoObligatorio.js').AlConfirmarTexto} props.alConfirmar Recibe el
 *   motivo sin espacios sobrantes.
 * @param {boolean} props.enCurso La acción se está ejecutando.
 */
export function HojaRechazar({ abierta, alCerrar, alConfirmar, enCurso }) {
  return (
    <Hoja
      abierta={abierta}
      alCerrar={alCerrar}
      titulo="Rechazar novedad"
      icono={<IconoDeHoja src={iconoRechazar} className="bg-error-suave text-error" />}
    >
      <Formulario alCerrar={alCerrar} alConfirmar={alConfirmar} enCurso={enCurso} />
    </Hoja>
  )
}
