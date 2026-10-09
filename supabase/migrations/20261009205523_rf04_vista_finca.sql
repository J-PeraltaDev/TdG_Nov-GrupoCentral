-- RF-04 (Sprint 3): vista v_finca, con lo que muestra la pantalla 30 (Fincas).
-- Fuente: SDD 6.1.4 y Figma 30. Complemento del SDD (docs/cambios-sdd.md): el modelo no trae
-- esta vista.
--
-- La lista de fincas del administrador muestra, junto a cada una, su razón social, cuántas
-- novedades abiertas tiene y cuántos reportantes activos. La API no puede contar los usuarios
-- como recurso embebido (`usuario(count)`): la lectura de `usuario` está limitada por columnas
-- (ADR 0010) y esa consulta pide la tabla completa. La vista cuenta sobre columnas permitidas.
--
-- No da acceso a nada nuevo: es security_invoker, así que cada consulta pasa por las políticas
-- de `finca`, `razon_social`, `novedad` y `usuario` de quien la hace. El administrador ve todas
-- las novedades, y por eso sus conteos son los reales; a otro rol le contaría solo las de su
-- alcance.
--
-- «Abierta» es toda novedad en un estado no final (SDD, definiciones): ni cerrada ni rechazada.
-- No hacen falta índices nuevos: novedad_finca_estado_idx y usuario_finca_id_idx ya cubren
-- las dos subconsultas.

create view public.v_finca
with (security_invoker = true)
as
select
  f.id,
  f.nombre,
  f.activo,
  f.creado_en,
  f.razon_social_id,
  rs.nombre as razon_social,
  (
    select count(n.id)
    from public.novedad n
    where n.finca_id = f.id and n.estado not in ('cerrada', 'rechazada')
  )::integer as novedades_abiertas,
  (
    select count(u.id)
    from public.usuario u
    where u.finca_id = f.id and u.rol_id = 1 and u.activo
  )::integer as reportantes_activos
from public.finca f
join public.razon_social rs on rs.id = f.razon_social_id;

comment on view public.v_finca is
  'Finca con su razón social, sus novedades abiertas y sus reportantes activos (pantalla 30, RF-04).';

-- Privilegios explícitos: solo lectura para los usuarios autenticados.
revoke all on public.v_finca from anon, authenticated;
grant select on public.v_finca to authenticated;
