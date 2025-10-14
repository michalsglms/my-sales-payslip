-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all monthly targets" ON public.monthly_targets;
DROP POLICY IF EXISTS "Admins can view all quarterly targets" ON public.quarterly_targets;

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Allow admins to view all monthly targets
CREATE POLICY "Admins can view all monthly targets" 
ON public.monthly_targets
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Allow admins to view all quarterly targets
CREATE POLICY "Admins can view all quarterly targets" 
ON public.quarterly_targets
FOR SELECT
USING (public.is_admin(auth.uid()));