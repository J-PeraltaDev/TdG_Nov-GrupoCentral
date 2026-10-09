import { useId } from 'react'
import { Link } from 'react-router'
import { useSesion } from '../../core/sesion/ContextoSesion.js'
import { rutaDeInicio } from '../../core/sesion/roles.js'
import { Icono } from '../../core/ui/Icono.jsx'
import iconoVolver from '../../core/ui/iconos/arrow_back.svg'
import { formatearFechaSinHora } from '../../core/utils/fechas.js'
import { RESPONSABLE, VIGENTE_DESDE } from './politicaDeDatos.js'

/*
 * Política de tratamiento de datos personales (RNF-18), a la que enlaza la pantalla 01. Es una
 * pantalla sin sesión y va en su propio paquete: no pesa en la ruta de ingreso (RNF-05).
 *
 * Figma no la dibuja: usa la columna y los estilos de texto de las pantallas de acceso. El texto
 * sigue la Ley 1581 de 2012 y el Decreto 1377 de 2013 (artículo 13: contenido mínimo de la
 * política) y describe lo que el sistema hace de verdad con los datos (SDD 6.1.1 y 6.1.4). Es
 * un borrador que la empresa debe validar (docs/decisiones-pendientes.md, punto 26).
 */

function Seccion({ titulo, children }) {
  const id = useId()
  return (
    <section aria-labelledby={id} className="flex flex-col gap-2.5">
      <h2 id={id} className="text-subtitulo text-texto">
        {titulo}
      </h2>
      {children}
    </section>
  )
}

function Parrafo({ children }) {
  return <p className="text-cuerpo text-texto">{children}</p>
}

function Lista({ children }) {
  return <ul className="flex list-disc flex-col gap-1.5 pl-5 text-cuerpo text-texto">{children}</ul>
}

/** Un dato de contacto del responsable. Si la empresa no lo ha dado, no se pinta. */
function Contacto({ nombre, children }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-auxiliar text-texto-secundario">{nombre}</dt>
      <dd className="text-cuerpo break-words text-texto">{children}</dd>
    </div>
  )
}

export default function TratamientoDeDatos() {
  const { fase, perfil } = useSesion()
  const conSesion = fase === 'con_sesion'
  const { razonSocial, nit, direccion, correo, telefono } = RESPONSABLE
  const hayContacto = Boolean(nit || direccion || correo || telefono)

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-5 px-4 pt-3 pb-10">
      <Link
        to={conSesion ? rutaDeInicio(perfil.rol_id) : '/ingresar'}
        className="inline-flex min-h-12 items-center gap-1.5 self-start text-etiqueta-fuerte text-primario hover:text-primario-hover"
      >
        <Icono src={iconoVolver} tamano={18} />
        {conSesion ? 'Volver al inicio' : 'Volver al ingreso'}
      </Link>

      <header className="flex flex-col gap-2">
        <h1 className="text-titulo text-texto">Política de tratamiento de datos personales</h1>
        <p className="text-cuerpo-pequeno text-texto-secundario">Novedades · Grupo Central</p>
        <p className="text-cuerpo-pequeno text-texto-secundario">
          {VIGENTE_DESDE
            ? `Vigente desde el ${formatearFechaSinHora(VIGENTE_DESDE)}.`
            : 'Versión preliminar, en revisión por la empresa.'}
        </p>
      </header>

      <div className="flex flex-col gap-6 rounded-2xl bg-superficie p-5 inset-ring inset-ring-borde">
        <Parrafo>
          Esta política explica qué datos personales tuyos trata la plataforma Novedades, para qué
          los usa y cómo puedes ejercer tus derechos, conforme a la Ley 1581 de 2012 y al Decreto
          1377 de 2013.
        </Parrafo>

        <Seccion titulo="Quién responde por tus datos">
          <Parrafo>
            El responsable del tratamiento es {razonSocial}, que opera la plataforma para las fincas
            de Grupo Central.
          </Parrafo>
          {hayContacto ? (
            <dl className="flex flex-col gap-2.5">
              {nit ? <Contacto nombre="NIT">{nit}</Contacto> : null}
              {direccion ? <Contacto nombre="Dirección">{direccion}</Contacto> : null}
              {correo ? (
                <Contacto nombre="Correo">
                  <a href={`mailto:${correo}`} className="text-primario underline">
                    {correo}
                  </a>
                </Contacto>
              ) : null}
              {telefono ? <Contacto nombre="Teléfono">{telefono}</Contacto> : null}
            </dl>
          ) : (
            <Parrafo>
              Sus datos de contacto para este tema se publicarán aquí. Mientras tanto, las
              solicitudes se reciben a través de los administradores de la plataforma.
            </Parrafo>
          )}
        </Seccion>

        <Seccion titulo="Qué datos tratamos">
          <Lista>
            <li>Tu nombre completo.</li>
            <li>
              Tu correo de la plataforma. Lo asigna un administrador, sirve solo para ingresar y no
              es un buzón: no recibe mensajes.
            </li>
            <li>
              Tu rol (reportante, aprobador de área, director de agricultura o administrador) y la
              finca o el área que tienes asignada.
            </li>
            <li>Tu contraseña, que se guarda cifrada. Nadie en la empresa puede verla.</li>
            <li>
              Lo que haces en la plataforma: las novedades que registras, las decisiones que tomas
              sobre ellas, las observaciones que escribes, la fecha y la hora de cada acción y la
              fecha de tu último ingreso.
            </li>
            <li>Las fotografías que adjuntes como evidencia de una novedad.</li>
            <li>
              Si activas las notificaciones en tu dispositivo, los datos técnicos que entrega el
              navegador para enviártelas.
            </li>
          </Lista>
          <Parrafo>
            La plataforma no pide datos sensibles, como datos de salud o biométricos, ni está
            dirigida a menores de edad. No escribas datos sensibles tuyos ni de otras personas en
            las descripciones ni en las observaciones.
          </Parrafo>
        </Seccion>

        <Seccion titulo="Para qué los usamos">
          <Lista>
            <li>Darte acceso a la plataforma según tu rol.</li>
            <li>
              Registrar las novedades de infraestructura de las fincas, enviarlas al área que las
              atiende, aprobarlas, resolverlas y cerrarlas.
            </li>
            <li>
              Dejar constancia de quién hizo cada cosa y cuándo. Ese historial no se puede editar ni
              borrar: es la memoria del proceso.
            </li>
            <li>Avisarte de los cambios en las novedades que te corresponden.</li>
            <li>
              Elaborar reportes sobre las novedades: cuántas hay abiertas, cuánto tardan en
              atenderse y qué fallas se repiten.
            </li>
            <li>Ayudarte a recuperar el acceso si olvidas tu contraseña.</li>
          </Lista>
          <Parrafo>
            No usamos tus datos para publicidad, ni los vendemos o entregamos a terceros para fines
            distintos de estos.
          </Parrafo>
        </Seccion>

        <Seccion titulo="Quién puede verlos">
          <Parrafo>
            Tu nombre, tu rol y la finca o el área que tienes asignada los pueden ver los demás
            usuarios activos de la plataforma, porque aparecen en las novedades y en su historial.
            Tu correo solo lo ven los administradores. Las novedades las consulta cada quien según
            su rol: los reportantes, las de su finca; los aprobadores, las de su área; el director
            de agricultura y los administradores, todas. Estos permisos se aplican en la base de
            datos, no solo en las pantallas.
          </Parrafo>
        </Seccion>

        <Seccion titulo="Dónde se guardan y cómo se protegen">
          <Parrafo>
            Los datos se guardan en servicios en la nube contratados para la plataforma: Supabase,
            para la base de datos y el ingreso, y Cloudflare, para publicar la aplicación. Actúan
            como encargados del tratamiento y sus servidores pueden estar fuera de Colombia. La
            comunicación viaja cifrada y las cuentas las crean únicamente los administradores.
          </Parrafo>
          <Parrafo>
            La aplicación guarda en tu dispositivo tu sesión y los datos que necesita para funcionar
            sin conexión. Si compartes el teléfono o el computador, cierra la sesión al terminar.
          </Parrafo>
        </Seccion>

        <Seccion titulo="Cuánto tiempo se conservan">
          <Parrafo>
            Mientras tengas una cuenta activa. Cuando te retiras, un administrador desactiva tu
            cuenta: ya no puedes ingresar, pero tu nombre se conserva en el historial de las
            novedades en las que participaste, durante el tiempo que la empresa necesite para la
            trazabilidad del proceso y para cumplir sus obligaciones legales.
          </Parrafo>
        </Seccion>

        <Seccion titulo="Tus derechos">
          <Parrafo>Como titular de tus datos puedes:</Parrafo>
          <Lista>
            <li>Conocerlos, actualizarlos y rectificarlos.</li>
            <li>Pedir prueba de la autorización que diste para su tratamiento.</li>
            <li>Saber qué uso se les ha dado.</li>
            <li>
              Revocar la autorización o pedir que se supriman, cuando no exista un deber legal o
              contractual de conservarlos.
            </li>
            <li>Consultarlos gratis.</li>
            <li>
              Presentar una queja ante la Superintendencia de Industria y Comercio, después de haber
              hecho tu consulta o tu reclamo ante la empresa.
            </li>
          </Lista>
        </Seccion>

        <Seccion titulo="Cómo ejercerlos">
          <Parrafo>
            Presenta tu consulta o tu reclamo ante el responsable. Indica tu nombre, tu correo de la
            plataforma, qué solicitas y cómo podemos responderte.
          </Parrafo>
          <Lista>
            <li>
              Las consultas se responden en máximo 10 días hábiles. Si no es posible, te diremos el
              motivo y la nueva fecha, que no puede pasar de 5 días hábiles más.
            </li>
            <li>
              Los reclamos (para corregir, actualizar o suprimir datos, o por un incumplimiento de
              la ley) se responden en máximo 15 días hábiles, contados desde el día siguiente al que
              los recibimos. Si no es posible, te diremos el motivo y la nueva fecha, que no puede
              pasar de 8 días hábiles más. Si al reclamo le falta información, te la pediremos
              dentro de los 5 días hábiles siguientes.
            </li>
          </Lista>
          <Parrafo>
            Para corregir tu nombre o cambiar tu finca o tu área basta con pedírselo a un
            administrador de la plataforma.
          </Parrafo>
        </Seccion>

        <Seccion titulo="Tu autorización">
          <Parrafo>
            La empresa trata estos datos con tu autorización, que te pide antes de crear tu cuenta.
            Puedes pedir prueba de ella en cualquier momento.
          </Parrafo>
        </Seccion>

        <Seccion titulo="Vigencia y cambios">
          <Parrafo>
            Esta política rige desde su publicación y mientras la plataforma esté en uso. Si cambia
            de manera importante, te lo informaremos por la plataforma antes de aplicar el cambio.
          </Parrafo>
        </Seccion>
      </div>
    </main>
  )
}
