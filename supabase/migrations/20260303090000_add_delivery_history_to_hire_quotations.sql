ALTER TABLE public.hire_quotations
ADD COLUMN IF NOT EXISTS delivery_history jsonb NOT NULL DEFAULT '[]'::jsonb;

