-- ============================================================
-- 01 · RLS: aislamiento real por usuario
-- Ejecutar completo en Supabase -> SQL Editor.
-- Es transaccional: si algo falla, no cambia nada.
--
-- Que hace:
--   1. Asigna al admin las filas huerfanas (user_id NULL)
--   2. user_id: DEFAULT auth.uid() + NOT NULL
--   3. Borra TODAS las politicas viejas (anon_all, auth_all, ...)
--      y crea una sola: cada usuario solo ve/escribe sus filas
--   4. app_settings pasa a clave (user_id, key)
--   5. profiles: sin lectura anonima; nadie se auto-asigna admin
--
-- El bot de Telegram no se ve afectado: usa service_role, que
-- ignora RLS y solo vive dentro de la Edge Function.
-- ============================================================
BEGIN;

-- ── 0. Dueño de las filas huerfanas ──────────────────────────
DO $$
DECLARE
  tbls text[] := ARRAY[
    'transactions','loans','account_balances','credit_cards','card_charges',
    'tasks','habits','goals','notes',
    'cars','car_payments','car_expenses',
    'apt_rooms','apt_reservations','apt_expenses','app_settings'
  ];
  t       text;
  owner   uuid;
  coltype text;
  n       bigint;
  r       record;
BEGIN
  SELECT id INTO owner FROM public.profiles WHERE is_admin ORDER BY created_at LIMIT 1;
  IF owner IS NULL THEN
    SELECT id INTO owner FROM auth.users ORDER BY created_at LIMIT 1;
  END IF;
  IF owner IS NULL THEN
    RAISE EXCEPTION 'No hay usuarios en auth.users: crea tu usuario antes de correr esta migracion';
  END IF;

  FOREACH t IN ARRAY tbls LOOP
    IF to_regclass('public.' || t) IS NULL THEN
      RAISE NOTICE 'Tabla % no existe, se omite', t;
      CONTINUE;
    END IF;

    -- 1. Columna user_id
    SELECT data_type INTO coltype FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = t AND column_name = 'user_id';
    IF coltype IS NULL THEN
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN user_id uuid', t);
      coltype := 'uuid';
    END IF;

    -- 2. Filas huerfanas -> admin
    IF t = 'app_settings' THEN
      -- telegram_config guarda su dueño dentro del JSON
      BEGIN
        UPDATE public.app_settings
           SET user_id = (value->>'user_id')::uuid
         WHERE user_id IS NULL AND key = 'telegram_config'
           AND coalesce(value->>'user_id','') <> '';
      EXCEPTION WHEN others THEN
        RAISE NOTICE 'telegram_config: no se pudo leer user_id del JSON (%)', SQLERRM;
      END;
      -- una fila a la vez: si ya existe (owner, key) se deja la huerfana sin tocar
      FOR r IN SELECT key FROM public.app_settings WHERE user_id IS NULL LOOP
        IF NOT EXISTS (SELECT 1 FROM public.app_settings s WHERE s.user_id = owner AND s.key = r.key) THEN
          UPDATE public.app_settings SET user_id = owner WHERE user_id IS NULL AND key = r.key;
        ELSE
          DELETE FROM public.app_settings WHERE user_id IS NULL AND key = r.key;
          RAISE NOTICE 'app_settings: se elimino el duplicado sin dueño de la clave %', r.key;
        END IF;
      END LOOP;
    ELSE
      IF coltype = 'uuid' THEN
        EXECUTE format('UPDATE public.%I SET user_id = $1 WHERE user_id IS NULL', t) USING owner;
      ELSE
        EXECUTE format('UPDATE public.%I SET user_id = $1::text WHERE user_id IS NULL', t) USING owner;
      END IF;
      GET DIAGNOSTICS n = ROW_COUNT;
      IF n > 0 THEN RAISE NOTICE '%: % fila(s) sin dueño asignadas al admin', t, n; END IF;
    END IF;

    -- 3. DEFAULT + NOT NULL
    IF coltype = 'uuid' THEN
      EXECUTE format('ALTER TABLE public.%I ALTER COLUMN user_id SET DEFAULT auth.uid()', t);
    ELSE
      EXECUTE format('ALTER TABLE public.%I ALTER COLUMN user_id SET DEFAULT (auth.uid())::text', t);
    END IF;
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN user_id SET NOT NULL', t);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I (user_id)', t || '_user_id_idx', t);

    -- 4. Politicas: fuera todo lo viejo, una sola regla nueva
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', r.policyname, t);
    END LOOP;
    IF coltype = 'uuid' THEN
      EXECUTE format(
        'CREATE POLICY own_rows ON public.%I FOR ALL TO authenticated
           USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()))', t);
    ELSE
      EXECUTE format(
        'CREATE POLICY own_rows ON public.%I FOR ALL TO authenticated
           USING (user_id = (SELECT auth.uid())::text) WITH CHECK (user_id = (SELECT auth.uid())::text)', t);
    END IF;

    -- anon no necesita nada sobre estas tablas
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
  END LOOP;
END $$;

-- ── 1. app_settings: clave (user_id, key) ────────────────────
DO $$
DECLARE
  pk_name text;
  pk_cols text;
BEGIN
  SELECT c.conname, string_agg(a.attname, ',' ORDER BY k.ord)
    INTO pk_name, pk_cols
    FROM pg_constraint c
    CROSS JOIN LATERAL unnest(c.conkey) WITH ORDINALITY AS k(attnum, ord)
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
   WHERE c.conrelid = 'public.app_settings'::regclass AND c.contype = 'p'
   GROUP BY c.conname;

  IF pk_cols IS DISTINCT FROM 'user_id,key' THEN
    IF pk_name IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.app_settings DROP CONSTRAINT %I', pk_name);
    END IF;
    ALTER TABLE public.app_settings ADD CONSTRAINT app_settings_pkey PRIMARY KEY (user_id, key);
  END IF;
END $$;

-- ── 2. profiles ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce((SELECT p.is_admin FROM public.profiles p WHERE p.id = auth.uid()), false);
$$;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' LOOP
    EXECUTE format('DROP POLICY %I ON public.profiles', r.policyname);
  END LOOP;
END $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_select ON public.profiles FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()) OR public.is_admin());
CREATE POLICY profiles_insert ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));
CREATE POLICY profiles_update ON public.profiles FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid())) WITH CHECK (id = (SELECT auth.uid()));
REVOKE ALL ON public.profiles FROM anon;

-- Un usuario normal no puede darse admin ni desbloquearse apps.
-- Los admins (via admin_update_profile) y el SQL Editor siguen pudiendo.
CREATE OR REPLACE FUNCTION public.profiles_guard_privileges()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.is_admin := false;
    RETURN NEW;
  END IF;
  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin
     OR NEW.allowed_apps IS DISTINCT FROM OLD.allowed_apps THEN
    RAISE EXCEPTION 'Solo un administrador puede cambiar permisos' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS profiles_guard_privileges ON public.profiles;
CREATE TRIGGER profiles_guard_privileges
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_guard_privileges();

COMMIT;

-- ── Verificacion (debe mostrar solo own_rows / profiles_*) ───
SELECT tablename, policyname, roles, cmd
  FROM pg_policies WHERE schemaname = 'public'
 ORDER BY tablename, policyname;
