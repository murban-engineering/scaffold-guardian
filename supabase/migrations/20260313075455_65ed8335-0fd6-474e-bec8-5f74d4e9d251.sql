
-- Update both overloads of upsert_scaffold to set qty_at_start on INSERT

CREATE OR REPLACE FUNCTION public.upsert_scaffold(
  p_scaffold_type scaffold_type,
  p_status scaffold_status DEFAULT 'available'::scaffold_status,
  p_part_number text DEFAULT NULL::text,
  p_description text DEFAULT NULL::text,
  p_quantity integer DEFAULT 0,
  p_mass_per_item numeric DEFAULT NULL::numeric,
  p_weekly_rate numeric DEFAULT NULL::numeric
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  existing_id uuid;
  result_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_part_number IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext('scaffold_upsert_' || p_part_number));
    SELECT id INTO existing_id FROM scaffolds WHERE part_number = p_part_number LIMIT 1;
  END IF;

  IF existing_id IS NOT NULL THEN
    UPDATE scaffolds
    SET quantity = COALESCE(quantity, 0) + p_quantity,
        updated_at = now()
    WHERE id = existing_id
    RETURNING id INTO result_id;
  ELSE
    INSERT INTO scaffolds (
      scaffold_type, status, part_number, description,
      quantity, qty_at_start, mass_per_item, weekly_rate
    ) VALUES (
      p_scaffold_type, p_status, p_part_number, p_description,
      p_quantity, p_quantity, p_mass_per_item, p_weekly_rate
    )
    RETURNING id INTO result_id;
  END IF;

  RETURN result_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.upsert_scaffold(
  p_scaffold_type scaffold_type,
  p_status scaffold_status DEFAULT 'available'::scaffold_status,
  p_part_number text DEFAULT NULL::text,
  p_description text DEFAULT NULL::text,
  p_quantity integer DEFAULT 0,
  p_mass_per_item numeric DEFAULT NULL::numeric,
  p_weekly_rate numeric DEFAULT NULL::numeric,
  p_unit_price numeric DEFAULT NULL::numeric
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  existing_id uuid;
  result_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_part_number IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext('scaffold_upsert_' || p_part_number));
    SELECT id INTO existing_id FROM scaffolds WHERE part_number = p_part_number LIMIT 1;
  END IF;

  IF existing_id IS NOT NULL THEN
    UPDATE scaffolds
    SET quantity = COALESCE(quantity, 0) + p_quantity,
        unit_price = COALESCE(p_unit_price, unit_price),
        updated_at = now()
    WHERE id = existing_id
    RETURNING id INTO result_id;
  ELSE
    INSERT INTO scaffolds (
      scaffold_type, status, part_number, description,
      quantity, qty_at_start, mass_per_item, weekly_rate, unit_price
    ) VALUES (
      p_scaffold_type, p_status, p_part_number, p_description,
      p_quantity, p_quantity, p_mass_per_item, p_weekly_rate, p_unit_price
    )
    RETURNING id INTO result_id;
  END IF;

  RETURN result_id;
END;
$function$;
