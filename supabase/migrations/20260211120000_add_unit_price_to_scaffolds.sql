-- Add unit price in KES to scaffold inventory items
ALTER TABLE public.scaffolds
ADD COLUMN IF NOT EXISTS unit_price numeric;

-- Populate known unit prices by part number
UPDATE public.scaffolds AS s
SET unit_price = v.unit_price
FROM (
  VALUES
    ('140335', 3863.93::numeric),
    ('1105005', 10717.16::numeric),
    ('1105004', 8870.87::numeric),
    ('1105003', 7142.7::numeric),
    ('1105002', 5358.58::numeric),
    ('1105001', 3568.51::numeric),
    ('1105021', 5485.61::numeric),
    ('1105022', 4738.02::numeric),
    ('1105023', 3755.01::numeric),
    ('1105024', 3211.47::numeric),
    ('1105027', 2768.75::numeric),
    ('1105029', 2571.45::numeric),
    ('1105032', 1983.05::numeric),
    ('1105018', 4346.65::numeric),
    ('1105040', 9095.75::numeric),
    ('1105076', 12725.34::numeric),
    ('1105077', 11058.25::numeric),
    ('1105085', 8804.12::numeric),
    ('1105070', 6305.91::numeric),
    ('1105065', 5997.52::numeric),
    ('1105120', 8433.02::numeric),
    ('1105119', 6084.28::numeric),
    ('1105118', 5153.98::numeric),
    ('1105151', 2216.3::numeric),
    ('1105121', 2239.54::numeric),
    ('1105500', 52024.12::numeric),
    ('1105511', 25799.08::numeric),
    ('1105504', 12062.08::numeric),
    ('1105512', 6784.31::numeric),
    ('1105111', 16312.24::numeric),
    ('1105112', 13923.23::numeric),
    ('1905016', 1301.67::numeric),
    ('1905059', 1475.19::numeric),
    ('145341', 637.05::numeric),
    ('2710604', 601.64::numeric),
    ('1905019', 1033.82::numeric),
    ('135301', 1250.32::numeric),
    ('425112', 23366.83::numeric),
    ('425113', 20812.68::numeric),
    ('1520002', 8386.26::numeric),
    ('1520003', 13530.24::numeric),
    ('5105009', 623.13::numeric),
    ('1520006', 22018.13::numeric),
    ('1130016', 4800.18::numeric),
    ('5105007', 4676.39::numeric),
    ('5105008', 7135.94::numeric)
) AS v(part_number, unit_price)
WHERE s.part_number = v.part_number;

-- Update scaffold upsert RPC to support unit price
CREATE OR REPLACE FUNCTION public.upsert_scaffold(
  p_scaffold_type scaffold_type,
  p_status scaffold_status DEFAULT 'available',
  p_part_number text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_quantity integer DEFAULT 0,
  p_mass_per_item numeric DEFAULT NULL,
  p_weekly_rate numeric DEFAULT NULL,
  p_unit_price numeric DEFAULT NULL
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
        unit_price = COALESCE(p_unit_price, unit_price),
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
      unit_price
    ) VALUES (
      p_scaffold_type,
      p_status,
      p_part_number,
      p_description,
      p_quantity,
      p_mass_per_item,
      p_weekly_rate,
      p_unit_price
    )
    RETURNING id INTO result_id;
  END IF;

  RETURN result_id;
END;
$$;
