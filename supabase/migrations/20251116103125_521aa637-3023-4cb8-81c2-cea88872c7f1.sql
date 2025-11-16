-- Create table to track last sync timestamps for each table
CREATE TABLE public.sync_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name text NOT NULL UNIQUE,
  last_synced_at timestamp with time zone NOT NULL DEFAULT now(),
  last_sync_status text,
  records_synced integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sync_log ENABLE ROW LEVEL SECURITY;

-- Only admins can manage sync logs
CREATE POLICY "Only admins can view sync logs"
  ON public.sync_log
  FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Only admins can update sync logs"
  ON public.sync_log
  FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "Only admins can insert sync logs"
  ON public.sync_log
  FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_sync_log_updated_at
  BEFORE UPDATE ON public.sync_log
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Initialize sync log entries for all tables
INSERT INTO public.sync_log (table_name, last_synced_at, last_sync_status) VALUES
  ('deals', '2000-01-01 00:00:00+00', 'pending'),
  ('monthly_targets', '2000-01-01 00:00:00+00', 'pending'),
  ('quarterly_targets', '2000-01-01 00:00:00+00', 'pending'),
  ('monthly_kpis', '2000-01-01 00:00:00+00', 'pending'),
  ('profiles', '2000-01-01 00:00:00+00', 'pending'),
  ('user_roles', '2000-01-01 00:00:00+00', 'pending'),
  ('affiliate_names', '2000-01-01 00:00:00+00', 'pending');