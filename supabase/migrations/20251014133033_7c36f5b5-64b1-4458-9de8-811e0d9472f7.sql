-- Enhanced RLS policies for the deals table to prevent unauthorized access
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own deals" ON public.deals;
DROP POLICY IF EXISTS "Users can insert own deals" ON public.deals;
DROP POLICY IF EXISTS "Users can update own deals" ON public.deals;
DROP POLICY IF EXISTS "Users can delete own deals" ON public.deals;

-- Create enhanced policies that prevent enumeration attacks
-- SELECT policy: Users can ONLY view their own deals or admin can view all
CREATE POLICY "Enhanced: Users can view own deals only"
ON public.deals
FOR SELECT
USING (
  auth.uid() = sales_rep_id 
  OR public.is_admin(auth.uid())
);

-- INSERT policy: Users can ONLY insert deals with their own ID
CREATE POLICY "Enhanced: Users can insert own deals only"
ON public.deals
FOR INSERT
WITH CHECK (
  auth.uid() = sales_rep_id
  OR public.is_admin(auth.uid())
);

-- UPDATE policy: Users can ONLY update their own deals
CREATE POLICY "Enhanced: Users can update own deals only"
ON public.deals
FOR UPDATE
USING (
  auth.uid() = sales_rep_id
  OR public.is_admin(auth.uid())
)
WITH CHECK (
  auth.uid() = sales_rep_id
  OR public.is_admin(auth.uid())
);

-- DELETE policy: Users can ONLY delete their own deals
CREATE POLICY "Enhanced: Users can delete own deals only"
ON public.deals
FOR DELETE
USING (
  auth.uid() = sales_rep_id
  OR public.is_admin(auth.uid())
);

-- Add comment explaining the security measures
COMMENT ON TABLE public.deals IS 'Contains sensitive client data. RLS policies ensure users can only access their own deals or admins can access all. This prevents enumeration attacks and unauthorized access to competitor client lists.';