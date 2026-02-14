
-- Create client_sites table for Site Master Plan
CREATE TABLE public.client_sites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quotation_id UUID NOT NULL REFERENCES public.hire_quotations(id) ON DELETE CASCADE,
  site_number TEXT NOT NULL, -- e.g., NK-0001, NK-0001-A, NK-0001-B
  site_suffix TEXT DEFAULT '', -- '', 'A', 'B', 'C' etc.
  site_name TEXT NOT NULL,
  site_location TEXT,
  site_address TEXT,
  site_manager_name TEXT,
  site_manager_phone TEXT,
  site_manager_email TEXT,
  site_opened_by TEXT,
  site_open_date DATE,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_sites ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view all client sites"
ON public.client_sites FOR SELECT USING (true);

CREATE POLICY "All authenticated users can manage client sites"
ON public.client_sites FOR ALL USING (auth.uid() IS NOT NULL);

-- Index for faster lookups
CREATE INDEX idx_client_sites_quotation_id ON public.client_sites(quotation_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.client_sites;
