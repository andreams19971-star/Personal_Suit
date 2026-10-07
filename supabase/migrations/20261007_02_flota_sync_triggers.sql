-- ============================================================
-- 02 · FlotaTracker -> FinanzApp por trigger (consistencia ACID)
-- Ejecutar DESPUES de 01 y ANTES de desplegar el frontend nuevo.
--
-- Antes: el navegador hacia dos inserts separados (pago + ingreso).
-- Ahora: la base mantiene transactions sola, en la misma transaccion.
--
--   car_payments  pagado=true   -> crea/actualiza el ingreso
--                 pagado=false  -> borra el ingreso
--                 DELETE        -> borra el ingreso
--   car_expenses  INSERT/UPDATE -> crea/actualiza el gasto
--                 DELETE        -> borra el gasto
--
-- El vinculo es transactions.source_ref ('car_payment:<id>' /
-- 'car_expense:<id>') con indice unico: imposible duplicar por
-- doble clic o reintento.
-- ============================================================
BEGIN;

ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS source_ref text;
CREATE UNIQUE INDEX IF NOT EXISTS transactions_source_ref_key
  ON public.transactions (source_ref);

-- ── Enlazar el historico ya sincronizado por el frontend ─────
-- Empareja 1 a 1 por usuario + fecha + monto para no duplicar despues.
WITH p AS (
  SELECT cp.id, cp.user_id::text AS uid, cp.fecha::text AS d, cp.monto,
         row_number() OVER (PARTITION BY cp.user_id, cp.fecha, cp.monto ORDER BY cp.created_at, cp.id) AS rn
    FROM public.car_payments cp
   WHERE cp.pagado
), t AS (
  SELECT tx.id, tx.user_id::text AS uid, tx.date::text AS d, tx.amount,
         row_number() OVER (PARTITION BY tx.user_id, tx.date, tx.amount ORDER BY tx.created_at, tx.id) AS rn
    FROM public.transactions tx
   WHERE tx.type = 'income' AND tx.category = 'flota_inc' AND tx.source_ref IS NULL
)
UPDATE public.transactions tx
   SET source_ref = 'car_payment:' || p.id
  FROM p JOIN t ON t.uid = p.uid AND t.d = p.d AND t.amount = p.monto AND t.rn = p.rn
 WHERE tx.id = t.id;

WITH e AS (
  SELECT ce.id, ce.user_id::text AS uid, ce.fecha::text AS d, ce.amount,
         row_number() OVER (PARTITION BY ce.user_id, ce.fecha, ce.amount ORDER BY ce.created_at, ce.id) AS rn
    FROM public.car_expenses ce
), t AS (
  SELECT tx.id, tx.user_id::text AS uid, tx.date::text AS d, tx.amount,
         row_number() OVER (PARTITION BY tx.user_id, tx.date, tx.amount ORDER BY tx.created_at, tx.id) AS rn
    FROM public.transactions tx
   WHERE tx.type = 'expense' AND tx.category = 'transport' AND tx.source_ref IS NULL
     AND (tx.note LIKE '% — %' OR tx.note LIKE 'Gasto %')
)
UPDATE public.transactions tx
   SET source_ref = 'car_expense:' || e.id
  FROM e JOIN t ON t.uid = e.uid AND t.d = e.d AND t.amount = e.amount AND t.rn = e.rn
 WHERE tx.id = t.id;

-- ── Pagos ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.sync_car_payment_to_transactions()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  ref      text;
  car_name text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM transactions WHERE source_ref = 'car_payment:' || OLD.id;
    RETURN OLD;
  END IF;

  ref := 'car_payment:' || NEW.id;

  IF NOT NEW.pagado THEN
    DELETE FROM transactions WHERE source_ref = ref;
    RETURN NEW;
  END IF;

  SELECT nombre INTO car_name FROM cars WHERE id = NEW.car_id;

  INSERT INTO transactions (id, user_id, date, type, category, subcategory, account, amount, note, source_ref)
  VALUES (gen_random_uuid()::text, NEW.user_id, NEW.fecha, 'income', 'flota_inc',
          coalesce(car_name, 'Vehículo'), coalesce(NEW.account, 'cash'), NEW.monto,
          'Ingreso flota — ' || coalesce(car_name, NEW.car_id), ref)
  ON CONFLICT (source_ref) DO UPDATE
    SET date        = EXCLUDED.date,
        account     = EXCLUDED.account,
        amount      = EXCLUDED.amount,
        subcategory = EXCLUDED.subcategory;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS car_payments_sync_tx ON public.car_payments;
CREATE TRIGGER car_payments_sync_tx
  AFTER INSERT OR UPDATE OR DELETE ON public.car_payments
  FOR EACH ROW EXECUTE FUNCTION public.sync_car_payment_to_transactions();

-- ── Gastos ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.sync_car_expense_to_transactions()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  car_name text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM transactions WHERE source_ref = 'car_expense:' || OLD.id;
    RETURN OLD;
  END IF;

  SELECT nombre INTO car_name FROM cars WHERE id = NEW.car_id;

  INSERT INTO transactions (id, user_id, date, type, category, subcategory, account, amount, note, source_ref)
  VALUES (gen_random_uuid()::text, NEW.user_id, NEW.fecha, 'expense', 'transport',
          coalesce(nullif(NEW.category, ''), 'Gasto vehículo'), coalesce(NEW.account, 'cash'), NEW.amount,
          coalesce(nullif(NEW.note, ''), NEW.category, '') || coalesce(' — ' || car_name, ''),
          'car_expense:' || NEW.id)
  ON CONFLICT (source_ref) DO UPDATE
    SET date        = EXCLUDED.date,
        account     = EXCLUDED.account,
        amount      = EXCLUDED.amount,
        subcategory = EXCLUDED.subcategory,
        note        = EXCLUDED.note;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS car_expenses_sync_tx ON public.car_expenses;
CREATE TRIGGER car_expenses_sync_tx
  AFTER INSERT OR UPDATE OR DELETE ON public.car_expenses
  FOR EACH ROW EXECUTE FUNCTION public.sync_car_expense_to_transactions();

-- Nadie llama estas funciones directamente: solo los triggers
REVOKE ALL ON FUNCTION public.sync_car_payment_to_transactions() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_car_expense_to_transactions() FROM PUBLIC, anon, authenticated;

COMMIT;

-- ── Verificacion: pagos cobrados sin ingreso enlazado ────────
-- (historicos que el frontend nunca alcanzo a sincronizar; se
--  enlazaran solos la proxima vez que los edites o re-marques)
SELECT cp.id, cp.car_id, cp.fecha, cp.monto
  FROM public.car_payments cp
 WHERE cp.pagado
   AND NOT EXISTS (SELECT 1 FROM public.transactions t WHERE t.source_ref = 'car_payment:' || cp.id)
 ORDER BY cp.fecha DESC;
