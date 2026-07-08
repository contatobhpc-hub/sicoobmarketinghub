
-- ============ Roles enum ============
CREATE TYPE public.app_role AS ENUM ('admin', 'gestor', 'analista', 'visualizador');

-- ============ profiles ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  job_title TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- ============ user_roles ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ updated_at trigger fn ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ handle_new_user: cria profile + role padrão ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  -- Primeiro usuário vira admin; demais viram analista
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'analista');
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ Helper macro-style: função de update_at para tabelas finance ============
-- (usa a mesma set_updated_at)

-- ============ finance_budget ============
CREATE TABLE public.finance_budget (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  category TEXT NOT NULL,
  planned NUMERIC NOT NULL DEFAULT 0,
  approved NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (year, category)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_budget TO authenticated;
GRANT ALL ON public.finance_budget TO service_role;
ALTER TABLE public.finance_budget ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth full access budget" ON public.finance_budget FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_budget_updated BEFORE UPDATE ON public.finance_budget FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ finance_cost_centers ============
CREATE TABLE public.finance_cost_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  responsible TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_cost_centers TO authenticated;
GRANT ALL ON public.finance_cost_centers TO service_role;
ALTER TABLE public.finance_cost_centers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth full access cc" ON public.finance_cost_centers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_cc_updated BEFORE UPDATE ON public.finance_cost_centers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ finance_suppliers ============
CREATE TABLE public.finance_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company TEXT NOT NULL,
  category TEXT,
  city TEXT,
  contact TEXT,
  phone TEXT,
  email TEXT,
  contract_ref TEXT,
  products TEXT[] DEFAULT '{}',
  rating NUMERIC DEFAULT 0,
  partner_id TEXT,
  monthly_investment NUMERIC,
  annual_investment NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_suppliers TO authenticated;
GRANT ALL ON public.finance_suppliers TO service_role;
ALTER TABLE public.finance_suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth full access suppliers" ON public.finance_suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_sup_updated BEFORE UPDATE ON public.finance_suppliers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ finance_expenses ============
CREATE TABLE public.finance_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  category TEXT,
  supplier_id UUID REFERENCES public.finance_suppliers(id) ON DELETE SET NULL,
  campaign_id TEXT,
  cost_center_id UUID REFERENCES public.finance_cost_centers(id) ON DELETE SET NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_value NUMERIC NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  invoice_id UUID,
  attachment_name TEXT,
  payment_method TEXT,
  owner TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_expenses TO authenticated;
GRANT ALL ON public.finance_expenses TO service_role;
ALTER TABLE public.finance_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth full access exp" ON public.finance_expenses FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_exp_updated BEFORE UPDATE ON public.finance_expenses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ finance_purchase_requests ============
CREATE TABLE public.finance_purchase_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  requester TEXT,
  description TEXT NOT NULL,
  justification TEXT,
  campaign_id TEXT,
  project_id TEXT,
  cost_center_id UUID REFERENCES public.finance_cost_centers(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES public.finance_suppliers(id) ON DELETE SET NULL,
  estimated_value NUMERIC DEFAULT 0,
  urgency TEXT,
  status TEXT,
  timeline JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_purchase_requests TO authenticated;
GRANT ALL ON public.finance_purchase_requests TO service_role;
ALTER TABLE public.finance_purchase_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth full access pr" ON public.finance_purchase_requests FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_pr_updated BEFORE UPDATE ON public.finance_purchase_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ finance_invoices ============
CREATE TABLE public.finance_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT NOT NULL,
  supplier_id UUID REFERENCES public.finance_suppliers(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  value NUMERIC NOT NULL DEFAULT 0,
  category TEXT,
  cost_center_id UUID REFERENCES public.finance_cost_centers(id) ON DELETE SET NULL,
  campaign_id TEXT,
  project_id TEXT,
  event_id TEXT,
  pdf_name TEXT,
  xml_name TEXT,
  receipt_name TEXT,
  status TEXT,
  due_date DATE,
  received_at TIMESTAMPTZ,
  received_by TEXT,
  sent_to_payment_at TIMESTAMPTZ,
  sent_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_invoices TO authenticated;
GRANT ALL ON public.finance_invoices TO service_role;
ALTER TABLE public.finance_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth full access inv" ON public.finance_invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_inv_updated BEFORE UPDATE ON public.finance_invoices FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ finance_payments ============
CREATE TABLE public.finance_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.finance_invoices(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES public.finance_suppliers(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  value NUMERIC NOT NULL DEFAULT 0,
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  method TEXT,
  status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_payments TO authenticated;
GRANT ALL ON public.finance_payments TO service_role;
ALTER TABLE public.finance_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth full access pay" ON public.finance_payments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_pay_updated BEFORE UPDATE ON public.finance_payments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
