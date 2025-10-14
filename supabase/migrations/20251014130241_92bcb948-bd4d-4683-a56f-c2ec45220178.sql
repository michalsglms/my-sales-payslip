-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'sales_rep');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
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

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can update roles"
ON public.user_roles
FOR UPDATE
USING (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
USING (public.is_admin(auth.uid()));

-- Create monthly_kpis table
CREATE TABLE public.monthly_kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_rep_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  avg_call_time_minutes BOOLEAN DEFAULT false,
  avg_calls_count BOOLEAN DEFAULT false,
  ppc_conversion_rate BOOLEAN DEFAULT false,
  aff_conversion_rate BOOLEAN DEFAULT false,
  work_excellence BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (sales_rep_id, month, year)
);

-- Enable RLS
ALTER TABLE public.monthly_kpis ENABLE ROW LEVEL SECURITY;

-- RLS policies for monthly_kpis
CREATE POLICY "Users can view own KPIS"
ON public.monthly_kpis
FOR SELECT
USING (auth.uid() = sales_rep_id OR public.is_admin(auth.uid()));

CREATE POLICY "Only admins can insert KPIS"
ON public.monthly_kpis
FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can update KPIS"
ON public.monthly_kpis
FOR UPDATE
USING (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can delete KPIS"
ON public.monthly_kpis
FOR DELETE
USING (public.is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_monthly_kpis_updated_at
BEFORE UPDATE ON public.monthly_kpis
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Assign admin role to mici2740@gmail.com
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'mici2740@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Assign sales_rep role to all other users
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'sales_rep'::app_role
FROM auth.users
WHERE email != 'mici2740@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;