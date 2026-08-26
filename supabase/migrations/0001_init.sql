-- Sistemas Fotovoltaicos — esquema inicial
-- Ejecutar en: SQL Editor -> New query -> Run

-- ============================================================
-- Tablas de negocio
-- ============================================================

create table if not exists public.socios (
  id uuid primary key,
  nombre text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted boolean not null default false
);

create table if not exists public.clientes (
  id uuid primary key,
  nombre text not null,
  lugar text,
  contacto text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted boolean not null default false
);

create table if not exists public.materiales (
  id uuid primary key,
  nombre text not null,
  unidad text,
  precio_mn numeric not null default 0,
  precio_usd numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted boolean not null default false
);

create table if not exists public.material_alias (
  id uuid primary key,
  material_id uuid not null,
  alias text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted boolean not null default false
);

create table if not exists public.proyectos (
  id uuid primary key,
  codigo text not null,
  nombre text not null,
  cliente_id uuid,
  watts numeric not null default 0,
  tarifa_mo numeric not null default 0,
  tarifa_tipo text not null default 'W',
  fecha text,
  estado text not null default 'en proceso',
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted boolean not null default false
);

create table if not exists public.proyecto_materiales (
  id uuid primary key,
  proyecto_id uuid not null,
  material_id uuid,
  descripcion text not null default '',
  cantidad numeric not null default 0,
  usado numeric,
  precio_mn numeric not null default 0,
  precio_usd numeric not null default 0,
  socio_comprador text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted boolean not null default false
);

create table if not exists public.mano_obra (
  id uuid primary key,
  proyecto_id uuid not null,
  descripcion text not null default 'Mano de obra',
  monto_mn numeric not null default 0,
  monto_usd numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted boolean not null default false
);

create table if not exists public.pagos (
  id uuid primary key,
  proyecto_id uuid not null,
  fecha text,
  monto_mn numeric not null default 0,
  monto_usd numeric not null default 0,
  concepto text not null default '',
  socio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted boolean not null default false
);

create table if not exists public.gastos (
  id uuid primary key,
  proyecto_id uuid not null,
  fecha text,
  descripcion text not null default '',
  monto_mn numeric not null default 0,
  monto_usd numeric not null default 0,
  socio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted boolean not null default false
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.socios enable row level security;
alter table public.clientes enable row level security;
alter table public.materiales enable row level security;
alter table public.material_alias enable row level security;
alter table public.proyectos enable row level security;
alter table public.proyecto_materiales enable row level security;
alter table public.mano_obra enable row level security;
alter table public.pagos enable row level security;
alter table public.gastos enable row level security;

create policy "socios_all" on public.socios for all to authenticated using (true) with check (true);
create policy "clientes_all" on public.clientes for all to authenticated using (true) with check (true);
create policy "materiales_all" on public.materiales for all to authenticated using (true) with check (true);
create policy "material_alias_all" on public.material_alias for all to authenticated using (true) with check (true);
create policy "proyectos_all" on public.proyectos for all to authenticated using (true) with check (true);
create policy "proyecto_materiales_all" on public.proyecto_materiales for all to authenticated using (true) with check (true);
create policy "mano_obra_all" on public.mano_obra for all to authenticated using (true) with check (true);
create policy "pagos_all" on public.pagos for all to authenticated using (true) with check (true);
create policy "gastos_all" on public.gastos for all to authenticated using (true) with check (true);

-- Índices para sincronización (filtro por updated_at)
create index if not exists socios_updated_at on public.socios (updated_at);
create index if not exists clientes_updated_at on public.clientes (updated_at);
create index if not exists materiales_updated_at on public.materiales (updated_at);
create index if not exists material_alias_updated_at on public.material_alias (updated_at);
create index if not exists proyectos_updated_at on public.proyectos (updated_at);
create index if not exists proyecto_materiales_updated_at on public.proyecto_materiales (updated_at);
create index if not exists mano_obra_updated_at on public.mano_obra (updated_at);
create index if not exists pagos_updated_at on public.pagos (updated_at);
create index if not exists gastos_updated_at on public.gastos (updated_at);

-- ============================================================
-- Perfiles + límite de 2 usuarios
-- ============================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  nombre text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
create policy "profiles_select" on public.profiles for select to authenticated using (true);

-- Crea el perfil automáticamente al registrarse
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, nombre)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'nombre', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Límite: máximo 2 usuarios registrados
create or replace function public.enforce_user_cap()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.profiles) >= 2 then
    raise exception 'Registro cerrado: máximo 2 usuarios permitidos.';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_user_cap on public.profiles;
create trigger profiles_user_cap
  before insert on public.profiles
  for each row execute function public.enforce_user_cap();
