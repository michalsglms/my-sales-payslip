-- Add client name and phone fields to deals table
ALTER TABLE public.deals
ADD COLUMN client_name TEXT,
ADD COLUMN client_phone TEXT;