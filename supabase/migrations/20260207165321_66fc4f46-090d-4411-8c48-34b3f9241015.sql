-- Add balance_quantity and delivered_quantity columns to quotation_line_items
ALTER TABLE public.quotation_line_items 
ADD COLUMN IF NOT EXISTS delivered_quantity integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS balance_quantity integer DEFAULT 0;

-- Update existing rows to set balance_quantity = quantity (initial state)
UPDATE public.quotation_line_items 
SET balance_quantity = quantity, delivered_quantity = 0 
WHERE balance_quantity IS NULL OR balance_quantity = 0;

-- Allow admins to view all profiles (currently users can only view their own)
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'::app_role));