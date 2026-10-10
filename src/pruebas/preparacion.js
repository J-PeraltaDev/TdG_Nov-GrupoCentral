// Preparación común de las pruebas unitarias (Vitest + Testing Library).
import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterEach } from 'vitest'

// Las rutas cargan sus pantallas bajo demanda: la primera prueba que abre una paga la
// importación, y con el equipo ocupado el segundo que espera `findBy…` por defecto no alcanza.
configure({ asyncUtilTimeout: 3000 })

afterEach(() => {
  cleanup()
})
