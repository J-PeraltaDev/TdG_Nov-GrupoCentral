import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router'
import { textoDelAviso } from '../../../supabase/functions/_shared/plantillas.js'
import { pedirConteoDeInsignias } from '../../app/insignias.js'
import { useEnLinea } from '../../core/conexion/useEnLinea.js'
import { traducirError } from '../../core/errores/traducir.js'
import { useSesion } from '../../core/sesion/ContextoSesion.js'
import { listarAvisos, marcarAvisosLeidos } from '../../core/supabase/repositorios/avisos.js'
import { Aviso } from '../../core/ui/Aviso.jsx'
import { Boton } from '../../core/ui/Boton.jsx'
import { ESTADOS } from '../../core/ui/presentacionDelEstado.js'
import { Icono } from '../../core/ui/Icono.jsx'
import iconoSinConexion from '../../core/ui/iconos/cloud_off.svg'
import iconoError from '../../core/ui/iconos/error.svg'
import { formatearCodigo } from '../../core/utils/codigo.js'
import { cuandoLlegoElAviso } from '../../core/utils/fechas.js'
import { HojaActivarNotificaciones } from './HojaActivarNotificaciones.jsx'

/*
 * Pantalla 10 · Avisos (RF-30, CU-30; Figma 2:1612). Los avisos del usuario por día, del más
 * reciente al más antiguo. Tocar uno lo marca leído y abre la novedad (CU-30 4 y 5). Sin conexión
 * no se pide nada: los avisos no se guardan en el dispositivo (decisión 35 del plan).
 */

/** Grupos de Figma («Hoy», «Ayer», «Esta semana») y, sin dibujo, «Anteriores». */
function agrupar(avisos) {
  const grupos = []
  for (const aviso of avisos) {
    const { grupo, cuando } = cuandoLlegoElAviso(aviso.creada_en)
    if (grupos.at(-1)?.titulo !== grupo) grupos.push({ titulo: grupo, avisos: [] })
    grupos.at(-1).avisos.push({ ...aviso, cuando })
  }
  return grupos
}

function FilaDelAviso({ aviso, rolId, alAbrir }) {
  const estado = ESTADOS[aviso.estado_nuevo]
  // Si la novedad pasó a otra área, quien recibió el aviso ya no la puede ver.
  const codigo = aviso.novedad ? formatearCodigo(aviso.novedad.codigo) : 'Novedad'
  const texto = aviso.novedad
    ? textoDelAviso(aviso, rolId, aviso.novedad)
    : 'La novedad pasó a otra área.'

  return (
    <li>
      <button
        type="button"
        onClick={() => alAbrir(aviso)}
        className={`flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primario ${
          aviso.leida ? 'hover:bg-gris-100' : 'bg-primario-contenedor'
        }`}
      >
        <span
          aria-hidden="true"
          className={`flex size-10 flex-none items-center justify-center rounded-full ${estado?.clases ?? ''}`}
        >
          {estado ? <Icono src={estado.icono} tamano={20} /> : null}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex items-baseline gap-1.5">
            <span className="min-w-0 flex-1 text-etiqueta-fuerte text-texto" translate="no">
              {codigo}
            </span>
            <span className="flex-none text-auxiliar text-texto-secundario">{aviso.cuando}</span>
          </span>
          <span className="text-cuerpo-pequeno text-texto">{texto}</span>
        </span>
        {aviso.leida ? null : (
          <>
            <span aria-hidden="true" className="mt-1.5 size-2.5 flex-none rounded-full bg-info" />
            <span className="sr-only">, Sin leer</span>
          </>
        )}
      </button>
    </li>
  )
}

export default function Avisos() {
  const { perfil } = useSesion()
  const navegar = useNavigate()
  const enLinea = useEnLinea()
  // El marco cuenta los sin leer de todas las páginas, no solo de las cargadas.
  const { insignias = {} } = useOutletContext() ?? {}
  const [lista, setLista] = useState(null)
  const [fallo, setFallo] = useState(null)
  const [intento, setIntento] = useState(0)
  const [ocupado, setOcupado] = useState(false)

  useEffect(() => {
    if (!enLinea) return undefined
    let vigente = true
    listarAvisos()
      .then((pagina) => {
        if (!vigente) return
        setLista({ ...pagina, pagina: 0 })
        setFallo(null)
      })
      .catch((error) => {
        if (vigente)
          setFallo({ ...traducirError(error), reintentar: () => setIntento((n) => n + 1) })
      })
    return () => {
      vigente = false
    }
  }, [enLinea, intento])

  function abrir(aviso) {
    // Abre de una vez; si la marca falla, el aviso sigue sin leer y se vuelve a contar.
    if (!aviso.leida) marcarAvisosLeidos([aviso.id]).then(pedirConteoDeInsignias, () => {})
    navegar(`/novedades/${aviso.novedad_id}`, { state: { origen: '/avisos' } })
  }

  async function marcarTodas() {
    setOcupado(true)
    try {
      await marcarAvisosLeidos(null)
      setLista((actual) => ({
        ...actual,
        avisos: actual.avisos.map((aviso) => ({ ...aviso, leida: true })),
      }))
      setFallo(null)
      pedirConteoDeInsignias()
    } catch (error) {
      setFallo({ ...traducirError(error), reintentar: marcarTodas })
    } finally {
      setOcupado(false)
    }
  }

  async function verMas() {
    setOcupado(true)
    try {
      const siguiente = lista.pagina + 1
      const pagina = await listarAvisos({ pagina: siguiente })
      setLista((actual) => ({
        avisos: [...actual.avisos, ...pagina.avisos],
        total: pagina.total,
        pagina: siguiente,
      }))
      setFallo(null)
    } catch (error) {
      setFallo({ ...traducirError(error), reintentar: verMas })
    } finally {
      setOcupado(false)
    }
  }

  const avisos = lista?.avisos ?? []
  const haySinLeer = avisos.some((aviso) => !aviso.leida) || insignias['/avisos'] > 0

  return (
    <section className="mx-auto flex w-full max-w-xl flex-1 flex-col pt-2 pb-24 lg:px-8 lg:py-8">
      <h1 className="sr-only text-titulo text-texto lg:not-sr-only lg:pb-4">Avisos</h1>
      <HojaActivarNotificaciones perfil={perfil} />

      {!enLinea ? (
        <div className="px-4 pt-2 lg:px-0">
          <Aviso tipo="advertencia" icono={iconoSinConexion} titulo="Sin conexión">
            Los avisos necesitan conexión. Ábrelos cuando tengas internet.
          </Aviso>
        </div>
      ) : (
        <>
          {haySinLeer ? (
            <Boton
              tipo="texto"
              onClick={marcarTodas}
              disabled={ocupado}
              className="self-end max-lg:mr-1"
            >
              Marcar todas como leídas
            </Boton>
          ) : null}

          {lista === null && !fallo ? (
            <p role="status" className="py-6 text-center text-cuerpo-pequeno text-texto-secundario">
              Cargando…
            </p>
          ) : null}

          {lista !== null && avisos.length === 0 ? (
            <p className="py-10 text-center text-cuerpo text-texto-secundario">No tienes avisos.</p>
          ) : null}

          {agrupar(avisos).map(({ titulo, avisos: delGrupo }, i) => (
            <div
              key={titulo}
              className="lg:mt-3 lg:overflow-hidden lg:rounded-2xl lg:bg-superficie lg:inset-ring lg:inset-ring-borde"
            >
              <h2
                id={`avisos-grupo-${i}`}
                className="px-4 pt-4 pb-2 text-auxiliar-fuerte text-texto-secundario"
              >
                {titulo}
              </h2>
              <ul aria-labelledby={`avisos-grupo-${i}`}>
                {delGrupo.map((aviso) => (
                  <FilaDelAviso
                    key={aviso.id}
                    aviso={aviso}
                    rolId={perfil.rol_id}
                    alAbrir={abrir}
                  />
                ))}
              </ul>
            </div>
          ))}

          {fallo ? (
            <div className="px-4 pt-3 lg:px-0">
              <Aviso
                tipo={fallo.tipo === 'red' ? 'advertencia' : 'error'}
                icono={fallo.tipo === 'red' ? iconoSinConexion : iconoError}
                role="alert"
                accion={
                  <Boton tipo="texto" tamano="escritorio" onClick={fallo.reintentar}>
                    Reintentar
                  </Boton>
                }
              >
                {fallo.mensaje}
              </Aviso>
            </div>
          ) : null}

          {lista !== null && avisos.length < lista.total && !fallo ? (
            <Boton
              tipo="secundario"
              onClick={verMas}
              disabled={ocupado}
              className="mt-3 self-center"
            >
              {ocupado ? 'Cargando…' : 'Ver más'}
            </Boton>
          ) : null}

          {avisos.length > 0 ? (
            <p className="px-4 pt-5 pb-2 text-center text-auxiliar text-texto-secundario">
              Toca un aviso para abrir la novedad.
            </p>
          ) : null}
        </>
      )}
    </section>
  )
}
