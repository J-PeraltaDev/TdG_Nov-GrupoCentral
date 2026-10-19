// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  avisoDeDesactivar,
  avisoDeFusion,
  nombreRepetido,
  normalizarNombre,
  opcionDeTipo,
  ordenarCatalogo,
  textoDelCambio,
} from './catalogoDeTipos.js'

const tipo = (id, nombre, novedades = 0, activo = true) => ({
  id,
  nombre,
  activo,
  novedades,
  creado_en: '2026-04-14T12:00:00+00:00',
  creado_por: 'Jhon Fredy Mosquera',
})

const cambio = (accion, tipo_falla_id, valor_anterior, fecha, tipo_destino_id = null) => ({
  id: `${accion}-${tipo_falla_id}-${fecha}`,
  accion,
  tipo_falla_id,
  tipo_destino_id,
  valor_anterior,
  fecha,
  usuario: 'Paula Giraldo',
})

describe('Catálogo de tipos de falla (RF-32, pantalla 31)', () => {
  it('RF-32 / CU-32 2: activos primero, de más a menos novedades; sin los fusionados', () => {
    const tipos = [
      tipo('radio', 'Radio de comunicación', 1, false),
      tipo('bio', 'Biométrico', 11),
      tipo('falla-bio', 'Falla biometrico', 0, false),
      tipo('bombas', 'Bombas', 9),
      tipo('camaras', 'Cámaras', 9),
      tipo('internet', 'Conectividad a internet', 16),
    ]
    const cambios = [
      cambio('fusionar', 'falla-bio', 'Falla biometrico', '2026-09-21T10:00:00Z', 'bio'),
    ]

    expect(ordenarCatalogo(tipos, cambios).map(({ id }) => id)).toEqual([
      'internet',
      'bio',
      'bombas',
      'camaras',
      'radio',
    ])
  })

  it('RF-32 / CU-32 3a: compara como el servidor, sin tildes, mayúsculas, ñ ni espacios de más', () => {
    expect(normalizarNombre('  Señal   DE Cámaras ')).toBe('senal de camaras')

    const tipos = [tipo('bio', 'Biométrico', 11), tipo('radio', 'Radio', 1, false)]
    expect(nombreRepetido('  biometrico ', 'falla-bio', tipos)).toBe(tipos[0])
    expect(nombreRepetido('RADIO', 'falla-bio', tipos)).toBe(tipos[1])
    // El mismo tipo con otras tildes sí se puede.
    expect(nombreRepetido('biometrico', 'bio', tipos)).toBeNull()
    expect(nombreRepetido('   ', 'bio', tipos)).toBeNull()
  })

  it('RF-32: el registro de cambios dice el antes y el después', () => {
    const tipos = [tipo('internet', 'Conectividad a internet'), tipo('bio', 'Biométrico')]
    const cambios = [
      cambio('renombrar', 'internet', 'Conectividad', '2026-09-22T10:00:00Z'),
      cambio('fusionar', 'falla-bio', 'Falla biometrico', '2026-09-21T10:00:00Z', 'bio'),
      cambio('renombrar', 'internet', 'internet', '2026-09-20T10:00:00Z'),
      cambio('desactivar', 'radio', 'Radio de comunicación', '2026-09-18T10:00:00Z'),
    ]
    const texto = (c) => textoDelCambio(c, tipos, cambios)

    expect(cambios.map(texto)).toEqual([
      '«Conectividad» → «Conectividad a internet»',
      '«Falla biometrico» → «Biométrico»',
      // Su nombre nuevo es el anterior del renombre siguiente.
      '«internet» → «Conectividad»',
      '«Radio de comunicación»',
    ])
  })

  it('RF-32 / CU-32 4: la opción y el aviso de 31-C, con el singular y sin novedades', () => {
    const bio = tipo('bio', 'Biométrico', 11)
    expect(opcionDeTipo(bio)).toBe('Biométrico (11 novedades)')
    expect(avisoDeFusion(tipo('f', 'Falla biometrico', 2), bio)).toBe(
      'Las 2 novedades de «Falla biometrico» pasarán a «Biométrico», que quedará con 13. «Falla biometrico» saldrá de la lista.',
    )
    expect(avisoDeFusion(tipo('f', 'Falla', 1), bio)).toBe(
      'La novedad de «Falla» pasará a «Biométrico», que quedará con 12. «Falla» saldrá de la lista.',
    )
    expect(avisoDeFusion(tipo('f', 'Falla'), bio)).toBe(
      '«Falla» no tiene novedades. «Falla» saldrá de la lista.',
    )
  })

  it('RF-32: la confirmación de desactivar (decisión 52), con su singular', () => {
    expect(avisoDeDesactivar(tipo('r', 'Radio', 3))).toBe(
      '«Radio» saldrá de las sugerencias. Sus 3 novedades lo conservan.',
    )
    expect(avisoDeDesactivar(tipo('r', 'Radio', 1))).toBe(
      '«Radio» saldrá de las sugerencias. Su novedad lo conserva.',
    )
    expect(avisoDeDesactivar(tipo('r', 'Radio'))).toBe('«Radio» saldrá de las sugerencias.')
  })
})
