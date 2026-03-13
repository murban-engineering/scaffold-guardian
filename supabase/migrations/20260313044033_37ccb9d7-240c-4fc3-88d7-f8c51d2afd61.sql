
-- Create invoice number sequence starting at 1
CREATE SEQUENCE IF NOT EXISTS public.invoice_number_seq START WITH 1 INCREMENT BY 1;

-- Add invoice_number column to hire_quotations
ALTER TABLE public.hire_quotations
  ADD COLUMN IF NOT EXISTS invoice_number text;

-- Trigger function to auto-generate invoice_number on insert
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := 'INV-' || LPAD(nextval('public.invoice_number_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$;

-- Attach trigger
DROP TRIGGER IF EXISTS trg_generate_invoice_number ON public.hire_quotations;
CREATE TRIGGER trg_generate_invoice_number
  BEFORE INSERT ON public.hire_quotations
  FOR EACH ROW EXECUTE FUNCTION public.generate_invoice_number();

-- Back-fill existing rows that have no invoice_number yet, ordered by created_at
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT id FROM public.hire_quotations
    WHERE invoice_number IS NULL OR invoice_number = ''
    ORDER BY created_at ASC
  LOOP
    UPDATE public.hire_quotations
    SET invoice_number = 'INV-' || LPAD(nextval('public.invoice_number_seq')::TEXT, 5, '0')
    WHERE id = r.id;
  END LOOP;
END;
$$;
