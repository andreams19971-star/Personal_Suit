-- ============================================================
-- 03 · ApartamentoApp: imposible solapar reservas (a nivel de BD)
--
-- La validacion del cliente se mantiene para dar un mensaje rapido,
-- pero la garantia real pasa a Postgres: dos reservas activas de la
-- misma habitacion no pueden cruzar fechas, ni siquiera si llegan
-- al mismo tiempo desde dos dispositivos.
--
--   - Rango [check_in, check_out): el dia de salida queda libre
--     para la siguiente entrada (igual que la app).
--   - 'cancelled' y 'blocked' no cuentan (igual que la app).
--
-- Si ya existen reservas solapadas, la migracion se detiene y
-- las lista en el error para que las corrijas primero.
-- ============================================================
BEGIN;

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Las fechas se guardan como texto 'YYYY-MM-DD'; este wrapper
-- permite usarlas en un indice.
CREATE OR REPLACE FUNCTION public.apt_day(v text)
RETURNS date LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT to_date(v, 'YYYY-MM-DD');
$$;

DO $$
DECLARE
  ci_type text;
  lo      text;
  hi      text;
  clash   text;
  bad     bigint;
BEGIN
  SELECT data_type INTO ci_type FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'apt_reservations' AND column_name = 'check_in';
  IF ci_type IS NULL THEN
    RAISE EXCEPTION 'apt_reservations.check_in no existe';
  END IF;

  IF ci_type = 'date' THEN
    lo := 'check_in';  hi := 'check_out';
  ELSE
    lo := 'public.apt_day(check_in::text)';  hi := 'public.apt_day(check_out::text)';
    -- Fechas que no son YYYY-MM-DD romperian el indice
    SELECT count(*) INTO bad FROM public.apt_reservations
     WHERE check_in::text  !~ '^\d{4}-\d{2}-\d{2}$'
        OR check_out::text !~ '^\d{4}-\d{2}-\d{2}$';
    IF bad > 0 THEN
      RAISE EXCEPTION '% reserva(s) tienen fechas con formato invalido; corrigelas antes de continuar', bad;
    END IF;
  END IF;

  -- Salida <= entrada tambien romperia el rango
  EXECUTE format('SELECT count(*) FROM public.apt_reservations WHERE %s <= %s', hi, lo) INTO bad;
  IF bad > 0 THEN
    RAISE EXCEPTION '% reserva(s) tienen check_out <= check_in; corrigelas antes de continuar', bad;
  END IF;

  -- Solapes existentes
  EXECUTE format($q$
    SELECT string_agg(x, E'\n') FROM (
      SELECT format('  hab %%s: "%%s" (%%s -> %%s)  vs  "%%s" (%%s -> %%s)',
                    a.room_id, a.guest, a.check_in, a.check_out, b.guest, b.check_in, b.check_out) AS x
        FROM public.apt_reservations a
        JOIN public.apt_reservations b
          ON a.user_id = b.user_id AND a.room_id = b.room_id AND a.id < b.id
         AND daterange(%1$s, %2$s, '[)') && daterange(%3$s, %4$s, '[)')
       WHERE coalesce(a.status,'') NOT IN ('cancelled','blocked')
         AND coalesce(b.status,'') NOT IN ('cancelled','blocked')
       LIMIT 20
    ) s $q$,
    replace(replace(lo, 'check_in', 'a.check_in'), 'check_out', 'a.check_out'),
    replace(replace(hi, 'check_in', 'a.check_in'), 'check_out', 'a.check_out'),
    replace(replace(lo, 'check_in', 'b.check_in'), 'check_out', 'b.check_out'),
    replace(replace(hi, 'check_in', 'b.check_in'), 'check_out', 'b.check_out'))
  INTO clash;
  IF clash IS NOT NULL THEN
    RAISE EXCEPTION E'Ya existen reservas solapadas. Cancela o corrige una de cada par y vuelve a ejecutar:\n%', clash;
  END IF;

  ALTER TABLE public.apt_reservations DROP CONSTRAINT IF EXISTS no_overlapping_dates;
  EXECUTE format($q$
    ALTER TABLE public.apt_reservations
      ADD CONSTRAINT no_overlapping_dates
      EXCLUDE USING gist (
        user_id WITH =,
        room_id WITH =,
        daterange(%s, %s, '[)') WITH &&
      ) WHERE (status IS DISTINCT FROM 'cancelled' AND status IS DISTINCT FROM 'blocked')
  $q$, lo, hi);

  ALTER TABLE public.apt_reservations DROP CONSTRAINT IF EXISTS apt_reservations_dates_ok;
  EXECUTE format(
    'ALTER TABLE public.apt_reservations ADD CONSTRAINT apt_reservations_dates_ok CHECK (%s > %s)', hi, lo);
END $$;

COMMIT;
