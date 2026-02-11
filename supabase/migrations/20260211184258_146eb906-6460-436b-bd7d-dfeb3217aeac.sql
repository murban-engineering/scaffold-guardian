-- Add unit_price column to scaffolds table
ALTER TABLE public.scaffolds ADD COLUMN unit_price numeric DEFAULT NULL;