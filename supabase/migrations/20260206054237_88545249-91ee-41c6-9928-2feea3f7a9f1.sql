-- =====================
-- SCAFFOLDS: Full access for all authenticated users
-- =====================
DROP POLICY IF EXISTS "Elevated users can update scaffolds" ON public.scaffolds;
DROP POLICY IF EXISTS "Elevated users can delete scaffolds" ON public.scaffolds;

CREATE POLICY "All authenticated users can update scaffolds"
ON public.scaffolds
FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "All authenticated users can delete scaffolds"
ON public.scaffolds
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- =====================
-- SITES: Full access for all authenticated users
-- =====================
DROP POLICY IF EXISTS "Admins and supervisors can manage sites" ON public.sites;

CREATE POLICY "All authenticated users can insert sites"
ON public.sites
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "All authenticated users can update sites"
ON public.sites
FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "All authenticated users can delete sites"
ON public.sites
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- =====================
-- INSPECTIONS: Full access for all authenticated users
-- =====================
DROP POLICY IF EXISTS "Inspectors and admins can create inspections" ON public.inspections;
DROP POLICY IF EXISTS "Inspectors can update their own inspections" ON public.inspections;

CREATE POLICY "All authenticated users can create inspections"
ON public.inspections
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "All authenticated users can update inspections"
ON public.inspections
FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "All authenticated users can delete inspections"
ON public.inspections
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- =====================
-- MAINTENANCE_LOGS: Full access for all authenticated users
-- =====================
DROP POLICY IF EXISTS "All authenticated users can report issues" ON public.maintenance_logs;
DROP POLICY IF EXISTS "Assigned users and admins can update logs" ON public.maintenance_logs;

CREATE POLICY "All authenticated users can insert maintenance logs"
ON public.maintenance_logs
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "All authenticated users can update maintenance logs"
ON public.maintenance_logs
FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "All authenticated users can delete maintenance logs"
ON public.maintenance_logs
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- =====================
-- HIRE_QUOTATIONS: Full access for all authenticated users
-- =====================
DROP POLICY IF EXISTS "Authenticated users can create quotations" ON public.hire_quotations;
DROP POLICY IF EXISTS "Users can update their own quotations" ON public.hire_quotations;
DROP POLICY IF EXISTS "Elevated users can delete quotations" ON public.hire_quotations;

CREATE POLICY "All authenticated users can create quotations"
ON public.hire_quotations
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "All authenticated users can update quotations"
ON public.hire_quotations
FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "All authenticated users can delete quotations"
ON public.hire_quotations
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- =====================
-- QUOTATION_LINE_ITEMS: Full access for all authenticated users
-- =====================
DROP POLICY IF EXISTS "Users can manage line items for their quotations" ON public.quotation_line_items;

CREATE POLICY "All authenticated users can manage line items"
ON public.quotation_line_items
FOR ALL
USING (auth.uid() IS NOT NULL);

-- =====================
-- ALERTS: Full access for all authenticated users
-- =====================
DROP POLICY IF EXISTS "Users can view their alerts or site alerts" ON public.alerts;
DROP POLICY IF EXISTS "Elevated users can create alerts" ON public.alerts;
DROP POLICY IF EXISTS "Users can mark their alerts as read" ON public.alerts;

CREATE POLICY "All authenticated users can view alerts"
ON public.alerts
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "All authenticated users can create alerts"
ON public.alerts
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "All authenticated users can update alerts"
ON public.alerts
FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "All authenticated users can delete alerts"
ON public.alerts
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- =====================
-- PROFILES: Restrict to own profile only (prevents viewing other workers)
-- =====================
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile only"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);