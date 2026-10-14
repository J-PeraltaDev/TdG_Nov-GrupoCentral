/*
 * Un dispositivo como queda después de un ingreso, sin ingresar: la sesión de supabase-js en su
 * almacenamiento y el perfil en IndexedDB. La sesión es fabricada: sin red nadie la valida, y
 * con red el servidor la rechaza (401). Sirve para las pruebas sin conexión que no necesitan
 * datos del servidor ni la contraseña de los usuarios de prueba (RNF-10, RF-23).
 */

export const PERFIL = {
  id: '00000000-0000-4000-a000-000000000001',
  nombre: 'Reportante de prueba 01',
  rol_id: 1,
  finca_id: '00000000-0000-4000-c000-000000000001',
  area_id: null,
  activo: true,
  finca: {
    id: '00000000-0000-4000-c000-000000000001',
    nombre: 'Finca de prueba 01',
    razon_social: {
      id: '00000000-0000-4000-b000-00000000000a',
      nombre: 'Razón social de prueba A',
    },
  },
  area: null,
}

// supabase-js guarda la sesión con la clave sb-<primer tramo del host del proyecto>-auth-token.
const PROYECTO = new URL(process.env.VITE_SUPABASE_URL ?? 'http://127.0.0.1:54321').hostname.split(
  '.',
)[0]
export const CLAVE_DE_SESION = `sb-${PROYECTO}-auth-token`

/** Las áreas del catálogo, como quedan en el dispositivo al ingresar (sin red, el formulario las lee de ahí). */
export const AREAS = [
  { id: '00000000-0000-4000-d000-000000000001', nombre: 'Mantenimiento' },
  { id: '00000000-0000-4000-d000-000000000002', nombre: 'Sistemas' },
]

/**
 * Deja en el navegador la sesión, el perfil y el catálogo de áreas de un ingreso anterior, y las
 * pendientes que se le pasen (almacén `pendientes`, Tabla 32). La página tiene que haber abierto la aplicación antes,
 * para que la base local exista.
 *
 * @param {import('@playwright/test').Page} page
 * @param {number} segundosParaVencer Negativo: el token ya venció.
 * @param {{ pendientes?: object[] }} [opciones]
 */
export function simularIngresoAnterior(page, segundosParaVencer, { pendientes = [] } = {}) {
  return page.evaluate(
    async ({ clave, perfil, segundos, pendientes, areas }) => {
      localStorage.setItem(
        clave,
        JSON.stringify({
          access_token: 'fabricado.fabricado.fabricado',
          refresh_token: 'fabricado',
          token_type: 'bearer',
          expires_in: 300,
          expires_at: Math.floor(Date.now() / 1000) + segundos,
          user: { id: perfil.id, aud: 'authenticated', role: 'authenticated' },
        }),
      )
      await new Promise((resolver, rechazar) => {
        const solicitud = indexedDB.open('novedades')
        solicitud.onerror = () => rechazar(solicitud.error)
        solicitud.onsuccess = () => {
          const tx = solicitud.result.transaction(['meta', 'catalogos', 'pendientes'], 'readwrite')
          tx.objectStore('meta').put(perfil, 'perfil')
          tx.objectStore('catalogos').put(areas, 'areas')
          tx.objectStore('catalogos').put(perfil.finca, 'finca')
          for (const pendiente of pendientes) tx.objectStore('pendientes').put(pendiente)
          tx.oncomplete = () => {
            solicitud.result.close()
            resolver()
          }
        }
      })
    },
    {
      clave: CLAVE_DE_SESION,
      perfil: PERFIL,
      segundos: segundosParaVencer,
      pendientes,
      areas: AREAS,
    },
  )
}
