
ALTER TABLE public.hire_quotations
  ADD COLUMN IF NOT EXISTS city_town TEXT,
  ADD COLUMN IF NOT EXISTS pin_number TEXT,
  ADD COLUMN IF NOT EXISTS company_reg_number TEXT,
  ADD COLUMN IF NOT EXISTS company_tel TEXT,
  ADD COLUMN IF NOT EXISTS company_fax TEXT;
