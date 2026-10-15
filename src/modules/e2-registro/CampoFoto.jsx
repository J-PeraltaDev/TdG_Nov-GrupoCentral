import { useEffect, useId, useRef, useState } from 'react'
import { FOTOS_MAXIMO_POR_NOVEDAD } from '../../core/config/parametros.js'
import { useEnLinea } from '../../core/conexion/useEnLinea.js'
import { Aviso } from '../../core/ui/Aviso.jsx'
import { Boton } from '../../core/ui/Boton.jsx'
import { BotonDeIcono } from '../../core/ui/BotonDeIcono.jsx'
import { Icono } from '../../core/ui/Icono.jsx'
import iconoQuitar from '../../core/ui/iconos/delete.svg'
import iconoError from '../../core/ui/iconos/error.svg'
import iconoGaleria from '../../core/ui/iconos/image.svg'
import iconoInfo from '../../core/ui/iconos/info.svg'
import iconoCamara from '../../core/ui/iconos/photo_camera.svg'
import { FOTOS_SIN_RED, formatearPeso } from './medidasDeFoto.js'

/**
 * @typedef {object} FotoElegida
 * @property {string} id
 * @property {string} nombre El del archivo que se eligió.
 * @property {Blob} foto Ya reducida, en JPEG.
 * @property {string} vista URL local para la miniatura.
 */

/**
 * Campo «Foto (opcional)» de la pantalla 05 (RF-08 / CU-08). Figma: 05 (2:514), 05-B (2:634) y
 * 05-D (2:777). «Tomar foto» abre la cámara del teléfono y «Elegir de la galería», las fotos
 * guardadas; cada foto se reduce antes de mostrarse. Hasta 3 por novedad (decisión 37 del plan).
 * También es el campo «Fotos de la solución» de la pantalla 18 (cambio 23).
 *
 * @param {object} props
 * @param {FotoElegida[]} props.fotos
 * @param {(fotos: FotoElegida[]) => void} props.alCambiar
 * @param {string} [props.etiqueta]
 * @param {string} [props.notaSinRed] Por qué no se puede sin conexión.
 * @param {string} [props.notaDelMaximo] Por qué no se puede agregar otra.
 */
export function CampoFoto({
  fotos,
  alCambiar,
  etiqueta = 'Foto',
  notaSinRed = FOTOS_SIN_RED,
  notaDelMaximo = 'Máximo 3 fotos por novedad.',
}) {
  const sinRed = !useEnLinea()
  const lleno = fotos.length >= FOTOS_MAXIMO_POR_NOVEDAD
  const idDeLaNota = useId()
  const camara = useRef(/** @type {HTMLInputElement | null} */ (null))
  const galeria = useRef(/** @type {HTMLInputElement | null} */ (null))
  const [invalida, setInvalida] = useState(false)
  const [reduciendo, setReduciendo] = useState(false)

  // Las miniaturas son URLs locales: se liberan al salir.
  const vigentes = useRef(fotos)
  useEffect(() => {
    vigentes.current = fotos
  })
  useEffect(() => () => vigentes.current.forEach(({ vista }) => URL.revokeObjectURL(vista)), [])

  /** @param {import('react').ChangeEvent<HTMLInputElement>} evento */
  async function alElegir(evento) {
    const [archivo] = evento.target.files ?? []
    // Así se puede volver a elegir el mismo archivo.
    evento.target.value = ''
    if (!archivo) return
    setInvalida(false)
    setReduciendo(true)
    try {
      const { reducirFoto } = await import('./reducirFoto.js')
      const foto = await reducirFoto(archivo)
      alCambiar([
        ...vigentes.current,
        { id: crypto.randomUUID(), nombre: archivo.name, foto, vista: URL.createObjectURL(foto) },
      ])
    } catch {
      // CU-08 4a (05-D): no es una imagen, el navegador no la abre o pesa demasiado.
      setInvalida(true)
    } finally {
      setReduciendo(false)
    }
  }

  /** @param {FotoElegida} quitada */
  function quitar(quitada) {
    URL.revokeObjectURL(quitada.vista)
    alCambiar(fotos.filter(({ id }) => id !== quitada.id))
  }

  const nota = sinRed ? notaSinRed : lleno ? notaDelMaximo : null
  const boton = {
    tipo: /** @type {const} */ ('secundario'),
    disabled: reduciendo,
    noDisponible: Boolean(nota),
    'aria-describedby': nota ? idDeLaNota : undefined,
    className: 'w-full',
  }

  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-etiqueta text-texto">
        {etiqueta} <span className="text-texto-secundario">(opcional)</span>
      </p>
      <Boton {...boton} icono={iconoCamara} onClick={() => camara.current?.click()}>
        Tomar foto
      </Boton>
      <Boton {...boton} icono={iconoGaleria} onClick={() => galeria.current?.click()}>
        Elegir de la galería
      </Boton>
      {/* `capture` abre la cámara en el teléfono; el selector no pide permiso de cámara. */}
      <input
        ref={camara}
        type="file"
        accept="image/*"
        capture="environment"
        aria-label="Tomar foto"
        hidden
        onChange={alElegir}
      />
      <input
        ref={galeria}
        type="file"
        accept="image/*"
        aria-label="Elegir de la galería"
        hidden
        onChange={alElegir}
      />

      {nota ? (
        <p id={idDeLaNota} className="flex items-start gap-1.5 text-auxiliar text-texto-secundario">
          <Icono src={iconoInfo} tamano={16} />
          <span className="min-w-0 flex-1">{nota}</span>
        </p>
      ) : null}
      {reduciendo ? (
        <p role="status" className="text-auxiliar text-texto-secundario">
          Reduciendo la foto…
        </p>
      ) : null}
      {invalida ? (
        <Aviso tipo="error" icono={iconoError} role="alert">
          El archivo no es una imagen o supera el tamaño permitido. Elige otra foto.
        </Aviso>
      ) : null}

      {fotos.length > 0 ? (
        <ul aria-label="Fotos elegidas" className="flex flex-col gap-2.5">
          {fotos.map((elegida) => (
            <li
              key={elegida.id}
              className="flex items-center gap-3 rounded-xl border border-borde bg-superficie p-2.5"
            >
              <img
                src={elegida.vista}
                alt=""
                className="size-14 flex-none rounded-control bg-gris-200 object-cover"
              />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-etiqueta-fuerte text-texto">{elegida.nombre}</span>
                <span className="text-auxiliar text-texto-secundario">
                  Reducida a {formatearPeso(elegida.foto.size)}
                </span>
              </span>
              <BotonDeIcono
                icono={iconoQuitar}
                nombre={`Quitar ${elegida.nombre}`}
                color="text-error"
                onClick={() => quitar(elegida)}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
