-- Add campaign column to deals table
ALTER TABLE public.deals
ADD COLUMN campaign text;