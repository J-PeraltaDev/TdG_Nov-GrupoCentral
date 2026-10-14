import { useEffect, useId, useRef, useState } from 'react'
import { FOTOS_MAXIMO_POR_NOVEDAD } from '../../core/config/parametros.js'
import { useEnLinea } from '../../core/conexion/useEnLinea.js'
import { traducirError } from '../../core/errores/traducir.js'
import { useSesion } from '../../core/sesion/ContextoSesion.js'
import { listarEvidencias, subirEvidencia } from '../../core/supabase/repositorios/evidencias.js'
import { Aviso } from '../../core/ui/Aviso.jsx'
import { Icono } from '../../core/ui/Icono.jsx'
import iconoAdjuntar from '../../core/ui/iconos/add_a_photo.svg'
import iconoError from '../../core/ui/iconos/error.svg'
import iconoFoto from '../../core/ui/iconos/image.svg'
import iconoCandado from '../../core/ui/iconos/lock.svg'
import { formatearCodigo } from '../../core/utils/codigo.js'

/*
 * Bloque «Evidencias» del detalle (RF-08 / CU-08 y CU-18), para los cuatro roles. Figma: 09
 * (2:1168 y «Adjuntar foto», 2:1174) y los bloques de 13, 14, 20, 20-C y 22. El reportante de la
 * finca adjunta más fotos mientras la novedad no está cerrada ni rechazada (Tabla 35), hasta 3.
 *
 * Sin conexión, cada foto es un recuadro gris (09-D, 14-B) y no se puede adjuntar (RF-25).
 */

const RECUADRO = 'flex size-24 flex-none items-center justify-center rounded-control'

/**
 * @param {object} props
 * @param {{ id: string, codigo: number }} props.novedad
 * @param {boolean} props.puedeAdjuntar `ACCION.ADJUNTAR_FOTO` está entre las disponibles.
 */
export function Evidencias({ novedad, puedeAdjuntar }) {
  const { perfil } = useSesion()
  const enLinea = useEnLinea()
  const idDelTitulo = useId()
  const idSinRed = useId()
  const selector = useRef(/** @type {HTMLInputElement | null} */ (null))
  const [evidencias, setEvidencias] = useState(/** @type {object[] | null} */ (null))
  const [intento, setIntento] = useState(0)
  const [subiendo, setSubiendo] = useState(false)
  const [fallo, setFallo] = useState(/** @type {string | null} */ (null))

  // Se vuelven a pedir al volver la conexión (las URLs firmadas solo llegan con red) y después
  // de adjuntar una.
  useEffect(() => {
    let vigente = true
    listarEvidencias(novedad.id)
      .then((lista) => {
        if (vigente) setEvidencias(lista)
      })
      // Sin ellas, el detalle sigue sirviendo: el bloque no se muestra.
      .catch(() => vigente && setEvidencias([]))
    return () => {
      vigente = false
    }
  }, [novedad.id, enLinea, intento])

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
      await subirEvidencia(novedad.id, foto, perfil.id)
      setIntento((n) => n + 1)
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

  const cantidad = evidencias?.length ?? 0
  const adjuntar = puedeAdjuntar && cantidad < FOTOS_MAXIMO_POR_NOVEDAD
  // Sin fotos y sin poder adjuntar, no hay nada que mostrar.
  if (evidencias === null || (cantidad === 0 && !adjuntar)) return null
  const codigo = formatearCodigo(novedad.codigo)

  return (
    <section
      aria-labelledby={idDelTitulo}
      className="flex flex-col gap-2.5 rounded-xl border border-borde bg-superficie p-4"
    >
      <h2 id={idDelTitulo} className="text-etiqueta-fuerte text-texto">
        Evidencias
      </h2>
      <ul className="flex flex-wrap gap-2.5">
        {evidencias.map((evidencia, i) => (
          <li key={evidencia.id}>
            {evidencia.url ? (
              // La foto completa, en otra pestaña.
              <a href={evidencia.url} target="_blank" rel="noopener noreferrer" className="block">
                <img
                  src={evidencia.url}
                  alt={`Foto ${i + 1} de ${codigo}`}
                  className={`${RECUADRO} bg-gris-200 object-cover`}
                />
              </a>
            ) : (
              <span
                role="img"
                aria-label={`Foto ${i + 1} de ${codigo}`}
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
              className={`${RECUADRO} flex-col gap-1 border border-dashed text-auxiliar-fuerte ${
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
    </section>
  )
}
