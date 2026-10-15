import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useEnLinea } from '../../core/conexion/useEnLinea.js'
import { leerMeta, listarPendientes } from '../../core/offline/bd.js'
import { limpiarEnviadas, useSincronizacion } from '../../core/offline/estadoDeSincronizacion.js'
import { usePendientes } from '../../core/offline/pendientes.js'
import { reintentar } from '../../core/offline/sincronizador.js'
import { useSesion } from '../../core/sesion/ContextoSesion.js'
import { Boton } from '../../core/ui/Boton.jsx'
import { Conexion } from '../../core/ui/Conexion.jsx'
import { Icono } from '../../core/ui/Icono.jsx'
import iconoVolver from '../../core/ui/iconos/arrow_back.svg'
import iconoEnviada from '../../core/ui/iconos/check_circle.svg'
import iconoError from '../../core/ui/iconos/error.svg'
import iconoInfo from '../../core/ui/iconos/info.svg'
import iconoReintentar from '../../core/ui/iconos/refresh.svg'
import iconoEnEspera from '../../core/ui/iconos/schedule.svg'
import iconoEnviando from '../../core/ui/iconos/sync.svg'
import { codigoLocal, formatearCodigo } from '../../core/utils/codigo.js'
import {
  esMismoDiaEnColombia,
  formatearFechaHora,
  formatearHora,
  formatearUltimoIngreso,
} from '../../core/utils/fechas.js'
import { SesionVencida } from './SesionVencida.jsx'

/*
 * Pantalla 08 · Pendientes de sincronizar y 08-B · Sesión vencida (RF-22, RF-23 / CU-22, CU-23
 * 3a). Figma 2:982 y 2:1048. Las novedades del dispositivo en el orden en que se registraron,
 * cómo va cada una y el reintento manual.
 */

/** Cómo va cada una: fondo, color, ícono y texto de la fila de Figma. */
const SITUACIONES = {
  enviada: { clases: 'bg-exito-suave text-exito', icono: iconoEnviada },
  enviando: { clases: 'bg-gris-100 text-info', icono: iconoEnviando },
  error: { clases: 'bg-error-suave text-error', icono: iconoError },
  espera: { clases: 'bg-gris-100 text-texto-secundario', icono: iconoEnEspera },
}

function Pendiente({ numero, pendiente, situacion, disponible, alReintentar }) {
  const { clases, icono } = SITUACIONES[situacion]
  const fecha = pendiente.fecha_registro
  const texto = {
    enviada: `Enviada · código ${formatearCodigo(pendiente.codigo)}`,
    enviando: 'Enviando…',
    error: 'Error al enviar',
    espera: 'En espera',
  }[situacion]

  return (
    <li className="flex flex-col gap-2.5 rounded-xl bg-superficie p-4 inset-ring inset-ring-borde">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex size-7 flex-none items-center justify-center rounded-full bg-gris-100 text-auxiliar-fuerte text-texto-secundario"
        >
          {numero}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-auxiliar-fuerte text-texto-secundario" translate="no">
            {codigoLocal(pendiente.id_local)}
          </p>
          <p className="text-cuerpo-pequeno text-texto">{pendiente.descripcion}</p>
          <p className="text-auxiliar text-texto-secundario">
            Registrada en finca:{' '}
            {esMismoDiaEnColombia(fecha) ? formatearHora(fecha) : formatearFechaHora(fecha)}
          </p>
        </div>
      </div>
      <p
        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-etiqueta-fuerte ${clases}`}
      >
        <Icono src={icono} tamano={18} />
        {texto}
      </p>
      {situacion === 'error' ? (
        <>
          <p className="text-auxiliar text-error">
            {pendiente.ultimo_error?.tipo === 'red'
              ? 'Se perdió la conexión durante el envío'
              : pendiente.ultimo_error?.mensaje}
          </p>
          <Boton
            tipo="secundario"
            tamano="escritorio"
            icono={iconoReintentar}
            disabled={!disponible}
            onClick={alReintentar}
            className="self-start"
          >
            Reintentar
          </Boton>
        </>
      ) : null}
    </li>
  )
}

export default function Pendientes() {
  const { perfil } = useSesion()
  const enLinea = useEnLinea()
  const cantidad = usePendientes()
  const sincronizacion = useSincronizacion()
  const { enCurso, total, hechas, enviando, enviadas, sesionVencida } = sincronizacion
  const [cola, setCola] = useState(/** @type {object[] | null} */ (null))
  const [ultima, setUltima] = useState(/** @type {string | null} */ (null))

  // La cola se vuelve a leer cada vez que la sincronización avanza o cambia la cantidad.
  useEffect(() => {
    let vigente = true
    Promise.all([listarPendientes(perfil.id), leerMeta('ultima_sincronizacion')])
      .then(([lista, fecha]) => {
        if (!vigente) return
        setCola(lista)
        setUltima(fecha ?? null)
      })
      .catch(() => vigente && setCola([]))
    return () => {
      vigente = false
    }
  }, [perfil.id, cantidad, enCurso, enviando, hechas])

  // Las enviadas se ven hasta salir de la pantalla; después están en «Mis novedades».
  useEffect(() => limpiarEnviadas, [])

  const yaEnviadas = new Set(enviadas.map((p) => p.id_local))
  const items = [
    ...enviadas.map((p) => ({ pendiente: p, situacion: 'enviada' })),
    ...(cola ?? [])
      .filter((p) => !yaEnviadas.has(p.id_local))
      .map((p) => ({
        pendiente: p,
        situacion: p.id_local === enviando ? 'enviando' : p.envio === 'error' ? 'error' : 'espera',
      })),
  ].sort((a, b) => a.pendiente.fecha_registro.localeCompare(b.pendiente.fecha_registro))
  const quedan = (cola ?? []).length

  const titulo =
    enCurso && total > 0
      ? `Enviando ${Math.min(hechas + 1, total)} de ${total}`
      : cola === null
        ? 'Cargando…'
        : quedan === 0
          ? 'Todo está sincronizado'
          : !enLinea
            ? 'En espera de conexión'
            : 'Sincronización detenida'

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 flex h-15 items-center gap-1 border-b border-borde bg-superficie pr-2 lg:hidden">
        <Link
          to="/novedades"
          aria-label="Volver a mis novedades"
          className="flex size-12 flex-none items-center justify-center rounded-control text-texto"
        >
          <Icono src={iconoVolver} tamano={24} />
        </Link>
        <p aria-hidden="true" className="min-w-0 flex-1 truncate text-subtitulo text-texto">
          Pendientes de sincronizar
        </p>
        {/* Aquí ya está la lista: el indicador no enlaza a esta misma pantalla. */}
        <Conexion pendientes={cantidad} className="flex-none" />
      </header>

      <section className="mx-auto flex w-full max-w-xl flex-col gap-3.5 px-4 pt-4 pb-6 lg:px-8 lg:pt-8">
        <h1 className="sr-only text-titulo text-texto lg:not-sr-only">Pendientes de sincronizar</h1>

        {sesionVencida && quedan > 0 ? <SesionVencida cantidad={quedan} /> : null}

        <div className="flex flex-col gap-2 rounded-xl bg-superficie p-4 inset-ring inset-ring-borde">
          <p role="status" className="text-etiqueta-fuerte text-texto">
            {titulo}
          </p>
          {total > 0 ? (
            <div aria-hidden="true" className="h-2 w-full rounded-sm bg-gris-200">
              <div
                className={`h-2 rounded-sm ${enCurso ? 'bg-info' : 'bg-deshabilitado'}`}
                style={{ width: `${(hechas / total) * 100}%` }}
              />
            </div>
          ) : null}
          {ultima ? (
            <p className="text-auxiliar text-texto-secundario">
              Última sincronización completa: {formatearUltimoIngreso(ultima)}
            </p>
          ) : null}
        </div>

        {items.length > 0 ? (
          <>
            <p className="text-auxiliar-fuerte text-texto-secundario">
              En el orden en que se registraron
            </p>
            <ol aria-label="Pendientes de sincronizar" className="flex flex-col gap-3.5">
              {items.map(({ pendiente, situacion }, indice) => (
                <Pendiente
                  key={pendiente.id_local}
                  numero={indice + 1}
                  pendiente={pendiente}
                  situacion={situacion}
                  // Con un ciclo en curso, el reintento no entraría en él y quedaría «En espera».
                  disponible={enLinea && !enCurso}
                  alReintentar={() => reintentar(perfil.id, pendiente.id_local)}
                />
              ))}
            </ol>
          </>
        ) : null}

        <p className="flex items-start gap-2 text-auxiliar text-texto-secundario">
          <Icono src={iconoInfo} tamano={18} />
          <span className="min-w-0 flex-1">
            Cada novedad conserva la fecha y hora en que la registraste en la finca. Si un envío se
            repite, no se crea un duplicado.
          </span>
        </p>

        {quedan > 0 ? (
          <Boton
            tipo="secundario"
            icono={iconoReintentar}
            disabled={!enLinea || enCurso}
            onClick={() => reintentar(perfil.id)}
            className="w-full"
          >
            Reintentar todo
          </Boton>
        ) : null}
      </section>
    </div>
  )
}
