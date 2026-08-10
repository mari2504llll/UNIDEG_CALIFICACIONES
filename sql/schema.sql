-- ============================================================
-- ESQUEMA SUPABASE - Sistema de Calificaciones UNIDEG
-- Roles: director, maestro, alumno
-- Ejecutar completo en: Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- 1) PERFILES (uno por usuario de auth.users) -----------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nombre      text not null,
  email       text not null,
  role        text not null check (role in ('director','maestro','alumno')),
  matricula   text,               -- solo si role = 'alumno', liga con tabla alumnos
  created_at  timestamptz default now()
);

-- 2) MATERIAS ---------------------------------------------------
create table if not exists public.materias (
  id         bigserial primary key,
  clave      text unique not null,
  nombre     text not null
);

-- 3) ASIGNACION MAESTRO <-> MATERIA -----------------------------
create table if not exists public.maestro_materia (
  id          bigserial primary key,
  maestro_id  uuid not null references public.profiles(id) on delete cascade,
  materia_id  bigint not null references public.materias(id) on delete cascade,
  unique (maestro_id, materia_id)
);

-- 4) ALUMNOS ------------------------------------------------------
create table if not exists public.alumnos (
  id            bigserial primary key,
  matricula     text unique not null,
  nombre        text not null,
  especialidad  text,
  subsistema    text,
  centro        text,
  plan          text,
  profile_id    uuid references public.profiles(id) on delete set null -- login del alumno
);

-- 5) CALIFICACIONES -----------------------------------------------
create table if not exists public.calificaciones (
  id            bigserial primary key,
  alumno_id     bigint not null references public.alumnos(id) on delete cascade,
  materia_id    bigint not null references public.materias(id) on delete cascade,
  maestro_id    uuid references public.profiles(id) on delete set null,
  periodo       text not null default 'SEPT-DIC',
  parcial1      numeric(5,2),
  parcial2      numeric(5,2),
  parcial3      numeric(5,2),
  final         numeric(5,2),
  extra1        numeric(5,2),
  extra_rec1    numeric(5,2),
  estatus       text default 'INSCRITO',
  tipo_curso    text default 'CURSO NORMAL',
  updated_at    timestamptz default now(),
  updated_by    uuid references public.profiles(id),
  unique (alumno_id, materia_id, periodo)
);

-- 6) HISTORIAL DE CAMBIOS (auditoría de quién cambió qué) ----------
create table if not exists public.calificaciones_historial (
  id                bigserial primary key,
  calificacion_id   bigint references public.calificaciones(id) on delete cascade,
  campo             text not null,          -- ej. 'parcial1'
  valor_anterior    text,
  valor_nuevo       text,
  cambiado_por      uuid references public.profiles(id),
  cambiado_en       timestamptz default now()
);

-- ============================================================
-- TRIGGER: registrar automáticamente en el historial
-- ============================================================
create or replace function public.log_calificacion_cambios()
returns trigger as $$
begin
  if new.parcial1 is distinct from old.parcial1 then
    insert into public.calificaciones_historial(calificacion_id, campo, valor_anterior, valor_nuevo, cambiado_por)
    values (new.id, 'parcial1', old.parcial1::text, new.parcial1::text, new.updated_by);
  end if;
  if new.parcial2 is distinct from old.parcial2 then
    insert into public.calificaciones_historial(calificacion_id, campo, valor_anterior, valor_nuevo, cambiado_por)
    values (new.id, 'parcial2', old.parcial2::text, new.parcial2::text, new.updated_by);
  end if;
  if new.parcial3 is distinct from old.parcial3 then
    insert into public.calificaciones_historial(calificacion_id, campo, valor_anterior, valor_nuevo, cambiado_por)
    values (new.id, 'parcial3', old.parcial3::text, new.parcial3::text, new.updated_by);
  end if;
  if new.final is distinct from old.final then
    insert into public.calificaciones_historial(calificacion_id, campo, valor_anterior, valor_nuevo, cambiado_por)
    values (new.id, 'final', old.final::text, new.final::text, new.updated_by);
  end if;
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_log_calificaciones on public.calificaciones;
create trigger trg_log_calificaciones
before update on public.calificaciones
for each row execute function public.log_calificacion_cambios();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.materias enable row level security;
alter table public.maestro_materia enable row level security;
alter table public.alumnos enable row level security;
alter table public.calificaciones enable row level security;
alter table public.calificaciones_historial enable row level security;

-- Función auxiliar: rol del usuario actual
create or replace function public.current_role_name()
returns text as $$
  select role from public.profiles where id = auth.uid();
$$ language sql stable security definer;

-- ---------- profiles ----------
create policy "ver_propio_perfil" on public.profiles
  for select using (id = auth.uid() or public.current_role_name() in ('director','maestro'));

create policy "actualizar_propio_perfil" on public.profiles
  for update using (id = auth.uid());

-- ---------- materias ----------
create policy "todos_ven_materias" on public.materias
  for select using (auth.uid() is not null);

create policy "director_administra_materias" on public.materias
  for all using (public.current_role_name() = 'director');

-- ---------- maestro_materia ----------
create policy "ver_asignaciones" on public.maestro_materia
  for select using (
    maestro_id = auth.uid() or public.current_role_name() = 'director'
  );

create policy "director_asigna_materias" on public.maestro_materia
  for all using (public.current_role_name() = 'director');

-- ---------- alumnos ----------
create policy "alumno_ve_su_registro" on public.alumnos
  for select using (
    profile_id = auth.uid()
    or public.current_role_name() in ('director','maestro')
  );

create policy "director_administra_alumnos" on public.alumnos
  for all using (public.current_role_name() = 'director');

-- ---------- calificaciones ----------
-- alumno: solo lectura de sus propias calificaciones
create policy "alumno_ve_sus_calificaciones" on public.calificaciones
  for select using (
    exists (
      select 1 from public.alumnos a
      where a.id = calificaciones.alumno_id and a.profile_id = auth.uid()
    )
  );

-- maestro: lee y edita solo las materias que tiene asignadas
create policy "maestro_ve_sus_materias" on public.calificaciones
  for select using (
    public.current_role_name() = 'maestro'
    and exists (
      select 1 from public.maestro_materia mm
      where mm.materia_id = calificaciones.materia_id and mm.maestro_id = auth.uid()
    )
  );

create policy "maestro_edita_sus_materias" on public.calificaciones
  for update using (
    public.current_role_name() = 'maestro'
    and exists (
      select 1 from public.maestro_materia mm
      where mm.materia_id = calificaciones.materia_id and mm.maestro_id = auth.uid()
    )
  );

-- director: ve todo, sin permiso de edición directa (solo supervisión)
create policy "director_ve_todo" on public.calificaciones
  for select using (public.current_role_name() = 'director');

create policy "director_inserta_calificaciones" on public.calificaciones
  for insert with check (public.current_role_name() in ('director','maestro'));

-- ---------- historial ----------
create policy "ver_historial" on public.calificaciones_historial
  for select using (
    public.current_role_name() in ('director','maestro')
    or exists (
      select 1 from public.calificaciones c
      join public.alumnos a on a.id = c.alumno_id
      where c.id = calificaciones_historial.calificacion_id and a.profile_id = auth.uid()
    )
  );

-- ============================================================
-- Nota: cuando crees un usuario nuevo en Supabase Auth, tienes que
-- insertar manualmente su fila en "profiles" con el role correcto
-- (o usa el trigger opcional de abajo para crearla automáticamente
-- con role 'alumno' por defecto, y luego el director la cambia).
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nombre, email, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'nombre', new.email), new.email, 'alumno');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
