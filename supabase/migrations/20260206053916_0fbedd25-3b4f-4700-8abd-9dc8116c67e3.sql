-- Drop the existing ALL policy for elevated users
DROP POLICY IF EXISTS "Elevated users can manage scaffolds" ON public.scaffolds;

-- Create separate policies for different operations
-- Allow all authenticated users to INSERT scaffolds
CREATE POLICY "All authenticated users can add scaffolds"
ON public.scaffolds
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Keep elevated users for UPDATE and DELETE
CREATE POLICY "Elevated users can update scaffolds"
ON public.scaffolds
FOR UPDATE
USING (has_elevated_role(auth.uid()));

CREATE POLICY "Elevated users can delete scaffolds"
ON public.scaffolds
FOR DELETE
USING (has_elevated_role(auth.uid()));