-- Add columns to scaffolds table for price list data
ALTER TABLE public.scaffolds 
ADD COLUMN IF NOT EXISTS part_number text,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS quantity integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS mass_per_item numeric,
ADD COLUMN IF NOT EXISTS weekly_rate numeric;

-- Create index on part_number for quick lookups
CREATE INDEX IF NOT EXISTS idx_scaffolds_part_number ON public.scaffolds(part_number);