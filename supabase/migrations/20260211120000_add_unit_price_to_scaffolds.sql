-- Add unit price in KES to scaffold inventory items
ALTER TABLE public.scaffolds
ADD COLUMN IF NOT EXISTS unit_price numeric;

-- Populate known unit prices by part number
UPDATE public.scaffolds AS s
SET unit_price = v.unit_price
FROM (
  VALUES
    ('1105001', 1133::numeric),
    ('1105002', 1877::numeric),
    ('1105003', 2270::numeric),
    ('1105004', 2798::numeric),
    ('1105005', 3405::numeric),
    ('1105027', 909::numeric),
    ('1105024', 1040::numeric),
    ('1105023', 1206::numeric),
    ('1105022', 1516::numeric),
    ('1105021', 1725::numeric),
    ('145341', 293::numeric),
    ('140335', 1880::numeric),
    ('1105070', 2997::numeric),
    ('1105085', 2657::numeric),
    ('1105077', 3262::numeric),
    ('1105076', 3820::numeric),
    ('1105135', 2341::numeric),
    ('1105118', 1523::numeric),
    ('1105119', 1831::numeric),
    ('1105120', 2546::numeric),
    ('1105152', 3005::numeric),
    ('1105504', 3879::numeric),
    ('1805054', 314::numeric),
    ('1905008', 495::numeric),
    ('1905099', 596::numeric),
    ('1905095', 3309::numeric),
    ('1905016', 598::numeric),
    ('2710801', 905::numeric),
    ('2710804', 840::numeric),
    ('1105032', 672::numeric),
    ('1905017', 685::numeric)
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
