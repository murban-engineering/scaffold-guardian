-- Create hire quotations table for storing quotation headers
CREATE TABLE public.hire_quotations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quotation_number TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  
  -- Client/Company Details
  company_name TEXT,
  company_address TEXT,
  site_name TEXT,
  site_address TEXT,
  
  -- Contact Details
  site_manager_name TEXT,
  site_manager_phone TEXT,
  site_manager_email TEXT,
  
  -- Order Requirements
  official_order_required BOOLEAN DEFAULT false,
  bulk_order_required BOOLEAN DEFAULT false,
  telephonic_order_acceptable BOOLEAN DEFAULT false,
  
  -- Transport
  transport_arrangement TEXT,
  
  -- Discounts (stored as percentages)
  tonnage_discount NUMERIC DEFAULT 0,
  basket_discount NUMERIC DEFAULT 0,
  tube_clamp_discount NUMERIC DEFAULT 0,
  other_discount NUMERIC DEFAULT 0,
  
  -- Project Type
  project_type TEXT[],
  
  -- Market Segment
  market_segment TEXT[],
  
  -- Internal Information
  account_number TEXT,
  payment_method TEXT,
  credit_limit NUMERIC,
  delivery_address TEXT,
  
  -- Calculation
  hire_weeks INTEGER DEFAULT 1,
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quotation line items table for equipment
CREATE TABLE public.quotation_line_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quotation_id UUID NOT NULL REFERENCES public.hire_quotations(id) ON DELETE CASCADE,
  scaffold_id UUID REFERENCES public.scaffolds(id),
  
  -- Item details (copied from scaffold or custom)
  part_number TEXT,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  mass_per_item NUMERIC,
  weekly_rate NUMERIC NOT NULL DEFAULT 0,
  hire_discount NUMERIC DEFAULT 0,
  
  -- Calculated fields stored for reference
  total_mass NUMERIC GENERATED ALWAYS AS (quantity * COALESCE(mass_per_item, 0)) STORED,
  weekly_total NUMERIC GENERATED ALWAYS AS (quantity * weekly_rate) STORED,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hire_quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_line_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hire_quotations
CREATE POLICY "Users can view all quotations" 
ON public.hire_quotations 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create quotations" 
ON public.hire_quotations 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own quotations" 
ON public.hire_quotations 
FOR UPDATE 
USING (auth.uid() = created_by OR has_elevated_role(auth.uid()));

CREATE POLICY "Elevated users can delete quotations" 
ON public.hire_quotations 
FOR DELETE 
USING (has_elevated_role(auth.uid()));

-- RLS Policies for quotation_line_items
CREATE POLICY "Users can view all line items" 
ON public.quotation_line_items 
FOR SELECT 
USING (true);

CREATE POLICY "Users can manage line items for their quotations" 
ON public.quotation_line_items 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.hire_quotations 
    WHERE id = quotation_id 
    AND (created_by = auth.uid() OR has_elevated_role(auth.uid()))
  )
);

-- Create sequence for quotation numbers
CREATE SEQUENCE IF NOT EXISTS quotation_number_seq START 1000;

-- Function to generate quotation number
CREATE OR REPLACE FUNCTION public.generate_quotation_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.quotation_number := 'HQ-' || LPAD(nextval('quotation_number_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger to auto-generate quotation number
CREATE TRIGGER set_quotation_number
BEFORE INSERT ON public.hire_quotations
FOR EACH ROW
WHEN (NEW.quotation_number IS NULL OR NEW.quotation_number = '')
EXECUTE FUNCTION public.generate_quotation_number();

-- Trigger for updated_at
CREATE TRIGGER update_hire_quotations_updated_at
BEFORE UPDATE ON public.hire_quotations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quotation_line_items_updated_at
BEFORE UPDATE ON public.quotation_line_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_hire_quotations_created_by ON public.hire_quotations(created_by);
CREATE INDEX idx_hire_quotations_status ON public.hire_quotations(status);
CREATE INDEX idx_quotation_line_items_quotation_id ON public.quotation_line_items(quotation_id);
