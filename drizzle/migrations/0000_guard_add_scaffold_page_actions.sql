CREATE OR REPLACE FUNCTION public.can_manage_manual_inventory()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(auth.uid() = 'a62550ea-640c-484f-8773-3a03b5c3c16c'::uuid, false);
$$;
REVOKE ALL ON FUNCTION public.can_manage_manual_inventory() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_manage_manual_inventory() TO authenticated;

CREATE OR REPLACE FUNCTION public.add_inventory_from_entry_page(
  p_scaffold_type public.scaffold_type,
  p_status public.scaffold_status,
  p_part_number text,
  p_description text,
  p_quantity integer,
  p_mass_per_item numeric,
  p_weekly_rate numeric,
  p_unit_price numeric
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.can_manage_manual_inventory() THEN
    RAISE EXCEPTION 'Only Angela may add inventory on this page' USING ERRCODE = '42501';
  END IF;
  IF p_quantity IS NULL OR p_quantity < 0 THEN
    RAISE EXCEPTION 'Quantity must be zero or greater';
  END IF;
  RETURN public.upsert_scaffold(p_scaffold_type, p_status, p_part_number, p_description, p_quantity, p_mass_per_item, p_weekly_rate, p_unit_price);
END;
$$;
REVOKE ALL ON FUNCTION public.add_inventory_from_entry_page(public.scaffold_type, public.scaffold_status, text, text, integer, numeric, numeric, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.add_inventory_from_entry_page(public.scaffold_type, public.scaffold_status, text, text, integer, numeric, numeric, numeric) TO authenticated;

CREATE OR REPLACE FUNCTION public.deduct_inventory_from_entry_page(p_scaffold_id uuid, p_quantity integer)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stock public.scaffolds%ROWTYPE;
BEGIN
  IF NOT public.can_manage_manual_inventory() THEN
    RAISE EXCEPTION 'Only Angela may deduct inventory on this page' USING ERRCODE = '42501';
  END IF;
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'Deduction quantity must be greater than zero';
  END IF;
  SELECT * INTO stock FROM public.scaffolds WHERE id = p_scaffold_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inventory item not found';
  END IF;
  IF p_quantity > COALESCE(stock.quantity, 0) THEN
    RAISE EXCEPTION 'Deduction exceeds available inventory';
  END IF;
  UPDATE public.scaffolds
  SET quantity = COALESCE(stock.quantity, 0) - p_quantity,
      qty_at_start = GREATEST(COALESCE(stock.qty_at_start, stock.quantity, 0) - p_quantity, 0),
      updated_at = now()
  WHERE id = p_scaffold_id;
END;
$$;
REVOKE ALL ON FUNCTION public.deduct_inventory_from_entry_page(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.deduct_inventory_from_entry_page(uuid, integer) TO authenticated;