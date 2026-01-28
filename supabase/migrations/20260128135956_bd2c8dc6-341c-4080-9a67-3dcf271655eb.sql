-- Create enum types
CREATE TYPE public.scaffold_status AS ENUM ('available', 'in_use', 'damaged', 'maintenance');
CREATE TYPE public.scaffold_type AS ENUM ('frame', 'tube_coupler', 'mobile', 'suspended', 'cantilever', 'system');
CREATE TYPE public.site_status AS ENUM ('active', 'on_hold', 'completed', 'planning');
CREATE TYPE public.inspection_status AS ENUM ('passed', 'pending', 'failed');
CREATE TYPE public.maintenance_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE public.app_role AS ENUM ('admin', 'supervisor', 'inspector', 'worker');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'worker',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create sites table
CREATE TABLE public.sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  address TEXT,
  status site_status NOT NULL DEFAULT 'planning',
  start_date DATE,
  end_date DATE,
  supervisor_id UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create scaffolds table
CREATE TABLE public.scaffolds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scaffold_type scaffold_type NOT NULL,
  status scaffold_status NOT NULL DEFAULT 'available',
  serial_number TEXT UNIQUE,
  qr_code TEXT UNIQUE,
  site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL,
  manufacturer TEXT,
  purchase_date DATE,
  last_inspection_date DATE,
  next_inspection_due DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create inspections table
CREATE TABLE public.inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE NOT NULL,
  inspector_id UUID REFERENCES auth.users(id) NOT NULL,
  inspection_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  status inspection_status NOT NULL DEFAULT 'pending',
  scaffold_count INTEGER NOT NULL DEFAULT 0,
  checklist JSONB,
  findings TEXT,
  recommendations TEXT,
  photos TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create maintenance_logs table
CREATE TABLE public.maintenance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scaffold_id UUID REFERENCES public.scaffolds(id) ON DELETE CASCADE NOT NULL,
  reported_by UUID REFERENCES auth.users(id) NOT NULL,
  assigned_to UUID REFERENCES auth.users(id),
  priority maintenance_priority NOT NULL DEFAULT 'medium',
  issue_description TEXT NOT NULL,
  resolution TEXT,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create alerts table
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  is_read BOOLEAN NOT NULL DEFAULT false,
  user_id UUID REFERENCES auth.users(id),
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scaffolds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user has any elevated role
CREATE OR REPLACE FUNCTION public.has_elevated_role(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'supervisor', 'inspector')
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- User roles policies (only admins can manage roles)
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Sites policies
CREATE POLICY "All authenticated users can view sites"
  ON public.sites FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and supervisors can manage sites"
  ON public.sites FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'supervisor'));

-- Scaffolds policies
CREATE POLICY "All authenticated users can view scaffolds"
  ON public.scaffolds FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Elevated users can manage scaffolds"
  ON public.scaffolds FOR ALL
  TO authenticated
  USING (public.has_elevated_role(auth.uid()));

-- Inspections policies
CREATE POLICY "All authenticated users can view inspections"
  ON public.inspections FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Inspectors and admins can create inspections"
  ON public.inspections FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'inspector') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Inspectors can update their own inspections"
  ON public.inspections FOR UPDATE
  TO authenticated
  USING (auth.uid() = inspector_id OR public.has_role(auth.uid(), 'admin'));

-- Maintenance logs policies
CREATE POLICY "All authenticated users can view maintenance logs"
  ON public.maintenance_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All authenticated users can report issues"
  ON public.maintenance_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "Assigned users and admins can update logs"
  ON public.maintenance_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = assigned_to OR public.has_role(auth.uid(), 'admin'));

-- Alerts policies
CREATE POLICY "Users can view their alerts or site alerts"
  ON public.alerts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Elevated users can create alerts"
  ON public.alerts FOR INSERT
  TO authenticated
  WITH CHECK (public.has_elevated_role(auth.uid()));

CREATE POLICY "Users can mark their alerts as read"
  ON public.alerts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sites_updated_at
  BEFORE UPDATE ON public.sites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scaffolds_updated_at
  BEFORE UPDATE ON public.scaffolds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inspections_updated_at
  BEFORE UPDATE ON public.inspections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_maintenance_logs_updated_at
  BEFORE UPDATE ON public.maintenance_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'), NEW.email);
  
  -- Assign default 'worker' role to new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'worker');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();