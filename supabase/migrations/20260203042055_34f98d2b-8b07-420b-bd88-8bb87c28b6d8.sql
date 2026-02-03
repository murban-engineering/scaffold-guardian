-- First drop the generated column
ALTER TABLE public.quotation_line_items DROP COLUMN total_mass;

-- Now alter mass_per_item to support decimals
ALTER TABLE public.quotation_line_items 
ALTER COLUMN mass_per_item TYPE numeric(10, 2);

-- Recreate total_mass as a generated column with decimal support
ALTER TABLE public.quotation_line_items 
ADD COLUMN total_mass numeric(10, 2) GENERATED ALWAYS AS (quantity * mass_per_item) STORED;

-- Update scaffolds table
ALTER TABLE public.scaffolds 
ALTER COLUMN mass_per_item TYPE numeric(10, 2);