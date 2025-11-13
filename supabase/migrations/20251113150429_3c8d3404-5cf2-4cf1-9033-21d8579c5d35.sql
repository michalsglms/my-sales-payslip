-- Create affiliate_names table to store reusable affiliate names
CREATE TABLE public.affiliate_names (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.affiliate_names ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view affiliate names
CREATE POLICY "Users can view all affiliate names"
ON public.affiliate_names
FOR SELECT
TO authenticated
USING (true);

-- Allow all authenticated users to insert new affiliate names
CREATE POLICY "Users can insert affiliate names"
ON public.affiliate_names
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Add affiliate_name column to deals table
ALTER TABLE public.deals
ADD COLUMN affiliate_name TEXT;

-- Create index for faster lookups
CREATE INDEX idx_affiliate_names_name ON public.affiliate_names(name);