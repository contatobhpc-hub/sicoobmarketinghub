
-- Onda 2: Financeiro relacional per-user, ids naturais (text), sem full-replace.
-- Dados verdadeiros vivem em app_state (user-scoped). As tabelas finance_* atuais
-- receberam full-replaces sem user_id; truncamos e o app repopula via per-row upsert.

TRUNCATE TABLE
  public.finance_payments,
  public.finance_invoices,
  public.finance_expenses,
  public.finance_purchase_requests,
  public.finance_suppliers,
  public.finance_cost_centers,
  public.finance_budget
RESTART IDENTITY CASCADE;

-- Drop existing FKs (nomes padrão do Postgres)
ALTER TABLE public.finance_expenses
  DROP CONSTRAINT IF EXISTS finance_expenses_supplier_id_fkey,
  DROP CONSTRAINT IF EXISTS finance_expenses_cost_center_id_fkey,
  DROP CONSTRAINT IF EXISTS finance_expenses_invoice_id_fkey;
ALTER TABLE public.finance_invoices
  DROP CONSTRAINT IF EXISTS finance_invoices_supplier_id_fkey,
  DROP CONSTRAINT IF EXISTS finance_invoices_cost_center_id_fkey;
ALTER TABLE public.finance_payments
  DROP CONSTRAINT IF EXISTS finance_payments_invoice_id_fkey,
  DROP CONSTRAINT IF EXISTS finance_payments_supplier_id_fkey;
ALTER TABLE public.finance_purchase_requests
  DROP CONSTRAINT IF EXISTS finance_purchase_requests_supplier_id_fkey,
  DROP CONSTRAINT IF EXISTS finance_purchase_requests_cost_center_id_fkey;

-- id + FKs para text (aceita ids da aplicação: sup-xxx, cc-xxx, nf-xxx, ...)
ALTER TABLE public.finance_budget          ALTER COLUMN id DROP DEFAULT, ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE public.finance_cost_centers    ALTER COLUMN id DROP DEFAULT, ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE public.finance_suppliers       ALTER COLUMN id DROP DEFAULT, ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE public.finance_expenses
  ALTER COLUMN id DROP DEFAULT, ALTER COLUMN id TYPE text USING id::text,
  ALTER COLUMN supplier_id TYPE text USING supplier_id::text,
  ALTER COLUMN cost_center_id TYPE text USING cost_center_id::text,
  ALTER COLUMN invoice_id TYPE text USING invoice_id::text;
ALTER TABLE public.finance_invoices
  ALTER COLUMN id DROP DEFAULT, ALTER COLUMN id TYPE text USING id::text,
  ALTER COLUMN supplier_id TYPE text USING supplier_id::text,
  ALTER COLUMN cost_center_id TYPE text USING cost_center_id::text;
ALTER TABLE public.finance_payments
  ALTER COLUMN id DROP DEFAULT, ALTER COLUMN id TYPE text USING id::text,
  ALTER COLUMN invoice_id TYPE text USING invoice_id::text,
  ALTER COLUMN supplier_id TYPE text USING supplier_id::text;
ALTER TABLE public.finance_purchase_requests
  ALTER COLUMN id DROP DEFAULT, ALTER COLUMN id TYPE text USING id::text,
  ALTER COLUMN supplier_id TYPE text USING supplier_id::text,
  ALTER COLUMN cost_center_id TYPE text USING cost_center_id::text;

-- user_id em todas as tabelas (NOT NULL, FK auth.users)
ALTER TABLE public.finance_budget          ADD COLUMN user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.finance_cost_centers    ADD COLUMN user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.finance_suppliers       ADD COLUMN user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.finance_expenses        ADD COLUMN user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.finance_invoices        ADD COLUMN user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.finance_payments        ADD COLUMN user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.finance_purchase_requests ADD COLUMN user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;

-- Índices por user_id
CREATE INDEX IF NOT EXISTS finance_budget_user_idx     ON public.finance_budget(user_id);
CREATE INDEX IF NOT EXISTS finance_cc_user_idx         ON public.finance_cost_centers(user_id);
CREATE INDEX IF NOT EXISTS finance_sup_user_idx        ON public.finance_suppliers(user_id);
CREATE INDEX IF NOT EXISTS finance_exp_user_idx        ON public.finance_expenses(user_id);
CREATE INDEX IF NOT EXISTS finance_inv_user_idx        ON public.finance_invoices(user_id);
CREATE INDEX IF NOT EXISTS finance_pay_user_idx        ON public.finance_payments(user_id);
CREATE INDEX IF NOT EXISTS finance_pr_user_idx         ON public.finance_purchase_requests(user_id);

-- GRANTs
GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_budget            TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_cost_centers      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_suppliers         TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_expenses          TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_invoices          TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_payments          TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_purchase_requests TO authenticated;
GRANT ALL ON public.finance_budget, public.finance_cost_centers, public.finance_suppliers, public.finance_expenses, public.finance_invoices, public.finance_payments, public.finance_purchase_requests TO service_role;

-- RLS: usuário só vê/gerencia seus próprios dados
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['finance_budget','finance_cost_centers','finance_suppliers','finance_expenses','finance_invoices','finance_payments','finance_purchase_requests'])
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "user manages own %I" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "authenticated read %I" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "authenticated write %I" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "user manages own %I" ON public.%I FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())', t, t);
  END LOOP;
END $$;
