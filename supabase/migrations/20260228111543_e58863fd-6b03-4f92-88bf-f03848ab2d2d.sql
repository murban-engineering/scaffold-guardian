
-- Modify the trigger to only generate HSQ number when quotation_number is empty
CREATE OR REPLACE FUNCTION public.generate_quotation_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only auto-generate if quotation_number is not already set
  IF NEW.quotation_number IS NULL OR NEW.quotation_number = '' THEN
    NEW.quotation_number := 'HSQ-' || LPAD(nextval('quotation_number_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$function$
