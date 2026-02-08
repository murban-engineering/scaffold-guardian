-- Add inventory tracking columns for hire batching
ALTER TABLE public.scaffolds
ADD COLUMN IF NOT EXISTS available_qty integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS reserved_qty integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS on_hire_qty integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS dirty_qty integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS damaged_qty integer NOT NULL DEFAULT 0;

UPDATE public.scaffolds
SET available_qty = COALESCE(quantity, 0)
WHERE available_qty = 0;

-- Hire batches per quotation
CREATE TABLE IF NOT EXISTS public.hire_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid NOT NULL REFERENCES public.hire_quotations(id) ON DELETE CASCADE,
  batch_no integer NOT NULL,
  status text NOT NULL DEFAULT 'Draft',
  notes text,
  loaded_by text,
  delivered_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  loaded_at timestamptz,
  delivered_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS hire_batches_quotation_batch_no_key
  ON public.hire_batches (quotation_id, batch_no);

-- Hire batch items (per line item)
CREATE TABLE IF NOT EXISTS public.hire_batch_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.hire_batches(id) ON DELETE CASCADE,
  quotation_line_item_id uuid NOT NULL REFERENCES public.quotation_line_items(id) ON DELETE CASCADE,
  qty_loaded integer NOT NULL DEFAULT 0,
  qty_delivered integer NOT NULL DEFAULT 0,
  delivered_at date
);

CREATE UNIQUE INDEX IF NOT EXISTS hire_batch_items_batch_line_item_key
  ON public.hire_batch_items (batch_id, quotation_line_item_id);

ALTER TABLE public.hire_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hire_batch_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view hire batches"
  ON public.hire_batches FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Elevated users can manage hire batches"
  ON public.hire_batches FOR ALL
  TO authenticated
  USING (public.has_elevated_role(auth.uid()));

CREATE POLICY "Authenticated users can view hire batch items"
  ON public.hire_batch_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Elevated users can manage hire batch items"
  ON public.hire_batch_items FOR ALL
  TO authenticated
  USING (public.has_elevated_role(auth.uid()));

-- Inventory reservation functions
CREATE OR REPLACE FUNCTION public.reserve_scaffold_inventory(
  scaffold_id uuid,
  reserve_qty integer
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_available integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT available_qty
  INTO current_available
  FROM public.scaffolds
  WHERE id = scaffold_id
  FOR UPDATE;

  IF current_available IS NULL THEN
    RAISE EXCEPTION 'Scaffold not found';
  END IF;

  IF reserve_qty <= 0 THEN
    RETURN;
  END IF;

  IF current_available < reserve_qty THEN
    RAISE EXCEPTION 'Insufficient available inventory';
  END IF;

  UPDATE public.scaffolds
  SET available_qty = available_qty - reserve_qty,
      reserved_qty = reserved_qty + reserve_qty,
      updated_at = now()
  WHERE id = scaffold_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_scaffold_inventory(
  scaffold_id uuid,
  release_qty integer
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_reserved integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT reserved_qty
  INTO current_reserved
  FROM public.scaffolds
  WHERE id = scaffold_id
  FOR UPDATE;

  IF current_reserved IS NULL THEN
    RAISE EXCEPTION 'Scaffold not found';
  END IF;

  IF release_qty <= 0 THEN
    RETURN;
  END IF;

  IF current_reserved < release_qty THEN
    RAISE EXCEPTION 'Insufficient reserved inventory';
  END IF;

  UPDATE public.scaffolds
  SET available_qty = available_qty + release_qty,
      reserved_qty = reserved_qty - release_qty,
      updated_at = now()
  WHERE id = scaffold_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.deliver_scaffold_inventory(
  scaffold_id uuid,
  delivered_qty integer,
  return_qty integer DEFAULT 0
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_reserved integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT reserved_qty
  INTO current_reserved
  FROM public.scaffolds
  WHERE id = scaffold_id
  FOR UPDATE;

  IF current_reserved IS NULL THEN
    RAISE EXCEPTION 'Scaffold not found';
  END IF;

  IF delivered_qty < 0 OR return_qty < 0 THEN
    RAISE EXCEPTION 'Quantities must be positive';
  END IF;

  IF current_reserved < (delivered_qty + return_qty) THEN
    RAISE EXCEPTION 'Insufficient reserved inventory';
  END IF;

  UPDATE public.scaffolds
  SET reserved_qty = reserved_qty - (delivered_qty + return_qty),
      on_hire_qty = on_hire_qty + delivered_qty,
      available_qty = available_qty + return_qty,
      updated_at = now()
  WHERE id = scaffold_id;
END;
$$;
