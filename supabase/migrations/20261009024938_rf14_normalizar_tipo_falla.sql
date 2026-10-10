-- RF-14 (Sprint 2): normalización del nombre de un tipo de falla.
-- Fuente: SDD 6.1.8. `tipo_falla.nombre_normalizado` es único, de modo que «Biométrico»,
-- «biometrico» y «  BIOMÉTRICO  » son el mismo tipo (CU-14 5a).
--
-- Minúsculas, sin tildes, sin espacios al inicio ni al final y con espacios simples.
--
-- unaccent(text) no es IMMUTABLE: depende del diccionario que encuentre en la ruta de
-- búsqueda. Por eso se llama la versión que recibe el diccionario, con el nombre calificado;
-- así el resultado depende solo del texto y la función puede declararse immutable.
--
-- Vive en private y nadie recibe `execute`: la usan registrar_solucion y sugerir_tipos_falla,
-- que corren con los privilegios de su propietario.

create function private.normalizar_tipo_falla(p_nombre text)
returns text
language sql
immutable
set search_path = ''
as $$
  select btrim(
    regexp_replace(
      lower(extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(p_nombre, ''))),
      '\s+',
      ' ',
      'g'
    )
  );
$$;

comment on function private.normalizar_tipo_falla(text) is
  'Nombre de un tipo de falla en minúsculas, sin tildes, sin espacios en los extremos y con espacios simples (SDD 6.1.8).';

revoke execute on function private.normalizar_tipo_falla(text) from public, anon, authenticated;
