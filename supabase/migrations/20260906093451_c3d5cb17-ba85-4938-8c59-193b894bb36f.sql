UPDATE public.quotation_line_items
SET part_number = '0145341', updated_at = now()
WHERE part_number = '145341';

UPDATE public.hire_quotations q
SET delivery_history = (
  SELECT jsonb_agg(
    CASE WHEN b ? 'items' THEN jsonb_set(b, '{items}', (
      SELECT jsonb_agg(
        CASE WHEN i->>'itemCode' = '1105076' THEN jsonb_set(i, '{itemCode}', '"1105076A"'::jsonb) ELSE i END
      ) FROM jsonb_array_elements(b->'items') i
    )) ELSE b END ORDER BY ord
  )
  FROM jsonb_array_elements(q.delivery_history) WITH ORDINALITY t(b, ord)
),
updated_at = now()
WHERE q.quotation_number = 'HSQ-000122'
  AND q.delivery_history IS NOT NULL;