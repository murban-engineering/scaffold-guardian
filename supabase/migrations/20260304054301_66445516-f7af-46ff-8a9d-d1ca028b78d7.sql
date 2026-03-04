
-- Add delivery_history and return_history JSONB columns to hire_quotations
ALTER TABLE public.hire_quotations 
  ADD COLUMN IF NOT EXISTS delivery_history jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS return_history jsonb DEFAULT '[]'::jsonb;
