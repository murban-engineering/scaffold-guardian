CREATE OR REPLACE FUNCTION public.upsert_scaffold(
  p_scaffold_type scaffold_type,
  p_status scaffold_status DEFAULT 'available',
  p_part_number text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_quantity integer DEFAULT 0,
  p_mass_per_item numeric DEFAULT NULL,
  p_weekly_rate numeric DEFAULT NULL,
  p_unit_price numeric DEFAULT NULL,
  p_selling_price numeric DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_id uuid;
  result_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_part_number IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext('scaffold_upsert_' || p_part_number));

    SELECT id INTO existing_id
    FROM scaffolds
    WHERE part_number = p_part_number
    LIMIT 1;
  END IF;

  IF existing_id IS NOT NULL THEN
    UPDATE scaffolds
    SET quantity = COALESCE(quantity, 0) + p_quantity,
        mass_per_item = COALESCE(p_mass_per_item, mass_per_item),
        weekly_rate = COALESCE(p_weekly_rate, weekly_rate),
        unit_price = COALESCE(p_unit_price, p_weekly_rate, unit_price),
        selling_price = COALESCE(p_selling_price, selling_price),
        description = COALESCE(NULLIF(p_description, ''), description),
        status = COALESCE(p_status, status),
        updated_at = now()
    WHERE id = existing_id
    RETURNING id INTO result_id;
  ELSE
    INSERT INTO scaffolds (
      scaffold_type,
      status,
      part_number,
      description,
      quantity,
      mass_per_item,
      weekly_rate,
      unit_price,
      selling_price
    ) VALUES (
      p_scaffold_type,
      p_status,
      p_part_number,
      p_description,
      p_quantity,
      p_mass_per_item,
      p_weekly_rate,
      COALESCE(p_unit_price, p_weekly_rate),
      p_selling_price
    )
    RETURNING id INTO result_id;
  END IF;

  RETURN result_id;
END;
$$;
