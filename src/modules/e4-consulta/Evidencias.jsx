import { useId, useRef, useState } from 'react'
import { FOTOS_MAXIMO_POR_NOVEDAD } from '../../core/config/parametros.js'
import { useEnLinea } from '../../core/conexion/useEnLinea.js'
import { traducirError } from '../../core/errores/traducir.js'
import { useSesion } from '../../core/sesion/ContextoSesion.js'
import { subirEvidencia } from '../../core/supabase/repositorios/evidencias.js'
import { Aviso } from '../../core/ui/Aviso.jsx'
import { Icono } from '../../core/ui/Icono.jsx'
import iconoAdjuntar from '../../core/ui/iconos/add_a_photo.svg'
import iconoError from '../../core/ui/iconos/error.svg'
import iconoFoto from '../../core/ui/iconos/image.svg'
import iconoCandado from '../../core/ui/iconos/lock.svg'
import { formatearCodigo } from '../../core/utils/codigo.js'
import { VisorDeFotos } from './VisorDeFotos.jsx'

/*
 * Las fotos de una novedad en el detalle (RF-08 / CU-08 y CU-18), para los cuatro roles. Figma:
 * el bloque «Evidencias» de 09 (2:1168 y «Adjuntar foto», 2:1174), 13, 14, 20, 20-C y 22.
 *
 * - Las del reporte van en el bloque «Evidencias». Las adjunta el reportante de la finca
 *   mientras la novedad no está cerrada ni rechazada (Tabla 35), hasta 3.
 * - Las de la solución van dentro de la solución registrada. Las adjunta el aprobador del área
 *   mientras la finca no la confirma, hasta 3 por solución (cambio 23; Figma no las dibuja).
 *
 * Sin conexión, cada foto es un recuadro gris (09-D, 14-B) y no se puede adjuntar (RF-25).
 *
 * Al tocar una miniatura, la foto se abre en el visor, dentro de la aplicación (cambio 41).
 */

const RECUADRO = 'flex size-24 flex-none items-center justify-center rounded-control'

/**
 * Las miniaturas, el recuadro «Adjuntar foto» y sus avisos.
 *
 * @param {object} props
 * @param {{ id: string, codigo: number }} props.novedad
 * @param {object[]} props.fotos Con `url` (nula sin conexión).
 * @param {boolean} [props.deLaSolucion] Son de la solución: lo dice su texto alternativo.
 * @param {boolean} props.puedeAdjuntar
 * @param {() => void} props.alAdjuntar Después de subir una: se vuelven a pedir.
 */
export function Fotos({ novedad, fotos, deLaSolucion = false, puedeAdjuntar, alAdjuntar }) {
  const { perfil } = useSesion()
  const enLinea = useEnLinea()
  const idSinRed = useId()
  const selector = useRef(/** @type {HTMLInputElement | null} */ (null))
  const [subiendo, setSubiendo] = useState(false)
  const [fallo, setFallo] = useState(/** @type {string | null} */ (null))
  const [vista, setVista] = useState(/** @type {number | null} */ (null))

  /** @param {import('react').ChangeEvent<HTMLInputElement>} evento */
  async function alElegir(evento) {
    const [archivo] = evento.target.files ?? []
    evento.target.value = ''
    if (!archivo) return
    setFallo(null)
    setSubiendo(true)
    try {
      const { reducirFoto } = await import('../e2-registro/reducirFoto.js')
      const foto = await reducirFoto(archivo)
      // El servidor decide si es del reporte o de la solución, según quién la sube.
      await subirEvidencia(novedad.id, foto, perfil.id)
      alAdjuntar()
    } catch (error) {
      setFallo(
        /** @type {any} */ (error)?.name === 'FotoInvalida'
          ? 'El archivo no es una imagen o supera el tamaño permitido. Elige otra foto.'
          : traducirError(error).mensaje,
      )
    } finally {
      setSubiendo(false)
    }
  }

  const adjuntar = puedeAdjuntar && fotos.length < FOTOS_MAXIMO_POR_NOVEDAD
  const codigo = formatearCodigo(novedad.codigo)
  const nombre = (i) =>
    deLaSolucion ? `Foto ${i + 1} de la solución de ${codigo}` : `Foto ${i + 1} de ${codigo}`

  return (
    <>
      <ul
        aria-label={deLaSolucion ? 'Fotos de la solución' : undefined}
        className="flex flex-wrap gap-2.5"
      >
        {fotos.map((evidencia, i) => (
          <li key={evidencia.id}>
            {evidencia.url ? (
              <button
                type="button"
                onClick={() => setVista(i)}
                className="block cursor-zoom-in rounded-control"
              >
                <img
                  src={evidencia.url}
                  alt={nombre(i)}
                  className={`${RECUADRO} bg-gris-200 object-cover`}
                />
              </button>
            ) : (
              <span
                role="img"
                aria-label={nombre(i)}
                className={`${RECUADRO} bg-gris-200 text-texto-secundario`}
              >
                <Icono src={iconoFoto} tamano={28} />
              </span>
            )}
          </li>
        ))}
        {adjuntar ? (
          <li>
            <button
              type="button"
              disabled={subiendo}
              aria-disabled={!enLinea || undefined}
              aria-describedby={enLinea ? undefined : idSinRed}
              onClick={() => (enLinea ? selector.current?.click() : null)}
              className={`${RECUADRO} flex-col gap-1 border border-dashed bg-superficie text-auxiliar-fuerte ${
                enLinea && !subiendo
                  ? 'cursor-pointer border-gris-300 text-primario'
                  : 'cursor-not-allowed border-gris-300 text-deshabilitado'
              }`}
            >
              <Icono src={enLinea ? iconoAdjuntar : iconoCandado} tamano={24} />
              {subiendo ? 'Subiendo…' : 'Adjuntar foto'}
            </button>
            <input
              ref={selector}
              type="file"
              accept="image/*"
              aria-label="Adjuntar foto"
              hidden
              onChange={alElegir}
            />
          </li>
        ) : null}
      </ul>
      {adjuntar && !enLinea ? (
        <p id={idSinRed} className="text-auxiliar text-texto-secundario">
          Las fotos necesitan conexión.
        </p>
      ) : null}
      {fallo ? (
        <Aviso tipo="error" icono={iconoError} role="alert">
          {fallo}
        </Aviso>
      ) : null}
      <VisorDeFotos
        fotos={fotos}
        indice={vista}
        alCambiar={setVista}
        alCerrar={() => setVista(null)}
        nombre={nombre}
      />
    </>
  )
}

/**
 * El bloque «Evidencias»: las fotos del reporte. Sin fotos y sin poder adjuntar, no se muestra.
 *
 * @param {object} props
 * @param {{ id: string, codigo: number }} props.novedad
 * @param {object[] | null} props.fotos `null` mientras cargan.
 * @param {boolean} props.puedeAdjuntar `ACCION.ADJUNTAR_FOTO` está entre las disponibles.
 * @param {() => void} props.alAdjuntar
 */
export function Evidencias({ novedad, fotos, puedeAdjuntar, alAdjuntar }) {
  const idDelTitulo = useId()
  if (fotos === null || (fotos.length === 0 && !puedeAdjuntar)) return null

  return (
    <section
      aria-labelledby={idDelTitulo}
      className="flex flex-col gap-2.5 rounded-xl border border-borde bg-superficie p-4"
    >
      <h2 id={idDelTitulo} className="text-etiqueta-fuerte text-texto">
        Evidencias
      </h2>
      <Fotos
        novedad={novedad}
        fotos={fotos}
        puedeAdjuntar={puedeAdjuntar}
        alAdjuntar={alAdjuntar}
      />
    </section>
  )
}
