-- Add returned_quantity column to track cumulative returns per line item
ALTER TABLE public.quotation_line_items
ADD COLUMN returned_quantity integer DEFAULT 0;

-- Add return_balance_quantity to track remaining items to return
ALTER TABLE public.quotation_line_items
ADD COLUMN return_balance_quantity integer DEFAULT 0;