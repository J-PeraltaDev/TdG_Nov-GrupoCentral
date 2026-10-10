import { Estado } from '../../core/ui/Estado.jsx'
import { Icono } from '../../core/ui/Icono.jsx'
import iconoTiempo from '../../core/ui/iconos/schedule.svg'
import { Prioridad } from '../../core/ui/Prioridad.jsx'
import { formatearCodigo } from '../../core/utils/codigo.js'
import { formatearDuracion, formatearFechaCorta } from '../../core/utils/fechas.js'
import { notaDelEstado } from './reglasDeBandeja.js'
import { ID_DE_LA_VISTA_PREVIA } from './VistaPrevia.jsx'

const ENCABEZADO = 'py-2.5 text-left text-auxiliar-fuerte text-texto-secundario'
const CELDA = 'py-3.5 align-middle'

/**
 * Tabla de la bandeja del escritorio (Figma 3:652). Elegir una fila la muestra en la vista
 * previa; el botón del código hace lo mismo con el teclado y con un lector de pantalla.
 *
 * Los anchos de Figma son para 1440 px; por debajo, las columnas fijas se angostan para que
 * la descripción no quede ilegible.
 *
 * @param {object} props
 * @param {string} props.titulo Nombre de la pestaña: describe la tabla a quien no la ve.
 * @param {object[]} props.novedades Página de la bandeja, ya ordenada por el servidor.
 * @param {Record<string, import('./reglasDeBandeja.js').ResumenDeTransiciones>} props.resumenes
 * @param {string | null} props.elegidaId
 * @param {(id: string) => void} props.alElegir
 */
export function TablaDeBandeja({ titulo, novedades, resumenes, elegidaId, alElegir }) {
  return (
    <div className="min-w-0 flex-1 overflow-clip rounded-xl border border-borde bg-superficie">
      <table className="w-full table-fixed border-collapse">
        <caption className="sr-only">{`Novedades: ${titulo}`}</caption>
        <colgroup>
          <col className="w-[138px] min-[90rem]:w-[158px]" />
          <col />
          <col className="w-[176px]" />
          <col className="w-[152px] min-[90rem]:w-[168px]" />
        </colgroup>
        <thead className="bg-gris-100">
          <tr>
            <th scope="col" className={`${ENCABEZADO} pr-2 pl-5`}>
              Novedad
            </th>
            <th scope="col" className={`${ENCABEZADO} px-2`}>
              Descripción
            </th>
            <th scope="col" className={`${ENCABEZADO} px-2`}>
              Estado
            </th>
            <th scope="col" className={`${ENCABEZADO} pr-5 pl-2`}>
              Registrada en finca
            </th>
          </tr>
        </thead>
        <tbody>
          {novedades.map((novedad) => {
            const elegida = novedad.id === elegidaId
            const nota = notaDelEstado(novedad, resumenes[novedad.id])
            return (
              <tr
                key={novedad.id}
                onClick={() => alElegir(novedad.id)}
                className={`cursor-pointer border-b border-borde last:border-b-0 ${
                  elegida ? 'bg-primario-contenedor' : 'hover:bg-gris-100'
                }`}
              >
                <td className={`${CELDA} pr-2 pl-5`}>
                  <div className="flex flex-col items-start gap-1">
                    <button
                      type="button"
                      aria-pressed={elegida}
                      aria-controls={ID_DE_LA_VISTA_PREVIA}
                      className="relative cursor-pointer rounded-sm text-etiqueta-fuerte text-texto after:absolute after:inset-x-0 after:-inset-y-1"
                      translate="no"
                    >
                      {formatearCodigo(novedad.codigo)}
                    </button>
                    <span className="max-w-full truncate text-auxiliar text-texto-secundario">
                      {novedad.finca}
                    </span>
                    <Prioridad prioridad={novedad.prioridad} />
                  </div>
                </td>
                <td className={`${CELDA} px-2`}>
                  <p className="line-clamp-2 text-cuerpo-pequeno break-words text-texto">
                    {novedad.descripcion}
                  </p>
                </td>
                <td className={`${CELDA} px-2`}>
                  <div className="flex flex-col items-start gap-1">
                    <Estado estado={novedad.estado} />
                    {nota ? (
                      <span className="text-auxiliar text-texto-secundario">{nota}</span>
                    ) : null}
                  </div>
                </td>
                <td className={`${CELDA} pr-5 pl-2`}>
                  <time
                    dateTime={novedad.fecha_registro}
                    className="block text-cuerpo-pequeno whitespace-nowrap text-texto"
                  >
                    {formatearFechaCorta(novedad.fecha_registro)}
                  </time>
                  <span className="mt-0.5 flex items-center gap-1 text-auxiliar text-texto-secundario">
                    <Icono src={iconoTiempo} tamano={14} />
                    {formatearDuracion(novedad.fecha_registro)}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
