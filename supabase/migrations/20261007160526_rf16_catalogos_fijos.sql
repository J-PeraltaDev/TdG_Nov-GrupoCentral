-- RF-16 (Sprint 1): catálogos fijos del dominio.
-- Van en una migración y no en el seed porque producción también los necesita.

insert into public.rol (id, nombre)
values
  (1, 'reportante'),
  (2, 'aprobador_area'),
  (3, 'director_agricultura'),
  (4, 'administrador');

insert into public.area (nombre)
values
  ('Mantenimiento'),
  ('Sistemas');
