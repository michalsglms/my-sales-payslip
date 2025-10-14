-- Add deduction_amount column to profiles table
ALTER TABLE public.profiles
ADD COLUMN deduction_amount numeric DEFAULT 0.00 NOT NULL;