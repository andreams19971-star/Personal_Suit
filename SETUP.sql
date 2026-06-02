-- ============================================================
-- SETUP.sql — Mi Suite Personal
-- Ejecutar completo en Supabase → SQL Editor (primera instalación)
-- También seguro de re-ejecutar en instalaciones existentes
-- ============================================================

-- ═══════════════════════════════════════════════
-- 1. COLUMNAS ADICIONALES EN TABLAS EXISTENTES
-- ═══════════════════════════════════════════════
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status      text NOT NULL DEFAULT 'pending';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_at  timestamptz   DEFAULT now();
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS subcategory text;

ALTER TABLE car_payments ADD COLUMN IF NOT EXISTS account text DEFAULT 'cash';
ALTER TABLE car_expenses  ADD COLUMN IF NOT EXISTS account text DEFAULT 'cash';

ALTER TABLE apt_reservations ADD COLUMN IF NOT EXISTS gender text;

-- ═══════════════════════════════════════════════
-- 2. TABLA APP_SETTINGS
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS app_settings (
  key   text PRIMARY KEY,
  value jsonb NOT NULL
);

-- ═══════════════════════════════════════════════
-- 3. UUID DEFAULT EN TODAS LAS TABLAS DE DATOS
-- ═══════════════════════════════════════════════
DO $$
DECLARE
  tbls text[] := ARRAY[
    'transactions','loans','account_balances','credit_cards','card_charges',
    'tasks','habits','goals','notes',
    'cars','car_payments','car_expenses',
    'apt_rooms','apt_reservations','apt_expenses',
    'app_settings'
  ];
  t text;
BEGIN
  FOREACH t IN ARRAY tbls LOOP
    BEGIN
      EXECUTE format('ALTER TABLE %I ALTER COLUMN id SET DEFAULT gen_random_uuid()::text', t);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Skip %.id DEFAULT: %', t, SQLERRM;
    END;
  END LOOP;
END $$;

-- ═══════════════════════════════════════════════
-- 4. TABLA PROFILES
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name         text NOT NULL DEFAULT '',
  email        text,
  allowed_apps text[] DEFAULT ARRAY['finanz','planner','flota','apartamento'],
  is_admin     boolean DEFAULT false,
  avatar_color text DEFAULT '#22C55E',
  created_at   timestamptz DEFAULT now(),
  last_seen    timestamptz DEFAULT now()
);

-- Trigger para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.email
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ═══════════════════════════════════════════════
-- 5. RLS — HABILITAR Y CREAR POLÍTICAS
-- ═══════════════════════════════════════════════

-- Habilitar RLS en todas las tablas
DO $$
DECLARE
  tbls text[] := ARRAY[
    'transactions','loans','account_balances','credit_cards','card_charges',
    'tasks','habits','goals','notes','cars','car_payments','car_expenses',
    'apt_rooms','apt_reservations','apt_expenses','app_settings','profiles'
  ];
  t text;
BEGIN
  FOREACH t IN ARRAY tbls LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- Políticas para tablas de datos (anon + authenticated)
DO $$
DECLARE
  tbls text[] := ARRAY[
    'transactions','loans','account_balances','credit_cards','card_charges',
    'tasks','habits','goals','notes','cars','car_payments','car_expenses',
    'apt_rooms','apt_reservations','apt_expenses','app_settings'
  ];
  t text;
BEGIN
  FOREACH t IN ARRAY tbls LOOP
    BEGIN
      EXECUTE format('CREATE POLICY "anon_all" ON %I FOR ALL TO anon USING (true) WITH CHECK (true)', t);
    EXCEPTION WHEN duplicate_object THEN NULL; END;
    BEGIN
      EXECUTE format('CREATE POLICY "auth_all" ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t);
    EXCEPTION WHEN duplicate_object THEN NULL; END;
  END LOOP;
END $$;

-- Políticas para profiles
DO $$
BEGIN
  -- Limpiar policies viejas de profiles
  DROP POLICY IF EXISTS "own_profile"           ON profiles;
  DROP POLICY IF EXISTS "admin_all_profiles"    ON profiles;
  DROP POLICY IF EXISTS "profiles_select"       ON profiles;
  DROP POLICY IF EXISTS "profiles_select_anon"  ON profiles;
  DROP POLICY IF EXISTS "profiles_update"       ON profiles;
  DROP POLICY IF EXISTS "profiles_insert"       ON profiles;
  DROP POLICY IF EXISTS "anon_all"              ON profiles;
  DROP POLICY IF EXISTS "auth_all"              ON profiles;
END $$;

CREATE POLICY "profiles_select"      ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_select_anon" ON profiles FOR SELECT TO anon           USING (true);
CREATE POLICY "profiles_update"      ON profiles FOR UPDATE TO authenticated  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_insert"      ON profiles FOR INSERT TO authenticated  WITH CHECK (auth.uid() = id);

-- ═══════════════════════════════════════════════
-- 6. RPC ADMIN
-- ═══════════════════════════════════════════════
CREATE OR REPLACE FUNCTION admin_update_profile(
  target_id    uuid,
  new_name     text    DEFAULT NULL,
  new_apps     text[]  DEFAULT NULL,
  new_is_admin boolean DEFAULT NULL,
  new_color    text    DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE caller_is_admin boolean;
BEGIN
  SELECT is_admin INTO caller_is_admin FROM profiles WHERE id = auth.uid();
  IF NOT COALESCE(caller_is_admin, false) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;
  UPDATE profiles SET
    name         = COALESCE(new_name,     name),
    allowed_apps = COALESCE(new_apps,     allowed_apps),
    is_admin     = COALESCE(new_is_admin, is_admin),
    avatar_color = COALESCE(new_color,    avatar_color)
  WHERE id = target_id;
END;
$$;
GRANT EXECUTE ON FUNCTION admin_update_profile TO authenticated;

-- ═══════════════════════════════════════════════
-- 7. MARCAR ADMIN (cambiar email si es necesario)
-- ═══════════════════════════════════════════════
UPDATE profiles SET
  is_admin     = true,
  name         = 'Andre',
  allowed_apps = ARRAY['finanz','planner','flota','apartamento']
WHERE email = 'andreams1997@gmail.com';

-- ═══════════════════════════════════════════════
-- 8. VERIFICACIÓN FINAL
-- ═══════════════════════════════════════════════
SELECT 'profiles' AS tabla, COUNT(*) FROM profiles
UNION ALL SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL SELECT 'tasks', COUNT(*) FROM tasks;

SELECT name, email, is_admin, allowed_apps FROM profiles;
