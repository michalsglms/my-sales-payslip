-- Add campaign column to deals table for affiliate name
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS campaign text;