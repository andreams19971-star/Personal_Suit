-- =====================================================
-- EJECUTA ESTO EN: Supabase → SQL Editor → New query
-- Arregla los permisos para que la clave anon pueda
-- leer y escribir sin necesidad de autenticación
-- =====================================================

-- 1. Eliminar las políticas anteriores que no funcionan
drop policy if exists "Allow all for authenticated" on transactions;
drop policy if exists "Allow all for authenticated" on loans;
drop policy if exists "Allow all for authenticated" on tasks;
drop policy if exists "Allow all for authenticated" on habits;
drop policy if exists "Allow all for authenticated" on goals;
drop policy if exists "Allow all for authenticated" on notes;
drop policy if exists "Allow all for authenticated" on cars;
drop policy if exists "Allow all for authenticated" on car_payments;
drop policy if exists "Allow all for authenticated" on car_expenses;

-- 2. Crear políticas nuevas que permiten TODO a la clave anon
--    (perfecto para apps personales sin login)

create policy "anon_all" on transactions  for all to anon using (true) with check (true);
create policy "anon_all" on loans         for all to anon using (true) with check (true);
create policy "anon_all" on tasks         for all to anon using (true) with check (true);
create policy "anon_all" on habits        for all to anon using (true) with check (true);
create policy "anon_all" on goals         for all to anon using (true) with check (true);
create policy "anon_all" on notes         for all to anon using (true) with check (true);
create policy "anon_all" on cars          for all to anon using (true) with check (true);
create policy "anon_all" on car_payments  for all to anon using (true) with check (true);
create policy "anon_all" on car_expenses  for all to anon using (true) with check (true);

-- 3. Verificar que quedó bien (debes ver 9 filas con policyname = 'anon_all')
select tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public'
order by tablename;
