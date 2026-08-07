-- ============================================================
-- I.E.P. Huellitas — Esquema de base de datos para Supabase
-- Pegar y ejecutar completo en el SQL Editor de Supabase.
-- ============================================================

-- ============================================================
-- 1. TABLAS
-- ============================================================

create table if not exists anios_escolares (
  id uuid primary key default gen_random_uuid(),
  anio integer not null unique,
  activo boolean not null default false,
  fecha_inicio date,
  fecha_fin date
);

create table if not exists aulas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  nivel text not null check (nivel in ('inicial', 'primaria')),
  anio_escolar_id uuid not null references anios_escolares(id) on delete restrict
);

create table if not exists estudiantes (
  id uuid primary key default gen_random_uuid(),
  dni varchar(8) unique,
  nombres text not null,
  apellidos text not null,
  fecha_nacimiento date,
  activo boolean not null default true,
  fecha_registro timestamptz not null default now()
);

create table if not exists apoderados (
  id uuid primary key default gen_random_uuid(),
  dni varchar(8) unique,
  nombres text not null,
  apellidos text not null,
  parentesco text,
  telefono text,
  email text,
  user_id uuid unique references auth.users(id) on delete set null
);

create table if not exists estudiante_apoderado (
  id uuid primary key default gen_random_uuid(),
  estudiante_id uuid not null references estudiantes(id) on delete cascade,
  apoderado_id uuid not null references apoderados(id) on delete cascade,
  es_principal boolean not null default false,
  unique (estudiante_id, apoderado_id)
);

create table if not exists matriculas (
  id uuid primary key default gen_random_uuid(),
  estudiante_id uuid not null references estudiantes(id) on delete restrict,
  aula_id uuid not null references aulas(id) on delete restrict,
  anio_escolar_id uuid not null references anios_escolares(id) on delete restrict,
  fecha_matricula date not null default current_date,
  estado text not null default 'activa' check (estado in ('activa', 'retirado', 'culminado')),
  fecha_retiro date,
  motivo_retiro text,
  unique (estudiante_id, anio_escolar_id)
);

create table if not exists conceptos_cobro (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  tipo text not null check (tipo in ('matricula', 'pension', 'documento', 'otro')),
  monto_base numeric(10, 2) not null,
  activo boolean not null default true
);

create table if not exists descuentos (
  id uuid primary key default gen_random_uuid(),
  anio_escolar_id uuid not null references anios_escolares(id) on delete cascade,
  tipo text not null check (tipo in ('puntualidad', 'hermano')),
  monto numeric(10, 2) not null,
  activo boolean not null default true
);

create table if not exists cuotas (
  id uuid primary key default gen_random_uuid(),
  matricula_id uuid not null references matriculas(id) on delete cascade,
  concepto_id uuid not null references conceptos_cobro(id) on delete restrict,
  mes integer check (mes between 1 and 12),
  monto numeric(10, 2) not null,
  monto_con_descuento numeric(10, 2),
  fecha_vencimiento date,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'verificando', 'pagado', 'vencido'))
);

create table if not exists pagos (
  id uuid primary key default gen_random_uuid(),
  cuota_id uuid references cuotas(id) on delete set null,
  matricula_id uuid not null references matriculas(id) on delete cascade,
  monto numeric(10, 2) not null,
  metodo text not null check (metodo in ('efectivo', 'yape', 'plin', 'transferencia', 'deposito')),
  banco text,
  numero_operacion text,
  voucher_url text,
  fecha_pago timestamptz not null default now(),
  estado text not null default 'verificando' check (estado in ('verificando', 'validado', 'rechazado')),
  validado_por uuid references auth.users(id),
  fecha_validacion timestamptz,
  titular_comprobante_nombre text,
  titular_comprobante_dni text,
  numero_comprobante text,
  tipo_comprobante text check (tipo_comprobante in ('boleta', 'factura', 'ticket')),
  serie_comprobante text
);

create table if not exists notas_bimestre (
  id uuid primary key default gen_random_uuid(),
  matricula_id uuid not null references matriculas(id) on delete cascade,
  bimestre integer not null check (bimestre between 1 and 4),
  archivo_url text not null,
  fecha_subida timestamptz not null default now(),
  subido_por uuid references auth.users(id)
);

create table if not exists solicitudes_documentos (
  id uuid primary key default gen_random_uuid(),
  matricula_id uuid not null references matriculas(id) on delete cascade,
  tipo_documento text not null,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'procesando', 'listo', 'entregado')),
  fecha_solicitud timestamptz not null default now(),
  fecha_entrega timestamptz,
  monto numeric(10, 2)
);

-- ============================================================
-- 2. ÍNDICES
-- ============================================================

create index if not exists idx_estudiantes_dni on estudiantes(dni);
create index if not exists idx_aulas_anio_escolar on aulas(anio_escolar_id);
create index if not exists idx_matriculas_anio_escolar on matriculas(anio_escolar_id);
create index if not exists idx_matriculas_estudiante on matriculas(estudiante_id);
create index if not exists idx_estudiante_apoderado_estudiante on estudiante_apoderado(estudiante_id);
create index if not exists idx_estudiante_apoderado_apoderado on estudiante_apoderado(apoderado_id);
create index if not exists idx_apoderados_user_id on apoderados(user_id);
create index if not exists idx_cuotas_matricula on cuotas(matricula_id);
create index if not exists idx_pagos_matricula on pagos(matricula_id);
create index if not exists idx_pagos_cuota on pagos(cuota_id);
create index if not exists idx_notas_bimestre_matricula on notas_bimestre(matricula_id);
create index if not exists idx_solicitudes_matricula on solicitudes_documentos(matricula_id);

-- ============================================================
-- 3. FUNCIONES AUXILIARES PARA RLS
-- ============================================================

-- Un usuario es admin si su app_metadata (JWT) trae role = 'admin'.
-- app_metadata solo puede editarlo un admin/service_role, nunca el propio usuario,
-- por eso es seguro usarlo en políticas (a diferencia de user_metadata).
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

-- IDs de estudiantes vinculados al apoderado autenticado.
create or replace function public.apoderado_estudiante_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select ea.estudiante_id
  from estudiante_apoderado ea
  join apoderados a on a.id = ea.apoderado_id
  where a.user_id = auth.uid();
$$;

-- IDs de matrículas del apoderado autenticado, limitadas al año escolar activo
-- (así el padre nunca ve datos de años anteriores, según la regla de negocio).
create or replace function public.apoderado_matricula_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select m.id
  from matriculas m
  where m.estudiante_id in (select public.apoderado_estudiante_ids())
    and m.anio_escolar_id in (select id from anios_escolares where activo = true);
$$;

-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================

alter table anios_escolares enable row level security;
alter table aulas enable row level security;
alter table estudiantes enable row level security;
alter table apoderados enable row level security;
alter table estudiante_apoderado enable row level security;
alter table matriculas enable row level security;
alter table conceptos_cobro enable row level security;
alter table descuentos enable row level security;
alter table cuotas enable row level security;
alter table pagos enable row level security;
alter table notas_bimestre enable row level security;
alter table solicitudes_documentos enable row level security;

-- Tablas de catálogo: cualquier usuario autenticado puede leer (no son datos
-- sensibles y el padre las necesita para mostrar nombres de conceptos/aulas);
-- solo el admin puede escribir.
create policy "catalogo_select_autenticados" on anios_escolares for select to authenticated using (true);
create policy "catalogo_admin_todo" on anios_escolares for all to authenticated using (is_admin()) with check (is_admin());

create policy "catalogo_select_autenticados" on aulas for select to authenticated using (true);
create policy "catalogo_admin_todo" on aulas for all to authenticated using (is_admin()) with check (is_admin());

create policy "catalogo_select_autenticados" on conceptos_cobro for select to authenticated using (true);
create policy "catalogo_admin_todo" on conceptos_cobro for all to authenticated using (is_admin()) with check (is_admin());

create policy "catalogo_select_autenticados" on descuentos for select to authenticated using (true);
create policy "catalogo_admin_todo" on descuentos for all to authenticated using (is_admin()) with check (is_admin());

-- Estudiantes: admin ve todo; el apoderado solo ve a sus propios hijos.
create policy "estudiantes_admin_todo" on estudiantes for all to authenticated using (is_admin()) with check (is_admin());
create policy "estudiantes_padre_select" on estudiantes for select to authenticated
  using (id in (select public.apoderado_estudiante_ids()));

-- Apoderados: admin ve todo; el apoderado solo ve/edita su propia ficha.
create policy "apoderados_admin_todo" on apoderados for all to authenticated using (is_admin()) with check (is_admin());
create policy "apoderados_propio_select" on apoderados for select to authenticated
  using (user_id = auth.uid());
create policy "apoderados_propio_update" on apoderados for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Relación estudiante-apoderado: admin ve todo; el apoderado ve solo sus vínculos.
create policy "estudiante_apoderado_admin_todo" on estudiante_apoderado for all to authenticated using (is_admin()) with check (is_admin());
create policy "estudiante_apoderado_propio_select" on estudiante_apoderado for select to authenticated
  using (apoderado_id in (select id from apoderados where user_id = auth.uid()));

-- Matrículas: admin ve todo; el padre solo ve las de sus hijos en el año activo.
create policy "matriculas_admin_todo" on matriculas for all to authenticated using (is_admin()) with check (is_admin());
create policy "matriculas_padre_select" on matriculas for select to authenticated
  using (id in (select public.apoderado_matricula_ids()));

-- Cuotas: admin ve todo; el padre solo ve las de matrículas propias (año activo).
create policy "cuotas_admin_todo" on cuotas for all to authenticated using (is_admin()) with check (is_admin());
create policy "cuotas_padre_select" on cuotas for select to authenticated
  using (matricula_id in (select public.apoderado_matricula_ids()));

-- Pagos: admin ve/valida todo; el padre ve los suyos y puede registrar
-- (subir voucher) uno nuevo para sus propias matrículas.
create policy "pagos_admin_todo" on pagos for all to authenticated using (is_admin()) with check (is_admin());
create policy "pagos_padre_select" on pagos for select to authenticated
  using (matricula_id in (select public.apoderado_matricula_ids()));
create policy "pagos_padre_insert" on pagos for insert to authenticated
  with check (matricula_id in (select public.apoderado_matricula_ids()));

-- Notas por bimestre: admin sube y ve todo; el padre solo ve las del año activo.
create policy "notas_admin_todo" on notas_bimestre for all to authenticated using (is_admin()) with check (is_admin());
create policy "notas_padre_select" on notas_bimestre for select to authenticated
  using (matricula_id in (select public.apoderado_matricula_ids()));

-- Solicitudes de documentos: admin ve/gestiona todo; el padre ve y crea las suyas.
create policy "solicitudes_admin_todo" on solicitudes_documentos for all to authenticated using (is_admin()) with check (is_admin());
create policy "solicitudes_padre_select" on solicitudes_documentos for select to authenticated
  using (matricula_id in (select public.apoderado_matricula_ids()));
create policy "solicitudes_padre_insert" on solicitudes_documentos for insert to authenticated
  with check (matricula_id in (select public.apoderado_matricula_ids()));

-- ============================================================
-- 5. STORAGE (buckets privados para vouchers y boletas de notas)
-- ============================================================

insert into storage.buckets (id, name, public)
values ('vouchers', 'vouchers', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('boletas-notas', 'boletas-notas', false)
on conflict (id) do nothing;

-- Fase 1 básica: solo el admin (vía service_role, desde el servidor) gestiona
-- los archivos de ambos buckets. Se afinará con políticas por padre más adelante.
create policy "vouchers_admin_todo" on storage.objects for all to authenticated
  using (bucket_id = 'vouchers' and is_admin())
  with check (bucket_id = 'vouchers' and is_admin());

create policy "boletas_admin_todo" on storage.objects for all to authenticated
  using (bucket_id = 'boletas-notas' and is_admin())
  with check (bucket_id = 'boletas-notas' and is_admin());

-- ============================================================
-- 6. DATOS SEMILLA
-- ============================================================

insert into anios_escolares (anio, activo, fecha_inicio, fecha_fin)
values (2026, true, '2026-03-01', '2026-12-18')
on conflict (anio) do nothing;

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
) as t(nombre, nivel)
where not exists (
  select 1 from aulas a
  where a.nombre = t.nombre and a.anio_escolar_id = (select id from anios_escolares where anio = 2026)
);

insert into conceptos_cobro (nombre, tipo, monto_base)
select nombre, tipo, monto_base
from (values
  ('Matrícula Inicial', 'matricula', 250.00),
  ('Matrícula Primaria', 'matricula', 300.00),
  ('Pensión Inicial', 'pension', 250.00),
  ('Pensión Primaria', 'pension', 300.00),
  ('Certificado', 'documento', 25.00),
  ('Constancia', 'documento', 15.00),
  ('Traslado', 'otro', 30.00)
) as t(nombre, tipo, monto_base)
where not exists (select 1 from conceptos_cobro c where c.nombre = t.nombre);

insert into descuentos (anio_escolar_id, tipo, monto)
select (select id from anios_escolares where anio = 2026), tipo, monto
from (values
  ('puntualidad', 20.00),
  ('hermano', 20.00)
) as t(tipo, monto)
where not exists (
  select 1 from descuentos d
  where d.anio_escolar_id = (select id from anios_escolares where anio = 2026) and d.tipo = t.tipo
);

-- ============================================================
-- V2 — Portal del padre: login por DNI, notas, pagos con
-- Yape/transferencia y sugerencia de cambio de contraseña.
-- Ejecuta este bloque completo DESPUÉS del de arriba (es seguro
-- volver a correr todo el archivo: usa IF NOT EXISTS / IF EXISTS
-- en todos lados).
-- ============================================================

-- 1. Nuevos estados oficiales de cuotas y pagos.
-- Nota: si ya existieran filas con los estados viejos
-- ('verificando' / 'validado'), actualízalas antes de correr esto
-- o la nueva restricción las rechazará.
alter table cuotas drop constraint if exists cuotas_estado_check;
alter table cuotas add constraint cuotas_estado_check
  check (estado in ('pendiente', 'validando', 'verificado', 'pagado', 'vencido'));

alter table pagos drop constraint if exists pagos_estado_check;
alter table pagos add constraint pagos_estado_check
  check (estado in ('validando', 'verificado', 'pagado', 'rechazado'));

alter table pagos alter column estado set default 'validando';

-- 2. Login del padre con el DNI del hijo + sugerencia de cambio
-- de contraseña en el primer ingreso.
alter table apoderados
  add column if not exists dni_estudiante_login text,
  add column if not exists password_cambiado boolean not null default false;

create index if not exists idx_apoderados_dni_estudiante
  on apoderados(dni_estudiante_login);

-- Permite que el padre marque SU PROPIA cuota como "validando" al
-- subir un voucher (y solo a ese estado; no puede marcarla pagada
-- ni tocar cuotas ya verificadas/pagadas). El admin sigue teniendo
-- control total vía "cuotas_admin_todo".
drop policy if exists "cuotas_padre_marcar_validando" on cuotas;
create policy "cuotas_padre_marcar_validando" on cuotas for update to authenticated
  using (
    matricula_id in (select public.apoderado_matricula_ids())
    and estado in ('pendiente', 'vencido')
  )
  with check (
    matricula_id in (select public.apoderado_matricula_ids())
    and estado = 'validando'
  );

-- 3. Notas por curso (una fila por curso + bimestre + matrícula).
create table if not exists notas_curso (
  id uuid primary key default gen_random_uuid(),
  matricula_id uuid references matriculas(id) on delete cascade,
  curso text not null,
  bimestre integer check (bimestre between 1 and 4),
  nota text not null,
  comentario text,
  fecha_registro timestamptz default now(),
  registrado_por uuid,
  unique (matricula_id, curso, bimestre)
);

create index if not exists idx_notas_curso_matricula on notas_curso(matricula_id);

alter table notas_curso enable row level security;

drop policy if exists "notas_curso_admin_todo" on notas_curso;
create policy "notas_curso_admin_todo" on notas_curso for all to authenticated
  using (is_admin()) with check (is_admin());

drop policy if exists "padres_ver_notas_hijos" on notas_curso;
create policy "padres_ver_notas_hijos"
  on notas_curso for select
  using (
    matricula_id in (
      select m.id from matriculas m
      join estudiante_apoderado ea on ea.estudiante_id = m.estudiante_id
      join apoderados a on a.id = ea.apoderado_id
      where a.user_id = auth.uid()
    )
  );

-- ============================================================
-- DATOS DE PRUEBA: estudiante + apoderado ficticios para poder
-- ver el portal del padre con datos reales. Ejecuta esto también
-- (es idempotente: puedes volver a correrlo sin duplicar nada).
-- ============================================================

insert into estudiantes (id, dni, nombres, apellidos, fecha_nacimiento, activo)
values (
  'a1a1a1a1-0000-4000-8000-000000000001',
  '76543210',
  'Aldair',
  'Salas Flores',
  '2014-05-12',
  true
)
on conflict (id) do nothing;

insert into matriculas (id, estudiante_id, aula_id, anio_escolar_id, fecha_matricula, estado)
select
  'a1a1a1a1-0000-4000-8000-000000000003',
  'a1a1a1a1-0000-4000-8000-000000000001',
  (select id from aulas where nombre = '6° Primaria'
     and anio_escolar_id = (select id from anios_escolares where anio = 2026)),
  (select id from anios_escolares where anio = 2026),
  '2026-03-01',
  'activa'
where not exists (select 1 from matriculas where id = 'a1a1a1a1-0000-4000-8000-000000000003');

insert into apoderados (id, dni, nombres, apellidos, parentesco, telefono, dni_estudiante_login, password_cambiado)
values (
  'a1a1a1a1-0000-4000-8000-000000000002',
  '45678912',
  'Carlos',
  'Salas Peña',
  'padre',
  '987654321',
  '76543210',
  false
)
on conflict (id) do nothing;

insert into estudiante_apoderado (id, estudiante_id, apoderado_id, es_principal)
values (
  'a1a1a1a1-0000-4000-8000-000000000004',
  'a1a1a1a1-0000-4000-8000-000000000001',
  'a1a1a1a1-0000-4000-8000-000000000002',
  true
)
on conflict (id) do nothing;

-- 10 pensiones marzo-diciembre 2026: marzo a junio pagadas,
-- julio en adelante pendientes (con descuento por puntualidad
-- vigente hasta el vencimiento de cada una).
insert into cuotas (matricula_id, concepto_id, mes, monto, monto_con_descuento, fecha_vencimiento, estado)
select
  'a1a1a1a1-0000-4000-8000-000000000003',
  (select id from conceptos_cobro where nombre = 'Pensión Primaria'),
  t.mes,
  300.00,
  280.00,
  (make_date(2026, t.mes, 1) + interval '1 month' - interval '1 day')::date,
  t.estado
from (values
  (3, 'pagado'), (4, 'pagado'), (5, 'pagado'), (6, 'pagado'),
  (7, 'pendiente'), (8, 'pendiente'), (9, 'pendiente'),
  (10, 'pendiente'), (11, 'pendiente'), (12, 'pendiente')
) as t(mes, estado)
where not exists (
  select 1 from cuotas c
  where c.matricula_id = 'a1a1a1a1-0000-4000-8000-000000000003' and c.mes = t.mes
);

-- 8 notas del bimestre 1.
insert into notas_curso (matricula_id, curso, bimestre, nota, comentario)
values
  ('a1a1a1a1-0000-4000-8000-000000000003', 'Matemática', 1, 'A', 'Buen manejo de operaciones básicas.'),
  ('a1a1a1a1-0000-4000-8000-000000000003', 'Comunicación', 1, 'AD', 'Excelente comprensión lectora.'),
  ('a1a1a1a1-0000-4000-8000-000000000003', 'Ciencia y Tecnología', 1, 'A', 'Participa activamente en clase.'),
  ('a1a1a1a1-0000-4000-8000-000000000003', 'Personal Social', 1, 'AD', 'Muestra empatía con sus compañeros.'),
  ('a1a1a1a1-0000-4000-8000-000000000003', 'Arte y Cultura', 1, 'B', 'Puede mejorar en trabajos grupales.'),
  ('a1a1a1a1-0000-4000-8000-000000000003', 'Educación Física', 1, 'AD', 'Gran desempeño físico y disciplina.'),
  ('a1a1a1a1-0000-4000-8000-000000000003', 'Religión', 1, 'A', 'Participa con respeto en las actividades.'),
  ('a1a1a1a1-0000-4000-8000-000000000003', 'Inglés', 1, 'B', 'Debe reforzar vocabulario básico.')
on conflict (matricula_id, curso, bimestre) do nothing;

-- El siguiente UPDATE vincula el usuario de Supabase Auth (que
-- creas manualmente, ver instrucciones al final de la respuesta)
-- con este apoderado ficticio. Ejecútalo recién DESPUÉS de crear
-- ese usuario en Authentication → Users.
update apoderados
set user_id = (select id from auth.users where email = 'padre_prueba@huellitas.pe')
where dni_estudiante_login = '76543210';
