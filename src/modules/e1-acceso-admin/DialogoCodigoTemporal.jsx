import { useState } from 'react'
import { Aviso } from '../../core/ui/Aviso.jsx'
import { Boton } from '../../core/ui/Boton.jsx'
import { Dialogo } from '../../core/ui/Dialogo.jsx'
import { IconoDeHoja } from '../../core/ui/Hoja.jsx'
import iconoCopiado from '../../core/ui/iconos/check.svg'
import iconoCopiar from '../../core/ui/iconos/content_copy.svg'
import iconoCodigo from '../../core/ui/iconos/key.svg'
import iconoVerificar from '../../core/ui/iconos/verified_user.svg'
import { esMismoDiaEnColombia, formatearHora } from '../../core/utils/fechas.js'
import { enGrupos } from './codigoTemporal.js'

/**
 * El contenido del diálogo. Va aparte porque solo existe mientras el diálogo está abierto: lo
 * que se copió de un código no se queda para el siguiente.
 *
 * @param {object} props
 * @param {string} props.codigo
 * @param {string} props.expiraEn
 * @param {() => void} props.alCerrar
 */
function Contenido({ codigo, expiraEn, alCerrar }) {
  const [copia, setCopia] = useState(/** @type {'copiado' | 'fallo' | null} */ (null))

  async function copiar() {
    try {
      // Sin el espacio: es lo que la persona va a pegar o a dictar.
      await navigator.clipboard.writeText(codigo)
      setCopia('copiado')
    } catch {
      // Sin permiso o sin portapapeles (un navegador viejo, una página sin HTTPS).
      setCopia('fallo')
    }
  }

  // Dura 30 minutos: solo cambia de día si se genera cerca de la medianoche.
  const dia = esMismoDiaEnColombia(expiraEn) ? 'hoy' : 'mañana'

  return (
    <div className="flex flex-col gap-4">
      {/* En el teléfono el código y «Copiar» no caben en un renglón: van uno sobre otro. */}
      <div className="flex flex-col gap-3 rounded-xl bg-gris-100 px-5 py-4 lg:flex-row lg:items-center">
        {/* Un lector de pantalla lo diría como un número; se le da dígito por dígito. */}
        <p
          aria-hidden="true"
          translate="no"
          className="min-w-0 flex-1 text-center text-[2rem]/10 font-semibold tracking-wide whitespace-nowrap text-texto select-all lg:text-left"
        >
          {enGrupos(codigo)}
        </p>
        <p className="sr-only">Código: {codigo.split('').join(' ')}</p>
        <Boton
          tipo="secundario"
          icono={copia === 'copiado' ? iconoCopiado : iconoCopiar}
          onClick={copiar}
          className="flex-none"
        >
          {copia === 'copiado' ? 'Copiado' : 'Copiar'}
        </Boton>
      </div>
      {copia ? (
        <p role="status" className="-mt-2 text-auxiliar text-texto-secundario">
          {copia === 'copiado'
            ? 'Código copiado.'
            : 'No se pudo copiar. Escríbelo o selecciónalo a mano.'}
        </p>
      ) : null}

      <p className="text-cuerpo text-texto-secundario">
        {/* «a. m.» ya termina en punto: no lleva otro. */}
        Vence {dia} a las {formatearHora(expiraEn)} Solo se puede usar una vez y no se volverá a
        mostrar.
      </p>

      <Aviso tipo="advertencia" icono={iconoVerificar}>
        Verifica la identidad de la persona antes de entregarlo.
      </Aviso>

      <div className="flex justify-end">
        <Boton onClick={alCerrar} className="w-full lg:w-auto">
          Listo
        </Boton>
      </div>
    </div>
  )
}

/**
 * Diálogo de la pantalla 32 · Código temporal generado (RF-02 / CU-02 6 y 7, Figma 6:3435).
 * Es la única vez que el código se ve: en la base de datos queda solo su resumen. Vive en la
 * memoria de la pantalla mientras el diálogo está abierto y desaparece al cerrarlo.
 *
 * No se cierra con un clic en el fondo: un clic fuera no debe costar un código que no se puede
 * volver a mostrar. Se cierra con «Listo» o con Escape.
 *
 * @param {object} props
 * @param {{ codigo: string, expiraEn: string, nombre: string, correo: string } | null} props.generado
 *   `null` con el diálogo cerrado.
 * @param {() => void} props.alCerrar
 */
export function DialogoCodigoTemporal({ generado, alCerrar }) {
  return (
    <Dialogo
      abierto={Boolean(generado)}
      alCerrar={alCerrar}
      cierraConElFondo={false}
      titulo="Código temporal generado"
      descripcion={generado ? `${generado.nombre} · ${generado.correo}` : ''}
      icono={<IconoDeHoja src={iconoCodigo} className="bg-primario-contenedor text-primario" />}
    >
      {generado ? (
        <Contenido codigo={generado.codigo} expiraEn={generado.expiraEn} alCerrar={alCerrar} />
      ) : null}
    </Dialogo>
  )
}
