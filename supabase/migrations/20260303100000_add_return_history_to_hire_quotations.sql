ALTER TABLE public.hire_quotations
ADD COLUMN IF NOT EXISTS return_history jsonb NOT NULL DEFAULT '[]'::jsonb;
