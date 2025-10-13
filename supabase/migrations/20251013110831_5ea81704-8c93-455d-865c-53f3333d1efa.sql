-- Create profiles table for sales representatives
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  base_salary DECIMAL(10, 2) NOT NULL DEFAULT 9000.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can only view and update their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create deals table for tracking transactions
CREATE TABLE public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_rep_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_type TEXT NOT NULL CHECK (client_type IN ('EQ', 'CFD')),
  traffic_source TEXT NOT NULL CHECK (traffic_source IN ('AFF', 'RFF', 'PPC', 'ORG')),
  initial_deposit DECIMAL(10, 2) NOT NULL,
  is_new_client BOOLEAN NOT NULL DEFAULT true,
  completed_within_4_days BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- Users can only access their own deals
CREATE POLICY "Users can view own deals"
  ON public.deals FOR SELECT
  USING (auth.uid() = sales_rep_id);

CREATE POLICY "Users can insert own deals"
  ON public.deals FOR INSERT
  WITH CHECK (auth.uid() = sales_rep_id);

CREATE POLICY "Users can update own deals"
  ON public.deals FOR UPDATE
  USING (auth.uid() = sales_rep_id);

CREATE POLICY "Users can delete own deals"
  ON public.deals FOR DELETE
  USING (auth.uid() = sales_rep_id);

-- Create monthly targets table
CREATE TABLE public.monthly_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_rep_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  target_amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(sales_rep_id, month, year)
);

-- Enable RLS
ALTER TABLE public.monthly_targets ENABLE ROW LEVEL SECURITY;

-- Users can manage their own targets
CREATE POLICY "Users can view own monthly targets"
  ON public.monthly_targets FOR SELECT
  USING (auth.uid() = sales_rep_id);

CREATE POLICY "Users can insert own monthly targets"
  ON public.monthly_targets FOR INSERT
  WITH CHECK (auth.uid() = sales_rep_id);

CREATE POLICY "Users can update own monthly targets"
  ON public.monthly_targets FOR UPDATE
  USING (auth.uid() = sales_rep_id);

CREATE POLICY "Users can delete own monthly targets"
  ON public.monthly_targets FOR DELETE
  USING (auth.uid() = sales_rep_id);

-- Create quarterly targets table
CREATE TABLE public.quarterly_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_rep_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quarter INTEGER NOT NULL CHECK (quarter >= 1 AND quarter <= 4),
  year INTEGER NOT NULL,
  target_amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(sales_rep_id, quarter, year)
);

-- Enable RLS
ALTER TABLE public.quarterly_targets ENABLE ROW LEVEL SECURITY;

-- Users can manage their own quarterly targets
CREATE POLICY "Users can view own quarterly targets"
  ON public.quarterly_targets FOR SELECT
  USING (auth.uid() = sales_rep_id);

CREATE POLICY "Users can insert own quarterly targets"
  ON public.quarterly_targets FOR INSERT
  WITH CHECK (auth.uid() = sales_rep_id);

CREATE POLICY "Users can update own quarterly targets"
  ON public.quarterly_targets FOR UPDATE
  USING (auth.uid() = sales_rep_id);

CREATE POLICY "Users can delete own quarterly targets"
  ON public.quarterly_targets FOR DELETE
  USING (auth.uid() = sales_rep_id);

-- Create trigger function for updating updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profiles table
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, base_salary)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Sales Representative'),
    9000.00
  );
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();