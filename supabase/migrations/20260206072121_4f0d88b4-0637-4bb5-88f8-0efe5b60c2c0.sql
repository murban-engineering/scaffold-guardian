-- Update the quotation number generator to use HSQ prefix
CREATE OR REPLACE FUNCTION public.generate_quotation_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.quotation_number := 'HSQ-' || LPAD(nextval('quotation_number_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$function$;