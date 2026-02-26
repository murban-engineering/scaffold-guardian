-- Allow authenticated users to manage line items on shared test quotations (CL-*)
-- while retaining owner/elevated-role controls for standard quotations.
DROP POLICY IF EXISTS "Users can manage line items for their quotations" ON public.quotation_line_items;

CREATE POLICY "Users can manage line items for quotations"
ON public.quotation_line_items
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.hire_quotations hq
    WHERE hq.id = quotation_id
      AND (
        hq.quotation_number LIKE 'CL-%'
        OR hq.created_by = auth.uid()
        OR has_elevated_role(auth.uid())
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.hire_quotations hq
    WHERE hq.id = quotation_id
      AND (
        hq.quotation_number LIKE 'CL-%'
        OR hq.created_by = auth.uid()
        OR has_elevated_role(auth.uid())
      )
  )
);
