
ALTER TABLE public.partners        ALTER COLUMN id TYPE text;
ALTER TABLE public.contracts       ALTER COLUMN id TYPE text;
ALTER TABLE public.contracts       ALTER COLUMN partner_id TYPE text;
ALTER TABLE public.campaigns       ALTER COLUMN id TYPE text;
ALTER TABLE public.calendar_events ALTER COLUMN id TYPE text;
