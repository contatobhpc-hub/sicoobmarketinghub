DROP POLICY IF EXISTS "auth read contract-files" ON storage.objects;
DROP POLICY IF EXISTS "auth upload contract-files" ON storage.objects;
DROP POLICY IF EXISTS "auth update contract-files" ON storage.objects;
DROP POLICY IF EXISTS "auth delete contract-files" ON storage.objects;

DROP POLICY IF EXISTS "Authenticated can view profiles" ON public.profiles;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);