-- Add inventory pricing fields and return billing records
ALTER TABLE public.scaffolds
ADD COLUMN IF NOT EXISTS unit_price numeric,
ADD COLUMN IF NOT EXISTS selling_price numeric;

UPDATE public.scaffolds
SET unit_price = COALESCE(unit_price, weekly_rate)
WHERE weekly_rate IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.hire_return_billings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid NOT NULL REFERENCES public.hire_quotations(id) ON DELETE CASCADE,
  line_item_id uuid REFERENCES public.quotation_line_items(id) ON DELETE SET NULL,
  scaffold_id uuid REFERENCES public.scaffolds(id) ON DELETE SET NULL,
  part_number text,
  description text,
  item_condition text NOT NULL CHECK (item_condition IN ('dirty', 'damaged', 'lost')),
  quantity integer NOT NULL CHECK (quantity >= 0),
  list_hire_price numeric NOT NULL CHECK (list_hire_price >= 0),
  selling_price numeric NOT NULL DEFAULT 0 CHECK (selling_price >= 0),
  charge_multiplier numeric NOT NULL CHECK (charge_multiplier >= 0),
  charge_amount numeric NOT NULL CHECK (charge_amount >= 0),
  billing_month date NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hire_return_billings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can view hire return billings"
    ON public.hire_return_billings FOR SELECT
    TO authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can insert hire return billings"
    ON public.hire_return_billings FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can update hire return billings"
    ON public.hire_return_billings FOR UPDATE
    TO authenticated
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can delete hire return billings"
    ON public.hire_return_billings FOR DELETE
    TO authenticated
    USING (auth.uid() IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DROP TRIGGER IF EXISTS update_hire_return_billings_updated_at ON public.hire_return_billings;
CREATE TRIGGER update_hire_return_billings_updated_at
BEFORE UPDATE ON public.hire_return_billings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_hire_return_billings_quotation_id ON public.hire_return_billings(quotation_id);
CREATE INDEX IF NOT EXISTS idx_hire_return_billings_billing_month ON public.hire_return_billings(billing_month);
