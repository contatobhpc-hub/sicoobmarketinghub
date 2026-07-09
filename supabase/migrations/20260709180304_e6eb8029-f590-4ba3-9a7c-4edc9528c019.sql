
-- 1. Add user_id column
ALTER TABLE public.app_state
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Backfill from updated_by
UPDATE public.app_state SET user_id = updated_by WHERE user_id IS NULL AND updated_by IS NOT NULL;

-- 3. Drop rows that still have no owner (shouldn't happen in practice)
DELETE FROM public.app_state WHERE user_id IS NULL;

-- 4. Enforce NOT NULL
ALTER TABLE public.app_state ALTER COLUMN user_id SET NOT NULL;

-- 5. Recreate uniqueness on (user_id, module)
ALTER TABLE public.app_state DROP CONSTRAINT IF EXISTS app_state_module_key;
ALTER TABLE public.app_state DROP CONSTRAINT IF EXISTS app_state_pkey CASCADE;
ALTER TABLE public.app_state ADD PRIMARY KEY (user_id, module);

-- 6. Reset RLS policies to per-user scope (+ admin read)
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'app_state' LOOP
    EXECUTE format('DROP POLICY %I ON public.app_state', p.policyname);
  END LOOP;
END $$;

ALTER TABLE public.app_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own app_state"
  ON public.app_state
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins read all app_state"
  ON public.app_state
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS app_state_user_module_idx ON public.app_state(user_id, module);
