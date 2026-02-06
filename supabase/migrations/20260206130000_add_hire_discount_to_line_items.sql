-- Add hire_discount column to quotation_line_items
ALTER TABLE public.quotation_line_items
ADD COLUMN IF NOT EXISTS hire_discount NUMERIC DEFAULT 0;
