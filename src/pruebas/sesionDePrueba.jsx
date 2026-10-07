import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { vi } from 'vitest'
import { ContextoSesion } from '../core/sesion/ContextoSesion.js'

const AREAS = {
  mantenimiento: { id: 'area-m', nombre: 'Mantenimiento' },
  sistemas: { id: 'area-s', nombre: 'Sistemas' },
}

const FINCA = {
  id: 'finca-1',
  nombre: 'Finca de prueba 01',
  razon_social: { id: 'rs-a', nombre: 'Razón social de prueba A' },
}

/** Perfiles de prueba, uno por rol. */
export const PERFILES = {
  reportante: {
    id: 'u-1',
    nombre: 'Reportante de prueba',
    rol_id: 1,
    finca_id: FINCA.id,
    area_id: null,
    activo: true,
    finca: FINCA,
    area: null,
  },
  aprobador: {
    id: 'u-3',
    nombre: 'Carlos Mario Restrepo',
    rol_id: 2,
    finca_id: null,
    area_id: AREAS.mantenimiento.id,
    activo: true,
    finca: null,
    area: AREAS.mantenimiento,
  },
  director: {
    id: 'u-5',
    nombre: 'Director de prueba',
    rol_id: 3,
    finca_id: null,
    area_id: null,
    activo: true,
    finca: null,
    area: null,
  },
  administrador: {
    id: 'u-6',
    nombre: 'Administrador de prueba',
    rol_id: 4,
    finca_id: null,
    area_id: null,
    activo: true,
    finca: null,
    area: null,
  },
}

/**
 * Pinta `ui` dentro del enrutador y de una sesión simulada.
 *
 * @param {import('react').ReactNode} ui
 * @param {object} [opciones]
 * @param {string} [opciones.ruta] Ruta inicial.
 * @param {keyof typeof PERFILES | null} [opciones.rol] `null` para «sin sesión».
 * @param {object} [opciones.sesion] Reemplaza campos de la sesión (fase, ingresar, salir…).
 */
export function pintarConSesion(ui, { ruta = '/', rol = null, sesion = {} } = {}) {
  const valor = {
    fase: rol ? 'con_sesion' : 'sin_sesion',
    perfil: rol ? PERFILES[rol] : null,
    ingresar: vi.fn(),
    salir: vi.fn(),
    ...sesion,
  }
  return {
    sesion: valor,
    ...render(
      <MemoryRouter initialEntries={[ruta]}>
        <ContextoSesion value={valor}>{ui}</ContextoSesion>
      </MemoryRouter>,
    ),
  }
}
