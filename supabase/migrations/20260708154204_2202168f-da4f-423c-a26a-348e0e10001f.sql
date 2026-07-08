
-- Generic per-module JSON state (shared across the team)
CREATE TABLE IF NOT EXISTS public.app_state (
  module text PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_state TO authenticated;
GRANT ALL ON public.app_state TO service_role;

ALTER TABLE public.app_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth can read app_state" ON public.app_state
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth can insert app_state" ON public.app_state
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth can update app_state" ON public.app_state
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER trg_app_state_updated_at
  BEFORE UPDATE ON public.app_state
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Allow admins to update anyone's role
CREATE POLICY "admin manages user_roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to read all profiles (existing policy allows only self)
CREATE POLICY "admin reads all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Storage policies for contract-files bucket (bucket created via storage tool)
CREATE POLICY "auth read contract-files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'contract-files');
CREATE POLICY "auth upload contract-files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'contract-files');
CREATE POLICY "auth update contract-files" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'contract-files');
CREATE POLICY "auth delete contract-files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'contract-files');
