import { test as preparar } from '@playwright/test'
import {
  guardarSesion,
  HAY_CLAVE,
  ingresarPorElFormulario,
  MOTIVO_SIN_CLAVE,
  ROLES_CON_SESION,
} from './apoyo/usuarios.js'

/*
 * Preparación de las pruebas de extremo a extremo: cada usuario de prueba ingresa una sola
 * vez por el formulario y su sesión queda guardada para el resto de la corrida
 * (`ingresarComo`, en e2e/apoyo/usuarios.js).
 *
 * Auth limita los ingresos por minuto. Con cada prueba ingresando por su cuenta (algunas, con
 * cuatro usuarios), una corrida completa pasaba de 150 ingresos en dos minutos y «staging»
 * respondía 429 a los últimos. Así son seis, más los que prueban el ingreso mismo (CU-01).
 *
 * Los proyectos de Playwright dependen de este: corre antes que cualquier prueba.
 */

preparar.describe('Sesiones de los usuarios de prueba', () => {
  preparar.skip(!HAY_CLAVE, MOTIVO_SIN_CLAVE)

  for (const rol of ROLES_CON_SESION) {
    preparar(`el ${rol} ingresa y su sesión queda guardada`, async ({ page }) => {
      await ingresarPorElFormulario(page, rol)
      await guardarSesion(page, rol)
    })
  }
})
