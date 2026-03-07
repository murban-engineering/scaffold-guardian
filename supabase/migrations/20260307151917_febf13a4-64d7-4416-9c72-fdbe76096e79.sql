
-- Add a dedicated client_id column to hire_quotations to store independent CL- IDs
ALTER TABLE public.hire_quotations
  ADD COLUMN IF NOT EXISTS client_id TEXT;

-- Create a sequence for client IDs starting after CL-001005
CREATE SEQUENCE IF NOT EXISTS public.client_id_seq START WITH 1006 INCREMENT BY 1;

-- Create a function to generate the next CL- ID
CREATE OR REPLACE FUNCTION public.generate_next_client_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_val BIGINT;
BEGIN
  next_val := nextval('public.client_id_seq');
  RETURN 'CL-' || LPAD(next_val::TEXT, 6, '0');
END;
$$;

-- Index for fast client_id lookups
CREATE INDEX IF NOT EXISTS idx_hire_quotations_client_id ON public.hire_quotations (client_id);
