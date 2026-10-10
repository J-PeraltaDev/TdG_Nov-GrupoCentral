// Preparación común de las pruebas unitarias (Vitest + Testing Library).
import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterEach } from 'vitest'

// Las rutas cargan sus pantallas bajo demanda: la primera prueba que abre una paga la
// importación, y con el equipo ocupado el segundo que espera `findBy…` por defecto no alcanza.
configure({ asyncUtilTimeout: 3000 })

// jsdom no implementa `showModal()` ni `close()` de <dialog> (jsdom 29). Se simula lo que el
// navegador hace y que la aplicación usa: abrir con el foco adentro, cerrar con Escape y
// devolver el foco a quien la abrió. El foco atrapado y el fondo inerte son del navegador.
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  const ENFOCABLES = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  const antes = new WeakMap()

  const alTeclear = (evento) => {
    if (evento.key !== 'Escape') return
    const dialogo = evento.currentTarget
    const cancelar = new Event('cancel', { cancelable: true })
    if (dialogo.dispatchEvent(cancelar)) dialogo.close()
  }

  HTMLDialogElement.prototype.showModal = function showModal() {
    antes.set(this, document.activeElement)
    this.setAttribute('open', '')
    this.addEventListener('keydown', alTeclear)
    const primero = this.querySelector(ENFOCABLES)
    if (primero) primero.focus()
    else {
      this.tabIndex = -1
      this.focus()
    }
  }

  HTMLDialogElement.prototype.close = function close() {
    if (!this.hasAttribute('open')) return
    this.removeAttribute('open')
    this.removeEventListener('keydown', alTeclear)
    antes.get(this)?.focus?.()
    this.dispatchEvent(new Event('close'))
  }
}

afterEach(() => {
  cleanup()
})
