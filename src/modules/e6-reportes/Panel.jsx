import { useEffect, useId, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router'
import { useEnLinea } from '../../core/conexion/useEnLinea.js'
import { traducirError } from '../../core/errores/traducir.js'
import {
  obtenerNovedadesAbiertas,
  obtenerTiemposDeAtencion,
} from '../../core/supabase/repositorios/reportes.js'
import { Aviso } from '../../core/ui/Aviso.jsx'
import { Boton } from '../../core/ui/Boton.jsx'
import { CampoTexto } from '../../core/ui/CampoTexto.jsx'
import { ErrorDeCampo } from '../../core/ui/ErrorDeCampo.jsx'
import { Filtro } from '../../core/ui/Filtro.jsx'
import iconoFecha from '../../core/ui/iconos/calendar_today.svg'
import iconoSinConexion from '../../core/ui/iconos/cloud_off.svg'
import iconoError from '../../core/ui/iconos/error.svg'
import iconoActualizar from '../../core/ui/iconos/refresh.svg'
import { Pestanas } from '../../core/ui/Pestanas.jsx'
import { useEsEscritorio } from '../../core/ui/useEsEscritorio.js'
import { formatearFechaHora } from '../../core/utils/fechas.js'
import { NovedadesAbiertas } from './NovedadesAbiertas.jsx'
import { escribirPeriodo, leerPeriodo, PERIODOS } from './periodos.js'
import { TiemposDeAtencion } from './TiemposDeAtencion.jsx'

/*
 * Pantalla 23 en adelante · Panel de reportes (RF-26 a RF-29; Figma 5:783 y 5:1087). Una pestaña
 * por indicador, en la dirección (`?indicador=`), igual que su período; solo se pide la pestaña
 * que se ve. Solo lo ven el director de agricultura y el administrador, y requiere conexión.
 */

/** Las pestañas (decisión 24). Escalamiento y fallas recurrentes llegan en el PR 5. */
const INDICADORES = [
  { id: 'abiertas', nombre: 'Novedades abiertas', corta: 'Abiertas' },
  { id: 'tiempos', nombre: 'Tiempos de atención', corta: 'Tiempos', periodo: '3m' },
]

const ID_DEL_PANEL = 'panel-de-reportes'

/**
 * El selector del período (decisión 23): las opciones de Figma y «Personalizado», que abre dos
 * fechas y solo se aplica cuando las dos están y no se invierten.
 */
function SelectorDePeriodo({ periodo, corto, alCambiar }) {
  const [personalizado, setPersonalizado] = useState(
    periodo.clave === 'personalizado' ? { desde: periodo.desde, hasta: periodo.hasta } : null,
  )
  const idDelError = useId()
  const invertido = Boolean(
    personalizado?.desde && personalizado?.hasta && personalizado.desde > personalizado.hasta,
  )
  const opciones = [
    ...PERIODOS.map(({ clave }) => {
      const opcion = leerPeriodo(new URLSearchParams({ periodo: clave }), clave)
      return { valor: clave, nombre: corto ? opcion.corta : opcion.etiqueta }
    }),
    {
      valor: 'personalizado',
      nombre:
        periodo.clave === 'personalizado' ? `Personalizado: ${periodo.etiqueta}` : 'Personalizado',
    },
  ]

  const cambiarFecha = (cambio) => setPersonalizado((actual) => ({ ...actual, ...cambio }))
  // Al salir de la fecha: mientras se escribe el año, el campo pasa por 0002, 0020, 0202…
  function aplicar() {
    const { desde, hasta } = personalizado
    if (desde && hasta && desde <= hasta && (desde !== periodo.desde || hasta !== periodo.hasta)) {
      alCambiar({ clave: 'personalizado', desde, hasta })
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Filtro
        nombre="Período"
        icono={iconoFecha}
        opciones={opciones}
        value={personalizado ? 'personalizado' : periodo.clave}
        alCambiar={(valor) => {
          if (valor === 'personalizado') {
            setPersonalizado({ desde: periodo.desde, hasta: periodo.hasta })
            return
          }
          setPersonalizado(null)
          alCambiar({ clave: valor })
        }}
        className="self-start"
      />
      {personalizado ? (
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-3">
            <CampoTexto
              etiqueta="Desde"
              type="date"
              value={personalizado.desde ?? ''}
              conError={invertido}
              descritoPor={invertido ? idDelError : undefined}
              onChange={(evento) => cambiarFecha({ desde: evento.target.value || null })}
              onBlur={aplicar}
            />
            <CampoTexto
              etiqueta="Hasta"
              type="date"
              value={personalizado.hasta ?? ''}
              conError={invertido}
              descritoPor={invertido ? idDelError : undefined}
              onChange={(evento) => cambiarFecha({ hasta: evento.target.value || null })}
              onBlur={aplicar}
            />
          </div>
          <div aria-live="polite">
            {invertido ? (
              <ErrorDeCampo id={idDelError}>
                La fecha inicial debe ser anterior a la final
              </ErrorDeCampo>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default function Panel() {
  const enLinea = useEnLinea()
  const esEscritorio = useEsEscritorio()
  const { pathname, search } = useLocation()
  const [parametros, setParametros] = useSearchParams()
  const indicador =
    INDICADORES.find((uno) => uno.id === parametros.get('indicador')) ?? INDICADORES[0]
  const periodo = indicador.periodo ? leerPeriodo(parametros, indicador.periodo) : null
  const consulta = [indicador.id, periodo?.desde, periodo?.hasta].join('|')

  const [intento, setIntento] = useState(0)
  const [resultado, setResultado] = useState(null)

  useEffect(() => {
    if (!enLinea) return undefined
    let vigente = true
    const [id, desde, hasta] = consulta.split('|')
    const pedido =
      id === 'tiempos' ? obtenerTiemposDeAtencion({ desde, hasta }) : obtenerNovedadesAbiertas()
    pedido.then(
      (datos) => vigente && setResultado({ consulta, intento, datos }),
      (error) => vigente && setResultado({ consulta, intento, fallo: traducirError(error) }),
    )
    return () => {
      vigente = false
    }
  }, [consulta, enLinea, intento])

  // Lo que se ve es de esta pestaña y este período; mientras llega lo de «Actualizar», lo anterior.
  const vigente = resultado?.consulta === consulta ? resultado : null
  const actualizando = vigente !== null && vigente.intento !== intento
  const datos = vigente?.datos
  const fallo = vigente?.fallo && !actualizando ? vigente.fallo : null
  // El detalle de una novedad vuelve a esta pestaña, con su período.
  const origen = `${pathname}${search}`

  const elegirIndicador = (id) => {
    const nuevos = new URLSearchParams(parametros)
    nuevos.set('indicador', id)
    setParametros(nuevos)
  }

  return (
    <section className="flex flex-1 flex-col gap-4 px-4 pt-4 pb-24 lg:gap-6 lg:px-8 lg:py-8">
      {/* 27: en el teléfono el título va en la barra superior, sin «Datos al» ni «Actualizar». */}
      {esEscritorio ? (
        <div className="flex items-center gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h1 className="text-display text-texto">Panel de reportes</h1>
            <p className="min-h-6 text-cuerpo text-texto-secundario">
              {datos ? `Datos al ${formatearFechaHora(datos.datos_al)}` : null}
            </p>
          </div>
          {periodo ? (
            <SelectorDePeriodo
              key={periodo.clave}
              periodo={periodo}
              alCambiar={(nuevo) => setParametros(escribirPeriodo(parametros, nuevo))}
            />
          ) : null}
          <Boton
            tipo="secundario"
            icono={iconoActualizar}
            disabled={!enLinea || actualizando || !vigente}
            onClick={() => setIntento((n) => n + 1)}
            className="self-start"
          >
            {actualizando ? 'Actualizando…' : 'Actualizar'}
          </Boton>
        </div>
      ) : (
        <h1 className="sr-only">Panel de reportes</h1>
      )}

      <Pestanas
        etiqueta="Indicadores"
        variante={esEscritorio ? 'subrayada' : 'pastillas'}
        pestanas={INDICADORES.map(({ id, nombre, corta }) => ({
          id,
          nombre: esEscritorio ? nombre : corta,
        }))}
        elegida={indicador.id}
        alElegir={elegirIndicador}
        idDelPanel={ID_DEL_PANEL}
        className="self-start max-lg:w-full"
      />

      {/* 27: en el teléfono, el período va bajo las pestañas, sin el rango. */}
      {periodo && !esEscritorio ? (
        <SelectorDePeriodo
          key={periodo.clave}
          periodo={periodo}
          corto
          alCambiar={(nuevo) => setParametros(escribirPeriodo(parametros, nuevo))}
        />
      ) : null}

      <div
        id={ID_DEL_PANEL}
        role="tabpanel"
        aria-labelledby={`${ID_DEL_PANEL}-pestana-${indicador.id}`}
        aria-busy={actualizando || undefined}
        className="flex flex-col gap-4"
      >
        {!enLinea ? (
          <Aviso tipo="advertencia" icono={iconoSinConexion} titulo="Sin conexión">
            El panel necesita conexión. Ábrelo cuando tengas internet.
          </Aviso>
        ) : fallo ? (
          <Aviso
            tipo={fallo.tipo === 'red' ? 'advertencia' : 'error'}
            icono={fallo.tipo === 'red' ? iconoSinConexion : iconoError}
            role="alert"
            accion={
              <Boton tipo="texto" tamano="escritorio" onClick={() => setIntento((n) => n + 1)}>
                Reintentar
              </Boton>
            }
          >
            {fallo.mensaje}
          </Aviso>
        ) : !datos ? (
          <p role="status" className="py-6 text-center text-cuerpo-pequeno text-texto-secundario">
            Cargando…
          </p>
        ) : indicador.id === 'tiempos' ? (
          <TiemposDeAtencion datos={datos} origen={origen} />
        ) : (
          <NovedadesAbiertas datos={datos} />
        )}
      </div>
    </section>
  )
}
