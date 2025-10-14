-- Allow admins to view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (is_admin(auth.uid()));

-- Allow admins to view all monthly KPIs
DROP POLICY IF EXISTS "Admins can view all monthly KPIs" ON public.monthly_kpis;
CREATE POLICY "Admins can view all monthly KPIs"
ON public.monthly_kpis
FOR SELECT
USING (is_admin(auth.uid()));