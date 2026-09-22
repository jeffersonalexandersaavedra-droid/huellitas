-- ============================================================
-- HUELLITAS - SQL ÚNICO Y DEFINITIVO
-- Pega y ejecuta este archivo completo en el SQL Editor de
-- Supabase. Reemplaza cualquier versión anterior (v2, v3, etc.):
-- de ahora en adelante este es el ÚNICO archivo SQL del proyecto.
--
-- ATENCIÓN: el bloque de LIMPIEZA borra las tablas y TODOS sus
-- datos (incluido cualquier estudiante de prueba que hayas
-- creado a mano en turnos anteriores, tipo "Aldair Salas Flores").
-- Es intencional: los estudiantes de prueba ahora se crean desde
-- el panel admin (/admin/estudiantes/nuevo), no por SQL.
-- ============================================================

-- LIMPIEZA (borra todo lo mal creado antes)
drop table if exists notas_curso cascade;
drop table if exists pagos cascade;
drop table if exists cuotas cascade;
drop table if exists solicitudes_documentos cascade;
drop table if exists notas_bimestre cascade;
drop table if exists estudiante_apoderado cascade;
drop table if exists matriculas cascade;
drop table if exists estudiantes cascade;
drop table if exists apoderados cascade;
drop table if exists docentes cascade;
drop table if exists aulas cascade;
drop table if exists anios_escolares cascade;
drop table if exists conceptos_cobro cascade;
drop table if exists descuentos cascade;

drop function if exists public.is_admin();
drop function if exists public.apoderado_estudiante_ids();
drop function if exists public.apoderado_matricula_ids();
drop function if exists public.mi_estudiante_id();
drop function if exists public.mis_matricula_ids();

-- ============================================
-- TABLAS
-- ============================================

-- Años escolares
create table anios_escolares (
  id uuid primary key default gen_random_uuid(),
  anio integer not null unique,
  activo boolean default false,
  fecha_inicio date,
  fecha_fin date,
  created_at timestamptz default now()
);

-- Aulas (asociadas a un año escolar)
create table aulas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  nivel text not null check (nivel in ('inicial', 'primaria')),
  anio_escolar_id uuid references anios_escolares(id) on delete cascade,
  created_at timestamptz default now()
);

-- Docentes (esquema listo, sin funcionalidad aún)
create table docentes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  dni text unique,
  nombres text not null,
  apellidos text not null,
  email text,
  telefono text,
  activo boolean default true,
  created_at timestamptz default now()
);

-- Estudiantes (ES la cuenta que se loguea al portal)
create table estudiantes (
  id uuid primary key default gen_random_uuid(),
  dni text unique not null,
  nombres text not null,
  apellidos text not null,
  fecha_nacimiento date,
  user_id uuid references auth.users(id) on delete set null,
  email_interno text unique,
  password_cambiado boolean default false,
  activo boolean default true,
  created_at timestamptz default now()
);

create index idx_estudiantes_dni on estudiantes(dni);
create index idx_estudiantes_user_id on estudiantes(user_id);

-- Apoderados (SOLO datos de contacto, sin login)
create table apoderados (
  id uuid primary key default gen_random_uuid(),
  dni text,
  nombres text not null,
  apellidos text not null,
  parentesco text check (parentesco in ('padre', 'madre', 'tutor')),
  telefono text,
  email text,
  created_at timestamptz default now()
);

-- Relación estudiante-apoderado
create table estudiante_apoderado (
  id uuid primary key default gen_random_uuid(),
  estudiante_id uuid references estudiantes(id) on delete cascade,
  apoderado_id uuid references apoderados(id) on delete cascade,
  es_principal boolean default false,
  created_at timestamptz default now(),
  unique(estudiante_id, apoderado_id)
);

-- Matrículas (un estudiante por año en un aula)
create table matriculas (
  id uuid primary key default gen_random_uuid(),
  estudiante_id uuid references estudiantes(id) on delete cascade,
  aula_id uuid references aulas(id),
  anio_escolar_id uuid references anios_escolares(id),
  docente_id uuid references docentes(id),
  fecha_matricula date default current_date,
  estado text default 'activa' check (estado in ('activa', 'retirado', 'culminado')),
  fecha_retiro date,
  motivo_retiro text,
  created_at timestamptz default now()
);

-- Conceptos de cobro
create table conceptos_cobro (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  tipo text check (tipo in ('matricula', 'pension', 'documento', 'otro')),
  monto_base numeric(10,2) not null,
  activo boolean default true,
  created_at timestamptz default now()
);

-- Descuentos por año
create table descuentos (
  id uuid primary key default gen_random_uuid(),
  anio_escolar_id uuid references anios_escolares(id) on delete cascade,
  tipo text check (tipo in ('puntualidad', 'hermano')),
  monto numeric(10,2) not null,
  activo boolean default true,
  created_at timestamptz default now()
);

-- Cuotas generadas por matrícula
create table cuotas (
  id uuid primary key default gen_random_uuid(),
  matricula_id uuid references matriculas(id) on delete cascade,
  concepto_id uuid references conceptos_cobro(id),
  mes integer check (mes between 1 and 12),
  monto numeric(10,2) not null,
  monto_con_descuento numeric(10,2),
  fecha_vencimiento date not null,
  estado text default 'pendiente' check (estado in ('pendiente', 'validando', 'verificado', 'pagado', 'vencido')),
  created_at timestamptz default now()
);

-- Pagos (con flujo de 3 pasos: validando, verificado, pagado)
create table pagos (
  id uuid primary key default gen_random_uuid(),
  cuota_id uuid references cuotas(id) on delete set null,
  matricula_id uuid references matriculas(id) on delete set null,
  monto numeric(10,2) not null,
  metodo text check (metodo in ('efectivo', 'yape', 'plin', 'transferencia', 'deposito')),
  banco text,
  numero_operacion text,
  voucher_url text,
  fecha_pago timestamptz default now(),
  estado text default 'validando' check (estado in ('validando', 'verificado', 'pagado', 'rechazado')),
  validado_por uuid references auth.users(id),
  fecha_validacion timestamptz,
  titular_comprobante_nombre text,
  titular_comprobante_dni text,
  numero_comprobante text,
  serie_comprobante text,
  tipo_comprobante text check (tipo_comprobante in ('boleta', 'factura', 'ticket')),
  created_at timestamptz default now()
);

-- Notas por curso y bimestre
create table notas_curso (
  id uuid primary key default gen_random_uuid(),
  matricula_id uuid references matriculas(id) on delete cascade,
  curso text not null,
  bimestre integer check (bimestre between 1 and 4),
  nota text not null,
  comentario text,
  fecha_registro timestamptz default now(),
  registrado_por uuid,
  unique(matricula_id, curso, bimestre)
);

-- Solicitudes de documentos
create table solicitudes_documentos (
  id uuid primary key default gen_random_uuid(),
  matricula_id uuid references matriculas(id) on delete cascade,
  tipo_documento text,
  estado text default 'pendiente' check (estado in ('pendiente', 'procesando', 'listo', 'entregado')),
  fecha_solicitud timestamptz default now(),
  fecha_entrega timestamptz,
  monto numeric(10,2),
  created_at timestamptz default now()
);

-- ============================================
-- ÍNDICES adicionales de uso frecuente
-- ============================================
create index idx_matriculas_estudiante on matriculas(estudiante_id);
create index idx_matriculas_anio on matriculas(anio_escolar_id);
create index idx_cuotas_matricula on cuotas(matricula_id);
create index idx_pagos_matricula on pagos(matricula_id);
create index idx_notas_curso_matricula on notas_curso(matricula_id);
create index idx_estudiante_apoderado_estudiante on estudiante_apoderado(estudiante_id);

-- ============================================
-- RLS - ROW LEVEL SECURITY
-- ============================================

alter table estudiantes enable row level security;
alter table matriculas enable row level security;
alter table cuotas enable row level security;
alter table pagos enable row level security;
alter table notas_curso enable row level security;
alter table solicitudes_documentos enable row level security;

-- Estudiante ve solo sus propios datos
create policy "estudiante_ve_su_perfil"
  on estudiantes for select
  using (user_id = auth.uid());

-- Estudiante puede actualizar su propia fila (necesario para que
-- "password_cambiado" se marque true al cambiar su contraseña
-- desde el portal; sin esta política el UPDATE queda bloqueado
-- por RLS y el banner de "cambiar contraseña" nunca se apaga).
create policy "estudiante_actualiza_su_perfil"
  on estudiantes for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Admin ve todo (identificado por app_metadata.role = 'admin')
create policy "admin_todo_estudiantes"
  on estudiantes for all
  using (
    coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin'
  );

create policy "estudiante_ve_sus_matriculas"
  on matriculas for select
  using (
    estudiante_id in (select id from estudiantes where user_id = auth.uid())
  );

create policy "admin_todo_matriculas"
  on matriculas for all
  using (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');

create policy "estudiante_ve_sus_cuotas"
  on cuotas for select
  using (
    matricula_id in (
      select m.id from matriculas m
      join estudiantes e on e.id = m.estudiante_id
      where e.user_id = auth.uid()
    )
  );

-- Deja que el estudiante marque SU cuota como "validando" al subir
-- un voucher de pago (Yape/transferencia), y solo a ese estado: no
-- puede marcarla "pagado" ni tocar una que ya esté pagada/verificada.
-- Sin esto, los modales de pago insertan el pago pero la cuota se
-- queda en "pendiente" para siempre.
create policy "estudiante_marca_cuota_validando"
  on cuotas for update
  using (
    matricula_id in (
      select m.id from matriculas m
      join estudiantes e on e.id = m.estudiante_id
      where e.user_id = auth.uid()
    )
    and estado in ('pendiente', 'vencido')
  )
  with check (
    matricula_id in (
      select m.id from matriculas m
      join estudiantes e on e.id = m.estudiante_id
      where e.user_id = auth.uid()
    )
    and estado = 'validando'
  );

create policy "admin_todo_cuotas"
  on cuotas for all
  using (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');

create policy "estudiante_ve_sus_pagos"
  on pagos for select
  using (
    matricula_id in (
      select m.id from matriculas m
      join estudiantes e on e.id = m.estudiante_id
      where e.user_id = auth.uid()
    )
  );

create policy "estudiante_crea_pagos"
  on pagos for insert
  with check (
    matricula_id in (
      select m.id from matriculas m
      join estudiantes e on e.id = m.estudiante_id
      where e.user_id = auth.uid()
    )
  );

create policy "admin_todo_pagos"
  on pagos for all
  using (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');

create policy "estudiante_ve_sus_notas"
  on notas_curso for select
  using (
    matricula_id in (
      select m.id from matriculas m
      join estudiantes e on e.id = m.estudiante_id
      where e.user_id = auth.uid()
    )
  );

create policy "admin_todo_notas"
  on notas_curso for all
  using (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');

create policy "estudiante_ve_sus_solicitudes"
  on solicitudes_documentos for select
  using (
    matricula_id in (
      select m.id from matriculas m
      join estudiantes e on e.id = m.estudiante_id
      where e.user_id = auth.uid()
    )
  );

create policy "admin_todo_solicitudes"
  on solicitudes_documentos for all
  using (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');

-- ------------------------------------------------------------
-- Tablas sin RLS en tu especificación original, con dos
-- excepciones que agrego porque si no se rompe la app ya
-- construida (marcadas explícitamente abajo):
-- ------------------------------------------------------------

-- aulas / anios_escolares / conceptos_cobro: el portal del
-- estudiante y el panel admin necesitan LEER estos catálogos
-- (nombre del aula, año activo, nombre del concepto de cobro).
-- Sin una política de SELECT, al activar RLS PostgREST devolvería
-- estos campos en null en cualquier consulta con join. Se dejan
-- de lectura abierta a cualquier usuario autenticado; solo el
-- admin puede escribir.
alter table anios_escolares enable row level security;
create policy "catalogo_select_autenticados" on anios_escolares for select to authenticated using (true);
create policy "admin_todo_anios_escolares" on anios_escolares for all
  using (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');

alter table aulas enable row level security;
create policy "catalogo_select_autenticados" on aulas for select to authenticated using (true);
create policy "admin_todo_aulas" on aulas for all
  using (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');

alter table conceptos_cobro enable row level security;
create policy "catalogo_select_autenticados" on conceptos_cobro for select to authenticated using (true);
create policy "admin_todo_conceptos_cobro" on conceptos_cobro for all
  using (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');

alter table descuentos enable row level security;
create policy "catalogo_select_autenticados" on descuentos for select to authenticated using (true);
create policy "admin_todo_descuentos" on descuentos for all
  using (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');

-- apoderados / estudiante_apoderado / docentes: son datos de
-- contacto/personal (teléfonos, correos). Nada del portal del
-- estudiante los lee hoy, así que quedan solo para el admin
-- (evita dejar esos datos abiertos a cualquiera con la anon key).
alter table apoderados enable row level security;
create policy "admin_todo_apoderados" on apoderados for all
  using (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');

alter table estudiante_apoderado enable row level security;
create policy "admin_todo_estudiante_apoderado" on estudiante_apoderado for all
  using (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');

alter table docentes enable row level security;
create policy "admin_todo_docentes" on docentes for all
  using (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');

-- ============================================
-- STORAGE (bucket de vouchers de pago)
-- No estaba en tu bloque, pero los modales de pago (Yape /
-- transferencia) ya construidos suben el voucher a este bucket:
-- sin esto, "Enviar para verificación" falla al subir el archivo.
-- ============================================
insert into storage.buckets (id, name, public)
values ('vouchers', 'vouchers', true)
on conflict (id) do update set public = true;

drop policy if exists "vouchers_admin_todo" on storage.objects;
drop policy if exists "vouchers_padre_insert_propio" on storage.objects;
drop policy if exists "vouchers_padre_select_propio" on storage.objects;

create policy "vouchers_estudiante_insert_propio" on storage.objects for insert to authenticated
  with check (bucket_id = 'vouchers' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "vouchers_estudiante_select_propio" on storage.objects for select to authenticated
  using (bucket_id = 'vouchers' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "vouchers_admin_todo" on storage.objects for all to authenticated
  using (bucket_id = 'vouchers' and coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin')
  with check (bucket_id = 'vouchers' and coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');

-- ============================================
-- DATOS SEMILLA (solo lo esencial)
-- ============================================

-- Año escolar activo 2026
insert into anios_escolares (anio, activo, fecha_inicio, fecha_fin)
values (2026, true, '2026-03-01', '2026-12-20');

-- Aulas del 2026
insert into aulas (nombre, nivel, anio_escolar_id)
select nombre, nivel, (select id from anios_escolares where anio = 2026)
from (values
  ('Inicial 3 años', 'inicial'),
  ('Inicial 4 años', 'inicial'),
  ('Inicial 5 años', 'inicial'),
  ('1° Primaria', 'primaria'),
  ('2° Primaria', 'primaria'),
  ('3° Primaria', 'primaria'),
  ('4° Primaria', 'primaria'),
  ('5° Primaria', 'primaria'),
  ('6° Primaria', 'primaria')
) as t(nombre, nivel);

-- Conceptos de cobro
insert into conceptos_cobro (nombre, tipo, monto_base) values
  ('Matrícula Inicial', 'matricula', 250),
  ('Matrícula Primaria', 'matricula', 300),
  ('Pensión Inicial', 'pension', 250),
  ('Pensión Primaria', 'pension', 300),
  ('Certificado de estudios', 'documento', 25),
  ('Constancia de matrícula', 'documento', 15),
  ('Traslado', 'documento', 30);

-- Descuentos 2026
insert into descuentos (anio_escolar_id, tipo, monto)
select id, 'puntualidad', 20 from anios_escolares where anio = 2026;

insert into descuentos (anio_escolar_id, tipo, monto)
select id, 'hermano', 20 from anios_escolares where anio = 2026;

-- ============================================================
-- MÓDULO DOCENTE  (agregado — no borra nada de lo anterior)
-- Rol de acceso: app_metadata.role = 'docente'
-- El admin crea los docentes y les asigna aulas/cursos.
-- El docente registra notas y observaciones; el padre las ve.
-- ============================================================

-- Asignaciones: qué docente dicta qué curso en qué aula/año
create table if not exists docente_asignaciones (
  id uuid primary key default gen_random_uuid(),
  docente_id uuid references docentes(id) on delete cascade,
  aula_id uuid references aulas(id) on delete cascade,
  curso text not null,
  anio_escolar_id uuid references anios_escolares(id) on delete cascade,
  created_at timestamptz default now(),
  unique (docente_id, aula_id, curso, anio_escolar_id)
);
create index if not exists idx_docasig_docente on docente_asignaciones(docente_id);
create index if not exists idx_docasig_aula on docente_asignaciones(aula_id);

-- Observaciones por alumno y bimestre (aparte de la nota del curso)
create table if not exists observaciones_estudiante (
  id uuid primary key default gen_random_uuid(),
  matricula_id uuid references matriculas(id) on delete cascade,
  docente_id uuid references docentes(id) on delete set null,
  bimestre integer check (bimestre between 1 and 4),
  texto text not null,
  fecha_registro timestamptz default now(),
  registrado_por uuid,
  unique (matricula_id, docente_id, bimestre)
);
create index if not exists idx_obs_matricula on observaciones_estudiante(matricula_id);

-- Funciones auxiliares (security definer) para las políticas RLS.
create or replace function public.docente_aulas_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select distinct da.aula_id from docente_asignaciones da
  join docentes d on d.id = da.docente_id where d.user_id = auth.uid()
$$;

create or replace function public.docente_puede_curso(p_matricula_id uuid, p_curso text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from matriculas m
    join docente_asignaciones da on da.aula_id = m.aula_id and da.anio_escolar_id = m.anio_escolar_id
    join docentes d on d.id = da.docente_id
    where m.id = p_matricula_id and da.curso = p_curso and d.user_id = auth.uid()
  )
$$;

create or replace function public.docente_puede_matricula(p_matricula_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from matriculas m
    join docente_asignaciones da on da.aula_id = m.aula_id and da.anio_escolar_id = m.anio_escolar_id
    join docentes d on d.id = da.docente_id
    where m.id = p_matricula_id and d.user_id = auth.uid()
  )
$$;

create or replace function public.docente_ve_estudiante(p_estudiante_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from matriculas m
    join docente_asignaciones da on da.aula_id = m.aula_id and da.anio_escolar_id = m.anio_escolar_id
    join docentes d on d.id = da.docente_id
    where m.estudiante_id = p_estudiante_id and d.user_id = auth.uid()
  )
$$;

-- Solo usuarios autenticados pueden ejecutar estas funciones (no anon).
revoke execute on function public.docente_aulas_ids() from public;
revoke execute on function public.docente_puede_curso(uuid, text) from public;
revoke execute on function public.docente_puede_matricula(uuid) from public;
revoke execute on function public.docente_ve_estudiante(uuid) from public;
grant execute on function public.docente_aulas_ids() to authenticated;
grant execute on function public.docente_puede_curso(uuid, text) to authenticated;
grant execute on function public.docente_puede_matricula(uuid) to authenticated;
grant execute on function public.docente_ve_estudiante(uuid) to authenticated;

-- RLS del módulo docente
alter table docente_asignaciones enable row level security;
alter table observaciones_estudiante enable row level security;

drop policy if exists "admin_todo_docasig" on docente_asignaciones;
create policy "admin_todo_docasig" on docente_asignaciones for all
  using (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');
drop policy if exists "docente_ve_sus_asignaciones" on docente_asignaciones;
create policy "docente_ve_sus_asignaciones" on docente_asignaciones for select
  using (docente_id in (select id from docentes where user_id = auth.uid()));

drop policy if exists "admin_todo_observaciones" on observaciones_estudiante;
create policy "admin_todo_observaciones" on observaciones_estudiante for all
  using (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');
drop policy if exists "docente_gestiona_observaciones" on observaciones_estudiante;
create policy "docente_gestiona_observaciones" on observaciones_estudiante for all
  using (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'docente' and public.docente_puede_matricula(matricula_id))
  with check (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'docente' and public.docente_puede_matricula(matricula_id));
drop policy if exists "estudiante_ve_sus_observaciones" on observaciones_estudiante;
create policy "estudiante_ve_sus_observaciones" on observaciones_estudiante for select
  using (matricula_id in (
    select m.id from matriculas m join estudiantes e on e.id = m.estudiante_id where e.user_id = auth.uid()
  ));

drop policy if exists "docente_gestiona_notas" on notas_curso;
create policy "docente_gestiona_notas" on notas_curso for all
  using (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'docente' and public.docente_puede_curso(matricula_id, curso))
  with check (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'docente' and public.docente_puede_curso(matricula_id, curso));

drop policy if exists "docente_ve_matriculas" on matriculas;
create policy "docente_ve_matriculas" on matriculas for select
  using (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'docente' and aula_id in (select public.docente_aulas_ids()));

drop policy if exists "docente_ve_estudiantes" on estudiantes;
create policy "docente_ve_estudiantes" on estudiantes for select
  using (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'docente' and public.docente_ve_estudiante(id));

drop policy if exists "docente_ve_su_perfil" on docentes;
create policy "docente_ve_su_perfil" on docentes for select
  using (user_id = auth.uid());

drop policy if exists "docente_ve_sus_aulas" on aulas;
create policy "docente_ve_sus_aulas" on aulas for select
  using (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'docente' and id in (select public.docente_aulas_ids()));

-- ============================================================
-- PAGO CONSOLIDADO + FOTO DE PERFIL  (agregado)
-- ============================================================

-- Un pago puede cubrir varias cuotas a la vez
alter table pagos add column if not exists cuotas_ids uuid[];

-- Foto de perfil del estudiante (URL en storage, opcional)
alter table estudiantes add column if not exists foto_url text;

-- Bucket de fotos de perfil
insert into storage.buckets (id, name, public)
values ('perfiles', 'perfiles', true)
on conflict (id) do update set public = true;

drop policy if exists "perfiles_estudiante_insert" on storage.objects;
drop policy if exists "perfiles_estudiante_update" on storage.objects;
drop policy if exists "perfiles_select_todos" on storage.objects;
drop policy if exists "perfiles_admin_todo" on storage.objects;

create policy "perfiles_estudiante_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'perfiles' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "perfiles_estudiante_update" on storage.objects for update to authenticated
  using (bucket_id = 'perfiles' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "perfiles_select_todos" on storage.objects for select to authenticated
  using (bucket_id = 'perfiles');
create policy "perfiles_admin_todo" on storage.objects for all to authenticated
  using (bucket_id = 'perfiles' and coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin')
  with check (bucket_id = 'perfiles' and coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');
