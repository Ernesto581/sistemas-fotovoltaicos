-- Agregar stock (inventario/almacén) a materiales
alter table public.materiales add column if not exists stock numeric not null default 0;
