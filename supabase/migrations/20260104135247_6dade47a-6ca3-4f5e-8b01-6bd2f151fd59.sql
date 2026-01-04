-- Fix affiliate_names table RLS policies
-- Drop the overly permissive insert policy
DROP POLICY IF EXISTS "Users can insert affiliate names" ON public.affiliate_names;

-- Create admin-only insert policy
CREATE POLICY "Only admins can insert affiliate names"
ON public.affiliate_names
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- Add admin-only update policy (was missing)
CREATE POLICY "Only admins can update affiliate names"
ON public.affiliate_names
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Add admin-only delete policy (was missing)
CREATE POLICY "Only admins can delete affiliate names"
ON public.affiliate_names
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));