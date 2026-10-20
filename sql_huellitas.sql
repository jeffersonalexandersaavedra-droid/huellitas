-- ============================================================
-- HUELLITAS - REGISTRO DE LA BASE DE DATOS
--
-- ⚠ NO EJECUTES ESTE ARCHIVO COMPLETO. La primera parte (LIMPIEZA)
-- BORRA TODAS LAS TABLAS Y SUS DATOS: estudiantes, pagos, notas...
--
-- Este archivo es el historial de cómo se armó la base, en orden.
-- Cada cambio nuevo se agrega al final en su propia sección
-- ("(agregado)") y se ejecuta SOLO esa sección en el SQL Editor de
-- Supabase. Sirve también para crear la base desde cero en un
-- proyecto NUEVO y vacío.
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

-- ============================================================
-- CATÁLOGO DE CURSOS + QUIÉN PAGA  (agregado)
-- ============================================================
create table if not exists cursos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  nivel text not null check (nivel in ('inicial', 'primaria')),
  activo boolean default true,
  created_at timestamptz default now(),
  unique (nombre, nivel)
);
alter table cursos enable row level security;
drop policy if exists "cursos_select_autenticados" on cursos;
create policy "cursos_select_autenticados" on cursos for select to authenticated using (true);
drop policy if exists "cursos_admin_todo" on cursos;
create policy "cursos_admin_todo" on cursos for all
  using (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');

-- Quién realizó el pago
alter table pagos add column if not exists pagado_por text;
alter table pagos add column if not exists pagado_por_parentesco text;

-- El estudiante (padre) puede leer sus apoderados/vínculos para elegir quién paga
drop policy if exists "estudiante_ve_sus_vinculos" on estudiante_apoderado;
create policy "estudiante_ve_sus_vinculos" on estudiante_apoderado for select
  using (estudiante_id in (select id from estudiantes where user_id = auth.uid()));
drop policy if exists "estudiante_ve_sus_apoderados" on apoderados;
create policy "estudiante_ve_sus_apoderados" on apoderados for select
  using (id in (
    select ea.apoderado_id from estudiante_apoderado ea
    join estudiantes e on e.id = ea.estudiante_id where e.user_id = auth.uid()
  ));

-- ============================================================
-- DOCUMENTOS DE LA PÁGINA (transparencia, contrato)  (agregado)
-- ============================================================
create table if not exists documentos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  tipo text not null default 'transparencia' check (tipo in ('transparencia','contrato','otro')),
  archivo_url text not null,
  publicado boolean default true,
  created_at timestamptz default now()
);
alter table documentos enable row level security;
drop policy if exists "documentos_publico_select" on documentos;
create policy "documentos_publico_select" on documentos for select using (publicado = true);
drop policy if exists "documentos_admin_todo" on documentos;
create policy "documentos_admin_todo" on documentos for all
  using (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');

insert into storage.buckets (id, name, public)
values ('documentos', 'documentos', true)
on conflict (id) do update set public = true;
drop policy if exists "documentos_admin_write" on storage.objects;
create policy "documentos_admin_write" on storage.objects for all to authenticated
  using (bucket_id = 'documentos' and coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin')
  with check (bucket_id = 'documentos' and coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');

-- ============================================================
-- CONTENIDO EDITABLE DE LA PÁGINA PRINCIPAL  (agregado)
-- ============================================================
create table if not exists sitio_config (
  id text primary key,
  contenido jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);
alter table sitio_config enable row level security;
drop policy if exists "sitio_public_select" on sitio_config;
create policy "sitio_public_select" on sitio_config for select using (true);
drop policy if exists "sitio_admin_todo" on sitio_config;
create policy "sitio_admin_todo" on sitio_config for all
  using (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin')
  with check (coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), '') = 'admin');
insert into sitio_config (id, contenido) values ('landing', '{}'::jsonb)
on conflict (id) do nothing;

-- ============================================================
-- 3.ª REUNIÓN: SECRETARIA, AULAS, PERFIL DOCENTE, ASISTENCIA,
-- INCIDENCIAS, CONTRATO  (agregado — no borra nada anterior)
-- ============================================================

-- Rol del usuario autenticado ('admin' | 'secretaria' | 'docente' | 'estudiante')
create or replace function public.rol_actual()
returns text language sql stable set search_path = '' as $$
  select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '')
$$;

-- Secretaria: matricula, recibe pagos y descarga reportes.
do $$
declare t text;
begin
  foreach t in array array['estudiantes', 'apoderados', 'estudiante_apoderado', 'matriculas', 'cuotas', 'pagos'] loop
    execute format('drop policy if exists "secretaria_todo_%1$s" on public.%1$I', t);
    execute format(
      'create policy "secretaria_todo_%1$s" on public.%1$I for all
         using (public.rol_actual() = ''secretaria'')
         with check (public.rol_actual() = ''secretaria'')', t);
  end loop;
end $$;
drop policy if exists "secretaria_ve_docentes" on docentes;
create policy "secretaria_ve_docentes" on docentes for select
  using (public.rol_actual() = 'secretaria');
drop policy if exists "secretaria_ve_notas" on notas_curso;
create policy "secretaria_ve_notas" on notas_curso for select
  using (public.rol_actual() = 'secretaria');

-- Quién validó un pago (admin o secretaria). Si se elimina esa cuenta,
-- el pago se conserva.
alter table pagos drop constraint if exists pagos_validado_por_fkey;
alter table pagos add constraint pagos_validado_por_fkey
  foreign key (validado_por) references auth.users(id) on delete set null;

-- Domicilio del apoderado (lo pide el contrato de servicio educativo)
alter table apoderados add column if not exists direccion text;

-- Aulas: lista de útiles descargable por el padre
alter table aulas add column if not exists lista_utiles_url text;

-- Perfil profesional del docente (visible para los padres)
alter table docentes add column if not exists foto_url text;
alter table docentes add column if not exists especialidad text;
alter table docentes add column if not exists bio text;

create or replace function public.actualizar_perfil_docente(p_especialidad text, p_bio text, p_foto_url text)
returns void language sql security definer set search_path = public as $$
  update docentes
     set especialidad = nullif(trim(p_especialidad), ''),
         bio = nullif(trim(p_bio), ''),
         foto_url = coalesce(p_foto_url, foto_url)
   where user_id = auth.uid()
$$;

-- Docentes del aula del estudiante (solo datos públicos del perfil) y
-- cuál es su tutor(a) de matrícula.
create or replace function public.mis_docentes()
returns table (docente_id uuid, nombres text, apellidos text, especialidad text, bio text, foto_url text, cursos text[], es_tutor boolean)
language sql stable security definer set search_path = public as $$
  select d.id, d.nombres, d.apellidos, d.especialidad, d.bio, d.foto_url,
         array_agg(distinct da.curso order by da.curso),
         bool_or(d.id = m.docente_id)
    from estudiantes e
    join matriculas m on m.estudiante_id = e.id and m.estado = 'activa'
    join docente_asignaciones da on da.aula_id = m.aula_id and da.anio_escolar_id = m.anio_escolar_id
    join docentes d on d.id = da.docente_id and d.activo
   where e.user_id = auth.uid()
   group by d.id
$$;

revoke execute on function public.actualizar_perfil_docente(text, text, text) from public, anon;
revoke execute on function public.mis_docentes() from public, anon;
grant execute on function public.actualizar_perfil_docente(text, text, text) to authenticated;
grant execute on function public.mis_docentes() to authenticated;

-- Enlace de Drive "Unidades de docentes": lo define el admin y lo ven
-- solo los docentes (la fila 'landing' sigue siendo pública).
drop policy if exists "sitio_public_select" on sitio_config;
create policy "sitio_public_select" on sitio_config for select using (id = 'landing');
drop policy if exists "sitio_docentes_select" on sitio_config;
create policy "sitio_docentes_select" on sitio_config for select to authenticated
  using (id = 'docentes' and public.rol_actual() = 'docente');
insert into sitio_config (id, contenido) values ('docentes', '{}'::jsonb)
on conflict (id) do nothing;

-- Incidencias (tutoría): el docente redacta, dirección las lee.
create table if not exists incidencias (
  id uuid primary key default gen_random_uuid(),
  docente_id uuid not null references docentes(id) on delete cascade,
  aula_id uuid references aulas(id) on delete set null,
  titulo text not null,
  descripcion text not null,
  fecha date not null default current_date,
  leida boolean not null default false,
  created_at timestamptz default now()
);
create index if not exists idx_incidencias_docente on incidencias(docente_id);
alter table incidencias enable row level security;
drop policy if exists "admin_todo_incidencias" on incidencias;
create policy "admin_todo_incidencias" on incidencias for all
  using (public.rol_actual() = 'admin') with check (public.rol_actual() = 'admin');
drop policy if exists "docente_ve_sus_incidencias" on incidencias;
create policy "docente_ve_sus_incidencias" on incidencias for select
  using (public.rol_actual() = 'docente' and docente_id in (select id from docentes where user_id = auth.uid()));
drop policy if exists "docente_crea_incidencias" on incidencias;
create policy "docente_crea_incidencias" on incidencias for insert
  with check (public.rol_actual() = 'docente' and docente_id in (select id from docentes where user_id = auth.uid()));

-- Asistencia diaria por estudiante
create table if not exists asistencias (
  id uuid primary key default gen_random_uuid(),
  matricula_id uuid not null references matriculas(id) on delete cascade,
  fecha date not null,
  estado text not null check (estado in ('asistio', 'tardanza', 'falta_justificada', 'falta_injustificada')),
  registrado_por uuid default auth.uid() references auth.users(id) on delete set null,
  updated_at timestamptz default now(),
  unique (matricula_id, fecha)
);
create index if not exists idx_asistencias_fecha on asistencias(fecha);
alter table asistencias enable row level security;
drop policy if exists "admin_todo_asistencias" on asistencias;
create policy "admin_todo_asistencias" on asistencias for all
  using (public.rol_actual() = 'admin') with check (public.rol_actual() = 'admin');
drop policy if exists "docente_gestiona_asistencias" on asistencias;
create policy "docente_gestiona_asistencias" on asistencias for all
  using (public.rol_actual() = 'docente' and public.docente_puede_matricula(matricula_id))
  with check (public.rol_actual() = 'docente' and public.docente_puede_matricula(matricula_id));

-- Las funciones auxiliares del módulo docente no deben poder ejecutarse sin
-- iniciar sesión (Supabase concede EXECUTE a "anon" por defecto).
revoke execute on function public.docente_aulas_ids() from anon;
revoke execute on function public.docente_puede_curso(uuid, text) from anon;
revoke execute on function public.docente_puede_matricula(uuid) from anon;
revoke execute on function public.docente_ve_estudiante(uuid) from anon;

-- ============================================================
-- GRADOS Y SECCIONES  (agregado)
-- Cada aula es un grado + sección opcional (3° Primaria A, B...).
-- El nombre visible se arma solo a partir de ambos.
-- ============================================================
alter table aulas add column if not exists grado text;
alter table aulas add column if not exists seccion text;
update aulas set grado = nombre where grado is null;
alter table aulas alter column grado set not null;
alter table aulas drop constraint if exists aulas_seccion_letra;
alter table aulas add constraint aulas_seccion_letra check (seccion is null or seccion ~ '^[A-Z]$');
alter table aulas drop constraint if exists aulas_grado_seccion_unica;
alter table aulas add constraint aulas_grado_seccion_unica unique nulls not distinct (anio_escolar_id, grado, seccion);

create or replace function public.aulas_nombre()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.nombre := new.grado || coalesce(' ' || new.seccion, '');
  return new;
end $$;

drop trigger if exists aulas_nombre on aulas;
create trigger aulas_nombre before insert or update of grado, seccion on aulas
  for each row execute function public.aulas_nombre();

-- ============================================================
-- FACTURACIÓN: boletas, facturas y notas de crédito electrónicas
-- (SUNAT vía proveedor OSE/PSE) y tickets de venta internos.
-- Solo el servidor (service_role) escribe comprobantes; el personal
-- los consulta y los padres ven los suyos.
-- ============================================================

-- Series y su último número usado (numeración correlativa).
create table if not exists comprobante_series (
  serie text primary key check (serie ~ '^[A-Z0-9]{4}$'),
  tipo text not null check (tipo in ('boleta', 'factura', 'nota_credito', 'ticket')),
  ultimo_numero integer not null default 0 check (ultimo_numero >= 0),
  activa boolean not null default true,
  created_at timestamptz default now(),
  -- Reglas de SUNAT: boletas con B, facturas con F, notas de crédito con la
  -- letra del comprobante que modifican; los tickets internos no usan B ni F.
  check (
    (tipo = 'boleta' and serie like 'B%')
    or (tipo = 'factura' and serie like 'F%')
    or (tipo = 'nota_credito' and (serie like 'B%' or serie like 'F%'))
    or (tipo = 'ticket' and serie !~ '^[BF]')
  )
);
insert into comprobante_series (serie, tipo) values
  ('B001', 'boleta'), ('F001', 'factura'), ('BC01', 'nota_credito'), ('FC01', 'nota_credito'), ('T001', 'ticket')
on conflict (serie) do nothing;

create table if not exists comprobantes (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('boleta', 'factura', 'nota_credito', 'ticket')),
  -- electronico: enviado a SUNAT por el proveedor; manual: emitido fuera
  -- (SUNAT SOL / otro facturador) y registrado aquí; interno: ticket.
  modo text not null check (modo in ('electronico', 'manual', 'interno')),
  serie text not null check (serie ~ '^[A-Z0-9]{4}$'),
  numero integer not null check (numero > 0),
  fecha_emision date not null default (now() at time zone 'America/Lima')::date,
  pago_id uuid references pagos(id) on delete set null,
  matricula_id uuid references matriculas(id) on delete set null,
  -- Catálogo 06 de SUNAT: 1 DNI, 4 carné de extranjería, 6 RUC, 7 pasaporte, - sin documento
  cliente_tipo_doc text not null check (cliente_tipo_doc in ('1', '4', '6', '7', '-')),
  cliente_num_doc text,
  cliente_nombre text not null,
  cliente_direccion text,
  cliente_email text,
  items jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) > 0),
  total numeric(10,2) not null check (total > 0),
  metodo text,
  observaciones text,
  referencia_id uuid references comprobantes(id),
  motivo text,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'emitido', 'aceptado', 'rechazado', 'anulado')),
  sunat_descripcion text,
  enlace_pdf text,
  enlace_xml text,
  enlace_cdr text,
  cadena_qr text,
  hash text,
  archivo_path text,
  emitido_por uuid references auth.users(id) on delete set null,
  anulado_en timestamptz,
  created_at timestamptz default now(),
  unique (serie, numero),
  check (tipo <> 'factura' or cliente_tipo_doc = '6'),
  check (tipo <> 'nota_credito' or referencia_id is not null)
);
create index if not exists idx_comprobantes_fecha on comprobantes(fecha_emision);
create index if not exists idx_comprobantes_matricula on comprobantes(matricula_id);
create index if not exists idx_comprobantes_referencia on comprobantes(referencia_id);
-- Un pago tiene a lo más un comprobante vigente (evita facturar dos veces).
create unique index if not exists comprobantes_pago_vigente on comprobantes(pago_id)
  where pago_id is not null and tipo <> 'nota_credito' and estado not in ('rechazado', 'anulado');

alter table comprobante_series enable row level security;
drop policy if exists "personal_ve_series" on comprobante_series;
create policy "personal_ve_series" on comprobante_series for select
  using (public.rol_actual() in ('admin', 'secretaria'));
drop policy if exists "admin_gestiona_series" on comprobante_series;
create policy "admin_gestiona_series" on comprobante_series for all
  using (public.rol_actual() = 'admin') with check (public.rol_actual() = 'admin');

alter table comprobantes enable row level security;
drop policy if exists "personal_ve_comprobantes" on comprobantes;
create policy "personal_ve_comprobantes" on comprobantes for select
  using (public.rol_actual() in ('admin', 'secretaria'));
drop policy if exists "estudiante_ve_sus_comprobantes" on comprobantes;
create policy "estudiante_ve_sus_comprobantes" on comprobantes for select
  using (
    estado <> 'rechazado'
    and matricula_id in (
      select m.id from matriculas m
      join estudiantes e on e.id = m.estudiante_id
      where e.user_id = auth.uid()
    )
  );

-- Reserva el siguiente número de la serie activa del tipo (atómico: el
-- UPDATE bloquea la fila). p_prefijo elige BC01/FC01 en notas de crédito.
create or replace function public.reservar_numero(p_tipo text, p_prefijo text default null)
returns table (serie text, numero integer)
language sql security definer set search_path = public as $$
  update comprobante_series s
     set ultimo_numero = s.ultimo_numero + 1
   where s.serie = (
     select x.serie from comprobante_series x
      where x.tipo = p_tipo and x.activa
        and (p_prefijo is null or x.serie like p_prefijo || '%')
      order by x.serie
      limit 1)
  returning s.serie, s.ultimo_numero
$$;

-- Devuelve el número si el proveedor rechazó crear el documento y nadie
-- más usó la serie después (así no quedan saltos en la numeración).
create or replace function public.liberar_numero(p_serie text, p_numero integer)
returns void
language sql security definer set search_path = public as $$
  update comprobante_series
     set ultimo_numero = ultimo_numero - 1
   where serie = p_serie and ultimo_numero = p_numero
$$;

revoke execute on function public.reservar_numero(text, text) from public, anon, authenticated;
revoke execute on function public.liberar_numero(text, integer) from public, anon, authenticated;
grant execute on function public.reservar_numero(text, text) to service_role;
grant execute on function public.liberar_numero(text, integer) to service_role;

-- PDF de comprobantes registrados a mano (privado: se entrega con enlaces
-- firmados desde el servidor).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('comprobantes', 'comprobantes', false, 5242880, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

-- Los comprobantes viven en "comprobantes": columnas de pagos que nunca se
-- usaron. (Opcional; ejecutar desde el SQL Editor cuando se quiera.)
-- alter table pagos
--   drop column if exists titular_comprobante_nombre,
--   drop column if exists titular_comprobante_dni,
--   drop column if exists numero_comprobante,
--   drop column if exists serie_comprobante,
--   drop column if exists tipo_comprobante;

-- ============================================================
-- PRIVACIDAD Y CUMPLIMIENTO
-- ============================================================

-- Vouchers privados: se ven con enlaces temporales firmados.
update storage.buckets set public = false where id = 'vouchers';
drop policy if exists "vouchers_secretaria_select" on storage.objects;
create policy "vouchers_secretaria_select" on storage.objects for select to authenticated
  using (bucket_id = 'vouchers' and public.rol_actual() = 'secretaria');

-- Libro de Reclamaciones virtual (Código de Protección y Defensa del
-- Consumidor, art. 150; D.S. 011-2011-PCM modificado por D.S. 101-2022-PCM).
-- Las hojas se registran desde el servidor (service_role); el colegio
-- responde en un plazo máximo de 15 días hábiles.
create table if not exists reclamaciones (
  id uuid primary key default gen_random_uuid(),
  numero integer generated always as identity unique,
  tipo text not null check (tipo in ('reclamo', 'queja')),
  consumidor_nombre text not null,
  consumidor_tipo_doc text not null check (consumidor_tipo_doc in ('DNI', 'CE', 'Pasaporte')),
  consumidor_documento text not null,
  consumidor_domicilio text not null,
  consumidor_telefono text,
  consumidor_email text not null,
  menor_de_edad boolean not null default false,
  apoderado_nombre text,
  bien_tipo text not null check (bien_tipo in ('servicio', 'producto')),
  bien_descripcion text not null,
  monto numeric(10,2) check (monto is null or monto >= 0),
  detalle text not null,
  pedido text not null,
  respuesta text,
  fecha_respuesta timestamptz,
  respondido_por uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (not menor_de_edad or apoderado_nombre is not null)
);
create index if not exists idx_reclamaciones_fecha on reclamaciones(created_at desc);
alter table reclamaciones enable row level security;
drop policy if exists "admin_gestiona_reclamaciones" on reclamaciones;
create policy "admin_gestiona_reclamaciones" on reclamaciones for all
  using (public.rol_actual() = 'admin') with check (public.rol_actual() = 'admin');
drop policy if exists "secretaria_ve_reclamaciones" on reclamaciones;
create policy "secretaria_ve_reclamaciones" on reclamaciones for select
  using (public.rol_actual() = 'secretaria');

-- Registro de auditoría (Ley 29733 y D.S. 016-2024-JUS): quién creó, cambió
-- o borró pagos, notas, matrículas, comprobantes, etc. Solo lo lee el admin.
create table if not exists auditoria (
  id bigint generated always as identity primary key,
  tabla text not null,
  operacion text not null,
  registro_id text,
  usuario_id uuid,
  rol text,
  antes jsonb,
  despues jsonb,
  creado_en timestamptz not null default now()
);
create index if not exists idx_auditoria_tabla_fecha on auditoria(tabla, creado_en desc);
create index if not exists idx_auditoria_fecha on auditoria(creado_en desc);
alter table auditoria enable row level security;
drop policy if exists "admin_ve_auditoria" on auditoria;
create policy "admin_ve_auditoria" on auditoria for select
  using (public.rol_actual() = 'admin');

create or replace function public.registrar_auditoria()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' and to_jsonb(new) = to_jsonb(old) then
    return new;
  end if;
  insert into auditoria (tabla, operacion, registro_id, usuario_id, rol, antes, despues)
  values (
    tg_table_name,
    tg_op,
    coalesce(to_jsonb(new) ->> 'id', to_jsonb(old) ->> 'id', to_jsonb(new) ->> 'serie', to_jsonb(old) ->> 'serie'),
    auth.uid(),
    nullif(public.rol_actual(), ''),
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end $$;
revoke execute on function public.registrar_auditoria() from public, anon, authenticated;

do $$
declare t text;
begin
  foreach t in array array[
    'pagos', 'cuotas', 'notas_curso', 'observaciones_estudiante', 'matriculas', 'estudiantes',
    'apoderados', 'estudiante_apoderado', 'docentes', 'asistencias', 'comprobantes',
    'comprobante_series', 'reclamaciones'
  ] loop
    execute format(
      'create or replace trigger auditoria_%1$s after insert or update or delete on public.%1$I
         for each row execute function public.registrar_auditoria()', t);
  end loop;
end $$;

-- ============================================================
-- COMPETENCIAS (primer diseño), SIAGIE, ASISTENCIA Y PAGOS ATÓMICOS
-- (agregado el 5 de octubre; ya aplicado en la base)
-- ============================================================

-- Primer diseño de notas por competencia. Lo reemplazó cursos.competencias
-- (sección siguiente): estas dos tablas ya no las usa el sistema. La tabla
-- competencias guarda las 40 competencias del CNEB y notas_competencia
-- quedó vacía.
create table if not exists competencias (
  id uuid primary key default gen_random_uuid(),
  nivel text not null check (nivel in ('inicial', 'primaria')),
  area text not null,
  codigo text not null check (codigo ~ '^[0-9]{2}$'),
  nombre text not null,
  activo boolean not null default true,
  created_at timestamptz default now(),
  unique (nivel, area, codigo)
);
alter table competencias enable row level security;
create policy "todos_ven_competencias" on competencias for select to authenticated using (true);
create policy "admin_gestiona_competencias" on competencias for all
  using (public.rol_actual() = 'admin') with check (public.rol_actual() = 'admin');

create table if not exists notas_competencia (
  id uuid primary key default gen_random_uuid(),
  matricula_id uuid not null references matriculas(id) on delete cascade,
  competencia_id uuid not null references competencias(id) on delete restrict,
  curso text not null,
  bimestre integer not null check (bimestre between 1 and 4),
  nota text not null check (nota in ('AD', 'A', 'B', 'C')),
  conclusion text,
  registrado_por uuid default auth.uid() references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (matricula_id, competencia_id, bimestre)
);
create index if not exists idx_notas_competencia_matricula on notas_competencia(matricula_id, bimestre);
alter table notas_competencia enable row level security;
create policy "admin_todo_notas_competencia" on notas_competencia for all
  using (public.rol_actual() = 'admin') with check (public.rol_actual() = 'admin');
create policy "secretaria_ve_notas_competencia" on notas_competencia for select
  using (public.rol_actual() = 'secretaria');
create policy "docente_gestiona_notas_competencia" on notas_competencia for all
  using (public.rol_actual() = 'docente' and public.docente_puede_curso(matricula_id, curso))
  with check (public.rol_actual() = 'docente' and public.docente_puede_curso(matricula_id, curso));
create policy "estudiante_ve_sus_notas_competencia" on notas_competencia for select
  using (matricula_id in (
    select m.id from matriculas m join estudiantes e on e.id = m.estudiante_id where e.user_id = auth.uid()
  ));

create or replace function public.notas_competencia_area()
returns trigger language plpgsql set search_path = public as $$
begin
  select c.area into new.curso from competencias c where c.id = new.competencia_id;
  new.updated_at := now();
  return new;
end $$;
create or replace trigger notas_competencia_area before insert or update on notas_competencia
  for each row execute function public.notas_competencia_area();
create or replace trigger auditoria_notas_competencia after insert or update or delete on notas_competencia
  for each row execute function public.registrar_auditoria();
create or replace trigger auditoria_competencias after insert or update or delete on competencias
  for each row execute function public.registrar_auditoria();
-- (las 40 competencias del CNEB se cargaron con un INSERT; son las mismas
-- que hoy están en cursos.competencias)

-- Las competencias transversales se califican como un área más (las asigna
-- el admin al tutor del aula).
insert into cursos (nombre, nivel)
select 'Competencias transversales', n from unnest(array['inicial', 'primaria']) n
where not exists (select 1 from cursos c where c.nombre = 'Competencias transversales' and c.nivel = n);

-- En Inicial el CNEB no tiene Arte y Cultura, Religión ni Descubrimiento del
-- Mundo: sus competencias van en Comunicación y Personal Social.
update cursos set activo = false
 where nivel = 'inicial' and nombre in ('Arte y Cultura', 'Religión', 'Descubrimiento del Mundo');

-- Código del estudiante en el SIAGIE (14 dígitos). Si está vacío se usa el
-- DNI completado con ceros, que es como el SIAGIE lo genera. Solo lo
-- cambia administración.
alter table estudiantes add column if not exists codigo_siagie text
  check (codigo_siagie is null or codigo_siagie ~ '^[0-9]{14}$');

create or replace function public.proteger_codigo_siagie()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.codigo_siagie is distinct from old.codigo_siagie
     and public.rol_actual() not in ('admin', 'secretaria')
     and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Solo administración puede cambiar el código del estudiante.';
  end if;
  return new;
end;
$$;
create trigger estudiantes_codigo_siagie
  before update of codigo_siagie on estudiantes
  for each row execute function public.proteger_codigo_siagie();

-- El informe de progreso separa las tardanzas justificadas de las injustificadas.
alter table asistencias drop constraint if exists asistencias_estado_check;
alter table asistencias add constraint asistencias_estado_check
  check (estado in ('asistio', 'tardanza', 'tardanza_justificada', 'falta_justificada', 'falta_injustificada'));

-- El padre ve la asistencia de su hijo (informe de progreso y portal).
create policy "estudiante_ve_su_asistencia" on asistencias for select
  using (matricula_id in (
    select m.id from matriculas m join estudiantes e on e.id = m.estudiante_id where e.user_id = auth.uid()
  ));

-- El estudiante solo registra pagos por validar, de su propia matrícula y cuotas.
alter policy "estudiante_crea_pagos" on pagos
  with check (
    estado = 'validando'
    and validado_por is null
    and fecha_validacion is null
    and matricula_id in (
      select m.id from matriculas m join estudiantes e on e.id = m.estudiante_id
      where e.user_id = auth.uid()
    )
    and (cuota_id is null or cuota_id in (select c.id from cuotas c where c.matricula_id = pagos.matricula_id))
  );

-- Desde el navegador solo se actualizan estas columnas; lo demás pasa por
-- las rutas del servidor (service role).
revoke update on cuotas from anon, authenticated;
grant update (estado) on cuotas to authenticated;
revoke update on estudiantes from anon, authenticated;
grant update (foto_url, password_cambiado, codigo_siagie) on estudiantes to authenticated;

-- Pago recibido en caja: se registra pagado y marca sus cuotas en una sola
-- transacción. Devuelve el pago creado. (validar_pago, para los vouchers,
-- está en la sección de comunicados.)
create or replace function public.registrar_pago_caja(
  p_matricula uuid,
  p_cuotas uuid[],
  p_monto numeric,
  p_metodo text,
  p_operacion text,
  p_pagado_por text,
  p_parentesco text
)
returns setof public.pagos
language plpgsql security invoker set search_path = '' as $$
declare
  v_pago public.pagos;
begin
  if public.rol_actual() not in ('admin', 'secretaria') then
    raise exception 'No tienes permiso para registrar pagos.';
  end if;
  if coalesce(array_length(p_cuotas, 1), 0) = 0 or p_monto is null or p_monto <= 0 then
    raise exception 'Elige al menos una cuota con monto.';
  end if;
  if (select count(*) from public.cuotas
       where id = any(p_cuotas) and matricula_id = p_matricula and estado in ('pendiente', 'vencido'))
     <> array_length(p_cuotas, 1) then
    raise exception 'Alguna de las cuotas ya no está pendiente. Vuelve a cargar al estudiante.';
  end if;

  insert into public.pagos (
    matricula_id, cuota_id, cuotas_ids, monto, metodo, numero_operacion, estado,
    fecha_pago, fecha_validacion, validado_por, pagado_por, pagado_por_parentesco
  ) values (
    p_matricula, p_cuotas[1], p_cuotas, p_monto, p_metodo, nullif(trim(p_operacion), ''), 'pagado',
    now(), now(), auth.uid(), nullif(trim(p_pagado_por), ''), p_parentesco
  )
  returning * into v_pago;

  update public.cuotas set estado = 'pagado' where id = any(p_cuotas);

  return next v_pago;
end;
$$;
revoke execute on function public.registrar_pago_caja(uuid, uuid[], numeric, text, text, text, text) from public, anon;
grant execute on function public.registrar_pago_caja(uuid, uuid[], numeric, text, text, text, text) to authenticated;

-- Las fotos se muestran por su URL pública; listar el bucket solo puede
-- cada estudiante (su carpeta) y administración.
alter policy "perfiles_select_todos" on storage.objects
  using (
    bucket_id = 'perfiles'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.rol_actual() in ('admin', 'secretaria'))
  );

-- ============================================================
-- NOTAS POR COMPETENCIA (formato SIAGIE)  (agregado)
-- Cada curso (área) trae sus competencias del Currículo Nacional y el
-- docente califica cada una: nivel de logro (AD/A/B/C) + conclusión
-- descriptiva opcional (10 a 500 caracteres, regla del SIAGIE).
-- ============================================================

alter table public.cursos add column if not exists competencias text[] not null default '{}';
-- (las competencias de Inicial y Primaria se cargaron con un UPDATE por
-- área; se editan desde Configuración › Cursos)

alter table public.notas_curso add column competencia smallint;
update public.notas_curso set competencia = 1 where competencia is null;
alter table public.notas_curso rename column comentario to conclusion;
alter table public.notas_curso
  alter column competencia set not null,
  alter column matricula_id set not null,
  alter column bimestre set not null,
  add constraint notas_curso_competencia_check check (competencia >= 1),
  add constraint notas_curso_nota_check check (nota in ('AD', 'A', 'B', 'C')),
  add constraint notas_curso_conclusion_check
    check (conclusion is null or char_length(conclusion) between 10 and 500),
  drop constraint notas_curso_matricula_id_curso_bimestre_key,
  add constraint notas_curso_unica unique (matricula_id, curso, competencia, bimestre);

-- ============================================================
-- COMUNICADOS Y AGENDA, MOTIVO DE RECHAZO DEL VOUCHER  (agregado el
-- 20 de octubre)
-- ============================================================

-- Comunicados: dirección y secretaría escriben a todo el colegio, a un
-- nivel o a un aula; el docente, a sus aulas. Si traen fecha_evento
-- salen también en la agenda ("Próximas fechas") del padre.
create table if not exists comunicados (
  id uuid primary key default gen_random_uuid(),
  titulo text not null check (char_length(titulo) between 3 and 120),
  mensaje text not null check (char_length(mensaje) between 3 and 2000),
  fecha_evento date,
  nivel text check (nivel in ('inicial', 'primaria')),
  aula_id uuid references aulas(id) on delete cascade,
  autor_id uuid references auth.users(id) on delete set null,
  autor text not null default 'Dirección',
  created_at timestamptz not null default now(),
  constraint comunicados_un_destino check (nivel is null or aula_id is null)
);
create index if not exists idx_comunicados_fecha on comunicados(created_at desc);
create index if not exists idx_comunicados_evento on comunicados(fecha_evento) where fecha_evento is not null;
create index if not exists idx_comunicados_aula on comunicados(aula_id) where aula_id is not null;
create index if not exists idx_comunicados_autor on comunicados(autor_id);

-- Quién lo publicó lo pone la base de datos (no se puede falsear).
create or replace function public.comunicados_autor()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.autor_id := auth.uid();
  new.autor := case public.rol_actual()
    when 'docente' then coalesce(
      (select 'Prof. ' || split_part(d.nombres, ' ', 1) || ' ' || split_part(d.apellidos, ' ', 1)
         from docentes d where d.user_id = auth.uid()),
      'Docente')
    when 'secretaria' then 'Secretaría'
    else 'Dirección'
  end;
  return new;
end $$;
revoke execute on function public.comunicados_autor() from public, anon, authenticated;
drop trigger if exists comunicados_autor on comunicados;
create trigger comunicados_autor before insert on comunicados
  for each row execute function public.comunicados_autor();

-- Aula y nivel de la matrícula activa del estudiante que inició sesión.
create or replace function public.mis_aulas_estudiante()
returns table (aula_id uuid, nivel text)
language sql stable security definer set search_path = public as $$
  select a.id, a.nivel
    from estudiantes e
    join matriculas m on m.estudiante_id = e.id and m.estado = 'activa'
    join aulas a on a.id = m.aula_id
   where e.user_id = auth.uid()
$$;
revoke execute on function public.mis_aulas_estudiante() from public, anon;
grant execute on function public.mis_aulas_estudiante() to authenticated;

alter table comunicados enable row level security;
drop policy if exists "personal_gestiona_comunicados" on comunicados;
create policy "personal_gestiona_comunicados" on comunicados for all
  using (public.rol_actual() in ('admin', 'secretaria'))
  with check (public.rol_actual() in ('admin', 'secretaria'));
drop policy if exists "docente_ve_comunicados" on comunicados;
create policy "docente_ve_comunicados" on comunicados for select
  using (public.rol_actual() = 'docente' and (
    (nivel is null and aula_id is null)
    or aula_id in (select public.docente_aulas_ids())
    or nivel in (select a.nivel from aulas a where a.id in (select public.docente_aulas_ids()))
  ));
drop policy if exists "docente_publica_comunicados" on comunicados;
create policy "docente_publica_comunicados" on comunicados for insert
  with check (public.rol_actual() = 'docente' and aula_id in (select public.docente_aulas_ids()));
drop policy if exists "docente_borra_sus_comunicados" on comunicados;
create policy "docente_borra_sus_comunicados" on comunicados for delete
  using (public.rol_actual() = 'docente' and autor_id = auth.uid());
drop policy if exists "estudiante_ve_comunicados" on comunicados;
create policy "estudiante_ve_comunicados" on comunicados for select
  using (public.rol_actual() = 'estudiante' and (
    (nivel is null and aula_id is null)
    or aula_id in (select m.aula_id from public.mis_aulas_estudiante() m)
    or nivel in (select m.nivel from public.mis_aulas_estudiante() m)
  ));

create or replace trigger auditoria_comunicados after insert or update or delete on public.comunicados
  for each row execute function public.registrar_auditoria();

-- Motivo del rechazo de un voucher (lo lee el padre).
alter table pagos add column if not exists motivo_rechazo text;
alter table pagos drop constraint if exists pagos_motivo_rechazo_check;
alter table pagos add constraint pagos_motivo_rechazo_check
  check (motivo_rechazo is null or char_length(motivo_rechazo) between 5 and 300);

-- Validar o rechazar un voucher: el pago y sus cuotas cambian juntos o no
-- cambia nada, y solo si sigue "validando" (no se revisa dos veces). Al
-- rechazar se exige el motivo. Reemplaza a validar_pago(uuid, boolean).
drop function if exists public.validar_pago(uuid, boolean);
create or replace function public.validar_pago(p_pago uuid, p_aprobar boolean, p_motivo text)
returns void language plpgsql security invoker set search_path = '' as $$
declare
  v_ids uuid[];
begin
  if public.rol_actual() not in ('admin', 'secretaria') then
    raise exception 'No tienes permiso para validar pagos.';
  end if;
  if not p_aprobar and char_length(coalesce(trim(p_motivo), '')) < 5 then
    raise exception 'Escribe el motivo del rechazo (mínimo 5 letras).';
  end if;

  update public.pagos
     set estado = case when p_aprobar then 'pagado' else 'rechazado' end,
         motivo_rechazo = case when p_aprobar then null else trim(p_motivo) end,
         fecha_validacion = now(),
         validado_por = auth.uid()
   where id = p_pago and estado = 'validando'
  returning coalesce(nullif(cuotas_ids, '{}'), array_remove(array[cuota_id], null)) into v_ids;
  if not found then
    raise exception 'Este pago ya fue validado o rechazado.';
  end if;

  if p_aprobar then
    update public.cuotas set estado = 'pagado' where id = any(v_ids) and estado <> 'pagado';
  else
    update public.cuotas set estado = 'pendiente' where id = any(v_ids) and estado = 'validando';
  end if;
end;
$$;
revoke execute on function public.validar_pago(uuid, boolean, text) from public, anon;
grant execute on function public.validar_pago(uuid, boolean, text) to authenticated;

-- ============================================================
-- DESCUENTOS POR ESTUDIANTE  (agregado el 20 de octubre)
-- ============================================================

-- Descuentos que la dirección otorga a un estudiante para el año de su
-- matrícula (hermanos, buenas notas u otro motivo). Uno por tipo.
create table if not exists descuentos_estudiante (
  id uuid primary key default gen_random_uuid(),
  matricula_id uuid not null references matriculas(id) on delete cascade,
  tipo text not null check (tipo in ('hermano', 'rendimiento', 'otro')),
  monto numeric(10,2) not null check (monto > 0 and monto < 10000),
  motivo text check (motivo is null or char_length(motivo) between 3 and 200),
  creado_por uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint descuentos_estudiante_unico unique (matricula_id, tipo),
  constraint descuentos_estudiante_motivo_otro check (tipo <> 'otro' or motivo is not null)
);
create index if not exists idx_descuentos_estudiante_creado_por on descuentos_estudiante(creado_por);

-- Cuánto de descuento especial tiene ya restado cada pensión.
alter table cuotas add column if not exists descuento_especial numeric(10,2) not null default 0
  check (descuento_especial >= 0);

-- Al dar o quitar un descuento, las pensiones aún no pagadas pasan a
-- restar la suma de los descuentos de la matrícula. Las ya pagadas no
-- cambian. La pensión con pronto pago debe quedar por encima de S/ 0.
create or replace function public.aplicar_descuentos_estudiante()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_matricula uuid := coalesce(new.matricula_id, old.matricula_id);
  v_total numeric(10,2);
begin
  select coalesce(sum(monto), 0) into v_total
    from public.descuentos_estudiante
   where matricula_id = v_matricula;

  if exists (
    select 1 from public.cuotas
     where matricula_id = v_matricula
       and estado in ('pendiente', 'vencido', 'validando')
       and coalesce(monto_con_descuento, monto) + descuento_especial - v_total <= 0
  ) then
    raise exception 'El descuento es muy alto: la pensión quedaría en S/ 0 o menos.';
  end if;

  update public.cuotas
     set monto = monto + descuento_especial - v_total,
         monto_con_descuento = monto_con_descuento + descuento_especial - v_total,
         descuento_especial = v_total
   where matricula_id = v_matricula
     and estado in ('pendiente', 'vencido', 'validando')
     and descuento_especial <> v_total;
  return null;
end $$;
revoke execute on function public.aplicar_descuentos_estudiante() from public, anon, authenticated;

create or replace trigger aplicar_descuentos_estudiante
  after insert or update or delete on public.descuentos_estudiante
  for each row execute function public.aplicar_descuentos_estudiante();

create or replace trigger auditoria_descuentos_estudiante
  after insert or update or delete on public.descuentos_estudiante
  for each row execute function public.registrar_auditoria();

-- Dirección y secretaría los ven; solo la dirección los da o los quita.
alter table descuentos_estudiante enable row level security;
drop policy if exists "personal_ve_descuentos" on descuentos_estudiante;
create policy "personal_ve_descuentos" on descuentos_estudiante for select
  using (public.rol_actual() in ('admin', 'secretaria'));
drop policy if exists "admin_da_descuentos" on descuentos_estudiante;
create policy "admin_da_descuentos" on descuentos_estudiante for insert
  with check (public.rol_actual() = 'admin');
drop policy if exists "admin_quita_descuentos" on descuentos_estudiante;
create policy "admin_quita_descuentos" on descuentos_estudiante for delete
  using (public.rol_actual() = 'admin');
