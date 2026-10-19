// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { abrirLaNovedad, avisarALasPestanas, notificacionDelPush } from './notificaciones.js'

const ORIGEN = 'https://novedades.ejemplo.test'

const datos = (valor) => ({
  json: () => (typeof valor === 'string' ? JSON.parse(valor) : valor),
})

function simularPestanas(pestanas) {
  return {
    matchAll: vi.fn(async () => pestanas),
    openWindow: vi.fn(async () => null),
  }
}

const pestana = (navegar = vi.fn(async () => null)) => ({
  focus: vi.fn(async () => null),
  navigate: navegar,
  postMessage: vi.fn(),
})

describe('Service worker · push (RF-31; decisión 46)', () => {
  it('RF-31 / CU-31: muestra el título y el cuerpo de enviar-push; los de una novedad se reemplazan', () => {
    const { titulo, opciones } = notificacionDelPush(
      datos({
        titulo: 'NOV-0153 · En atención',
        cuerpo: 'Sistemas tomó tu novedad para atención.',
        url: '/novedades/n-153?aviso=a-1',
        novedad_id: 'n-153',
      }),
    )

    expect(titulo).toBe('NOV-0153 · En atención')
    expect(opciones).toEqual({
      body: 'Sistemas tomó tu novedad para atención.',
      icon: '/iconos/icono-192.png',
      lang: 'es-CO',
      tag: 'n-153',
      // Reemplaza la anterior, pero vuelve a sonar: es un cambio nuevo.
      renotify: true,
      data: { url: '/novedades/n-153?aviso=a-1' },
    })
  })

  it('RF-31: un mensaje vacío o que no es JSON se muestra con el nombre de la aplicación', () => {
    for (const mensaje of [null, datos('no es json')]) {
      const { titulo, opciones } = notificacionDelPush(mensaje)
      expect(titulo).toBe('Novedades Grupo Central')
      expect(opciones.data).toEqual({ url: '/' })
      expect(opciones.renotify).toBe(false)
    }
  })

  it('RF-30: avisa a las pestañas abiertas para que vuelvan a contar', async () => {
    const abiertas = [pestana(), pestana()]

    await avisarALasPestanas(simularPestanas(abiertas))

    for (const abierta of abiertas) {
      expect(abierta.postMessage).toHaveBeenCalledWith({ type: 'AVISO_NUEVO' })
    }
  })

  it('RF-31 / CU-31: tocarla enfoca una pestaña abierta y la lleva a la novedad', async () => {
    const abierta = pestana()
    const clientes = simularPestanas([abierta])

    await abrirLaNovedad(clientes, ORIGEN, '/novedades/n-153?aviso=a-1')

    expect(abierta.focus).toHaveBeenCalled()
    expect(abierta.navigate).toHaveBeenCalledWith(`${ORIGEN}/novedades/n-153?aviso=a-1`)
    expect(clientes.openWindow).not.toHaveBeenCalled()
  })

  it('RF-31: sin pestañas abiertas, o si la abierta no se deja llevar, abre una nueva', async () => {
    const sinPestanas = simularPestanas([])
    await abrirLaNovedad(sinPestanas, ORIGEN, '/novedades/n-153')
    expect(sinPestanas.openWindow).toHaveBeenCalledWith(`${ORIGEN}/novedades/n-153`)

    const ajena = simularPestanas([pestana(vi.fn(async () => Promise.reject(new TypeError('x'))))])
    await abrirLaNovedad(ajena, ORIGEN, '/novedades/n-153')
    expect(ajena.openWindow).toHaveBeenCalledWith(`${ORIGEN}/novedades/n-153`)
  })

  it('seguridad: nunca abre una dirección de otro origen', async () => {
    const clientes = simularPestanas([pestana()])

    await abrirLaNovedad(clientes, ORIGEN, 'https://otro.ejemplo.test/phishing')
    await abrirLaNovedad(clientes, ORIGEN, '//otro.ejemplo.test/phishing')

    expect(clientes.openWindow).not.toHaveBeenCalled()
    expect(clientes.matchAll).not.toHaveBeenCalled()
  })
})
