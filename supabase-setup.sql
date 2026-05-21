-- =============================================
-- MI SUITE PERSONAL - TABLAS SUPABASE
-- Ejecuta esto en: Supabase → SQL Editor → New query
-- =============================================

-- ─── FINANZAPP ────────────────────────────────

create table if not exists transactions (
  id          text primary key,
  date        text not null,
  type        text not null check (type in ('income','expense')),
  category    text not null,
  subcategory text,
  account     text not null,
  amount      numeric not null,
  note        text,
  loan_id     text,
  created_at  timestamp with time zone default now()
);

create table if not exists loans (
  id       text primary key,
  debtor   text not null,
  amount   numeric not null,
  balance  numeric not null,
  date     text not null,
  account  text not null,
  note     text,
  status   text not null check (status in ('active','paid')),
  payments jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default now()
);

-- ─── PLANNER ──────────────────────────────────

create table if not exists tasks (
  id        text primary key,
  title     text not null,
  category  text not null,
  priority  text not null,
  date      text not null,
  done      boolean not null default false,
  note      text,
  created_at timestamp with time zone default now()
);

create table if not exists habits (
  id          text primary key,
  name        text not null,
  icon        text not null,
  color       text not null,
  target      integer not null default 1,
  unit        text not null default 'vez',
  completions jsonb not null default '{}'::jsonb,
  created_at  timestamp with time zone default now()
);

create table if not exists goals (
  id       text primary key,
  title    text not null,
  icon     text not null,
  target   numeric not null,
  current  numeric not null default 0,
  deadline text not null,
  color    text not null,
  category text not null,
  created_at timestamp with time zone default now()
);

create table if not exists notes (
  id      text primary key,
  title   text not null,
  content text not null,
  color   text not null,
  date    text not null,
  created_at timestamp with time zone default now()
);

-- ─── FLOTAAPP ─────────────────────────────────

create table if not exists cars (
  id            text primary key,
  nombre        text not null,
  placa         text not null,
  modelo        text not null,
  conductor     text not null,
  tipo          text not null check (tipo in ('diario','mensual')),
  valor_diario  numeric,
  valor_mensual numeric,
  color         text not null,
  color_dim     text not null,
  icon          text not null,
  activo        boolean not null default true,
  created_at    timestamp with time zone default now()
);

create table if not exists car_payments (
  id       text primary key,
  car_id   text not null references cars(id) on delete cascade,
  fecha    text not null,
  monto    numeric not null,
  pagado   boolean not null default false,
  nota     text,
  created_at timestamp with time zone default now()
);

create table if not exists car_expenses (
  id         text primary key,
  car_id     text not null references cars(id) on delete cascade,
  fecha      text not null,
  categoria  text not null,
  monto      numeric not null,
  nota       text,
  created_at timestamp with time zone default now()
);

-- ─── ROW LEVEL SECURITY (RLS) ─────────────────
-- Habilita RLS en todas las tablas
alter table transactions  enable row level security;
alter table loans         enable row level security;
alter table tasks         enable row level security;
alter table habits        enable row level security;
alter table goals         enable row level security;
alter table notes         enable row level security;
alter table cars          enable row level security;
alter table car_payments  enable row level security;
alter table car_expenses  enable row level security;

-- Políticas: cualquier usuario autenticado puede hacer todo
-- (para uso personal, sin multi-usuario)
create policy "Allow all for authenticated" on transactions  for all using (true) with check (true);
create policy "Allow all for authenticated" on loans         for all using (true) with check (true);
create policy "Allow all for authenticated" on tasks         for all using (true) with check (true);
create policy "Allow all for authenticated" on habits        for all using (true) with check (true);
create policy "Allow all for authenticated" on goals         for all using (true) with check (true);
create policy "Allow all for authenticated" on notes         for all using (true) with check (true);
create policy "Allow all for authenticated" on cars          for all using (true) with check (true);
create policy "Allow all for authenticated" on car_payments  for all using (true) with check (true);
create policy "Allow all for authenticated" on car_expenses  for all using (true) with check (true);

