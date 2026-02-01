-- Allow any authenticated user to update scaffold quantities for inventory management
CREATE POLICY "Authenticated users can update scaffold quantities"
ON public.scaffolds
FOR UPDATE
USING (true)
WITH CHECK (true);