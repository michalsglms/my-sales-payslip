-- Add workdays_in_period column to monthly_targets
ALTER TABLE public.monthly_targets 
ADD COLUMN workdays_in_period integer;

-- Add workdays_in_period column to quarterly_targets
ALTER TABLE public.quarterly_targets 
ADD COLUMN workdays_in_period integer;