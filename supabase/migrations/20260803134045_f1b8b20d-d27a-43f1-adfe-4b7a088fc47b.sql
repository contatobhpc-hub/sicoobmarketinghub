DROP POLICY IF EXISTS "Auth full access budget" ON public.finance_budget;
DROP POLICY IF EXISTS "Auth full access cc" ON public.finance_cost_centers;
DROP POLICY IF EXISTS "Auth full access exp" ON public.finance_expenses;
DROP POLICY IF EXISTS "Auth full access inv" ON public.finance_invoices;
DROP POLICY IF EXISTS "Auth full access pay" ON public.finance_payments;
DROP POLICY IF EXISTS "Auth full access pr" ON public.finance_purchase_requests;
DROP POLICY IF EXISTS "Auth full access suppliers" ON public.finance_suppliers;

DROP POLICY IF EXISTS "contract_files_owner_select" ON storage.objects;
DROP POLICY IF EXISTS "contract_files_owner_insert" ON storage.objects;
DROP POLICY IF EXISTS "contract_files_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "contract_files_owner_delete" ON storage.objects;

CREATE POLICY "contract_files_owner_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'contract-files' AND owner = auth.uid());
CREATE POLICY "contract_files_owner_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'contract-files' AND owner = auth.uid());
CREATE POLICY "contract_files_owner_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'contract-files' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'contract-files' AND owner = auth.uid());
CREATE POLICY "contract_files_owner_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'contract-files' AND owner = auth.uid());