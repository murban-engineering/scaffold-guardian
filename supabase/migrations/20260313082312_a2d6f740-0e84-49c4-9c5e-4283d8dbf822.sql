-- Reinforce that update_scaffold_quantity NEVER touches qty_at_start
-- qty_at_start is the immutable baseline; only quantity (available) changes on hire/deduction
CREATE OR REPLACE FUNCTION public.update_scaffold_quantity(scaffold_id uuid, new_quantity integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  -- ONLY update quantity (available stock), NEVER qty_at_start
  UPDATE scaffolds
  SET quantity = new_quantity,
      updated_at = now()
  WHERE id = scaffold_id;
END;
$function$;

-- Dedicated safe function for manual stock removal (AddScaffold "remove" path)
-- Also only touches quantity, never qty_at_start
CREATE OR REPLACE FUNCTION public.adjust_scaffold_quantity(p_scaffold_id uuid, p_new_quantity integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  UPDATE scaffolds
  SET quantity = p_new_quantity,
      updated_at = now()
  WHERE id = p_scaffold_id;
END;
$function$;