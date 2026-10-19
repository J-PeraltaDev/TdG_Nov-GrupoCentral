#!/usr/bin/env node
/*
 * Herramientas para trabajar contra el proyecto «staging» de Supabase sin Docker.
 *
 *   npm run staging:push       aplica en staging las migraciones que falten
 *   npm run staging:reset      borra staging y lo reconstruye: migraciones + seed.sql
 *   npm run staging:test       corre las pruebas pgTAP de supabase/tests en staging
 *   npm run staging:types      regenera src/core/supabase/database.types.ts
 *   npm run staging:advisors   asesor de seguridad y rendimiento
 *   npm run staging:usuarios   pone la contraseña de los usuarios de prueba (.env.local)
 *   npm run staging:functions  despliega en staging las Edge Functions de supabase/functions
 *   npm run staging:secretos   pone los secretos de enviar-push y los de Vault (.env.local)
 *
 * Usa la sesión de `npx supabase login`; no necesita la contraseña de la base.
 * El proyecto está fijo en este archivo a propósito: estos comandos nunca apuntan a
 * producción, aunque la carpeta esté vinculada (`supabase link`) a «PROYECTO».
 */
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative, resolve } from 'node:path'

const STAGING = 'qxjnnanjidytbyihanet'
const PRODUCCION = 'lyrdsmfalrchbdpmikmt'
const TIPOS = 'src/core/supabase/database.types.ts'
const DOMINIO_DE_PRUEBA = '@novedades.test'

if (STAGING === PRODUCCION) throw new Error('staging.mjs no puede apuntar a producción.')

/** Ejecuta el CLI de Supabase y devuelve { estado, salida, error }. */
function supabase(argumentos, { mostrar = false } = {}) {
  const r = spawnSync('npx', ['supabase', ...argumentos], {
    shell: true,
    encoding: 'utf8',
    stdio: mostrar ? 'inherit' : ['inherit', 'pipe', 'pipe'],
    maxBuffer: 64 * 1024 * 1024,
  })
  return { estado: r.status ?? 1, salida: r.stdout ?? '', error: r.stderr ?? '' }
}

/** Corre SQL en staging por la API de administración y devuelve las filas. */
function consultar(sql) {
  const carpeta = mkdtempSync(join(tmpdir(), 'novedades-staging-'))
  const archivo = join(carpeta, 'consulta.sql')
  try {
    writeFileSync(archivo, sql, 'utf8')
    const { salida, error } = supabase([
      'db',
      'query',
      '--linked',
      '--project-ref',
      STAGING,
      '--output-format',
      'json',
      '-f',
      `"${archivo}"`,
    ])
    const texto = /[{[]/.test(salida) ? salida : error
    const json = leerJson(texto)
    // En una terminal el CLI imprime solo el arreglo de filas; cuando lo llama un agente,
    // las envuelve en un objeto { rows, warning }.
    if (Array.isArray(json)) return { filas: json }
    if (json._tag === 'Error') return { fallo: limpiarError(json.error?.message ?? texto) }
    return { filas: json.rows ?? [] }
  } catch (e) {
    return { fallo: `No se pudo leer la respuesta del CLI: ${e.message}` }
  } finally {
    rmSync(carpeta, { recursive: true, force: true })
  }
}

/** Extrae el JSON de la salida del CLI, sea un objeto o un arreglo, aunque traiga texto alrededor. */
export function leerJson(texto) {
  const inicio = texto.search(/[{[]/)
  if (inicio === -1) throw new Error(texto.trim() || 'el CLI no devolvió nada')
  const cierre = texto[inicio] === '[' ? ']' : '}'
  return JSON.parse(texto.slice(inicio, texto.lastIndexOf(cierre) + 1))
}

function limpiarError(mensaje) {
  const m = /Failed to run sql query: (.*)/s.exec(mensaje)
  return (m ? m[1] : mensaje).replace(/\\n/g, '\n').replace(/"\}$/, '').trim()
}

// --- pgTAP sin pg_prove ---------------------------------------------------------------
//
// `supabase test db` necesita Docker para correr pg_prove. Aquí cada archivo de prueba se
// envía a staging en una sola transacción que siempre termina en ROLLBACK. Como la API solo
// devuelve el resultado de la última consulta, la salida de cada `select` se guarda en una
// tabla temporal y se lee al final.
//
// Los archivos son los mismos que corre el CI con pg_prove. Dos convenciones:
//   · cada aserción es una sentencia que empieza por `select` y devuelve una columna;
//   · nada de metacomandos de psql (\set, \i…).

/** Separa un archivo SQL en sentencias, respetando cadenas, $$…$$ y comentarios. */
export function separarSentencias(sql) {
  const sentencias = []
  let actual = ''
  let i = 0
  const tomarHasta = (fin) => {
    actual += sql.slice(i, fin)
    i = fin
  }
  while (i < sql.length) {
    const c = sql[i]
    const dos = sql.slice(i, i + 2)
    if (dos === '--') {
      const fin = sql.indexOf('\n', i)
      tomarHasta(fin === -1 ? sql.length : fin)
    } else if (dos === '/*') {
      const fin = sql.indexOf('*/', i + 2)
      tomarHasta(fin === -1 ? sql.length : fin + 2)
    } else if (c === "'") {
      let j = i + 1
      while (j < sql.length && !(sql[j] === "'" && sql[j + 1] !== "'")) j += sql[j] === "'" ? 2 : 1
      tomarHasta(Math.min(j + 1, sql.length))
    } else if (c === '"') {
      const fin = sql.indexOf('"', i + 1)
      tomarHasta(fin === -1 ? sql.length : fin + 1)
    } else if (c === '$' && /^\$[A-Za-z_]*\$/.test(sql.slice(i, i + 64))) {
      const etiqueta = /^\$[A-Za-z_]*\$/.exec(sql.slice(i, i + 64))[0]
      const fin = sql.indexOf(etiqueta, i + etiqueta.length)
      tomarHasta(fin === -1 ? sql.length : fin + etiqueta.length)
    } else if (c === ';') {
      sentencias.push(actual.trim())
      actual = ''
      i += 1
    } else {
      actual += c
      i += 1
    }
  }
  sentencias.push(actual.trim())
  return sentencias.filter((s) => sinComentarios(s) !== '')
}

function sinComentarios(sentencia) {
  return sentencia
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*--.*$/gm, '')
    .trim()
}

/** Arma la transacción que corre un archivo de prueba y devuelve sus líneas TAP. */
export function armarPrueba(sql) {
  const cuerpo = separarSentencias(sql)
    .map((sentencia) => {
      const limpia = sinComentarios(sentencia)
      if (/^(begin|rollback|commit)$/i.test(limpia)) return null
      if (/^select\b/i.test(limpia)) {
        return `insert into _tap (linea) select _q._c::text from (\n${limpia}\n) as _q(_c);`
      }
      return `${limpia};`
    })
    .filter(Boolean)

  return [
    'begin;',
    'create temp table _tap (n serial primary key, linea text) on commit drop;',
    'grant all on _tap to public;',
    'grant usage on sequence _tap_n_seq to public;',
    ...cuerpo,
    'reset role;',
    'select linea from _tap order by n;',
    'rollback;',
  ].join('\n')
}

function listarPruebas(rutas) {
  const origen = rutas.length > 0 ? rutas : ['supabase/tests']
  return origen
    .flatMap((ruta) => {
      const absoluta = resolve(ruta)
      if (!existsSync(absoluta)) throw new Error(`No existe ${ruta}`)
      if (absoluta.endsWith('.sql')) return [absoluta]
      return readdirSync(absoluta, { recursive: true })
        .filter((nombre) => String(nombre).endsWith('.sql'))
        .map((nombre) => join(absoluta, String(nombre)))
    })
    .sort()
}

function probar(rutas) {
  const archivos = listarPruebas(rutas)
  let aserciones = 0
  let fallidas = 0
  const archivosConFallo = []

  for (const archivo of archivos) {
    const nombre = relative(process.cwd(), archivo).replaceAll('\\', '/')
    const { filas, fallo } = consultar(armarPrueba(readFileSync(archivo, 'utf8')))
    if (fallo) {
      console.log(`${nombre} .. ERROR\n${sangrar(fallo)}`)
      archivosConFallo.push(nombre)
      continue
    }
    const lineas = filas.flatMap((fila) => String(fila.linea ?? '').split('\n'))
    const ok = lineas.filter((l) => /^ok \d+/.test(l)).length
    const malas = lineas.filter((l) => /^not ok \d+/.test(l) && !/# TODO/i.test(l))
    const descuadre = lineas.find((l) => /^# Looks like you (planned|failed)/.test(l))
    const sinPlan = !lineas.some((l) => /^1\.\.\d+/.test(l))
    aserciones += ok + malas.length
    fallidas += malas.length

    if (malas.length > 0 || descuadre || sinPlan) {
      archivosConFallo.push(nombre)
      console.log(`${nombre} .. FALLA (${ok} bien, ${malas.length} mal)`)
      const detalle = lineas.filter((l) => /^not ok|^#/.test(l))
      console.log(sangrar((sinPlan ? ['# El archivo no declaró su plan'] : detalle).join('\n')))
    } else {
      console.log(`${nombre} .. ok (${ok})`)
    }
  }

  console.log(
    `\nArchivos: ${archivos.length} · aserciones: ${aserciones} · fallidas: ${fallidas}` +
      ` · resultado: ${archivosConFallo.length === 0 ? 'PASA' : 'FALLA'}`,
  )
  return archivosConFallo.length === 0 ? 0 : 1
}

const sangrar = (texto) => texto.replace(/^/gm, '    ')

// --- Usuarios de prueba ---------------------------------------------------------------------

/**
 * El seed crea los usuarios de prueba con una contraseña al azar que nadie conoce. Este
 * comando les pone la que cada persona definió en su .env.local, que no se sube al repo:
 * staging es accesible desde internet y el repositorio es público.
 */
function ponerClaveALosUsuariosDePrueba() {
  if (existsSync('.env.local')) process.loadEnvFile('.env.local')
  const clave = process.env.CLAVE_USUARIOS_DE_PRUEBA
  if (!clave || clave.length < 8) {
    console.error(
      'Define CLAVE_USUARIOS_DE_PRUEBA (mínimo 8 caracteres) en .env.local y vuelve a correr.',
    )
    return 1
  }
  const literal = `'${clave.replaceAll("'", "''")}'`
  const { filas, fallo } = consultar(
    `update auth.users
        set encrypted_password = extensions.crypt(${literal}, extensions.gen_salt('bf')),
            updated_at = now()
      where email like '%${DOMINIO_DE_PRUEBA}'
      returning email;`,
  )
  if (fallo) {
    console.error(fallo)
    return 1
  }
  console.log(
    `Contraseña actualizada en ${filas.length} usuarios de prueba (${DOMINIO_DE_PRUEBA}).`,
  )
  return 0
}

// --- Secretos de las notificaciones push ------------------------------------------------------

const SECRETOS_DE_PUSH = [
  'VAPID_PUBLIC_KEY',
  'VAPID_PRIVATE_KEY',
  'VAPID_SUBJECT',
  'ENVIAR_PUSH_SECRETO',
]

/**
 * Pone en staging los secretos de enviar-push y los dos de Vault que usa el disparador del
 * webhook (RF-31; plan del Sprint 5, decisión 40). Los lee de .env.local (los genera
 * `npm run vapid:claves`) y no imprime ninguno. `db reset --linked` no borra Vault.
 */
function ponerSecretosDePush() {
  if (existsSync('.env.local')) process.loadEnvFile('.env.local')
  const faltan = SECRETOS_DE_PUSH.filter((nombre) => !process.env[nombre])
  if (faltan.length) {
    console.error(
      `Faltan en .env.local: ${faltan.join(', ')}. Corre npm run vapid:claves y escribe VAPID_SUBJECT=mailto:…`,
    )
    return 1
  }
  if (!process.env.VAPID_SUBJECT.startsWith('mailto:')) {
    console.error('VAPID_SUBJECT tiene que empezar por mailto:')
    return 1
  }

  // Secretos de la función, por un archivo temporal que se borra enseguida.
  const carpeta = mkdtempSync(join(tmpdir(), 'novedades-secretos-'))
  try {
    const archivo = join(carpeta, 'secretos.env')
    const lineas = SECRETOS_DE_PUSH.map((nombre) => `${nombre}=${process.env[nombre]}`)
    writeFileSync(archivo, `${lineas.join('\n')}\n`, 'utf8')
    const { estado } = supabase([
      'secrets',
      'set',
      '--project-ref',
      STAGING,
      '--env-file',
      `"${archivo}"`,
    ])
    if (estado !== 0) {
      console.error('No se pudieron poner los secretos de la función.')
      return 1
    }
  } finally {
    rmSync(carpeta, { recursive: true, force: true })
  }

  // Vault: a dónde llama el disparador y con qué secreto.
  const literal = (valor) => `'${valor.replaceAll("'", "''")}'`
  const poner = (nombre, valor) => `
    perform vault.update_secret(s.id, ${literal(valor)}) from vault.secrets s where s.name = '${nombre}';
    if not found then perform vault.create_secret(${literal(valor)}, '${nombre}'); end if;`
  const { fallo } = consultar(`do $$
    begin
      ${poner('enviar_push_url', `https://${STAGING}.supabase.co/functions/v1/enviar-push`)}
      ${poner('enviar_push_secreto', process.env.ENVIAR_PUSH_SECRETO)}
    end
  $$;`)
  if (fallo) {
    console.error('No se pudo escribir en Vault.')
    return 1
  }
  console.log(
    `Secretos de enviar-push y de Vault puestos en staging (${SECRETOS_DE_PUSH.length + 2}).`,
  )
  return 0
}

// --- Comandos -------------------------------------------------------------------------------

const [comando, ...resto] = process.argv.slice(2)

const comandos = {
  push: () =>
    supabase(['db', 'push', '--project-ref', STAGING, ...resto], { mostrar: true }).estado,
  reset: () =>
    supabase(['db', 'reset', '--linked', '--project-ref', STAGING, ...resto], { mostrar: true })
      .estado,
  advisors: () =>
    supabase(['db', 'advisors', '--linked', '--project-ref', STAGING, ...resto], { mostrar: true })
      .estado,
  migraciones: () =>
    supabase(['migration', 'list', '--project-ref', STAGING], { mostrar: true }).estado,
  test: () => probar(resto),
  usuarios: ponerClaveALosUsuariosDePrueba,
  secretos: ponerSecretosDePush,
  // `--use-api` empaqueta las funciones en el servidor: sin él, el CLI necesita Docker
  // (docs/adr/0012). Sin nombres despliega todas; `verify_jwt` sale de supabase/config.toml.
  functions: () =>
    supabase(['functions', 'deploy', '--use-api', '--project-ref', STAGING, ...resto], {
      mostrar: true,
    }).estado,
  types: () => {
    const { estado, salida, error } = supabase([
      'gen',
      'types',
      'typescript',
      '--project-id',
      STAGING,
      '--schema',
      'public',
    ])
    if (estado !== 0 || !salida.includes('export type Database')) {
      console.error(error || salida)
      return 1
    }
    writeFileSync(TIPOS, salida.slice(salida.indexOf('export type Json')), 'utf8')
    console.log(`Tipos regenerados en ${TIPOS}`)
    return 0
  },
}

if (import.meta.filename === resolve(process.argv[1] ?? '')) {
  if (!comandos[comando]) {
    console.error(`Uso: node scripts/staging.mjs <${Object.keys(comandos).join('|')}> [opciones]`)
    process.exit(1)
  }
  process.exit(comandos[comando]())
}
