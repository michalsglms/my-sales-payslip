-- Add cfd_target_amount column to monthly_targets
ALTER TABLE public.monthly_targets 
ADD COLUMN cfd_target_amount numeric;

-- Rename target_amount to general_target_amount for clarity
ALTER TABLE public.monthly_targets 
RENAME COLUMN target_amount TO general_target_amount;

-- Add cfd_target_amount column to quarterly_targets
ALTER TABLE public.quarterly_targets 
ADD COLUMN cfd_target_amount numeric;

-- Rename target_amount to general_target_amount for clarity
ALTER TABLE public.quarterly_targets 
RENAME COLUMN target_amount TO general_target_amount;