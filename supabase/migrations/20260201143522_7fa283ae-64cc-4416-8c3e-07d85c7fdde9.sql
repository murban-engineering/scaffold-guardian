-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can update scaffold quantities" ON public.scaffolds;

-- Create a secure function to update scaffold quantity
CREATE OR REPLACE FUNCTION public.update_scaffold_quantity(scaffold_id uuid, new_quantity integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only authenticated users can call this
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Only update quantity, nothing else
  UPDATE scaffolds 
  SET quantity = new_quantity, updated_at = now()
  WHERE id = scaffold_id;
END;
$$;