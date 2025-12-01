-- Add approved column to deals table
ALTER TABLE public.deals 
ADD COLUMN approved boolean NOT NULL DEFAULT false;