-- Allow all authenticated users to insert affiliate names (restore previous behavior)
DROP POLICY IF EXISTS "Only admins can insert affiliate names" ON public.affiliate_names;

CREATE POLICY "Authenticated users can insert affiliate names"
ON public.affiliate_names
FOR INSERT
TO authenticated
WITH CHECK (true);